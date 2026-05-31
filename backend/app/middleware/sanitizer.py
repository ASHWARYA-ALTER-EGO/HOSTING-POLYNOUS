import re
from typing import Any, Dict

class InputSanitizer:
    """Sanitize user inputs to prevent injection attacks"""
    
    # Patterns to detect malicious input
    SQL_INJECTION_PATTERNS = [
        r"(\bSELECT\b.*\bFROM\b)|(\bDROP\b.*\bTABLE\b)|(\bINSERT\b.*\bINTO\b)",
        r"(\bDELETE\b.*\bFROM\b)|(\bUPDATE\b.*\bSET\b)|(\bUNION\b.*\bSELECT\b)",
        r"(--)|(;)|('.*OR.*'.*'.*')",
    ]
    
    XSS_PATTERNS = [
        r"<script.*?>.*?</script>",
        r"javascript:",
        r"onerror\s*=",
        r"onload\s*=",
        r"<iframe.*?>",
    ]
    
    @classmethod
    def sanitize_string(cls, text: str, max_length: int = 1000) -> str:
        """Sanitize a single string input"""
        if not isinstance(text, str):
            return ""
        
        # Trim to max length
        text = text[:max_length]
        
        # Remove null bytes
        text = text.replace('\x00', '')
        
        # Remove control characters (except newlines)
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
        
        return text.strip()
    
    @classmethod
    def sanitize_query(cls, query: str) -> str:
        """Sanitize a research query"""
        query = cls.sanitize_string(query, max_length=500)
        
        # Remove any HTML tags
        query = re.sub(r'<[^>]*>', '', query)
        
        # Remove potential script injection
        for pattern in cls.XSS_PATTERNS:
            query = re.sub(pattern, '', query, flags=re.IGNORECASE)
        
        return query
    
    @classmethod
    def sanitize_email(cls, email: str) -> str:
        """Sanitize and validate email"""
        email = cls.sanitize_string(email, max_length=255).lower()
        
        # Basic email validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return ""
        
        return email
    
    @classmethod
    def sanitize_dict(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """Recursively sanitize a dictionary"""
        sanitized = {}
        for key, value in data.items():
            if isinstance(value, str):
                sanitized[key] = cls.sanitize_string(value)
            elif isinstance(value, dict):
                sanitized[key] = cls.sanitize_dict(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    cls.sanitize_string(item) if isinstance(item, str) else item
                    for item in value
                ]
            else:
                sanitized[key] = value
        return sanitized
    
    @classmethod
    def detect_threats(cls, text: str) -> list:
        """Detect potential security threats in input"""
        threats = []
        
        for pattern in cls.SQL_INJECTION_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                threats.append("SQL_INJECTION")
                break
        
        for pattern in cls.XSS_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                threats.append("XSS")
                break
        
        if len(text) > 10000:
            threats.append("EXCESSIVE_LENGTH")
        
        return threats