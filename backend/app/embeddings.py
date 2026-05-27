import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def create_embedding(text: str) -> list:
    """Create embedding for document text using OpenAI"""
    try:
        # Truncate text if too long (OpenAI limit is ~8191 tokens)
        text = text[:8000]
        
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text,
            encoding_format="float"
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"❌ Embedding error: {e}")
        return None

def create_query_embedding(query: str) -> list:
    """Create embedding for search query"""
    return create_embedding(query)