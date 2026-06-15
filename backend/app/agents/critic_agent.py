from anthropic import Anthropic
import os
import json
from dotenv import load_dotenv

load_dotenv()
anthropic = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def critic_agent(summaries, query=""):
    """Analyze summaries for contradictions and confidence"""
    print("  Critic: Analyzing...")
    
    try:
        combined = "\n\n".join(summaries)[:4000]
        
        message = anthropic.messages.create(
            model="claude-haiku-4-5",
            max_tokens=500,
            temperature=0.2,
            system="""You are a fact-checker for POLYNOUS. Analyze research summaries critically.

Return a JSON object with:
{
    "claims": [
        {"claim": "specific claim text", "confidence": 85, "sources_supporting": 2}
    ],
    "contradictions": [
        {"claim1": "first claim", "claim2": "contradicting claim", "explanation": "why they conflict"}
    ],
    "overall_confidence": 75,
    "weak_claims": ["claims with insufficient evidence"],
    "strengths": ["what the research does well"],
    "recommendations": ["how to improve the answer"]
}

Score confidence: 80-100 (strong agreement), 60-79 (minor disagreements), 40-59 (limited evidence), below 40 (unreliable)""",
            messages=[{
                "role": "user",
                "content": f"Query: {query}\n\nSummaries:\n{combined}\n\nProvide JSON analysis:"
            }]
        )
        
        response_text = message.content[0].text
        
        # Parse JSON from response
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
                "weak_claims": ["Could not parse analysis"],
                "strengths": [],
                "recommendations": ["Verify sources manually"]
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