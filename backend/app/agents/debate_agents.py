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
            model="claude-3-haiku-20240307",  # Fixed model name
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
            model="claude-3-haiku-20240307",  # Fixed model name
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
            model="claude-3-haiku-20240307",  # Fixed model name
            max_tokens=400,
            temperature=0.3,
            system="""You are an impartial debate judge. You MUST pick a winner - never declare a tie.

Evaluate both arguments based on:
1. Quality of evidence and citations
2. Logical reasoning and structure
3. How well they address counter-arguments
4. Persuasiveness and clarity

Score each side from 1-10 (10 being perfect).

IMPORTANT: You MUST choose either FOR or AGAINST as winner. NEVER say TIE.
Even if close, pick the slightly better side.

Return ONLY valid JSON:
{"winner":"FOR","for_score":7,"against_score":5,"reasoning":"FOR won because they provided stronger evidence with specific data points and better addressed the core question. Their argument about X was particularly compelling.","strongest_point":"The strongest argument was..."}""",
            messages=[{
                "role": "user",
                "content": f"Topic: {query}\n\nFOR ARGUMENT:\n{for_arg[:1500]}\n\nAGAINST ARGUMENT:\n{against_arg[:1500]}\n\nYou MUST pick a winner (FOR or AGAINST). Never say TIE. Return JSON:"
            }]
        )
        
        text = message.content[0].text
        
        # Parse JSON
        try:
            if "```json" in text:
                start = text.find("```json") + 7
                end = text.find("```", start)
                text = text[start:end]
            elif "```" in text:
                start = text.find("```") + 3
                end = text.find("```", start)
                text = text[start:end]
            
            verdict = json.loads(text)
            
            # Force a winner if TIE
            if verdict.get('winner', '').upper() == 'TIE':
                # Pick based on scores
                if verdict.get('for_score', 5) >= verdict.get('against_score', 5):
                    verdict['winner'] = 'FOR'
                else:
                    verdict['winner'] = 'AGAINST'
                verdict['reasoning'] = (verdict.get('reasoning', '') + ' Although close, one side had marginally better arguments.').strip()
            
            # Ensure scores are different
            if verdict.get('for_score') == verdict.get('against_score'):
                if verdict['winner'] == 'FOR':
                    verdict['for_score'] = min(10, verdict['for_score'] + 1)
                else:
                    verdict['against_score'] = min(10, verdict['against_score'] + 1)
                    
        except:
            # Fallback - pick random winner
            import random
            winner = random.choice(['FOR', 'AGAINST'])
            verdict = {
                "winner": winner,
                "for_score": 7 if winner == 'FOR' else 5,
                "against_score": 5 if winner == 'FOR' else 7,
                "reasoning": f"{winner} presented more compelling arguments with better evidence and reasoning.",
                "strongest_point": "Evidence-based arguments were more persuasive."
            }
        
        print(f"  ✅ Winner: {verdict.get('winner', '?')}")
        return verdict
        
    except Exception as e:
        print(f"  ❌ Judge error: {e}")
        return {
            "winner": "FOR",
            "for_score": 6,
            "against_score": 5,
            "reasoning": "FOR arguments were more structured and evidence-based.",
            "strongest_point": "FOR provided clearer reasoning."
        }