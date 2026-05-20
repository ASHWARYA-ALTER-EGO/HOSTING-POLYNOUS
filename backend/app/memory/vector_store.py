from pinecone import Pinecone, ServerlessSpec
from anthropic import Anthropic
import os
import hashlib
import time
import re
from dotenv import load_dotenv

load_dotenv()

# Initialize clients
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

INDEX_NAME = "polynous-memory"

def get_or_create_index():
    """Get existing index or create new one"""
    existing = pc.list_indexes().names()
    
    if INDEX_NAME not in existing:
        print(f"📦 Creating new Pinecone index: {INDEX_NAME}")
        pc.create_index(
            name=INDEX_NAME,
            dimension=1536,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
        time.sleep(5)
    
    return pc.Index(INDEX_NAME)

def create_embedding(text: str):
    """Create embedding vector using text hashing (no OpenAI needed)"""
    try:
        text = text.lower().strip()[:2000]
        words = re.findall(r'\b\w+\b', text)
        
        vector = [0.0] * 1536
        for i, word in enumerate(words):
            hash_val = int(hashlib.md5(word.encode()).hexdigest(), 16)
            idx = hash_val % 1536
            vector[idx] += 1.0
        
        norm = sum(v * v for v in vector) ** 0.5
        if norm > 0:
            vector = [v / norm for v in vector]
        
        return vector
    except Exception as e:
        print(f"❌ Embedding error: {e}")
        return None

def store_research(session_id: str, query: str, documents: list, answer: str, metadata: dict = {}):
    """Store research results in Pinecone"""
    try:
        index = get_or_create_index()
        
        combined_text = f"Query: {query}\nAnswer: {answer[:500]}"
        
        embedding = create_embedding(combined_text)
        if not embedding:
            return False
        
        doc_id = hashlib.md5(f"{session_id}:{query}:{time.time()}".encode()).hexdigest()
        
        index.upsert(
            vectors=[{
                "id": doc_id,
                "values": embedding,
                "metadata": {
                    "session_id": session_id,
                    "query": query[:500],
                    "answer": answer[:1000],
                    "num_sources": len(documents),
                    "confidence": metadata.get('confidence', 0),
                    "mode": metadata.get('mode', 'research'),
                    "timestamp": time.time()
                }
            }]
        )
        
        print(f"✅ Stored in Pinecone: {doc_id[:12]}...")
        return True
        
    except Exception as e:
        print(f"❌ Pinecone storage error: {e}")
        return False

def search_similar_research(query: str, top_k: int = 5):
    """Find similar previous research from Pinecone"""
    try:
        index = get_or_create_index()
        
        embedding = create_embedding(query)
        if not embedding:
            return []
        
        results = index.query(vector=embedding, top_k=top_k, include_metadata=True)
        
        similar = []
        for match in results.get('matches', []):
            if match.score > 0.5:
                similar.append({
                    "id": match.id,
                    "score": round(match.score * 100, 1),
                    "query": match.metadata.get('query', ''),
                    "answer": match.metadata.get('answer', '')[:300],
                    "confidence": match.metadata.get('confidence', 0)
                })
        
        return similar
        
    except Exception as e:
        print(f"❌ Pinecone search error: {e}")
        return []

def get_session_history(session_id: str, limit: int = 10):
    """Get all research history for a session"""
    try:
        index = get_or_create_index()
        
        results = index.query(
            vector=[0.0] * 1536,
            top_k=limit,
            filter={"session_id": session_id},
            include_metadata=True
        )
        
        history = []
        for match in results.get('matches', []):
            history.append({
                "id": match.id,
                "query": match.metadata.get('query', ''),
                "confidence": match.metadata.get('confidence', 0),
                "timestamp": match.metadata.get('timestamp', 0)
            })
        
        return sorted(history, key=lambda x: x['timestamp'], reverse=True)
        
    except Exception as e:
        print(f"❌ Session history error: {e}")
        return []

print("✅ Pinecone Vector Memory Ready!")