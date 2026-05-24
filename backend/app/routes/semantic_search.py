from fastapi import APIRouter, Query
from typing import Optional
from app.semantic_search import semantic_search

router = APIRouter(prefix="/search", tags=["semantic-search"])

@router.get("/")
async def search_memories(
    query: str = Query(..., description="Search query"),
    top_k: int = Query(12, description="Number of results"),
    mode: Optional[str] = Query(None, description="Filter by mode: research or debate")
):
    """Semantic search across all research memories"""
    filters = {}
    if mode:
        filters["mode"] = mode
    
    results = semantic_search.search(query, top_k, filters if filters else None)
    
    return {
        "query": query,
        "total_results": len(results),
        "results": results
    }

@router.get("/suggestions")
async def get_suggestions(
    query: str = Query(..., description="Partial query for suggestions"),
    limit: int = Query(5)
):
    """Get search suggestions"""
    suggestions = semantic_search.get_suggestions(query, limit)
    return {"query": query, "suggestions": suggestions}