#!/usr/bin/env python
"""
Test script to verify the core claim_reward logic
"""
import os
import sys
import django

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewabazaar.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from rest_framework.request import Request
from rest_framework.test import force_authenticate
from apps.rewards.views import claim_reward
import json

User = get_user_model()

def test_view_directly():
    print("Testing claim_reward view directly...")
    
    try:
        # Get an existing user
        user = User.objects.filter(role='customer').first()
        if not user:
            print("❌ No customer user found in database")
            return
            
        print(f"User: {user.email}")
        
        # Create a mock request
        factory = RequestFactory()
        
        # Create request with JSON data
        data = {
            'points': 10,
            'type': 'review',
            'description': 'Test reward claim'
        }
        
        # Create a POST request with JSON body
        request = factory.post(
            '/api/rewards/claim/', 
            data=json.dumps(data),
            content_type='application/json'
        )
        
        # Convert to DRF request  
        drf_request = Request(request)
        drf_request.user = user  # Set user manually
        
        print(f"Request user: {drf_request.user}")
        print(f"Request data: {drf_request.data}")
        
        # Call the view function directly
        response = claim_reward(drf_request)
        
        print(f"Response status: {response.status_code}")
        print(f"Response data: {response.data}")
        
        if response.status_code == 201:
            print("✅ View works correctly!")
        else:
            print("❌ View returned error")
        
    except Exception as e:
        print(f"❌ Error calling view: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")

if __name__ == '__main__':
    test_view_directly()