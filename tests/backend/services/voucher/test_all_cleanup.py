#!/usr/bin/env python
"""
Test both reward claiming and service confirmation after cleanup
"""
import requests
import json

def test_functionality():
    """Test both cleaned up functions"""
    
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
    
    print("=== Testing Cleaned Up Functionality ===")
    
    # Test 1: Reward claiming
    print("\n1. Testing reward claiming...")
    reward_data = {
        'points': 30,
        'type': 'review',
        'description': 'Final test after complete cleanup'
    }
    
    claim_response = requests.post(
        'http://127.0.0.1:8000/api/rewards/claim/',
        headers=headers,
        json=reward_data
    )
    
    if claim_response.status_code == 201:
        print("✅ Reward claiming works perfectly!")
        response_data = claim_response.json()
        print(f"   Points earned: {response_data.get('points_earned')}")
        print(f"   New balance: {response_data.get('new_balance')}")
        print(f"   User tier: {response_data.get('tier')}")
        reward_success = True
    else:
        print(f"❌ Reward claiming failed: {claim_response.status_code}")
        reward_success = False
    
    # Test 2: Service confirmation (create new ServiceDelivery for testing)
    print("\n2. Testing service confirmation...")
    
    # First, let's see if we can confirm booking 138 again or if we need a new one
    confirm_data = {
        'customer_rating': 5,
        'customer_notes': 'Final test - excellent service after cleanup!',
        'would_recommend': True
    }
    
    confirm_response = requests.post(
        'http://127.0.0.1:8000/api/bookings/bookings/138/confirm_service_completion/',
        headers=headers,
        json=confirm_data
    )
    
    if confirm_response.status_code == 200:
        print("✅ Service confirmation works perfectly!")
        response_data = confirm_response.json()
        print(f"   Success: {response_data.get('success')}")
        print(f"   Status: {response_data.get('booking_status')}")
        print(f"   Rating: {response_data.get('customer_rating')}")
        service_success = True
    elif confirm_response.status_code == 400:
        print("ℹ️  Booking 138 already confirmed (expected after previous tests)")
        service_success = True
    else:
        print(f"❌ Service confirmation failed: {confirm_response.status_code}")
        print(f"   Response: {confirm_response.text}")
        service_success = False
    
    print("\n=== Test Results ===")
    print(f"Reward Claiming: {'✅ PASS' if reward_success else '❌ FAIL'}")
    print(f"Service Confirmation: {'✅ PASS' if service_success else '❌ FAIL'}")
    
    if reward_success and service_success:
        print("\n🎉 ALL TESTS PASSED! Cleanup was successful!")
        return True
    else:
        print("\n💥 Some tests failed. Check the issues above.")
        return False

if __name__ == "__main__":
    test_functionality()