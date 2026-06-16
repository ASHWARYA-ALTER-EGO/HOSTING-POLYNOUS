"""
POLYNOUS Security Headers Middleware
"""
from fastapi import Request
from fastapi.responses import Response
import os

async def security_headers_middleware(request: Request, call_next):
    """Add security headers to all responses"""
    
    response: Response = await call_next(request)
    
    # Basic security headers (NO .pop() calls!)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # Cache control for sensitive pages
    if "/auth" in request.url.path or "/settings" in request.url.path:
        response.headers["Cache-Control"] = "no-store"
    
    return response