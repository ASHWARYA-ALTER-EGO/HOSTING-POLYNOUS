import sqlite3
conn = sqlite3.connect("polynous_chats.db")
cursor = conn.cursor()

# Update all existing rows to use guest_user
cursor.execute("UPDATE chat_history SET session_id = 'guest_user'")
cursor.execute("UPDATE debate_history SET session_id = 'guest_user'")

conn.commit()
print(f"✅ Updated {cursor.rowcount} rows to guest_user")
conn.close()