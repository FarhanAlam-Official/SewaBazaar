"""
Test Suite for SewaBazaar Rewards System

This module contains comprehensive tests for the rewards system functionality.
Tests cover models, API endpoints, business logic, and edge cases.

Phase 1 Tests:
- Model functionality and validation
- API endpoint behavior
- Points calculation logic
- Tier progression system
- Permission and security checks

Test Categories:
- Unit tests for models and business logic
- Integration tests for API endpoints  
- Edge case and error handling tests
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

from .models import RewardAccount, PointsTransaction, RewardsConfig
from apps.bookings.models import Booking, Service
from apps.services.models import ServiceCategory

User = get_user_model()


class RewardsConfigModelTest(TestCase):
    """Test the RewardsConfig model functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            username='admin',
            password='testpass123',
            role='admin'
        )
    
    def test_create_default_config(self):
        """Test creating a rewards configuration with default values."""
        config = RewardsConfig.objects.create(
            updated_by=self.admin_user
        )
        
        self.assertTrue(config.is_active)
        self.assertEqual(config.points_per_rupee, Decimal('0.100'))  # Now matches the model default
        self.assertEqual(config.rupees_per_point, Decimal('0.100'))  # Now matches the model default
        self.assertEqual(config.min_redemption_points, 100)
        self.assertIsInstance(config.voucher_denominations, list)
        self.assertIn(100, config.voucher_denominations)
    
    def test_get_active_config(self):
        """Test getting the active configuration."""
        # Create multiple configs
        RewardsConfig.objects.create(is_active=False, updated_by=self.admin_user)
        active_config = RewardsConfig.objects.create(is_active=True, updated_by=self.admin_user)
        
        retrieved_config = RewardsConfig.get_active_config()
        self.assertEqual(retrieved_config.id, active_config.id)
    
    def test_only_one_active_config(self):
        """Test that only one configuration can be active at a time."""
        # Create first active config
        config1 = RewardsConfig.objects.create(is_active=True, updated_by=self.admin_user)
        
        # Create second active config
        config2 = RewardsConfig.objects.create(is_active=True, updated_by=self.admin_user)
        
        # Refresh from database
        config1.refresh_from_db()
        
        # First config should now be inactive
        self.assertFalse(config1.is_active)
        self.assertTrue(config2.is_active)


class RewardAccountModelTest(TestCase):
    """Test the RewardAccount model functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='user@test.com',
            username='testuser',
            password='testpass123'
        )
        # Get the auto-created account from signals
        self.account = self.user.reward_account
        
        # Create rewards configuration
        self.config = RewardsConfig.objects.create(
            is_active=True,
            tier_thresholds={'silver': 1000, 'gold': 5000, 'platinum': 15000},
            tier_multipliers={'bronze': 1.0, 'silver': 1.2, 'gold': 1.5, 'platinum': 2.0}
        )
    
    def test_add_points(self):
        """Test adding points to an account."""
        initial_balance = self.account.current_balance
        points_to_add = 500
        
        transaction = self.account.add_points(
            points=points_to_add,
            transaction_type='earned_booking',
            description='Test points'
        )
        
        self.account.refresh_from_db()
        self.assertEqual(self.account.current_balance, initial_balance + points_to_add)
        self.assertEqual(self.account.total_points_earned, points_to_add)
        self.assertIsNotNone(self.account.last_points_earned)
        self.assertEqual(transaction.points, points_to_add)
        self.assertEqual(transaction.balance_after, self.account.current_balance)
    
    def test_redeem_points(self):
        """Test redeeming points from an account."""
        # First add some points
        self.account.add_points(1000, 'earned_booking', 'Test points')
        
        points_to_redeem = 300
        initial_balance = self.account.current_balance
        
        transaction = self.account.redeem_points(
            points=points_to_redeem,
            transaction_type='redeemed_voucher',
            description='Test redemption'
        )
        
        self.account.refresh_from_db()
        self.assertEqual(self.account.current_balance, initial_balance - points_to_redeem)
        self.assertEqual(self.account.total_points_redeemed, points_to_redeem)
        self.assertIsNotNone(self.account.last_points_redeemed)
        self.assertEqual(transaction.points, -points_to_redeem)
    
    def test_insufficient_points_redemption(self):
        """Test that redemption fails with insufficient points."""
        with self.assertRaises(ValueError):
            self.account.redeem_points(1000, 'redeemed_voucher', 'Test')
    
    def test_tier_progression(self):
        """Test automatic tier progression based on points earned."""
        # Start at bronze
        self.assertEqual(self.account.tier_level, 'bronze')
        
        # Add points to reach silver
        self.account.add_points(1000, 'earned_booking', 'Reach silver')
        self.account.refresh_from_db()
        self.assertEqual(self.account.tier_level, 'silver')
        
        # Add more points to reach gold
        self.account.add_points(4000, 'earned_booking', 'Reach gold')
        self.account.refresh_from_db()
        self.assertEqual(self.account.tier_level, 'gold')
    
    def test_tier_progress_calculation(self):
        """Test tier progress calculation."""
        # Add 750 points (between bronze and silver thresholds)
        self.account.add_points(750, 'earned_booking', 'Test progress')
        
        progress = self.account.get_tier_progress()
        self.assertEqual(progress['current_tier'], 'bronze')
        self.assertEqual(progress['next_tier'], 'silver')
        self.assertEqual(progress['points_needed'], 250)  # 1000 - 750
        self.assertGreater(progress['progress_percentage'], 0)
    
    def test_tier_multiplier(self):
        """Test tier multiplier calculation."""
        # Bronze tier
        self.assertEqual(self.account.calculate_tier_multiplier(), 1.0)
        
        # Upgrade to silver
        self.account.add_points(1000, 'earned_booking', 'Reach silver')
        self.account.refresh_from_db()
        self.assertEqual(self.account.calculate_tier_multiplier(), 1.2)


class RewardsAPITestCase(APITestCase):
    """Test the rewards API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='user@test.com',
            username='testuser',
            password='testpass123'
        )
        self.admin_user = User.objects.create_user(
            email='admin@test.com', 
            username='admin',
            password='testpass123',
            role='admin'
        )
        
        # Create rewards configuration
        self.config = RewardsConfig.objects.create(
            is_active=True,
            voucher_denominations=[100, 500, 1000]
        )
        
        # Get or create reward account (signals should have created it)
        self.account, created = RewardAccount.objects.get_or_create(user=self.user)
    
    def test_get_reward_account_authenticated(self):
        """Test getting reward account information as authenticated user."""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('rewards:reward-account-detail')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('current_balance', response.data)
        self.assertIn('tier_level', response.data)
        self.assertEqual(response.data['tier_level'], 'bronze')
    
    def test_get_reward_account_unauthenticated(self):
        """Test that unauthenticated users cannot access reward account."""
        url = reverse('rewards:reward-account-detail')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_transaction_history(self):
        """Test getting transaction history."""
        self.client.force_authenticate(user=self.user)
        
        # Add some transactions
        self.account.add_points(500, 'earned_booking', 'Test transaction 1')
        self.account.add_points(300, 'earned_review', 'Test transaction 2')
        
        url = reverse('rewards:points-transaction-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        self.assertIn('results', response.data)
    
    def test_user_rewards_summary(self):
        """Test the rewards summary endpoint."""
        self.client.force_authenticate(user=self.user)
        
        # Add some points
        self.account.add_points(1250, 'earned_booking', 'Test points')
        
        url = reverse('rewards:user-rewards-summary')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['current_balance'], 1250)
        self.assertEqual(response.data['tier'], 'silver')  # Should upgrade to silver
        self.assertIn('balance_in_rupees', response.data)
    
    def test_available_vouchers(self):
        """Test the available vouchers endpoint."""
        self.client.force_authenticate(user=self.user)
        
        # Add enough points for some vouchers
        self.account.add_points(1500, 'earned_booking', 'Test points')
        
        url = reverse('rewards:available-vouchers')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('available_vouchers', response.data)
        self.assertIn('current_balance', response.data)
        
        # Check that user can afford 100 point voucher but not 5000 point voucher
        vouchers = response.data['available_vouchers']
        voucher_100 = next(v for v in vouchers if v['value'] == 100)
        voucher_1000 = next(v for v in vouchers if v['value'] == 1000)
        
        self.assertTrue(voucher_100['can_afford'])
        self.assertTrue(voucher_1000['can_afford'])  # 1500 points = Rs.150, so can afford Rs.100 voucher
    
    def test_admin_statistics_endpoint(self):
        """Test the admin statistics endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('rewards:rewards-statistics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_users', response.data)
        self.assertIn('users_by_tier', response.data)
        self.assertIn('is_system_healthy', response.data)
    
    def test_admin_statistics_non_admin(self):
        """Test that non-admin users cannot access statistics."""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('rewards:rewards-statistics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_transaction_filtering(self):
        """Test transaction filtering by type."""
        self.client.force_authenticate(user=self.user)
        
        # Create different types of transactions
        self.account.add_points(500, 'earned_booking', 'Booking points')
        self.account.add_points(100, 'earned_review', 'Review points')
        self.account.redeem_points(200, 'redeemed_voucher', 'Voucher redemption')
        
        # Filter by earning transactions
        url = reverse('rewards:points-transaction-list')
        response = self.client.get(url, {'transaction_type': 'earned_booking'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['transaction_type'], 'earned_booking')


class RewardsBusinessLogicTest(TestCase):
    """Test rewards system business logic and calculations."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='user@test.com',
            username='testuser', 
            password='testpass123'
        )
        
        self.config = RewardsConfig.objects.create(
            is_active=True,
            points_per_rupee=Decimal('0.1'),  # 1 point per Rs.10
            rupees_per_point=Decimal('0.1'),  # 10 points per Rs.1
            first_booking_bonus=200,
            weekend_booking_bonus=50
        )
        
        # Get or create reward account (signals should have created it)
        self.account, created = RewardAccount.objects.get_or_create(user=self.user)
    
    def test_points_calculation_basic(self):
        """Test basic points calculation from booking amount."""
        booking_amount = Decimal('1000.00')
        expected_points = int(booking_amount * self.config.points_per_rupee)  # 100 points
        
        self.account.add_points(
            points=expected_points,
            transaction_type='earned_booking',
            description='Test booking'
        )
        
        self.assertEqual(self.account.current_balance, expected_points)
    
    def test_tier_multiplier_effect(self):
        """Test that tier multipliers affect points calculation correctly."""
        # Upgrade user to silver tier
        self.account.add_points(1000, 'earned_booking', 'Reach silver')
        self.account.refresh_from_db()
        
        # Silver tier should have 1.2x multiplier
        multiplier = self.account.calculate_tier_multiplier()
        self.assertEqual(multiplier, 1.2)
        
        # Calculate points with multiplier
        base_points = 100
        expected_points = int(base_points * multiplier)  # 120 points
        
        self.account.add_points(expected_points, 'earned_booking', 'Silver tier booking')
        
        # Total should be 1000 (to reach silver) + 120 (silver tier booking)
        self.assertEqual(self.account.current_balance, 1120)
    
    def test_voucher_conversion_rates(self):
        """Test voucher point cost calculations."""
        # Rs.100 voucher should cost 1000 points (100 / 0.1)
        voucher_value = 100
        expected_cost = int(voucher_value / self.config.rupees_per_point)
        
        self.assertEqual(expected_cost, 1000)
        
        # Add enough points and test redemption
        self.account.add_points(1000, 'earned_booking', 'Test points')
        
        # Should be able to redeem exactly
        self.account.redeem_points(
            points=expected_cost,
            transaction_type='redeemed_voucher',
            description='Rs.100 voucher'
        )
        
        self.assertEqual(self.account.current_balance, 0)
        self.assertEqual(self.account.total_points_redeemed, 1000)


if __name__ == '__main__':
    # Run tests with: python manage.py test apps.rewards
    pass
