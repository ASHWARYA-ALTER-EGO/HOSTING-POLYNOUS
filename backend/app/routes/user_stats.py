from fastapi import APIRouter, Query
from app.knowledge_graph.user_memory import user_memory

router = APIRouter(prefix="/user", tags=["user-stats"])

@router.get("/stats")
async def get_user_stats(user_id: str = Query("guest_user")):
    """Get comprehensive user statistics"""
    stats = user_memory.get_user_stats(user_id)
    interests = user_memory.get_user_interests(user_id, 10)
    recent = user_memory.get_recent_research(user_id, 5)
    
    return {
        "user_id": user_id,
        "stats": stats,
        "interests": interests,
        "recent_research": recent
    }