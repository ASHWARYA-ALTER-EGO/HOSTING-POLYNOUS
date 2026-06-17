from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
import os
import sys

# Determine environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
IS_PRODUCTION = ENVIRONMENT == "production"

# In production, DATABASE_URL MUST be provided by Railway (or other cloud)
# In development, we fall back to SQLite for convenience
if IS_PRODUCTION:
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("❌ FATAL: ENVIRONMENT=production but DATABASE_URL is not set!")
        print("   On Railway, add a PostgreSQL service to your project.")
        print("   The DATABASE_URL will be injected automatically.")
        sys.exit(1)
else:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./polynous.db")
    if DATABASE_URL.startswith("sqlite"):
        print("🗄️  Using SQLite (local development)")

# Configure engine based on database type
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL (or compatible) with recommended production settings
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,          # Verify connections before using
        pool_recycle=3600,           # Recycle hourly
        connect_args={"sslmode": "require"} if IS_PRODUCTION else {}
    )

# Use scoped_session to ensure fresh sessions per request
SessionLocal = scoped_session(
    sessionmaker(autocommit=False, autoflush=False, bind=engine)
)

def init_db():
    """Create all database tables safely"""
    from app.models.user import Base
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created!")

def get_db():
    """Dependency to get database session – closed after request"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        SessionLocal.remove()