"""
app/routes/kg_actions.py — grounded actions on the Knowledge Graph.

Three BYO-key endpoints and one deterministic fallback:

- POST /knowledge/why-connected      One-sentence explanation of an edge.
- POST /knowledge/summarize-cluster  3-5 sentence read of a community.
- POST /knowledge/explain-path       Explain each hop of a pathfinder result.
- GET  /knowledge/tfidf-labels       Instant TF-IDF labels for every community
                                     (works without an LLM key, safe fallback
                                     until /community-labels finishes).

Reuses `report_chat._resolve_user_key` so provider selection and key handling
match the rest of the app; no new web fetches.
"""
import json
import math
import re
from collections import Counter, defaultdict

from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.knowledge_graph.graph_manager import kg
from app.routes.report_chat import _resolve_user_key
from app.routes.report_actions import _call_llm, _require_key
from app.routes.knowledge import get_current_user

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


# ------------------------------------------------------------------ helpers
_STOP = set("""a an the of in on at to for with from by as is are was were be been being and or but not
if then than that this these those it its it's i you your we our their there here
about into over under out up down more most less many much some any all no yes very just also can may
which who whom whose what when where why how do does did done doing has have had having
research report study studies paper papers article articles source sources based via using""".split())


def _tokenize(text: str):
    return [w for w in re.findall(r"[A-Za-z][A-Za-z0-9\-]{1,}", str(text or "").lower())
            if w not in _STOP and len(w) > 2]


@router.get("/tfidf-labels")
async def tfidf_labels(request: Request):
    """Deterministic, instant community labels from node/edge labels.

    Returns {"labels": {community_id: {"label": "term · term · term",
                                        "concepts": [...], "size": n}}}
    Never blocks and works offline; the LLM /community-labels endpoint can
    upgrade these later with richer wording.
    """
    user_id = get_current_user(request)
    try:
        graph = kg.get_user_knowledge_graph(user_id=user_id) or {}
    except Exception:
        return {"labels": {}}
    nodes = graph.get("nodes") or []
    edges = graph.get("edges") or []

    # Compute Louvain communities on the fly if node metrics carry them, else
    # fall back to type-based grouping so we always return SOMETHING useful.
    node_community = {}
    for n in nodes:
        c = n.get("community")
        if c is None and isinstance(n.get("metrics"), dict):
            c = n["metrics"].get("community")
        if c is None:
            c = n.get("type") or "misc"
        node_community[str(n.get("id") or n.get("label"))] = c

    # Bucket node labels by community.
    bucket = defaultdict(list)
    for n in nodes:
        nid = str(n.get("id") or n.get("label"))
        c = node_community.get(nid)
        if c is None:
            continue
        text = " ".join(str(n.get(k) or "") for k in ("label", "title", "summary", "description"))
        bucket[c].append(text)

    # Precompute document frequency across communities for TF-IDF.
    doc_terms = {c: Counter(sum((_tokenize(t) for t in texts), [])) for c, texts in bucket.items()}
    N = max(1, len(doc_terms))
    df = Counter()
    for c, cnt in doc_terms.items():
        for term in cnt:
            df[term] += 1

    out = {}
    for c, cnt in doc_terms.items():
        if not cnt:
            continue
        scores = {}
        total = sum(cnt.values()) or 1
        for term, tf in cnt.items():
            idf = math.log((N + 1) / (1 + df[term])) + 1
            scores[term] = (tf / total) * idf
        top = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)[:3]
        concepts = [t for t, _ in top]
        label = " · ".join(w.title() for w in concepts) if concepts else f"Cluster {c}"
        out[str(c)] = {"label": label, "concepts": concepts, "size": len(bucket[c])}
    return {"labels": out}


# ------------------------------------------------------------------ LLM actions
def _load_context_for_nodes(user_id: str, node_labels):
    """Pull short summaries for a set of node labels from the KG store, so LLM
    answers stay grounded in the user's own material."""
    ctx = []
    try:
        graph = kg.get_user_knowledge_graph(user_id=user_id) or {}
    except Exception:
        graph = {}
    nodes = {str(n.get("label") or n.get("id")): n for n in (graph.get("nodes") or [])}
    for lbl in node_labels[:12]:
        n = nodes.get(str(lbl))
        if not n:
            continue
        s = n.get("summary") or n.get("description") or ""
        ctx.append(f"- {lbl}: {str(s)[:400]}")
    return "\n".join(ctx) or "(no cached summaries for these nodes)"


@router.post("/why-connected")
async def why_connected(request: Request, db: Session = Depends(get_db)):
    """Explain in one sentence why two nodes share an edge."""
    body = await request.json()
    a = str(body.get("a") or "").strip()
    b = str(body.get("b") or "").strip()
    edge_type = str(body.get("edge_type") or "").strip()
    if not a or not b:
        raise HTTPException(400, "a and b are required")

    user, provider, api_key = _resolve_user_key(request, db)
    _require_key(user, api_key)
    user_id = get_current_user(request)

    ctx = _load_context_for_nodes(user_id, [a, b])
    system = (
        "You explain a single edge in a personal knowledge graph. Answer in ONE "
        "sentence (<= 32 words) plus a JSON object. Return ONLY raw JSON with keys "
        "\"why\" (the sentence) and \"strength\" (\"strong\" | \"tentative\" | \"weak\"). "
        "Use only the material below; if it does not support a connection, say so plainly.\n\n"
        f"NODES IN THE USER'S GRAPH:\n{ctx}"
    )
    prompt = f"Why are '{a}' and '{b}' connected" + (f" (edge type: {edge_type})" if edge_type else "") + "?"
    try:
        raw = _call_llm(user, provider, api_key, system, prompt, max_tokens=200, temperature=0.3)
    except Exception as e:
        raise HTTPException(502, f"Why-connected failed: {e}")

    out = {"why": (raw or "")[:400], "strength": "tentative"}
    try:
        m = re.search(r"\{.*\}", raw or "", re.DOTALL)
        parsed = json.loads(m.group(0)) if m else {}
        out["why"] = str(parsed.get("why", ""))[:400]
        s = str(parsed.get("strength", "tentative")).lower()
        out["strength"] = s if s in ("strong", "tentative", "weak") else "tentative"
    except Exception:
        pass
    return {"result": out, "provider": provider}


@router.post("/summarize-cluster")
async def summarize_cluster(request: Request, db: Session = Depends(get_db)):
    """Write a 3-5 sentence read of a community using its member nodes."""
    body = await request.json()
    members = [str(x).strip() for x in (body.get("members") or []) if str(x).strip()]
    label = str(body.get("label") or "").strip()
    if not members:
        raise HTTPException(400, "members are required")

    user, provider, api_key = _resolve_user_key(request, db)
    _require_key(user, api_key)
    user_id = get_current_user(request)

    ctx = _load_context_for_nodes(user_id, members)
    system = (
        "You summarise a cluster of concepts inside a personal knowledge graph. "
        "Return ONLY raw JSON with keys \"headline\" (5-9 words, no punctuation), "
        "\"summary\" (3-5 sentences describing what this cluster is really about, "
        "grounded in the provided nodes), and \"open_question\" (one question the "
        "user should probably explore next).\n\n"
        f"CLUSTER MEMBERS:\n{ctx}"
    )
    prompt = f"Summarise this cluster" + (f" (working label: {label})" if label else "") + "."
    try:
        raw = _call_llm(user, provider, api_key, system, prompt, max_tokens=500, temperature=0.35)
    except Exception as e:
        raise HTTPException(502, f"Summarise-cluster failed: {e}")

    out = {"headline": label or "This cluster", "summary": "", "open_question": ""}
    try:
        m = re.search(r"\{.*\}", raw or "", re.DOTALL)
        parsed = json.loads(m.group(0)) if m else {}
        out["headline"] = str(parsed.get("headline", ""))[:120] or out["headline"]
        out["summary"] = str(parsed.get("summary", ""))[:1200]
        out["open_question"] = str(parsed.get("open_question", ""))[:280]
    except Exception:
        out["summary"] = (raw or "")[:1200]
    return {"result": out, "provider": provider}


@router.post("/explain-path")
async def explain_path(request: Request, db: Session = Depends(get_db)):
    """Explain what each hop of a path represents."""
    body = await request.json()
    path = [str(x).strip() for x in (body.get("path") or []) if str(x).strip()]
    if len(path) < 2:
        raise HTTPException(400, "path must contain at least 2 nodes")

    user, provider, api_key = _resolve_user_key(request, db)
    _require_key(user, api_key)
    user_id = get_current_user(request)

    ctx = _load_context_for_nodes(user_id, path)
    system = (
        "You explain a shortest path through a personal knowledge graph. Return "
        "ONLY raw JSON: {\"steps\": [{\"from\":\"...\",\"to\":\"...\",\"why\":\"...\"}], "
        "\"insight\": \"one sentence on the overall bridge these hops form\"}. "
        "Each step's \"why\" must be <= 22 words. Ground every step in the material "
        "below; if a hop is speculative, mark it (\"likely\", \"possibly\").\n\n"
        f"NODES:\n{ctx}"
    )
    prompt = "Path: " + " -> ".join(path)
    try:
        raw = _call_llm(user, provider, api_key, system, prompt, max_tokens=700, temperature=0.35)
    except Exception as e:
        raise HTTPException(502, f"Explain-path failed: {e}")

    out = {"steps": [], "insight": ""}
    try:
        m = re.search(r"\{.*\}", raw or "", re.DOTALL)
        parsed = json.loads(m.group(0)) if m else {}
        steps = parsed.get("steps") or []
        out["steps"] = [
            {"from": str(s.get("from", ""))[:120],
             "to":   str(s.get("to", ""))[:120],
             "why":  str(s.get("why", ""))[:300]}
            for s in steps if isinstance(s, dict)
        ][:8]
        out["insight"] = str(parsed.get("insight", ""))[:400]
    except Exception:
        out["insight"] = (raw or "")[:400]
    return {"result": out, "provider": provider}
