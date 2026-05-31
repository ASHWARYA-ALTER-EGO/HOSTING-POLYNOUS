# app/chat_history.py
import sqlite3
import os
import json
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
    print("✅ SQLite Chat History Ready!")

def save_chat(session_id: str, query: str, answer: str, 
              confidence: float = 0, sources: list = None, mode: str = "research"):
    """Save a chat entry"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO chat_history (session_id, user_query, answer, mode, confidence, sources) VALUES (?, ?, ?, ?, ?, ?)",
        (session_id, query, answer[:5000] if answer else "", mode, confidence, json.dumps(sources or []))
    )
    conn.commit()
    conn.close()
    print(f"💾 Chat saved: {query[:50]}...")

def save_debate(session_id: str, topic: str, for_score: float, against_score: float,
                winner: str, reasoning: str = ""):
    """Save debate to chat history"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO debate_history (session_id, topic, for_score, against_score, winner, reasoning) VALUES (?, ?, ?, ?, ?, ?)",
        (session_id, topic, for_score, against_score, winner, reasoning[:1000] if reasoning else "")
    )
    conn.commit()
    conn.close()
    print(f"💾 Debate saved: {topic[:50]}...")

def get_chat_history(session_id: str = None, limit: int = 50):
    """Get chat history"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # ← THIS IS THE FIX! Allows dict-like access
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
    
    # Convert to list of dicts
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
    
    print(f"📊 get_chat_history: Found {len(result)} entries for session={session_id}")
    return result

def get_debate_history(session_id: str = None, limit: int = 50):
    """Get debate history"""
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
    
    print(f"📊 get_debate_history: Found {len(result)} entries for session={session_id}")
    return result

# Initialize on import
init_db()