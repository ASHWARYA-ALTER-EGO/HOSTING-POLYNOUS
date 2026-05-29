from neo4j import GraphDatabase
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv
from datetime import datetime

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
    
    def create_claim_node(self, claim_text: str, source_module: str, confidence: float, 
                          session_id: str = "guest_user") -> bool:
        """Create a Claim node in the knowledge graph"""
        if not self.driver:
            return False
        try:
            with self.driver.session() as session:
                session.run("""
                    MERGE (c:Claim {text: $text})
                    SET c.source_module = $module,
                        c.confidence = $confidence,
                        c.session_id = $session_id,
                        c.created_at = datetime()
                """, text=claim_text[:300], module=source_module, 
                    confidence=confidence, session_id=session_id)
                return True
        except Exception as e:
            print(f"  ⚠️ Claim creation error: {e}")
            return False
    
    def create_evidence_node(self, evidence_text: str, source_url: str = "") -> bool:
        """Create an Evidence node"""
        if not self.driver:
            return False
        try:
            with self.driver.session() as session:
                session.run("""
                    MERGE (e:Evidence {text: $text})
                    SET e.source_url = $url,
                        e.created_at = datetime()
                """, text=evidence_text[:300], url=source_url)
                return True
        except Exception as e:
            print(f"  ⚠️ Evidence creation error: {e}")
            return False
    
    def create_argument_node(self, argument_text: str, side: str, score: float,
                             debate_topic: str = "") -> bool:
        """Create an Argument node (FOR or AGAINST)"""
        if not self.driver:
            return False
        try:
            with self.driver.session() as session:
                session.run("""
                    MERGE (a:Argument {text: $text})
                    SET a.side = $side,
                        a.score = $score,
                        a.debate_topic = $topic,
                        a.created_at = datetime()
                """, text=argument_text[:300], side=side, score=score, topic=debate_topic[:200])
                return True
        except Exception as e:
            print(f"  ⚠️ Argument creation error: {e}")
            return False
    
    def link_claim_to_evidence(self, claim_text: str, evidence_text: str):
        """Link a Claim to supporting Evidence"""
        if not self.driver:
            return
        try:
            with self.driver.session() as session:
                session.run("""
                    MATCH (c:Claim {text: $claim})
                    MATCH (e:Evidence {text: $evidence})
                    MERGE (c)-[:SUPPORTED_BY]->(e)
                """, claim=claim_text[:300], evidence=evidence_text[:300])
        except Exception as e:
            print(f"  ⚠️ Claim-Evidence link error: {e}")
    
    def link_argument_to_counterargument(self, for_text: str, against_text: str):
        """Link FOR argument to AGAINST counterargument"""
        if not self.driver:
            return
        try:
            with self.driver.session() as session:
                session.run("""
                    MATCH (a1:Argument {text: $for_text})
                    MATCH (a2:Argument {text: $against_text})
                    MERGE (a1)-[:COUNTERED_BY]->(a2)
                """, for_text=for_text[:300], against_text=against_text[:300])
        except Exception as e:
            print(f"  ⚠️ Argument link error: {e}")
    
    def get_rich_graph(self) -> Dict:
        """Get enriched graph with Claims, Evidence, Arguments, and Topics"""
        if not self.driver:
            return {"nodes": [], "edges": []}
        
        nodes = []
        edges = []
        
        try:
            with self.driver.session() as session:
                # Get Claims
                claims_result = session.run("""
                    MATCH (c:Claim)
                    OPTIONAL MATCH (c)-[:SUPPORTED_BY]->(e:Evidence)
                    RETURN c.text as text, c.source_module as module, 
                           c.confidence as confidence, count(e) as evidence_count
                    LIMIT 20
                """)
                for r in claims_result:
                    if r["text"]:
                        nodes.append({
                            "id": r["text"][:50],
                            "label": r["text"][:50],
                            "type": "claim",
                            "module": r["module"],
                            "confidence": r["confidence"],
                            "size": 20 + (r["evidence_count"] or 0) * 5
                        })
                
                # Get Arguments
                args_result = session.run("""
                    MATCH (a:Argument)
                    RETURN a.text as text, a.side as side, a.score as score, 
                           a.debate_topic as topic
                    LIMIT 20
                """)
                for r in args_result:
                    if r["text"]:
                        nodes.append({
                            "id": r["text"][:50],
                            "label": f"[{r['side']}] {r['text'][:40]}",
                            "type": "argument",
                            "side": r["side"],
                            "score": r["score"],
                            "size": 18
                        })
                
                # Get Topics
                topics_result = session.run("""
                    MATCH (t:Topic)
                    OPTIONAL MATCH (q:Query)-[:ABOUT]->(t)
                    RETURN t.name as name, count(q) as cnt
                    ORDER BY cnt DESC LIMIT 15
                """)
                for r in topics_result:
                    if r["name"] and r["cnt"] > 0:
                        nodes.append({
                            "id": r["name"],
                            "label": r["name"],
                            "type": "topic",
                            "size": min(35, (r["cnt"] or 1) * 8 + 15)
                        })
                
                # Get relationships
                # Claim → Evidence
                ce_result = session.run("""
                    MATCH (c:Claim)-[:SUPPORTED_BY]->(e:Evidence)
                    RETURN c.text as claim, e.text as evidence
                    LIMIT 30
                """)
                for r in ce_result:
                    if r["claim"] and r["evidence"]:
                        edges.append({
                            "source": r["claim"][:50],
                            "target": r["evidence"][:50],
                            "type": "SUPPORTED_BY",
                            "weight": 2
                        })
                
                # Argument → CounterArgument
                aa_result = session.run("""
                    MATCH (a1:Argument)-[:COUNTERED_BY]->(a2:Argument)
                    RETURN a1.text as arg1, a2.text as arg2
                    LIMIT 20
                """)
                for r in aa_result:
                    if r["arg1"] and r["arg2"]:
                        edges.append({
                            "source": r["arg1"][:50],
                            "target": r["arg2"][:50],
                            "type": "COUNTERED_BY",
                            "weight": 3
                        })
            
            print(f"✅ Rich Graph: {len(nodes)} nodes, {len(edges)} edges")
            return {"nodes": nodes, "edges": edges}
            
        except Exception as e:
            print(f"❌ Rich graph error: {e}")
            return {"nodes": [], "edges": []}
    
    def add_research_entry(self, research_query: str, answer: str, sources: List[Dict], 
                           confidence: float, topics: List[str], session_id: str):
        """Store a research session - SIMPLIFIED"""
        if not self.driver:
            return False
        
        try:
            q = research_query[:200]  # Truncate
            with self.driver.session() as session:
                # Create topic nodes
                for topic in topics:
                    topic = topic.strip()
                    if topic and len(topic) > 2:
                        session.run("MERGE (t:Topic {name: $topic})", topic=topic)
                
                # Create user if not exists
                session.run("MERGE (u:User {id: $uid})", uid=session_id)
                
                # Create research node
                session.run("""
                    MATCH (u:User {id: $uid})
                    CREATE (r:ResearchSession {
                        query: $q,
                        confidence: $conf,
                        timestamp: datetime()
                    })
                    CREATE (u)-[:CONDUCTED]->(r)
                """, uid=session_id, q=q, conf=confidence)
                
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
                           COUNT { (related)<-[:ABOUT]-() } as research_count
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

        # ========== RICH GRAPH METHODS (PHASE 3) ==========
    
    def create_claim_node(self, claim_text: str, source_module: str, confidence: float, 
                          session_id: str = "guest_user") -> bool:
        """Create a Claim node from research findings"""
        if not self.driver:
            return False
        try:
            with self.driver.session() as session:
                session.run("""
                    MERGE (c:Claim {text: $text})
                    SET c.source_module = $module,
                        c.confidence = $confidence,
                        c.session_id = $session_id,
                        c.created_at = datetime()
                """, text=claim_text[:300], module=source_module, 
                    confidence=confidence, session_id=session_id)
                return True
        except Exception as e:
            print(f"  ⚠️ Claim error: {e}")
            return False
    
    def create_evidence_node(self, evidence_text: str, source_url: str = "", 
                             source_title: str = "") -> bool:
        """Create an Evidence node from sources"""
        if not self.driver:
            return False
        try:
            with self.driver.session() as session:
                session.run("""
                    MERGE (e:Evidence {text: $text})
                    SET e.source_url = $url,
                        e.source_title = $title,
                        e.created_at = datetime()
                """, text=evidence_text[:300], url=source_url, title=source_title[:200])
                return True
        except Exception as e:
            print(f"  ⚠️ Evidence error: {e}")
            return False
    
    def create_argument_node(self, argument_text: str, side: str, score: float,
                             debate_topic: str = "", session_id: str = "guest_user") -> bool:
        """Create an Argument node (FOR or AGAINST)"""
        if not self.driver:
            return False
        try:
            with self.driver.session() as session:
                session.run("""
                    MERGE (a:Argument {text: $text})
                    SET a.side = $side,
                        a.score = $score,
                        a.debate_topic = $topic,
                        a.session_id = $session_id,
                        a.created_at = datetime()
                """, text=argument_text[:300], side=side, score=score, 
                    topic=debate_topic[:200], session_id=session_id)
                return True
        except Exception as e:
            print(f"  ⚠️ Argument error: {e}")
            return False
    
    def link_claim_to_evidence(self, claim_text: str, evidence_text: str):
        """Link a Claim to supporting Evidence"""
        if not self.driver:
            return
        try:
            with self.driver.session() as session:
                session.run("""
                    MATCH (c:Claim {text: $claim})
                    MATCH (e:Evidence {text: $evidence})
                    MERGE (c)-[:SUPPORTED_BY]->(e)
                """, claim=claim_text[:300], evidence=evidence_text[:300])
                print(f"  🔗 Linked Claim → Evidence")
        except Exception as e:
            print(f"  ⚠️ Link error: {e}")
    
    def link_argument_to_counterargument(self, for_text: str, against_text: str):
        """Link FOR argument to AGAINST counterargument"""
        if not self.driver:
            return
        try:
            with self.driver.session() as session:
                session.run("""
                    MATCH (a1:Argument {text: $for_text})
                    MATCH (a2:Argument {text: $against_text})
                    MERGE (a1)-[:COUNTERED_BY]->(a2)
                """, for_text=for_text[:300], against_text=against_text[:300])
                print(f"  🔗 Linked FOR → AGAINST")
        except Exception as e:
            print(f"  ⚠️ Link error: {e}")
    
    def link_research_to_debate(self, research_query: str, debate_topic: str, 
                                similarity_score: float = 0.5):
        """Cross-link a research query to a related debate topic"""
        if not self.driver:
            return
        try:
            with self.driver.session() as session:
                session.run("""
                    MATCH (r:ResearchSession {query: $research})
                    MERGE (d:DebateTopic {name: $debate})
                    MERGE (r)-[rel:RELATED_TO]->(d)
                    SET rel.similarity = $score
                """, research=research_query[:200], debate=debate_topic[:200], 
                    score=similarity_score)
                print(f"  🔗 Cross-linked Research → Debate (similarity: {similarity_score})")
        except Exception as e:
            print(f"  ⚠️ Cross-link error: {e}")
    
    def get_rich_graph(self) -> Dict:
        """Get enriched graph with Claims, Evidence, Arguments, Topics"""
        if not self.driver:
            return {"nodes": [], "edges": []}
        
        nodes = []
        edges = []
        
        try:
            with self.driver.session() as session:
                # ── Get Claims ──
                claims_result = session.run("""
                    MATCH (c:Claim)
                    OPTIONAL MATCH (c)-[:SUPPORTED_BY]->(e:Evidence)
                    RETURN c.text as text, c.source_module as module, 
                           c.confidence as confidence, count(e) as evidence_count
                    ORDER BY c.confidence DESC LIMIT 20
                """)
                for r in claims_result:
                    if r["text"]:
                        nodes.append({
                            "id": "claim_" + r["text"][:30],
                            "label": r["text"][:60],
                            "type": "claim",
                            "module": r["module"] or "research",
                            "confidence": r["confidence"] or 0,
                            "size": 18 + (r["evidence_count"] or 0) * 6
                        })
                
                # ── Get Evidence ──
                evidence_result = session.run("""
                    MATCH (e:Evidence)
                    RETURN e.text as text, e.source_title as title, e.source_url as url
                    LIMIT 20
                """)
                for r in evidence_result:
                    if r["text"]:
                        nodes.append({
                            "id": "evidence_" + r["text"][:30],
                            "label": (r["title"] or r["text"])[:60],
                            "type": "evidence",
                            "url": r["url"] or "",
                            "size": 14
                        })
                
                # ── Get Arguments ──
                args_result = session.run("""
                    MATCH (a:Argument)
                    RETURN a.text as text, a.side as side, a.score as score, 
                           a.debate_topic as topic
                    LIMIT 20
                """)
                for r in args_result:
                    if r["text"]:
                        nodes.append({
                            "id": "arg_" + r["text"][:30],
                            "label": f"[{r['side']}] {r['text'][:50]}",
                            "type": "argument",
                            "side": r["side"] or "FOR",
                            "score": r["score"] or 5,
                            "size": 20
                        })
                
                # ── Get Topics ──
                topics_result = session.run("""
                    MATCH (t:Topic)
                    OPTIONAL MATCH (q:Query)-[:ABOUT]->(t)
                    WITH t, count(q) as cnt
                    WHERE cnt > 0
                    RETURN t.name as name, cnt as research_count
                    ORDER BY cnt DESC LIMIT 15
                """)
                for r in topics_result:
                    if r["name"]:
                        nodes.append({
                            "id": "topic_" + r["name"],
                            "label": r["name"],
                            "type": "topic",
                            "size": min(35, (r["research_count"] or 1) * 8 + 15)
                        })
                
                # ── Get Debate Topics ──
                debate_topics_result = session.run("""
                    MATCH (d:DebateTopic)
                    OPTIONAL MATCH (ds:DebateSession)-[:DEBATE_ABOUT]->(d)
                    RETURN d.name as name, count(ds) as debate_count
                    ORDER BY debate_count DESC LIMIT 10
                """)
                for r in debate_topics_result:
                    if r["name"]:
                        nodes.append({
                            "id": "debate_" + r["name"],
                            "label": r["name"],
                            "type": "debate_topic",
                            "size": min(30, (r["debate_count"] or 1) * 10 + 12)
                        })
                
                # ── Get Edges: Claim → Evidence ──
                ce_result = session.run("""
                    MATCH (c:Claim)-[:SUPPORTED_BY]->(e:Evidence)
                    RETURN c.text as claim, e.text as evidence
                    LIMIT 30
                """)
                for r in ce_result:
                    if r["claim"] and r["evidence"]:
                        edges.append({
                            "source": "claim_" + r["claim"][:30],
                            "target": "evidence_" + r["evidence"][:30],
                            "type": "SUPPORTED_BY",
                            "color": "#00ff0f",
                            "weight": 2
                        })
                
                # ── Get Edges: Argument → CounterArgument ──
                aa_result = session.run("""
                    MATCH (a1:Argument)-[:COUNTERED_BY]->(a2:Argument)
                    RETURN a1.text as arg1, a2.text as arg2
                    LIMIT 20
                """)
                for r in aa_result:
                    if r["arg1"] and r["arg2"]:
                        edges.append({
                            "source": "arg_" + r["arg1"][:30],
                            "target": "arg_" + r["arg2"][:30],
                            "type": "COUNTERED_BY",
                            "color": "#ff2040",
                            "weight": 3
                        })
                
                # ── Get Edges: Research → Debate ──
                rd_result = session.run("""
                    MATCH (r:ResearchSession)-[rel:RELATED_TO]->(d:DebateTopic)
                    RETURN r.query as research, d.name as debate, rel.similarity as similarity
                    LIMIT 20
                """)
                for rec in rd_result:
                    if rec["research"] and rec["debate"]:
                        edges.append({
                            "source": "topic_" + rec["research"][:30],
                            "target": "debate_" + rec["debate"],
                            "type": "RELATED_TO",
                            "color": "#00ccff",
                            "weight": rec["similarity"] or 0.5
                        })
                
                # ── Get Edges: Topic → Topic (via shared research) ──
                tt_result = session.run("""
                    MATCH (t1:Topic)<-[:ABOUT]-(q:Query)-[:ABOUT]->(t2:Topic)
                    WHERE t1.name < t2.name
                    RETURN t1.name as topic1, t2.name as topic2, count(q) as weight
                    ORDER BY weight DESC LIMIT 30
                """)
                for r in tt_result:
                    if r["topic1"] and r["topic2"]:
                        edges.append({
                            "source": "topic_" + r["topic1"],
                            "target": "topic_" + r["topic2"],
                            "type": "CO_OCCURS",
                            "color": "rgba(255,255,255,0.3)",
                            "weight": r["weight"] or 1
                        })
            
            print(f"✅ Rich Graph: {len(nodes)} nodes, {len(edges)} edges")
            return {"nodes": nodes, "edges": edges}
            
        except Exception as e:
            print(f"❌ Rich graph error: {e}")
            return {"nodes": [], "edges": []}
    
    def seed_rich_demo(self):
        """Seed demo data with rich node types for testing"""
        if not self.driver:
            return {"status": "error", "message": "Neo4j not connected"}
        
        try:
            # Create sample claims
            claims = [
                ("AI can reduce medical diagnosis errors by 30%", "research", 85),
                ("Neural networks mimic human brain structure", "research", 90),
                ("AI regulation is necessary for public safety", "debate", 70),
                ("Unregulated AI poses existential risk", "debate", 75),
            ]
            
            for claim_text, module, conf in claims:
                self.create_claim_node(claim_text, module, conf)
            
            # Create sample evidence
            evidence_items = [
                ("Study shows AI diagnosis matches expert doctors in 94% of cases", "Nature Medicine 2024", "https://nature.com/ai-diagnosis"),
                ("Neural networks use layered architecture similar to cortical columns", "Science 2023", "https://science.org/neural-nets"),
                ("EU AI Act provides comprehensive regulatory framework", "EU Commission 2024", "https://ec.europa.eu/ai-act"),
            ]
            
            for evidence_text, title, url in evidence_items:
                self.create_evidence_node(evidence_text, url, title)
            
            # Link claims to evidence
            self.link_claim_to_evidence(claims[0][0], evidence_items[0][0])
            self.link_claim_to_evidence(claims[1][0], evidence_items[1][0])
            self.link_claim_to_evidence(claims[2][0], evidence_items[2][0])
            
            # Create sample arguments
            self.create_argument_node("AI regulation protects citizens from biased algorithms", "FOR", 8, "Should AI be regulated?")
            self.create_argument_node("Over-regulation stifles innovation and economic growth", "AGAINST", 7, "Should AI be regulated?")
            
            # Link arguments
            self.link_argument_to_counterargument(
                "AI regulation protects citizens from biased algorithms",
                "Over-regulation stifles innovation and economic growth"
            )
            
            return {"status": "ok", "message": "Rich demo data seeded"}
            
        except Exception as e:
            return {"status": "error", "message": str(e)}
# Global instance
kg = KnowledgeGraph()