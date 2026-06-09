import requests

YOUR_EMAIL = "pradhanashwarya2122@gmail.com"
YOUR_KEY = "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"  # ← PASTE YOUR REAL KEY

print("\n🧪 FIXED BACKEND TEST")
print("=" * 50)

# Save the key using proper JSON body
print("\n1. Saving key...")
save_res = requests.put(
    f"http://localhost:8000/settings/api-keys?user_id={YOUR_EMAIL}",
    json={"anthropic_api_key": YOUR_KEY}  # ← This is correct format
)
print(f"   Status: {save_res.status_code}")
print(f"   Response: {save_res.json()}")

# Check if saved
print("\n2. Checking keys...")
check_res = requests.get(f"http://localhost:8000/settings/api-keys?user_id={YOUR_EMAIL}")
data = check_res.json()
print(f"   Has anthropic: {data.get('has_anthropic')}")
print(f"   Preview: {data.get('anthropic_preview')}")

# Test the key
print("\n3. Testing key...")
test_res = requests.post(
    f"http://localhost:8000/settings/api-keys/test?provider=anthropic&user_id={YOUR_EMAIL}"
)
print(f"   Response: {test_res.json()}")