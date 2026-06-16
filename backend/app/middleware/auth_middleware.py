"""
Auth Middleware — Extracts user from JWT for ALL protected routes
"""
from fastapi import Request, HTTPException
from jose import jwt, JWTError
import os
from app.database import SessionLocal
from app.models.user import User

SECRET_KEY = os.getenv("JWT_SECRET", "change-this-in-production")
ALGORITHM = "HS256"

async def extract_user_middleware(request: Request, call_next):
    """
    Extract user from JWT token and attach to request.state.
    Skips public routes (login, register, health).
    """
    
    # Skip auth for public routes
    PUBLIC_PATHS = [
        '/health', '/', '/docs', '/openapi.json', '/redoc',
        '/auth/register', '/auth/login', '/auth/refresh',
        '/oauth/google', '/oauth/github', '/oauth/google/callback', '/oauth/github/callback',
        '/favicon.ico'
    ]
    
    if request.url.path in PUBLIC_PATHS or request.url.path.startswith('/auth'):
        return await call_next(request)
    
    # Get token from Authorization header
    auth_header = request.headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        # For now, allow requests without token (backward compatibility)
        # Set guest user
        request.state.user_id = 0
        request.state.user_public_id = "guest"
        request.state.user_email = "guest@polynous.ai"
        return await call_next(request)
    
    token = auth_header.replace("Bearer ", "")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        user_id = int(payload.get("sub", 0))
        public_id = payload.get("uid", "unknown")
        email = payload.get("email", "unknown")
        
        # Verify user exists in database
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
            if user:
                request.state.user_id = user.id
                request.state.user_public_id = user.public_id  # ← from DB, matches JWT uid
                request.state.user_email = user.email
                request.state.is_authenticated = True
            else:
                request.state.user_id = 0
                request.state.user_public_id = "unknown"
                request.state.user_email = "unknown"
                request.state.is_authenticated = False
        finally:
            db.close()
    
    except (JWTError, Exception):
        # Invalid token — set as guest
        request.state.user_id = 0
        request.state.user_public_id = "guest"
        request.state.user_email = "guest@polynous.ai"
        request.state.is_authenticated = False
    
    return await call_next(request)