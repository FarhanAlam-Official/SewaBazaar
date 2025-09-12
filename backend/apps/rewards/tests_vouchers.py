"""
Comprehensive test suite for Phase 2: Voucher System

This test suite validates:
1. Enhanced RewardVoucher model functionality
2. Voucher redemption API endpoints
3. Voucher validation and usage
4. Business logic and edge cases
5. Admin voucher management

Run with: python manage.py test apps.rewards.tests_vouchers
"""

import json
from decimal import Decimal
from datetime import timedelta

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from apps.rewards.models import RewardsConfig, RewardAccount, PointsTransaction, RewardVoucher

User = get_user_model()


class RewardVoucherModelTestCase(TestCase):
    """Test the enhanced RewardVoucher model functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create reward account with sufficient points
        self.account, created = RewardAccount.objects.get_or_create(
            user=self.user,
            defaults={
                'current_balance': 5000,
                'total_points_earned': 5000,
                'tier_level': 'silver'
            }
        )
        if not created:
            # Update existing account
            self.account.current_balance = 5000
            self.account.total_points_earned = 5000
            self.account.tier_level = 'silver'
            self.account.save()
        
        # Set up configuration
        self.config = RewardsConfig.objects.create(
            is_active=True,
            points_per_rupee=0.1,
            rupees_per_point=0.1,
            min_redemption_points=100,
            voucher_denominations=[100, 200, 500, 1000, 5000],
            voucher_validity_days=365
        )
    
    def test_voucher_code_generation(self):
        """Test automatic voucher code generation."""
        voucher = RewardVoucher.objects.create(
            user=self.user,
            value=Decimal('100.00'),
            points_redeemed=1000
        )
        
        # Check code format: SB-YYYYMMDD-XXXXXX
        self.assertTrue(voucher.voucher_code.startswith('SB-'))
        self.assertEqual(len(voucher.voucher_code), 18)  # SB-YYYYMMDD-XXXXXX
        
        # Check uniqueness
        voucher2 = RewardVoucher.objects.create(
            user=self.user,
            value=Decimal('200.00'),
            points_redeemed=2000
        )
        self.assertNotEqual(voucher.voucher_code, voucher2.voucher_code)
    
    def test_qr_code_generation(self):
        """Test QR code data generation."""
        voucher = RewardVoucher.objects.create(
            user=self.user,
            value=Decimal('500.00'),
            points_redeemed=5000
        )
        
        # Check QR data is JSON
        qr_data = json.loads(voucher.qr_code_data)
        
        self.assertEqual(qr_data['type'], 'sewabazaar_voucher')
        self.assertEqual(qr_data['code'], voucher.voucher_code)
        self.assertEqual(qr_data['value'], '500.00')
        self.assertEqual(qr_data['user_id'], self.user.id)
    
    def test_voucher_validity_properties(self):
        """Test voucher validity checking properties."""
        voucher = RewardVoucher.objects.create(
            user=self.user,
            value=Decimal('100.00'),
            points_redeemed=1000
        )
        
        # Should be valid when created
        self.assertTrue(voucher.is_valid)
        self.assertFalse(voucher.is_expired)
        self.assertFalse(voucher.is_fully_used)
        self.assertEqual(voucher.remaining_value, Decimal('100.00'))
        self.assertGreater(voucher.days_until_expiry, 360)
    
    def test_voucher_usage(self):
        """Test voucher usage functionality."""
        voucher = RewardVoucher.objects.create(
            user=self.user,
            value=Decimal('100.00'),
            points_redeemed=1000
        )
        
        # Use partial amount
        amount_used = voucher.use_voucher(Decimal('30.00'))
        self.assertEqual(amount_used, Decimal('30.00'))
        self.assertEqual(voucher.remaining_value, Decimal('70.00'))
        self.assertEqual(voucher.used_amount, Decimal('30.00'))
        self.assertEqual(voucher.status, 'active')  # Still active
        
        # Use remaining amount
        amount_used = voucher.use_voucher(Decimal('70.00'))
        self.assertEqual(amount_used, Decimal('70.00'))
        self.assertEqual(voucher.remaining_value, Decimal('0.00'))
        self.assertTrue(voucher.is_fully_used)
        self.assertEqual(voucher.status, 'used')
        self.assertIsNotNone(voucher.used_at)
    
    def test_voucher_usage_validation(self):
        """Test voucher usage validation."""
        voucher = RewardVoucher.objects.create(
            user=self.user,
            value=Decimal('100.00'),
            points_redeemed=1000
        )
        
        # Test invalid usage amount
        with self.assertRaises(ValueError):
            voucher.use_voucher(Decimal('-10.00'))  # Negative amount
        
        with self.assertRaises(ValueError):
            voucher.use_voucher(Decimal('0.00'))  # Zero amount
        
        # Mark voucher as expired and test
        voucher.expires_at = timezone.now() - timedelta(days=1)
        voucher.save()
        
        with self.assertRaises(ValueError):
            voucher.use_voucher(Decimal('50.00'))  # Expired voucher
    
    def test_voucher_cancellation(self):
        """Test voucher cancellation and refund."""
        voucher = RewardVoucher.objects.create(
            user=self.user,
            value=Decimal('500.00'),
            points_redeemed=5000
        )
        
        original_balance = self.account.current_balance
        
        # Cancel voucher
        transaction = voucher.cancel_voucher("User requested cancellation")
        
        # Check voucher status
        self.assertEqual(voucher.status, 'cancelled')
        self.assertIn('cancellation_reason', voucher.metadata)
        
        # Check refund transaction
        self.assertIsNotNone(transaction)
        self.assertEqual(transaction.points, 5000)  # Full refund
        self.assertEqual(transaction.transaction_type, 'refund_voucher_cancelled')
        
        # Check account balance updated
        self.account.refresh_from_db()
        self.assertEqual(self.account.current_balance, original_balance + 5000)
    
    def test_create_voucher_class_method(self):
        """Test the create_voucher class method."""
        # Test successful creation
        voucher = RewardVoucher.create_voucher(
            user=self.user,
            denomination=Decimal('500.00'),
            points_cost=5000
        )
        
        self.assertEqual(voucher.value, Decimal('500.00'))
        self.assertEqual(voucher.points_redeemed, 5000)
        self.assertEqual(voucher.user, self.user)
        
        # Check account balance reduced
        self.account.refresh_from_db()
        self.assertEqual(self.account.current_balance, 0)  # 5000 - 5000
        
        # Check transaction created
        transaction = PointsTransaction.objects.filter(
            user=self.user,
            transaction_type='redeemed_voucher',
            voucher=voucher
        ).first()
        self.assertIsNotNone(transaction)
        self.assertEqual(transaction.points, -5000)


class VoucherAPITestCase(APITestCase):
    """Test voucher API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='apiuser',
            email='api@example.com',
            password='apipass123'
        )
        
        # Create reward account with sufficient points
        self.account, created = RewardAccount.objects.get_or_create(
            user=self.user,
            defaults={
                'current_balance': 10000,
                'total_points_earned': 10000,
                'tier_level': 'gold'
            }
        )
        if not created:
            # Update existing account
            self.account.current_balance = 10000
            self.account.total_points_earned = 10000
            self.account.tier_level = 'gold'
            self.account.save()
        
        # Set up configuration
        self.config = RewardsConfig.objects.create(
            is_active=True,
            points_per_rupee=0.1,
            rupees_per_point=0.1,
            min_redemption_points=100,
            voucher_denominations=[100, 200, 500, 1000, 5000],
            voucher_validity_days=365
        )
        
        # Create some test vouchers
        self.voucher1 = RewardVoucher.objects.create(
            user=self.user,
            voucher_code='TEST-VOUCHER-001',
            value=Decimal('100.00'),
            points_redeemed=1000
        )
        
        self.voucher2 = RewardVoucher.objects.create(
            user=self.user,
            voucher_code='TEST-VOUCHER-002',
            value=Decimal('500.00'),
            points_redeemed=5000,
            status='used',
            used_amount=Decimal('500.00'),
            used_at=timezone.now()
        )
    
    def test_available_vouchers_endpoint(self):
        """Test the available vouchers endpoint."""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/api/rewards/vouchers/available/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertIn('vouchers', data)
        self.assertIn('user_balance', data)
        self.assertIn('redemption_rate', data)
        
        # Check voucher options
        vouchers = data['vouchers']
        self.assertEqual(len(vouchers), 5)  # 5 denominations
        
        # Check first voucher (Rs.100)
        voucher_100 = next(v for v in vouchers if v['denomination'] == '100.00')
        self.assertEqual(voucher_100['points_required'], 1000)
        self.assertTrue(voucher_100['user_can_afford'])
    
    def test_redeem_voucher_endpoint(self):
        """Test voucher redemption endpoint."""
        self.client.force_authenticate(user=self.user)
        
        data = {'denomination': '200.00'}
        response = self.client.post('/api/rewards/vouchers/redeem/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        response_data = response.json()
        self.assertIn('voucher', response_data)
        self.assertIn('account_balance', response_data)
        self.assertIn('message', response_data)
        
        # Check voucher was created
        voucher_data = response_data['voucher']
        self.assertEqual(voucher_data['value'], '200.00')
        self.assertEqual(voucher_data['status'], 'active')
        
        # Check account balance updated
        self.assertEqual(response_data['account_balance'], 8000)  # 10000 - 2000
    
    def test_redeem_voucher_insufficient_points(self):
        """Test voucher redemption with insufficient points."""
        self.client.force_authenticate(user=self.user)
        
        data = {'denomination': '100000.00'}  # Requires 1,000,000 points
        response = self.client.post('/api/rewards/vouchers/redeem/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        self.assertIn('Insufficient points', str(response.json()))
    
    def test_validate_voucher_endpoint(self):
        """Test voucher validation endpoint."""
        self.client.force_authenticate(user=self.user)
        
        data = {'voucher_code': 'TEST-VOUCHER-001'}
        response = self.client.post('/api/rewards/vouchers/validate/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        response_data = response.json()
        self.assertEqual(response_data['voucher_code'], 'TEST-VOUCHER-001')
        self.assertEqual(response_data['value'], '100.00')
        self.assertTrue(response_data['is_valid'])
        self.assertIsNone(response_data['error_message'])
    
    def test_validate_invalid_voucher(self):
        """Test validation of invalid voucher."""
        self.client.force_authenticate(user=self.user)
        
        data = {'voucher_code': 'INVALID-CODE'}
        response = self.client.post('/api/rewards/vouchers/validate/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_user_voucher_list_endpoint(self):
        """Test user voucher listing endpoint."""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/api/rewards/vouchers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertIn('results', data)
        
        # Should return 2 vouchers for this user
        vouchers = data['results']
        self.assertEqual(len(vouchers), 2)
        
        # Check voucher data
        active_voucher = next(v for v in vouchers if v['status'] == 'active')
        self.assertEqual(active_voucher['voucher_code'], 'TEST-VOUCHER-001')
        self.assertTrue(active_voucher['is_valid'])
    
    def test_voucher_detail_endpoint(self):
        """Test voucher detail endpoint."""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/api/rewards/vouchers/TEST-VOUCHER-001/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertEqual(data['voucher_code'], 'TEST-VOUCHER-001')
        self.assertEqual(data['value'], '100.00')
        self.assertEqual(data['remaining_value'], '100.00')
    
    def test_use_voucher_endpoint(self):
        """Test voucher usage endpoint."""
        self.client.force_authenticate(user=self.user)
        
        data = {'amount': '50.00'}
        response = self.client.post('/api/rewards/vouchers/TEST-VOUCHER-001/use/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        response_data = response.json()
        self.assertEqual(response_data['amount_used'], 50.0)
        
        # Check voucher was updated
        voucher_data = response_data['voucher']
        self.assertEqual(voucher_data['used_amount'], '50.00')
        self.assertEqual(voucher_data['remaining_value'], '50.00')
    
    def test_cancel_voucher_endpoint(self):
        """Test voucher cancellation endpoint."""
        self.client.force_authenticate(user=self.user)
        
        data = {'reason': 'Test cancellation'}
        response = self.client.post('/api/rewards/vouchers/TEST-VOUCHER-001/cancel/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        response_data = response.json()
        self.assertEqual(response_data['status'], 'cancelled')
        self.assertIn('refund_points', response_data)
        
        # Check account balance increased (refund)
        self.assertGreater(response_data['account_balance'], 10000)
    
    def test_unauthenticated_access(self):
        """Test that unauthenticated users cannot access voucher endpoints."""
        endpoints = [
            '/api/rewards/vouchers/available/',
            '/api/rewards/vouchers/',
            '/api/rewards/vouchers/TEST-VOUCHER-001/',
        ]
        
        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class VoucherBusinessLogicTestCase(TestCase):
    """Test voucher business logic and edge cases."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='bizuser',
            email='biz@example.com',
            password='bizpass123'
        )
        
        self.account, created = RewardAccount.objects.get_or_create(
            user=self.user,
            defaults={
                'current_balance': 1000,
                'total_points_earned': 1000,
                'tier_level': 'bronze'
            }
        )
        if not created:
            # Update existing account
            self.account.current_balance = 1000
            self.account.total_points_earned = 1000
            self.account.tier_level = 'bronze'
            self.account.save()
        
        self.config = RewardsConfig.objects.create(
            is_active=True,
            points_per_rupee=0.1,
            rupees_per_point=0.1,
            min_redemption_points=100,
            voucher_denominations=[100, 200, 500],
            voucher_validity_days=30
        )
    
    def test_voucher_expiry_validation(self):
        """Test voucher expiry validation."""
        # Create expired voucher
        voucher = RewardVoucher.objects.create(
            user=self.user,
            value=Decimal('100.00'),
            points_redeemed=1000,
            expires_at=timezone.now() - timedelta(days=1)
        )
        
        self.assertTrue(voucher.is_expired)
        self.assertFalse(voucher.is_valid)
        self.assertEqual(voucher.days_until_expiry, 0)
        
        # Should not be able to use expired voucher
        with self.assertRaises(ValueError):
            voucher.use_voucher(Decimal('50.00'))
    
    def test_voucher_extension(self):
        """Test voucher expiry extension."""
        voucher = RewardVoucher.objects.create(
            user=self.user,
            value=Decimal('100.00'),
            points_redeemed=1000
        )
        
        original_expiry = voucher.expires_at
        
        # Extend by 30 days
        voucher.extend_expiry(30)
        
        self.assertEqual(voucher.expires_at, original_expiry + timedelta(days=30))
        self.assertIn('expiry_extended', voucher.metadata)
        self.assertEqual(voucher.metadata['expiry_extended'], 30)
    
    def test_partial_voucher_usage(self):
        """Test partial voucher usage scenarios."""
        voucher = RewardVoucher.objects.create(
            user=self.user,
            value=Decimal('100.00'),
            points_redeemed=1000
        )
        
        # Use more than available (should use only available amount)
        amount_used = voucher.use_voucher(Decimal('150.00'))
        self.assertEqual(amount_used, Decimal('100.00'))
        self.assertTrue(voucher.is_fully_used)
        self.assertEqual(voucher.status, 'used')
    
    def test_voucher_with_booking_integration(self):
        """Test voucher usage with booking integration."""
        # This would require booking model integration
        # For now, test the voucher.booking field functionality
        voucher = RewardVoucher.objects.create(
            user=self.user,
            value=Decimal('100.00'),
            points_redeemed=1000
        )
        
        # Test that booking field can be set
        self.assertIsNone(voucher.booking)
        
        # When we use voucher, we can link it to a booking
        # (In real usage, booking object would be passed)
        amount_used = voucher.use_voucher(Decimal('50.00'), booking=None)
        self.assertEqual(amount_used, Decimal('50.00'))
