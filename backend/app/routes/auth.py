from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from jose import jwt
from datetime import datetime, timedelta
import os
import hashlib
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.getenv("JWT_SECRET", "polynous-secret-key-change-in-production")
ALGORITHM = "HS256"

class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

def hash_password(password: str) -> str:
    """Simple SHA256 hashing (replaces bcrypt to avoid compatibility issues)"""
    salt = os.urandom(32).hex()
    hashed = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}${hashed}"

def verify_password(password: str, stored_hash: str) -> bool:
    """Verify password against stored hash"""
    try:
        salt, original_hash = stored_hash.split('$')
        new_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        return new_hash == original_hash
    except:
        return False

def create_token(user_id: int, email: str):
    """Create JWT token"""
    expire = datetime.utcnow() + timedelta(hours=24)
    data = {"sub": str(user_id), "email": email, "exp": expire}
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/register")
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register new user"""
    # Check if user exists
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=request.email,
        username=request.username,
        hashed_password=hash_password(request.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_token(user.id, user.email)
    
    return {
        "message": "Registration successful",
        "token": token,
        "user_id": user.id,
        "username": user.username,
        "email": user.email
    }

@router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login user"""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    token = create_token(user.id, user.email)
    
    return {
        "message": "Login successful",
        "token": token,
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "tier": user.tier or "free"
    }

@router.get("/me")
async def get_me(token: str, db: Session = Depends(get_db)):
    """Get current user info"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "tier": user.tier,
            "created_at": str(user.created_at)
        }
    except:
        raise HTTPException(status_code=401, detail="Invalid token")