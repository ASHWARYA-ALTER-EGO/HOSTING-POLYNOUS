from app.knowledge_graph.user_memory import user_memory

# Use the JWT token from your logged-in session to get the correct user ID.
# First, let's see which users exist in Neo4j.
with user_memory.driver.session() as s:
    result = s.run("MATCH (u:User) RETURN u.id AS uid")
    print("Neo4j Users:")
    for r in result:
        print(" ", r["uid"])

    # Check for debate sessions (any user)
    result = s.run("MATCH (d:DebateSession) RETURN d.topic AS topic, d.winner AS winner, d.user_id AS user_id")
    print("\nDebate Sessions stored:")
    for r in result:
        print(f"  {r['topic']} | Winner: {r['winner']} | User: {r['user_id']}")