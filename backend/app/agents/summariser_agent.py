from anthropic import Anthropic
import os
from dotenv import load_dotenv

load_dotenv()
anthropic = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def summariser_agent(documents, query=""):
    """Summarize each document to extract key points"""
    summaries = []
    
    for i, doc in enumerate(documents):
        try:
            content = doc.get('content', '')[:2000]
            title = doc.get('title', 'Untitled')
            
            message = anthropic.messages.create(
                model="claude-haiku-4-5",
                max_tokens=300,
                temperature=0.3,
                system="You are a research summarizer. Summarize in 3-5 bullet points.",
                messages=[{
                    "role": "user",
                    "content": f"Summarize:\nTitle: {title}\nContent: {content}\n\nKey Points:"
                }]
            )
            
            summary = message.content[0].text
            summaries.append(f"Source {i+1} ({title}):\n{summary}")
            print(f"  ✅ Summarized source {i+1}")
            
        except Exception as e:
            summaries.append(f"Source {i+1}: Error - {str(e)[:100]}")
            print(f"  ❌ Error: {e}")
    
    return summaries