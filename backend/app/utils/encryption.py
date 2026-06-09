import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ============================================================
# GET OR GENERATE ENCRYPTION KEY
# ============================================================
# The encryption key is like a password that locks/unlocks API keys
# It MUST be the same every time, or you can't decrypt stored keys!

ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

if not ENCRYPTION_KEY:
    # No key found in .env — generate a new one
    ENCRYPTION_KEY = Fernet.generate_key().decode()
    print("=" * 60)
    print("⚠️  WARNING: No ENCRYPTION_KEY found in .env!")
    print("   A new key has been generated.")
    print(f"   Add this to your .env file:")
    print(f"   ENCRYPTION_KEY={ENCRYPTION_KEY}")
    print("=" * 60)

# ============================================================
# INITIALIZE FERNET (Encryption Engine)
# ============================================================
# Fernet is a symmetric encryption system:
# - Same key encrypts AND decrypts
# - Uses AES-128-CBC + HMAC-SHA256
# - Industry standard, used by banks and governments

try:
    # Fernet keys are 32 url-safe base64-encoded bytes
    # They look like: aGVsbG8gd29ybGQgdGhpcyBpcyBhIGtleQ==
    fernet = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)
    print("✅ Encryption utility initialized successfully!")
except Exception as e:
    print(f"❌ Encryption key error: {e}")
    print("   Make sure ENCRYPTION_KEY is a valid Fernet key")
    print("   Generate one with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\"")
    fernet = None


# ============================================================
# FUNCTION 1: ENCRYPT API KEY
# ============================================================
# Input:  "sk-ant-api03-your-real-key-here"
# Output: "gAAAAABmXyZ..." (long encrypted string)
# This is what gets stored in the database

def encrypt_api_key(api_key: str) -> str:
    """
    Encrypt an API key before storing in database.
    
    Example:
        >>> encrypt_api_key("sk-ant-api03-abc123")
        'gAAAAABmXyZWQx...'  (encrypted ciphertext)
    
    Returns None if input is empty or encryption fails.
    """
    if not api_key:
        return None
    
    if not fernet:
        print("❌ Cannot encrypt: Fernet not initialized")
        return None
    
    try:
        # Convert string to bytes → Encrypt → Convert back to string
        encrypted_bytes = fernet.encrypt(api_key.encode())
        return encrypted_bytes.decode()
    except Exception as e:
        print(f"❌ Encryption failed: {e}")
        return None


# ============================================================
# FUNCTION 2: DECRYPT API KEY
# ============================================================
# Input:  "gAAAAABmXyZ..." (encrypted string from database)
# Output: "sk-ant-api03-your-real-key-here" (original key)
# This is used when we need to actually USE the key

def decrypt_api_key(encrypted_key: str) -> str:
    """
    Decrypt an API key retrieved from database.
    
    Example:
        >>> decrypt_api_key('gAAAAABmXyZWQx...')
        'sk-ant-api03-abc123'  (original key)
    
    Returns None if input is empty or decryption fails.
    """
    if not encrypted_key:
        return None
    
    if not fernet:
        print("❌ Cannot decrypt: Fernet not initialized")
        return None
    
    try:
        # Convert string to bytes → Decrypt → Convert back to string
        decrypted_bytes = fernet.decrypt(encrypted_key.encode())
        return decrypted_bytes.decode()
    except Exception as e:
        print(f"❌ Decryption failed: {e}")
        print("   This usually means the ENCRYPTION_KEY changed!")
        return None


# ============================================================
# FUNCTION 3: MASK API KEY (For Display)
# ============================================================
# Input:  "sk-ant-api03-your-real-key-here"
# Output: "****here"
# Only shows last 4 characters — safe to display in UI

def mask_api_key(api_key: str) -> str:
    """
    Mask an API key for safe display.
    Only shows the last 4 characters.
    
    Example:
        >>> mask_api_key("sk-ant-api03-abc123")
        '****c123'
        >>> mask_api_key("short")
        '****'
    
    Returns None if input is empty.
    """
    if not api_key:
        return None
    
    if len(api_key) <= 4:
        return "****"
    
    # Show "****" + last 4 characters
    return "****" + api_key[-4:]