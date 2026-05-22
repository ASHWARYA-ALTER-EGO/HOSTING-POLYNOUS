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
        try:
            response = openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=text[:8000]
            )
            return response.data[0].embedding
        except:
            return []
    
    def search(self, query: str, top_k: int = 10, filters: Dict = None) -> List[Dict]:
        if not self.index:
            return []
        try:
            embedding = self.create_embedding(query)
            if not embedding:
                return []
            results = self.index.query(vector=embedding, top_k=top_k, include_metadata=True, filter=filters)
            matches = []
            for match in results.get('matches', []):
                if match.score > 0.3:
                    meta = match.metadata or {}
                    matches.append({
                        "id": match.id,
                        "score": round(match.score * 100, 1),
                        "query": meta.get('query', ''),
                        "answer": meta.get('answer', '')[:300],
                        "mode": meta.get('mode', 'research'),
                        "confidence": meta.get('confidence', 0),
                        "sources": meta.get('sources', []),
                    })
            return matches
        except Exception as e:
            print(f"Search error: {e}")
            return []
    
    def get_suggestions(self, query: str, limit: int = 5) -> List[str]:
        results = self.search(query, limit * 2)
        seen = set()
        suggestions = []
        for r in results:
            q = r.get('query', '')[:80]
            if q and q not in seen:
                suggestions.append(q)
                seen.add(q)
            if len(suggestions) >= limit:
                break
        return suggestions

semantic_search = SemanticSearchEngine()