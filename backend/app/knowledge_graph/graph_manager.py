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
        """Store a research session as graph nodes with relationships"""
        if not self.driver:
            return False
        
        try:
            with self.driver.session() as session:
                # Create query node
                session.run("""
                    MERGE (q:Query {text: $query})
                    SET q.session_id = $session_id,
                        q.confidence = $confidence,
                        q.timestamp = datetime()
                    
                    // Create answer node
                    CREATE (a:Answer {
                        text: $answer,
                        confidence: $confidence,
                        session_id: $session_id,
                        timestamp: datetime()
                    })
                    
                    // Link query to answer
                    CREATE (q)-[:GENERATED]->(a)
                """, query=query[:200], answer=answer[:500], 
                    confidence=confidence, session_id=session_id)
                
                # Create topic nodes and relationships
                for topic in topics:
                    session.run("""
                        MERGE (t:Topic {name: $topic})
                        WITH t
                        MATCH (q:Query {text: $query})
                        MERGE (q)-[:ABOUT]->(t)
                    """, topic=topic.strip(), query=query[:200])
                
                # Create source nodes
                for i, source in enumerate(sources[:5]):
                    title = source.get('title', 'Untitled')[:200]
                    url = source.get('url', '')
                    
                    session.run("""
                        MERGE (s:Source {url: $url})
                        SET s.title = $title
                        WITH s
                        MATCH (q:Query {text: $query})
                        MERGE (q)-[:CITES]->(s)
                    """, url=url, title=title, query=query[:200])
                
                print(f"✅ Stored in Knowledge Graph: {len(topics)} topics, {len(sources)} sources")
                return True
                
        except Exception as e:
            print(f"❌ Graph storage error: {e}")
            return False
    
    def extract_and_link_entities(self, text: str) -> List[str]:
        """Extract entities from text and link them in graph"""
        # Simple entity extraction (capitalized phrases)
        import re
        entities = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
        unique_entities = list(set(entities))[:8]
        
        if not self.driver or len(unique_entities) < 2:
            return unique_entities
        
        try:
            with self.driver.session() as session:
                # Create entity nodes
                for entity in unique_entities:
                    session.run("""
                        MERGE (e:Entity {name: $name})
                    """, name=entity)
                
                # Create relationships between entities that appear together
                for i in range(len(unique_entities)):
                    for j in range(i+1, len(unique_entities)):
                        session.run("""
                            MATCH (e1:Entity {name: $name1})
                            MATCH (e2:Entity {name: $name2})
                            MERGE (e1)-[r:MENTIONED_WITH]->(e2)
                            SET r.count = coalesce(r.count, 0) + 1
                        """, name1=unique_entities[i], name2=unique_entities[j])
                
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
        """Get the user's knowledge graph as nodes and edges"""
        if not self.driver:
            return {"nodes": [], "edges": []}
        
        try:
            with self.driver.session() as session:
                # Get topic nodes with size based on research count
                nodes_result = session.run("""
                    MATCH (t:Topic)
                    OPTIONAL MATCH (q:Query)-[:ABOUT]->(t)
                    RETURN t.name as name, count(q) as size,
                           CASE WHEN count(q) > 3 THEN 'major' ELSE 'minor' END as type
                    ORDER BY size DESC
                    LIMIT 30
                """)
                
                nodes = [
                    {"id": record["name"], "label": record["name"], 
                     "size": record["size"] * 10 + 20, "type": record["type"]}
                    for record in nodes_result
                ]
                
                # Get edges between topics
                edges_result = session.run("""
                    MATCH (t1:Topic)<-[:ABOUT]-(q:Query)-[:ABOUT]->(t2:Topic)
                    WHERE t1.name < t2.name
                    RETURN t1.name as source, t2.name as target, 
                           count(q) as weight
                    ORDER BY weight DESC
                    LIMIT 50
                """)
                
                edges = [
                    {"source": record["source"], "target": record["target"],
                     "weight": record["weight"]}
                    for record in edges_result
                ]
                
                return {"nodes": nodes, "edges": edges}
                
        except Exception as e:
            print(f"❌ Knowledge graph query error: {e}")
            return {"nodes": [], "edges": []}

# Global instance
kg = KnowledgeGraph()