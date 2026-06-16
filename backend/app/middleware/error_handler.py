"""
POLYNOUS Global Error Handler
Catches ALL unhandled exceptions and returns safe, consistent responses
"""
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import traceback
import os
import sys

# ============================================================
# CUSTOM EXCEPTION CLASSES
# ============================================================

class PolynousException(Exception):
    """Base exception for POLYNOUS"""
    def __init__(self, message: str, status_code: int = 500, detail: dict = None):
        self.message = message
        self.status_code = status_code
        self.detail = detail or {}
        super().__init__(self.message)

class AuthenticationError(PolynousException):
    """Authentication failed"""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status_code=401)

class AuthorizationError(PolynousException):
    """Not authorized to access this resource"""
    def __init__(self, message: str = "Not authorized"):
        super().__init__(message, status_code=403)

class NotFoundError(PolynousException):
    """Resource not found"""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404)

class ValidationError(PolynousException):
    """Input validation failed"""
    def __init__(self, message: str = "Validation failed", detail: dict = None):
        super().__init__(message, status_code=400, detail=detail)

class RateLimitError(PolynousException):
    """Too many requests"""
    def __init__(self, message: str = "Too many requests", retry_after: int = 60):
        super().__init__(message, status_code=429, detail={"retry_after": retry_after})

# ============================================================
# SAFE ERROR RESPONSE
# ============================================================

def create_error_response(
    status_code: int,
    message: str,
    error_type: str = "internal_error",
    detail: dict = None
) -> JSONResponse:
    """
    Create a consistent, safe error response.
    NEVER includes stack traces or sensitive information.
    """
    response_body = {
        "error": True,
        "type": error_type,
        "message": message,
        "status_code": status_code
    }
    
    if detail:
        response_body["detail"] = detail
    
    return JSONResponse(
        status_code=status_code,
        content=response_body
    )

# ============================================================
# MAIN ERROR HANDLER (FIXED - call_next IS awaitable)
# ============================================================

async def global_error_handler(request: Request, call_next):
    """
    Catch ALL errors and return safe responses.
    This is the outermost middleware — it catches everything.
    
    NOTE: When used as middleware with app.middleware("http"),
    call_next IS an awaitable function that returns the response.
    """
    try:
        response = await call_next(request)
        return response
    
    except PolynousException as e:
        # Our custom exceptions — safe to show message
        return create_error_response(
            status_code=e.status_code,
            message=e.message,
            error_type=e.__class__.__name__,
            detail=e.detail
        )
    
    except HTTPException as e:
        # FastAPI HTTP exceptions
        return create_error_response(
            status_code=e.status_code,
            message=str(e.detail) if e.detail else "HTTP error",
            error_type="http_error"
        )
    
    except StarletteHTTPException as e:
        # Starlette HTTP exceptions
        return create_error_response(
            status_code=e.status_code,
            message=str(e.detail) if e.detail else "HTTP error",
            error_type="http_error"
        )
    
    except RequestValidationError as e:
        # Pydantic validation errors — show what went wrong
        errors = []
        for error in e.errors():
            errors.append({
                "field": ".".join(str(loc) for loc in error["loc"]),
                "message": error["msg"],
                "type": error["type"]
            })
        
        return create_error_response(
            status_code=422,
            message="Validation error",
            error_type="validation_error",
            detail={"errors": errors[:5]}  # Limit to 5 errors
        )
    
    except Exception as e:
        # UNEXPECTED errors — log but DON'T expose to client
        is_production = os.getenv("ENVIRONMENT") == "production"
        
        # Log the full error for debugging
        print(f"\n{'='*60}")
        print(f"🔴 UNHANDLED ERROR: {type(e).__name__}")
        print(f"   URL: {request.method} {request.url.path}")
        print(f"   Client: {request.client.host if request.client else 'unknown'}")
        traceback.print_exc()
        print(f"{'='*60}\n")
        
        if is_production:
            # Production: Return safe generic message
            return create_error_response(
                status_code=500,
                message="An internal error occurred. Please try again later.",
                error_type="internal_error"
            )
        else:
            # Development: Show actual error
            return create_error_response(
                status_code=500,
                message=f"{type(e).__name__}: {str(e)}",
                error_type="internal_error"
            )

# ============================================================
# NOT FOUND HANDLER
# ============================================================

async def not_found_handler(request: Request, exc: HTTPException):
    """Handle 404 errors with a consistent format"""
    return create_error_response(
        status_code=404,
        message=f"Route not found: {request.method} {request.url.path}",
        error_type="not_found"
    )