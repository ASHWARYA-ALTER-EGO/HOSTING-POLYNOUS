"""
BYOK ENCRYPTION TEST WITH REAL ANTHROPIC KEY
Verifies: live validation, encrypted storage, masking, decryption
"""
import requests, time, sys

BASE = "http://localhost:8000"
PASSWORD = "TestPass!123"
TIMESTAMP = int(time.time())

# ============================================================
# 🔑 PUT YOUR REAL KEY HERE
# ============================================================
REAL_ANTHROPIC_KEY = "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"
# ============================================================

def test(name, passed, detail=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"   {status} | {name}" + (f" — {detail}" if detail else ""))

print("=" * 60)
print("🔐 BYOK ENCRYPTION TEST (REAL KEY)")
print("=" * 60)

# 1. Register fresh user
USER_EMAIL = f"byok_real_{TIMESTAMP}@polynous.ai"
r = requests.post(f"{BASE}/auth/register", json={
    "email": USER_EMAIL,
    "username": "byok_real",
    "password": PASSWORD
})
if r.status_code != 200:
    print(f"❌ Registration failed: {r.text}")
    sys.exit(1)
token = r.json()["access_token"]
user_id = r.json()["user_id"]
print(f"✅ User registered: {user_id}")

headers = {"Authorization": f"Bearer {token}"}

# 2. Check current key status (should be empty)
r = requests.get(f"{BASE}/settings/api-keys", headers=headers)
data = r.json()
test("Initial key status empty", not data.get("anthropic", {}).get("has_key"))

# 3. Save real API key (this will trigger live validation)
print("⏳ Validating key with Anthropic...")
r = requests.put(f"{BASE}/settings/api-keys",
    json={"provider": "anthropic", "api_key": REAL_ANTHROPIC_KEY},
    headers=headers)

if r.status_code != 200:
    print(f"❌ Save failed: {r.text}")
    sys.exit(1)
data = r.json()
preview = data.get("preview", "")
test("Key saved successfully", data.get("validated", False) == True)
test("Preview is masked", "sk-ant-****" in preview and REAL_ANTHROPIC_KEY not in preview,
     f"Preview: {preview}")

# 4. Verify API response never returns full key
r = requests.get(f"{BASE}/settings/api-keys", headers=headers)
api_data = r.json()
full_key_exposed = REAL_ANTHROPIC_KEY in str(api_data)
test("API response never contains full key", not full_key_exposed)

# 5. Check database – encryption at rest
sys.path.insert(0, '.')
from app.database import SessionLocal
from app.models.user import User

db = SessionLocal()
user = db.query(User).filter(User.email == USER_EMAIL).first()
test("User exists in DB", user is not None)

if user:
    test("User has encryption_key", bool(user.encryption_key))
    stored = user.anthropic_api_key
    test("Encrypted blob stored in DB", stored is not None and len(stored) > 0)
    if stored:
        is_encrypted = "sk-ant" not in stored
        test("DB stores encrypted (not plaintext)", is_encrypted,
             "Plaintext key found in database!" if not is_encrypted else "")

# 6. Test decryption
if user and user.encryption_key and user.anthropic_api_key:
    from app.utils.encryption import decrypt_api_key
    decrypted = decrypt_api_key(user.anthropic_api_key, user.encryption_key)
    test("Decrypted key matches original", decrypted == REAL_ANTHROPIC_KEY,
         f"Decrypted: {decrypted[:30] if decrypted else 'None'}...")

# 7. (Optional) Use the key in a research request
r = requests.post(f"{BASE}/ask", json={
    "query": "What is Python?",
    "debate_mode": False
}, headers=headers)
test("Research with user's own key works", r.status_code == 200, f"Status {r.status_code}")

# 8. Clean up – delete the key (optional)
requests.delete(f"{BASE}/settings/api-keys/anthropic", headers=headers)
print("\n🔑 Key deleted (cleanup)")

db.close()
print("\n" + "=" * 60)
print("BYOK ENCRYPTION TEST COMPLETE")