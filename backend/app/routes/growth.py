"""
app/routes/growth.py — growth loops.

Bundles the endpoints that turn each finished run into distribution and each
visitor into a potential user:

- GET  /discover                     Public gallery of recent shared reports/debates.
- POST /graph/share                  Snapshot the caller's KG as a public read-only page.
- GET  /graph/share/{share_id}       Fetch that snapshot (no auth).
- POST /import/notes                 Paste a ChatGPT/NotebookLM/plain-text export
                                     and seed the caller's KG + save an entry.
- POST /referral/register            Credit a referrer + referee on signup.
"""
import re
import secrets
from collections import Counter
from datetime import datetime

from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.misc import SharedReport
from app.routes.knowledge import get_current_user
from app.knowledge_graph.graph_manager import kg


router = APIRouter()


# ------------------------------------------------------------------ Discover
@router.get("/discover")
async def discover(kind: str = "", limit: int = 24, db: Session = Depends(get_db)):
    """Public gallery. Newest-first slice of shared reports/debates, no auth
    required; the same rows already served on /r/:id and /d/:id, listed together
    with a preview title + kind + view count. Powers social proof and SEO."""
    q = db.query(SharedReport)
    if kind in ("research", "debate"):
        q = q.filter(SharedReport.kind == kind)
    rows = q.order_by(SharedReport.created_at.desc()).limit(max(1, min(60, int(limit or 24)))).all()
    items = []
    for r in rows:
        p = r.payload or {}
        # Best-effort snippet for the card body without shipping the full report.
        snippet = ""
        if isinstance(p, dict):
            snippet = str(p.get("answer") or (p.get("report") or {}).get("executive_summary") or "")[:280]
            if r.kind == "debate":
                snippet = str(((p.get("result") or {}).get("verdict") or {}).get("reasoning") or snippet)[:280]
        items.append({
            "id": r.id,
            "kind": r.kind,
            "title": r.title or "",
            "url_path": ("/r/" if r.kind == "research" else "/d/") + r.id,
            "snippet": snippet,
            "views": r.views or 0,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    return {"items": items, "total": len(items)}


# ------------------------------------------------------------------ KG share
@router.post("/graph/share")
async def graph_share(request: Request, db: Session = Depends(get_db)):
    """Snapshot the caller's own knowledge graph as a public read-only view.
    Stored inside the SharedReport table under kind='graph' so we reuse one
    table and one lifecycle."""
    user_id = get_current_user(request)
    if not user_id or user_id in ("guest", "unknown"):
        raise HTTPException(401, "Sign in to share your knowledge graph.")

    try:
        graph = kg.get_user_knowledge_graph(user_id=user_id) or {}
    except Exception as e:
        raise HTTPException(502, f"Could not read graph: {e}")

    nodes = graph.get("nodes") or []
    edges = graph.get("edges") or []
    if not nodes:
        raise HTTPException(400, "Your graph is empty — run some research first.")

    # Strip anything that could leak private context: keep labels, types,
    # communities, weights; drop raw summaries and per-node URLs.
    def _pub(n):
        return {
            "id": n.get("id"),
            "label": n.get("label"),
            "type": n.get("type"),
            "community": n.get("community"),
            "weight": n.get("weight"),
        }
    payload = {
        "nodes": [_pub(n) for n in nodes],
        "edges": [{"source": e.get("source"), "target": e.get("target"),
                   "type": e.get("type"), "weight": e.get("weight")} for e in edges],
        "shared_at": datetime.utcnow().isoformat(),
    }

    sid = secrets.token_urlsafe(12)[:16]
    row = SharedReport(id=sid, kind="graph",
                       title=f"Knowledge graph · {len(nodes)} concepts · {len(edges)} links",
                       payload=payload, owner_id=user_id, views=0)
    db.add(row)
    db.commit()
    return {"id": sid, "url_path": "/g/" + sid,
            "nodes": len(nodes), "edges": len(edges)}


@router.get("/graph/share/{share_id}")
async def graph_share_get(share_id: str, db: Session = Depends(get_db)):
    row = db.query(SharedReport).filter(SharedReport.id == share_id,
                                        SharedReport.kind == "graph").first()
    if not row:
        raise HTTPException(404, "Shared graph not found or expired.")
    try:
        row.views = (row.views or 0) + 1
        db.commit()
    except Exception:
        db.rollback()
    return {"id": row.id, "kind": "graph", "title": row.title, "payload": row.payload}


# ------------------------------------------------------------------ Import
_TOKEN_RE = re.compile(r"[A-Z][A-Za-z0-9\-]{2,}(?: [A-Z][A-Za-z0-9\-]{2,}){0,2}")
_STOP = set("The A An Of In On At To For With From By As Is Are Was Were Be Been Being And Or But Not I You Your We Our Their There Here".split())


def _extract_topics(text: str, k: int = 12):
    """Cheap capitalised-phrase extractor. Not smart, but predictable and free.
    Enough to seed a graph until a user runs their own research on the same topic
    and the real entity pipeline kicks in."""
    if not text:
        return []
    phrases = [p.strip() for p in _TOKEN_RE.findall(text) if p.strip() and p not in _STOP]
    # Rank by frequency, then by first appearance for stability.
    freq = Counter(phrases)
    order = {}
    for i, p in enumerate(phrases):
        order.setdefault(p, i)
    ranked = sorted(freq.items(), key=lambda kv: (-kv[1], order.get(kv[0], 0)))
    out = []
    seen = set()
    for term, _ in ranked:
        low = term.lower()
        if low in seen:
            continue
        seen.add(low)
        out.append(term)
        if len(out) >= k:
            break
    return out


@router.post("/import/notes")
async def import_notes(request: Request, db: Session = Depends(get_db)):
    """Paste ChatGPT / NotebookLM / plain-text export → topics extracted, KG
    seeded, a research entry saved so it appears in Memory Bank. No LLM key
    required: this is the growth-hack entry point, so it must always work."""
    user_id = get_current_user(request)
    if not user_id or user_id in ("guest", "unknown"):
        raise HTTPException(401, "Sign in to import notes into your graph.")

    body = await request.json()
    raw = (body.get("text") or "").strip()
    source = (body.get("source") or "notes").strip() or "notes"
    title = (body.get("title") or "").strip() or f"Imported from {source}"
    if len(raw) < 40:
        raise HTTPException(400, "Paste at least a paragraph of text to import.")
    if len(raw) > 200_000:
        raise HTTPException(413, "Import is too large (max ~200KB).")

    topics = _extract_topics(raw, k=14)
    if not topics:
        raise HTTPException(422, "Could not find any concept-worthy phrases in the text.")

    # Seed the graph: one entry + pairwise topic links.
    added = 0
    try:
        kg.add_research_entry(
            query=title,
            answer=raw[:4000],
            sources=[{"title": f"Imported from {source}", "url": ""}],
            confidence=60,
            topics=topics,
            user_id=user_id,
        )
        for i in range(len(topics)):
            for j in range(i + 1, min(i + 4, len(topics))):
                try:
                    kg.link_entities(topics[i], topics[j], title, user_id=user_id)
                    added += 1
                except Exception:
                    pass
    except Exception as e:
        raise HTTPException(502, f"Import failed: {e}")

    return {
        "status": "ok",
        "topics": topics,
        "edges_added": added,
        "title": title,
        "source": source,
        "message": f"Imported {len(topics)} concepts from your {source} export.",
    }


# ------------------------------------------------------------------ Referrals
@router.post("/referral/register")
async def referral_register(request: Request, db: Session = Depends(get_db)):
    """Record a referral so both users get bonus free-key runs.

    Body: {"referrer_public_id": "...", "referee_public_id": "..."}

    Stored inside `usage_logs` as a virtual 'referral' mode so we don't need a
    new table; the rate-limiter can subtract these from the daily cap. The
    reward itself is applied by the enforce() layer, which reads referrals as
    negative usage.
    """
    body = await request.json()
    ref = str(body.get("referrer_public_id") or "").strip()
    who = str(body.get("referee_public_id") or "").strip()
    if not ref or not who or ref == who:
        raise HTTPException(400, "Invalid referrer/referee pair.")

    from app.models.misc import UsageLog

    # Idempotency: never double-credit the same pair.
    exists = db.query(UsageLog).filter(
        UsageLog.user_id == who,
        UsageLog.mode == "referral",
        UsageLog.query == ref,
    ).first()
    if exists:
        return {"status": "already_credited"}

    # Two negative-usage rows: -10 for referrer, -10 for referee.
    for uid in (ref, who):
        db.add(UsageLog(
            user_id=uid, mode="referral", provider="referral", model="referral",
            query=(who if uid == ref else ref),
            calls=0, input_tokens=0, output_tokens=0, total_tokens=-10,
            estimated_cost_usd=None,
        ))
    db.commit()
    return {"status": "credited", "bonus_runs": 10}
