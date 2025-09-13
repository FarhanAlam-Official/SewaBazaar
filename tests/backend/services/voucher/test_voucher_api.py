#!/usr/bin/env python
"""
Quick test script to validate voucher API endpoints
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewabazaar.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from apps.rewards.models import RewardAccount, RewardVoucher
from apps.services.models import Service, ServiceCategory

User = get_user_model()

def test_voucher_system():
    print("=== Testing Voucher System ===")
    
    # 1. Use existing user or create new one
    try:
        user = User.objects.filter(email__icontains='test').first()
        if not user:
            user = User.objects.first()
        
        if not user:
            print("No users found. Creating a test user...")
            user = User.objects.create_user(
                username='voucher_test_user',
                email='voucher_test@example.com',
                first_name='Test',
                last_name='User'
            )
    except Exception as e:
        print(f"Error getting user: {e}")
        return
    
    # 2. Get or create reward account
    account, created = RewardAccount.objects.get_or_create(
        user=user,
        defaults={'current_balance': 2000}
    )
    
    if not created and account.current_balance < 1000:
        account.current_balance = 2000
        account.save()
    
    print(f"User: {user.email}, Points: {account.current_balance}")
    
    # 3. Use existing service or create test data
    try:
        service = Service.objects.first()
        if not service:
            category = ServiceCategory.objects.first()
            if not category:
                category = ServiceCategory.objects.create(
                    title='Test Category',
                    description='Test category for vouchers',
                    slug='test-category'
                )
            
            service = Service.objects.create(
                title='Test Service',
                category=category,
                provider=user,
                description='Test service',
                base_price=100.00,
                duration_hours=1,
                slug='test-service'
            )
    except Exception as e:
        print(f"Error with service: {e}")
        # Use None for service - vouchers can be general
        service = None
    
    # 4. Test voucher creation
    print("\n--- Testing Voucher Creation ---")
    voucher = RewardVoucher.objects.create(
        user=user,
        value=50.00,
        points_redeemed=500,
        expires_at=timezone.now() + timedelta(days=30)
    )
    
    print(f"Voucher created: {voucher.voucher_code}")
    print(f"QR Data: {voucher.qr_code_data}")
    print(f"Status: {voucher.status}")
    print(f"Value: Rs.{voucher.value}")
    
    # 5. Test voucher validation
    print("\n--- Testing Voucher Validation ---")
    print(f"Is valid: {voucher.is_valid}")
    print(f"Is expired: {voucher.is_expired}")
    print(f"Remaining value: Rs.{voucher.remaining_value}")
    print(f"Days until expiry: {voucher.days_until_expiry}")
    
    # 6. Test voucher usage
    print("\n--- Testing Voucher Usage ---")
    try:
        used_amount = voucher.use_voucher(amount=25.00)
        print(f"Voucher used successfully - Amount: Rs.{used_amount}")
        print(f"New status: {voucher.status}")
        print(f"Used amount: Rs.{voucher.used_amount}")
        print(f"Remaining value: Rs.{voucher.remaining_value}")
        print(f"Is fully used: {voucher.is_fully_used}")
    except Exception as e:
        print(f"Error using voucher: {e}")
    
    # 7. Test voucher cancellation
    print("\n--- Testing Voucher Cancellation ---")
    try:
        # Create another voucher for cancellation test
        cancel_voucher = RewardVoucher.objects.create(
            user=user,
            value=30.00,
            points_redeemed=300,
            expires_at=timezone.now() + timedelta(days=30)
        )
        print(f"Created voucher for cancellation: {cancel_voucher.voucher_code}")
        
        # Cancel it
        refund_transaction = cancel_voucher.cancel_voucher(reason="Testing cancellation")
        print(f"Voucher cancelled successfully")
        print(f"Refund transaction: {refund_transaction}")
        print(f"Cancelled voucher status: {cancel_voucher.status}")
        
    except Exception as e:
        print(f"Error testing cancellation: {e}")
    
    # 8. Check account balance changes
    account.refresh_from_db()
    print(f"\nFinal account balance: {account.current_balance}")
    
    # 9. Show created voucher summary
    print(f"\n--- Voucher Summary ---")
    user_vouchers = RewardVoucher.objects.filter(user=user).order_by('-created_at')[:5]
    for v in user_vouchers:
        print(f"Code: {v.voucher_code}, Value: Rs.{v.value}, Status: {v.status}, Remaining: Rs.{v.remaining_value}")
    
    print("\n=== Voucher System Test Complete ===")

if __name__ == '__main__':
    test_voucher_system()
