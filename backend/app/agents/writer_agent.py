from anthropic import Anthropic
import os
from dotenv import load_dotenv

load_dotenv()
anthropic = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def writer_agent(query, summaries, critique, citations):
    """Create final comprehensive answer"""
    print("✍️ Writer: Creating answer...")
    
    try:
        summary_text = "\n".join(summaries)[:3000]
        confidence = critique.get('overall_confidence', 'N/A')
        contradictions_count = len(critique.get('contradictions', []))
        
        citation_text = "\n".join([
            f"[{i+1}] {c.get('title', 'Untitled')}"
            for i, c in enumerate(citations)
        ])
        
        context = f"""Query: {query}

Sources:
{summary_text}

Quality: {confidence}% confidence, {contradictions_count} contradictions

Citations:
{citation_text}"""
        
        message = anthropic.messages.create(
            model="claude-haiku-4-5",
            max_tokens=500,
            temperature=0.5,
            system="""You are a research writer. Format your answer as:

SUMMARY: [1-2 sentence answer]

KEY FINDINGS:
• [Finding with citation]
• [Finding with citation]

UNCERTAINTIES: [Any contradictions or limitations]

CONFIDENCE: [Assessment]

SOURCES: [List sources]""",
            messages=[{
                "role": "user",
                "content": context + "\n\nWrite the research answer:"
            }]
        )
        
        answer = message.content[0].text
        print("  ✅ Answer created!")
        return answer
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return f"Error: {str(e)}"