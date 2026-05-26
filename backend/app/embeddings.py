from openai import OpenAI
import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def create_embedding(text: str) -> List[float]:
    """Create embedding using OpenAI"""
    try:
        text = text[:8000]
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Embedding error: {e}")
        return []

def create_query_embedding(query: str) -> List[float]:
    """Create embedding for search query"""
    return create_embedding(query)

def create_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Create embeddings for multiple texts"""
    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=[t[:8000] for t in texts]
        )
        return [d.embedding for d in response.data]
    except Exception as e:
        print(f"Batch embedding error: {e}")
        return []