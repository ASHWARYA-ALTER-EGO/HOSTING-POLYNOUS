import sqlite3
import os
from datetime import datetime

DB_PATH = "polynous_chats.db"

def init_db():
    """Create tables if they don't exist"""
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
    print("✅ SQLite Chat History Ready!")

def save_chat(session_id: str, query: str, answer: str, mode: str = "research", 
              confidence: float = 0, sources: list = None):
    """Save a chat entry"""
    import json
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO chat_history (session_id, user_query, answer, mode, confidence, sources) VALUES (?, ?, ?, ?, ?, ?)",
        (session_id, query, answer[:1000], mode, confidence, json.dumps(sources or []))
    )
    conn.commit()
    conn.close()

def save_debate(session_id: str, topic: str, for_score: float, against_score: float, 
                winner: str, reasoning: str = ""):
    """Save a debate entry"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO debate_history (session_id, topic, for_score, against_score, winner, reasoning) VALUES (?, ?, ?, ?, ?, ?)",
        (session_id, topic, for_score, against_score, winner, reasoning)
    )
    conn.commit()
    conn.close()

def get_chat_history(session_id: str = None, limit: int = 20):
    """Get chat history"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    if session_id:
        cursor.execute("SELECT * FROM chat_history WHERE session_id = ? ORDER BY created_at DESC LIMIT ?", (session_id, limit))
    else:
        cursor.execute("SELECT * FROM chat_history ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [
        {"id": r[0], "session_id": r[1], "query": r[2], "answer": r[3][:200], 
         "mode": r[4], "confidence": r[5], "created_at": r[7]}
        for r in rows
    ]

def get_debate_history(session_id: str = None, limit: int = 20):
    """Get debate history"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    if session_id:
        cursor.execute("SELECT * FROM debate_history WHERE session_id = ? ORDER BY created_at DESC LIMIT ?", (session_id, limit))
    else:
        cursor.execute("SELECT * FROM debate_history ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [
        {"id": r[0], "session_id": r[1], "topic": r[2], "for_score": r[3],
         "against_score": r[4], "winner": r[5], "reasoning": r[6], "created_at": r[7]}
        for r in rows
    ]

# Initialize on import
init_db()