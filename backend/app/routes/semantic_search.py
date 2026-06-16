from fastapi import APIRouter, Query, Request
from typing import Optional
from app.semantic_search import semantic_search

router = APIRouter(prefix="/search", tags=["semantic-search"])

# ============================================================
# HELPER: Get authenticated user ID from request state
# ============================================================
def get_user_id(request: Request) -> str:
    """Extract user public ID from auth middleware"""
    uid = getattr(request.state, 'user_public_id', 'guest')
    return uid if uid and uid != 'unknown' else 'guest'

# ============================================================
# ENDPOINTS
# ============================================================

@router.get("/")
async def search_memories(
    request: Request,                                    # ← ADD request
    query: str = Query(..., description="Search query"),
    top_k: int = Query(12, description="Number of results"),
    mode: Optional[str] = Query(None, description="Filter by mode: research or debate")
):
    """Semantic search scoped to CURRENT user only"""
    user_id = get_user_id(request)
    
    filters = {"user_id": user_id}  # ← USER FILTER
    if mode:
        filters["mode"] = mode
    
    results = semantic_search.search(query, top_k, filters)
    
    return {
        "query": query,
        "user_id": user_id,
        "total_results": len(results),
        "results": results
    }

@router.get("/suggestions")
async def get_suggestions(
    request: Request,                                    # ← ADD request
    query: str = Query(..., description="Partial query for suggestions"),
    limit: int = Query(5)
):
    """Get suggestions scoped to CURRENT user"""
    user_id = get_user_id(request)
    
    # Get suggestions filtered by user
    suggestions = semantic_search.get_suggestions(query, limit, user_id=user_id)
    return {
        "query": query,
        "user_id": user_id,
        "suggestions": suggestions
    }

@router.get("/stats/vector-count")
async def get_vector_count(request: Request):           # ← ADD request
    """Get total vectors for CURRENT user"""
    user_id = get_user_id(request)
    
    try:
        # Count only this user's entries
        total = len([
            entry for entry in semantic_search.fallback_memory
            if entry.get('user_id', 'guest') == user_id
        ]) if hasattr(semantic_search, 'fallback_memory') else 0
        
        return {"count": total, "user_id": user_id, "status": "ok"}
    except Exception as e:
        return {"count": 0, "status": "error", "message": str(e)}