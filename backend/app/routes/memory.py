from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse
from app.chat_history import get_chat_history, get_debate_history
import sqlite3

router = APIRouter(prefix="/memory", tags=["memory"])
DB_PATH = "polynous_chats.db"

# CORS preflight handler
@router.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

@router.get("/stats/{user_id}")
async def get_stats(user_id: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM chat_history WHERE session_id = ?", (user_id,))
        total_research = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM debate_history WHERE session_id = ?", (user_id,))
        total_debates = cursor.fetchone()[0]
        cursor.execute("SELECT AVG(confidence) FROM chat_history WHERE session_id = ?", (user_id,))
        avg_conf = cursor.fetchone()[0] or 0
        cursor.execute("SELECT COUNT(DISTINCT user_query) FROM chat_history WHERE session_id = ?", (user_id,))
        unique_topics = cursor.fetchone()[0]
        conn.close()
        return {"total_research": total_research, "total_debates": total_debates, "avg_confidence": round(float(avg_conf), 1), "unique_topics": unique_topics}
    except Exception as e:
        return {"total_research": 0, "total_debates": 0, "avg_confidence": 0, "unique_topics": 0}

@router.get("/interests/{user_id}")
async def get_interests(user_id: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT user_query, COUNT(*) as cnt FROM chat_history WHERE session_id = ? GROUP BY user_query ORDER BY cnt DESC LIMIT 10", (user_id,))
        rows = cursor.fetchall()
        conn.close()
        interests = []
        for row in rows:
            words = row[0].lower().replace("?","").replace("what","").replace("is","").replace("the","").replace("how","").replace("does","").strip()
            interests.append({"topic": words[:50], "strength": row[1]})
        return {"interests": interests}
    except:
        return {"interests": []}

@router.get("/history/{user_id}")
async def get_history(user_id: str, limit: int = 20):
    try:
        history = get_chat_history(user_id, limit)
        return {"history": history}
    except:
        return {"history": []}

@router.get("/debates/{user_id}")
async def get_debates(user_id: str, limit: int = 20):
    try:
        history = get_debate_history(user_id, limit)
        return {"debates": history}
    except:
        return {"debates": []}

@router.get("/suggestions/{user_id}")
async def get_suggestions(user_id: str, topic: str = Query(...)):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT user_query FROM chat_history WHERE session_id = ? AND user_query LIKE ? LIMIT 5", (user_id, f"%{topic}%"))
        rows = cursor.fetchall()
        conn.close()
        return {"suggestions": [r[0][:80] for r in rows]}
    except:
        return {"suggestions": []}

@router.post("/user/{user_id}")
async def create_user(user_id: str, username: str = "Guest", email: str = ""):
    return {"status": "ok", "user_id": user_id}