from app.routes.pdfs import router as pdfs_router
from app.routes.semantic_search import router as search_router
from app.routes.knowledge import router as knowledge_router
from app.middleware.rate_limiter import check_rate_limit
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

load_dotenv()

# ========== CREATE APP ==========
app = FastAPI(title="POLYNOUS API")

# ========== CORS MIDDLEWARE (must be before routes) ==========
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== RATE LIMITING MIDDLEWARE ==========
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Apply rate limiting to all requests"""
    await check_rate_limit(request)
    response = await call_next(request)
    return response

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

@app.post("/ask", response_model=QueryResponse)
async def ask_question(request: QueryRequest):
    """Research or Debate endpoint"""
    
    session_id = request.session_id or str(uuid.uuid4())
    
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
    else:
        print("\n🔬 RESEARCH MODE ACTIVATED")
        result = orchestrator.invoke(state)
    
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

@app.post("/memory/create-user")
async def create_memory_user(user_id: str = "guest_user", username: str = "Guest"):
    """Create user profile in memory system"""
    try:
        from app.knowledge_graph.user_memory import user_memory
        user_memory.create_user_profile(user_id, username, f"{user_id}@polynous.ai")
        return {"status": "ok", "user_id": user_id}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/ask-stream")
async def ask_stream(request: QueryRequest):
    """Streaming endpoint"""
    
    async def gen():
        state = AgentState(
            query=request.query,
            session_id=request.session_id or str(uuid.uuid4()),
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
            else:
                yield f"data: {json.dumps({'type': 'progress', 'agent': 'search', 'message': 'Searching web sources...'})}\n\n"
                yield f"data: {json.dumps({'type': 'progress', 'agent': 'summarise', 'message': 'Summarizing documents...'})}\n\n"
                yield f"data: {json.dumps({'type': 'progress', 'agent': 'critic', 'message': 'Critiquing claims...'})}\n\n"
                yield f"data: {json.dumps({'type': 'progress', 'agent': 'writer', 'message': 'Writing final answer...'})}\n\n"
                result = orchestrator.invoke(state)
                confidence = result.get('critique', {}).get('overall_confidence', 0)
                yield f"data: {json.dumps({'type': 'confidence', 'score': confidence})}\n\n"
            
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