from neo4j import GraphDatabase
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv

load_dotenv()

class KnowledgeGraph:
    def __init__(self):
        uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        user = os.getenv("NEO4J_USERNAME", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "password")
        
        try:
            self.driver = GraphDatabase.driver(uri, auth=(user, password))
            self.driver.verify_connectivity()
            print("✅ Neo4j Connected!")
        except Exception as e:
            print(f"⚠️ Neo4j not available: {e}")
            self.driver = None
    
    def close(self):
        if self.driver:
            self.driver.close()
    
    def add_research_entry(self, query: str, answer: str, sources: List[Dict], 
                           confidence: float, topics: List[str], session_id: str):
        """Store a research session as graph nodes with relationships - SIMPLIFIED VERSION"""
        if not self.driver:
            return False
        
        try:
            with self.driver.session() as session:
                # Create topic nodes
                for topic in topics:
                    topic = topic.strip()
                    if topic:
                        session.run("MERGE (t:Topic {name: $topic})", topic=topic)
                
                # Create research node and link to user
                session.run("""
                    MERGE (u:User {id: $session_id})
                    CREATE (r:ResearchSession {
                        query: $query, 
                        confidence: $confidence,
                        timestamp: datetime()
                    })
                    CREATE (u)-[:CONDUCTED]->(r)
                """, session_id=session_id, query=query[:200], confidence=confidence)
                
                # Link research to topics
                for topic in topics:
                    topic = topic.strip()
                    if topic:
                        session.run("""
                            MATCH (t:Topic {name: $topic})
                            MATCH (r:ResearchSession {query: $query})
                            CREATE (r)-[:ABOUT]->(t)
                        """, topic=topic, query=query[:200])
                
                # Create source nodes and link
                for i, source in enumerate(sources[:5]):
                    title = source.get('title', 'Untitled')[:200]
                    url = source.get('url', '')
                    
                    session.run("""
                        MERGE (s:Source {url: $url})
                        SET s.title = $title
                        WITH s
                        MATCH (r:ResearchSession {query: $query})
                        CREATE (r)-[:CITES]->(s)
                    """, url=url, title=title, query=query[:200])
                
                print(f"✅ Stored in KG: {len(topics)} topics")
                return True
                
        except Exception as e:
            print(f"⚠️ KG error: {e}")
            return False
    
    def link_entities(self, entity1: str, entity2: str, context: str = ""):
        """Create a relationship between two entities that appear in the same research"""
        if not self.driver:
            return
        
        try:
            with self.driver.session() as session:
                session.run("""
                    MERGE (e1:Entity {name: $e1})
                    MERGE (e2:Entity {name: $e2})
                    MERGE (e1)-[r:CO_OCCURS_WITH]-(e2)
                    SET r.count = coalesce(r.count, 0) + 1,
                        r.last_seen = datetime(),
                        r.context = $context
                """, e1=entity1.strip(), e2=entity2.strip(), context=context[:200])
        except Exception as e:
            print(f"  ⚠️ Link error: {e}")

    def get_all_entities_with_relationships(self) -> Dict:
        """Get ALL entities and their relationships for the knowledge graph"""
        if not self.driver:
            return {"nodes": [], "edges": []}
        
        try:
            with self.driver.session() as session:
                # Get entity nodes
                nodes_result = session.run("""
                    MATCH (e:Entity)
                    OPTIONAL MATCH (e)-[r:CO_OCCURS_WITH]-()
                    RETURN e.name as name, count(r) as connections
                    ORDER BY connections DESC
                    LIMIT 40
                """)
                
                nodes = []
                for record in nodes_result:
                    connections = record["connections"] if record["connections"] is not None else 0
                    nodes.append({
                        "id": record["name"],
                        "label": record["name"],
                        "size": min(40, connections * 5 + 15),
                        "type": "entity",
                        "connections": connections
                    })
                
                # Get edges between entities
                edges_result = session.run("""
                    MATCH (e1:Entity)-[r:CO_OCCURS_WITH]-(e2:Entity)
                    WHERE e1.name < e2.name
                    RETURN e1.name as source, e2.name as target, r.count as weight
                    ORDER BY r.count DESC
                    LIMIT 80
                """)
                
                edges = [
                    {"source": record["source"], "target": record["target"], "weight": record["weight"]}
                    for record in edges_result
                ]
                
                # Also get topic nodes from research
                topics_result = session.run("""
                    MATCH (t:Topic)
                    OPTIONAL MATCH (q:Query)-[:ABOUT]->(t)
                    WITH t, count(q) as cnt
                    WHERE cnt > 0
                    RETURN t.name as name, cnt as research_count
                    ORDER BY cnt DESC
                    LIMIT 20
                """)
                
                for record in topics_result:
                    research_count = record["research_count"] if record["research_count"] is not None else 0
                    # Check if topic already exists as entity
                    if not any(n["id"] == record["name"] for n in nodes):
                        nodes.append({
                            "id": record["name"],
                            "label": record["name"],
                            "size": min(35, research_count * 8 + 15),
                            "type": "major" if research_count > 2 else "minor",
                            "connections": research_count
                        })
                
                # If no edges from Neo4j, generate from word overlap
                if not edges and len(nodes) >= 2:
                    edges = self._generate_edges_from_labels(nodes)
                
                print(f"✅ KG Data: {len(nodes)} nodes, {len(edges)} edges")
                return {"nodes": nodes, "edges": edges}
                
        except Exception as e:
            print(f"❌ Entity graph error: {e}")
            return {"nodes": [], "edges": []}
    
    def extract_and_link_entities(self, text: str) -> List[str]:
        """Extract entities from text and link them in graph using the new link_entities method"""
        import re
        entities = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
        unique_entities = list(set(entities))[:8]
        
        if not self.driver or len(unique_entities) < 2:
            return unique_entities
        
        try:
            # Link each pair of entities using the new method
            for i in range(len(unique_entities)):
                for j in range(i+1, len(unique_entities)):
                    self.link_entities(unique_entities[i], unique_entities[j], context=text[:200])
                
            print(f"✅ Linked {len(unique_entities)} entities in graph")
        except Exception as e:
            print(f"❌ Entity linking error: {e}")
        
        return unique_entities
    
    def find_connections(self, entity1: str, entity2: str, max_depth: int = 3) -> List[Dict]:
        """Find paths between two entities in the knowledge graph"""
        if not self.driver:
            return []
        
        try:
            with self.driver.session() as session:
                result = session.run("""
                    MATCH path = shortestPath(
                        (e1:Entity {name: $e1})-[*..%d]-(e2:Entity {name: $e2})
                    )
                    RETURN [node in nodes(path) | node.name] as path,
                           [rel in relationships(path) | type(rel)] as relationships,
                           length(path) as hops
                    ORDER BY hops
                    LIMIT 5
                """ % max_depth, e1=entity1, e2=entity2)
                
                connections = []
                for record in result:
                    connections.append({
                        "path": record["path"],
                        "path_display": " → ".join(record["path"]),
                        "relationships": record["relationships"],
                        "hops": record["hops"]
                    })
                
                return connections
                
        except Exception as e:
            print(f"❌ Connection search error: {e}")
            return []
    
    def get_related_topics(self, topic: str, depth: int = 2, limit: int = 10) -> List[Dict]:
        """Find topics related to a given topic through the graph"""
        if not self.driver:
            return []
        
        try:
            with self.driver.session() as session:
                result = session.run("""
                    MATCH (t:Topic {name: $topic})
                    MATCH (t)-[*1..%d]-(related:Topic)
                    WHERE related <> t
                    RETURN related.name as topic, 
                           size((related)<-[:ABOUT]-()) as research_count
                    ORDER BY research_count DESC
                    LIMIT $limit
                """ % depth, topic=topic, limit=limit)
                
                return [
                    {"topic": record["topic"], "research_count": record["research_count"]}
                    for record in result
                ]
                
        except Exception as e:
            print(f"❌ Related topics error: {e}")
            return []
    
    def get_user_knowledge_graph(self, session_id: str = None) -> Dict:
        """Get complete knowledge graph with REAL edges"""
        if not self.driver:
            return {"nodes": [], "edges": []}
        
        try:
            with self.driver.session() as session:
                # Get entity nodes
                nodes_result = session.run("""
                    MATCH (e:Entity)
                    OPTIONAL MATCH (e)-[r:CO_OCCURS_WITH]-()
                    RETURN e.name as name, count(r) as connections
                    ORDER BY connections DESC
                    LIMIT 30
                """)
                
                nodes = []
                for record in nodes_result:
                    connections = record["connections"] if record["connections"] is not None else 0
                    nodes.append({
                        "id": record["name"],
                        "label": record["name"],
                        "size": min(35, connections * 6 + 15),
                        "type": "entity",
                        "connections": connections
                    })
                
                # Get topic nodes too
                topics_result = session.run("""
                    MATCH (t:Topic)
                    OPTIONAL MATCH (q:Query)-[:ABOUT]->(t)
                    WITH t, count(q) as cnt
                    WHERE cnt > 0
                    RETURN t.name as name, cnt as research_count
                    ORDER BY cnt DESC
                    LIMIT 15
                """)
                
                for record in topics_result:
                    research_count = record["research_count"] if record["research_count"] is not None else 0
                    if not any(n["id"] == record["name"] for n in nodes):
                        nodes.append({
                            "id": record["name"],
                            "label": record["name"],
                            "size": min(30, research_count * 8 + 12),
                            "type": "topic",
                            "connections": research_count
                        })
                
                # Get edges between entities
                edges_result = session.run("""
                    MATCH (e1:Entity)-[r:CO_OCCURS_WITH]-(e2:Entity)
                    WHERE e1.name < e2.name
                    RETURN e1.name as source, e2.name as target, r.count as weight
                    ORDER BY r.count DESC
                    LIMIT 50
                """)
                
                edges = [
                    {"source": record["source"], "target": record["target"], "weight": record["weight"]}
                    for record in edges_result
                ]
                
                # If no edges from Neo4j, generate from word overlap
                if not edges and len(nodes) >= 2:
                    edges = self._generate_edges_from_labels(nodes)
                
                print(f"✅ KG: {len(nodes)} nodes, {len(edges)} edges")
                return {"nodes": nodes, "edges": edges}
                
        except Exception as e:
            print(f"❌ Graph error: {e}")
            return {"nodes": [], "edges": []}
    
    def _generate_edges_from_labels(self, nodes: List[Dict]) -> List[Dict]:
        """Fallback: Generate edges based on word overlap in labels"""
        edges = []
        stop_words = {'the', 'and', 'of', 'in', 'to', 'a', 'is', 'for', 'on', 'with', 'ai'}
        
        for i in range(len(nodes)):
            words_i = set(nodes[i]['label'].lower().replace(',', '').split())
            words_i = {w for w in words_i if len(w) > 2 and w not in stop_words}
            
            for j in range(i + 1, len(nodes)):
                words_j = set(nodes[j]['label'].lower().replace(',', '').split())
                words_j = {w for w in words_j if len(w) > 2 and w not in stop_words}
                
                overlap = words_i & words_j
                if overlap:
                    edges.append({
                        "source": nodes[i]['id'],
                        "target": nodes[j]['id'],
                        "weight": len(overlap)
                    })
        
        return edges

# Global instance
kg = KnowledgeGraph()