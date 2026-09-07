"""
app/routes/debate_agentic.py — POST /debate/agentic.

Runs a real turn-taking debate through app.agents.agentic_debate. Opt-in only:
the free-tier stays on the sequential debate_graph. This endpoint:

  1. Uses the caller's BYO key (same key resolution as report_chat).
  2. Fetches web docs via the existing search_web pipeline.
  3. Runs the state machine (assert -> rebut -> defend -> resolve, per point).
  4. Judges with the WEAK-tier model (or the user's per-provider override)
     against the resolved point ledger.
  5. Returns a payload the frontend Replay scrubber can render turn by turn.

Response contract matches the PolynousDebateReport's `props.result` shape so
the existing report renders it without changes; the new `points` + `history`
+ `clash_ledger` fields power the retrofitted ledger view.
"""
import logging
import time
from typing import Optional

from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.utils.sanitizer import sanitize_query, is_safe_input
from app.utils.encryption import decrypt_api_key
from app.llm_providers import LLM_PROVIDERS, resolve_advocate_model
from app.routes.auth import decode_token

router = APIRouter()
logger = logging.getLogger(__name__)


def _resolve_user_key_and_provider(request: Request, db: Session, provider_override: Optional[str] = None):
    """Same key-resolution idiom as report_chat, with an optional explicit
    provider override so the caller can force which key to use."""
    user, provider, api_key = None, "anthropic", None
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return user, provider, api_key
    try:
        payload = decode_token(auth.replace("Bearer ", ""), expected_type="access")
        user = db.query(User).filter(User.id == int(payload.get("sub", 0))).first()
        if not user:
            return user, provider, api_key
        preferred = (provider_override or getattr(user, "preferred_provider", "anthropic") or "anthropic").lower()
        for p in [preferred] + [x for x in LLM_PROVIDERS if x != preferred]:
            enc = getattr(user, f"{p}_api_key", None)
            if enc:
                dec = decrypt_api_key(enc, user.encryption_key)
                if dec:
                    provider, api_key = p, dec
                    break
    except Exception:
        pass
    return user, provider, api_key


@router.post("/debate/agentic")
async def run_agentic(request: Request, db: Session = Depends(get_db)):
    """Body: { topic: str, max_rounds?: int, max_turns?: int,
               provider?: str, model?: str }
    """
    body = await request.json()
    topic = (body.get("topic") or body.get("query") or "").strip()
    if not topic or not is_safe_input(topic):
        raise HTTPException(400, "Invalid or empty topic.")
    topic = sanitize_query(topic)
    max_rounds = min(4, max(1, int(body.get("max_rounds") or 3)))
    max_turns = min(24, max(5, int(body.get("max_turns") or 20)))
    provider_override = (body.get("provider") or None)

    user, provider, api_key = _resolve_user_key_and_provider(request, db, provider_override)
    if user is None:
        raise HTTPException(401, "Sign in to run an agentic debate.")
    if not api_key:
        raise HTTPException(400, "No API key configured for your account. Add one in Settings first.")

    # Resolve advocate model: explicit body override -> user preference -> STRONG default.
    advocate_model = (body.get("model") or "").strip() or None
    if not advocate_model:
        try:
            advocate_model = resolve_advocate_model(user, provider)
        except Exception:
            advocate_model = None

    # Fetch sources — same pipeline the sequential debate uses.
    docs = []
    try:
        from app.search_agent import search_web
        docs = search_web(topic, max_results=int(body.get("max_results") or 8)) or []
    except Exception as e:
        logger.warning("Search failed for agentic debate: %s", e)

    docs_text = "\n\n".join(
        f"[{i + 1}] {d.get('title', 'Untitled')}\n{(d.get('content') or '')[:800]}"
        for i, d in enumerate(docs[:12])
    ) or "(no web sources were retrieved; argue from prior knowledge but do not fabricate citations.)"

    telemetry = {
        "started_at": time.time(),
        "usage_sink": {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0, "estimated_cost": 0.0, "steps": []},
    }

    # Run the state machine.
    from app.agents.agentic_debate import run_agentic_debate
    try:
        result = run_agentic_debate(
            topic=topic, docs_text=docs_text, user=user,
            provider=provider, api_key=api_key,
            advocate_model=advocate_model,
            total_sources=len(docs),
            usage_sink=telemetry["usage_sink"],
            emit=lambda msg: logger.info("[agentic] %s", msg),
            max_rounds=max_rounds, max_turns=max_turns,
        )
    except Exception as e:
        logger.exception("Agentic debate failed")
        raise HTTPException(502, f"Agentic debate failed: {e}")

    # Persist a debate summary row (best-effort; not fatal if it fails).
    try:
        from app.services.memory_write import save_debate  # optional dep in some builds
        save_debate(
            session_id=(getattr(user, "public_id", None) or "guest"),
            topic=topic,
            for_score=result["verdict"]["for_score"],
            against_score=result["verdict"]["against_score"],
            winner=result["verdict"]["winner"],
        )
    except Exception:
        pass

    elapsed = round(time.time() - telemetry["started_at"], 2)

    # Return shape the FE report already renders. `mode` + `points` + `history`
    # + `clash_ledger` are the new fields the Replay scrubber ledger view keys on.
    return {
        "mode": "agentic",
        "activeTopic": topic,
        "topic": topic,
        "result": {
            "mode": "agentic",
            "verdict": result["verdict"],
            "points": result["points"],
            "history": result["history"],
            "clash_ledger": result["clash_ledger"],
            "labels": result["labels"],
            "advocate_model": result["advocate_model"],
            "judge_model": result["judge_model"],
            "judge_provider": result["judge_provider"],
            "blind_ab": True,
            # Legacy fields the sequential report expects, filled in
            # sensibly so the existing sMast/sVerdict still render.
            "for_points": [p["claim"] for p in result["points"] if result["labels"]["A"] == "FOR" and p["author"] == "A"]
                         + [p["claim"] for p in result["points"] if result["labels"]["B"] == "FOR" and p["author"] == "B"],
            "against_points": [p["claim"] for p in result["points"] if result["labels"]["A"] == "AGAINST" and p["author"] == "A"]
                             + [p["claim"] for p in result["points"] if result["labels"]["B"] == "AGAINST" and p["author"] == "B"],
            "for_opening": "",
            "against_opening": "",
            "for_rebuttal": "",
            "against_rebuttal": "",
            "citations": [{"n": i + 1, "title": d.get("title"), "url": d.get("url", "")} for i, d in enumerate(docs[:12])],
            "telemetry": {
                "elapsed_seconds": elapsed,
                "total_tokens": telemetry["usage_sink"].get("total_tokens"),
                "estimated_cost": {"usd": telemetry["usage_sink"].get("estimated_cost")},
                "providers": [{"model": result["advocate_model"]}, {"model": result["judge_model"]}],
                "steps": telemetry["usage_sink"].get("steps") or [],
            },
        },
    }
