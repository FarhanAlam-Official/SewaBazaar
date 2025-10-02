"""
Django Test Cases for Phase 2.4: Voucher Checkout Integration

Test cases for the voucher integration in checkout process.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from apps.rewards.models import RewardAccount, RewardVoucher, RewardsConfig
from apps.bookings.models import Booking, Payment, PaymentMethod
from apps.services.models import Service, ServiceCategory

User = get_user_model()


class VoucherCheckoutIntegrationTestCase(APITestCase):
    """Test voucher integration in checkout process"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='customer'
        )
        
        # Setup reward config
        self.config = RewardsConfig.objects.create(
            points_per_rupee=Decimal('0.100'),
            rupees_per_point=Decimal('0.100'),
            voucher_denominations=[25.0, 50.0, 100.0, 200.0],
            voucher_validity_days=30
        )
        
        # Create reward account
        self.account = RewardAccount.objects.create(
            user=self.user,
            current_balance=5000
        )
        
        # Create test voucher
        self.voucher = RewardVoucher.objects.create(
            user=self.user,
            value=Decimal('100.00'),
            points_redeemed=1000,
            expires_at=timezone.now() + timedelta(days=30)
        )
        
        # Create service and booking
        self.category = ServiceCategory.objects.create(
            title='Test Category',
            description='Test category',
            slug='test-category'
        )
        
        self.service = Service.objects.create(
            title='Test Service',
            category=self.category,
            provider=self.user,
            description='Test service',
            base_price=Decimal('200.00'),
            duration_hours=2,
            slug='test-service'
        )
        
        self.booking = Booking.objects.create(
            customer=self.user,
            service=self.service,
            booking_date=timezone.now().date() + timedelta(days=1),
            booking_time=timezone.now().time(),
            address='Test Address',
            city='Test City',
            phone='1234567890',
            price=Decimal('200.00'),
            total_amount=Decimal('200.00')
        )
        
        # Create payment method
        self.payment_method = PaymentMethod.objects.create(
            name='Test Digital Wallet',
            payment_type='digital_wallet',
            is_active=True,
            processing_fee_percentage=Decimal('0.00')
        )
        
        # Authenticate user
        self.client.force_authenticate(user=self.user)
    
    def test_calculate_checkout_without_voucher(self):
        """Test checkout calculation without voucher"""
        url = '/api/payments/calculate_checkout/'
        data = {
            'booking_id': self.booking.id
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response.data['base_amount']), 200.0)
        self.assertEqual(float(response.data['voucher_discount']), 0.0)
        self.assertEqual(float(response.data['final_amount']), 200.0)
        self.assertIsNone(response.data['voucher_applied'])
    
    def test_calculate_checkout_with_voucher(self):
        """Test checkout calculation with voucher"""
        url = '/api/payments/calculate_checkout/'
        data = {
            'booking_id': self.booking.id,
            'voucher_code': self.voucher.voucher_code
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response.data['base_amount']), 200.0)
        self.assertEqual(float(response.data['voucher_discount']), 100.0)
        self.assertEqual(float(response.data['final_amount']), 100.0)
        self.assertEqual(float(response.data['savings']), 100.0)
        self.assertIsNotNone(response.data['voucher_applied'])
        self.assertEqual(response.data['voucher_applied']['code'], self.voucher.voucher_code)
    
    def test_initiate_payment_with_voucher(self):
        """Test enhanced payment initiation with voucher"""
        url = f'/api/bookings/{self.booking.id}/initiate_payment_with_voucher/'
        data = {
            'payment_method_id': self.payment_method.id,
            'voucher_code': self.voucher.voucher_code
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(float(response.data['summary']['original_amount']), 200.0)
        self.assertEqual(float(response.data['summary']['voucher_discount']), 100.0)
        self.assertEqual(float(response.data['summary']['final_amount']), 100.0)
        
        # Verify payment was created correctly
        payment = Payment.objects.get(id=response.data['payment']['id'])
        self.assertEqual(payment.applied_voucher, self.voucher)
        self.assertEqual(float(payment.voucher_discount), 100.0)
        self.assertEqual(float(payment.amount), 100.0)
    
    def test_apply_voucher_to_payment(self):
        """Test applying voucher to existing payment"""
        # Create payment
        payment = Payment.objects.create(
            booking=self.booking,
            payment_method=self.payment_method,
            amount=Decimal('200.00'),
            total_amount=Decimal('200.00'),
            status='pending',
            payment_type='digital_wallet'
        )
        
        url = f'/api/payments/{payment.id}/apply_voucher/'
        data = {
            'voucher_code': self.voucher.voucher_code
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['voucher_applied']['code'], self.voucher.voucher_code)
        self.assertEqual(float(response.data['voucher_applied']['discount']), 100.0)
        
        # Verify payment was updated
        payment.refresh_from_db()
        self.assertEqual(payment.applied_voucher, self.voucher)
        self.assertEqual(float(payment.voucher_discount), 100.0)
    
    def test_remove_voucher_from_payment(self):
        """Test removing voucher from payment"""
        # Create payment and apply voucher
        payment = Payment.objects.create(
            booking=self.booking,
            payment_method=self.payment_method,
            amount=Decimal('200.00'),
            total_amount=Decimal('200.00'),
            status='pending',
            payment_type='digital_wallet'
        )
        
        payment.apply_voucher(self.voucher)
        
        url = f'/api/payments/{payment.id}/remove_voucher/'
        response = self.client.post(url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(float(response.data['voucher_removed']['discount_removed']), 100.0)
        
        # Verify payment was updated
        payment.refresh_from_db()
        self.assertIsNone(payment.applied_voucher)
        self.assertEqual(float(payment.voucher_discount), 0.0)
    
    def test_invalid_voucher_code(self):
        """Test with invalid voucher code"""
        url = '/api/payments/calculate_checkout/'
        data = {
            'booking_id': self.booking.id,
            'voucher_code': 'INVALID-CODE'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Invalid voucher code', str(response.data))
    
    def test_expired_voucher(self):
        """Test with expired voucher"""
        # Create expired voucher
        expired_voucher = RewardVoucher.objects.create(
            user=self.user,
            value=Decimal('50.00'),
            points_redeemed=500,
            expires_at=timezone.now() - timedelta(days=1)
        )
        
        url = '/api/payments/calculate_checkout/'
        data = {
            'booking_id': self.booking.id,
            'voucher_code': expired_voucher.voucher_code
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('not valid for use', str(response.data))


class PaymentVoucherIntegrationTestCase(TestCase):
    """Test payment model voucher integration"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create service and booking
        self.category = ServiceCategory.objects.create(
            title='Test Category',
            description='Test category',
            slug='test-category'
        )
        
        self.service = Service.objects.create(
            title='Test Service',
            category=self.category,
            provider=self.user,
            description='Test service',
            base_price=Decimal('300.00'),
            duration_hours=2,
            slug='test-service'
        )
        
        self.booking = Booking.objects.create(
            customer=self.user,
            service=self.service,
            booking_date=timezone.now().date() + timedelta(days=1),
            booking_time=timezone.now().time(),
            address='Test Address',
            city='Test City',
            phone='1234567890',
            price=Decimal('300.00'),
            total_amount=Decimal('300.00')
        )
        
        # Create payment method
        self.payment_method = PaymentMethod.objects.create(
            name='Test Method',
            payment_type='digital_wallet',
            is_active=True
        )
        
        # Create voucher
        self.voucher = RewardVoucher.objects.create(
            user=self.user,
            value=Decimal('150.00'),
            points_redeemed=1500,
            expires_at=timezone.now() + timedelta(days=30)
        )
    
    def test_payment_apply_voucher_success(self):
        """Test successful voucher application to payment"""
        payment = Payment.objects.create(
            booking=self.booking,
            payment_method=self.payment_method,
            amount=Decimal('300.00'),
            total_amount=Decimal('300.00'),
            status='pending'
        )
        
        result = payment.apply_voucher(self.voucher)
        
        self.assertTrue(result['success'])
        self.assertEqual(result['discount_applied'], 150.0)
        self.assertEqual(result['new_amount'], 150.0)
        
        payment.refresh_from_db()
        self.assertEqual(payment.applied_voucher, self.voucher)
        self.assertEqual(payment.voucher_discount, Decimal('150.00'))
        self.assertEqual(payment.amount, Decimal('150.00'))
    
    def test_payment_remove_voucher_success(self):
        """Test successful voucher removal from payment"""
        payment = Payment.objects.create(
            booking=self.booking,
            payment_method=self.payment_method,
            amount=Decimal('300.00'),
            total_amount=Decimal('300.00'),
            status='pending'
        )
        
        # Apply voucher first
        payment.apply_voucher(self.voucher)
        
        # Then remove it
        result = payment.remove_voucher()
        
        self.assertTrue(result['success'])
        self.assertEqual(result['discount_removed'], 150.0)
        self.assertEqual(result['restored_amount'], 300.0)
        
        payment.refresh_from_db()
        self.assertIsNone(payment.applied_voucher)
        self.assertEqual(payment.voucher_discount, Decimal('0.00'))
        self.assertEqual(payment.amount, Decimal('300.00'))
    
    def test_payment_double_voucher_application_fails(self):
        """Test that applying second voucher fails"""
        payment = Payment.objects.create(
            booking=self.booking,
            payment_method=self.payment_method,
            amount=Decimal('300.00'),
            total_amount=Decimal('300.00'),
            status='pending'
        )
        
        # Apply first voucher
        payment.apply_voucher(self.voucher)
        
        # Create second voucher
        voucher2 = RewardVoucher.objects.create(
            user=self.user,
            value=Decimal('50.00'),
            points_redeemed=500,
            expires_at=timezone.now() + timedelta(days=30)
        )
        
        # Try to apply second voucher
        result = payment.apply_voucher(voucher2)
        
        self.assertFalse(result['success'])
        self.assertIn('already been applied', result['error'])
