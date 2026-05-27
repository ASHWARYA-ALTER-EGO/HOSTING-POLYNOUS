# reset_pinecone.py
import os
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv()

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

INDEX_NAME = "polynous-pdfs"

# Delete old index
try:
    pc.delete_index(INDEX_NAME)
    print(f"✅ Deleted old index: {INDEX_NAME}")
except Exception as e:
    print(f"⚠️ Could not delete index: {e}")

# Create new index with correct dimension
try:
    pc.create_index(
        name=INDEX_NAME,
        dimension=1536,  # OpenAI embedding dimension
        metric="cosine",
        spec={"serverless": {"cloud": "aws", "region": "us-east-1"}}
    )
    print(f"✅ Created new index with dimension 1536")
except Exception as e:
    print(f"❌ Error creating index: {e}")