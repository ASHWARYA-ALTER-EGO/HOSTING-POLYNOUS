from fastapi import APIRouter, Query
from typing import Optional
from app.knowledge_graph.graph_manager import kg
from app.knowledge_graph.hybrid_search import hybrid

router = APIRouter(prefix="/knowledge", tags=["knowledge"])

@router.get("/graph")
async def get_knowledge_graph():
    """Get the full knowledge graph for visualization"""
    graph_data = kg.get_user_knowledge_graph()
    return graph_data

@router.get("/topics")
async def get_topics():
    """Get all research topics"""
    topics = kg.get_related_topics("", depth=1, limit=20)
    return {"topics": topics}

@router.get("/related")
async def get_related_topics(topic: str = Query(...)):
    """Get topics related to a given topic"""
    related = kg.get_related_topics(topic)
    return {"topic": topic, "related": related}

@router.get("/connections")
async def find_connections(entity1: str = Query(...), entity2: str = Query(...)):
    """Find paths between two entities"""
    paths = kg.find_connections(entity1, entity2)
    return {
        "entity1": entity1,
        "entity2": entity2,
        "paths": paths,
        "connected": len(paths) > 0
    }

@router.get("/hybrid-search")
async def hybrid_search(query: str = Query(...)):
    """Perform hybrid search"""
    results = hybrid.hybrid_search(query)
    return results

@router.get("/entities")
async def extract_entities(text: str = Query(...)):
    """Extract entities from text"""
    entities = hybrid._extract_entities(text)
    return {"text": text, "entities": entities}