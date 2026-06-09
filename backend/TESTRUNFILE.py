import requests

YOUR_EMAIL = "pradhanashwarya2122@gmail.com"

print("\n🧪 TESTING PREFERENCES (AFTER FIX)")
print("=" * 50)

# Test GET
print("\n1. GET preferences...")
res = requests.get(f"http://localhost:8000/settings/preferences?user_id={YOUR_EMAIL}")
print(f"   Status: {res.status_code}")
if res.status_code == 200:
    print(f"   ✅ Response: {res.json()}")
else:
    print(f"   ❌ Error: {res.text}")

# Test PUT
print("\n2. PUT preferences...")
res = requests.put(
    f"http://localhost:8000/settings/preferences?user_id={YOUR_EMAIL}",
    json={"response_style": "casual", "default_mode": "research"}
)
print(f"   Status: {res.status_code}")
if res.status_code == 200:
    print(f"   ✅ Response: {res.json()}")
else:
    print(f"   ❌ Error: {res.text}")