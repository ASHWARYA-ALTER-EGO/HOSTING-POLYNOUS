
import sqlite3
import os

DB_PATH = "polynous_chats.db"

# Backup existing data
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Get existing chat data
cursor.execute("SELECT session_id, user_query, answer, mode, confidence, sources FROM chat_history")
chats = cursor.fetchall()

# Get existing debate data  
cursor.execute("SELECT session_id, topic, for_score, against_score, winner, reasoning FROM debate_history")
debates = cursor.fetchall()

conn.close()

# Delete old database
os.remove(DB_PATH)
print(f"Deleted old DB. Had {len(chats)} chats and {len(debates)} debates")

# Create new database with correct schema
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

cursor.execute("""
    CREATE TABLE chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT DEFAULT 'guest_user',
        user_query TEXT,
        answer TEXT,
        mode TEXT DEFAULT 'research',
        confidence REAL DEFAULT 0,
        sources TEXT DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
""")

cursor.execute("""
    CREATE TABLE debate_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT DEFAULT 'guest_user',
        topic TEXT,
        for_score REAL DEFAULT 5,
        against_score REAL DEFAULT 5,
        winner TEXT DEFAULT 'TIE',
        reasoning TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
""")

# Re-insert old data
import json
for chat in chats:
    cursor.execute(
        "INSERT INTO chat_history (session_id, user_query, answer, mode, confidence, sources) VALUES (?, ?, ?, ?, ?, ?)",
        (chat[0] or 'guest_user', chat[1], chat[2], chat[3] or 'research', chat[4] or 0, chat[5] or '[]')
    )

for debate in debates:
    cursor.execute(
        "INSERT INTO debate_history (session_id, topic, for_score, against_score, winner, reasoning) VALUES (?, ?, ?, ?, ?, ?)",
        (debate[0] or 'guest_user', debate[1], debate[2] or 5, debate[3] or 5, debate[4] or 'TIE', debate[5] or '')
    )

conn.commit()
conn.close()
print(f"✅ Recreated DB with {len(chats)} chats and {len(debates)} debates")
