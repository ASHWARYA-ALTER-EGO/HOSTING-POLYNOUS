import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "polynous.db")

class UserMemory:
    """SQLite-based user memory for research and debate history."""
    
    def __init__(self):
        self._init_db()
    
    def _init_db(self):
        """Create all tables if they don't exist."""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT,
                email TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Research history table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS research_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                query TEXT,
                answer TEXT,
                confidence REAL,
                topics TEXT,
                sources TEXT,
                mode TEXT DEFAULT 'research',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')
        
        # Debate history table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS debate_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                topic TEXT,
                for_score REAL,
                against_score REAL,
                winner TEXT,
                reasoning TEXT,
                sources TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')
        
        # User stats table (for quick analytics)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_stats (
                user_id TEXT PRIMARY KEY,
                total_queries INTEGER DEFAULT 0,
                total_debates INTEGER DEFAULT 0,
                avg_confidence REAL DEFAULT 0,
                topics_mapped INTEGER DEFAULT 0,
                last_active TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')
        
        conn.commit()
        conn.close()
        print("✅ SQLite user memory initialized at:", DB_PATH)
    
    def get_or_create_user(self, user_id: str, username: str = None, email: str = None):
        """Ensure user exists in database."""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            cursor.execute(
                "INSERT INTO users (id, username, email) VALUES (?, ?, ?)",
                (user_id, username or "Guest", email or f"{user_id}@polynous.ai")
            )
            cursor.execute(
                "INSERT INTO user_stats (user_id, total_queries, total_debates, avg_confidence, topics_mapped, last_active) VALUES (?, 0, 0, 0, 0, ?)",
                (user_id, datetime.now().isoformat())
            )
            conn.commit()
            print(f"✅ Created new user: {user_id}")
        
        conn.close()
        return user_id
    
    def record_research(self, user_id: str, query: str, answer: str, topics: List[str],
                        confidence: float, mode: str = "research", sources: List[Dict] = None):
        """Store a research session."""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        self.get_or_create_user(user_id)
        
        cursor.execute('''
            INSERT INTO research_history (user_id, query, answer, confidence, topics, sources, mode, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id, query[:500], answer[:5000] if answer else "", 
            confidence, json.dumps(topics), json.dumps(sources or []), mode,
            datetime.now().isoformat()
        ))
        
        # Update stats
        cursor.execute('''
            UPDATE user_stats 
            SET total_queries = total_queries + 1,
                avg_confidence = (avg_confidence * total_queries + ?) / (total_queries + 1),
                topics_mapped = topics_mapped + ?,
                last_active = ?
            WHERE user_id = ?
        ''', (confidence, len(topics), datetime.now().isoformat(), user_id))
        
        conn.commit()
        conn.close()
        print(f"✅ Recorded research: {query[:50]}... for {user_id}")
    
    def record_debate(self, user_id: str, topic: str, for_score: float, against_score: float,
                      winner: str, reasoning: str = "", sources: List[Dict] = None):
        """Store a debate session."""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        self.get_or_create_user(user_id)
        
        cursor.execute('''
            INSERT INTO debate_history (user_id, topic, for_score, against_score, winner, reasoning, sources, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id, topic[:500], for_score, against_score, winner,
            reasoning[:1000] if reasoning else "", json.dumps(sources or []),
            datetime.now().isoformat()
        ))
        
        cursor.execute('''
            UPDATE user_stats 
            SET total_debates = total_debates + 1,
                last_active = ?
            WHERE user_id = ?
        ''', (datetime.now().isoformat(), user_id))
        
        conn.commit()
        conn.close()
        print(f"✅ Recorded debate: {topic[:50]}... winner: {winner}")
    
    def get_user_stats(self, user_id: str) -> Dict:
        """Get user statistics."""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT total_queries, total_debates, avg_confidence, topics_mapped FROM user_stats WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                "total_research": row[0] or 0,
                "total_debates": row[1] or 0,
                "avg_confidence": row[2] or 0,
                "unique_topics": row[3] or 0
            }
        return {"total_research": 0, "total_debates": 0, "avg_confidence": 0, "unique_topics": 0}
    
    def get_recent_research(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Get recent research history."""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT query, answer, confidence, topics, sources, timestamp
            FROM research_history
            WHERE user_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        ''', (user_id, limit))
        rows = cursor.fetchall()
        conn.close()
        
        return [
            {
                "query": row[0],
                "answer": row[1][:300] if row[1] else "",
                "confidence": row[2],
                "topics": json.loads(row[3]) if row[3] else [],
                "sources": json.loads(row[4]) if row[4] else [],
                "timestamp": row[5]
            }
            for row in rows
        ]
    
    def get_debate_history(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Get debate history."""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT topic, for_score, against_score, winner, reasoning, sources, timestamp
            FROM debate_history
            WHERE user_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        ''', (user_id, limit))
        rows = cursor.fetchall()
        conn.close()
        
        return [
            {
                "topic": row[0],
                "for_score": row[1],
                "against_score": row[2],
                "winner": row[3],
                "reasoning": row[4],
                "sources": json.loads(row[5]) if row[5] else [],
                "timestamp": row[6]
            }
            for row in rows
        ]
    
    def get_user_interests(self, user_id: str, limit: int = 15) -> List[Dict]:
        """Extract user interests from research topics."""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT topics, timestamp
            FROM research_history
            WHERE user_id = ?
            ORDER BY timestamp DESC
            LIMIT 200
        ''', (user_id,))
        rows = cursor.fetchall()
        conn.close()
        
        topic_counts = {}
        for row in rows:
            topics = json.loads(row[0]) if row[0] else []
            for t in topics:
                topic_counts[t] = topic_counts.get(t, 0) + 1
        
        interests = [{"topic": k, "strength": min(10, v)} for k, v in sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:limit]]
        return interests
    
    def get_related_suggestions(self, user_id: str, current_topic: str, limit: int = 5) -> List[str]:
        """Suggest related topics based on past research."""
        interests = self.get_user_interests(user_id, 20)
        suggestions = [i["topic"] for i in interests if i["topic"].lower() != current_topic.lower()]
        return suggestions[:limit]
    
    def create_user_profile(self, user_id: str, username: str, email: str):
        """Alias for get_or_create_user."""
        self.get_or_create_user(user_id, username, email)
    
    def get_personalized_context(self, user_id: str, query: str) -> str:
        """Build context string from user's past research (used for enhancement)."""
        recent = self.get_recent_research(user_id, 3)
        if not recent:
            return ""
        context = "You previously researched:\n"
        for r in recent:
            context += f"- {r['query']}\n"
        return context

# Global instance
user_memory = UserMemory()
print("✅ SQLite User Memory ready")