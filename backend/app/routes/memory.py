from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from collections import defaultdict
from datetime import datetime, timedelta

router = APIRouter(prefix="/memory", tags=["memory"])

# Import your existing memory functions
try:
    from app.knowledge_graph.user_memory import user_memory
except:
    user_memory = None

@router.get("/stats/{user_id}")
async def get_user_stats(user_id: str):
    """Get user statistics"""
    if user_memory:
        stats = user_memory.get_user_stats(user_id)
        return stats
    return {"total_research": 0, "total_debates": 0, "avg_confidence": 0, "unique_topics": 0}

@router.get("/interests/{user_id}")
async def get_user_interests(user_id: str, limit: int = 15):
    """Get user's research interests"""
    if user_memory:
        interests = user_memory.get_user_interests(user_id, limit)
        return {"interests": interests}
    return {"interests": []}

@router.get("/history/{user_id}")
async def get_user_history(user_id: str, limit: int = 100):
    """Get user's research history"""
    if user_memory:
        history = user_memory.get_recent_research(user_id, limit)
        return {"history": history}
    return {"history": []}

@router.get("/debates/{user_id}")
async def get_user_debates(user_id: str):
    """Get user's debate history"""
    if user_memory and user_memory.driver:
        try:
            with user_memory.driver.session() as session:
                result = session.run("""
                    MATCH (u:User {id: $user_id})-[:DEBATED]->(d:DebateSession)
                    RETURN d.topic as topic, d.winner as winner,
                           d.for_score as for_score, d.against_score as against_score,
                           d.timestamp as timestamp
                    ORDER BY d.timestamp DESC LIMIT 50
                """, user_id=user_id)
                debates = [{
                    "topic": r["topic"], "winner": r["winner"],
                    "for_score": r["for_score"], "against_score": r["against_score"],
                    "timestamp": str(r["timestamp"]) if r["timestamp"] else None
                } for r in result]
                return {"debates": debates}
        except: pass
    return {"debates": []}

@router.get("/suggestions/{user_id}")
async def get_suggestions(user_id: str, topic: str = Query(...)):
    """Get topic suggestions"""
    if user_memory:
        suggestions = user_memory.get_related_suggestions(user_id, topic)
        return {"suggestions": suggestions}
    return {"suggestions": []}

@router.get("/context/{user_id}")
async def get_context(user_id: str, query: Optional[str] = None):
    """Get personalized context"""
    if user_memory:
        context = user_memory.get_personalized_context(user_id, query or "")
        return {"context": context}
    return {"context": ""}

@router.post("/user/{user_id}")
async def create_user(user_id: str, username: str = "User", email: str = ""):
    """Create user profile"""
    if user_memory:
        user_memory.create_user_profile(user_id, username, email)
        return {"status": "ok", "user_id": user_id}
    return {"status": "error", "message": "User memory not available"}

# ─── ANALYTICS ENDPOINT (WITH DAYS FILTER) ────────────────────
@router.get("/analytics/{user_id}")
async def get_analytics(user_id: str, days: int = 30):
    """Get complete analytics data for dashboard
    
    Args:
        user_id: User ID to get analytics for
        days: Number of days to look back (default 30)
    """
    
    stats = {"total_research": 0, "total_debates": 0, "avg_confidence": 0, "unique_topics": 0}
    interests = []
    all_history = []
    debates = []
    
    if user_memory:
        stats = user_memory.get_user_stats(user_id) or stats
        interests = user_memory.get_user_interests(user_id, 15) or []
        all_history = user_memory.get_recent_research(user_id, 500) or []
    
    # ─── FILTER BY DAYS ─────────────────────────────────────
    cutoff = datetime.now() - timedelta(days=days)
    history = []
    for h in all_history:
        if h.get('timestamp'):
            try:
                ts = str(h['timestamp'])
                if 'T' in ts:
                    dt = datetime.fromisoformat(ts.replace('Z', '+00:00').split('+')[0].split('.')[0])
                    if dt >= cutoff:
                        history.append(h)
                elif ' ' in ts:
                    # Try space-separated format
                    dt = datetime.strptime(ts[:19], '%Y-%m-%d %H:%M:%S')
                    if dt >= cutoff:
                        history.append(h)
                else:
                    # Can't parse, include anyway
                    history.append(h)
            except:
                # Can't parse timestamp, include anyway
                history.append(h)
        else:
            # No timestamp, include anyway
            history.append(h)
    
    # ─── Hourly activity heatmap ────────────────────────────
    hourly = defaultdict(lambda: defaultdict(int))
    for h in history:
        if h.get('timestamp'):
            try:
                ts = str(h['timestamp'])
                if 'T' in ts:
                    dt = datetime.fromisoformat(ts.replace('Z', '+00:00').split('+')[0].split('.')[0])
                    day = dt.strftime('%A')
                    hour = dt.hour
                    hourly[day][str(hour)] += 1
            except:
                pass
    
    # ─── Confidence trend (last 10) ─────────────────────────
    confidence_trend = []
    for h in history[:10]:
        conf = h.get('confidence')
        if conf is not None:
            try:
                confidence_trend.append(round(float(conf), 1))
            except:
                pass
    
    # ─── Confidence distribution ────────────────────────────
    conf_dist = {"high": 0, "medium": 0, "low": 0}
    for h in history:
        c = h.get('confidence', 0)
        if c is None:
            c = 0
        try:
            c = float(c)
        except:
            c = 0
        if c >= 80:
            conf_dist["high"] += 1
        elif c >= 60:
            conf_dist["medium"] += 1
        else:
            conf_dist["low"] += 1
    
    # ─── Topic frequencies ──────────────────────────────────
    topic_freq = {}
    for interest in interests:
        topic = interest.get('topic', 'Unknown')
        strength = interest.get('strength', 0)
        if topic in topic_freq:
            topic_freq[topic] += strength
        else:
            topic_freq[topic] = strength
    
    # ─── Activity by date ───────────────────────────────────
    by_date = defaultdict(int)
    for h in history:
        if h.get('timestamp'):
            try:
                date_str = str(h['timestamp'])[:10]
                by_date[date_str] += 1
            except:
                pass
    
    # ─── Debate stats for this period ───────────────────────
    debate_count = 0
    if user_memory and user_memory.driver:
        try:
            with user_memory.driver.session() as session:
                result = session.run("""
                    MATCH (u:User {id: $user_id})-[:DEBATED]->(d:DebateSession)
                    RETURN count(d) as cnt
                """, user_id=user_id)
                debate_count = result.single()["cnt"] if result.peek() else 0
        except:
            pass
    
    return {
        "stats": {
            "total_research": len(history),
            "total_debates": debate_count,
            "avg_confidence": round(sum(confidence_trend) / len(confidence_trend), 1) if confidence_trend else 0,
            "unique_topics": len(topic_freq)
        },
        "hourly_activity": {day: dict(hours) for day, hours in hourly.items()},
        "confidence_trend": confidence_trend,
        "confidence_distribution": conf_dist,
        "topic_frequencies": topic_freq,
        "activity_by_date": dict(sorted(by_date.items())),
        "total_queries": len(history),
        "period_days": days,
        "interests": interests
    }