"""
app/agents/agentic_debate.py — real turn-taking, point-by-point debate.

Not two essays + a review. Every turn is a small, targeted LLM call that reads
ONLY the point it is acting on. A tiny state machine drives the flow:

    ASSERT (A opens P1) -> REBUT (B rebuts P1) -> DEFEND (A defends OR concedes)
      -> if defended, another REBUT until turn cap on this point
      -> point closes as DEFENDED / CONCEDED / UNRESOLVED
      -> next side opens the next point
      -> after MAX_ROUNDS or MAX_TURNS -> JUDGE (point-ledger)

The judge scores OUTCOMES from the resolved ledger, not vibes:
    +1 to whoever's point was DEFENDED
    +1 to whoever's CHALLENGE forced a concession
    0 for UNRESOLVED points, but counted against "did not close"
    plus a small evidence-quality and steelman bonus.

Guardrails are non-negotiable:
    MAX_ROUNDS      3   opening points per side per debate
    MAX_TURNS       20  hard cap
    MAX_EXCHANGE    4   defend/rebut cycles on one point before force-UNRESOLVED
    schema failure  -> skip turn, do NOT retry silently (retry once with a
                       corrective message; on second failure, close the point)

Shape is faithful to what the FE (Replay scrubber) will render.
"""
from __future__ import annotations

import json
import logging
import random
import re
from typing import Any, Callable, Optional

from app.agents.debate_agents import (
    _get_client, _call_with_retry, compute_argument_rubric,
)
from app.llm_providers import resolve_judge_model, weak_model
from app.utils.json_extract import extract_json_object

logger = logging.getLogger(__name__)


# --------------------------------------------------------------------------- config
MAX_ROUNDS = 3
MAX_TURNS = 20
MAX_EXCHANGE_PER_POINT = 4  # after this many back-and-forths, force UNRESOLVED
DEFAULT_MODEL_TEMP = 0.55
TURN_MAX_TOKENS = 260
JUDGE_MAX_TOKENS = 900


# --------------------------------------------------------------------------- prompts
_ASSERT_SYSTEM = (
    "You are advocate {side} in a live debate on: \"{topic}\".\n\n"
    "Rules:\n"
    "- Pick your NEXT strongest untouched claim.\n"
    "- Do NOT repeat claims you have already argued.\n"
    "- Do NOT concede claims your opponent has NOT yet raised.\n"
    "- Cite fetched sources by index [n] when they support the claim.\n\n"
    "Return ONLY raw JSON with keys:\n"
    "  \"claim\": string  (<= 55 words)\n"
    "  \"cites\": [int, ...]\n"
    "  \"reasoning\": string  (one line, why this claim matters)\n"
)

_REBUT_SYSTEM = (
    "You are advocate {side} in a live debate on: \"{topic}\".\n"
    "Your opponent just claimed:\n  \"{claim}\"\n  cites: {cites}\n\n"
    "Attack THIS specific claim. Do not open a new topic. Pick the strongest attack mode:\n"
    "  evidence   contradict with a fetched source\n"
    "  source     challenge the source's authority or freshness\n"
    "  logic      expose a reasoning gap or fallacy\n"
    "  scope      show the claim fails at scale/timeframe/geography\n\n"
    "Return ONLY raw JSON:\n"
    "  \"rebuttal\": string  (<= 55 words)\n"
    "  \"attack_mode\": \"evidence\"|\"source\"|\"logic\"|\"scope\"\n"
    "  \"cites\": [int, ...]\n"
)

_DEFEND_SYSTEM = (
    "You are advocate {side} in a live debate on: \"{topic}\".\n"
    "Your original claim was:\n  \"{claim}\"\n\n"
    "Your opponent rebutted it via {attack_mode}:\n  \"{rebuttal}\"\n\n"
    "You have two honest options:\n"
    "  DEFEND    strengthen the claim, refute the attack mode, or narrow the claim.\n"
    "  CONCEDE   acknowledge the rebuttal is decisive.\n\n"
    "You MUST concede if the rebuttal has direct source support you cannot answer.\n"
    "Do not defend for the sake of defending. Do not restate the claim without new content.\n\n"
    "Return ONLY raw JSON:\n"
    "  \"action\": \"defend\"|\"concede\"\n"
    "  \"text\": string  (<= 55 words)\n"
    "  \"cites\": [int, ...]\n"
    "  \"narrowed_claim\": string|null  (only when action=defend and you narrowed)\n"
)

_JUDGE_SYSTEM = (
    "You are a neutral judge scoring a live debate between two anonymous teams "
    "(Team A and Team B). Both teams have already argued point-by-point; you see "
    "the resolved ledger: who raised each point, who rebutted it, whether it was "
    "DEFENDED, CONCEDED, or UNRESOLVED, and the evidence cited on each side.\n\n"
    "Score OUTCOMES, not vibes:\n"
    "  +1 to the point's AUTHOR when it was DEFENDED\n"
    "  +1 to the CHALLENGER when the author CONCEDED\n"
    "  0 for UNRESOLVED (counts against 'did not close')\n"
    "  + 0-2 evidence quality per point per side (real fetched citations only)\n"
    "  + 0-2 steelman quality (strongest form of each side's overall case)\n\n"
    "You must NOT use the labels FOR or AGAINST anywhere. You do not know which\n"
    "team argued which side. Ground every score in specific point ids.\n\n"
    "Return ONLY raw JSON with keys:\n"
    "  \"team_a_quality\": number 0-10, blend of outcomes + evidence + steelman\n"
    "  \"team_b_quality\": number 0-10\n"
    "  \"per_point\": [{ \"id\": str, \"outcome\": \"defended\"|\"conceded\"|\"unresolved\","
    " \"winner\": \"A\"|\"B\"|\"tie\", \"evidence_quality\": {\"a\": 0-2, \"b\": 0-2}, \"why\": str }]\n"
    "  \"steelman\": { \"a\": str, \"b\": str }\n"
    "  \"reasoning\": string  (2-3 sentences, tied to point ids)\n"
    "  \"strongest_point\": string\n"
    "  \"certainty\": integer 0-100\n"
    "  \"follow_up_questions\": [string, string, string]\n"
)


# --------------------------------------------------------------------------- helpers
def _mint_point_id(state: dict) -> str:
    n = 1 + len(state.get("points", []))
    return f"P{n}"


def _flip(side: str) -> str:
    return "B" if side == "A" else "A"


def _author_of(point: dict) -> str:
    return point.get("author", "A")


def _last_exchange_side(point: dict) -> str:
    ex = point.get("exchange") or []
    return ex[-1]["side"] if ex else _author_of(point)


def _defensive_call(client, client_type, system, user, provider, model, usage):
    """One LLM call, one corrective retry on parse failure, then give up."""
    raw = _call_with_retry(
        client, client_type, system, user,
        TURN_MAX_TOKENS, DEFAULT_MODEL_TEMP,
        model=model, usage=usage, stage="agentic-turn", provider=provider,
    )
    data = extract_json_object(raw)
    if not isinstance(data, dict):
        raw = _call_with_retry(
            client, client_type, system,
            user + "\n\nIMPORTANT: your previous reply was not valid JSON. "
            "Respond again with ONLY the raw JSON object, first char '{', last '}'.",
            TURN_MAX_TOKENS, DEFAULT_MODEL_TEMP,
            model=model, usage=usage, stage="agentic-turn-retry", provider=provider,
        )
        data = extract_json_object(raw)
    return data if isinstance(data, dict) else None


# --------------------------------------------------------------------------- state machine
def next_action(state: dict) -> tuple[str, Optional[str], Optional[str]]:
    """Return (verb, side, point_id).

    Priority:
      1. Any point in the "rebutted" state where the AUTHOR owes a defense.
      2. Any point in the "open" state where the OPPONENT owes a rebuttal.
      3. If the round budget allows, open a new point by the next side.
      4. Otherwise, judge.
    """
    budget = state.get("budget", {})
    if budget.get("turns_used", 0) >= budget.get("cap", MAX_TURNS):
        return ("judge", None, None)

    for p in state.get("points", []):
        if p["status"] == "rebutted" and _last_exchange_side(p) != _author_of(p):
            return ("defend", _author_of(p), p["id"])

    for p in state.get("points", []):
        if p["status"] == "open" and _last_exchange_side(p) == _author_of(p):
            return ("rebut", _flip(_author_of(p)), p["id"])

    if state.get("round", 0) < MAX_ROUNDS:
        # A opens odd-numbered rounds, B opens even. So each side opens roughly
        # the same number of points across a debate.
        return ("assert", "A" if state["round"] % 2 == 0 else "B", None)

    return ("judge", None, None)


# --------------------------------------------------------------------------- point ops
def _assert_point(state, side, client, client_type, provider, model, usage, topic, docs):
    prior = [p["claim"] for p in state["points"] if p["author"] == side]
    conceded = [p["claim"] for p in state["points"] if p["author"] == side and p["status"] == "conceded"]
    system = _ASSERT_SYSTEM.format(side=side, topic=topic)
    user = (
        f"Your prior points on this debate: {prior[-3:] if prior else 'none'}\n"
        f"Points you have already conceded: {conceded[-3:] if conceded else 'none'}\n"
        f"Fetched sources you may cite:\n{docs[:2200]}\n\n"
        "Pick your NEXT claim now."
    )
    data = _defensive_call(client, client_type, system, user, provider, model, usage)
    if not data or not data.get("claim"):
        return None
    pid = _mint_point_id(state)
    point = {
        "id": pid,
        "author": side,
        "claim": str(data.get("claim", ""))[:400],
        "cites": [int(x) for x in (data.get("cites") or []) if str(x).isdigit()][:8],
        "reasoning": str(data.get("reasoning", ""))[:280],
        "status": "open",
        "exchange": [{
            "turn": state["budget"]["turns_used"] + 1,
            "side": side,
            "phase": "assert",
            "text": str(data.get("claim", ""))[:400],
            "cites": [int(x) for x in (data.get("cites") or []) if str(x).isdigit()][:8],
        }],
    }
    state["points"].append(point)
    _append_history(state, point["exchange"][-1], pid)
    return point


def _rebut_point(state, side, point_id, client, client_type, provider, model, usage, topic, docs):
    p = next((x for x in state["points"] if x["id"] == point_id), None)
    if not p:
        return None
    system = _REBUT_SYSTEM.format(side=side, topic=topic, claim=p["claim"], cites=p["cites"])
    user = (
        f"Fetched sources you may cite:\n{docs[:2200]}\n\n"
        "Rebut now. Do not open a new topic."
    )
    data = _defensive_call(client, client_type, system, user, provider, model, usage)
    if not data or not data.get("rebuttal"):
        p["status"] = "unresolved"
        return None
    turn = {
        "turn": state["budget"]["turns_used"] + 1,
        "side": side,
        "phase": "rebut",
        "text": str(data.get("rebuttal", ""))[:400],
        "cites": [int(x) for x in (data.get("cites") or []) if str(x).isdigit()][:8],
        "attack_mode": str(data.get("attack_mode", "logic")).lower(),
    }
    if turn["attack_mode"] not in ("evidence", "source", "logic", "scope"):
        turn["attack_mode"] = "logic"
    p["exchange"].append(turn)
    p["status"] = "rebutted"
    _append_history(state, turn, point_id)
    return turn


def _defend_or_concede(state, side, point_id, client, client_type, provider, model, usage, topic, docs):
    p = next((x for x in state["points"] if x["id"] == point_id), None)
    if not p:
        return None
    if len([t for t in p["exchange"] if t["phase"] in ("defend", "rebut")]) >= MAX_EXCHANGE_PER_POINT:
        p["status"] = "unresolved"
        return None
    rebut = next((t for t in reversed(p["exchange"]) if t["phase"] == "rebut"), None)
    if not rebut:
        p["status"] = "unresolved"
        return None
    system = _DEFEND_SYSTEM.format(
        side=side, topic=topic, claim=p["claim"],
        attack_mode=rebut.get("attack_mode", "logic"),
        rebuttal=rebut["text"],
    )
    user = (
        f"Fetched sources you may cite:\n{docs[:2200]}\n\n"
        "Choose defend or concede honestly. Concede if the rebuttal decisively answers you."
    )
    data = _defensive_call(client, client_type, system, user, provider, model, usage)
    if not data or not data.get("text"):
        p["status"] = "unresolved"
        return None
    action = str(data.get("action", "defend")).lower()
    turn = {
        "turn": state["budget"]["turns_used"] + 1,
        "side": side,
        "phase": "concede" if action == "concede" else "defend",
        "text": str(data.get("text", ""))[:400],
        "cites": [int(x) for x in (data.get("cites") or []) if str(x).isdigit()][:8],
    }
    if action == "defend" and data.get("narrowed_claim"):
        turn["narrowed_claim"] = str(data["narrowed_claim"])[:300]
    p["exchange"].append(turn)
    _append_history(state, turn, point_id)
    if action == "concede":
        p["status"] = "conceded"
    else:
        # Point re-opens for the opponent's counter-rebuttal (bounded by MAX_EXCHANGE_PER_POINT).
        p["status"] = "open"
    return turn


def _append_history(state, turn, point_id):
    hist = state.setdefault("history", [])
    hist.append({**turn, "point_id": point_id})
    state["budget"]["turns_used"] = state["budget"].get("turns_used", 0) + 1


def _finalise_ledger(state):
    """Every point that is still 'open' or 'rebutted' when we hit the round cap
    is closed as UNRESOLVED. Then we roll the objective clash_ledger."""
    for p in state["points"]:
        if p["status"] in ("open", "rebutted"):
            p["status"] = "unresolved"
    a_def = sum(1 for p in state["points"] if p["author"] == "A" and p["status"] == "defended")
    a_con = sum(1 for p in state["points"] if p["author"] == "A" and p["status"] == "conceded")
    b_def = sum(1 for p in state["points"] if p["author"] == "B" and p["status"] == "defended")
    b_con = sum(1 for p in state["points"] if p["author"] == "B" and p["status"] == "conceded")
    unresolved = sum(1 for p in state["points"] if p["status"] == "unresolved")
    state["clash_ledger"] = {
        # points DEFENDED are wins for the AUTHOR; points CONCEDED are wins
        # for the CHALLENGER (the flipped side).
        "A_defended": a_def,
        "A_conceded_wins_for_B": a_con,
        "B_defended": b_def,
        "B_conceded_wins_for_A": b_con,
        "unresolved": unresolved,
    }
    # ledger points per SIDE (author points defended + rebuttals that landed)
    state["clash_ledger"]["A_ledger_points"] = a_def + b_con
    state["clash_ledger"]["B_ledger_points"] = b_def + a_con


# --------------------------------------------------------------------------- point-ledger judge
def point_ledger_judge(state: dict, provider: str, api_key: str,
                       judge_model: str,
                       total_sources: int,
                       usage_sink: Optional[dict] = None) -> dict:
    """Score the resolved ledger with a different (smaller) model on the same key.
    The judge sees blind A/B (labels are already randomised by the caller)."""
    ledger = state.get("clash_ledger") or {}
    points_view = []
    for p in state.get("points", []):
        points_view.append({
            "id": p["id"],
            "raised_by": p["author"],
            "claim": p["claim"][:180],
            "status": p["status"],
            "exchange": [
                {"side": t["side"], "phase": t["phase"], "text": t["text"][:180],
                 "cites": t.get("cites", []), "attack_mode": t.get("attack_mode")}
                for t in p["exchange"]
            ],
        })

    system = _JUDGE_SYSTEM
    user = (
        f"Topic: {state.get('topic', '')}\n\n"
        f"RESOLVED LEDGER (objective outcomes):\n{json.dumps(ledger, indent=2)}\n\n"
        f"POINTS (chronological):\n{json.dumps(points_view, indent=2)[:5500]}\n\n"
        "Return only the JSON described in the system prompt."
    )

    client, client_type = _get_client(provider, api_key)
    raw = _call_with_retry(client, client_type, system, user,
                           JUDGE_MAX_TOKENS, 0.3,
                           model=judge_model,
                           usage=usage_sink, stage="agentic-judge",
                           provider=provider)
    llm = extract_json_object(raw)
    if not isinstance(llm, dict):
        raw = _call_with_retry(client, client_type, system,
                               user + "\n\nRespond again with ONLY raw JSON.",
                               JUDGE_MAX_TOKENS, 0.3, model=judge_model,
                               usage=usage_sink, stage="agentic-judge-retry",
                               provider=provider)
        llm = extract_json_object(raw)
    if not isinstance(llm, dict):
        # Honest degraded verdict: mechanical outcomes only.
        a_pts = ledger.get("A_ledger_points", 0)
        b_pts = ledger.get("B_ledger_points", 0)
        return _mechanical_verdict(ledger, a_pts, b_pts, judge_model)
    # Blend quality with mechanical ledger for a real "outcomes-first" score.
    a_q = float(llm.get("team_a_quality", 0) or 0)
    b_q = float(llm.get("team_b_quality", 0) or 0)
    a_pts = ledger.get("A_ledger_points", 0)
    b_pts = ledger.get("B_ledger_points", 0)
    # ledger contributes 6/10 of the final score, LLM quality contributes 4/10.
    a_score = round(min(10.0, a_pts * 1.5 + a_q * 0.4), 1)
    b_score = round(min(10.0, b_pts * 1.5 + b_q * 0.4), 1)
    winner = "A" if a_score > b_score else ("B" if b_score > a_score else "TIE")
    return {
        "team_a_score": a_score,
        "team_b_score": b_score,
        "team_a_quality": a_q,
        "team_b_quality": b_q,
        "winner_ab": winner,
        "per_point": llm.get("per_point") or [],
        "steelman": llm.get("steelman") or {},
        "reasoning": str(llm.get("reasoning", ""))[:900],
        "strongest_point": str(llm.get("strongest_point", ""))[:400],
        "certainty": max(0, min(100, int(llm.get("certainty", 60) or 60))),
        "follow_up_questions": [q for q in (llm.get("follow_up_questions") or []) if isinstance(q, str)][:4],
        "scoring": "60% ledger outcomes + 40% LLM quality (blind A/B)",
        "judge_model": judge_model,
        "judge_provider": provider,
        "blind_ab": True,
    }


def _mechanical_verdict(ledger, a_pts, b_pts, judge_model):
    winner = "A" if a_pts > b_pts else ("B" if b_pts > a_pts else "TIE")
    return {
        "team_a_score": round(min(10.0, a_pts * 1.5), 1),
        "team_b_score": round(min(10.0, b_pts * 1.5), 1),
        "team_a_quality": 0.0,
        "team_b_quality": 0.0,
        "winner_ab": winner,
        "per_point": [],
        "steelman": {},
        "reasoning": f"Judge LLM could not score; mechanical ledger only. "
                     f"A: {ledger.get('A_defended', 0)} defended, "
                     f"{ledger.get('A_conceded_wins_for_B', 0)} conceded; "
                     f"B: {ledger.get('B_defended', 0)} defended, "
                     f"{ledger.get('B_conceded_wins_for_A', 0)} conceded; "
                     f"{ledger.get('unresolved', 0)} unresolved.",
        "strongest_point": "",
        "certainty": 40,
        "follow_up_questions": [],
        "scoring": "mechanical ledger only (judge LLM failed)",
        "judge_model": judge_model,
        "judge_provider": "",
        "blind_ab": True,
        "parse_failed": True,
    }


# --------------------------------------------------------------------------- top-level runner
def run_agentic_debate(topic: str,
                       docs_text: str,
                       user,
                       provider: str,
                       api_key: str,
                       advocate_model: Optional[str],
                       total_sources: int = 0,
                       usage_sink: Optional[dict] = None,
                       emit: Optional[Callable[[str], None]] = None,
                       max_rounds: int = MAX_ROUNDS,
                       max_turns: int = MAX_TURNS) -> dict:
    """Drive the whole state machine and return a verdict + full transcript.

    `docs_text` is the pre-formatted sources block (same shape argue_position uses).
    """
    emit = emit or (lambda _msg: None)

    # Randomise A/B before we say anything else, so history is entirely blind.
    a_is_for = random.random() < 0.5

    state: dict = {
        "topic": topic,
        "round": 0,
        "points": [],
        "history": [],
        "budget": {"turns_used": 0, "cap": max_turns},
        "labels": {"A": "FOR" if a_is_for else "AGAINST",
                   "B": "AGAINST" if a_is_for else "FOR"},
    }

    client, client_type = _get_client(provider, api_key)

    emit(f"Agentic debate starting: A={state['labels']['A']}, "
         f"B={state['labels']['B']} (blind), advocate model={advocate_model}, "
         f"max rounds={max_rounds}, turn cap={max_turns}.")

    while True:
        verb, side, pid = next_action(state)
        if verb == "judge":
            break

        if verb == "assert":
            # Rounds increment when a NEW top-of-round assert happens for the
            # scheduled side. This keeps the round budget honest.
            state["round"] += 1
            if state["round"] > max_rounds:
                break
            p = _assert_point(state, side, client, client_type, provider,
                              advocate_model, usage_sink, topic, docs_text)
            if p:
                emit(f"Round {state['round']}: {side} ({state['labels'][side]}) opens {p['id']} — {p['claim'][:80]}...")
            else:
                emit(f"Round {state['round']}: {side} failed to assert; skipping")
                break

        elif verb == "rebut":
            t = _rebut_point(state, side, pid, client, client_type, provider,
                             advocate_model, usage_sink, topic, docs_text)
            if t:
                emit(f"{side} rebuts {pid} via {t.get('attack_mode', 'logic')}")

        elif verb == "defend":
            t = _defend_or_concede(state, side, pid, client, client_type, provider,
                                   advocate_model, usage_sink, topic, docs_text)
            if t:
                emit(f"{side} {t['phase']}s {pid}")

        # Global turn-cap guard (belt + suspenders around the scheduler).
        if state["budget"]["turns_used"] >= max_turns:
            emit(f"Turn cap of {max_turns} hit; closing remaining points as UNRESOLVED.")
            break

    _finalise_ledger(state)

    # Judge on the smaller / different model of the same provider.
    judge_model = None
    try:
        judge_model = resolve_judge_model(user, provider)
    except Exception:
        pass
    if not judge_model or judge_model == advocate_model:
        judge_model = weak_model(provider)
    if not judge_model:
        judge_model = advocate_model

    emit(f"Judging on {judge_model} (weak tier of {provider}, blind A/B, point-ledger).")
    verdict = point_ledger_judge(state, provider=provider, api_key=api_key,
                                 judge_model=judge_model,
                                 total_sources=total_sources,
                                 usage_sink=usage_sink)

    # Remap A/B winner + scores back to FOR/AGAINST for the report layer.
    labels = state["labels"]
    winner_ab = verdict.get("winner_ab", "TIE")
    winner = "TIE" if winner_ab == "TIE" else labels[winner_ab]
    for_score = verdict["team_a_score"] if labels["A"] == "FOR" else verdict["team_b_score"]
    against_score = verdict["team_b_score"] if labels["A"] == "FOR" else verdict["team_a_score"]

    # Assemble the shape the FE report + Replay expects, plus the raw ledger
    # and transcript so the retrofitted Replay scrubber can render the point view.
    return {
        "mode": "agentic",
        "topic": topic,
        "labels": labels,
        "advocate_model": advocate_model,
        "judge_model": judge_model,
        "judge_provider": provider,
        "blind_ab": True,
        "points": state["points"],
        "history": state["history"],
        "clash_ledger": state["clash_ledger"],
        "verdict": {
            "winner": winner,
            "for_score": for_score,
            "against_score": against_score,
            "for_quality": verdict["team_a_quality"] if labels["A"] == "FOR" else verdict["team_b_quality"],
            "against_quality": verdict["team_b_quality"] if labels["A"] == "FOR" else verdict["team_a_quality"],
            "scoring": verdict["scoring"],
            "judge_model": verdict["judge_model"],
            "judge_provider": verdict["judge_provider"],
            "advocate_model": advocate_model,
            "blind_ab": True,
            "reasoning": verdict["reasoning"],
            "strongest_point": verdict["strongest_point"],
            "judge_certainty": verdict.get("certainty", 60),
            "steelman": verdict.get("steelman") or {},
            "per_point": verdict.get("per_point") or [],
            "follow_up_questions": verdict.get("follow_up_questions") or [],
            "clash_ledger": state["clash_ledger"],
            "margin": (
                "split" if winner == "TIE" else
                ("decisive" if abs(for_score - against_score) >= 3 else
                 "clear" if abs(for_score - against_score) >= 1.5 else "close")
            ),
        },
    }
