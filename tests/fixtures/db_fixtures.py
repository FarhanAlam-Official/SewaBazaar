"""
Database-related test fixtures
"""

import pytest
from django.contrib.auth import get_user_model
from apps.services.models import Service, ServiceCategory, City
from apps.bookings.models import Booking, PaymentMethod
from decimal import Decimal
from datetime import datetime, timedelta

User = get_user_model()

@pytest.fixture
def sample_city(db):
    """Create a sample city for testing"""
    return City.objects.create(
        name='Test City',
        is_active=True
    )

@pytest.fixture
def sample_category(db):
    """Create a sample service category for testing"""
    return ServiceCategory.objects.create(
        name='Test Category',
        description='Test category description',
        is_active=True
    )

@pytest.fixture
def sample_service(db, sample_category, sample_city):
    """Create a sample service for testing"""
    provider = User.objects.create_user(
        username='serviceprovider',
        email='provider@example.com',
        password='providerpass123',
        role='provider'
    )
    
    return Service.objects.create(
        title='Test Service',
        description='Test service description',
        category=sample_category,
        provider=provider,
        base_price=Decimal('100.00'),
        city=sample_city,
        is_active=True
    )

@pytest.fixture
def sample_booking(db, sample_service):
    """Create a sample booking for testing"""
    customer = User.objects.create_user(
        username='customer',
        email='customer@example.com',
        password='customerpass123',
        role='customer'
    )
    
    tomorrow = datetime.now().date() + timedelta(days=1)
    
    return Booking.objects.create(
        customer=customer,
        service=sample_service,
        booking_date=tomorrow,
        booking_time='10:00:00',
        total_amount=Decimal('100.00'),
        status='pending',
        customer_name='Test Customer',
        customer_phone='9876543210',
        customer_address='Test Address'
    )

@pytest.fixture
def sample_payment_method(db):
    """Create sample payment methods for testing"""
    khalti = PaymentMethod.objects.create(
        name='Khalti',
        payment_type='digital_wallet',
        is_active=True,
        processing_fee_percentage=Decimal('0.00')
    )
    
    cash = PaymentMethod.objects.create(
        name='Cash on Delivery',
        payment_type='cash',
        is_active=True,
        processing_fee_percentage=Decimal('0.00')
    )
    
    return {'khalti': khalti, 'cash': cash}
