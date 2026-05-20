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

def judge_debate(for_arg: str, against_arg: str, query: str) -> dict:
    """Judge which side won the debate"""
    print("  ⚖️ JUDGE: Evaluating...")
    
    try:
        message = anthropic.messages.create(
            model="claude-haiku-4-5",
            max_tokens=500,
            temperature=0.3,
            system="""You are an impartial debate judge for POLYNOUS. Evaluate both arguments fairly.

Return a JSON object with this EXACT structure:
{
    "winner": "FOR" or "AGAINST" or "TIE",
    "for_score": 7.5,
    "against_score": 6.0,
    "reasoning": "Clear explanation of why one side won. Be specific about which arguments were strongest and weakest.",
    "strongest_point": "The single most compelling argument from either side",
    "for_strengths": ["strength 1", "strength 2"],
    "against_strengths": ["strength 1", "strength 2"],
    "for_weaknesses": ["weakness 1"],
    "against_weaknesses": ["weakness 1"]
}

Score on a scale of 1-10 based on: evidence quality, logical reasoning, addressing counter-arguments, and persuasiveness.""",
            messages=[{
                "role": "user",
                "content": f"Topic: {query}\n\nFOR ARGUMENT:\n{for_arg[:1500]}\n\nAGAINST ARGUMENT:\n{against_arg[:1500]}\n\nEvaluate both sides and return JSON:"
            }]
        )
        
        text = message.content[0].text
        
        # Parse JSON
        try:
            if "```json" in text:
                start = text.find("```json") + 7
                end = text.find("```", start)
                text = text[start:end]
            verdict = json.loads(text)
        except:
            verdict = {
                "winner": "TIE",
                "for_score": 5,
                "against_score": 5,
                "reasoning": "Could not evaluate debate properly.",
                "strongest_point": "N/A",
                "for_strengths": [],
                "against_strengths": [],
                "for_weaknesses": [],
                "against_weaknesses": []
            }
        
        print(f"  ✅ Winner: {verdict.get('winner', 'TIE')}")
        return verdict
        
    except Exception as e:
        print(f"  ❌ Judge error: {e}")
        return {
            "winner": "TIE",
            "for_score": 5,
            "against_score": 5,
            "reasoning": f"Error: {str(e)[:100]}",
            "strongest_point": "N/A",
            "for_strengths": [],
            "against_strengths": [],
            "for_weaknesses": [],
            "against_weaknesses": []
        }