from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv

load_dotenv()

# If no DATABASE_URL is set, use local SQLite
if not os.getenv("DATABASE_URL"):
    print("⚠️  No DATABASE_URL set, using local SQLite")
    os.environ["DATABASE_URL"] = "sqlite:///./polynous.db"

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./polynous.db")

# Configure engine based on database type
if DATABASE_URL.startswith("sqlite"):
    # SQLite - local development
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    print("🗄️  Using SQLite (local)")
elif DATABASE_URL.startswith("postgresql"):
    # PostgreSQL - production
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=3600    # Recycle connections every hour
    )
    print("🗄️  Using PostgreSQL (production)")
else:
    # Fallback to SQLite
    engine = create_engine(
        "sqlite:///./polynous.db",
        connect_args={"check_same_thread": False}
    )
    print("🗄️  Using SQLite (fallback)")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Create all database tables"""
    from app.models.user import Base
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables initialized!")

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_db_connection():
    """Test database connection"""
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        print("✅ Database connection successful!")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False