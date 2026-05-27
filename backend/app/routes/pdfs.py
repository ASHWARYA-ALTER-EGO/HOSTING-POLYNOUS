from fastapi import APIRouter, UploadFile, File, HTTPException, Query
import tempfile
import os
from typing import Optional
from app.data_sources.pdf_processor import (
    process_pdf, search_pdf, get_uploaded_pdfs, rag_answer_from_pdf, get_progress
)

router = APIRouter(prefix="/pdfs", tags=["pdfs"])

@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload and process a PDF file"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    # Check file size (max 50MB)
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 50MB allowed.")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        result = process_pdf(tmp_path, file.filename)
        return result
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@router.get("/progress")
async def get_upload_progress(filename: str = Query(...)):
    """Get processing progress for a file"""
    return get_progress(filename)

@router.get("/list")
async def list_pdfs():
    """Get all uploaded PDFs"""
    pdfs = get_uploaded_pdfs()
    return {"total": len(pdfs), "pdfs": pdfs}

@router.get("/search")
async def search_pdfs(query: str, pdf_name: Optional[str] = None, top_k: int = 5):
    """Search across PDFs"""
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    chunks = search_pdf(query, pdf_name, top_k)
    return {"query": query, "results": len(chunks), "chunks": chunks}

@router.post("/ask")
async def ask_pdf(query: str = Query(...), pdf_name: Optional[str] = Query(None)):
    """RAG: Ask question from PDF context"""
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    result = rag_answer_from_pdf(query, pdf_name)
    return result