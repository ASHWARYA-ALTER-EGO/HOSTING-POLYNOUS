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
                system="""You are a research summarizer for POLYNOUS. Extract key information from documents.

For each document, provide:
1. The main argument or finding (1 sentence)
2. Key data points, statistics, or evidence mentioned
3. Any limitations or caveats noted
4. The overall reliability of the source

Be specific. Include numbers, dates, and proper nouns when available.
Keep each summary to 5-7 lines maximum.""",
                messages=[{
                    "role": "user",
                    "content": f"Summarize this document:\n\nTitle: {title}\nContent: {content}\n\nProvide a structured summary with the 4 points above:"
                }]
            )
            
            summary = message.content[0].text
            summaries.append(f"Source {i+1} ({title}):\n{summary}")
            print(f"  ✅ Summarized source {i+1}")
            
        except Exception as e:
            summaries.append(f"Source {i+1}: Error - {str(e)[:100]}")
            print(f"  ❌ Error summarizing source {i+1}: {e}")
    
    return summaries