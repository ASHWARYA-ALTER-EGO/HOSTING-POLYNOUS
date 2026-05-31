from collections import defaultdict
import time
from typing import Dict, Tuple

class AccountLockout:
    """Prevent brute force attacks by locking accounts after failed attempts"""
    
    MAX_ATTEMPTS = 5          # Lock after 5 failed attempts
    LOCKOUT_DURATION = 900    # 15 minutes in seconds
    ATTEMPT_WINDOW = 300      # 5 minutes window
    
    def __init__(self):
        self.attempts: Dict[str, list] = defaultdict(list)
        self.locked: Dict[str, float] = {}
    
    def record_attempt(self, email: str, success: bool) -> Tuple[bool, str]:
        """
        Record a login attempt
        Returns (is_allowed, message)
        """
        now = time.time()
        
        # Check if account is locked
        if email in self.locked:
            lock_time = self.locked[email]
            if now - lock_time < self.LOCKOUT_DURATION:
                remaining = int(self.LOCKOUT_DURATION - (now - lock_time))
                minutes = remaining // 60
                seconds = remaining % 60
                return False, f"Account locked. Try again in {minutes}m {seconds}s"
            else:
                # Lock expired, remove it
                del self.locked[email]
                self.attempts[email] = []
        
        # Clean old attempts outside window
        self.attempts[email] = [
            t for t in self.attempts[email]
            if now - t < self.ATTEMPT_WINDOW
        ]
        
        if success:
            # Successful login - reset attempts
            self.attempts[email] = []
            return True, "Login successful"
        
        # Failed attempt
        self.attempts[email].append(now)
        
        if len(self.attempts[email]) >= self.MAX_ATTEMPTS:
            self.locked[email] = now
            return False, f"Account locked for {self.LOCKOUT_DURATION//60} minutes due to too many failed attempts"
        
        remaining = self.MAX_ATTEMPTS - len(self.attempts[email])
        return True, f"Invalid credentials. {remaining} attempts remaining"
    
    def is_locked(self, email: str) -> bool:
        """Check if an account is currently locked"""
        if email not in self.locked:
            return False
        
        if time.time() - self.locked[email] > self.LOCKOUT_DURATION:
            del self.locked[email]
            return False
        
        return True

# Global instance
account_lockout = AccountLockout()