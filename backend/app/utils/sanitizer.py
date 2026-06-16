"""
POLYNOUS Input Sanitization Module
Every user input MUST pass through these functions before processing.
"""
import re
import html as html_module
import os
import unicodedata
from typing import Optional, List, Dict, Any

# ============================================================
# DANGEROUS PATTERNS — Regex patterns to detect attacks
# ============================================================

XSS_PATTERNS = [
    r'<script[^>]*>.*?</script>',
    r'javascript\s*:',
    r'on\w+\s*=\s*["\'].*?["\']',
    r'on\w+\s*=\s*\w+',
    r'<iframe[^>]*>',
    r'<embed[^>]*>',
    r'<object[^>]*>',
    r'data\s*:\s*text/html',
    r'eval\s*\(',
    r'document\.cookie',
    r'document\.location',
    r'window\.location',
    r'<svg[^>]*onload',
    r'<img[^>]*onerror',
    r'<body[^>]*onload',
    r'expression\s*\(',
    r'vbscript\s*:',
]

SQL_INJECTION_PATTERNS = [
    r'\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)\b',
    r'(\bUNION\b.*\bSELECT\b)',
    r';\s*(DROP|DELETE|INSERT|UPDATE)',
    r'\/\*.*\*\/',          # Block comments
    r'--[^\n]*$',           # Line comments
    r'WAITFOR\s+DELAY',
    r'BENCHMARK\s*\(',
    r'SLEEP\s*\(',
    r'pg_sleep\s*\(',
]

PATH_TRAVERSAL_PATTERNS = [
    r'\.\.\/',
    r'\.\.\\',
    r'%2e%2e\/',
    r'%2e%2e%5c',
    r'\.\.%2f',
    r'%2e%2e%2f',
    r'\.\.%5c',
    r'%2e%2e%5c',
]

COMMAND_INJECTION_PATTERNS = [
    r'\$\(.*?\)',
    r'`.*?`',
    r'\|.*\b(bash|sh|cmd|powershell)\b',
    r'&&\s*(rm|del|wget|curl|nc|netcat)',
    r';\s*(rm|del|wget|curl|nc|netcat)',
    r'\/bin\/bash',
    r'\/bin\/sh',
    r'cmd\.exe',
    r'powershell\.exe',
]

# ============================================================
# CORE SANITIZATION FUNCTIONS
# ============================================================

def strip_control_characters(text: str) -> str:
    """Remove ASCII control characters (0x00-0x1F except \n, \r, \t)"""
    if not text:
        return text
    
    # Remove null bytes first
    text = text.replace('\x00', '')
    
    # Remove control characters (keep \n, \r, \t)
    cleaned = []
    for char in text:
        code = ord(char)
        if code < 32 and char not in ('\n', '\r', '\t'):
            continue
        if code == 127:  # DEL character
            continue
        cleaned.append(char)
    
    return ''.join(cleaned)

def strip_unicode_control_characters(text: str) -> str:
    """Remove Unicode control and special characters"""
    if not text:
        return text
    
    # Remove BOM
    text = text.replace('\ufeff', '')
    
    # Remove zero-width characters
    text = text.replace('\u200b', '')  # Zero-width space
    text = text.replace('\u200c', '')  # Zero-width non-joiner
    text = text.replace('\u200d', '')  # Zero-width joiner
    text = text.replace('\u200e', '')  # Left-to-right mark
    text = text.replace('\u200f', '')  # Right-to-left mark
    text = text.replace('\ufeff', '')  # BOM
    
    # Remove Unicode control characters
    cleaned = []
    for char in text:
        category = unicodedata.category(char)
        if category in ('Cc', 'Cf', 'Cs', 'Co', 'Cn'):
            continue
        cleaned.append(char)
    
    return ''.join(cleaned)

def remove_html_tags(text: str) -> str:
    """Strip ALL HTML/XML tags from text"""
    if not text:
        return text
    
    # Remove all tag-like structures
    text = re.sub(r'<[^>]*>', '', text)
    
    return text

def remove_script_content(text: str) -> str:
    """Remove any script-like content"""
    if not text:
        return text
    
    for pattern in XSS_PATTERNS:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    return text

def remove_sql_content(text: str) -> str:
    """Remove potential SQL injection content"""
    if not text:
        return text
    
    for pattern in SQL_INJECTION_PATTERNS:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    # Remove semicolons (prevent stacked queries)
    text = text.replace(';', '')
    
    return text

def remove_command_content(text: str) -> str:
    """Remove potential command injection content"""
    if not text:
        return text
    
    for pattern in COMMAND_INJECTION_PATTERNS:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    return text

def remove_path_traversal(text: str) -> str:
    """Remove path traversal attempts"""
    if not text:
        return text
    
    for pattern in PATH_TRAVERSAL_PATTERNS:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    return text

def normalize_whitespace(text: str) -> str:
    """Collapse multiple spaces/newlines into single spaces"""
    if not text:
        return text
    
    # Replace all whitespace with single space
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()

def limit_length(text: str, max_length: int = 5000) -> str:
    """Truncate text to maximum length"""
    if not text:
        return text
    
    return text[:max_length]

# ============================================================
# PUBLIC SANITIZATION FUNCTIONS — Use these in your routes
# ============================================================

def sanitize_text(text: str, max_length: int = 5000, allow_html: bool = False) -> str:
    """
    General-purpose text sanitizer.
    Removes control chars, XSS, SQL injection, command injection.
    
    Args:
        text: The user input to sanitize
        max_length: Maximum allowed length
        allow_html: If True, preserves safe HTML (for rich text)
    
    Returns:
        Sanitized text string
    """
    if not text or not isinstance(text, str):
        return ""
    
    # Step 1: Remove null bytes and control characters
    text = strip_control_characters(text)
    
    # Step 2: Remove Unicode control characters
    text = strip_unicode_control_characters(text)
    
    # Step 3: Handle HTML
    if not allow_html:
        text = remove_html_tags(text)
    
    # Step 4: Remove injection attempts
    text = remove_script_content(text)
    text = remove_sql_content(text)
    text = remove_command_content(text)
    text = remove_path_traversal(text)
    
    # Step 5: Normalize whitespace
    text = normalize_whitespace(text)
    
    # Step 6: Limit length
    text = limit_length(text, max_length)
    
    return text

def sanitize_query(query: str) -> str:
    """
    Sanitize research query — used by /ask endpoint
    Allows questions and natural language, blocks all attacks
    """
    return sanitize_text(query, max_length=2000, allow_html=False)

def sanitize_email(email: str) -> Optional[str]:
    """
    Validate and sanitize email address
    
    Returns:
        Cleaned email string, or None if invalid
    """
    if not email or not isinstance(email, str):
        return None
    
    # Clean
    email = email.strip().lower()
    
    # Remove injection patterns
    email = sanitize_text(email, max_length=255)
    
    # Remove all whitespace
    email = re.sub(r'\s+', '', email)
    
    # Validate email format
    pattern = r'^[a-zA-Z0-9][a-zA-Z0-9._%+\-]*@[a-zA-Z0-9][a-zA-Z0-9.\-]*\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return None
    
    # Additional safety checks
    if '..' in email or '@@' in email or '--' in email:
        return None
    
    return email

def sanitize_username(username: str) -> str:
    """
    Sanitize username — alphanumeric + underscore + hyphen only
    """
    if not username or not isinstance(username, str):
        return "User"
    
    # Clean
    username = sanitize_text(username, max_length=50)
    
    # Remove HTML entities
    username = html_module.unescape(username)
    
    # Only allow safe characters
    username = re.sub(r'[^a-zA-Z0-9 _\-]', '', username)
    
    # Normalize spaces
    username = normalize_whitespace(username)
    
    # Fallback
    if not username.strip():
        return "User"
    
    return username[:50]

def sanitize_password(password: str) -> Optional[str]:
    """
    Validate password — checks length only, doesn't modify content
    """
    if not password or not isinstance(password, str):
        return None
    
    # Strip whitespace from ends only
    password = password.strip()
    
    # Length checks
    if len(password) < 6:
        return None
    
    if len(password) > 128:
        return None
    
    # Don't sanitize password content — users can use any characters
    return password

def sanitize_url(url: str) -> Optional[str]:
    """
    Validate and sanitize URLs
    Only allows http:// and https:// protocols
    """
    if not url or not isinstance(url, str):
        return None
    
    # Clean
    url = url.strip()
    url = strip_control_characters(url)
    
    # Protocol check
    url_lower = url.lower()
    if not url_lower.startswith(('http://', 'https://')):
        return None
    
    # Block dangerous protocols
    blocked = ['javascript:', 'data:', 'file:', 'ftp:', 'gopher:', 'telnet:']
    for proto in blocked:
        if proto in url_lower:
            return None
    
    # Remove path traversal
    url = remove_path_traversal(url)
    
    # Basic URL structure validation
    pattern = r'^https?://[^\s<>"{}|\\^`\[\]]+$'
    if not re.match(pattern, url):
        return None
    
    # Limit length
    return url[:2048]

def sanitize_filename(filename: str) -> str:
    """
    Sanitize uploaded filename — prevents path traversal and dangerous extensions
    """
    if not filename or not isinstance(filename, str):
        return "untitled.pdf"
    
    # Get only the filename, discard any path
    filename = os.path.basename(filename.replace('\\', '/'))
    
    # Remove null bytes
    filename = filename.replace('\x00', '')
    
    # Remove special characters
    filename = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', filename)
    
    # Remove leading dots (hidden files on Unix)
    filename = filename.lstrip('.')
    
    # Limit length
    name, ext = os.path.splitext(filename)
    name = name[:100]
    ext = ext[:10]
    
    # Ensure extension
    if not ext or len(ext) > 10:
        ext = '.pdf'
    
    return f"{name}{ext}"

def sanitize_search_query(query: str) -> str:
    """
    Sanitize semantic search query
    """
    if not query or not isinstance(query, str):
        return ""
    
    # Clean
    query = sanitize_text(query, max_length=500)
    
    # Keep only word characters, spaces, and basic punctuation
    query = re.sub(r'[^\w\s\-?.,!@#$%^&*()+=:;\'\"\/]', '', query)
    
    return query.strip()

def sanitize_debate_topic(topic: str) -> str:
    """
    Sanitize debate topic
    """
    if not topic or not isinstance(topic, str):
        return ""
    
    return sanitize_text(topic, max_length=500, allow_html=False)

def sanitize_session_id(session_id: str) -> str:
    """
    Sanitize session/user ID parameter
    """
    if not session_id or not isinstance(session_id, str):
        return "guest_user"
    
    # Only allow alphanumeric, underscore, hyphen, @, .
    session_id = re.sub(r'[^a-zA-Z0-9_\-@.]', '', session_id)
    
    return session_id[:100] or "guest_user"

# ============================================================
# SAFETY CHECK FUNCTION
# ============================================================

def is_safe_input(value: str) -> bool:
    """
    Check if input appears safe (no obvious attack patterns)
    Returns True if input looks safe, False if suspicious
    """
    if not value or not isinstance(value, str):
        return True
    
    # Check all dangerous patterns
    all_patterns = (
        XSS_PATTERNS + 
        SQL_INJECTION_PATTERNS + 
        COMMAND_INJECTION_PATTERNS + 
        PATH_TRAVERSAL_PATTERNS
    )
    
    for pattern in all_patterns:
        if re.search(pattern, value, re.IGNORECASE):
            return False
    
    # Check for null bytes
    if '\x00' in value:
        return False
    
    return True

# ============================================================
# BULK SANITIZER FOR DICTIONARIES
# ============================================================

def sanitize_dict(data: Dict[str, Any], max_length: int = 5000) -> Dict[str, Any]:
    """
    Recursively sanitize all string values in a dictionary
    """
    if not data:
        return {}
    
    sanitized = {}
    for key, value in data.items():
        if isinstance(value, str):
            sanitized[key] = sanitize_text(value, max_length)
        elif isinstance(value, dict):
            sanitized[key] = sanitize_dict(value, max_length)
        elif isinstance(value, list):
            sanitized[key] = [
                sanitize_text(item, max_length) if isinstance(item, str) else item
                for item in value
            ]
        else:
            sanitized[key] = value
    
    return sanitized