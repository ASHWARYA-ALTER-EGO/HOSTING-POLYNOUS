from anthropic import Anthropic
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

def get_llm_client(user_api_key=None, provider="anthropic"):
    """Get LLM client - uses user's key if provided, else system key"""
    
    if provider == "anthropic":
        api_key = user_api_key or os.getenv("ANTHROPIC_API_KEY")
        return Anthropic(api_key=api_key)
    elif provider == "openai":
        api_key = user_api_key or os.getenv("OPENAI_API_KEY")
        return OpenAI(api_key=api_key)
    else:
        # Default to Anthropic
        api_key = user_api_key or os.getenv("ANTHROPIC_API_KEY")
        return Anthropic(api_key=api_key)

def get_llm_response(messages, user_api_key=None, provider="anthropic", temperature=0.7):
    """Get LLM response with user's preferred provider"""
    client = get_llm_client(user_api_key, provider)
    
    if provider == "openai":
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=temperature
        )
        return response.choices[0].message.content
    else:
        # Anthropic (default)
        system_msg = next((m["content"] for m in messages if m["role"] == "system"), "")
        user_msgs = [m for m in messages if m["role"] != "system"]
        
        response = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=800,
            temperature=temperature,
            system=system_msg if system_msg else "You are a helpful research assistant.",
            messages=user_msgs
        )
        return response.content[0].text