"""
Test script to verify Nanonets API integration.
Run this to check if your credentials are working.
"""

import os
import sys
from pathlib import Path

# Add the ai directory to the path
sys.path.insert(0, str(Path(__file__).parent))

def test_nanonets_config():
    """Test if Nanonets is configured correctly."""
    api_key = os.getenv("NANONETS_API_KEY")
    model_id = os.getenv("NANONETS_MODEL_ID")
    
    print("=" * 50)
    print("Nanonets Configuration Test")
    print("=" * 50)
    print()
    
    if not api_key:
        print("[X] NANONETS_API_KEY is not set")
        print("   Run setup-nanonets.ps1 or setup-nanonets.bat to configure")
        return False
    else:
        print(f"[OK] NANONETS_API_KEY is set (length: {len(api_key)})")
    
    if not model_id:
        print("[X] NANONETS_MODEL_ID is not set")
        print("   Run setup-nanonets.ps1 or setup-nanonets.bat to configure")
        return False
    else:
        print(f"[OK] NANONETS_MODEL_ID is set: {model_id}")
    
    print()
    print("Testing API connection...")
    
    try:
        import requests
        from requests.auth import HTTPBasicAuth
        
        # Test API endpoint
        url = f"https://app.nanonets.com/api/v2/OCR/Model/{model_id}/"
        # Nanonets uses HTTPBasicAuth with API key as username, empty password
        auth = HTTPBasicAuth(api_key, "")
        
        response = requests.get(url, auth=auth, timeout=10)
        
        print(f"  Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"  Response: {response.text[:500]}")
        
        if response.status_code == 200:
            print("[OK] API connection successful!")
            print("  Your Nanonets model is accessible")
            return True
        elif response.status_code == 401:
            print("[X] Authentication failed")
            print("  Please check your API key")
            print("  Note: Make sure the API key is correct and active in your Nanonets account")
            return False
        elif response.status_code == 404:
            print("[X] Model not found")
            print("  Please check your Model ID")
            return False
        else:
            print(f"[!] API returned status code: {response.status_code}")
            return False
            
    except ImportError:
        print("[X] 'requests' package not installed")
        print("   Run: pip install requests")
        return False
    except Exception as e:
        print(f"[X] Error connecting to API: {e}")
        return False

if __name__ == "__main__":
    success = test_nanonets_config()
    print()
    if success:
        print("=" * 50)
        print("[OK] All checks passed! Nanonets is ready to use.")
        print("=" * 50)
        sys.exit(0)
    else:
        print("=" * 50)
        print("[X] Configuration incomplete. Please fix the issues above.")
        print("=" * 50)
        sys.exit(1)

