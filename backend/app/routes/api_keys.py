# ============================================================
# IMPORTS — What we need
# ============================================================
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.utils.encryption import encrypt_api_key, decrypt_api_key, mask_api_key

# ============================================================
# CREATE ROUTER — This is what gets imported in main.py
# ============================================================
router = APIRouter(prefix="/settings/api-keys", tags=["api-keys"])
# All routes will start with: /settings/api-keys
# Example: /settings/api-keys?user_id=guest_user


# ============================================================
# PYDANTIC MODELS — Define request/response shapes
# ============================================================

class APIKeysUpdate(BaseModel):
    """What the frontend sends when saving keys"""
    anthropic_api_key: Optional[str] = None  # Optional — user may only save one key
    openai_api_key: Optional[str] = None
    tavily_api_key: Optional[str] = None


class APIKeysResponse(BaseModel):
    """What we send back — NEVER includes full keys!"""
    has_anthropic: bool = False        # Does user have an Anthropic key?
    has_openai: bool = False           # Does user have an OpenAI key?
    has_tavily: bool = False           # Does user have a Tavily key?
    preferred_provider: str = "anthropic"  # Which provider user prefers
    anthropic_preview: Optional[str] = None  # Masked: ****abcd
    openai_preview: Optional[str] = None     # Masked: ****wxyz
    tavily_preview: Optional[str] = None     # Masked: ****1234


# ============================================================
# ENDPOINT 1: GET API KEYS STATUS
# ============================================================
# GET /settings/api-keys?user_id=guest_user
# Returns: { has_anthropic: true, anthropic_preview: "****abcd", ... }
# NEVER returns actual keys — only masked previews

@router.get("", response_model=APIKeysResponse)
async def get_api_keys(
    user_id: str = Query("guest_user"),  # Get user_id from query parameter
    db: Session = Depends(get_db)        # Database session (auto-injected)
):
    """
    Get user's API key status.
    Frontend calls this on mount to show which keys are connected.
    NEVER returns full keys — only masked previews like ****abcd.
    """
    
    # Try to find user by email OR username
    user = db.query(User).filter(
        (User.email == user_id) | (User.username == user_id)
    ).first()
    
    # If user not found, return empty (all false)
    if not user:
        return APIKeysResponse()
    
    # Decrypt and mask keys for preview
    # decrypt_api_key() converts encrypted text back to real key
    # mask_api_key() shows only "****" + last 4 characters
    return APIKeysResponse(
        has_anthropic=bool(user.anthropic_api_key),  # True if key exists
        has_openai=bool(user.openai_api_key),
        has_tavily=bool(user.tavily_api_key),
        preferred_provider=user.preferred_provider or "anthropic",
        anthropic_preview=mask_api_key(decrypt_api_key(user.anthropic_api_key)) if user.anthropic_api_key else None,
        openai_preview=mask_api_key(decrypt_api_key(user.openai_api_key)) if user.openai_api_key else None,
        tavily_preview=mask_api_key(decrypt_api_key(user.tavily_api_key)) if user.tavily_api_key else None
    )


# ============================================================
# ENDPOINT 2: SAVE API KEY
# ============================================================
# PUT /settings/api-keys?user_id=guest_user
# Body: { "anthropic_api_key": "sk-ant-..." }
# Flow: Receive → Encrypt → Store in database

@router.put("")
async def update_api_key(
    request: APIKeysUpdate = None,  # Accept JSON body as Pydantic model
    user_id: str = Query("guest_user"),
    db: Session = Depends(get_db)
):
    # DEBUG: Print what we received
    print(f"\n📥 PUT /settings/api-keys?user_id={user_id}")
    print(f"   Request body: {request}")
    if request:
        print(f"   anthropic: {request.anthropic_api_key[:20] if request.anthropic_api_key else 'None'}...")
        print(f"   openai: {request.openai_api_key}")
        print(f"   tavily: {request.tavily_api_key}")
    
    """Save API keys — encrypted at rest"""
    
    user = db.query(User).filter(
        (User.email == user_id) | (User.username == user_id)
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Login first.")
    
    saved = []
    
    # Get keys from request body if provided
    if request:
        if request.anthropic_api_key and request.anthropic_api_key.strip():
            user.anthropic_api_key = encrypt_api_key(request.anthropic_api_key.strip())
            saved.append("anthropic")
            print(f"  ✅ Saved Anthropic key for {user_id}")
        
        if request.openai_api_key and request.openai_api_key.strip():
            user.openai_api_key = encrypt_api_key(request.openai_api_key.strip())
            saved.append("openai")
            print(f"  ✅ Saved OpenAI key for {user_id}")
        
        if request.tavily_api_key and request.tavily_api_key.strip():
            user.tavily_api_key = encrypt_api_key(request.tavily_api_key.strip())
            saved.append("tavily")
            print(f"  ✅ Saved Tavily key for {user_id}")
    
    if not saved:
        print(f"  ⚠️ No keys to save for {user_id}")
        print(f"  Request body: {request}")
    
    db.commit()
    
    return {
        "message": f"Keys saved: {', '.join(saved)}" if saved else "No keys provided",
        "saved": saved
    }


# ============================================================
# ENDPOINT 3: DELETE API KEY
# ============================================================
# DELETE /settings/api-keys?user_id=guest_user&provider=anthropic
# Removes the specified key from the database

@router.delete("")
async def delete_api_key(
    user_id: str = Query("guest_user"),
    provider: str = Query(..., description="Which key: anthropic, openai, tavily, or all"),
    db: Session = Depends(get_db)
):
    """Delete a user's API key"""
    
    user = db.query(User).filter(
        (User.email == user_id) | (User.username == user_id)
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Set the specified key to None (removes it)
    if provider == "anthropic" or provider == "all":
        user.anthropic_api_key = None
    if provider == "openai" or provider == "all":
        user.openai_api_key = None
    if provider == "tavily" or provider == "all":
        user.tavily_api_key = None
    
    db.commit()
    return {"message": f"Key(s) deleted: {provider}"}


# ============================================================
# ENDPOINT 4: TEST API KEY
# ============================================================
# POST /settings/api-keys/test?provider=anthropic&user_id=guest_user
# Actually calls the API to check if the key works

@router.post("/test")
async def test_api_key(
    provider: str = Query(..., description="Provider: anthropic, openai, tavily"),
    user_id: str = Query("guest_user"),
    db: Session = Depends(get_db)
):
    """
    Test if a user's API key is valid by making an actual API call.
    For Anthropic: Sends a test message to Claude
    For OpenAI: Lists available models
    For Tavily: Performs a test search
    """
    
    user = db.query(User).filter(
        (User.email == user_id) | (User.username == user_id)
    ).first()
    
    if not user:
        return {"status": "fail", "message": "User not found"}
    
    # Get the encrypted key
    encrypted = None
    if provider == "anthropic":
        encrypted = user.anthropic_api_key
    elif provider == "openai":
        encrypted = user.openai_api_key
    elif provider == "tavily":
        encrypted = user.tavily_api_key
    
    if not encrypted:
        return {"status": "fail", "message": f"No {provider} key configured"}
    
    # Decrypt the key (convert ciphertext → real API key)
    api_key = decrypt_api_key(encrypted)
    if not api_key:
        return {"status": "fail", "message": "Failed to decrypt key"}
    
    # Test the key by making a real API call
    try:
        if provider == "anthropic":
            from anthropic import Anthropic
            client = Anthropic(api_key=api_key)
            # Send a minimal test message
            client.messages.create(
                model="claude-haiku-4-5",
                max_tokens=5,
                messages=[{"role": "user", "content": "Hi"}]
            )
            return {"status": "ok", "message": "Anthropic key is valid ✅"}
            
        elif provider == "openai":
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            client.models.list()  # Just list models (lightweight)
            return {"status": "ok", "message": "OpenAI key is valid ✅"}
            
        elif provider == "tavily":
            from tavily import TavilyClient
            client = TavilyClient(api_key=api_key)
            client.search("test", max_results=1)  # Minimal search
            return {"status": "ok", "message": "Tavily key is valid ✅"}
            
    except Exception as e:
        return {"status": "fail", "message": str(e)[:200]}