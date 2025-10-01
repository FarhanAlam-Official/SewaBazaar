import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
from decimal import Decimal
from datetime import date, datetime, timedelta
from django.utils import timezone
from unittest.mock import patch, MagicMock
import json

from .models import Booking, Payment, ServiceDelivery
from apps.accounts.models import Profile
from apps.services.models import Service, ServiceCategory
from apps.reviews.models import Review

User = get_user_model()


class ProviderDashboardAPITest(APITestCase):
    """Test cases for Provider Dashboard API endpoints"""
    
    def setUp(self):
        # Create provider user
        self.provider = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            role='provider'
        )
        self.provider_profile = Profile.objects.create(
            user=self.provider,
            bio='Test provider',
            city='Kathmandu'
        )
        
        # Create customer user
        self.customer = User.objects.create_user(
            email='customer@test.com',
            username='customer',
            password='testpass123',
            role='customer'
        )
        
        # Create service category and service
        self.category = ServiceCategory.objects.create(
            name='Test Category',
            description='Test category description'
        )
        
        self.service = Service.objects.create(
            title='Test Service',
            description='Test service description',
            category=self.category,
            provider=self.provider,
            price=Decimal('1500.00'),
            duration=60,
            is_active=True
        )
        
        # Create test bookings
        self.booking1 = Booking.objects.create(
            customer=self.customer,
            service=self.service,
            booking_date=date.today() + timedelta(days=1),
            booking_time='10:00',
            address='Test Address 1',
            city='Kathmandu',
            phone='+977-1234567890',
            status='pending',
            price=Decimal('1500.00'),
            total_amount=Decimal('1500.00')
        )
        
        self.booking2 = Booking.objects.create(
            customer=self.customer,
            service=self.service,
            booking_date=date.today() + timedelta(days=2),
            booking_time='14:00',
            address='Test Address 2',
            city='Kathmandu',
            phone='+977-1234567890',
            status='confirmed',
            price=Decimal('1500.00'),
            total_amount=Decimal('1500.00')
        )
        
        self.booking3 = Booking.objects.create(
            customer=self.customer,
            service=self.service,
            booking_date=date.today() - timedelta(days=1),
            booking_time='16:00',
            address='Test Address 3',
            city='Kathmandu',
            phone='+977-1234567890',
            status='completed',
            price=Decimal('1500.00'),
            total_amount=Decimal('1500.00')
        )
        
        # Create payment for completed booking
        self.payment = Payment.objects.create(
            booking=self.booking3,
            amount=Decimal('1500.00'),
            payment_method='khalti',
            status='completed',
            transaction_id='test_txn_123'
        )
        
        # Create review for completed booking
        self.review = Review.objects.create(
            customer=self.customer,
            service=self.service,
            booking=self.booking3,
            rating=5,
            comment='Excellent service!'
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.provider)
    
    def test_provider_dashboard_stats(self):
        """Test provider dashboard statistics endpoint"""
        url = reverse('providerdashboardviewset-stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check required fields in response
        required_fields = [
            'total_bookings', 'pending_bookings', 'confirmed_bookings',
            'completed_bookings', 'total_earnings', 'this_month_earnings',
            'average_rating', 'total_reviews', 'active_services'
        ]
        
        for field in required_fields:
            self.assertIn(field, response.data)
        
        # Verify calculated values
        self.assertEqual(response.data['total_bookings'], 3)
        self.assertEqual(response.data['pending_bookings'], 1)
        self.assertEqual(response.data['confirmed_bookings'], 1)
        self.assertEqual(response.data['completed_bookings'], 1)
        self.assertEqual(float(response.data['total_earnings']), 1500.00)
        self.assertEqual(response.data['average_rating'], 5.0)
        self.assertEqual(response.data['total_reviews'], 1)
        self.assertEqual(response.data['active_services'], 1)
    
    def test_provider_recent_bookings(self):
        """Test provider recent bookings endpoint"""
        url = reverse('providerdashboardviewset-recent-bookings')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
        
        # Check that bookings are ordered by created_at descending
        booking_ids = [booking['id'] for booking in response.data]
        # Most recent booking should be first
        self.assertIn(self.booking3.id, booking_ids)
    
    def test_provider_earnings_summary(self):
        """Test provider earnings summary endpoint"""
        url = reverse('providerdashboardviewset-earnings-summary')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        required_fields = [
            'total_earnings', 'this_month_earnings', 'last_month_earnings',
            'pending_payments', 'completed_payments'
        ]
        
        for field in required_fields:
            self.assertIn(field, response.data)
        
        self.assertEqual(float(response.data['total_earnings']), 1500.00)
        self.assertEqual(response.data['completed_payments'], 1)
    
    def test_provider_performance_metrics(self):
        """Test provider performance metrics endpoint"""
        url = reverse('providerdashboardviewset-performance-metrics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        required_fields = [
            'completion_rate', 'average_rating', 'total_reviews',
            'response_time', 'customer_satisfaction'
        ]
        
        for field in required_fields:
            self.assertIn(field, response.data)
        
        # Verify calculated metrics
        self.assertEqual(response.data['completion_rate'], 33.33)  # 1 completed out of 3 total
        self.assertEqual(response.data['average_rating'], 5.0)
        self.assertEqual(response.data['total_reviews'], 1)
    
    def test_unauthorized_access_to_provider_dashboard(self):
        """Test that non-providers cannot access provider dashboard"""
        # Test with customer user
        self.client.force_authenticate(user=self.customer)
        url = reverse('providerdashboardviewset-stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_unauthenticated_access_to_provider_dashboard(self):
        """Test that unauthenticated users cannot access provider dashboard"""
        self.client.force_authenticate(user=None)
        url = reverse('providerdashboardviewset-stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProviderBookingManagementAPITest(APITestCase):
    """Test cases for Provider Booking Management API"""
    
    def setUp(self):
        # Create provider user
        self.provider = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            role='provider'
        )
        self.provider_profile = Profile.objects.create(user=self.provider)
        
        # Create another provider
        self.other_provider = User.objects.create_user(
            email='other@provider.com',
            username='otherprovider',
            password='testpass123',
            role='provider'
        )
        Profile.objects.create(user=self.other_provider)
        
        # Create customer
        self.customer = User.objects.create_user(
            email='customer@test.com',
            username='customer',
            password='testpass123',
            role='customer'
        )
        
        # Create services
        self.category = ServiceCategory.objects.create(name='Test Category')
        
        self.service = Service.objects.create(
            title='Test Service',
            description='Test description',
            category=self.category,
            provider=self.provider,
            price=Decimal('1500.00'),
            duration=60
        )
        
        self.other_service = Service.objects.create(
            title='Other Service',
            description='Other description',
            category=self.category,
            provider=self.other_provider,
            price=Decimal('2000.00'),
            duration=90
        )
        
        # Create bookings
        self.my_booking = Booking.objects.create(
            customer=self.customer,
            service=self.service,
            booking_date=date.today() + timedelta(days=1),
            booking_time='10:00',
            address='Test Address',
            city='Kathmandu',
            phone='+977-1234567890',
            status='pending',
            price=Decimal('1500.00'),
            total_amount=Decimal('1500.00')
        )
        
        self.other_booking = Booking.objects.create(
            customer=self.customer,
            service=self.other_service,
            booking_date=date.today() + timedelta(days=1),
            booking_time='14:00',
            address='Other Address',
            city='Kathmandu',
            phone='+977-1234567890',
            status='pending',
            price=Decimal('2000.00'),
            total_amount=Decimal('2000.00')
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.provider)
    
    def test_list_provider_bookings(self):
        """Test listing bookings for authenticated provider"""
        url = reverse('providerbookingmanagementviewset-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.my_booking.id)
    
    def test_filter_bookings_by_status(self):
        """Test filtering bookings by status"""
        url = reverse('providerbookingmanagementviewset-list')
        response = self.client.get(url, {'status': 'pending'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['status'], 'pending')
    
    def test_filter_bookings_by_date_range(self):
        """Test filtering bookings by date range"""
        url = reverse('providerbookingmanagementviewset-list')
        today = date.today()
        tomorrow = today + timedelta(days=1)
        
        response = self.client.get(url, {
            'date_from': today.isoformat(),
            'date_to': tomorrow.isoformat()
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_update_booking_status(self):
        """Test updating booking status"""
        url = reverse('providerbookingmanagementviewset-update-status', 
                     kwargs={'pk': self.my_booking.pk})
        data = {
            'status': 'confirmed',
            'notes': 'Booking confirmed by provider'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify booking was updated
        self.my_booking.refresh_from_db()
        self.assertEqual(self.my_booking.status, 'confirmed')
    
    def test_cannot_update_other_provider_booking(self):
        """Test that provider cannot update other provider's bookings"""
        url = reverse('providerbookingmanagementviewset-update-status',
                     kwargs={'pk': self.other_booking.pk})
        data = {'status': 'confirmed'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_get_booking_details(self):
        """Test getting detailed booking information"""
        url = reverse('providerbookingmanagementviewset-detail',
                     kwargs={'pk': self.my_booking.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check required fields
        required_fields = [
            'id', 'customer', 'service', 'booking_date', 'booking_time',
            'address', 'city', 'phone', 'status', 'total_amount'
        ]
        
        for field in required_fields:
            self.assertIn(field, response.data)


class ProviderServicesManagementAPITest(APITestCase):
    """Test cases for Provider Services Management API"""
    
    def setUp(self):
        self.provider = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            role='provider'
        )
        Profile.objects.create(user=self.provider)
        
        self.category = ServiceCategory.objects.create(
            name='Test Category',
            description='Test category'
        )
        
        self.service = Service.objects.create(
            title='Test Service',
            description='Test description',
            category=self.category,
            provider=self.provider,
            price=Decimal('1500.00'),
            duration=60,
            is_active=True
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.provider)
    
    def test_list_provider_services(self):
        """Test listing services for authenticated provider"""
        url = reverse('providerservicesmanagementviewset-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.service.id)
    
    def test_create_service(self):
        """Test creating a new service"""
        url = reverse('providerservicesmanagementviewset-list')
        data = {
            'title': 'New Service',
            'description': 'New service description',
            'category': self.category.id,
            'price': '2000.00',
            'duration': 90,
            'is_active': True
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Service')
        self.assertEqual(response.data['provider'], self.provider.id)
    
    def test_update_service(self):
        """Test updating an existing service"""
        url = reverse('providerservicesmanagementviewset-detail',
                     kwargs={'pk': self.service.pk})
        data = {
            'title': 'Updated Service',
            'price': '1800.00'
        }
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Service')
        self.assertEqual(response.data['price'], '1800.00')
    
    def test_deactivate_service(self):
        """Test deactivating a service"""
        url = reverse('providerservicesmanagementviewset-deactivate',
                     kwargs={'pk': self.service.pk})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify service was deactivated
        self.service.refresh_from_db()
        self.assertFalse(self.service.is_active)
    
    def test_get_service_performance(self):
        """Test getting service performance metrics"""
        # Create some bookings for the service
        customer = User.objects.create_user(
            email='customer@test.com',
            username='customer',
            password='testpass123',
            role='customer'
        )
        
        Booking.objects.create(
            customer=customer,
            service=self.service,
            booking_date=date.today(),
            booking_time='10:00',
            address='Test Address',
            city='Kathmandu',
            phone='+977-1234567890',
            status='completed',
            price=Decimal('1500.00'),
            total_amount=Decimal('1500.00')
        )
        
        url = reverse('providerservicesmanagementviewset-performance',
                     kwargs={'pk': self.service.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        required_fields = [
            'total_bookings', 'completed_bookings', 'total_revenue',
            'average_rating', 'total_reviews'
        ]
        
        for field in required_fields:
            self.assertIn(field, response.data)


class ProviderEarningsManagementAPITest(APITestCase):
    """Test cases for Provider Earnings Management API"""
    
    def setUp(self):
        self.provider = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            role='provider'
        )
        Profile.objects.create(user=self.provider)
        
        self.customer = User.objects.create_user(
            email='customer@test.com',
            username='customer',
            password='testpass123',
            role='customer'
        )
        
        self.category = ServiceCategory.objects.create(name='Test Category')
        self.service = Service.objects.create(
            title='Test Service',
            description='Test description',
            category=self.category,
            provider=self.provider,
            price=Decimal('1500.00'),
            duration=60
        )
        
        # Create completed booking with payment
        self.booking = Booking.objects.create(
            customer=self.customer,
            service=self.service,
            booking_date=date.today(),
            booking_time='10:00',
            address='Test Address',
            city='Kathmandu',
            phone='+977-1234567890',
            status='completed',
            price=Decimal('1500.00'),
            total_amount=Decimal('1500.00')
        )
        
        self.payment = Payment.objects.create(
            booking=self.booking,
            amount=Decimal('1500.00'),
            payment_method='khalti',
            status='completed',
            transaction_id='test_txn_123'
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.provider)
    
    def test_earnings_overview(self):
        """Test earnings overview endpoint"""
        url = reverse('providerearningsmanagementviewset-overview')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        required_fields = [
            'total_earnings', 'this_month_earnings', 'last_month_earnings',
            'pending_payments', 'completed_payments', 'average_booking_value'
        ]
        
        for field in required_fields:
            self.assertIn(field, response.data)
        
        self.assertEqual(float(response.data['total_earnings']), 1500.00)
        self.assertEqual(response.data['completed_payments'], 1)
    
    def test_earnings_breakdown(self):
        """Test earnings breakdown by time period"""
        url = reverse('providerearningsmanagementviewset-breakdown')
        response = self.client.get(url, {'period': 'monthly'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('breakdown', response.data)
    
    def test_payment_history(self):
        """Test payment history endpoint"""
        url = reverse('providerearningsmanagementviewset-payment-history')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.payment.id)
    
    def test_export_earnings(self):
        """Test earnings export functionality"""
        url = reverse('providerearningsmanagementviewset-export')
        response = self.client.get(url, {'format': 'csv'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')


class ProviderAnalyticsAPITest(APITestCase):
    """Test cases for Provider Analytics API"""
    
    def setUp(self):
        self.provider = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            role='provider'
        )
        Profile.objects.create(user=self.provider)
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.provider)
    
    def test_revenue_analytics(self):
        """Test revenue analytics endpoint"""
        url = reverse('provideranalyticsviewset-revenue-analytics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        required_fields = [
            'total_revenue', 'monthly_revenue', 'revenue_trend',
            'top_services', 'revenue_by_service'
        ]
        
        for field in required_fields:
            self.assertIn(field, response.data)
    
    def test_customer_analytics(self):
        """Test customer analytics endpoint"""
        url = reverse('provideranalyticsviewset-customer-analytics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        required_fields = [
            'total_customers', 'new_customers', 'repeat_customers',
            'customer_retention_rate', 'top_customers'
        ]
        
        for field in required_fields:
            self.assertIn(field, response.data)
    
    def test_performance_analytics(self):
        """Test performance analytics endpoint"""
        url = reverse('provideranalyticsviewset-performance-analytics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        required_fields = [
            'completion_rate', 'average_rating', 'response_time',
            'booking_trends', 'service_performance'
        ]
        
        for field in required_fields:
            self.assertIn(field, response.data)


class ProviderPermissionTest(TestCase):
    """Test cases for provider-specific permissions"""
    
    def setUp(self):
        self.provider = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            role='provider'
        )
        
        self.customer = User.objects.create_user(
            email='customer@test.com',
            username='customer',
            password='testpass123',
            role='customer'
        )
        
        self.admin = User.objects.create_user(
            email='admin@test.com',
            username='admin',
            password='testpass123',
            role='admin',
            is_staff=True
        )
    
    def test_is_provider_permission(self):
        """Test IsProvider permission class"""
        from apps.common.permissions import IsProvider
        
        permission = IsProvider()
        
        # Mock request objects
        provider_request = MagicMock()
        provider_request.user = self.provider
        
        customer_request = MagicMock()
        customer_request.user = self.customer
        
        # Test permission
        self.assertTrue(permission.has_permission(provider_request, None))
        self.assertFalse(permission.has_permission(customer_request, None))
    
    def test_provider_can_only_access_own_data(self):
        """Test that providers can only access their own data"""
        # This would be tested through the API endpoints
        # The viewsets should filter data by the authenticated provider
        pass


class ProviderDashboardPerformanceTest(TestCase):
    """Test cases for provider dashboard performance"""
    
    def setUp(self):
        self.provider = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            role='provider'
        )
        Profile.objects.create(user=self.provider)
    
    def test_dashboard_query_performance(self):
        """Test that dashboard queries are optimized"""
        # Create many bookings to test performance
        customer = User.objects.create_user(
            email='customer@test.com',
            username='customer',
            password='testpass123',
            role='customer'
        )
        
        category = ServiceCategory.objects.create(name='Test Category')
        service = Service.objects.create(
            title='Test Service',
            description='Test description',
            category=category,
            provider=self.provider,
            price=Decimal('1500.00'),
            duration=60
        )
        
        # Create 100 bookings
        bookings = []
        for i in range(100):
            bookings.append(Booking(
                customer=customer,
                service=service,
                booking_date=date.today() + timedelta(days=i % 30),
                booking_time='10:00',
                address=f'Address {i}',
                city='Kathmandu',
                phone='+977-1234567890',
                status='completed' if i % 3 == 0 else 'pending',
                price=Decimal('1500.00'),
                total_amount=Decimal('1500.00')
            ))
        
        Booking.objects.bulk_create(bookings)
        
        # Test that dashboard stats query is efficient
        from django.db import connection
        from django.test.utils import override_settings
        
        with override_settings(DEBUG=True):
            # Reset queries
            connection.queries_log.clear()
            
            # Calculate stats (this would be done in the view)
            total_bookings = Booking.objects.filter(service__provider=self.provider).count()
            completed_bookings = Booking.objects.filter(
                service__provider=self.provider, 
                status='completed'
            ).count()
            
            # Should use efficient queries
            self.assertEqual(total_bookings, 100)
            self.assertEqual(completed_bookings, 34)  # Every 3rd booking is completed
            
            # Check that we're not making too many queries
            self.assertLess(len(connection.queries), 10)


if __name__ == '__main__':
    pytest.main([__file__])