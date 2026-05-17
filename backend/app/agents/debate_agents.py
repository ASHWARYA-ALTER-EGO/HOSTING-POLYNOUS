from anthropic import Anthropic
import os
import json
from dotenv import load_dotenv

load_dotenv()
anthropic = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def argue_for_position(query: str, context: list) -> str:
    """Argue FOR the main proposition"""
    print("  🟢 FOR: Building argument...")
    
    try:
        context_text = "\n".join(context[:2]) if context else "No sources provided"
        
        message = anthropic.messages.create(
            model="claude-haiku-4-5",
            max_tokens=400,
            temperature=0.8,
            system="""You are a debate champion arguing FOR a proposition.
Use evidence from provided sources.
Make 2-3 strong points with citations.
Be persuasive but factual.
Start with: 'ARGUMENT FOR:'""",
            messages=[{
                "role": "user",
                "content": f"Proposition: {query}\n\nSources:\n{context_text}\n\nArgue FOR this proposition:"
            }]
        )
        
        argument = message.content[0].text
        print("  ✅ FOR argument ready")
        return argument
        
    except Exception as e:
        print(f"  ❌ FOR error: {e}")
        return f"ERROR: {str(e)}"

def argue_against_position(query: str, context: list) -> str:
    """Argue AGAINST the main proposition"""
    print("  🔴 AGAINST: Building counter-argument...")
    
    try:
        context_text = "\n".join(context[:2]) if context else "No sources provided"
        
        message = anthropic.messages.create(
            model="claude-haiku-4-5",
            max_tokens=400,
            temperature=0.8,
            system="""You are a debate champion arguing AGAINST a proposition.
Use evidence from provided sources.
Make 2-3 strong counter-points with citations.
Be persuasive but factual.
Start with: 'ARGUMENT AGAINST:'""",
            messages=[{
                "role": "user",
                "content": f"Proposition: {query}\n\nSources:\n{context_text}\n\nArgue AGAINST this proposition:"
            }]
        )
        
        argument = message.content[0].text
        print("  ✅ AGAINST argument ready")
        return argument
        
    except Exception as e:
        print(f"  ❌ AGAINST error: {e}")
        return f"ERROR: {str(e)}"

def judge_debate(for_argument: str, against_argument: str, query: str) -> dict:
    """Judge which side won the debate"""
    print("  ⚖️ JUDGE: Evaluating debate...")
    
    try:
        message = anthropic.messages.create(
            model="claude-haiku-4-5",
            max_tokens=300,
            temperature=0.3,
            system="""You are an impartial debate judge. Return JSON only:
{
    "winner": "FOR" or "AGAINST" or "TIE",
    "reasoning": "Brief explanation",
    "strongest_point": "Best argument from either side",
    "for_score": 7,
    "against_score": 8
}""",
            messages=[{
                "role": "user",
                "content": f"Topic: {query}\n\nFOR:\n{for_argument[:1500]}\n\nAGAINST:\n{against_argument[:1500]}\n\nJudge and return JSON:"
            }]
        )
        
        response_text = message.content[0].text
        
        # Parse JSON
        try:
            if "```json" in response_text:
                start = response_text.find("```json") + 7
                end = response_text.find("```", start)
                response_text = response_text[start:end]
            verdict = json.loads(response_text)
        except:
            verdict = {
                "winner": "TIE",
                "reasoning": "Both sides presented valid arguments",
                "strongest_point": "Could not determine",
                "for_score": 5,
                "against_score": 5
            }
        
        print(f"  ✅ Winner: {verdict.get('winner', 'TIE')}")
        return verdict
        
    except Exception as e:
        print(f"  ❌ Judge error: {e}")
        return {
            "winner": "TIE",
            "reasoning": f"Error in judgment: {str(e)[:100]}",
            "strongest_point": "N/A",
            "for_score": 5,
            "against_score": 5
        }