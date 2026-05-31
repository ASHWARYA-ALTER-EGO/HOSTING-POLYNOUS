import os
import re
from dotenv import load_dotenv
from typing import Dict, List

load_dotenv()

class SecurityValidator:
    """Validates environment and security configuration on startup"""
    
    REQUIRED_VARS = [
        "ANTHROPIC_API_KEY",
        "TAVILY_API_KEY", 
        "JWT_SECRET",
        "ENCRYPTION_KEY"
    ]
    
    OPTIONAL_VARS = [
        "OPENAI_API_KEY",
        "VOYAGE_API_KEY",
        "PINECONE_API_KEY",
        "NEO4J_URI",
        "NEO4J_USER",
        "NEO4J_PASSWORD",
        "GOOGLE_CLIENT_ID",
        "GITHUB_CLIENT_ID"
    ]
    
    @classmethod
    def validate_env(cls) -> Dict:
        """Validate all environment variables on startup"""
        results = {
            "status": "ok",
            "missing_required": [],
            "missing_optional": [],
            "weak_keys": [],
            "warnings": []
        }
        
        # Check required vars
        for var in cls.REQUIRED_VARS:
            if not os.getenv(var):
                results["missing_required"].append(var)
                results["status"] = "error"
        
        # Check optional vars
        for var in cls.OPTIONAL_VARS:
            if not os.getenv(var):
                results["missing_optional"].append(var)
        
        # Check JWT_SECRET strength
        jwt_secret = os.getenv("JWT_SECRET", "")
        if jwt_secret and len(jwt_secret) < 32:
            results["weak_keys"].append("JWT_SECRET is too short (min 32 chars)")
            results["status"] = "warning"
        
        # Check if using default keys
        if jwt_secret == "polynous-secret-key-change-in-production":
            results["weak_keys"].append("JWT_SECRET is using default value!")
            results["status"] = "error"
        
        # Validate API key formats
        anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
        if anthropic_key and not anthropic_key.startswith("sk-ant"):
            results["warnings"].append("ANTHROPIC_API_KEY doesn't start with 'sk-ant'")
        
        return results
    
    @classmethod
    def print_validation_report(cls):
        """Print validation report on startup"""
        report = cls.validate_env()
        
        print("\n" + "=" * 60)
        print("🔒 SECURITY VALIDATION REPORT")
        print("=" * 60)
        
        if report["status"] == "ok":
            print("✅ All security checks passed!")
        elif report["status"] == "warning":
            print("⚠️  Security warnings found (see below)")
        else:
            print("❌ CRITICAL: Security issues detected!")
        
        if report["missing_required"]:
            print(f"\n❌ MISSING REQUIRED VARS: {', '.join(report['missing_required'])}")
        
        if report["missing_optional"]:
            print(f"\n⚠️  Missing optional vars: {', '.join(report['missing_optional'])}")
        
        if report["weak_keys"]:
            print(f"\n⚠️  Weak keys: {', '.join(report['weak_keys'])}")
        
        if report["warnings"]:
            print(f"\n📝 Warnings: {', '.join(report['warnings'])}")
        
        print("=" * 60 + "\n")
        
        return report["status"] != "error"

# Run validation on import
security_ok = SecurityValidator.print_validation_report()