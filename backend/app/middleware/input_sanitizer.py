"""
Middleware that sanitizes ALL incoming requests before processing
"""
from fastapi import Request, HTTPException
from app.utils.sanitizer import is_safe_input
import json

async def input_sanitizer_middleware(request: Request, call_next):
    """
    Check all user input for malicious patterns.
    Runs BEFORE any route handler.
    """
    
    # Skip health check and static files
    if request.url.path in ['/health', '/', '/favicon.ico']:
        return await call_next(request)
    
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
    
    # ─── Check Request Body (POST/PUT) ───────────
    if request.method in ['POST', 'PUT', 'PATCH']:
        try:
            # Read body without consuming it
            body_bytes = await request.body()
            
            if body_bytes:
                body_str = body_bytes.decode('utf-8', errors='ignore')
                
                # Check raw body for obvious attacks
                if len(body_str) < 100000:  # Don't process huge bodies
                    if not is_safe_input(body_str[:10000]):  # Check first 10K chars
                        raise HTTPException(
                            status_code=400,
                            detail="Invalid input detected in request body"
                        )
                
                # For JSON bodies, check each field
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
                    pass  # Not JSON, skip detailed check
                    
        except HTTPException:
            raise  # Re-raise our HTTP exceptions
        except Exception:
            pass  # Ignore body read errors
    
    # ─── Process Request ────────────────────────
    response = await call_next(request)
    return response