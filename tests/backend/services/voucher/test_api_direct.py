#!/usr/bin/env python
"""
Direct API test for reward claiming
"""
import requests
import json

def test_api_directly():
    print("Testing API directly with requests...")
    
    # First, let's try to get a token by logging in
    login_url = "http://127.0.0.1:8000/api/auth/login/"
    login_data = {
        "email": "thefarhanalam01@gmail.com",  # Use existing user
        "password": "admin123"  # You'll need to use the correct password
    }
    
    try:
        # Login to get token
        print("Attempting to login...")
        login_response = requests.post(login_url, json=login_data)
        print(f"Login status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            access_token = token_data.get('access')
            print(f"Got access token: {access_token[:20]}...")
            
            # Now test the claim reward endpoint
            claim_url = "http://127.0.0.1:8000/api/rewards/claim/"
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            reward_data = {
                'points': 10,
                'type': 'review',
                'description': 'Test reward claim from API'
            }
            
            print("Testing claim reward endpoint...")
            claim_response = requests.post(claim_url, json=reward_data, headers=headers)
            print(f"Claim status: {claim_response.status_code}")
            print(f"Response: {claim_response.text}")
            
            if claim_response.status_code == 500:
                print("❌ 500 error - checking response details...")
                print(f"Response headers: {dict(claim_response.headers)}")
            elif claim_response.status_code == 201:
                print("✅ Success!")
                print(f"Response data: {claim_response.json()}")
            else:
                print(f"❌ Unexpected status: {claim_response.status_code}")
                
        else:
            print(f"❌ Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == '__main__':
    test_api_directly()