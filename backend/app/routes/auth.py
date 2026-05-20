from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import os

from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET", "polynous-secret-key-change-in-production")
ALGORITHM = "HS256"

from pydantic import BaseModel

class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

def create_token(user_id: int):
    """Create JWT token"""
    expire = datetime.utcnow() + timedelta(hours=24)
    data = {"sub": str(user_id), "exp": expire}
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
        hashed_password=pwd_context.hash(request.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_token(user.id)
    return {"message": "Registration successful", "token": token, "user_id": user.id}

@router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login user"""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not pwd_context.verify(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    token = create_token(user.id)
    return {
        "message": "Login successful",
        "token": token,
        "user_id": user.id,
        "username": user.username,
        "tier": user.tier
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
            "created_at": user.created_at.isoformat()
        }
    except:
        raise HTTPException(status_code=401, detail="Invalid token")