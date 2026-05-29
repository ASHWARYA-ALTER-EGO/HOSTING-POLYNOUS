from neo4j import GraphDatabase
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv
from datetime import datetime
import re

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
    
    # ═══════════════════════════════════════════════════════════
    # NODE CREATION METHODS
    # ═══════════════════════════════════════════════════════════
    
    def create_claim_node(self, claim_text: str, source_module: str, confidence: float, 
                          session_id: str = "guest_user") -> bool:
        if not self.driver: return False
        try:
            with self.driver.session() as session:
                session.run("""
                    MERGE (c:Claim {text: $text})
                    SET c.source_module = $module, c.confidence = $confidence,
                        c.session_id = $session_id, c.created_at = datetime()
                """, text=claim_text[:300], module=source_module, 
                    confidence=confidence, session_id=session_id)
                return True
        except Exception as e:
            print(f"  ⚠️ Claim error: {e}"); return False
    
    def create_evidence_node(self, evidence_text: str, source_url: str = "", 
                             source_title: str = "") -> bool:
        if not self.driver: return False
        try:
            with self.driver.session() as session:
                session.run("""
                    MERGE (e:Evidence {text: $text})
                    SET e.source_url = $url, e.source_title = $title, e.created_at = datetime()
                """, text=evidence_text[:300], url=source_url, title=source_title[:200])
                return True
        except Exception as e:
            print(f"  ⚠️ Evidence error: {e}"); return False
    
    def create_argument_node(self, argument_text: str, side: str, score: float,
                             debate_topic: str = "", session_id: str = "guest_user") -> bool:
        if not self.driver: return False
        try:
            with self.driver.session() as session:
                session.run("""
                    MERGE (a:Argument {text: $text})
                    SET a.side = $side, a.score = $score, a.debate_topic = $topic,
                        a.session_id = $session_id, a.created_at = datetime()
                """, text=argument_text[:300], side=side, score=score, 
                    topic=debate_topic[:200], session_id=session_id)
                return True
        except Exception as e:
            print(f"  ⚠️ Argument error: {e}"); return False
    
    # ═══════════════════════════════════════════════════════════
    # RELATIONSHIP METHODS
    # ═══════════════════════════════════════════════════════════
    
    def link_claim_to_evidence(self, claim_text: str, evidence_text: str):
        if not self.driver: return
        try:
            with self.driver.session() as session:
                session.run("""
                    MATCH (c:Claim {text: $claim}) MATCH (e:Evidence {text: $evidence})
                    MERGE (c)-[:SUPPORTED_BY]->(e)
                """, claim=claim_text[:300], evidence=evidence_text[:300])
        except Exception as e: print(f"  ⚠️ Link error: {e}")
    
    def link_argument_to_counterargument(self, for_text: str, against_text: str):
        if not self.driver: return
        try:
            with self.driver.session() as session:
                session.run("""
                    MATCH (a1:Argument {text: $for_text}) MATCH (a2:Argument {text: $against_text})
                    MERGE (a1)-[:COUNTERED_BY]->(a2)
                """, for_text=for_text[:300], against_text=against_text[:300])
        except Exception as e: print(f"  ⚠️ Link error: {e}")
    
    def link_entities(self, entity1: str, entity2: str, context: str = ""):
        if not self.driver: return
        try:
            with self.driver.session() as session:
                session.run("""
                    MERGE (e1:Entity {name: $e1}) MERGE (e2:Entity {name: $e2})
                    MERGE (e1)-[r:CO_OCCURS_WITH]-(e2)
                    SET r.count = coalesce(r.count, 0) + 1, r.last_seen = datetime(), r.context = $context
                """, e1=entity1.strip(), e2=entity2.strip(), context=context[:200])
        except Exception as e: print(f"  ⚠️ Link error: {e}")
    
    def link_research_to_debate(self, research_query: str, debate_topic: str, similarity_score: float = 0.5):
        if not self.driver: return
        try:
            with self.driver.session() as session:
                session.run("""
                    MATCH (r:ResearchSession {query: $research}) MERGE (d:DebateTopic {name: $debate})
                    MERGE (r)-[rel:RELATED_TO]->(d) SET rel.similarity = $score
                """, research=research_query[:200], debate=debate_topic[:200], score=similarity_score)
        except Exception as e: print(f"  ⚠️ Cross-link error: {e}")
    
    # ═══════════════════════════════════════════════════════════
    # STORAGE METHODS
    # ═══════════════════════════════════════════════════════════
    
    def add_research_entry(self, research_query: str, answer: str, sources: List[Dict], 
                           confidence: float, topics: List[str], session_id: str):
        if not self.driver: return False
        try:
            with self.driver.session() as session:
                for topic in topics:
                    if topic.strip() and len(topic.strip()) > 2:
                        session.run("MERGE (t:Topic {name: $topic})", topic=topic.strip())
                session.run("MERGE (u:User {id: $uid})", uid=session_id)
                session.run("""
                    MATCH (u:User {id: $uid})
                    CREATE (r:ResearchSession {query: $q, confidence: $conf, timestamp: datetime()})
                    CREATE (u)-[:CONDUCTED]->(r)
                """, uid=session_id, q=research_query[:200], conf=confidence)
                print(f"✅ Stored in KG: {len(topics)} topics"); return True
        except Exception as e:
            print(f"⚠️ KG error: {e}"); return False
    
    def extract_and_link_entities(self, text: str) -> List[str]:
        entities = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
        unique_entities = list(set(entities))[:8]
        if not self.driver or len(unique_entities) < 2: return unique_entities
        try:
            for i in range(len(unique_entities)):
                for j in range(i+1, len(unique_entities)):
                    self.link_entities(unique_entities[i], unique_entities[j], context=text[:200])
            print(f"✅ Linked {len(unique_entities)} entities")
        except Exception as e: print(f"❌ Entity linking error: {e}")
        return unique_entities
    
    # ═══════════════════════════════════════════════════════════
    # GRAPH QUERY METHODS
    # ═══════════════════════════════════════════════════════════
    
    def find_connections(self, entity1: str, entity2: str, max_depth: int = 3) -> List[Dict]:
        if not self.driver: return []
        try:
            with self.driver.session() as session:
                result = session.run("""
                    MATCH path = shortestPath((e1:Entity {name: $e1})-[*..%d]-(e2:Entity {name: $e2}))
                    RETURN [node in nodes(path) | node.name] as path,
                           [rel in relationships(path) | type(rel)] as relationships, length(path) as hops
                    ORDER BY hops LIMIT 5
                """ % max_depth, e1=entity1, e2=entity2)
                return [{"path": r["path"], "path_display": " → ".join(r["path"]),
                         "relationships": r["relationships"], "hops": r["hops"]} for r in result]
        except Exception as e: print(f"❌ Connection error: {e}"); return []
    
    def get_related_topics(self, topic: str, depth: int = 2, limit: int = 10) -> List[Dict]:
        if not self.driver: return []
        try:
            with self.driver.session() as session:
                result = session.run("""
                    MATCH (t:Topic {name: $topic}) MATCH (t)-[*1..%d]-(related:Topic) WHERE related <> t
                    RETURN related.name as topic, COUNT { (related)<-[:ABOUT]-() } as research_count
                    ORDER BY research_count DESC LIMIT $limit
                """ % depth, topic=topic, limit=limit)
                return [{"topic": r["topic"], "research_count": r["research_count"]} for r in result]
        except Exception as e: print(f"❌ Related topics error: {e}"); return []
    
    # ═══════════════════════════════════════════════════════════
    # GRAPH DATA METHODS
    # ═══════════════════════════════════════════════════════════
    
    def get_user_knowledge_graph(self, session_id: str = None) -> Dict:
        """Get complete knowledge graph with ALL node types"""
        if not self.driver: return {"nodes": [], "edges": []}
        nodes, edges = [], []
        try:
            with self.driver.session() as session:
                # Topics
                try:
                    for r in session.run("""
                        MATCH (t:Topic) OPTIONAL MATCH (r:ResearchSession)-[:ABOUT]->(t)
                        WITH t, count(r) as cnt WHERE cnt > 0
                        RETURN t.name as name, cnt as count ORDER BY cnt DESC LIMIT 20
                    """):
                        nodes.append({"id":"topic_"+str(r["name"]),"label":r["name"],"type":"topic","size":min(40,(r["count"]or 1)*8+15),"connections":r["count"]or 0})
                except: pass
                # Debate Topics
                try:
                    for r in session.run("""
                        MATCH (d:DebateTopic) OPTIONAL MATCH (ds:DebateSession)-[:DEBATE_ABOUT]->(d)
                        WITH d, count(ds) as cnt WHERE cnt > 0
                        RETURN d.name as name, cnt as count ORDER BY cnt DESC LIMIT 10
                    """):
                        nodes.append({"id":"debate_"+str(r["name"]),"label":r["name"],"type":"debate_topic","size":min(35,(r["count"]or 1)*10+12),"connections":r["count"]or 0})
                except: pass
                # Entities
                try:
                    for r in session.run("""
                        MATCH (e:Entity) OPTIONAL MATCH (e)-[r:CO_OCCURS_WITH]-()
                        RETURN e.name as name, count(r) as count ORDER BY count DESC LIMIT 20
                    """):
                        if r["name"] and r["count"]>0:
                            nodes.append({"id":"entity_"+r["name"],"label":r["name"],"type":"entity","size":min(35,(r["count"]or 1)*6+15),"connections":r["count"]or 0})
                except: pass
                # Claims
                try:
                    for r in session.run("""
                        MATCH (c:Claim) OPTIONAL MATCH (c)-[:SUPPORTED_BY]->(e:Evidence)
                        RETURN c.text as text, c.confidence as confidence, count(e) as count ORDER BY c.confidence DESC LIMIT 15
                    """):
                        if r["text"]:
                            nodes.append({"id":"claim_"+r["text"][:40],"label":r["text"][:60],"type":"claim","size":min(35,18+(r["count"]or 0)*6),"confidence":r["confidence"]or 0,"connections":r["count"]or 0})
                except: pass
                # Evidence
                try:
                    for r in session.run("MATCH (e:Evidence) RETURN e.text as text, e.source_title as title LIMIT 15"):
                        if r["text"]: nodes.append({"id":"evidence_"+r["text"][:40],"label":(r["title"]or r["text"])[:60],"type":"evidence","size":16})
                except: pass
                # Arguments
                try:
                    for r in session.run("MATCH (a:Argument) RETURN a.text as text, a.side as side, a.score as score LIMIT 15"):
                        if r["text"]: nodes.append({"id":"arg_"+r["text"][:40],"label":f"[{r['side']or'?'}] {r['text'][:50]}","type":"argument","side":r["side"]or"FOR","score":r["score"]or 5,"size":22})
                except: pass
                # Deduplicate
                seen, uniq = set(), []
                for n in nodes:
                    if n["id"] not in seen: seen.add(n["id"]); uniq.append(n)
                nodes = uniq
                # Edges - Topic co-occurrence
                try:
                    for r in session.run("""
                        MATCH (t1:Topic)<-[:ABOUT]-(r:ResearchSession)-[:ABOUT]->(t2:Topic) WHERE t1.name < t2.name
                        RETURN t1.name as s, t2.name as t, count(r) as w ORDER BY w DESC LIMIT 30
                    """):
                        edges.append({"source":"topic_"+r["s"],"target":"topic_"+r["t"],"type":"CO_OCCURS","weight":r["w"]or 1,"color":"rgba(168,85,247,0.4)"})
                except: pass
                # Edges - Entity
                try:
                    for r in session.run("""
                        MATCH (e1:Entity)-[r:CO_OCCURS_WITH]-(e2:Entity) WHERE e1.name < e2.name
                        RETURN e1.name as s, e2.name as t, r.count as w ORDER BY w DESC LIMIT 20
                    """):
                        edges.append({"source":"entity_"+r["s"],"target":"entity_"+r["t"],"type":"CO_OCCURS","weight":r["w"]or 1,"color":"rgba(29,171,130,0.4)"})
                except: pass
                # Edges - Claim→Evidence
                try:
                    for r in session.run("MATCH (c:Claim)-[:SUPPORTED_BY]->(e:Evidence) RETURN c.text as s, e.text as t LIMIT 20"):
                        if r["s"] and r["t"]: edges.append({"source":"claim_"+r["s"][:40],"target":"evidence_"+r["t"][:40],"type":"SUPPORTED_BY","weight":2,"color":"#00ff0f99"})
                except: pass
                # Edges - Argument→CounterArgument
                try:
                    for r in session.run("MATCH (a1:Argument)-[:COUNTERED_BY]->(a2:Argument) RETURN a1.text as s, a2.text as t LIMIT 20"):
                        if r["s"] and r["t"]: edges.append({"source":"arg_"+r["s"][:40],"target":"arg_"+r["t"][:40],"type":"COUNTERED_BY","weight":3,"color":"#ff204099"})
                except: pass
                # Fallback edges
                if not edges and len(nodes) >= 2:
                    edges = self._generate_edges_from_labels(nodes)
                print(f"✅ Basic Graph: {len(nodes)} nodes, {len(edges)} edges")
                return {"nodes": nodes, "edges": edges}
        except Exception as e:
            print(f"❌ Graph error: {e}"); return {"nodes": [], "edges": []}
    
    def get_rich_graph(self) -> Dict:
        """Get enriched graph with Claims, Evidence, Arguments, Topics"""
        if not self.driver: return {"nodes": [], "edges": []}
        nodes, edges = [], []
        try:
            with self.driver.session() as session:
                for r in session.run("""
                    MATCH (c:Claim) OPTIONAL MATCH (c)-[:SUPPORTED_BY]->(e:Evidence)
                    RETURN c.text as t, c.source_module as m, c.confidence as cf, count(e) as ec ORDER BY cf DESC LIMIT 20
                """):
                    if r["t"]: nodes.append({"id":"claim_"+r["t"][:30],"label":r["t"][:60],"type":"claim","module":r["m"]or"research","confidence":r["cf"]or 0,"size":18+(r["ec"]or 0)*6})
                for r in session.run("MATCH (e:Evidence) RETURN e.text as t, e.source_title as tl LIMIT 20"):
                    if r["t"]: nodes.append({"id":"evidence_"+r["t"][:30],"label":(r["tl"]or r["t"])[:60],"type":"evidence","size":14})
                for r in session.run("MATCH (a:Argument) RETURN a.text as t, a.side as s, a.score as sc LIMIT 20"):
                    if r["t"]: nodes.append({"id":"arg_"+r["t"][:30],"label":f"[{r['s']}] {r['t'][:50]}","type":"argument","side":r["s"]or"FOR","score":r["sc"]or 5,"size":20})
                for r in session.run("""
                    MATCH (t:Topic) OPTIONAL MATCH (q:Query)-[:ABOUT]->(t) WITH t, count(q) as cnt WHERE cnt > 0
                    RETURN t.name as n, cnt as c ORDER BY c DESC LIMIT 15
                """):
                    if r["n"]: nodes.append({"id":"topic_"+r["n"],"label":r["n"],"type":"topic","size":min(35,(r["c"]or 1)*8+15)})
                for r in session.run("""
                    MATCH (d:DebateTopic) OPTIONAL MATCH (ds:DebateSession)-[:DEBATE_ABOUT]->(d)
                    RETURN d.name as n, count(ds) as c ORDER BY c DESC LIMIT 10
                """):
                    if r["n"]: nodes.append({"id":"debate_"+r["n"],"label":r["n"],"type":"debate_topic","size":min(30,(r["c"]or 1)*10+12)})
                for r in session.run("MATCH (c:Claim)-[:SUPPORTED_BY]->(e:Evidence) RETURN c.text as s, e.text as t LIMIT 30"):
                    if r["s"] and r["t"]: edges.append({"source":"claim_"+r["s"][:30],"target":"evidence_"+r["t"][:30],"type":"SUPPORTED_BY","color":"#00ff0f","weight":2})
                for r in session.run("MATCH (a1:Argument)-[:COUNTERED_BY]->(a2:Argument) RETURN a1.text as s, a2.text as t LIMIT 20"):
                    if r["s"] and r["t"]: edges.append({"source":"arg_"+r["s"][:30],"target":"arg_"+r["t"][:30],"type":"COUNTERED_BY","color":"#ff2040","weight":3})
                for r in session.run("""
                    MATCH (t1:Topic)<-[:ABOUT]-(q:Query)-[:ABOUT]->(t2:Topic) WHERE t1.name < t2.name
                    RETURN t1.name as s, t2.name as t, count(q) as w ORDER BY w DESC LIMIT 30
                """):
                    if r["s"] and r["t"]: edges.append({"source":"topic_"+r["s"],"target":"topic_"+r["t"],"type":"CO_OCCURS","color":"rgba(255,255,255,0.3)","weight":r["w"]or 1})
            print(f"✅ Rich Graph: {len(nodes)} nodes, {len(edges)} edges")
            return {"nodes": nodes, "edges": edges}
        except Exception as e:
            print(f"❌ Rich graph error: {e}"); return {"nodes": [], "edges": []}
    
    def get_all_entities_with_relationships(self) -> Dict:
        return self.get_user_knowledge_graph()
    
    def _generate_edges_from_labels(self, nodes: List[Dict]) -> List[Dict]:
        edges, stop_words = [], {'the','and','of','in','to','a','is','for','on','with','ai'}
        for i in range(len(nodes)):
            wi = {w for w in nodes[i]['label'].lower().replace(',','').split() if len(w)>2 and w not in stop_words}
            for j in range(i+1, len(nodes)):
                wj = {w for w in nodes[j]['label'].lower().replace(',','').split() if len(w)>2 and w not in stop_words}
                if wi & wj: edges.append({"source":nodes[i]['id'],"target":nodes[j]['id'],"weight":len(wi & wj)})
        return edges
    
    def seed_rich_demo(self):
        if not self.driver: return {"status":"error","message":"Neo4j not connected"}
        try:
            claims = [("AI reduces medical diagnosis errors by 30%","research",85),("Neural networks mimic human brain structure","research",90),("AI regulation is necessary for public safety","debate",70),("Unregulated AI poses existential risk","debate",75)]
            for ct, cm, cc in claims: self.create_claim_node(ct, cm, cc)
            evidence = [("AI diagnosis matches expert doctors in 94% of cases","Nature Medicine 2024","https://nature.com"),("Neural networks use layered architecture like cortical columns","Science 2023","https://science.org"),("EU AI Act provides comprehensive regulatory framework","EU Commission 2024","https://ec.europa.eu")]
            for et, etl, eu in evidence: self.create_evidence_node(et, eu, etl)
            self.link_claim_to_evidence(claims[0][0], evidence[0][0])
            self.link_claim_to_evidence(claims[1][0], evidence[1][0])
            self.link_claim_to_evidence(claims[2][0], evidence[2][0])
            self.create_argument_node("AI regulation protects citizens from biased algorithms","FOR",8,"Should AI be regulated?")
            self.create_argument_node("Over-regulation stifles innovation and economic growth","AGAINST",7,"Should AI be regulated?")
            self.link_argument_to_counterargument("AI regulation protects citizens from biased algorithms","Over-regulation stifles innovation and economic growth")
            return {"status":"ok","message":"Rich demo data seeded"}
        except Exception as e: return {"status":"error","message":str(e)}

# Global instance
kg = KnowledgeGraph()