from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
import os
import sys
import re

# ============================================================
# ENVIRONMENT DETECTION
# ============================================================

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
IS_PRODUCTION = ENVIRONMENT == "production"

print(f"🌍 Environment: {ENVIRONMENT}")
print(f"🏭 Production mode: {IS_PRODUCTION}")

# ============================================================
# DATABASE URL CONFIGURATION
# ============================================================

# Get the raw database URL from environment
raw_url = os.getenv("DATABASE_URL", "")

# ── Production: DATABASE_URL is REQUIRED ──────────────────
if IS_PRODUCTION:
    if not raw_url:
        print("=" * 60)
        print("❌ FATAL: ENVIRONMENT=production but DATABASE_URL is not set!")
        print("=" * 60)
        print("   On Railway:")
        print("   1. Add a PostgreSQL service to your project")
        print("   2. The DATABASE_URL will be injected automatically")
        print("   3. Or set it manually in Variables tab")
        print("=" * 60)
        sys.exit(1)
    
    print(f"🗄️  Using PostgreSQL (production): {raw_url[:50]}...")

# ── Development: Fall back to SQLite if no URL provided ────
else:
    if not raw_url:
        raw_url = "sqlite:///./polynous.db"
        print("🗄️  Using SQLite (local development)")
    elif raw_url.startswith("sqlite"):
        print("🗄️  Using SQLite (local development)")
    else:
        print(f"🗄️  Using external database: {raw_url[:50]}...")

# ============================================================
# FIX URL SCHEME
# ============================================================

# Some providers (like Railway) may give "postgres://" instead of "postgresql://"
# SQLAlchemy requires "postgresql://" — this fix handles that automatically
if raw_url.startswith("postgres://"):
    raw_url = raw_url.replace("postgres://", "postgresql://", 1)
    print("🔧 Fixed URL scheme: postgres:// → postgresql://")

# Also handle "mysql://" → "mysql+pymysql://" if needed
if raw_url.startswith("mysql://"):
    raw_url = raw_url.replace("mysql://", "mysql+pymysql://", 1)
    print("🔧 Fixed URL scheme: mysql:// → mysql+pymysql://")

DATABASE_URL = raw_url

# ============================================================
# ENGINE CONFIGURATION
# ============================================================

if DATABASE_URL.startswith("sqlite"):
    # ── SQLite Configuration ──────────────────────────────
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},  # Required for SQLite with FastAPI
        echo=False,                                  # Set to True for SQL debugging
    )
    print("⚙️  SQLite engine configured (single-thread mode)")

else:
    # ── PostgreSQL / MySQL Configuration ──────────────────
    
    # Build connect_args based on environment
    connect_args = {}
    
    # In production, always require SSL for PostgreSQL
    if IS_PRODUCTION and "postgresql" in DATABASE_URL:
        connect_args["sslmode"] = "require"
        print("🔒 SSL mode: require (production)")
    
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,                # Base number of connections in pool
        max_overflow=10,            # Extra connections allowed beyond pool_size
        pool_pre_ping=True,         # ✅ Verify connections before using (survives idle drops)
        pool_recycle=3600,          # Recycle connections every hour (prevents stale connections)
        pool_timeout=30,            # Seconds to wait for a connection before timing out
        connect_args=connect_args,
        echo=False,                 # Set to True for SQL debugging
    )
    
    print(f"⚙️  Database engine configured:")
    print(f"   • pool_size: 5")
    print(f"   • max_overflow: 10")
    print(f"   • pool_pre_ping: True (survives idle drops)")
    print(f"   • pool_recycle: 3600s")
    print(f"   • pool_timeout: 30s")

# ============================================================
# SESSION FACTORY
# ============================================================

# Use scoped_session to ensure thread-safe sessions per request
# This is critical for FastAPI's async request handling
SessionLocal = scoped_session(
    sessionmaker(
        autocommit=False,    # Explicit commits required
        autoflush=False,     # Don't auto-flush (better control)
        bind=engine,
        expire_on_commit=False,  # Keep objects usable after commit
    )
)

print("✅ Session factory created (scoped_session)")

# ============================================================
# DATABASE INITIALIZATION
# ============================================================

def init_db():
    """
    Create all database tables safely.
    
    Called from main.py on startup.
    Uses SQLAlchemy's create_all() which is idempotent — 
    existing tables are not modified.
    
    For production migrations, consider using Alembic instead.
    """
    try:
        # Import all models here to ensure they're registered
        from app.models.user import Base
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created/verified!")
        
        # Log which database we're using
        if DATABASE_URL.startswith("sqlite"):
            db_path = DATABASE_URL.replace("sqlite:///", "")
            print(f"📁 SQLite database at: {db_path}")
        else:
            # Mask password in logs
            safe_url = re.sub(r'://([^:]+):([^@]+)@', r'://\1:****@', DATABASE_URL)
            print(f"🗄️  Connected to: {safe_url}")
            
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        if IS_PRODUCTION:
            # In production, fail fast — don't start without a database
            raise
        else:
            # In development, print warning but continue
            print("⚠️  Continuing without database — some features may not work")

# ============================================================
# DEPENDENCY INJECTION
# ============================================================

def get_db():
    """
    FastAPI dependency to get a database session.
    
    Usage in routes:
        @router.get("/something")
        async def something(db: Session = Depends(get_db)):
            ...
    
    The session is automatically closed after the request completes,
    and the scoped session is removed from the thread-local registry.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        # Rollback on any exception during request
        db.rollback()
        raise
    finally:
        # Always close the session and remove from scope
        db.close()
        SessionLocal.remove()

# ============================================================
# HEALTH CHECK
# ============================================================

def check_database_connection():
    """
    Verify the database connection is working.
    
    Returns:
        tuple: (is_healthy: bool, message: str)
    """
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        return True, "Database connection OK"
    except Exception as e:
        return False, f"Database connection failed: {str(e)}"

# ============================================================
# EXPORT CONVENIENCE
# ============================================================

__all__ = [
    "engine",
    "SessionLocal",
    "init_db",
    "get_db",
    "check_database_connection",
    "DATABASE_URL",
    "IS_PRODUCTION",
]