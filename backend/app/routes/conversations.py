from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models.user import Conversation, Message

router = APIRouter(prefix="/conversations", tags=["conversations"])

from pydantic import BaseModel

class ConversationCreate(BaseModel):
    title: str = "New Research"
    mode: str = "research"
    first_query: str = ""

class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    sources: list = []
    confidence: int = 0
    created_at: str

class ConversationResponse(BaseModel):
    id: int
    title: str
    mode: str
    created_at: str
    messages: List[MessageResponse] = []

@router.post("/", response_model=ConversationResponse)
async def create_conversation(request: ConversationCreate, db: Session = Depends(get_db)):
    """Create new conversation"""
    conv = Conversation(title=request.title, mode=request.mode, user_id=1)  # Default user for now
    db.add(conv)
    db.commit()
    db.refresh(conv)
    
    # Add first message if provided
    if request.first_query:
        msg = Message(conversation_id=conv.id, role="user", content=request.first_query)
        db.add(msg)
        db.commit()
    
    return format_conversation(conv)

@router.get("/", response_model=List[ConversationResponse])
async def list_conversations(db: Session = Depends(get_db)):
    """List all conversations"""
    conversations = db.query(Conversation).order_by(Conversation.updated_at.desc()).limit(20).all()
    return [format_conversation(c) for c in conversations]

@router.get("/{conv_id}", response_model=ConversationResponse)
async def get_conversation(conv_id: int, db: Session = Depends(get_db)):
    """Get specific conversation"""
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return format_conversation(conv)

@router.delete("/{conv_id}")
async def delete_conversation(conv_id: int, db: Session = Depends(get_db)):
    """Delete conversation"""
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conv)
    db.commit()
    return {"message": "Deleted"}

def format_conversation(conv):
    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        mode=conv.mode,
        created_at=conv.created_at.isoformat(),
        messages=[
            MessageResponse(
                id=m.id,
                role=m.role,
                content=m.content[:200],
                sources=m.sources or [],
                confidence=m.confidence or 0,
                created_at=m.created_at.isoformat()
            ) for m in conv.messages
        ]
    )