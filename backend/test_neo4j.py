from neo4j import GraphDatabase

URI = "neo4j+s://a5160a78.databases.neo4j.io"
USERNAME = "a5160a78"
PASSWORD = "kl61Ztt6V_GeE830EnvotFjqYYQ6q71C-ecSYzacfSU"

try:
    driver = GraphDatabase.driver(
        URI,
        auth=(USERNAME, PASSWORD)
    )

    driver.verify_connectivity()
    print("✅ Connected Successfully!")

except Exception as e:
    print("❌ Error:")
    print(e)