from collections import OrderedDict
import hashlib
import json
import time

class SimpleCache:
    def __init__(self, max_size=100, ttl_seconds=3600):
        self.cache = OrderedDict()
        self.max_size = max_size
        self.ttl = ttl_seconds
    
    def _key(self, query: str, mode: str) -> str:
        raw = f"{query}:{mode}"
        return hashlib.md5(raw.encode()).hexdigest()
    
    def get(self, query: str, mode: str):
        key = self._key(query, mode)
        if key in self.cache:
            entry = self.cache[key]
            if time.time() - entry['time'] < self.ttl:
                # Move to end (most recently used)
                self.cache.move_to_end(key)
                return entry['data']
            else:
                del self.cache[key]
        return None
    
    def set(self, query: str, mode: str, data: dict):
        key = self._key(query, mode)
        if key in self.cache:
            del self.cache[key]
        elif len(self.cache) >= self.max_size:
            self.cache.popitem(last=False)  # Remove oldest
        
        self.cache[key] = {
            'data': data,
            'time': time.time()
        }

# Global cache instance
cache = SimpleCache()