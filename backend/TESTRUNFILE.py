from app.database import check_db_connection, SessionLocal
from app.models.user import User, Conversation, Message

# Test connection
check_db_connection()

# Count records
db = SessionLocal()
try:
    users_count = db.query(User).count()
    convs_count = db.query(Conversation).count()
    msgs_count = db.query(Message).count()
    
    print(f"\n📊 POSTGRESQL DATA:")
    print(f"   Users: {users_count}")
    print(f"   Conversations: {convs_count}")
    print(f"   Messages: {msgs_count}")
    
    # Show recent users
    users = db.query(User).limit(5).all()
    print(f"\n👤 RECENT USERS:")
    for u in users:
        print(f"   {u.username} ({u.email}) - Tier: {u.tier}")
finally:
    db.close()