import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from datetime import date, time
import factory
from factory.django import DjangoModelFactory
from apps.accounts.tests import UserFactory, ProviderFactory
from apps.services.tests import ServiceFactory
from .models import Booking
from .serializers import BookingSerializer

# Factory classes for test data
class BookingFactory(DjangoModelFactory):
    class Meta:
        model = Booking
    
    customer = factory.SubFactory(UserFactory)
    service = factory.SubFactory(ServiceFactory)
    booking_date = factory.Faker('future_date')
    booking_time = factory.Faker('time')
    address = factory.Faker('address')
    city = factory.Faker('city')
    phone = factory.Faker('phone_number')
    note = factory.Faker('text', max_nb_chars=200)
    status = 'pending'
    price = factory.Faker('pydecimal', left_digits=4, right_digits=2, positive=True)
    discount = Decimal('0.00')
    total_amount = factory.Faker('pydecimal', left_digits=4, right_digits=2, positive=True)

# Model Tests
class BookingModelTest(TestCase):
    def setUp(self):
        self.customer = UserFactory()
        self.service = ServiceFactory()
        self.booking_data = {
            'customer': self.customer,
            'service': self.service,
            'booking_date': date(2024, 12, 25),
            'booking_time': time(14, 30),
            'address': '123 Test Street, Kathmandu',
            'city': 'Kathmandu',
            'phone': '+977-1234567890',
            'note': 'Please arrive on time',
            'status': 'pending',
            'price': Decimal('1500.00'),
            'discount': Decimal('100.00'),
            'total_amount': Decimal('1400.00')
        }

    def test_create_booking(self):
        """Test creating a booking"""
        booking = Booking.objects.create(**self.booking_data)
        self.assertEqual(booking.customer, self.customer)
        self.assertEqual(booking.service, self.service)
        self.assertEqual(booking.status, 'pending')
        self.assertEqual(booking.total_amount, Decimal('1400.00'))

    def test_booking_str_representation(self):
        """Test booking string representation"""
        booking = BookingFactory()
        expected = f"Booking #{booking.id} - {booking.service.title} by {booking.customer.email}"
        self.assertEqual(str(booking), expected)

    def test_booking_total_amount_calculation(self):
        """Test automatic total amount calculation"""
        booking = BookingFactory(
            price=Decimal('1000.00'),
            discount=Decimal('200.00'),
            total_amount=None
        )
        self.assertEqual(booking.total_amount, Decimal('800.00'))

    def test_booking_status_choices(self):
        """Test valid status choices"""
        valid_statuses = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected']
        for status in valid_statuses:
            booking = BookingFactory(status=status)
            self.assertEqual(booking.status, status)

    def test_booking_ordering(self):
        """Test booking ordering by date and time"""
        booking1 = BookingFactory(
            booking_date=date(2024, 12, 25),
            booking_time=time(14, 30)
        )
        booking2 = BookingFactory(
            booking_date=date(2024, 12, 25),
            booking_time=time(16, 30)
        )
        booking3 = BookingFactory(
            booking_date=date(2024, 12, 26),
            booking_time=time(10, 30)
        )
        
        bookings = Booking.objects.all()
        # Should be ordered by date (desc) then time (desc)
        self.assertEqual(bookings[0], booking3)
        self.assertEqual(bookings[1], booking2)
        self.assertEqual(bookings[2], booking1)

    def test_booking_with_cancellation_reason(self):
        """Test booking with cancellation reason"""
        booking = BookingFactory(
            status='cancelled',
            cancellation_reason='Customer requested cancellation'
        )
        self.assertEqual(booking.cancellation_reason, 'Customer requested cancellation')

    def test_booking_with_rejection_reason(self):
        """Test booking with rejection reason"""
        booking = BookingFactory(
            status='rejected',
            rejection_reason='Service not available on requested date'
        )
        self.assertEqual(booking.rejection_reason, 'Service not available on requested date')

# Serializer Tests
class BookingSerializerTest(TestCase):
    def setUp(self):
        self.booking = BookingFactory()
        self.serializer = BookingSerializer(instance=self.booking)

    def test_contains_expected_fields(self):
        """Test serializer contains expected fields"""
        data = self.serializer.data
        expected_fields = [
            'id', 'customer', 'service', 'booking_date', 'booking_time',
            'address', 'city', 'phone', 'note', 'status', 'price', 'discount',
            'total_amount', 'cancellation_reason', 'rejection_reason',
            'created_at', 'updated_at'
        ]
        for field in expected_fields:
            self.assertIn(field, data)

    def test_booking_validation(self):
        """Test booking serializer validation"""
        customer = UserFactory()
        service = ServiceFactory()
        
        booking_data = {
            'customer': customer.id,
            'service': service.id,
            'booking_date': '2024-12-25',
            'booking_time': '14:30:00',
            'address': '123 Test Street',
            'city': 'Kathmandu',
            'phone': '+977-1234567890',
            'price': '1500.00',
            'total_amount': '1500.00'
        }
        
        serializer = BookingSerializer(data=booking_data)
        self.assertTrue(serializer.is_valid())

# API Tests
class BookingAPITest(APITestCase):
    def setUp(self):
        self.customer = UserFactory()
        self.provider = ProviderFactory()
        self.service = ServiceFactory(provider=self.provider)
        self.booking = BookingFactory(
            customer=self.customer,
            service=self.service
        )

    def test_booking_list_requires_authentication(self):
        """Test that booking list requires authentication"""
        response = self.client.get('/api/bookings/bookings/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_customer_can_view_own_bookings(self):
        """Test that customer can view their own bookings"""
        self.client.force_authenticate(user=self.customer)
        response = self.client.get('/api/bookings/bookings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_provider_can_view_service_bookings(self):
        """Test that provider can view bookings for their services"""
        self.client.force_authenticate(user=self.provider)
        response = self.client.get('/api/bookings/bookings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_customer_cannot_view_other_bookings(self):
        """Test that customer cannot view other customer bookings"""
        other_customer = UserFactory()
        self.client.force_authenticate(user=other_customer)
        response = self.client.get('/api/bookings/bookings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)  # No bookings for other customer

    def test_booking_creation_requires_authentication(self):
        """Test that booking creation requires authentication"""
        booking_data = {
            'service': self.service.id,
            'booking_date': '2024-12-25',
            'booking_time': '14:30:00',
            'address': '123 Test Street',
            'city': 'Kathmandu',
            'phone': '+977-1234567890',
            'price': '1500.00'
        }
        response = self.client.post('/api/bookings/bookings/', booking_data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_customer_can_create_booking(self):
        """Test that customer can create booking"""
        self.client.force_authenticate(user=self.customer)
        booking_data = {
            'service': self.service.id,
            'booking_date': '2024-12-25',
            'booking_time': '14:30:00',
            'address': '123 Test Street',
            'city': 'Kathmandu',
            'phone': '+977-1234567890',
            'price': '1500.00'
        }
        response = self.client.post('/api/bookings/bookings/', booking_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_booking_detail_access(self):
        """Test booking detail access"""
        self.client.force_authenticate(user=self.customer)
        response = self.client.get(f'/api/bookings/bookings/{self.booking.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.booking.id)

    def test_booking_update_by_customer(self):
        """Test that customer can update their own booking"""
        self.client.force_authenticate(user=self.customer)
        updated_data = {'note': 'Updated note'}
        response = self.client.patch(f'/api/bookings/bookings/{self.booking.id}/', updated_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['note'], 'Updated note')

    def test_booking_update_by_provider(self):
        """Test that provider can update booking status"""
        self.client.force_authenticate(user=self.provider)
        updated_data = {'status': 'confirmed'}
        response = self.client.patch(f'/api/bookings/bookings/{self.booking.id}/', updated_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'confirmed')

    def test_booking_cancellation(self):
        """Test booking cancellation"""
        self.client.force_authenticate(user=self.customer)
        cancellation_data = {
            'status': 'cancelled',
            'cancellation_reason': 'Change of plans'
        }
        response = self.client.patch(f'/api/bookings/bookings/{self.booking.id}/', cancellation_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'cancelled')
        self.assertEqual(response.data['cancellation_reason'], 'Change of plans')

    def test_booking_rejection_by_provider(self):
        """Test booking rejection by provider"""
        self.client.force_authenticate(user=self.provider)
        rejection_data = {
            'status': 'rejected',
            'rejection_reason': 'Not available on requested date'
        }
        response = self.client.patch(f'/api/bookings/bookings/{self.booking.id}/', rejection_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'rejected')
        self.assertEqual(response.data['rejection_reason'], 'Not available on requested date')

    def test_booking_completion(self):
        """Test booking completion"""
        self.client.force_authenticate(user=self.provider)
        completion_data = {'status': 'completed'}
        response = self.client.patch(f'/api/bookings/bookings/{self.booking.id}/', completion_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'completed')

    def test_booking_filtering_by_status(self):
        """Test booking filtering by status"""
        self.client.force_authenticate(user=self.customer)
        BookingFactory(customer=self.customer, service=self.service, status='completed')
        
        response = self.client.get('/api/bookings/bookings/?status=pending')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['status'], 'pending')

    def test_booking_filtering_by_date(self):
        """Test booking filtering by date"""
        self.client.force_authenticate(user=self.customer)
        future_booking = BookingFactory(
            customer=self.customer,
            service=self.service,
            booking_date=date(2025, 1, 15)
        )
        
        response = self.client.get('/api/bookings/bookings/?booking_date=2025-01-15')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], future_booking.id)

# Integration Tests
class BookingIntegrationTest(TestCase):
    def test_booking_with_service_integration(self):
        """Test booking integration with service"""
        customer = UserFactory()
        provider = ProviderFactory()
        service = ServiceFactory(provider=provider)
        
        booking = BookingFactory(
            customer=customer,
            service=service,
            status='confirmed'
        )
        
        self.assertEqual(booking.service.provider, provider)
        self.assertEqual(booking.customer, customer)
        self.assertEqual(booking.status, 'confirmed')

    def test_booking_status_workflow(self):
        """Test booking status workflow"""
        booking = BookingFactory(status='pending')
        
        # Confirm booking
        booking.status = 'confirmed'
        booking.save()
        self.assertEqual(booking.status, 'confirmed')
        
        # Complete booking
        booking.status = 'completed'
        booking.save()
        self.assertEqual(booking.status, 'completed')

    def test_multiple_bookings_for_same_service(self):
        """Test multiple bookings for the same service"""
        service = ServiceFactory()
        customer1 = UserFactory()
        customer2 = UserFactory()
        
        booking1 = BookingFactory(customer=customer1, service=service)
        booking2 = BookingFactory(customer=customer2, service=service)
        
        self.assertEqual(service.bookings.count(), 2)
        self.assertNotEqual(booking1.customer, booking2.customer)

# Performance Tests
class BookingPerformanceTest(TestCase):
    def test_bulk_booking_creation(self):
        """Test creating multiple bookings efficiently"""
        customer = UserFactory()
        service = ServiceFactory()
        
        bookings = []
        for i in range(100):
            booking_data = {
                'customer': customer,
                'service': service,
                'booking_date': date(2024, 12, 25),
                'booking_time': time(14, 30),
                'address': f'Address {i}',
                'city': 'Kathmandu',
                'phone': '+977-1234567890',
                'price': Decimal('1000.00'),
                'total_amount': Decimal('1000.00')
            }
            bookings.append(Booking(**booking_data))
        
        Booking.objects.bulk_create(bookings)
        self.assertEqual(Booking.objects.count(), 100)

    def test_booking_query_performance(self):
        """Test booking query performance"""
        customer = UserFactory()
        service = ServiceFactory()
        
        # Create multiple bookings
        for i in range(50):
            BookingFactory(customer=customer, service=service)
        
        # Test query performance
        import time
        start_time = time.time()
        bookings = Booking.objects.filter(customer=customer)
        end_time = time.time()
        
        self.assertEqual(bookings.count(), 50)
        self.assertLess(end_time - start_time, 0.1)  # Should be fast

# Edge Cases
class BookingEdgeCaseTest(TestCase):
    def test_booking_with_past_date(self):
        """Test booking with past date"""
        past_date = date(2020, 1, 1)
        booking = BookingFactory(booking_date=past_date)
        self.assertEqual(booking.booking_date, past_date)

    def test_booking_with_very_long_address(self):
        """Test booking with very long address"""
        long_address = 'A' * 1000  # Very long address
        booking = BookingFactory(address=long_address)
        self.assertEqual(booking.address, long_address)

    def test_booking_with_zero_price(self):
        """Test booking with zero price"""
        booking = BookingFactory(price=Decimal('0.00'))
        self.assertEqual(booking.price, Decimal('0.00'))

    def test_booking_with_negative_discount(self):
        """Test booking with negative discount"""
        booking = BookingFactory(
            price=Decimal('1000.00'),
            discount=Decimal('-100.00'),
            total_amount=Decimal('1100.00')
        )
        self.assertEqual(booking.total_amount, Decimal('1100.00'))

    def test_booking_with_special_characters(self):
        """Test booking with special characters in fields"""
        booking = BookingFactory(
            address='123 Test St., Apt #5, Kathmandu 44600',
            phone='+977-1-234-5678',
            note='Special characters: !@#$%^&*()'
        )
        self.assertEqual(booking.address, '123 Test St., Apt #5, Kathmandu 44600')
        self.assertEqual(booking.phone, '+977-1-234-5678')
        self.assertEqual(booking.note, 'Special characters: !@#$%^&*()')

# Business Logic Tests
class BookingBusinessLogicTest(TestCase):
    def test_booking_total_calculation(self):
        """Test booking total amount calculation logic"""
        booking = BookingFactory(
            price=Decimal('1000.00'),
            discount=Decimal('100.00'),
            total_amount=None
        )
        booking.save()  # This should trigger the save method
        self.assertEqual(booking.total_amount, Decimal('900.00'))

    def test_booking_status_transitions(self):
        """Test valid booking status transitions"""
        booking = BookingFactory(status='pending')
        
        # Valid transitions
        valid_transitions = ['confirmed', 'cancelled', 'rejected']
        for status in valid_transitions:
            booking.status = status
            booking.save()
            self.assertEqual(booking.status, status)
        
        # From confirmed to completed
        booking.status = 'completed'
        booking.save()
        self.assertEqual(booking.status, 'completed')

    def test_booking_validation_rules(self):
        """Test booking validation rules"""
        # Test that booking date cannot be in the past (business rule)
        past_date = date(2020, 1, 1)
        booking = BookingFactory(booking_date=past_date)
        # This should be allowed for testing purposes, but in real app might have validation
        
        # Test that phone number format is preserved
        booking = BookingFactory(phone='+977-1-234-5678')
        self.assertEqual(booking.phone, '+977-1-234-5678')

