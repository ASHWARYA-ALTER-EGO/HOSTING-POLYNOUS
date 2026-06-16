from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./polynous.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False  # Set to True for debugging SQL queries
    )
else:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"sslmode": "require"},
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True
    )

# ✅ Use scoped_session — ensures each request gets a FRESH session
SessionLocal = scoped_session(
    sessionmaker(autocommit=False, autoflush=False, bind=engine)
)

def init_db():
    """Create all database tables safely"""
    from app.models.user import Base
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created!")

def get_db():
    """
    Dependency to get database session.
    ✅ Each request gets a NEW session.
    ✅ Session is automatically closed after request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        SessionLocal.remove()  # ✅ CRITICAL: Remove session from registry