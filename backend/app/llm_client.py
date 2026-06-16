from anthropic import Anthropic
from openai import OpenAI
import os
from typing import Optional
from dotenv import load_dotenv
from app.utils.encryption import decrypt_api_key

load_dotenv()

def get_user_api_key(db, user_id: int, provider: str = "anthropic") -> Optional[str]:
    """
    Get user's decrypted API key for a provider.
    Returns None if user has no key for that provider.
    """
    from app.models.user import User
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    
    encrypted_key = getattr(user, f"{provider}_api_key", None)
    if not encrypted_key:
        return None
    
    return decrypt_api_key(encrypted_key, user.encryption_key)

def get_llm_client(user_api_key=None, provider="anthropic", db=None, user_id=None):
    """
    Get LLM client - uses user's key if provided, else system key.
    
    Priority:
    1. Explicitly provided user_api_key
    2. Database-stored user API key (if db and user_id provided)
    3. System environment variable fallback
    """
    
    # ✅ If no key provided but we have db + user_id, try to get user's stored key
    if not user_api_key and db is not None and user_id is not None:
        user_api_key = get_user_api_key(db, user_id, provider)
    
    if provider == "anthropic":
        api_key = user_api_key or os.getenv("ANTHROPIC_API_KEY")
        return Anthropic(api_key=api_key)
    elif provider == "openai":
        api_key = user_api_key or os.getenv("OPENAI_API_KEY")
        return OpenAI(api_key=api_key)
    else:
        # Default to Anthropic
        api_key = user_api_key or os.getenv("ANTHROPIC_API_KEY")
        return Anthropic(api_key=api_key)

def get_llm_response(messages, user_api_key=None, provider="anthropic", temperature=0.7, db=None, user_id=None):
    """Get LLM response with user's preferred provider"""
    
    # ✅ If no key provided but we have db + user_id, try to get user's stored key
    if not user_api_key and db is not None and user_id is not None:
        user_api_key = get_user_api_key(db, user_id, provider)
    
    client = get_llm_client(user_api_key, provider, db=db, user_id=user_id)
    
    if provider == "openai":
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=temperature
        )
        return response.choices[0].message.content
    else:
        # Anthropic (default)
        system_msg = next((m["content"] for m in messages if m["role"] == "system"), "")
        user_msgs = [m for m in messages if m["role"] != "system"]
        
        response = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=800,
            temperature=temperature,
            system=system_msg if system_msg else "You are a helpful research assistant.",
            messages=user_msgs
        )
        return response.content[0].text