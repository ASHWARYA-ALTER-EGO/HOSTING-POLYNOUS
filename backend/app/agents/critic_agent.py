from anthropic import Anthropic
import os
import json
from dotenv import load_dotenv

load_dotenv()
anthropic = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def critic_agent(summaries, query=""):
    """Analyze summaries for contradictions and confidence"""
    print("🔍 Critic: Analyzing...")
    
    try:
        combined = "\n\n".join(summaries)[:4000]
        
        message = anthropic.messages.create(
            model="claude-haiku-4-5",
            max_tokens=500,
            temperature=0.2,
            system="""You are a fact-checker. Return JSON:
{
    "claims": [],
    "contradictions": [],
    "overall_confidence": 75,
    "weak_claims": [],
    "recommendations": []
}""",
            messages=[{
                "role": "user",
                "content": f"Query: {query}\n\nSummaries:\n{combined}\n\nProvide JSON analysis:"
            }]
        )
        
        response_text = message.content[0].text
        
        # Parse JSON
        try:
            if "```json" in response_text:
                start = response_text.find("```json") + 7
                end = response_text.find("```", start)
                response_text = response_text[start:end]
            analysis = json.loads(response_text)
        except:
            analysis = {
                "claims": [],
                "contradictions": [],
                "overall_confidence": 60,
                "weak_claims": ["Parse error"],
                "recommendations": ["Verify manually"]
            }
        
        print(f"  ✅ Confidence: {analysis.get('overall_confidence', 'N/A')}%")
        return analysis
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return {
            "claims": [],
            "contradictions": [],
            "overall_confidence": 50,
            "weak_claims": [str(e)[:100]],
            "recommendations": ["Try again"]
        }