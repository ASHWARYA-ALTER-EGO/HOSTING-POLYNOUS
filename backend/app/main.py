from fastapi import FastAPI
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

load_dotenv()

app = FastAPI(title="POLYNOUS - Multi-Agent Research Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/")
async def root():
    return {
        "message": "🧠 POLYNOUS - Multi-Agent Research Assistant",
        "tagline": "Many Minds, One Answer",
        "agents": ["Search", "Summariser", "Critic", "Writer", "Debate FOR", "Debate AGAINST", "Judge"],
        "modes": ["Research", "Debate"],
        "version": "3.0"
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "agents": 7}

@app.post("/ask", response_model=QueryResponse)
async def ask_question(request: QueryRequest):
    """Research or Debate endpoint"""
    
    session_id = request.session_id or str(uuid.uuid4())
    
    # Initialize state
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
    
    # Choose mode
    if request.debate_mode:
        print("\n🗣️ DEBATE MODE ACTIVATED")
        result = debate_graph.invoke(state)
    else:
        print("\n🔬 RESEARCH MODE ACTIVATED")
        result = orchestrator.invoke(state)
    
    # Get values safely
    citations = result.get('citations', [])
    final_answer = result.get('final_answer', 'No answer generated')
    critique = result.get('critique', {})
    verdict = result.get('judge_verdict', {})
    
    # Format sources
    sources = []
    for i, c in enumerate(citations):
        title = c.get('title', 'Untitled')
        sources.append(f"[{i+1}] {title[:100]}")
    
    # Return based on mode
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
    
    async def event_generator():
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
        
        mode_name = "debate" if request.debate_mode else "research"
        yield f"data: {json.dumps({'type': 'start', 'mode': mode_name})}\n\n"
        
        try:
            if request.debate_mode:
                result = debate_graph.invoke(state)
                if result.get('judge_verdict'):
                    yield f"data: {json.dumps({'type': 'verdict', 'verdict': result['judge_verdict']})}\n\n"
            else:
                result = orchestrator.invoke(state)
                num_docs = len(result.get('retrieved_docs', []))
                confidence = result.get('critique', {}).get('overall_confidence', 0)
                yield f"data: {json.dumps({'type': 'progress', 'message': f'Found {num_docs} sources, Confidence: {confidence}%'})}\n\n"
            
            # Stream answer
            answer = result.get('final_answer', 'No answer')
            words = answer.split()
            for i in range(0, len(words), 8):
                chunk = ' '.join(words[i:i+8])
                yield f"data: {json.dumps({'type': 'token', 'content': chunk + ' '})}\n\n"
            
            yield f"data: {json.dumps({'type': 'end'})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )

@app.get("/status")
async def status():
    """Check system status"""
    import psutil
    
    return {
        "system": "POLYNOUS",
        "version": "3.0",
        "status": "operational",
        "agents": {
            "search": "online",
            "summariser": "online",
            "critic": "online",
            "writer": "online",
            "debate_for": "online",
            "debate_against": "online",
            "judge": "online"
        },
        "memory_usage": f"{psutil.Process().memory_info().rss / 1024 / 1024:.1f}MB",
        "endpoints": ["/ask", "/ask-stream", "/health", "/status"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)