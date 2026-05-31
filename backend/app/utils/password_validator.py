import re
from typing import Tuple

class PasswordValidator:
    """Enforce strong password policies"""
    
    MIN_LENGTH = 8
    MAX_LENGTH = 128
    
    @classmethod
    def validate(cls, password: str) -> Tuple[bool, str]:
        """
        Validate password strength
        Returns (is_valid, message)
        """
        if not password:
            return False, "Password is required"
        
        if len(password) < cls.MIN_LENGTH:
            return False, f"Password must be at least {cls.MIN_LENGTH} characters"
        
        if len(password) > cls.MAX_LENGTH:
            return False, f"Password must be less than {cls.MAX_LENGTH} characters"
        
        if not re.search(r'[A-Z]', password):
            return False, "Password must contain at least one uppercase letter"
        
        if not re.search(r'[a-z]', password):
            return False, "Password must contain at least one lowercase letter"
        
        if not re.search(r'\d', password):
            return False, "Password must contain at least one number"
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False, "Password must contain at least one special character"
        
        # Check for common passwords
        common_passwords = ["password", "12345678", "qwerty123", "admin123", "letmein"]
        if password.lower() in common_passwords:
            return False, "Password is too common. Please choose a stronger password"
        
        return True, "Password is strong"
    
    @classmethod
    def get_strength_score(cls, password: str) -> int:
        """Rate password strength from 0-100"""
        score = 0
        
        if len(password) >= cls.MIN_LENGTH:
            score += 20
        if len(password) >= 12:
            score += 10
        if len(password) >= 16:
            score += 10
        
        if re.search(r'[A-Z]', password):
            score += 10
        if re.search(r'[a-z]', password):
            score += 10
        if re.search(r'\d', password):
            score += 10
        if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            score += 10
        
        # Bonus for mixing
        categories = 0
        if re.search(r'[A-Z]', password): categories += 1
        if re.search(r'[a-z]', password): categories += 1
        if re.search(r'\d', password): categories += 1
        if re.search(r'[!@#$%^&*(),.?":{}|<>]', password): categories += 1
        if categories >= 3:
            score += 10
        if categories == 4:
            score += 10
        
        return min(100, score)