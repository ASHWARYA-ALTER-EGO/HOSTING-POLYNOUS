from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from jose import jwt
from datetime import datetime, timedelta
import httpx
import os
import json

from app.database import get_db
from app.models.user import User
from app.oauth_config import *

router = APIRouter(prefix="/oauth", tags=["oauth"])

SECRET_KEY = os.getenv("JWT_SECRET", "polynous-secret-key")
ALGORITHM = "HS256"

def create_token(user_id: int, email: str):
    """Create JWT token"""
    expire = datetime.utcnow() + timedelta(hours=24)
    data = {"sub": str(user_id), "email": email, "exp": expire}
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def get_or_create_user(db: Session, email: str, username: str, avatar_url: str = "", provider: str = ""):
    """Get existing user or create new one"""
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Create new user with random password (they'll use OAuth)
        import secrets
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        user = User(
            email=email,
            username=username or email.split('@')[0],
            hashed_password=pwd_context.hash(secrets.token_urlsafe(32)),
            tier="free"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"✅ New user created: {email} (via {provider})")
    else:
        user.last_login = datetime.utcnow()
        db.commit()
        print(f"✅ Existing user logged in: {email} (via {provider})")
    
    return user

# ========== GOOGLE OAUTH ==========
@router.get("/google")
async def google_login():
    """Redirect to Google for authentication"""
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        "&response_type=code"
        "&scope=openid%20email%20profile"
        f"&redirect_uri={GOOGLE_REDIRECT_URI}"
        "&access_type=offline"
    )
    return RedirectResponse(url=google_auth_url)

@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    try:
        # Exchange code for token
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "redirect_uri": GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code"
                }
            )
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            # Get user info
            user_response = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            user_info = user_response.json()
        
        # Create or get user
        user = get_or_create_user(
            db=db,
            email=user_info.get("email"),
            username=user_info.get("name") or user_info.get("email", "").split('@')[0],
            avatar_url=user_info.get("picture", ""),
            provider="google"
        )
        
        # Create JWT token
        token = create_token(user.id, user.email)
        
        # Redirect to frontend with token
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5174")
        return RedirectResponse(
            url=f"{frontend_url}/auth/callback?token={token}&username={user.username}&email={user.email}"
        )
        
    except Exception as e:
        print(f"Google OAuth error: {e}")
        raise HTTPException(status_code=400, detail=f"OAuth failed: {str(e)}")

# ========== GITHUB OAUTH ==========
@router.get("/github")
async def github_login():
    """Redirect to GitHub for authentication"""
    github_auth_url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        "&scope=user:email"
        f"&redirect_uri={GITHUB_REDIRECT_URI}"
    )
    return RedirectResponse(url=github_auth_url)

@router.get("/github/callback")
async def github_callback(code: str, db: Session = Depends(get_db)):
    """Handle GitHub OAuth callback"""
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")
    
    try:
        # Exchange code for token
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": GITHUB_CLIENT_ID,
                    "client_secret": GITHUB_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": GITHUB_REDIRECT_URI
                },
                headers={"Accept": "application/json"}
            )
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            # Get user info
            user_response = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            user_info = user_response.json()
            
            # Get email (GitHub may not return email directly)
            email = user_info.get("email")
            if not email:
                email_response = await client.get(
                    "https://api.github.com/user/emails",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                emails = email_response.json()
                primary_email = next((e for e in emails if e.get("primary")), None)
                email = primary_email.get("email") if primary_email else f"{user_info['login']}@github.com"
        
        # Create or get user
        user = get_or_create_user(
            db=db,
            email=email,
            username=user_info.get("login") or user_info.get("name"),
            avatar_url=user_info.get("avatar_url", ""),
            provider="github"
        )
        
        # Create JWT token
        token = create_token(user.id, user.email)
        
        # Redirect to frontend with token
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5174")
        return RedirectResponse(
            url=f"{frontend_url}/auth/callback?token={token}&username={user.username}&email={email}"
        )
        
    except Exception as e:
        print(f"GitHub OAuth error: {e}")
        raise HTTPException(status_code=400, detail=f"OAuth failed: {str(e)}")