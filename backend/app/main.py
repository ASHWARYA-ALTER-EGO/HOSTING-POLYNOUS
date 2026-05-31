from app.routes.pdfs import router as pdfs_router
from app.routes.memory import router as memory_router
from app.routes.semantic_search import router as search_router
from app.routes.knowledge import router as knowledge_router
# REMOVED: from app.middleware.rate_limiter import check_rate_limit
from app.routes.oauth import router as oauth_router
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import os
import json
import uuid
from dotenv import load_dotenv
from app.graph.orchestrator import orchestrator
from app.graph.debate_graph import debate_graph
from app.state import AgentState
from typing import Optional

# Database and routes
from app.database import init_db
from app.routes.auth import router as auth_router
from app.routes.conversations import router as conversations_router

# ========== NEW: Chat History imports ==========
from app.chat_history import save_chat, save_debate, get_chat_history, get_debate_history

load_dotenv()

# ========== CREATE APP ==========
app = FastAPI(title="POLYNOUS API")

# ========== CORS MIDDLEWARE (must be before routes) ==========
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allow ALL methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],
)

# ========== REMOVED: Rate Limiter Middleware ==========
# No rate limiting to prevent CORS preflight blocking

# ========== STARTUP EVENT ==========
@app.on_event("startup")
async def startup():
    init_db()
    print("✅ Database initialized!")

# ========== INCLUDE ROUTERS ==========
app.include_router(auth_router)
app.include_router(conversations_router)
app.include_router(oauth_router)
app.include_router(knowledge_router)
app.include_router(search_router)
app.include_router(memory_router)  # Only ONE memory router - from app/routes/memory.py
app.include_router(pdfs_router)

# ========== MODELS ==========
class QueryRequest(BaseModel):
    query: str
    debate_mode: bool = False
    session_id: Optional[str] = None

class QueryResponse(BaseModel):
    answer: str
    sources: list = []
    confidence: float = 0
    contradictions: list = []
    debate_verdict: dict = {}

# ========== ENDPOINTS ==========
@app.get("/")
async def root():
    return {
        "system": "POLYNOUS",
        "tagline": "Many Minds, One Answer",
        "version": "3.0",
        "endpoints": ["/ask", "/ask-stream", "/health", "/auth/register", "/auth/login", "/conversations"]
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "agents": 7}

# ========== Chat History Endpoints ==========
@app.get("/history/chats")
async def chat_history(session_id: str = None, limit: int = 20):
    """Get chat history"""
    return {"history": get_chat_history(session_id, limit)}

@app.get("/history/debates")
async def debate_history(session_id: str = None, limit: int = 20):
    """Get debate history"""
    return {"history": get_debate_history(session_id, limit)}

# ========== REMOVED: Duplicate Memory Bank Endpoints ==========
# All memory endpoints are now ONLY in app/routes/memory.py
# This prevents route conflicts and ensures consistency

@app.post("/ask", response_model=QueryResponse)
async def ask_question(request: QueryRequest):
    """Research or Debate endpoint"""
    
    session_id = request.session_id or "guest_user"
    
    state = AgentState(
        query=request.query,
        session_id=session_id,
        retrieved_docs=[],
        summaries=[],
        critique={},
        final_answer="",
        citations=[],
        debate_mode=request.debate_mode,
        debate_history=[],
        judge_verdict={},
        errors=[],
        warnings=[],
        current_agent="start"
    )
    
    if request.debate_mode:
        print("\n🗣️ DEBATE MODE ACTIVATED")
        result = debate_graph.invoke(state)
        
        # Save debate to chat history
        try:
            save_debate(
                session_id=session_id,
                topic=request.query,
                for_score=result.get('judge_verdict', {}).get('for_score', 5),
                against_score=result.get('judge_verdict', {}).get('against_score', 5),
                winner=result.get('judge_verdict', {}).get('winner', 'TIE')
            )
            print("💾 Saved debate to chat history")
        except Exception as e:
            print(f"⚠️ Failed to save debate history: {e}")
    else:
        print("\n🔬 RESEARCH MODE ACTIVATED")
        result = orchestrator.invoke(state)
        
        # Save research to chat history
        try:
            save_chat(
                session_id=session_id,
                query=request.query,
                answer=result.get('final_answer', ''),
                confidence=result.get('critique', {}).get('overall_confidence', 0)
            )
            print("💾 Saved chat to history")
        except Exception as e:
            print(f"⚠️ Failed to save chat history: {e}")
    
    citations = result.get('citations', [])
    final_answer = result.get('final_answer', 'No answer generated')
    critique = result.get('critique', {})
    verdict = result.get('judge_verdict', {})
    
    sources = []
    for i, c in enumerate(citations):
        sources.append({
            "number": i + 1,
            "title": c.get('title', 'Untitled')[:150],
            "url": c.get('url', '')
        })
    
    return QueryResponse(
        answer=final_answer,
        sources=sources,
        confidence=critique.get('overall_confidence', 0) if critique else 0,
        contradictions=critique.get('contradictions', []) if critique else [],
        debate_verdict=verdict if verdict else {}
    )

@app.post("/ask-stream")
async def ask_stream(request: QueryRequest):
    """Streaming endpoint"""
    
    async def gen():
        session_id = request.session_id or "guest_user"
        
        state = AgentState(
            query=request.query,
            session_id=session_id,
            retrieved_docs=[], summaries=[], critique={}, final_answer="", citations=[],
            debate_mode=request.debate_mode, debate_history=[], judge_verdict={},
            errors=[], warnings=[], current_agent=""
        )
        
        mode_name = "debate" if request.debate_mode else "research"
        yield f"data: {json.dumps({'type': 'start', 'mode': mode_name})}\n\n"
        
        try:
            if request.debate_mode:
                yield f"data: {json.dumps({'type': 'progress', 'agent': 'search', 'message': 'Searching debate sources...'})}\n\n"
                yield f"data: {json.dumps({'type': 'progress', 'agent': 'for', 'message': 'Building FOR argument...'})}\n\n"
                yield f"data: {json.dumps({'type': 'progress', 'agent': 'against', 'message': 'Building AGAINST argument...'})}\n\n"
                yield f"data: {json.dumps({'type': 'progress', 'agent': 'judge', 'message': 'Judge evaluating...'})}\n\n"
                result = debate_graph.invoke(state)
                if result.get('judge_verdict'):
                    yield f"data: {json.dumps({'type': 'verdict', 'verdict': result['judge_verdict']})}\n\n"
                
                # Save debate
                try:
                    save_debate(
                        session_id=session_id,
                        topic=request.query,
                        for_score=result.get('judge_verdict', {}).get('for_score', 5),
                        against_score=result.get('judge_verdict', {}).get('against_score', 5),
                        winner=result.get('judge_verdict', {}).get('winner', 'TIE')
                    )
                except Exception as e:
                    print(f"⚠️ Failed to save debate in stream: {e}")
            else:
                yield f"data: {json.dumps({'type': 'progress', 'agent': 'search', 'message': 'Searching web sources...'})}\n\n"
                yield f"data: {json.dumps({'type': 'progress', 'agent': 'summarise', 'message': 'Summarizing documents...'})}\n\n"
                yield f"data: {json.dumps({'type': 'progress', 'agent': 'critic', 'message': 'Critiquing claims...'})}\n\n"
                yield f"data: {json.dumps({'type': 'progress', 'agent': 'writer', 'message': 'Writing final answer...'})}\n\n"
                result = orchestrator.invoke(state)
                confidence = result.get('critique', {}).get('overall_confidence', 0)
                yield f"data: {json.dumps({'type': 'confidence', 'score': confidence})}\n\n"
                
                # Save research
                try:
                    save_chat(
                        session_id=session_id,
                        query=request.query,
                        answer=result.get('final_answer', ''),
                        confidence=confidence
                    )
                except Exception as e:
                    print(f"⚠️ Failed to save chat in stream: {e}")
            
            answer = result.get('final_answer', 'No answer')
            words = answer.split()
            for i in range(0, len(words), 3):
                chunk = ' '.join(words[i:i+3])
                yield f"data: {json.dumps({'type': 'token', 'content': chunk + ' '})}\n\n"
            
            yield f"data: {json.dumps({'type': 'citations', 'citations': result.get('citations', [])})}\n\n"
            yield f"data: {json.dumps({'type': 'end'})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(gen(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)