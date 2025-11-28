"""
Test script to verify all three Nanonets models are configured correctly.
"""

import os
import sys
from pathlib import Path

# Add the ai directory to the path
sys.path.insert(0, str(Path(__file__).parent))

def test_all_models():
    """Test if all three Nanonets models are configured correctly."""
    api_key = os.getenv("NANONETS_API_KEY")
    model_grades_form_1 = os.getenv("NANONETS_MODEL_ID_GRADES_FORM_1")
    model_jhs_137 = os.getenv("NANONETS_MODEL_ID_JHS_137")
    model_shs_137 = os.getenv("NANONETS_MODEL_ID_SHS_137")
    
    print("=" * 60)
    print("Nanonets Multi-Model Configuration Test")
    print("=" * 60)
    print()
    
    # Check API Key
    if not api_key:
        print("[X] NANONETS_API_KEY is not set")
        return False
    else:
        print(f"[OK] NANONETS_API_KEY is set (length: {len(api_key)})")
    
    print()
    print("Checking Model IDs:")
    print("-" * 60)
    
    models = {
        "Grades Form 1": model_grades_form_1,
        "Junior High School Form 137": model_jhs_137,
        "Senior High School Form 137": model_shs_137,
    }
    
    all_configured = True
    for name, model_id in models.items():
        if model_id:
            print(f"[OK] {name}: {model_id}")
        else:
            print(f"[X] {name}: NOT SET")
            all_configured = False
    
    if not all_configured:
        print()
        print("[X] Not all models are configured!")
        return False
    
    print()
    print("Testing API connections...")
    print("-" * 60)
    
    try:
        import requests
        from requests.auth import HTTPBasicAuth
        
        auth = HTTPBasicAuth(api_key, "")
        all_accessible = True
        
        for name, model_id in models.items():
            url = f"https://app.nanonets.com/api/v2/OCR/Model/{model_id}/"
            try:
                response = requests.get(url, auth=auth, timeout=10)
                if response.status_code == 200:
                    print(f"[OK] {name}: Accessible")
                else:
                    print(f"[X] {name}: Status {response.status_code}")
                    all_accessible = False
            except Exception as e:
                print(f"[X] {name}: Error - {e}")
                all_accessible = False
        
        return all_accessible
        
    except ImportError:
        print("[X] 'requests' package not installed")
        print("   Run: pip install requests")
        return False
    except Exception as e:
        print(f"[X] Error: {e}")
        return False

if __name__ == "__main__":
    success = test_all_models()
    print()
    print("=" * 60)
    if success:
        print("[OK] All models configured and accessible!")
        print("=" * 60)
        sys.exit(0)
    else:
        print("[X] Configuration incomplete. Please fix the issues above.")
        print("=" * 60)
        sys.exit(1)

