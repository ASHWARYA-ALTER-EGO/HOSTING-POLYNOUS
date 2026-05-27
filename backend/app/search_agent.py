from tavily import TavilyClient
from anthropic import Anthropic
import os
from dotenv import load_dotenv

# Force load .env from current directory
load_dotenv()

# Debug: Print if keys are loaded (remove this in production)
anthropic_key = os.getenv("ANTHROPIC_API_KEY")
tavily_key = os.getenv("TAVILY_API_KEY")

print(f"Anthropic Key loaded: {'Yes' if anthropic_key else 'No'}")
print(f"Tavily Key loaded: {'Yes' if tavily_key else 'No'}")

# Initialize API clients
if not anthropic_key:
    raise ValueError("ANTHROPIC_API_KEY not found in environment variables!")
if not tavily_key:
    raise ValueError("TAVILY_API_KEY not found in environment variables!")

tavily = TavilyClient(api_key=tavily_key)
anthropic = Anthropic(api_key=anthropic_key)

def search_web(query: str, session_id: str = "guest_user"):
    """Search the web using Tavily"""
    try:
        print(f"🔍 Searching for: {query} (session: {session_id})")
        response = tavily.search(
            query=query,
            search_depth="basic",
            max_results=3
        )
        return response.get('results', [])
    except Exception as e:
        print(f"Search error: {e}")
        return []

def format_search_results(results):
    """Format search results for Claude"""
    if not results:
        return "No search results found."
    
    formatted = []
    for i, result in enumerate(results, 1):
        formatted.append(
            f"Source {i}:\n"
            f"Title: {result.get('title', 'Untitled')}\n"
            f"Content: {result.get('content', '')[:500]}\n"
            f"URL: {result.get('url', '')}\n"
        )
    
    return "\n---\n".join(formatted)

def ask_claude_with_context(query: str, context: str, session_id: str = "guest_user") -> str:
    """Ask Claude AI with search context"""
    try:
        print(f"🤖 Asking Claude about: {query} (session: {session_id})")
        message = anthropic.messages.create(
            model="claude-haiku-4-5",  # Fixed model name
            max_tokens=500,
            temperature=0.3,
            system="You are a research assistant. Use the provided search results to answer questions. Always cite your sources by number [1], [2], etc. If search results don't contain the answer, say so.",
            messages=[{
                "role": "user",
                "content": f"Search Results:\n{context}\n\nQuestion: {query}\n\nAnswer (with source citations):"
            }]
        )
        return message.content[0].text
    except Exception as e:
        return f"Error getting AI response: {str(e)}"