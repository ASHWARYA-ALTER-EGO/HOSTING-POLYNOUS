from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/settings/preferences", tags=["preferences"])

# ─── MODELS ───────────────────────────────────────
class PreferencesUpdate(BaseModel):
    """What the frontend sends when saving preferences"""
    default_mode: Optional[str] = None        # "research" or "debate"
    response_style: Optional[str] = None      # "academic", "casual", "eli5", "technical"
    streaming_enabled: Optional[bool] = None  # True/False
    auto_save: Optional[bool] = None          # True/False
    confidence_threshold: Optional[int] = None # 0-100

class PreferencesResponse(BaseModel):
    """What we return to the frontend"""
    default_mode: str = "research"
    response_style: str = "academic"
    streaming_enabled: bool = True
    auto_save: bool = True
    confidence_threshold: int = 70

# ─── GET PREFERENCES ──────────────────────────────
@router.get("", response_model=PreferencesResponse)
async def get_preferences(
    user_id: str = Query("guest_user"),
    db: Session = Depends(get_db)
):
    """
    Load user preferences from database.
    Called when Settings page loads and when Research page starts.
    """
    user = db.query(User).filter(
        (User.email == user_id) | (User.username == user_id)
    ).first()
    
    if not user:
        # Return defaults for new users
        return PreferencesResponse()
    
    return PreferencesResponse(
        default_mode=user.default_mode or "research",
        response_style=user.response_style or "academic",
        streaming_enabled=user.streaming_enabled if user.streaming_enabled is not None else True,
        auto_save=user.auto_save if user.auto_save is not None else True,
        confidence_threshold=user.confidence_threshold or 70
    )

# ─── SAVE PREFERENCES ─────────────────────────────
@router.put("")
async def update_preferences(
    prefs: PreferencesUpdate,
    user_id: str = Query("guest_user"),
    db: Session = Depends(get_db)
):
    """
    Save user preferences to database.
    Called whenever user changes any setting.
    """
    user = db.query(User).filter(
        (User.email == user_id) | (User.username == user_id)
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Please login first.")
    
    # Update only the fields that were provided
    updated = []
    
    if prefs.default_mode is not None:
        user.default_mode = prefs.default_mode
        updated.append(f"default_mode={prefs.default_mode}")
    
    if prefs.response_style is not None:
        user.response_style = prefs.response_style
        updated.append(f"response_style={prefs.response_style}")
    
    if prefs.streaming_enabled is not None:
        user.streaming_enabled = prefs.streaming_enabled
        updated.append(f"streaming_enabled={prefs.streaming_enabled}")
    
    if prefs.auto_save is not None:
        user.auto_save = prefs.auto_save
        updated.append(f"auto_save={prefs.auto_save}")
    
    if prefs.confidence_threshold is not None:
        user.confidence_threshold = prefs.confidence_threshold
        updated.append(f"confidence_threshold={prefs.confidence_threshold}")
    
    db.commit()
    
    print(f"✅ Preferences saved for {user_id}: {', '.join(updated)}")
    
    return {
        "message": "Preferences saved successfully",
        "status": "ok",
        "updated": updated,
        "current": {
            "default_mode": user.default_mode,
            "response_style": user.response_style,
            "streaming_enabled": user.streaming_enabled,
            "auto_save": user.auto_save,
            "confidence_threshold": user.confidence_threshold
        }
    }