import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

# Get or generate encryption key
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

if not ENCRYPTION_KEY:
    # Generate a new key for development
    ENCRYPTION_KEY = Fernet.generate_key().decode()
    print("=" * 60)
    print("⚠️  No ENCRYPTION_KEY found!")
    print(f"   Generated: ENCRYPTION_KEY={ENCRYPTION_KEY}")
    print("   Add this to your .env file!")
    print("=" * 60)

# Initialize Fernet with the key
try:
    fernet = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)
except Exception as e:
    print(f"❌ Encryption key error: {e}")
    print("   Make sure ENCRYPTION_KEY is a valid Fernet key (32 url-safe base64-encoded bytes)")
    fernet = None

def encrypt_api_key(api_key: str) -> str:
    """Encrypt an API key for secure storage"""
    if not api_key or not fernet:
        return None
    try:
        return fernet.encrypt(api_key.encode()).decode()
    except Exception as e:
        print(f"Encryption error: {e}")
        return None

def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt an API key for use"""
    if not encrypted_key or not fernet:
        return None
    try:
        return fernet.decrypt(encrypted_key.encode()).decode()
    except Exception as e:
        print(f"Decryption error: {e}")
        return None

def mask_api_key(api_key: str) -> str:
    """Show only last 4 characters of a key"""
    if not api_key:
        return None
    if len(api_key) <= 4:
        return "****"
    return "****" + api_key[-4:]

print("✅ Encryption utility ready!")