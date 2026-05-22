from typing import List, Dict
from openai import OpenAI
from pinecone import Pinecone
import os
from dotenv import load_dotenv

load_dotenv()

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

INDEX_NAME = "polynous-memory"

class SemanticSearchEngine:
    def __init__(self):
        try:
            self.index = pc.Index(INDEX_NAME)
            print("✅ Semantic Search Engine Ready!")
        except Exception as e:
            print(f"⚠️ Semantic search unavailable: {e}")
            self.index = None
    
    def create_embedding(self, text: str) -> List[float]:
        """Create embedding vector for text"""
        try:
            response = openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=text[:8000]
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Embedding error: {e}")
            return []
    
    def search(self, query: str, top_k: int = 10, filters: Dict = None) -> List[Dict]:
        """Search for semantically similar content"""
        if not self.index:
            return []
        
        try:
            # Create query embedding
            query_embedding = self.create_embedding(query)
            if not query_embedding:
                return []
            
            # Search Pinecone
            results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                filter=filters
            )
            
            matches = []
            for match in results.get('matches', []):
                if match.score > 0.5:  # Relevance threshold
                    metadata = match.metadata or {}
                    matches.append({
                        "id": match.id,
                        "score": round(match.score * 100, 1),
                        "query": metadata.get('query', ''),
                        "answer": metadata.get('answer', '')[:300],
                        "mode": metadata.get('mode', 'research'),
                        "confidence": metadata.get('confidence', 0),
                        "sources": metadata.get('sources', []),
                        "timestamp": metadata.get('timestamp', 0),
                        "relevance": self._get_relevance_label(match.score)
                    })
            
            return matches
            
        except Exception as e:
            print(f"Search error: {e}")
            return []
    
    def search_by_topic(self, topic: str, top_k: int = 10) -> List[Dict]:
        """Search specifically for a topic"""
        return self.search(topic, top_k, {"mode": "research"})
    
    def search_debates(self, topic: str, top_k: int = 10) -> List[Dict]:
        """Search specifically for debates"""
        return self.search(topic, top_k, {"mode": "debate"})
    
    def get_suggestions(self, query: str, limit: int = 5) -> List[str]:
        """Get search suggestions/autocomplete based on past queries"""
        results = self.search(query, limit * 2)
        # Extract unique queries as suggestions
        suggestions = []
        seen = set()
        for r in results:
            q = r.get('query', '')[:80]
            if q and q not in seen:
                suggestions.append(q)
                seen.add(q)
            if len(suggestions) >= limit:
                break
        return suggestions
    
    def _get_relevance_label(self, score: float) -> str:
        if score > 0.85: return "VERY HIGH"
        if score > 0.7: return "HIGH"
        if score > 0.55: return "MEDIUM"
        return "LOW"

# Global instance
semantic_search = SemanticSearchEngine()