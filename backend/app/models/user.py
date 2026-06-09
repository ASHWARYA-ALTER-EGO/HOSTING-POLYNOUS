from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    tier = Column(String, default="free")  # free, pro
    
    # API Keys (encrypted)
    anthropic_api_key = Column(String, nullable=True)   # User's own Anthropic key
    openai_api_key = Column(String, nullable=True)      # User's own OpenAI key
    tavily_api_key = Column(String, nullable=True)      # User's own Tavily key
    preferred_provider = Column(String, default="anthropic")  # "anthropic" or "openai"
    
    # ========== NEW: User Preferences ==========
    default_mode = Column(String, default="research")  # "research" or "debate"
    response_style = Column(String, default="academic")  # "academic", "casual", "eli5", "technical"
    streaming_enabled = Column(Boolean, default=True)
    auto_save = Column(Boolean, default=True)
    confidence_threshold = Column(Integer, default=70)
    theme = Column(String, default="dark")  # "dark" or "light"
    
    conversations = relationship("Conversation", back_populates="user")


class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    title = Column(String, default="New Research")
    mode = Column(String, default="research")  # research or debate
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation")


class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True)
    conversation_id = Column(Integer, ForeignKey('conversations.id'))
    role = Column(String)  # user, assistant
    content = Column(String)
    sources = Column(JSON, default=[])
    confidence = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    conversation = relationship("Conversation", back_populates="messages")