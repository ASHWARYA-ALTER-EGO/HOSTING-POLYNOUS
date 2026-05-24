from typing import List, Dict
import os
import hashlib
import time
from dotenv import load_dotenv
from pinecone import Pinecone
from app.voyage_embeddings import create_embedding, create_query_embedding

load_dotenv()

# Initialize Pinecone
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

INDEX_NAME = "polynous-memory"
EMBEDDING_DIMENSION = 1024  # Voyage voyage-3-lite dimension

class SemanticSearchEngine:
    def __init__(self):
        self.use_pinecone = False
        self.fallback_memory = []  # Fallback storage
        
        # Try to connect to Pinecone
        try:
            existing = pc.list_indexes().names()
            
            if INDEX_NAME not in existing:
                print(f"📦 Creating Pinecone index: {INDEX_NAME}")
                pc.create_index(
                    name=INDEX_NAME,
                    dimension=EMBEDDING_DIMENSION,
                    metric="cosine",
                    spec={"serverless": {"cloud": "aws", "region": "us-east-1"}}
                )
                time.sleep(5)  # Wait for index to be ready
            
            self.index = pc.Index(INDEX_NAME)
            self.use_pinecone = True
            print("✅ Semantic Search with Pinecone + Voyage AI Ready!")
        except Exception as e:
            print(f"⚠️ Pinecone unavailable, using in-memory search: {e}")
            self.index = None
    
    def add_to_index(self, query: str, answer: str, mode: str = "research", 
                     confidence: float = 0, sources: List = None):
        """Add a research entry to the search index"""
        entry = {
            "id": hashlib.md5(f"{query}{time.time()}".encode()).hexdigest()[:16],
            "query": query,
            "answer": answer[:300],
            "mode": mode,
            "confidence": confidence,
            "sources": sources or [],
            "score": 100.0,
            "timestamp": time.time()
        }
        
        if self.use_pinecone and self.index:
            try:
                # Create embedding and store in Pinecone
                embedding = create_embedding(query + " " + answer[:500])
                if embedding:
                    self.index.upsert(
                        vectors=[{
                            "id": entry["id"],
                            "values": embedding,
                            "metadata": entry
                        }]
                    )
                    print(f"  📌 Indexed in Pinecone: {query[:50]}...")
            except Exception as e:
                print(f"  ⚠️ Pinecone indexing error: {e}")
        
        # Always keep fallback
        self.fallback_memory.append(entry)
        return entry
    
    def search(self, query: str, top_k: int = 10, filters: Dict = None) -> List[Dict]:
        """Search using Voyage embeddings + Pinecone"""
        results = []
        
        # Try Pinecone search first
        if self.use_pinecone and self.index:
            try:
                query_embedding = create_query_embedding(query)
                if query_embedding:
                    pine_results = self.index.query(
                        vector=query_embedding,
                        top_k=top_k,
                        include_metadata=True,
                        filter=filters
                    )
                    
                    for match in pine_results.get('matches', []):
                        if match.score > 0.3:
                            meta = match.metadata or {}
                            results.append({
                                "id": match.id,
                                "score": round(match.score * 100, 1),
                                "query": meta.get('query', ''),
                                "answer": meta.get('answer', '')[:300],
                                "mode": meta.get('mode', 'research'),
                                "confidence": meta.get('confidence', 0),
                                "sources": meta.get('sources', []),
                            })
            except Exception as e:
                print(f"Pinecone search error: {e}")
        
        # Fallback: keyword search
        if not results:
            results = self._keyword_search(query, top_k, filters)
        
        return results
    
    def _keyword_search(self, query: str, top_k: int, filters: Dict = None) -> List[Dict]:
        """Fallback keyword search"""
        query_lower = query.lower()
        results = []
        
        for entry in self.fallback_memory:
            if filters and filters.get("mode") and entry.get("mode") != filters["mode"]:
                continue
            
            score = 0
            entry_query = entry.get("query", "").lower()
            entry_answer = entry.get("answer", "").lower()
            
            if query_lower in entry_query:
                score += 50
            
            query_words = set(query_lower.split())
            entry_words = set(entry_query.split() + entry_answer.split())
            overlap = len(query_words & entry_words)
            score += overlap * 10
            
            if score > 0:
                results.append({**entry, "score": min(100, score)})
        
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]
    
    def get_suggestions(self, query: str, limit: int = 5) -> List[str]:
        """Get search suggestions"""
        query_lower = query.lower()
        suggestions = []
        seen = set()
        
        for entry in self.fallback_memory:
            q = entry.get("query", "")
            if query_lower in q.lower() and q not in seen:
                suggestions.append(q)
                seen.add(q)
            if len(suggestions) >= limit:
                break
        
        return suggestions

# Global instance
semantic_search = SemanticSearchEngine()