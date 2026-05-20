from anthropic import Anthropic
import os
from dotenv import load_dotenv

load_dotenv()
anthropic = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def writer_agent(query, summaries, critique, citations):
    """Create final comprehensive answer with beautiful formatting"""
    print("✍️ Writer: Creating answer...")
    
    try:
        summary_text = "\n".join(summaries)[:3000]
        confidence = critique.get('overall_confidence', 'N/A')
        contradictions = critique.get('contradictions', [])
        contradictions_count = len(contradictions)
        
        citation_text = "\n".join([
            f"[{i+1}] {c.get('title', 'Untitled')}"
            for i, c in enumerate(citations)
        ])
        
        context = f"""Original Query: {query}

Research Sources:
{summary_text}

Quality Analysis:
- Overall Confidence: {confidence}%
- Contradictions Found: {contradictions_count}

Available Citations:
{citation_text}"""
        
        message = anthropic.messages.create(
            model="claude-haiku-4-5",
            max_tokens=800,
            temperature=0.5,
            system="""You are a research writer for POLYNOUS. Create beautifully structured, clean answers.

FORMAT YOUR ENTIRE RESPONSE EXACTLY LIKE THIS EXAMPLE:

📋 SUMMARY
Nuclear energy has a strong safety record compared to fossil fuels, with multiple redundant safety systems in modern reactors. However, waste disposal and accident risks remain significant challenges that require ongoing management.

🔑 KEY FINDINGS
• Nuclear power causes fewer deaths per terawatt-hour than coal, oil, or natural gas according to data from the World Health Organization and Lancet studies [1]
• Modern Generation III+ reactors incorporate passive safety features that automatically shut down without human intervention during emergencies [2]
• The International Atomic Energy Agency enforces safety protocols across 440+ reactors in 30+ countries with a compliance rate above 95% [3]
• Long-term storage of high-level nuclear waste remains unresolved, with only Finland having completed a permanent geological repository as of 2024 [1]

⚠️ LIMITATIONS & UNCERTAINTIES
The sources agree on nuclear's strong operational safety metrics but diverge on waste management timelines. Public perception studies show higher perceived risk than statistical reality. Some data on construction costs comes from industry sources which may have inherent bias.

🎯 CONFIDENCE ASSESSMENT
Overall confidence: 85% — Multiple authoritative sources including the IAEA and peer-reviewed studies agree on core safety data. Minor disagreements exist around waste disposal timeframes and economic viability.

IMPORTANT FORMATTING RULES:
- Use clear section headers with emojis
- Each KEY FINDING must be a complete sentence with specific details
- Always include [citation numbers] after each finding
- Separate sections with blank lines
- Be specific with numbers, dates, and proper names
- Never write vague statements like "sources disagree" without explaining how
- Always include the CONFIDENCE ASSESSMENT section""",
            messages=[{
                "role": "user",
                "content": f"{context}\n\nWrite a comprehensive, beautifully structured research answer following the EXACT format shown above:"
            }]
        )
        
        answer = message.content[0].text
        print("  ✅ Answer created!")
        return answer
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return f"Error creating answer: {str(e)}"