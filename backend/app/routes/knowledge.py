from fastapi import APIRouter, Query
from typing import Optional
from app.knowledge_graph.graph_manager import kg
from app.knowledge_graph.hybrid_search import hybrid

router = APIRouter(prefix="/knowledge", tags=["knowledge"])

@router.get("/graph")
async def get_knowledge_graph():
    """Get the full knowledge graph with real entity relationships"""
    graph_data = kg.get_user_knowledge_graph()
    
    # If still empty, return sample data
    if not graph_data.get('nodes'):
        sample_nodes = [
            {"id": "Artificial Intelligence", "label": "Artificial Intelligence", "size": 35, "type": "major", "connections": 8},
            {"id": "Machine Learning", "label": "Machine Learning", "size": 30, "type": "major", "connections": 6},
            {"id": "Deep Learning", "label": "Deep Learning", "size": 25, "type": "major", "connections": 4},
            {"id": "Neural Networks", "label": "Neural Networks", "size": 22, "type": "major", "connections": 5},
            {"id": "AI Ethics", "label": "AI Ethics", "size": 20, "type": "debate", "connections": 3},
            {"id": "Data Privacy", "label": "Data Privacy", "size": 18, "type": "debate", "connections": 2},
            {"id": "Quantum Computing", "label": "Quantum Computing", "size": 28, "type": "major", "connections": 3},
            {"id": "NLP", "label": "Natural Language Processing", "size": 22, "type": "major", "connections": 4},
        ]
        
        # Generate edges from word overlap
        edges = kg._generate_edges_from_labels(sample_nodes)
        graph_data = {"nodes": sample_nodes, "edges": edges}
    
    return graph_data

@router.post("/seed-demo")
async def seed_demo_data():
    """Seed the knowledge graph with demo data for testing"""
    demo_queries = [
        ("What is artificial intelligence?", "research"),
        ("How does machine learning work?", "research"),
        ("What are neural networks?", "research"),
        ("Is AI dangerous for humanity?", "debate"),
        ("How does Google use AI?", "research"),
        ("What is deep learning?", "research"),
        ("Should AI be regulated?", "debate"),
        ("How does OpenAI work?", "research"),
    ]
    
    try:
        for query, mode in demo_queries:
            entities = hybrid._extract_entities(query)
            kg.add_research_entry(
                research_query=query,
                answer=f"Research on: {query}",
                sources=[],
                confidence=85,
                topics=entities,
                session_id="demo_user"
            )
            # Link entities that appear together
            for i in range(len(entities)):
                for j in range(i+1, len(entities)):
                    kg.link_entities(entities[i], entities[j], query)
        
        return {"status": "ok", "message": f"Demo data seeded with {len(demo_queries)} queries"}
    
    except Exception as e:
        print(f"Error seeding demo data: {e}")
        return {"status": "error", "message": str(e)}

@router.get("/node/{node_id}")
async def get_node_details(node_id: str):
    """Get detailed information about a specific node"""
    if not kg.driver:
        return {"name": node_id, "type": "error", "total_connections": 0, "related_nodes": []}
    
    try:
        with kg.driver.session() as session:
            # Get entity details
            result = session.run("""
                MATCH (e:Entity {name: $name})
                OPTIONAL MATCH (e)-[r:CO_OCCURS_WITH]-(connected:Entity)
                RETURN e.name as name,
                       count(DISTINCT connected) as total_connections,
                       collect(DISTINCT connected.name)[0..10] as related_nodes,
                       avg(r.count) as avg_weight
            """, name=node_id)
            
            record = result.single()
            if record and record["name"]:
                return {
                    "name": record["name"],
                    "type": "entity",
                    "total_connections": record["total_connections"] or 0,
                    "related_nodes": record["related_nodes"] or [],
                    "avg_relationship_weight": round(record["avg_weight"] or 1, 1),
                    "first_seen": "Recent",
                    "last_updated": "Just now"
                }
            
            # Check if it's a topic
            topic_result = session.run("""
                MATCH (t:Topic {name: $name})
                OPTIONAL MATCH (q:Query)-[:ABOUT]->(t)
                RETURN t.name as name,
                       count(q) as research_count
            """, name=node_id)
            
            topic_record = topic_result.single()
            if topic_record and topic_record["name"] and topic_record["research_count"] > 0:
                return {
                    "name": topic_record["name"],
                    "type": "topic",
                    "total_connections": topic_record["research_count"],
                    "related_nodes": [],
                    "research_count": topic_record["research_count"],
                    "first_seen": "Recent",
                    "last_updated": "Just now"
                }
            
            return {"name": node_id, "type": "unknown", "total_connections": 0, "related_nodes": []}
            
    except Exception as e:
        print(f"Node detail error: {e}")
        return {"name": node_id, "type": "error", "total_connections": 0, "related_nodes": []}

@router.get("/node/{node_id}/research")
async def get_node_research(node_id: str):
    """Get research sessions related to a specific node"""
    if not kg.driver:
        return {"node": node_id, "related_research": []}
    
    try:
        with kg.driver.session() as session:
            result = session.run("""
                MATCH (e:Entity {name: $name})
                OPTIONAL MATCH (q:Query)-[:ABOUT]->(:Topic {name: $name})
                OPTIONAL MATCH (q2:Query)
                WHERE q2.query CONTAINS $name
                RETURN DISTINCT coalesce(q.query, q2.query) as query,
                       coalesce(q.confidence, q2.confidence) as confidence
                LIMIT 5
            """, name=node_id)
            
            research = []
            for record in result:
                if record["query"]:
                    research.append({
                        "query": record["query"][:100],
                        "confidence": record["confidence"] or 0
                    })
            
            return {"node": node_id, "related_research": research}
            
    except Exception as e:
        print(f"Node research error: {e}")
        return {"node": node_id, "related_research": []}

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

@router.get("/pipeline-stats")
async def get_pipeline_stats():
    """Get unified embedding pipeline statistics"""
    from app.services.embedding_pipeline import pipeline
    return pipeline.get_stats()

@router.get("/cross-module")
async def cross_module_connections(
    query: str = Query(...),
    source_module: str = Query("research")
):
    """Find connections across different modules"""
    from app.services.embedding_pipeline import pipeline
    results = pipeline.find_cross_module_connections(
        query=query,
        source_module=source_module
    )
    return {
        "query": query,
        "source_module": source_module,
        "cross_module_matches": results,
        "total": len(results)
    }

@router.get("/rich-graph")
async def get_rich_graph():
    """Get enriched graph with Claims, Evidence, Arguments, Topics"""
    graph_data = kg.get_rich_graph()
    
    # If empty, seed demo data and try again
    if not graph_data.get('nodes'):
        kg.seed_rich_demo()
        graph_data = kg.get_rich_graph()
    
    return graph_data

@router.post("/seed-rich-demo")
async def seed_rich_demo():
    """Seed rich demo data for testing"""
    return kg.seed_rich_demo()