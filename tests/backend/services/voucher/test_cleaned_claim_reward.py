#!/usr/bin/env python
"""
Test the cleaned up claim_reward function
"""
import requests
import json

def test_claim_reward():
    """Test the claim_reward endpoint after cleanup"""
    
    # Login to get token
    login_url = 'http://127.0.0.1:8000/api/auth/login/'
    login_data = {
        'email': 'thefarhanalam01@gmail.com',
        'password': 'Test123!'
    }
    
    try:
        login_response = requests.post(login_url, json=login_data)
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print(login_response.text)
            return False
            
        token = login_response.json().get('access')
        if not token:
            print("❌ No access token received")
            return False
            
        print("✅ Login successful")
        
        # Test claim reward
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        reward_data = {
            'points': 15,
            'type': 'review',
            'description': 'Test reward after cleanup - no debug logs'
        }
        
        claim_url = 'http://127.0.0.1:8000/api/rewards/claim/'
        claim_response = requests.post(claim_url, headers=headers, json=reward_data)
        
        print(f"Claim Response Status: {claim_response.status_code}")
        
        if claim_response.status_code == 201:
            response_data = claim_response.json()
            print("✅ SUCCESS! Claim reward function works after cleanup!")
            print(f"   Points earned: {response_data.get('points_earned')}")
            print(f"   New balance: {response_data.get('new_balance')}")
            print(f"   User tier: {response_data.get('tier')}")
            print(f"   Transaction ID: {response_data.get('transaction_id')}")
            return True
        else:
            print(f"❌ Error: Status {claim_response.status_code}")
            print(f"Response: {claim_response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

if __name__ == "__main__":
    print("Testing cleaned up claim_reward function...")
    success = test_claim_reward()
    
    if success:
        print("\n🎉 All tests passed! The cleanup was successful.")
    else:
        print("\n💥 Tests failed. Check the server and configuration.")