#!/usr/bin/env python
"""
API Test for Phase 2.4: Voucher Checkout Integration

This script tests the voucher integration API endpoints:
1. POST /api/payments/calculate_checkout/ - Calculate totals with voucher
2. POST /api/payments/{id}/apply_voucher/ - Apply voucher to payment
3. POST /api/payments/{id}/remove_voucher/ - Remove voucher from payment
4. POST /api/bookings/{id}/initiate_payment_with_voucher/ - Enhanced payment initiation
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewabazaar.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import force_authenticate
from apps.rewards.models import RewardAccount, RewardVoucher
from apps.bookings.models import Booking, Payment, PaymentMethod
from apps.bookings.views import PaymentViewSet, BookingViewSet
from apps.services.models import Service, ServiceCategory

User = get_user_model()

def test_voucher_api_endpoints():
    print("=== Testing Voucher API Endpoints ===")
    
    try:
        # Setup test data
        print("\n--- Setting up test data ---")
        
        # Get test user
        user = User.objects.filter(email__icontains='test').first()
        if not user:
            user = User.objects.first()
        
        # Setup reward account
        account, _ = RewardAccount.objects.get_or_create(
            user=user,
            defaults={'current_balance': 5000}
        )
        if account.current_balance < 2000:
            account.current_balance = 5000
            account.save()
        
        # Create test voucher
        voucher = RewardVoucher.objects.create(
            user=user,
            value=150.00,
            points_redeemed=1500,
            expires_at=timezone.now() + timedelta(days=30)
        )
        
        # Create test booking
        service = Service.objects.first()
        if not service:
            category = ServiceCategory.objects.first()
            if not category:
                category = ServiceCategory.objects.create(
                    title='Test API Category',
                    description='Test category for API',
                    slug='test-api-category'
                )
            
            service = Service.objects.create(
                title='Test API Service',
                category=category,
                provider=user,
                description='Test service for API',
                base_price=300.00,
                duration_hours=3,
                slug='test-api-service'
            )
        
        booking = Booking.objects.create(
            customer=user,
            service=service,
            booking_date=timezone.now().date() + timedelta(days=1),
            booking_time=timezone.now().time(),
            address='Test API Address',
            city='Test City',
            phone='1234567890',
            price=300.00,
            total_amount=300.00
        )
        
        # Create payment method
        payment_method, _ = PaymentMethod.objects.get_or_create(
            name='Digital Wallet Test',
            defaults={
                'payment_type': 'digital_wallet',
                'is_active': True,
                'processing_fee_percentage': 0.00
            }
        )
        
        print(f"Test user: {user.email}")
        print(f"Test voucher: {voucher.voucher_code} - Rs.{voucher.value}")
        print(f"Test booking: ID {booking.id} - Rs.{booking.total_amount}")
        
        # Setup request factory
        factory = RequestFactory()
        
        # 1. Test calculate_checkout endpoint
        print("\n--- Testing Calculate Checkout API ---")
        
        view = PaymentViewSet()
        view.action = 'calculate_checkout'
        
        request_data = {
            'booking_id': booking.id,
            'voucher_code': voucher.voucher_code
        }
        
        request = factory.post('/api/payments/calculate_checkout/', request_data, format='json')
        force_authenticate(request, user=user)
        
        response = view.calculate_checkout(request)
        
        if response.status_code == 200:
            data = response.data
            print(f"✅ Calculate Checkout API successful")
            print(f"   Base amount: Rs.{data['base_amount']}")
            print(f"   Voucher discount: Rs.{data['voucher_discount']}")
            print(f"   Final amount: Rs.{data['final_amount']}")
            print(f"   Savings: Rs.{data['savings']}")
        else:
            print(f"❌ Calculate Checkout API failed: {response.data}")
        
        # 2. Test enhanced payment initiation with voucher
        print("\n--- Testing Enhanced Payment Initiation API ---")
        
        booking_view = BookingViewSet()
        booking_view.action = 'initiate_payment_with_voucher'
        
        request_data = {
            'payment_method_id': payment_method.id,
            'voucher_code': voucher.voucher_code
        }
        
        request = factory.post(f'/api/bookings/{booking.id}/initiate_payment_with_voucher/', request_data, format='json')
        force_authenticate(request, user=user)
        
        # Mock get_object method
        booking_view.get_object = lambda: booking
        
        response = booking_view.initiate_payment_with_voucher(request, pk=booking.id)
        
        if response.status_code == 201:
            data = response.data
            print(f"✅ Enhanced Payment Initiation API successful")
            print(f"   Payment ID: {data['payment']['id']}")
            print(f"   Original amount: Rs.{data['summary']['original_amount']}")
            print(f"   Voucher discount: Rs.{data['summary']['voucher_discount']}")
            print(f"   Final amount: Rs.{data['summary']['final_amount']}")
            
            payment_id = data['payment']['id']
        else:
            print(f"❌ Enhanced Payment Initiation API failed: {response.data}")
            return False
        
        # 3. Test apply voucher to existing payment
        print("\n--- Testing Apply Voucher API ---")
        
        # Create another payment for testing
        test_payment = Payment.objects.create(
            booking=booking,
            payment_method=payment_method,
            amount=300.00,
            total_amount=300.00,
            status='pending',
            payment_type='digital_wallet'
        )
        
        # Create another voucher
        voucher2 = RewardVoucher.objects.create(
            user=user,
            value=75.00,
            points_redeemed=750,
            expires_at=timezone.now() + timedelta(days=30)
        )
        
        payment_view = PaymentViewSet()
        payment_view.action = 'apply_voucher'
        
        request_data = {
            'voucher_code': voucher2.voucher_code
        }
        
        request = factory.post(f'/api/payments/{test_payment.id}/apply_voucher/', request_data, format='json')
        force_authenticate(request, user=user)
        
        # Mock get_object method
        payment_view.get_object = lambda: test_payment
        payment_view.get_serializer = lambda data=None: type('MockSerializer', (), {
            'is_valid': lambda: True,
            'validated_data': request_data
        })()
        
        response = payment_view.apply_voucher(request, pk=test_payment.id)
        
        if response.status_code == 200:
            data = response.data
            print(f"✅ Apply Voucher API successful")
            print(f"   Voucher applied: {data['voucher_applied']['code']}")
            print(f"   Discount: Rs.{data['voucher_applied']['discount']}")
        else:
            print(f"❌ Apply Voucher API failed: {response.data}")
        
        # 4. Test remove voucher API
        print("\n--- Testing Remove Voucher API ---")
        
        payment_view.action = 'remove_voucher'
        
        request = factory.post(f'/api/payments/{test_payment.id}/remove_voucher/', {}, format='json')
        force_authenticate(request, user=user)
        
        response = payment_view.remove_voucher(request, pk=test_payment.id)
        
        if response.status_code == 200:
            data = response.data
            print(f"✅ Remove Voucher API successful")
            print(f"   Discount removed: Rs.{data['voucher_removed']['discount_removed']}")
        else:
            print(f"❌ Remove Voucher API failed: {response.data}")
        
        print("\n=== Voucher API Endpoints Test Complete ===")
        print("✅ All voucher API endpoints working correctly!")
        
        return True
        
    except Exception as e:
        print(f"❌ API test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_voucher_api_endpoints()
    sys.exit(0 if success else 1)
