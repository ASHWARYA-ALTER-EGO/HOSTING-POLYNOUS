from app.embeddings import create_embedding
from pinecone import Pinecone
import os
from dotenv import load_dotenv
load_dotenv()

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("polynous-memory")

test_data = [
    {"id": "q1", "query": "What is artificial intelligence?", "answer": "Artificial intelligence is the simulation of human intelligence processes by machines.", "mode": "research", "confidence": 87},
    {"id": "q2", "query": "How does machine learning work?", "answer": "Machine learning uses statistical techniques to give computers the ability to learn from data.", "mode": "research", "confidence": 92},
    {"id": "q3", "query": "What are neural networks?", "answer": "Neural networks are computing systems inspired by biological neural networks in the human brain.", "mode": "research", "confidence": 85},
    {"id": "q4", "query": "Should AI be regulated by governments?", "answer": "Debate on AI regulation shows both sides have valid concerns about safety and innovation.", "mode": "debate", "confidence": 78},
    {"id": "q5", "query": "What is quantum computing?", "answer": "Quantum computing harnesses quantum mechanics to solve complex problems faster than classical computers.", "mode": "research", "confidence": 90},
    {"id": "q6", "query": "How does deep learning differ from ML?", "answer": "Deep learning is a subset of machine learning using multi-layered neural networks.", "mode": "research", "confidence": 88},
    {"id": "q7", "query": "Is AI dangerous for humanity?", "answer": "Experts debate whether AI poses existential risks or will benefit humanity.", "mode": "debate", "confidence": 75},
    {"id": "q8", "query": "How does natural language processing work?", "answer": "NLP enables computers to understand and generate human language using transformers.", "mode": "research", "confidence": 86},
    {"id": "q9", "query": "What is computer vision?", "answer": "Computer vision enables machines to interpret visual information from the world.", "mode": "research", "confidence": 83},
    {"id": "q10", "query": "Should we fear AI taking jobs?", "answer": "While AI will automate some jobs, it will also create new opportunities requiring human skills.", "mode": "debate", "confidence": 72},
]

for item in test_data:
    text = item['query'] + " " + item['answer']
    embedding = create_embedding(text)
    if embedding:
        index.upsert(vectors=[{
            "id": item['id'],
            "values": embedding,
            "metadata": {
                "query": item['query'],
                "answer": item['answer'],
                "mode": item['mode'],
                "confidence": item['confidence']
            }
        }])
        print(f"✅ {item['id']}: {item['query'][:50]}...")

print("\n🎉 All 10 test entries indexed!")