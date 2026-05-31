import secrets
import string
from cryptography.fernet import Fernet

print("\n" + "=" * 60)
print("🔑 GENERATE PRODUCTION KEYS")
print("=" * 60)

# JWT Secret
jwt = ''.join(secrets.choice(string.ascii_letters + string.digits + "!@#$%^&*") for _ in range(64))
print(f"\nJWT_SECRET={jwt}")

# Encryption Key
enc = Fernet.generate_key().decode()
print(f"\nENCRYPTION_KEY={enc}")

print("\nAdd these to your production .env file!")
print("=" * 60)