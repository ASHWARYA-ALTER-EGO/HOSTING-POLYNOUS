import os
import hashlib
import tempfile
import time
from typing import List, Dict
from PyPDF2 import PdfReader
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv()

from app.voyage_embeddings import create_embedding, create_query_embedding

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
PDF_INDEX_NAME = "polynous-pdfs"
CHUNK_SIZE = 800
CHUNK_OVERLAP = 100

# Global progress tracker
upload_progress = {}

def get_pdf_index():
    """Get or create PDF-specific Pinecone index"""
    existing = pc.list_indexes().names()
    if PDF_INDEX_NAME not in existing:
        print(f"📦 Creating PDF index: {PDF_INDEX_NAME}")
        try:
            pc.create_index(
                name=PDF_INDEX_NAME,
                dimension=1024,
                metric="cosine",
                spec={"serverless": {"cloud": "aws", "region": "us-east-1"}}
            )
            time.sleep(5)
        except Exception as e:
            print(f"Index creation error: {e}")
    return pc.Index(PDF_INDEX_NAME)

def extract_text_from_pdf(file_path: str) -> str:
    """Extract all text from a PDF file"""
    try:
        reader = PdfReader(file_path)
        text = ""
        total_pages = len(reader.pages)
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
            # Update progress
            progress = int(((i + 1) / total_pages) * 50)  # 0-50% for extraction
            upload_progress['extraction'] = progress
        return text.strip()
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ""

def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """Split text into overlapping chunks"""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - overlap
    return chunks

def process_pdf(file_path: str, pdf_name: str) -> Dict:
    """Complete PDF processing pipeline with progress tracking"""
    file_key = pdf_name
    upload_progress[file_key] = {'extraction': 0, 'chunking': 0, 'embedding': 0, 'storing': 0, 'status': 'starting'}
    
    print(f"\n📄 Processing PDF: {pdf_name}")
    
    # Generate unique hash
    with open(file_path, 'rb') as f:
        file_hash = hashlib.md5(f.read()).hexdigest()
    
    # Check if already processed
    try:
        index = get_pdf_index()
        existing = index.query(vector=[0.0] * 1024, top_k=1, filter={"file_hash": file_hash}, include_metadata=True)
        if existing.get('matches'):
            upload_progress[file_key] = {'extraction': 100, 'chunking': 100, 'embedding': 100, 'storing': 100, 'status': 'complete'}
            return {"status": "already_exists", "message": "PDF already processed", "file_hash": file_hash, "progress": 100}
    except Exception as e:
        print(f"Check error: {e}")
    
    # Step 1: Extract text (0-50%)
    upload_progress[file_key]['status'] = 'extracting'
    print("📖 Extracting text...")
    text = extract_text_from_pdf(file_path)
    if not text:
        upload_progress[file_key]['status'] = 'error'
        return {"status": "error", "message": "Could not extract text"}
    upload_progress[file_key]['extraction'] = 50
    
    # Step 2: Chunk text (50-60%)
    upload_progress[file_key]['status'] = 'chunking'
    print(f"✂️ Chunking {len(text)} characters...")
    chunks = chunk_text(text)
    upload_progress[file_key]['chunking'] = 60
    print(f"   Created {len(chunks)} chunks")
    
    # Step 3: Create embeddings and store (60-100%)
    upload_progress[file_key]['status'] = 'embedding'
    print("🧠 Creating embeddings with Voyage AI...")
    index = get_pdf_index()
    
    total_chunks = len(chunks)
    for i, chunk in enumerate(chunks):
        try:
            embedding = create_embedding(chunk[:8000])
            if embedding:
                chunk_id = f"{file_hash}_{i}"
                index.upsert(vectors=[{
                    "id": chunk_id,
                    "values": embedding,
                    "metadata": {
                        "pdf_name": pdf_name,
                        "file_hash": file_hash,
                        "chunk_index": i,
                        "total_chunks": total_chunks,
                        "text": chunk[:2000],
                        "timestamp": time.time()
                    }
                }])
            
            # Update progress (60-100%)
            progress = 60 + int(((i + 1) / total_chunks) * 40)
            upload_progress[file_key]['embedding'] = progress
            upload_progress[file_key]['storing'] = progress
            
        except Exception as e:
            print(f"   ⚠️ Chunk {i} error: {e}")
    
    upload_progress[file_key]['status'] = 'complete'
    upload_progress[file_key]['extraction'] = 100
    upload_progress[file_key]['chunking'] = 100
    upload_progress[file_key]['embedding'] = 100
    upload_progress[file_key]['storing'] = 100
    
    print(f"✅ Stored {total_chunks} chunks in Pinecone")
    return {
        "status": "success",
        "pdf_name": pdf_name,
        "file_hash": file_hash,
        "total_chunks": total_chunks,
        "total_characters": len(text),
        "progress": 100
    }

def get_progress(file_key: str) -> Dict:
    """Get upload progress for a file"""
    return upload_progress.get(file_key, {'extraction': 0, 'chunking': 0, 'embedding': 0, 'storing': 0, 'status': 'unknown'})

def search_pdf(query: str, pdf_name: str = None, top_k: int = 5) -> List[Dict]:
    """Semantic search across PDF chunks"""
    try:
        index = get_pdf_index()
        query_embedding = create_query_embedding(query)
        if not query_embedding:
            return []
        
        filter_dict = {}
        if pdf_name:
            filter_dict["pdf_name"] = pdf_name
        
        results = index.query(vector=query_embedding, top_k=top_k, filter=filter_dict if filter_dict else None, include_metadata=True)
        
        chunks = []
        for match in results.get('matches', []):
            if match.score > 0.3:
                chunks.append({
                    "text": match.metadata.get('text', '')[:500],
                    "pdf_name": match.metadata.get('pdf_name', 'Unknown'),
                    "chunk_index": match.metadata.get('chunk_index', 0),
                    "score": round(match.score * 100, 1)
                })
        return chunks
    except Exception as e:
        print(f"PDF search error: {e}")
        return []

def rag_answer_from_pdf(query: str, pdf_name: str = None, top_k: int = 5) -> Dict:
    """RAG: Search PDF + Generate answer with Claude"""
    from anthropic import Anthropic
    
    chunks = search_pdf(query, pdf_name, top_k)
    
    if not chunks:
        return {"answer": "No relevant information found in the uploaded PDFs. Try uploading a document first or rephrasing your question.", "sources": [], "confidence": 0}
    
    context = "\n\n---\n\n".join([f"[Source: {c['pdf_name']}, Chunk {c['chunk_index']}, Relevance: {c['score']}%]\n{c['text']}" for c in chunks])
    
    try:
        anthropic = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        message = anthropic.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=600,
            temperature=0.5,
            system="You are a research assistant answering questions based on uploaded PDF documents. Use ONLY the provided context. If the context doesn't contain the answer, say so clearly. Always cite which PDF and chunk you're referencing.",
            messages=[{"role": "user", "content": f"Context from PDFs:\n{context[:5000]}\n\nQuestion: {query}\n\nAnswer based on the provided context:"}]
        )
        answer = message.content[0].text
        
        return {
            "answer": answer,
            "sources": [{"pdf_name": c['pdf_name'], "chunk_index": c['chunk_index'], "relevance": c['score']} for c in chunks],
            "confidence": round(sum(c['score'] for c in chunks) / len(chunks), 1)
        }
    except Exception as e:
        return {"answer": f"Error generating answer: {str(e)}", "sources": [], "confidence": 0}

def get_uploaded_pdfs() -> List[Dict]:
    """Get list of all uploaded PDFs"""
    try:
        index = get_pdf_index()
        results = index.query(vector=[0.0]*1024, top_k=100, include_metadata=True)
        pdfs = {}
        for match in results.get('matches', []):
            name = match.metadata.get('pdf_name', 'Unknown')
            if name not in pdfs:
                pdfs[name] = {"pdf_name": name, "total_chunks": match.metadata.get('total_chunks', 0)}
        return list(pdfs.values())
    except:
        return []