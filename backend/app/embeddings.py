"""
OpenAI Embeddings Module for POLYNOUS
Uses text-embedding-3-small (1536 dimensions)
"""

from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

MODEL = "text-embedding-3-small"

def create_embedding(text: str) -> list:
    """Create embedding using OpenAI text-embedding-3-small"""
    try:
        text = text[:8000]
        response = client.embeddings.create(model=MODEL, input=text)
        return response.data[0].embedding
    except Exception as e:
        print(f"Embedding error: {e}")
        return []

def create_query_embedding(query: str) -> list:
    """Create embedding for search queries"""
    return create_embedding(query)

def create_embeddings_batch(texts: list) -> list:
    """Create embeddings for multiple texts"""
    try:
        texts = [t[:8000] for t in texts]
        response = client.embeddings.create(model=MODEL, input=texts)
        return [d.embedding for d in response.data]
    except Exception as e:
        print(f"Batch embedding error: {e}")
        return []