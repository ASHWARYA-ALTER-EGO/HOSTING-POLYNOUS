from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.utils.encryption import encrypt_api_key, decrypt_api_key, mask_api_key

router = APIRouter(prefix="/settings/api-keys", tags=["api-keys"])

# ========== MODELS ==========
class APIKeysUpdate(BaseModel):
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    tavily_api_key: Optional[str] = None
    voyage_api_key: Optional[str] = None
    preferred_provider: Optional[str] = None

class APIKeysResponse(BaseModel):
    has_anthropic: bool = False
    has_openai: bool = False
    has_tavily: bool = False
    has_voyage: bool = False
    preferred_provider: str = "anthropic"
    anthropic_preview: Optional[str] = None
    openai_preview: Optional[str] = None
    tavily_preview: Optional[str] = None

# ========== ENDPOINTS ==========

@router.get("", response_model=APIKeysResponse)
async def get_api_keys(user_id: str = Query("guest_user"), db: Session = Depends(get_db)):
    """Get user's API key status (NEVER returns full keys)"""
    user = db.query(User).filter(User.email == user_id).first()
    
    if not user:
        # Try by username
        user = db.query(User).filter(User.username == user_id).first()
    
    if not user:
        return APIKeysResponse()
    
    return APIKeysResponse(
        has_anthropic=bool(user.anthropic_api_key),
        has_openai=bool(user.openai_api_key),
        has_tavily=bool(user.tavily_api_key),
        has_voyage=bool(user.voyage_api_key),
        preferred_provider=user.preferred_provider or "anthropic",
        anthropic_preview=mask_api_key(decrypt_api_key(user.anthropic_api_key)) if user.anthropic_api_key else None,
        openai_preview=mask_api_key(decrypt_api_key(user.openai_api_key)) if user.openai_api_key else None,
        tavily_preview=mask_api_key(decrypt_api_key(user.tavily_api_key)) if user.tavily_api_key else None
    )

@router.put("")
async def update_api_keys(
    keys: APIKeysUpdate,
    user_id: str = Query("guest_user"),
    db: Session = Depends(get_db)
):
    """Update user's API keys (encrypted storage)"""
    user = db.query(User).filter(User.email == user_id).first()
    if not user:
        user = db.query(User).filter(User.username == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Please login first.")
    
    # Encrypt and store keys
    if keys.anthropic_api_key and keys.anthropic_api_key.strip():
        user.anthropic_api_key = encrypt_api_key(keys.anthropic_api_key.strip())
    
    if keys.openai_api_key and keys.openai_api_key.strip():
        user.openai_api_key = encrypt_api_key(keys.openai_api_key.strip())
    
    if keys.tavily_api_key and keys.tavily_api_key.strip():
        user.tavily_api_key = encrypt_api_key(keys.tavily_api_key.strip())
    
    if keys.voyage_api_key and keys.voyage_api_key.strip():
        user.voyage_api_key = encrypt_api_key(keys.voyage_api_key.strip())
    
    if keys.preferred_provider and keys.preferred_provider in ["anthropic", "openai"]:
        user.preferred_provider = keys.preferred_provider
    
    db.commit()
    
    return {
        "message": "API keys updated successfully",
        "preferred_provider": user.preferred_provider or "anthropic",
        "has_anthropic": bool(user.anthropic_api_key),
        "has_openai": bool(user.openai_api_key)
    }

@router.delete("")
async def delete_api_keys(
    user_id: str = Query("guest_user"),
    provider: Optional[str] = Query(None, description="Which key to delete: anthropic, openai, tavily, voyage, or all"),
    db: Session = Depends(get_db)
):
    """Remove user's API keys"""
    user = db.query(User).filter(User.email == user_id).first()
    if not user:
        user = db.query(User).filter(User.username == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if provider == "anthropic" or provider == "all":
        user.anthropic_api_key = None
    if provider == "openai" or provider == "all":
        user.openai_api_key = None
    if provider == "tavily" or provider == "all":
        user.tavily_api_key = None
    if provider == "voyage" or provider == "all":
        user.voyage_api_key = None
    
    db.commit()
    return {"message": f"API key(s) deleted: {provider or 'all'}"}

# ========== HELPER FOR OTHER MODULES ==========
def get_user_api_keys(user_id: str, db: Session) -> dict:
    """Get decrypted API keys for a user (internal use)"""
    user = db.query(User).filter(
        (User.email == user_id) | (User.username == user_id)
    ).first()
    
    if not user:
        return {}
    
    return {
        "anthropic": decrypt_api_key(user.anthropic_api_key),
        "openai": decrypt_api_key(user.openai_api_key),
        "tavily": decrypt_api_key(user.tavily_api_key),
        "voyage": decrypt_api_key(user.voyage_api_key),
        "preferred_provider": user.preferred_provider or "anthropic"
    }