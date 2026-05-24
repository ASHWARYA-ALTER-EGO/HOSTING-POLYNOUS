import voyageai
import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

# Initialize Voyage client
vo = voyageai.Client(api_key=os.getenv("VOYAGE_API_KEY"))

# Test connection
try:
    result = vo.embed(["test"], model="voyage-3-lite", input_type="document")
    print("✅ Voyage AI Connected!")
except Exception as e:
    print(f"⚠️ Voyage AI error: {e}")

def create_embedding(text: str, input_type: str = "document") -> List[float]:
    """
    Create embedding vector using Voyage AI
    
    Args:
        text: Text to embed
        input_type: "document" for indexing, "query" for searching
    
    Returns:
        List of floats (embedding vector)
    """
    try:
        # Truncate text if needed (Voyage handles up to 32k tokens)
        text = text[:8000]
        
        result = vo.embed(
            [text], 
            model="voyage-3-lite",
            input_type=input_type
        )
        return result.embeddings[0]
    except Exception as e:
        print(f"Embedding error: {e}")
        return []

def create_embeddings_batch(texts: List[str], input_type: str = "document") -> List[List[float]]:
    """Create embeddings for multiple texts"""
    try:
        result = vo.embed(
            texts, 
            model="voyage-3-lite",
            input_type=input_type
        )
        return result.embeddings
    except Exception as e:
        print(f"Batch embedding error: {e}")
        return []

def create_query_embedding(query: str) -> List[float]:
    """Create embedding specifically for search queries"""
    return create_embedding(query, input_type="query")