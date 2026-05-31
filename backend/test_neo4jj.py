import sqlite3
conn = sqlite3.connect('polynous.db')
cursor = conn.cursor()

# Check current columns
cursor.execute("PRAGMA table_info(debate_history)")
columns = [c[1] for c in cursor.fetchall()]
print("Current debate_history columns:", columns)

# Check if sources column exists
if 'sources' in columns:
    print("❌ sources column STILL exists — nuclear fix didn't work")
else:
    print("✅ sources column removed — table is clean")
    print("Columns:", columns)

conn.close()