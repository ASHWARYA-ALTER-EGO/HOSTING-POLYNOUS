#!/usr/bin/env python3
"""
POLYNOUS Dependency Security Checker
Checks all dependencies for known vulnerabilities
"""
import subprocess
import sys
import json
import os
from datetime import datetime

def print_banner():
    print("=" * 60)
    print("🔒 POLYNOUS DEPENDENCY SECURITY CHECK")
    print(f"   Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

def check_pip_audit():
    """Check dependencies using pip-audit (PyPA official tool)"""
    print("\n📦 Running pip-audit...")
    print("-" * 60)
    
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pip_audit", "--format", "json"],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            print("✅ No vulnerabilities found!")
            return True
        else:
            try:
                data = json.loads(result.stdout)
                vulns = data.get('dependencies', [])
                
                if vulns:
                    print(f"🔴 Found {len(vulns)} vulnerable packages:\n")
                    for vuln in vulns:
                        name = vuln.get('name', 'Unknown')
                        version = vuln.get('version', '?')
                        vulns_list = vuln.get('vulns', [])
                        
                        print(f"  📦 {name}=={version}")
                        for v in vulns_list:
                            print(f"     🔴 {v.get('id', 'N/A')}: {v.get('description', 'No description')[:100]}")
                            if v.get('fix_versions'):
                                print(f"     ✅ Fix: Upgrade to {v['fix_versions']}")
                        print()
            except:
                print(f"⚠️  pip-audit found issues:\n{result.stdout[:500]}")
            return False
    except subprocess.TimeoutExpired:
        print("⚠️  pip-audit timed out")
        return False
    except Exception as e:
        print(f"⚠️  pip-audit not available. Install: pip install pip-audit")
        return False

def check_safety():
    """Check dependencies using Safety DB"""
    print("\n📦 Running Safety check...")
    print("-" * 60)
    
    try:
        result = subprocess.run(
            [sys.executable, "-m", "safety", "check", "--full-report", "--output", "json"],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            print("✅ Safety: No vulnerabilities found!")
            return True
        else:
            try:
                data = json.loads(result.stdout)
                vulns = data.get('vulnerabilities', [])
                if vulns:
                    print(f"🔴 Safety found {len(vulns)} vulnerabilities:")
                    for v in vulns[:10]:
                        print(f"  📦 {v.get('package_name', '?')} {v.get('vulnerable_spec', '?')}")
                        print(f"     {v.get('advisory', 'No details')[:100]}")
                    if len(vulns) > 10:
                        print(f"  ... and {len(vulns) - 10} more")
            except:
                print(f"⚠️  Safety found issues:\n{result.stdout[:500]}")
            return False
    except subprocess.TimeoutExpired:
        print("⚠️  Safety check timed out")
        return False
    except Exception as e:
        print(f"⚠️  Safety not available. Install: pip install safety")
        return False

def check_outdated_packages():
    """Check for outdated packages"""
    print("\n📦 Checking for outdated packages...")
    print("-" * 60)
    
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pip", "list", "--outdated", "--format", "json"],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.stdout.strip():
            data = json.loads(result.stdout)
            if data:
                print(f"🟡 Found {len(data)} outdated packages:")
                for pkg in data[:15]:
                    print(f"  📦 {pkg['name']}: {pkg['version']} → {pkg['latest_version']}")
                if len(data) > 15:
                    print(f"  ... and {len(data) - 15} more")
                print("\n💡 Run: pip install --upgrade -r requirements.txt")
            else:
                print("✅ All packages up to date!")
        else:
            print("✅ All packages up to date!")
    except subprocess.TimeoutExpired:
        print("⚠️  Check timed out")
    except Exception as e:
        print(f"⚠️  Could not check: {e}")

def check_requirements_file():
    """Verify requirements.txt exists and is properly formatted"""
    print("\n📦 Checking requirements.txt...")
    print("-" * 60)
    
    if os.path.exists("requirements.txt"):
        with open("requirements.txt", "r") as f:
            lines = [l.strip() for l in f if l.strip() and not l.startswith("#")]
        
        print(f"✅ requirements.txt found with {len(lines)} packages")
        
        unpinned = [l for l in lines if "==" not in l and ">=" not in l and "<=" not in l and "~=" not in l]
        if unpinned:
            print(f"⚠️  {len(unpinned)} packages have unpinned versions:")
            for p in unpinned[:5]:
                print(f"  📦 {p}")
    else:
        print("❌ requirements.txt not found!")

def generate_sbom():
    """Generate Software Bill of Materials"""
    print("\n📦 Generating SBOM...")
    print("-" * 60)
    
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pip", "list", "--format", "json"],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.stdout.strip():
            packages = json.loads(result.stdout)
            sbom = {
                "project": "POLYNOUS",
                "version": "3.0.0",
                "generated": datetime.now().isoformat(),
                "packages": [
                    {"name": pkg["name"], "version": pkg["version"]}
                    for pkg in packages
                ]
            }
            
            with open("sbom.json", "w") as f:
                json.dump(sbom, f, indent=2)
            
            print(f"✅ SBOM saved to sbom.json ({len(packages)} packages)")
    except Exception as e:
        print(f"⚠️  Could not generate SBOM: {e}")

def update_packages():
    """Update all packages to latest compatible versions"""
    print("\n📦 Updating packages...")
    print("-" * 60)
    
    response = input("⚠️  This will update all packages. Continue? (y/N): ")
    if response.lower() != 'y':
        print("Skipping update.")
        return
    
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", "--upgrade", "-r", "requirements.txt"],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print("✅ Packages updated successfully!")
        print("\n💡 Run: pip freeze > requirements-lock.txt")
        print("   to save the exact versions that work.")
    else:
        print(f"❌ Update failed:\n{result.stderr[:500]}")

def main():
    print_banner()
    
    check_requirements_file()
    check_outdated_packages()
    
    audit_ok = check_pip_audit()
    safety_ok = check_safety()
    
    generate_sbom()
    
    print("\n" + "=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    
    if audit_ok and safety_ok:
        print("✅ All checks passed! No known vulnerabilities.")
    else:
        print("🔴 Vulnerabilities detected! Update affected packages.")
        print("\n💡 Quick fix:")
        print("   pip install --upgrade -r requirements.txt")
        print("   pip freeze > requirements-lock.txt")
    
    print("\n" + "-" * 60)
    update_packages()

if __name__ == "__main__":
    main()