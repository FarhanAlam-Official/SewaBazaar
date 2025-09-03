"""
PHASE 1 TESTS: Core booking system and Khalti integration tests

Purpose: Verify Phase 1 functionality works correctly
Impact: Ensures new features work while maintaining backward compatibility
"""

from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from datetime import date, time, timedelta
from unittest.mock import patch, MagicMock

from .models import Booking, PaymentMethod, BookingSlot, Payment
from .services import KhaltiPaymentService, BookingSlotService
from apps.services.models import Service, ServiceCategory

User = get_user_model()


class PaymentMethodModelTest(TestCase):
    """Test PaymentMethod model functionality"""
    
    def test_payment_method_creation(self):
        """Test creating a payment method"""
        payment_method = PaymentMethod.objects.create(
            name='Khalti',
            payment_type='digital_wallet',
            processing_fee_percentage=Decimal('2.5')
        )
        
        self.assertEqual(payment_method.name, 'Khalti')
        self.assertEqual(payment_method.payment_type, 'digital_wallet')
        self.assertEqual(payment_method.processing_fee_percentage, Decimal('2.5'))
        self.assertTrue(payment_method.is_active)
    
    def test_payment_method_str(self):
        """Test string representation"""
        payment_method = PaymentMethod.objects.create(
            name='Khalti',
            payment_type='digital_wallet'
        )
        
        self.assertEqual(str(payment_method), 'Khalti (Digital Wallet)')


class BookingSlotModelTest(TestCase):
    """Test BookingSlot model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='provider@test.com',
            password='testpass123',
            role='provider'
        )
        self.category = ServiceCategory.objects.create(
            title='Test Category',
            slug='test-category'
        )
        self.service = Service.objects.create(
            title='Test Service',
            description='Test Description',
            price=Decimal('100.00'),
            category=self.category,
            provider=self.user,
            status='active'
        )
    
    def test_booking_slot_creation(self):
        """Test creating a booking slot"""
        slot = BookingSlot.objects.create(
            service=self.service,
            date=date.today(),
            start_time=time(10, 0),
            end_time=time(11, 0),
            max_bookings=2
        )
        
        self.assertEqual(slot.service, self.service)
        self.assertFalse(slot.is_fully_booked)
        self.assertTrue(slot.is_available)
    
    def test_booking_slot_fully_booked(self):
        """Test booking slot fully booked property"""
        slot = BookingSlot.objects.create(
            service=self.service,
            date=date.today(),
            start_time=time(10, 0),
            end_time=time(11, 0),
            max_bookings=2,
            current_bookings=2
        )
        
        self.assertTrue(slot.is_fully_booked)


class BookingModelEnhancementsTest(TestCase):
    """Test enhanced Booking model with Phase 1 fields"""
    
    def setUp(self):
        self.customer = User.objects.create_user(
            email='customer@test.com',
            password='testpass123',
            role='customer'
        )
        self.provider = User.objects.create_user(
            email='provider@test.com',
            password='testpass123',
            role='provider'
        )
        self.category = ServiceCategory.objects.create(
            title='Test Category',
            slug='test-category'
        )
        self.service = Service.objects.create(
            title='Test Service',
            description='Test Description',
            price=Decimal('100.00'),
            category=self.category,
            provider=self.provider,
            status='active'
        )
    
    def test_booking_with_new_fields(self):
        """Test booking creation with new Phase 1 fields"""
        booking = Booking.objects.create(
            customer=self.customer,
            service=self.service,
            booking_date=date.today() + timedelta(days=1),
            booking_time=time(10, 0),
            address='Test Address',
            city='Test City',
            phone='1234567890',
            price=Decimal('100.00'),
            total_amount=Decimal('100.00'),
            # New Phase 1 fields
            booking_step='payment',
            special_instructions='Please call before arriving',
            preferred_provider_gender='female',
            is_recurring=True,
            recurring_frequency='weekly'
        )
        
        self.assertEqual(booking.booking_step, 'payment')
        self.assertEqual(booking.special_instructions, 'Please call before arriving')
        self.assertEqual(booking.preferred_provider_gender, 'female')
        self.assertTrue(booking.is_recurring)
        self.assertEqual(booking.recurring_frequency, 'weekly')
    
    def test_booking_default_values(self):
        """Test booking default values for new fields"""
        booking = Booking.objects.create(
            customer=self.customer,
            service=self.service,
            booking_date=date.today() + timedelta(days=1),
            booking_time=time(10, 0),
            address='Test Address',
            city='Test City',
            phone='1234567890',
            price=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        
        # Check default values
        self.assertEqual(booking.booking_step, 'completed')
        self.assertEqual(booking.preferred_provider_gender, 'any')
        self.assertFalse(booking.is_recurring)
        self.assertIsNone(booking.recurring_frequency)


class PaymentModelTest(TestCase):
    """Test Payment model functionality"""
    
    def setUp(self):
        self.customer = User.objects.create_user(
            email='customer@test.com',
            password='testpass123',
            role='customer'
        )
        self.provider = User.objects.create_user(
            email='provider@test.com',
            password='testpass123',
            role='provider'
        )
        self.category = ServiceCategory.objects.create(
            title='Test Category',
            slug='test-category'
        )
        self.service = Service.objects.create(
            title='Test Service',
            description='Test Description',
            price=Decimal('100.00'),
            category=self.category,
            provider=self.provider,
            status='active'
        )
        self.booking = Booking.objects.create(
            customer=self.customer,
            service=self.service,
            booking_date=date.today() + timedelta(days=1),
            booking_time=time(10, 0),
            address='Test Address',
            city='Test City',
            phone='1234567890',
            price=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        self.payment_method = PaymentMethod.objects.create(
            name='Khalti',
            payment_type='digital_wallet'
        )
    
    def test_payment_creation(self):
        """Test creating a payment"""
        payment = Payment.objects.create(
            booking=self.booking,
            payment_method=self.payment_method,
            amount=Decimal('100.00'),
            processing_fee=Decimal('2.50'),
            khalti_token='test_token_123'
        )
        
        self.assertEqual(payment.booking, self.booking)
        self.assertEqual(payment.payment_method, self.payment_method)
        self.assertEqual(payment.total_amount, Decimal('102.50'))
        self.assertEqual(payment.status, 'pending')
        self.assertTrue(payment.transaction_id.startswith('SB_'))
    
    def test_payment_amount_in_paisa(self):
        """Test amount conversion to paisa"""
        payment = Payment.objects.create(
            booking=self.booking,
            payment_method=self.payment_method,
            amount=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        
        self.assertEqual(payment.amount_in_paisa, 10000)


class KhaltiPaymentServiceTest(TestCase):
    """Test Khalti payment service"""
    
    def setUp(self):
        self.khalti_service = KhaltiPaymentService()
        self.customer = User.objects.create_user(
            email='customer@test.com',
            password='testpass123',
            role='customer'
        )
        self.provider = User.objects.create_user(
            email='provider@test.com',
            password='testpass123',
            role='provider'
        )
        self.category = ServiceCategory.objects.create(
            title='Test Category',
            slug='test-category'
        )
        self.service = Service.objects.create(
            title='Test Service',
            description='Test Description',
            price=Decimal('100.00'),
            category=self.category,
            provider=self.provider,
            status='active'
        )
        self.booking = Booking.objects.create(
            customer=self.customer,
            service=self.service,
            booking_date=date.today() + timedelta(days=1),
            booking_time=time(10, 0),
            address='Test Address',
            city='Test City',
            phone='1234567890',
            price=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
    
    @patch('requests.post')
    def test_verify_payment_success(self, mock_post):
        """Test successful payment verification"""
        # Mock successful Khalti response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'idx': 'khalti_txn_123',
            'amount': 10000,
            'token': 'test_token_123'
        }
        mock_post.return_value = mock_response
        
        result = self.khalti_service.verify_payment('test_token_123', 10000)
        
        self.assertTrue(result['success'])
        self.assertEqual(result['data']['idx'], 'khalti_txn_123')
    
    @patch('requests.post')
    def test_verify_payment_failure(self, mock_post):
        """Test failed payment verification"""
        # Mock failed Khalti response
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.json.return_value = {
            'detail': 'Invalid token'
        }
        mock_post.return_value = mock_response
        
        result = self.khalti_service.verify_payment('invalid_token', 10000)
        
        self.assertFalse(result['success'])
        self.assertEqual(result['error'], 'Invalid token')


class BookingSlotServiceTest(TestCase):
    """Test BookingSlot service functionality"""
    
    def setUp(self):
        self.provider = User.objects.create_user(
            email='provider@test.com',
            password='testpass123',
            role='provider'
        )
        self.category = ServiceCategory.objects.create(
            title='Test Category',
            slug='test-category'
        )
        self.service = Service.objects.create(
            title='Test Service',
            description='Test Description',
            price=Decimal('100.00'),
            category=self.category,
            provider=self.provider,
            status='active'
        )
    
    def test_get_available_slots(self):
        """Test getting available slots"""
        # Create some slots
        slot1 = BookingSlot.objects.create(
            service=self.service,
            date=date.today(),
            start_time=time(10, 0),
            end_time=time(11, 0),
            is_available=True
        )
        slot2 = BookingSlot.objects.create(
            service=self.service,
            date=date.today(),
            start_time=time(11, 0),
            end_time=time(12, 0),
            is_available=False
        )
        
        available_slots = BookingSlotService.get_available_slots(self.service, date.today())
        
        self.assertEqual(available_slots.count(), 1)
        self.assertEqual(available_slots.first(), slot1)
    
    def test_create_default_slots(self):
        """Test creating default slots"""
        created_slots = BookingSlotService.create_default_slots(
            self.service, 
            date.today(),
            start_hour=9,
            end_hour=12,
            slot_duration=1
        )
        
        self.assertEqual(len(created_slots), 3)  # 9-10, 10-11, 11-12
        
        # Verify slots were created in database
        slots_in_db = BookingSlot.objects.filter(
            service=self.service,
            date=date.today()
        ).count()
        self.assertEqual(slots_in_db, 3)


class BookingAPITest(APITestCase):
    """Test booking API endpoints"""
    
    def setUp(self):
        self.customer = User.objects.create_user(
            email='customer@test.com',
            password='testpass123',
            role='customer'
        )
        self.provider = User.objects.create_user(
            email='provider@test.com',
            password='testpass123',
            role='provider'
        )
        self.category = ServiceCategory.objects.create(
            title='Test Category',
            slug='test-category'
        )
        self.service = Service.objects.create(
            title='Test Service',
            description='Test Description',
            price=Decimal('100.00'),
            category=self.category,
            provider=self.provider,
            status='active'
        )
        
        # Authenticate as customer
        self.client.force_authenticate(user=self.customer)
    
    def test_payment_methods_endpoint(self):
        """Test payment methods API endpoint"""
        # Create a payment method
        PaymentMethod.objects.create(
            name='Khalti',
            payment_type='digital_wallet',
            is_active=True
        )
        
        response = self.client.get('/api/bookings/payment-methods/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Khalti')
    
    def test_available_slots_endpoint(self):
        """Test available slots API endpoint"""
        # Create a booking slot
        BookingSlot.objects.create(
            service=self.service,
            date=date.today(),
            start_time=time(10, 0),
            end_time=time(11, 0),
            is_available=True
        )
        
        response = self.client.get(
            f'/api/bookings/booking-slots/available-slots/?service_id={self.service.id}&date={date.today()}'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_booking_analytics_endpoint(self):
        """Test booking analytics endpoint"""
        # Create a booking
        Booking.objects.create(
            customer=self.customer,
            service=self.service,
            booking_date=date.today() + timedelta(days=1),
            booking_time=time(10, 0),
            address='Test Address',
            city='Test City',
            phone='1234567890',
            price=Decimal('100.00'),
            total_amount=Decimal('100.00'),
            status='completed'
        )
        
        response = self.client.get('/api/bookings/bookings/booking-analytics/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_bookings'], 1)
        self.assertEqual(response.data['completed_bookings'], 1)


class BackwardCompatibilityTest(TestCase):
    """Test that existing functionality still works"""
    
    def setUp(self):
        self.customer = User.objects.create_user(
            email='customer@test.com',
            password='testpass123',
            role='customer'
        )
        self.provider = User.objects.create_user(
            email='provider@test.com',
            password='testpass123',
            role='provider'
        )
        self.category = ServiceCategory.objects.create(
            title='Test Category',
            slug='test-category'
        )
        self.service = Service.objects.create(
            title='Test Service',
            description='Test Description',
            price=Decimal('100.00'),
            category=self.category,
            provider=self.provider,
            status='active'
        )
    
    def test_existing_booking_creation_still_works(self):
        """Test that existing booking creation process still works"""
        booking = Booking.objects.create(
            customer=self.customer,
            service=self.service,
            booking_date=date.today() + timedelta(days=1),
            booking_time=time(10, 0),
            address='Test Address',
            city='Test City',
            phone='1234567890',
            price=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        
        # Verify booking was created successfully
        self.assertEqual(booking.customer, self.customer)
        self.assertEqual(booking.service, self.service)
        self.assertEqual(booking.status, 'pending')
        
        # Verify new fields have default values
        self.assertEqual(booking.booking_step, 'completed')
        self.assertEqual(booking.preferred_provider_gender, 'any')
        self.assertFalse(booking.is_recurring)
    
    def test_existing_booking_str_method(self):
        """Test that existing booking string method still works"""
        booking = Booking.objects.create(
            customer=self.customer,
            service=self.service,
            booking_date=date.today() + timedelta(days=1),
            booking_time=time(10, 0),
            address='Test Address',
            city='Test City',
            phone='1234567890',
            price=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        
        expected_str = f"Booking #{booking.id} - {self.service.title} by {self.customer.email}"
        self.assertEqual(str(booking), expected_str)