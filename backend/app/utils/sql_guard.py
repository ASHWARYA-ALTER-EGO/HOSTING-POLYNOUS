"""
SQL Injection Prevention — Parameter Validators
"""
import re
from fastapi import HTTPException

def validate_session_id(session_id: str) -> str:
    """Validate session/user ID"""
    if not session_id or not isinstance(session_id, str):
        raise HTTPException(status_code=400, detail="Invalid session ID")
    
    cleaned = re.sub(r'[^a-zA-Z0-9_\-@.]', '', session_id)[:100]
    
    if not cleaned:
        raise HTTPException(status_code=400, detail="Invalid session ID")
    
    return cleaned

def validate_topic_param(topic: str) -> str:
    """Validate topic parameter"""
    if not topic or not isinstance(topic, str):
        raise HTTPException(status_code=400, detail="Topic required")
    
    cleaned = re.sub(r'[<>{}();]', '', topic)[:200]
    
    if not cleaned.strip():
        raise HTTPException(status_code=400, detail="Invalid topic")
    
    return cleaned.strip()

def validate_limit_param(limit: int) -> int:
    """Validate limit parameter"""
    if limit < 1:
        return 1
    if limit > 100:
        return 100
    return limit

def is_safe_input(value: str) -> bool:
    """Check for malicious patterns"""
    if not value:
        return True
    
    dangerous = [
        r'<script', r'javascript:', r'<iframe',
        r'SELECT.*FROM', r'DROP\s+TABLE', r'UNION\s+SELECT',
        r'\.\.\/', r'\.\.\\',
    ]
    
    for pattern in dangerous:
        if re.search(pattern, value, re.IGNORECASE):
            return False
    
    return True

def sanitize_sql_input(value: str) -> str:
    """Sanitize input for SQL safety"""
    if not value:
        return value
    
    value = value.replace("'", "''")
    value = re.sub(r'--.*$', '', value, flags=re.MULTILINE)
    value = re.sub(r'/\*.*?\*/', '', value, flags=re.DOTALL)
    value = value.replace(';', '')
    
    return value.strip()[:5000]