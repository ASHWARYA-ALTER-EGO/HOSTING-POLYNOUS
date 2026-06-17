"""
Middleware that sanitizes ALL incoming requests before processing
"""
from fastapi import Request, HTTPException
from app.utils.sanitizer import is_safe_input
import json

async def input_sanitizer_middleware(request: Request, call_next):
    """
    Check user input for malicious patterns on protected routes.
    Runs BEFORE any route handler.
    """
    
    # Skip health check and static files unconditionally
    if request.url.path in ['/health', '/', '/favicon.ico']:
        return await call_next(request)
    
    # Only run thorough sanitization on sensitive endpoints
    if any(path in request.url.path for path in ['/ask', '/search', '/debate']):
        # ─── Check Query Parameters ─────────────────
        for key, value in request.query_params.items():
            if isinstance(value, str) and len(value) > 0:
                if not is_safe_input(value):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid input detected in query parameter: {key}"
                    )
        
        # ─── Check Path Parameters ──────────────────
        for key, value in request.path_params.items():
            if isinstance(value, str) and len(value) > 0:
                if not is_safe_input(value):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid input detected in path parameter: {key}"
                    )
        
        # ─── Check Request Body (POST/PUT/PATCH) ────
        if request.method in ['POST', 'PUT', 'PATCH']:
            try:
                body_bytes = await request.body()
                
                if body_bytes:
                    body_str = body_bytes.decode('utf-8', errors='ignore')
                    
                    # Quick check on raw body
                    if len(body_str) < 100_000:
                        if not is_safe_input(body_str[:10_000]):
                            raise HTTPException(
                                status_code=400,
                                detail="Invalid input detected in request body"
                            )
                    
                    # Deeper check on individual JSON fields
                    try:
                        data = json.loads(body_str)
                        if isinstance(data, dict):
                            for key, value in data.items():
                                if isinstance(value, str) and len(value) > 0:
                                    if not is_safe_input(value):
                                        raise HTTPException(
                                            status_code=400,
                                            detail=f"Invalid input detected in field: {key}"
                                        )
                    except json.JSONDecodeError:
                        pass  # Not JSON – skip detailed field check
                        
            except HTTPException:
                raise  # Re‑raise our own validation errors
            except Exception:
                pass  # Silently ignore body‑read errors
    
    # ─── Process Request ────────────────────────
    response = await call_next(request)
    return response