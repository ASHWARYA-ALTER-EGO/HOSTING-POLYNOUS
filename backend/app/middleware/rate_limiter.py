from fastapi import Request, HTTPException
from collections import defaultdict
import time

class RateLimiter:
    def __init__(self, max_requests=20, window_seconds=60):
        self.max_requests = max_requests
        self.window = window_seconds
        self.requests = defaultdict(list)
    
    async def __call__(self, request: Request, call_next):
        # Get real IP from proxy (Railway sends X-Forwarded-For)
        forwarded = request.headers.get("X-Forwarded-For")
        client_ip = forwarded.split(",")[0].strip() if forwarded else request.client.host
        
        now = time.time()
        window_start = now - self.window
        
        # Clean old requests
        self.requests[client_ip] = [
            t for t in self.requests[client_ip] if t > window_start
        ]
        
        if len(self.requests[client_ip]) >= self.max_requests:
            raise HTTPException(status_code=429, detail="Too many requests")
        
        self.requests[client_ip].append(now)
        response = await call_next(request)
        return response

# Create instance with desired limits
rate_limiter = RateLimiter(max_requests=30, window_seconds=60)