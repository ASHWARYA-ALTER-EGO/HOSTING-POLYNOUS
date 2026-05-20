from fastapi import Request, HTTPException
from collections import defaultdict
import time

class RateLimiter:
    def __init__(self, max_requests=10, window_seconds=60):
        self.max_requests = max_requests
        self.window = window_seconds
        self.requests = defaultdict(list)
    
    def is_allowed(self, key: str) -> bool:
        now = time.time()
        window_start = now - self.window
        
        # Clean old requests
        self.requests[key] = [t for t in self.requests[key] if t > window_start]
        
        if len(self.requests[key]) >= self.max_requests:
            return False
        
        self.requests[key].append(now)
        return True

rate_limiter = RateLimiter(max_requests=20, window_seconds=60)  # 20 requests per minute

async def check_rate_limit(request: Request):
    """Middleware to check rate limits"""
    client_ip = request.client.host
    if not rate_limiter.is_allowed(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests. Please wait.")