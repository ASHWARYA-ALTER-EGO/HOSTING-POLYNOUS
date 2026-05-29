from neo4j import GraphDatabase
from typing import List, Dict, Optional
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

class UserMemoryGraph:
    def __init__(self):
        uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        user = os.getenv("NEO4J_USERNAME", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "password")
        
        try:
            self.driver = GraphDatabase.driver(uri, auth=(user, password))
            self.driver.verify_connectivity()
            print("✅ User Memory Graph Connected!")
        except Exception as e:
            print(f"⚠️ User Memory Graph not available: {e}")
            self.driver = None
    
    def create_user_profile(self, user_id: str, username: str, email: str):
        if not self.driver: return
        try:
            with self.driver.session() as session:
                session.run("""
                    MERGE (u:User {id: $user_id})
                    SET u.username = $username, u.email = $email,
                        u.last_active = datetime(),
                        u.total_sessions = coalesce(u.total_sessions, 0) + 1
                """, user_id=user_id, username=username, email=email)
        except Exception as e:
            print(f"❌ User profile error: {e}")
    
    def record_research(self, user_id: str, research_query: str, answer: str, 
                        topics: List[str], confidence: float, mode: str = "research",
                        sources: List[Dict] = None):
        if not self.driver: return
        try:
            with self.driver.session() as session:
                session.run("""
                    MATCH (u:User {id: $user_id})
                    CREATE (r:ResearchSession {
                        query: $research_query, answer: $answer,
                        confidence: $confidence, mode: $mode, timestamp: datetime()
                    })
                    CREATE (u)-[:CONDUCTED]->(r)
                """, user_id=user_id, research_query=research_query[:300], answer=answer[:500],
                    confidence=confidence, mode=mode)
                for topic in topics:
                    if topic.strip():
                        session.run("""
                            MATCH (u:User {id: $user_id})
                            MATCH (r:ResearchSession {query: $research_query})
                            MERGE (t:Topic {name: $topic})
                            CREATE (r)-[:ABOUT]->(t)
                            MERGE (u)-[i:INTERESTED_IN]->(t)
                            SET i.strength = coalesce(i.strength, 0) + 1,
                                i.last_researched = datetime()
                        """, user_id=user_id, research_query=research_query[:300], topic=topic.strip())
        except Exception as e:
            print(f"❌ Record research error: {e}")
    
    def record_debate(self, user_id: str, topic: str, for_score: float, 
                      against_score: float, winner: str):
        if not self.driver: return
        try:
            with self.driver.session() as session:
                session.run("""
                    MATCH (u:User {id: $user_id})
                    CREATE (d:DebateSession {
                        topic: $topic, for_score: $for_score,
                        against_score: $against_score, winner: $winner,
                        timestamp: datetime()
                    })
                    CREATE (u)-[:DEBATED]->(d)
                    MERGE (t:DebateTopic {name: $topic})
                    CREATE (d)-[:DEBATE_ABOUT]->(t)
                """, user_id=user_id, topic=topic[:200],
                    for_score=for_score, against_score=against_score, winner=winner)
        except Exception as e:
            print(f"❌ Record debate error: {e}")
    
    def get_user_interests(self, user_id: str, limit: int = 10) -> List[Dict]:
        if not self.driver: return []
        try:
            with self.driver.session() as session:
                result = session.run("""
                    MATCH (u:User {id: $user_id})-[i:INTERESTED_IN]->(t:Topic)
                    RETURN t.name as topic, i.strength as strength
                    ORDER BY i.strength DESC LIMIT $limit
                """, user_id=user_id, limit=limit)
                return [{"topic": r["topic"], "strength": r["strength"]} for r in result]
        except: return []
    
    def get_recent_research(self, user_id: str, limit: int = 10) -> List[Dict]:
        if not self.driver: return []
        try:
            with self.driver.session() as session:
                result = session.run("""
                    MATCH (u:User {id: $user_id})-[:CONDUCTED]->(r:ResearchSession)
                    OPTIONAL MATCH (r)-[:ABOUT]->(t:Topic)
                    RETURN r.query as query, r.mode as mode, r.confidence as confidence,
                           r.timestamp as timestamp, collect(t.name) as topics
                    ORDER BY r.timestamp DESC LIMIT $limit
                """, user_id=user_id, limit=limit)
                return [{
                    "query": r["query"][:100], "mode": r["mode"],
                    "confidence": r["confidence"],
                    "timestamp": str(r["timestamp"])[:19] if r["timestamp"] else None,
                    "topics": r["topics"]
                } for r in result]
        except: return []
    
    def get_user_stats(self, user_id: str) -> Dict:
        if not self.driver: return {"total_research": 0, "total_debates": 0, "avg_confidence": 0, "unique_topics": 0}
        try:
            with self.driver.session() as session:
                result = session.run("""
                    MATCH (u:User {id: $user_id})
                    OPTIONAL MATCH (u)-[:CONDUCTED]->(r:ResearchSession)
                    OPTIONAL MATCH (u)-[:DEBATED]->(d:DebateSession)
                    OPTIONAL MATCH (u)-[i:INTERESTED_IN]->(t:Topic)
                    RETURN u.username as username,
                           count(DISTINCT r) as total_research,
                           count(DISTINCT d) as total_debates,
                           coalesce(avg(r.confidence), 0) as avg_confidence,
                           count(DISTINCT t) as unique_topics
                """, user_id=user_id)
                r = result.single()
                if r: return {
                    "username": r["username"], "total_research": r["total_research"],
                    "total_debates": r["total_debates"], "avg_confidence": round(r["avg_confidence"], 1),
                    "unique_topics": r["unique_topics"]
                }
        except: pass
        return {"total_research": 0, "total_debates": 0, "avg_confidence": 0, "unique_topics": 0}
    
    def get_related_suggestions(self, user_id: str, current_topic: str, limit: int = 5) -> List[str]:
        if not self.driver: return []
        try:
            with self.driver.session() as session:
                result = session.run("""
                    MATCH (u:User {id: $user_id})-[i:INTERESTED_IN]->(t:Topic)
                    WHERE t.name <> $topic
                    RETURN t.name as topic ORDER BY i.strength DESC LIMIT $limit
                """, user_id=user_id, topic=current_topic, limit=limit)
                return [r["topic"] for r in result]
        except: return []

user_memory = UserMemoryGraph()
print("✅ User Memory System Ready!")