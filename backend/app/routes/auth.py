from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import datetime, timedelta
import os
import bcrypt
import uuid
import re
from cryptography.fernet import Fernet
from pydantic import BaseModel, validator, field_validator

from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])

# ============================================================
# CONFIGURATION
# ============================================================
SECRET_KEY = os.getenv("JWT_SECRET", "change-this-in-production-64-chars-min")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # Short-lived: 15 minutes
REFRESH_TOKEN_EXPIRE_DAYS = 7     # Refresh token: 7 days
BCRYPT_WORK_FACTOR = 12           # Higher = more secure but slower
MAX_LOGIN_ATTEMPTS = 5            # Lock after 5 failures
LOCKOUT_DURATION_MINUTES = 15     # Lock for 15 minutes

# ============================================================
# PASSWORD POLICY
# ============================================================

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Password must have:
    - At least 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 number
    - At least 1 special character
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    
    if len(password) > 128:
        return False, "Password must be less than 128 characters"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least 1 uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least 1 lowercase letter"
    
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least 1 number"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;\/`~]', password):
        return False, "Password must contain at least 1 special character"
    
    # Check for common passwords
    common_passwords = ['password', '12345678', 'qwerty123', 'admin123', 'letmein123']
    if password.lower() in common_passwords:
        return False, "This password is too common. Please choose a stronger one."
    
    return True, "Password is strong"

# ============================================================
# PASSWORD HASHING (bcrypt)
# ============================================================

def hash_password(password: str) -> str:
    """Hash password with bcrypt (industry standard)"""
    salt = bcrypt.gensalt(rounds=BCRYPT_WORK_FACTOR)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash"""
    try:
        return bcrypt.checkpw(
            password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False

# ============================================================
# TOKEN MANAGEMENT
# ============================================================

def create_access_token(user_id: int, public_id: str, email: str) -> str:
    """Create short-lived access token (15 min)"""
    now = datetime.utcnow()
    expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload = {
        "sub": str(user_id),           # Internal ID
        "uid": public_id,              # Public UUID (safe to expose)
        "email": email,
        "iat": now,
        "exp": expire,
        "type": "access",
        "jti": str(uuid.uuid4())       # Unique token ID for revocation
    }
    
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(user_id: int, public_id: str, email: str) -> str:
    """Create long-lived refresh token (7 days)"""
    now = datetime.utcnow()
    expire = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    payload = {
        "sub": str(user_id),
        "uid": public_id,
        "email": email,
        "iat": now,
        "exp": expire,
        "type": "refresh",
        "jti": str(uuid.uuid4())
    }
    
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str, expected_type: str = "access") -> dict:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"verify_exp": True, "verify_iat": True}
        )
        
        if payload.get("type") != expected_type:
            raise HTTPException(status_code=401, detail=f"Invalid token type. Expected {expected_type}")
        
        return payload
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired. Please refresh.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token. Please login again.")
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication failed.")

# ============================================================
# AUTH MIDDLEWARE — Extract user from token
# ============================================================

async def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """
    Extract user from JWT token.
    Use as dependency for ALL protected routes.
    """
    # Try Authorization header first
    auth_header = request.headers.get("Authorization", "")
    
    if auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
    else:
        # Try cookie
        token = request.cookies.get("access_token", "")
    
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    payload = decode_token(token, "access")
    
    user_id = int(payload.get("sub", 0))
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found or deactivated")
    
    # Check if account is locked
    if user.locked_until and user.locked_until > datetime.utcnow():
        remaining = (user.locked_until - datetime.utcnow()).seconds // 60
        raise HTTPException(
            status_code=423,
            detail=f"Account is locked. Try again in {remaining} minutes."
        )
    
    # Store in request state for route handlers
    request.state.user_id = user.id
    request.state.user_public_id = user.public_id
    request.state.user_email = user.email
    
    return user

# ============================================================
# MODELS WITH VALIDATION
# ============================================================

class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        v = v.strip().lower()
        pattern = r'^[a-zA-Z0-9][a-zA-Z0-9._%+\-]*@[a-zA-Z0-9][a-zA-Z0-9.\-]*\.[a-zA-Z]{2,}$'
        if not re.match(pattern, v):
            raise ValueError('Invalid email address')
        if len(v) > 255:
            raise ValueError('Email too long')
        return v
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        v = v.strip()
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if len(v) > 50:
            raise ValueError('Username must be less than 50 characters')
        if not re.match(r'^[a-zA-Z0-9_\-]+$', v):
            raise ValueError('Username can only contain letters, numbers, underscores, and hyphens')
        return v
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        is_valid, message = validate_password_strength(v)
        if not is_valid:
            raise ValueError(message)
        return v

class LoginRequest(BaseModel):
    email: str
    password: str
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        v = v.strip().lower()
        if not v or '@' not in v:
            raise ValueError('Invalid email address')
        return v

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str          # Public UUID
    username: str
    email: str
    expires_in: int

# ============================================================
# ENDPOINTS
# ============================================================

@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    """
    Register a new user with secure defaults.
    Returns access token + sets refresh token as HttpOnly cookie.
    """
    
    # ✅ Improved error messages for duplicate checks
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=409, detail="This email is already registered. Please login or use a different email.")
    
    if db.query(User).filter(User.username == request.username).first():
        raise HTTPException(status_code=409, detail="This username is already taken. Please choose another.")
    
    # Validate password strength
    is_valid, message = validate_password_strength(request.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    # ✅ Generate user-specific encryption key for API key storage
    user_encryption_key = Fernet.generate_key().decode()
    
    # Create user with encryption key
    user = User(
        public_id=str(uuid.uuid4()),
        email=request.email,
        username=request.username,
        hashed_password=hash_password(request.password),
        encryption_key=user_encryption_key,  # ✅ Store for encrypting their API keys
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Generate tokens
    access_token = create_access_token(user.id, user.public_id, user.email)
    refresh_token = create_refresh_token(user.id, user.public_id, user.email)
    
    # Set refresh token as HttpOnly secure cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,        # Set to True in production (HTTPS)
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/auth"
    )
    
    return TokenResponse(
        access_token=access_token,
        user_id=user.public_id,
        username=user.username,
        email=user.email,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    Login with email and password.
    Includes brute force protection.
    """
    
    # Find user
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        # Don't reveal if email exists — same error message
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check if account is locked
    if user.locked_until and user.locked_until > datetime.utcnow():
        remaining = (user.locked_until - datetime.utcnow()).seconds // 60
        raise HTTPException(
            status_code=423,
            detail=f"Account locked. Try again in {remaining} minutes."
        )
    
    # Verify password
    if not verify_password(request.password, user.hashed_password):
        # Increment failed attempts
        user.failed_login_attempts += 1
        
        # Lock account if too many attempts
        if user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS:
            user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
            db.commit()
            raise HTTPException(
                status_code=423,
                detail=f"Account locked for {LOCKOUT_DURATION_MINUTES} minutes due to too many failed attempts."
            )
        
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Successful login — reset failed attempts
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Generate tokens
    access_token = create_access_token(user.id, user.public_id, user.email)
    refresh_token = create_refresh_token(user.id, user.public_id, user.email)
    
    # Set refresh token as HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/auth"
    )
    
    return TokenResponse(
        access_token=access_token,
        user_id=user.public_id,
        username=user.username,
        email=user.email,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@router.post("/refresh")
async def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Get new access token using refresh token from HttpOnly cookie.
    """
    refresh_token = request.cookies.get("refresh_token", "")
    
    if not refresh_token:
        # Fallback to Authorization header
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            refresh_token = auth_header.replace("Bearer ", "")
    
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token required")
    
    payload = decode_token(refresh_token, "refresh")
    
    user_id = int(payload.get("sub", 0))
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Generate new tokens (token rotation)
    new_access_token = create_access_token(user.id, user.public_id, user.email)
    new_refresh_token = create_refresh_token(user.id, user.public_id, user.email)
    
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/auth"
    )
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.get("/me")
async def get_current_user_profile(user: User = Depends(get_current_user)):
    """
    Get current user profile. Requires valid access token.
    """
    return {
        "user_id": user.public_id,
        "email": user.email,
        "username": user.username,
        "tier": user.tier,
        "is_active": user.is_active,
        "created_at": str(user.created_at),
        "last_login": str(user.last_login) if user.last_login else None
    }

@router.post("/logout")
async def logout(response: Response, user: User = Depends(get_current_user)):
    """
    Logout — clear refresh token cookie.
    """
    response.delete_cookie(key="refresh_token", path="/auth")
    return {"message": "Logged out successfully"}

@router.put("/change-password")
async def change_password(
    old_password: str,
    new_password: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change password — requires current password"""
    
    # Verify old password
    if not verify_password(old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Validate new password
    is_valid, message = validate_password_strength(new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    # Can't reuse same password
    if verify_password(new_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="New password must be different from current")
    
    # Update password
    user.hashed_password = hash_password(new_password)
    user.password_changed_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Password changed successfully"}