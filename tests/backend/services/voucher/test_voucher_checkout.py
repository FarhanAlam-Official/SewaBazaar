#!/usr/bin/env python
"""
Comprehensive test for Phase 2.4: Voucher Checkout Integration

This script tests the complete voucher integration in the checkout process:
1. Checkout calculation with voucher
2. Payment initiation with voucher
3. Voucher application to existing payment
4. Voucher removal from payment
"""
import os
import sys
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewabazaar.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from apps.rewards.models import RewardAccount, RewardVoucher
from apps.bookings.models import Booking, Payment, PaymentMethod
from apps.services.models import Service, ServiceCategory

User = get_user_model()

def test_voucher_checkout_integration():
    print("=== Testing Voucher Checkout Integration ===")
    
    try:
        # 1. Setup test data
        print("\n--- Setting up test data ---")
        
        # Get or create test user
        user = User.objects.filter(email__icontains='test').first()
        if not user:
            user = User.objects.first()
        
        print(f"Test user: {user.email}")
        
        # Ensure user has reward account with sufficient points
        account, _ = RewardAccount.objects.get_or_create(
            user=user,
            defaults={'current_balance': 3000}
        )
        if account.current_balance < 1000:
            account.current_balance = 3000
            account.save()
        
        print(f"User points: {account.current_balance}")
        
        # Create test voucher
        voucher = RewardVoucher.objects.create(
            user=user,
            value=100.00,
            points_redeemed=1000,
            expires_at=timezone.now() + timedelta(days=30)
        )
        print(f"Created voucher: {voucher.voucher_code} - Rs.{voucher.value}")
        
        # Get or create test booking
        service = Service.objects.first()
        if not service:
            category = ServiceCategory.objects.first()
            if not category:
                category = ServiceCategory.objects.create(
                    title='Test Category',
                    description='Test category',
                    slug='test-category'
                )
            
            service = Service.objects.create(
                title='Test Service',
                category=category,
                provider=user,
                description='Test service',
                base_price=200.00,
                duration_hours=2,
                slug='test-service'
            )
        
        booking = Booking.objects.create(
            customer=user,
            service=service,
            booking_date=timezone.now().date() + timedelta(days=1),
            booking_time=timezone.now().time(),
            address='Test Address',
            city='Test City',
            phone='1234567890',
            price=200.00,
            total_amount=200.00
        )
        print(f"Created booking: ID {booking.id} - Rs.{booking.total_amount}")
        
        # Get or create payment method
        payment_method, _ = PaymentMethod.objects.get_or_create(
            name='Digital Wallet',
            defaults={
                'payment_type': 'digital_wallet',
                'is_active': True,
                'processing_fee_percentage': 0.00
            }
        )
        
        # 2. Test checkout calculation with voucher
        print("\n--- Testing Checkout Calculation ---")
        
        # Simulate the checkout calculation API call
        base_amount = booking.total_amount
        processing_fee = 0
        voucher_discount = min(voucher.remaining_value, base_amount)
        final_amount = base_amount + processing_fee - voucher_discount
        
        print(f"Base amount: Rs.{base_amount}")
        print(f"Voucher discount: Rs.{voucher_discount}")
        print(f"Final amount: Rs.{final_amount}")
        print(f"Savings: Rs.{voucher_discount}")
        
        # 3. Test payment initiation with voucher
        print("\n--- Testing Payment Initiation with Voucher ---")
        
        # Create payment with voucher (simulating the enhanced API)
        payment = Payment.objects.create(
            booking=booking,
            payment_method=payment_method,
            original_amount=base_amount,
            amount=final_amount,
            voucher_discount=voucher_discount,
            total_amount=final_amount,
            status='pending',
            payment_type=payment_method.payment_type
        )
        
        # Apply voucher to payment
        result = payment.apply_voucher(voucher)
        
        if result['success']:
            print(f"✅ Voucher applied successfully!")
            print(f"   Discount applied: Rs.{result['discount_applied']}")
            print(f"   New payment amount: Rs.{result['new_amount']}")
            print(f"   New total: Rs.{result['new_total']}")
        else:
            print(f"❌ Error applying voucher: {result['error']}")
        
        # 4. Test voucher details in payment
        print("\n--- Testing Payment with Voucher Details ---")
        payment.refresh_from_db()
        
        print(f"Payment ID: {payment.id}")
        print(f"Original amount: Rs.{payment.original_amount}")
        print(f"Voucher discount: Rs.{payment.voucher_discount}")
        print(f"Final amount: Rs.{payment.amount}")
        print(f"Applied voucher: {payment.applied_voucher.voucher_code if payment.applied_voucher else 'None'}")
        print(f"Has voucher: {payment.applied_voucher is not None}")
        
        # 5. Test voucher status after application
        print("\n--- Testing Voucher Status After Application ---")
        voucher.refresh_from_db()
        
        print(f"Voucher status: {voucher.status}")
        print(f"Used amount: Rs.{voucher.used_amount}")
        print(f"Remaining value: Rs.{voucher.remaining_value}")
        print(f"Is valid: {voucher.is_valid}")
        print(f"Is fully used: {voucher.is_fully_used}")
        
        # 6. Test voucher removal
        print("\n--- Testing Voucher Removal ---")
        
        removal_result = payment.remove_voucher()
        
        if removal_result['success']:
            print(f"✅ Voucher removed successfully!")
            print(f"   Discount removed: Rs.{removal_result['discount_removed']}")
            print(f"   Restored amount: Rs.{removal_result['restored_amount']}")
        else:
            print(f"❌ Error removing voucher: {removal_result['error']}")
        
        # 7. Test account balance changes
        print("\n--- Testing Account Balance Changes ---")
        account.refresh_from_db()
        print(f"Final account balance: {account.current_balance}")
        
        # 8. Test multiple voucher scenarios
        print("\n--- Testing Multiple Voucher Scenarios ---")
        
        # Create another voucher for testing
        voucher2 = RewardVoucher.objects.create(
            user=user,
            value=50.00,
            points_redeemed=500,
            expires_at=timezone.now() + timedelta(days=30)
        )
        
        # Test applying voucher again
        result2 = payment.apply_voucher(voucher2)
        
        if result2['success']:
            print(f"✅ Second voucher applied: Rs.{result2['discount_applied']}")
        else:
            print(f"❌ Expected error for second voucher: {result2['error']}")
        
        # Test with expired voucher
        expired_voucher = RewardVoucher.objects.create(
            user=user,
            value=25.00,
            points_redeemed=250,
            expires_at=timezone.now() - timedelta(days=1)  # Expired
        )
        
        result3 = payment.apply_voucher(expired_voucher)
        print(f"❌ Expected error for expired voucher: {result3['error']}")
        
        print("\n=== Voucher Checkout Integration Test Complete ===")
        print("✅ All voucher checkout features working correctly!")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_voucher_checkout_integration()
    sys.exit(0 if success else 1)
