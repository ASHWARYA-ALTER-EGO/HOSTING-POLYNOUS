from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator
from typing import Optional

from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/settings", tags=["settings"])

class SettingsUpdate(BaseModel):
    username: Optional[str] = None
    preferred_provider: Optional[str] = None
    research_style: Optional[str] = None  # 'academic', 'casual', 'quick'
    
    @validator('username')
    def validate_username(cls, v):
        if v:
            v = v.strip()
            if len(v) < 2 or len(v) > 50:
                raise ValueError('Username must be between 2-50 characters')
            # Only allow alphanumeric, underscore, hyphen
            import re
            if not re.match(r'^[a-zA-Z0-9_\- ]+$', v):
                raise ValueError('Username contains invalid characters')
        return v
    
    @validator('preferred_provider')
    def validate_provider(cls, v):
        allowed = ['anthropic', 'openai']
        if v and v not in allowed:
            raise ValueError(f'Provider must be one of: {allowed}')
        return v
    
    @validator('research_style')
    def validate_style(cls, v):
        allowed = ['academic', 'casual', 'quick']
        if v and v not in allowed:
            raise ValueError(f'Style must be one of: {allowed}')
        return v

@router.get("")
async def get_settings(request: Request, db: Session = Depends(get_db)):
    """Get user settings"""
    user_email = getattr(request.state, 'user_email', 'guest@polynous.ai')
    
    # Parameterized query
    user = db.query(User).filter(User.email == user_email).first()
    
    if not user:
        return {"username": "Guest", "preferred_provider": "anthropic", "research_style": "academic"}
    
    return {
        "username": user.username,
        "email": user.email,
        "preferred_provider": user.preferred_provider or "anthropic",
        "tier": user.tier or "free"
    }

@router.put("")
async def update_settings(
    settings: SettingsUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update user settings"""
    user_email = getattr(request.state, 'user_email', 'guest@polynous.ai')
    
    # Parameterized query
    user = db.query(User).filter(User.email == user_email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if settings.username:
        user.username = settings.username
    if settings.preferred_provider:
        user.preferred_provider = settings.preferred_provider
    
    db.commit()
    
    return {"message": "Settings updated", "username": user.username}

@router.delete("/account")
async def delete_account(request: Request, db: Session = Depends(get_db)):
    """Delete user account"""
    user_email = getattr(request.state, 'user_email', 'guest@polynous.ai')
    
    # Parameterized query
    user = db.query(User).filter(User.email == user_email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    return {"message": "Account deleted"}