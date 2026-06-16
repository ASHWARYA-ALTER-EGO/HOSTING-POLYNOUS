from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Use environment variable with fallback - NEVER hardcode credentials
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./polynous.db")

# SQLite needs special connect args
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # PostgreSQL with SSL for production
    engine = create_engine(
        DATABASE_URL,
        connect_args={"sslmode": "require"},
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Create all database tables safely"""
    from app.models.user import Base
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created!")

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()