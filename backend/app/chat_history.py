from sqlalchemy.orm import Session
from app.models.user import Conversation, Message
from datetime import datetime
from typing import List, Optional, Dict
import sqlite3
import json
import os

# ─── SQLite Fallback (for sessions not yet in PostgreSQL) ───
DB_PATH = "polynous_chats.db"

def init_sqlite():
    """Create SQLite tables if they don't exist"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            user_query TEXT,
            answer TEXT,
            mode TEXT DEFAULT 'research',
            confidence REAL DEFAULT 0,
            sources TEXT DEFAULT '[]',
            topics TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS debate_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            topic TEXT,
            for_score REAL DEFAULT 5,
            against_score REAL DEFAULT 5,
            winner TEXT DEFAULT 'TIE',
            reasoning TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

# Initialize on import
init_sqlite()

# ─── SQLAlchemy ORM Manager (Primary) ─────────────────
class ChatHistoryManager:
    """Safely manage chat history with parameterized queries"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_conversation(self, user_id: int, title: str = "New Research", mode: str = "research") -> Conversation:
        """Create new conversation - SQLAlchemy auto-parameterizes"""
        conv = Conversation(
            user_id=user_id,
            title=title[:200],
            mode=mode,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self.db.add(conv)
        self.db.commit()
        self.db.refresh(conv)
        return conv
    
    def get_conversation(self, conv_id: int, user_id: int) -> Optional[Conversation]:
        """Get conversation by ID - parameterized query"""
        return self.db.query(Conversation).filter(
            Conversation.id == conv_id,
            Conversation.user_id == user_id
        ).first()
    
    def get_user_conversations(self, user_id: int, limit: int = 20) -> List[Conversation]:
        """Get user's conversations - parameterized query"""
        return self.db.query(Conversation).filter(
            Conversation.user_id == user_id
        ).order_by(Conversation.updated_at.desc()).limit(limit).all()
    
    def add_message(
        self, conv_id: int, role: str, content: str,
        sources: List[Dict] = None, confidence: float = 0
    ) -> Message:
        """Add message to conversation - parameterized query"""
        msg = Message(
            conversation_id=conv_id,
            role=role,
            content=content[:10000],
            sources=sources or [],
            confidence=confidence,
            created_at=datetime.utcnow()
        )
        self.db.add(msg)
        
        conv = self.db.query(Conversation).filter(Conversation.id == conv_id).first()
        if conv:
            conv.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(msg)
        return msg
    
    def delete_conversation(self, conv_id: int, user_id: int) -> bool:
        """Delete conversation - parameterized query"""
        conv = self.db.query(Conversation).filter(
            Conversation.id == conv_id,
            Conversation.user_id == user_id
        ).first()
        if conv:
            self.db.delete(conv)
            self.db.commit()
            return True
        return False
    
    def search_conversations(self, user_id: int, query: str) -> List[Conversation]:
        """Search conversations - safe LIKE query"""
        search_term = f"%{query[:100]}%"
        return self.db.query(Conversation).filter(
            Conversation.user_id == user_id,
            Conversation.title.ilike(search_term)
        ).limit(20).all()


# ─── SQLite Fallback Functions (for compatibility) ───
def save_chat(session_id: str, query: str, answer: str, 
              confidence: float = 0, sources: list = None, mode: str = "research"):
    """Save a chat entry to SQLite (fallback)"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO chat_history (session_id, user_query, answer, mode, confidence, sources) VALUES (?, ?, ?, ?, ?, ?)",
        (session_id, query, answer[:5000] if answer else "", mode, confidence, json.dumps(sources or []))
    )
    conn.commit()
    conn.close()

def save_debate(session_id: str, topic: str, for_score: float, against_score: float,
                winner: str, reasoning: str = ""):
    """Save debate to SQLite (fallback)"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO debate_history (session_id, topic, for_score, against_score, winner, reasoning) VALUES (?, ?, ?, ?, ?, ?)",
        (session_id, topic, for_score, against_score, winner, reasoning[:1000] if reasoning else "")
    )
    conn.commit()
    conn.close()

def get_chat_history(session_id: str = None, limit: int = 50):
    """Get chat history from SQLite (fallback)"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    if session_id:
        cursor.execute(
            "SELECT id, session_id, user_query as query, answer, mode, confidence, sources, created_at as timestamp FROM chat_history WHERE session_id = ? ORDER BY created_at DESC LIMIT ?", 
            (session_id, limit)
        )
    else:
        cursor.execute(
            "SELECT id, session_id, user_query as query, answer, mode, confidence, sources, created_at as timestamp FROM chat_history ORDER BY created_at DESC LIMIT ?", 
            (limit,)
        )
    
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for row in rows:
        result.append({
            "id": row["id"],
            "session_id": row["session_id"],
            "query": row["query"],
            "answer": row["answer"][:200] if row["answer"] else "",
            "mode": row["mode"] or "research",
            "confidence": row["confidence"] or 0,
            "timestamp": row["timestamp"] or "",
            "topics": (row["query"] or "").split()[:5] if row["query"] else []
        })
    
    return result

def get_debate_history(session_id: str = None, limit: int = 50):
    """Get debate history from SQLite (fallback)"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    if session_id:
        cursor.execute(
            "SELECT id, session_id, topic, for_score, against_score, winner, reasoning, created_at as timestamp FROM debate_history WHERE session_id = ? ORDER BY created_at DESC LIMIT ?",
            (session_id, limit)
        )
    else:
        cursor.execute(
            "SELECT id, session_id, topic, for_score, against_score, winner, reasoning, created_at as timestamp FROM debate_history ORDER BY created_at DESC LIMIT ?",
            (limit,)
        )
    
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for row in rows:
        result.append({
            "id": row["id"],
            "session_id": row["session_id"],
            "topic": row["topic"],
            "for_score": row["for_score"] or 5,
            "against_score": row["against_score"] or 5,
            "winner": row["winner"] or "TIE",
            "reasoning": row["reasoning"] or "",
            "timestamp": row["timestamp"] or ""
        })
    
    return result