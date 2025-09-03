#!/usr/bin/env python
"""
Khalti Payment Debug Script

Run this to test your Khalti integration and identify the 400 error cause.
Usage: python debug_khalti_400.py
"""

import os
import sys
import django
import json

# Setup Django environment
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewabazaar.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.bookings.services import KhaltiPaymentService
from apps.bookings.models import Booking
from apps.services.models import Service
from decimal import Decimal

User = get_user_model()

def debug_khalti_400():
    print("=" * 60)
    print("KHALTI 400 ERROR DEBUG SCRIPT")
    print("=" * 60)
    
    # Step 1: Check Khalti Configuration
    print("\n1. Checking Khalti Configuration...")
    
    khalti_service = KhaltiPaymentService()
    print(f"   ✓ Base URL: {khalti_service.base_url}")
    print(f"   ✓ Initiate URL: {khalti_service.initiate_url}")
    print(f"   ✓ Public Key: {khalti_service.public_key[:10]}...")
    print(f"   ✓ Secret Key: {'Configured' if khalti_service.secret_key else 'Missing'}")
    
    # Step 2: Check if we have test data
    print("\n2. Checking Test Data...")
    
    try:
        # Find any booking to test with
        booking = Booking.objects.filter(status='pending').first()
        
        if not booking:
            print("   ❌ No pending bookings found. Creating test data...")
            
            # Create test user if needed
            user, created = User.objects.get_or_create(
                username='khalti_test_customer',
                defaults={
                    'email': 'test@sewabazaar.com',
                    'role': 'customer',
                    'first_name': 'Test',
                    'last_name': 'Customer'
                }
            )
            
            # Get or create a service
            service = Service.objects.first()
            if not service:
                print("   ❌ No services found. Please create a service first.")
                return
            
            # Create test booking
            from datetime import datetime, timedelta
            booking = Booking.objects.create(
                customer=user,
                service=service,
                booking_date=datetime.now().date() + timedelta(days=1),
                booking_time=datetime.now().time().replace(hour=10, minute=0, second=0),
                total_amount=Decimal('100.00'),
                status='pending',
                customer_name=user.get_full_name() or user.username,
                customer_phone='9800000000',
                customer_address='Test Address, Kathmandu'
            )
            print(f"   ✓ Created test booking: {booking.id}")
        else:
            print(f"   ✓ Found booking: {booking.id}")
        
        print(f"   ✓ Customer: {booking.customer.username}")
        print(f"   ✓ Service: {booking.service.title}")
        print(f"   ✓ Amount: Rs. {booking.total_amount}")
        
    except Exception as e:
        print(f"   ❌ Error creating test data: {str(e)}")
        return
    
    # Step 3: Test Khalti Payment Initiation
    print("\n3. Testing Khalti Payment Initiation...")
    
    test_return_url = "http://localhost:3000/payment/callback"
    test_website_url = "http://localhost:3000"
    
    print(f"   Return URL: {test_return_url}")
    print(f"   Website URL: {test_website_url}")
    
    try:
        result = khalti_service.initiate_payment(
            booking=booking,
            return_url=test_return_url,
            website_url=test_website_url
        )
        
        print(f"\n   Result: {json.dumps(result, indent=2)}")
        
        if result['success']:
            print("   ✅ SUCCESS: Payment initiation worked!")
            print(f"   Payment URL: {result['data'].get('payment_url', 'N/A')}")
        else:
            print("   ❌ FAILED: Payment initiation failed")
            print(f"   Error: {result.get('error')}")
            print(f"   Status Code: {result.get('status_code')}")
            
            if 'full_response' in result:
                print(f"   Full Response: {json.dumps(result['full_response'], indent=2)}")
    
    except Exception as e:
        print(f"   ❌ Exception during initiation: {str(e)}")
    
    # Step 4: Common Issues Check
    print("\n4. Checking Common Issues...")
    
    issues_found = []
    
    # Check environment
    if 'dev.khalti.com' not in khalti_service.base_url:
        issues_found.append("❌ Not using sandbox URL (should be dev.khalti.com)")
    else:
        print("   ✓ Using sandbox environment")
    
    # Check keys
    if khalti_service.public_key != '8b58c9047e584751beaddea7cc632b2c':
        issues_found.append("❌ Public key doesn't match expected sandbox key")
    else:
        print("   ✓ Public key matches sandbox key")
    
    if khalti_service.secret_key != '2d71118e5d26404fb3b1fe1fd386d33a':
        issues_found.append("❌ Secret key doesn't match expected sandbox key")
    else:
        print("   ✓ Secret key matches sandbox key")
    
    # Check customer data
    if not booking.customer.email:
        issues_found.append("❌ Customer missing email address")
    else:
        print(f"   ✓ Customer email: {booking.customer.email}")
    
    # Check amount
    if booking.total_amount <= 0:
        issues_found.append("❌ Invalid booking amount")
    elif booking.total_amount < Decimal('10.00'):
        issues_found.append("❌ Amount too low (minimum Rs. 10)")
    else:
        print(f"   ✓ Amount valid: Rs. {booking.total_amount}")
    
    if issues_found:
        print("\n   Issues Found:")
        for issue in issues_found:
            print(f"   {issue}")
    else:
        print("   ✓ No common issues detected")
    
    print("\n" + "=" * 60)
    print("DEBUG COMPLETE")
    print("=" * 60)
    
    if issues_found:
        print("❌ Issues found. Please fix the issues above and try again.")
        return False
    else:
        print("✅ Configuration looks good. If you're still getting 400 errors,")
        print("   check the Django logs for detailed error information.")
        return True

if __name__ == '__main__':
    debug_khalti_400()