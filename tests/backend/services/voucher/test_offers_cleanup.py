#!/usr/bin/env python
"""
Test offers page API endpoints after cleanup
"""
import requests
import json

def test_offers_functionality():
    """Test offers page related functionality"""
    
    # Login to get token
    login_url = 'http://127.0.0.1:8000/api/auth/login/'
    login_data = {
        'email': 'thefarhanalam01@gmail.com',
        'password': 'Test123!'
    }
    
    login_response = requests.post(login_url, json=login_data)
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return False
        
    token = login_response.json().get('access')
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    print("=== Testing Offers Page Functionality ===")
    
    # Test 1: Get user vouchers
    print("\n1. Testing user vouchers...")
    vouchers_response = requests.get(
        'http://127.0.0.1:8000/api/rewards/vouchers/',
        headers=headers
    )
    
    if vouchers_response.status_code == 200:
        print("✅ User vouchers API works!")
        vouchers_data = vouchers_response.json()
        print(f"   Found {len(vouchers_data.get('results', []))} vouchers")
        vouchers_success = True
    else:
        print(f"❌ User vouchers failed: {vouchers_response.status_code}")
        vouchers_success = False
    
    # Test 2: Get reward account
    print("\n2. Testing reward account...")
    account_response = requests.get(
        'http://127.0.0.1:8000/api/rewards/account/',
        headers=headers
    )
    
    if account_response.status_code == 200:
        print("✅ Reward account API works!")
        account_data = account_response.json()
        print(f"   Current balance: {account_data.get('current_balance', 0)}")
        print(f"   Tier: {account_data.get('tier_level', 'Unknown')}")
        account_success = True
    else:
        print(f"❌ Reward account failed: {account_response.status_code}")
        account_success = False
    
    # Test 3: Get available vouchers for redemption
    print("\n3. Testing available vouchers...")
    available_response = requests.get(
        'http://127.0.0.1:8000/api/rewards/vouchers/available/',
        headers=headers
    )
    
    if available_response.status_code == 200:
        print("✅ Available vouchers API works!")
        available_data = available_response.json()
        print(f"   Available options: {len(available_data.get('vouchers', []))}")
        available_success = True
    else:
        print(f"❌ Available vouchers failed: {available_response.status_code}")
        available_success = False
    
    print("\n=== Test Results ===")
    print(f"User Vouchers: {'✅ PASS' if vouchers_success else '❌ FAIL'}")
    print(f"Reward Account: {'✅ PASS' if account_success else '❌ FAIL'}")
    print(f"Available Vouchers: {'✅ PASS' if available_success else '❌ FAIL'}")
    
    all_success = vouchers_success and account_success and available_success
    
    if all_success:
        print("\n🎉 ALL OFFERS PAGE TESTS PASSED! Cleanup was successful!")
        return True
    else:
        print("\n💥 Some tests failed. Check the issues above.")
        return False

if __name__ == "__main__":
    test_offers_functionality()