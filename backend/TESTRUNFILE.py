"""
POLYNOUS Data Isolation Test
Verifies that User A CANNOT see User B's research data
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

# Unique emails so we don't clash with existing users
TIMESTAMP = int(time.time())
USER_A_EMAIL = f"isolation_test_a_{TIMESTAMP}@polynous.ai"
USER_B_EMAIL = f"isolation_test_b_{TIMESTAMP}@polynous.ai"
PASSWORD = "TestPass!123"

print("=" * 60)
print("🔐 POLYNOUS DATA ISOLATION VERIFICATION")
print("=" * 60)

# ============================================================
# STEP 1: Register User A
# ============================================================
print("\n📌 STEP 1: Register User A...")
res_a = requests.post(f"{BASE_URL}/auth/register", json={
    "email": USER_A_EMAIL,
    "username": "user_a_isolation",
    "password": PASSWORD
})

if res_a.status_code == 200:
    token_a = res_a.json()["access_token"]
    user_id_a = res_a.json()["user_id"]
    print(f"   ✅ User A registered: {user_id_a[:20]}...")
else:
    print(f"   ❌ User A registration failed: {res_a.status_code} - {res_a.text[:150]}")
    exit(1)

# ============================================================
# STEP 2: Register User B
# ============================================================
print("\n📌 STEP 2: Register User B...")
res_b = requests.post(f"{BASE_URL}/auth/register", json={
    "email": USER_B_EMAIL,
    "username": "user_b_isolation",
    "password": PASSWORD
})

if res_b.status_code == 200:
    token_b = res_b.json()["access_token"]
    user_id_b = res_b.json()["user_id"]
    print(f"   ✅ User B registered: {user_id_b[:20]}...")
else:
    print(f"   ❌ User B registration failed: {res_b.status_code} - {res_b.text[:150]}")
    exit(1)

# ============================================================
# STEP 3: User A creates research
# ============================================================
print("\n📌 STEP 3: User A creates research...")
headers_a = {"Authorization": f"Bearer {token_a}"}

for query in ["What is artificial intelligence?", "How does machine learning work?"]:
    r = requests.post(f"{BASE_URL}/ask",
        json={"query": query, "debate_mode": False},
        headers=headers_a
    )
    if r.status_code == 200:
        print(f"   ✅ User A researched: '{query[:50]}...'")
    else:
        print(f"   ⚠️  Research failed: {r.status_code}")

# ============================================================
# STEP 4: User B creates DIFFERENT research
# ============================================================
print("\n📌 STEP 4: User B creates DIFFERENT research...")
headers_b = {"Authorization": f"Bearer {token_b}"}

for query in ["What is quantum computing?", "How does blockchain work?"]:
    r = requests.post(f"{BASE_URL}/ask",
        json={"query": query, "debate_mode": False},
        headers=headers_b
    )
    if r.status_code == 200:
        print(f"   ✅ User B researched: '{query[:50]}...'")
    else:
        print(f"   ⚠️  Research failed: {r.status_code}")

# ============================================================
# TEST 1: User A sees ONLY their own research
# ============================================================
print("\n" + "=" * 60)
print("📌 TEST 1: User A → User A's stats")
print("-" * 40)

r = requests.get(f"{BASE_URL}/memory/stats", headers=headers_a)
if r.status_code == 200:
    data = r.json()
    print(f"   User A sees: {data.get('total_research', 0)} research entries")

r = requests.get(f"{BASE_URL}/memory/history", headers=headers_a)
if r.status_code == 200:
    history = r.json().get('history', [])
    queries = [h['query'] for h in history]
    print(f"   User A queries: {queries}")

# ============================================================
# TEST 2: User B sees ONLY their own research
# ============================================================
print("\n📌 TEST 2: User B → User B's stats")
print("-" * 40)

r = requests.get(f"{BASE_URL}/memory/stats", headers=headers_b)
if r.status_code == 200:
    data = r.json()
    print(f"   User B sees: {data.get('total_research', 0)} research entries")

r = requests.get(f"{BASE_URL}/memory/history", headers=headers_b)
if r.status_code == 200:
    history = r.json().get('history', [])
    queries = [h['query'] for h in history]
    print(f"   User B queries: {queries}")

# ============================================================
# TEST 3: Content Isolation — Can User A see User B's data?
# ============================================================
print("\n📌 TEST 3: Content Isolation Check")
print("-" * 40)

r_a = requests.get(f"{BASE_URL}/memory/history", headers=headers_a)
r_b = requests.get(f"{BASE_URL}/memory/history", headers=headers_b)

if r_a.status_code == 200 and r_b.status_code == 200:
    queries_a = [h['query'] for h in r_a.json().get('history', [])]
    queries_b = [h['query'] for h in r_b.json().get('history', [])]

    # Check if User A can see User B's topics
    a_has_b_data = any('quantum' in q.lower() or 'blockchain' in q.lower() for q in queries_a)
    b_has_a_data = any('artificial intelligence' in q.lower() or 'machine learning' in q.lower() for q in queries_b)

    if not a_has_b_data and not b_has_a_data:
        print(f"   ✅ PASSED: Complete data isolation!")
        print(f"      User A CANNOT see User B's quantum/blockchain research")
        print(f"      User B CANNOT see User A's AI/ML research")
    else:
        if a_has_b_data:
            print(f"   ❌ FAILED: User A CAN see User B's research!")
            print(f"      User A's queries include: {[q for q in queries_a if 'quantum' in q.lower() or 'blockchain' in q.lower()]}")
        if b_has_a_data:
            print(f"   ❌ FAILED: User B CAN see User A's research!")
            print(f"      User B's queries include: {[q for q in queries_b if 'artificial intelligence' in q.lower() or 'machine learning' in q.lower()]}")

# ============================================================
# TEST 4: Guest (no token) sees nothing
# ============================================================
print("\n📌 TEST 4: No token → Guest access")
print("-" * 40)

r = requests.get(f"{BASE_URL}/memory/stats")
if r.status_code == 200:
    data = r.json()
    print(f"   Guest sees: {data.get('total_research', 0)} research entries")
    if data.get('total_research', 0) == 0:
        print(f"   ✅ PASSED: Guest sees no data")
    else:
        print(f"   ⚠️  Guest can see {data.get('total_research')} entries")

# ============================================================
# TEST 5: User A tries to access with User B's token (should see B's data)
# ============================================================
print("\n📌 TEST 5: Cross-token verification")
print("-" * 40)

r = requests.get(f"{BASE_URL}/memory/history", headers=headers_b)
if r.status_code == 200:
    history = r.json().get('history', [])
    queries = [h['query'] for h in history]
    print(f"   With User B's token, queries are: {queries}")
    has_b_data = any('quantum' in q.lower() or 'blockchain' in q.lower() for q in queries)
    has_a_data = any('artificial intelligence' in q.lower() or 'machine learning' in q.lower() for q in queries)
    
    if has_b_data and not has_a_data:
        print(f"   ✅ PASSED: User B's token shows only User B's data")
    elif has_a_data:
        print(f"   ❌ FAILED: User B's token shows User A's data — ISOLATION BROKEN!")

# ============================================================
# SUMMARY
# ============================================================
print("\n" + "=" * 60)
print("📊 DATA ISOLATION TEST SUMMARY")
print("=" * 60)
print(f"""
   User A: {USER_A_EMAIL}
   User B: {USER_B_EMAIL}
   
   If tests pass:
   ✅ Each user sees only their own research
   ✅ Guest users see nothing
   ✅ Tokens are properly scoped to individual users
   ✅ Data isolation is WORKING correctly
   
   If tests fail:
   ❌ The orchestrator or memory routes may still be using
      hardcoded "guest_user" instead of the authenticated user ID
""")