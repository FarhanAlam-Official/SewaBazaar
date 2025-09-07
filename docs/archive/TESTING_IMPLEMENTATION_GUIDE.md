# Testing Implementation Guide - Phase 1 & 2

## Overview

This document provides comprehensive testing procedures for Phase 1 and Phase 2 implementations, ensuring backward compatibility and system reliability.

## Testing Strategy

### 1. Pre-Implementation Testing

Before starting any implementation, establish baseline tests to ensure existing functionality works correctly.

#### 1.1 Baseline Test Suite

```bash
# Backend baseline tests
cd backend
python manage.py test --verbosity=2 --keepdb

# Frontend baseline tests
cd frontend
npm test -- --coverage --watchAll=false

# End-to-end baseline tests
npm run test:e2e:baseline
```

#### 1.2 Performance Baseline

```bash
# API performance baseline
python manage.py test_performance --baseline

# Frontend performance baseline
npm run lighthouse:baseline
```

### 2. Phase 1 Testing: Core Booking System

#### 2.1 Unit Tests

##### Backend Unit Tests

```python
# tests/test_booking_models.py
import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.bookings.models import Booking, PaymentMethod, BookingSlot, Payment
from apps.services.models import Service, ServiceCategory

User = get_user_model()

class TestBookingExtensions(TestCase):
    """
    Test new booking model functionality while ensuring existing functionality works
    
    Purpose: Verify backward compatibility and new features
    Impact: Critical for ensuring no regression in existing booking system
    """
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            role='customer'
        )
        self.provider = User.objects.create_user(
            email='provider@example.com',
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
            price=100.00,
            category=self.category,
            provider=self.provider,
            status='active'
        )
    
    def test_existing_booking_creation(self):
        """
        Test that existing booking creation still works without new fields
        
        Purpose: Ensure backward compatibility
        Expected: Booking created successfully with default values for new fields
        """
        booking = Booking.objects.create(
            customer=self.user,
            service=self.service,
            booking_date='2024-02-01',
            booking_time='10:00:00',
            address='Test Address',
            city='Test City',
            phone='1234567890',
            price=100.00,
            total_amount=100.00
        )
        
        # Verify existing functionality
        self.assertEqual(booking.customer, self.user)
        self.assertEqual(booking.service, self.service)
        self.assertEqual(booking.status, 'pending')
        
        # Verify new fields have default values
        self.assertEqual(booking.booking_step, 'completed')
        self.assertEqual(booking.preferred_provider_gender, 'any')
        self.assertFalse(booking.is_recurring)
        self.assertIsNone(booking.booking_slot)
    
    def test_new_booking_fields(self):
        """
        Test new booking fields functionality
        
        Purpose: Verify new fields work correctly
        Expected: New fields can be set and retrieved properly
        """
        booking = Booking.objects.create(
            customer=self.user,
            service=self.service,
            booking_date='2024-02-01',
            booking_time='10:00:00',
            address='Test Address',
            city='Test City',
            phone='1234567890',
            price=100.00,
            total_amount=100.00,
            # New fields
            booking_step='payment',
            special_instructions='Please call before arriving',
            preferred_provider_gender='female',
            is_recurring=True,
            recurring_frequency='weekly'
        )
        
        # Verify new fields
        self.assertEqual(booking.booking_step, 'payment')
        self.assertEqual(booking.special_instructions, 'Please call before arriving')
        self.assertEqual(booking.preferred_provider_gender, 'female')
        self.assertTrue(booking.is_recurring)
        self.assertEqual(booking.recurring_frequency, 'weekly')
    
    def test_payment_method_model(self):
        """
        Test PaymentMethod model functionality
        
        Purpose: Verify payment method management
        Expected: Payment methods can be created and managed
        """
        payment_method = PaymentMethod.objects.create(
            name='Credit Card',
            payment_type='card',
            processing_fee_percentage=2.5
        )
        
        self.assertEqual(payment_method.name, 'Credit Card')
        self.assertEqual(payment_method.payment_type, 'card')
        self.assertEqual(payment_method.processing_fee_percentage, 2.5)
        self.assertTrue(payment_method.is_active)
    
    def test_booking_slot_model(self):
        """
        Test BookingSlot model functionality
        
        Purpose: Verify booking slot management
        Expected: Booking slots can be created and availability managed
        """
        booking_slot = BookingSlot.objects.create(
            service=self.service,
            date='2024-02-01',
            start_time='10:00:00',
            end_time='11:00:00',
            max_bookings=2
        )
        
        self.assertEqual(booking_slot.service, self.service)
        self.assertFalse(booking_slot.is_fully_booked)
        
        # Test booking slot availability
        booking_slot.current_bookings = 2
        booking_slot.save()
        self.assertTrue(booking_slot.is_fully_booked)
    
    def test_payment_model(self):
        """
        Test Payment model functionality
        
        Purpose: Verify payment tracking
        Expected: Payments can be created and tracked
        """
        booking = Booking.objects.create(
            customer=self.user,
            service=self.service,
            booking_date='2024-02-01',
            booking_time='10:00:00',
            address='Test Address',
            city='Test City',
            phone='1234567890',
            price=100.00,
            total_amount=100.00
        )
        
        payment_method = PaymentMethod.objects.create(
            name='Credit Card',
            payment_type='card'
        )
        
        payment = Payment.objects.create(
            booking=booking,
            payment_method=payment_method,
            amount=100.00,
            processing_fee=2.50,
            transaction_id='txn_123456'
        )
        
        self.assertEqual(payment.booking, booking)
        self.assertEqual(payment.total_amount, 102.50)
        self.assertEqual(payment.status, 'pending')

class TestBookingAPIExtensions(TestCase):
    """
    Test booking API extensions while ensuring existing endpoints work
    
    Purpose: Verify API backward compatibility and new functionality
    Impact: Critical for ensuring existing integrations continue to work
    """
    
    def setUp(self):
        """Set up test data and client"""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            role='customer'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_existing_booking_api_endpoints(self):
        """
        Test that existing booking API endpoints still work
        
        Purpose: Ensure backward compatibility
        Expected: All existing endpoints return expected responses
        """
        # Test existing booking list endpoint
        response = self.client.get('/api/bookings/')
        self.assertEqual(response.status_code, 200)
        
        # Test existing booking creation
        booking_data = {
            'service': self.service.id,
            'booking_date': '2024-02-01',
            'booking_time': '10:00:00',
            'address': 'Test Address',
            'city': 'Test City',
            'phone': '1234567890'
        }
        response = self.client.post('/api/bookings/', booking_data)
        self.assertEqual(response.status_code, 201)
    
    def test_new_booking_wizard_endpoints(self):
        """
        Test new booking wizard API endpoints
        
        Purpose: Verify new API functionality
        Expected: New endpoints work correctly
        """
        # Test available slots endpoint
        response = self.client.get(
            f'/api/bookings/wizard/available-slots/?service_id={self.service.id}&date=2024-02-01'
        )
        self.assertEqual(response.status_code, 200)
        
        # Test price calculation endpoint
        price_data = {
            'service_id': self.service.id,
            'date': '2024-02-01',
            'time': '10:00'
        }
        response = self.client.post('/api/bookings/wizard/calculate-price/', price_data)
        self.assertEqual(response.status_code, 200)
```

##### Frontend Unit Tests

```typescript
// __tests__/components/BookingWizard.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { ExistingBookingForm } from '@/components/booking/ExistingBookingForm';

// Mock the existing booking form
jest.mock('@/components/booking/ExistingBookingForm', () => ({
  ExistingBookingForm: jest.fn(() => <div data-testid="existing-booking-form">Existing Booking Form</div>)
}));

describe('BookingWizard', () => {
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fallback to existing booking form when flag is set', () => {
    /**
     * Test backward compatibility fallback
     * 
     * Purpose: Ensure existing booking flow remains available
     * Expected: Existing booking form is rendered when fallback flag is true
     */
    render(
      <BookingWizard
        serviceId="1"
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
        fallbackToOldFlow={true}
      />
    );

    expect(screen.getByTestId('existing-booking-form')).toBeInTheDocument();
    expect(ExistingBookingForm).toHaveBeenCalled();
  });

  it('should render new booking wizard by default', () => {
    /**
     * Test new booking wizard functionality
     * 
     * Purpose: Verify new booking wizard renders correctly
     * Expected: New wizard interface is displayed
     */
    render(
      <BookingWizard
        serviceId="1"
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByTestId('booking-wizard')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
  });

  it('should handle multi-step booking process', async () => {
    /**
     * Test multi-step booking flow
     * 
     * Purpose: Verify step-by-step booking process
     * Expected: User can navigate through all booking steps
     */
    render(
      <BookingWizard
        serviceId="1"
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // Step 1: Service Selection
    expect(screen.getByText('Select Service Options')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Next'));

    // Step 2: Date & Time Selection
    await waitFor(() => {
      expect(screen.getByText('Choose Date & Time')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Next'));

    // Continue through all steps...
  });

  it('should validate each step before proceeding', async () => {
    /**
     * Test step validation
     * 
     * Purpose: Ensure proper validation at each step
     * Expected: User cannot proceed without completing required fields
     */
    render(
      <BookingWizard
        serviceId="1"
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // Try to proceed without selecting options
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Please select service options')).toBeInTheDocument();
    });

    // Verify we're still on step 1
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
  });
});

// __tests__/components/PaymentForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentForm } from '@/components/booking/PaymentForm';

describe('PaymentForm', () => {
  const mockBooking = {
    id: 1,
    total_amount: 100.00,
    service: { title: 'Test Service' }
  };

  const mockPaymentMethods = [
    { id: 1, name: 'Credit Card', payment_type: 'card' },
    { id: 2, name: 'Cash on Service', payment_type: 'cash' }
  ];

  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  it('should render payment methods correctly', () => {
    /**
     * Test payment method display
     * 
     * Purpose: Verify payment methods are displayed correctly
     * Expected: All available payment methods are shown
     */
    render(
      <PaymentForm
        booking={mockBooking}
        paymentMethods={mockPaymentMethods}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('Credit Card')).toBeInTheDocument();
    expect(screen.getByText('Cash on Service')).toBeInTheDocument();
  });

  it('should handle payment processing', async () => {
    /**
     * Test payment processing
     * 
     * Purpose: Verify payment can be processed
     * Expected: Payment processing is initiated correctly
     */
    render(
      <PaymentForm
        booking={mockBooking}
        paymentMethods={mockPaymentMethods}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    // Select payment method
    fireEvent.click(screen.getByText('Credit Card'));

    // Fill payment details
    fireEvent.change(screen.getByLabelText('Card Number'), {
      target: { value: '4111111111111111' }
    });

    // Submit payment
    fireEvent.click(screen.getByText('Pay Now'));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
```

#### 2.2 Integration Tests

```python
# tests/test_booking_integration.py
from django.test import TestCase, TransactionTestCase
from django.db import transaction
from rest_framework.test import APITestCase
from apps.bookings.models import Booking, Payment, PaymentMethod

class TestBookingPaymentIntegration(TransactionTestCase):
    """
    Test integration between booking and payment systems
    
    Purpose: Verify booking and payment systems work together correctly
    Impact: Critical for ensuring complete booking flow works
    """
    
    def test_complete_booking_flow_with_payment(self):
        """
        Test complete booking flow from creation to payment
        
        Purpose: Verify end-to-end booking process
        Expected: Booking can be created and payment processed successfully
        """
        # Create booking
        booking = self.create_test_booking()
        self.assertEqual(booking.status, 'pending')
        
        # Process payment
        payment = self.process_payment(booking)
        self.assertEqual(payment.status, 'completed')
        
        # Verify booking status updated
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'confirmed')
    
    def test_booking_slot_availability_integration(self):
        """
        Test booking slot availability with actual bookings
        
        Purpose: Verify slot management works with real bookings
        Expected: Slots are properly managed when bookings are created
        """
        # Create booking slot
        slot = self.create_booking_slot(max_bookings=2)
        
        # Create first booking
        booking1 = self.create_booking_with_slot(slot)
        slot.refresh_from_db()
        self.assertEqual(slot.current_bookings, 1)
        
        # Create second booking
        booking2 = self.create_booking_with_slot(slot)
        slot.refresh_from_db()
        self.assertEqual(slot.current_bookings, 2)
        self.assertTrue(slot.is_fully_booked)
        
        # Try to create third booking (should fail)
        with self.assertRaises(ValidationError):
            self.create_booking_with_slot(slot)
```

#### 2.3 End-to-End Tests

```typescript
// e2e/booking-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test('should complete booking using existing flow', async ({ page }) => {
    /**
     * Test existing booking flow still works
     * 
     * Purpose: Ensure backward compatibility for existing users
     * Expected: Complete booking process works as before
     */
    
    // Navigate to service page
    await page.goto('/services/1');
    
    // Click existing "Book Now" button
    await page.click('[data-testid="book-now-button"]');
    
    // Fill booking form (existing flow)
    await page.fill('[name="booking_date"]', '2024-02-01');
    await page.fill('[name="booking_time"]', '10:00');
    await page.fill('[name="address"]', 'Test Address');
    await page.fill('[name="phone"]', '1234567890');
    
    // Submit booking
    await page.click('[data-testid="submit-booking"]');
    
    // Verify booking confirmation
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
  });

  test('should complete booking using new wizard', async ({ page }) => {
    /**
     * Test new booking wizard flow
     * 
     * Purpose: Verify new booking wizard works correctly
     * Expected: Complete booking process through wizard
     */
    
    // Enable new booking flow
    await page.addInitScript(() => {
      window.localStorage.setItem('useNewBookingFlow', 'true');
    });
    
    // Navigate to service page
    await page.goto('/services/1');
    
    // Click "Book Now" button (should open wizard)
    await page.click('[data-testid="book-now-button"]');
    
    // Step 1: Service Selection
    await expect(page.locator('[data-testid="booking-wizard"]')).toBeVisible();
    await expect(page.locator('text=Step 1 of 5')).toBeVisible();
    await page.click('[data-testid="next-step"]');
    
    // Step 2: Date & Time Selection
    await expect(page.locator('text=Step 2 of 5')).toBeVisible();
    await page.click('[data-testid="date-2024-02-01"]');
    await page.click('[data-testid="time-10-00"]');
    await page.click('[data-testid="next-step"]');
    
    // Step 3: Details Input
    await expect(page.locator('text=Step 3 of 5')).toBeVisible();
    await page.fill('[name="address"]', 'Test Address');
    await page.fill('[name="phone"]', '1234567890');
    await page.click('[data-testid="next-step"]');
    
    // Step 4: Payment
    await expect(page.locator('text=Step 4 of 5')).toBeVisible();
    await page.click('[data-testid="payment-method-cash"]');
    await page.click('[data-testid="next-step"]');
    
    // Step 5: Confirmation
    await expect(page.locator('text=Step 5 of 5')).toBeVisible();
    await page.click('[data-testid="confirm-booking"]');
    
    // Verify booking completion
    await expect(page.locator('[data-testid="booking-success"]')).toBeVisible();
  });

  test('should handle payment processing', async ({ page }) => {
    /**
     * Test payment processing integration
     * 
     * Purpose: Verify payment system works correctly
     * Expected: Payment can be processed successfully
     */
    
    // Complete booking flow up to payment step
    await page.goto('/booking/payment/1');
    
    // Select credit card payment
    await page.click('[data-testid="payment-method-card"]');
    
    // Fill payment details
    await page.fill('[name="card_number"]', '4111111111111111');
    await page.fill('[name="expiry_month"]', '12');
    await page.fill('[name="expiry_year"]', '2025');
    await page.fill('[name="cvv"]', '123');
    
    // Process payment
    await page.click('[data-testid="process-payment"]');
    
    // Verify payment success
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
  });
});
```

### 3. Phase 2 Testing: Provider Profiles & Discovery

#### 3.1 Unit Tests

```python
# tests/test_provider_models.py
class TestProviderExtensions(TestCase):
    """
    Test new provider model functionality while ensuring existing functionality works
    
    Purpose: Verify provider enhancements don't break existing features
    Impact: Critical for provider management system
    """
    
    def test_existing_profile_functionality(self):
        """
        Test that existing profile functionality still works
        
        Purpose: Ensure backward compatibility
        Expected: All existing profile features work as before
        """
        profile = Profile.objects.create(
            user=self.provider,
            bio='Test bio',
            company_name='Test Company',
            is_approved=True
        )
        
        # Verify existing functionality
        self.assertEqual(profile.user, self.provider)
        self.assertEqual(profile.bio, 'Test bio')
        self.assertTrue(profile.is_approved)
        
        # Verify new fields have default values
        self.assertIsNone(profile.years_of_experience)
        self.assertEqual(profile.preferred_contact_method, 'phone')
    
    def test_provider_portfolio_functionality(self):
        """
        Test new provider portfolio features
        
        Purpose: Verify portfolio management works correctly
        Expected: Portfolio images can be managed properly
        """
        # Create portfolio image
        portfolio_image = ProviderImage.objects.create(
            provider=self.provider,
            title='Test Work',
            description='Test description',
            service_category=self.category
        )
        
        self.assertEqual(portfolio_image.provider, self.provider)
        self.assertEqual(portfolio_image.title, 'Test Work')
        self.assertFalse(portfolio_image.is_featured)
    
    def test_provider_stats_calculation(self):
        """
        Test provider statistics calculation
        
        Purpose: Verify stats are calculated correctly
        Expected: Provider stats reflect actual performance
        """
        # Create provider stats
        stats = ProviderStats.objects.create(
            provider=self.provider,
            total_bookings=10,
            completed_bookings=8,
            cancelled_bookings=2
        )
        
        # Test completion rate calculation
        self.assertEqual(stats.completion_rate, 80.0)
```

#### 3.2 Search Testing

```python
# tests/test_search_functionality.py
class TestSearchEnhancements(TestCase):
    """
    Test enhanced search functionality while ensuring existing search works
    
    Purpose: Verify search improvements don't break existing search
    Impact: Critical for service discovery
    """
    
    def test_existing_search_functionality(self):
        """
        Test that existing search still works
        
        Purpose: Ensure backward compatibility
        Expected: Existing search returns expected results
        """
        # Test basic search
        response = self.client.get('/api/services/?search=cleaning')
        self.assertEqual(response.status_code, 200)
        
        # Test category filter
        response = self.client.get(f'/api/services/?category={self.category.id}')
        self.assertEqual(response.status_code, 200)
    
    def test_advanced_search_functionality(self):
        """
        Test new advanced search features
        
        Purpose: Verify advanced search works correctly
        Expected: Advanced filters return accurate results
        """
        # Test advanced search with multiple filters
        response = self.client.get(
            '/api/services/search/advanced/?'
            'q=cleaning&category=1&min_price=50&max_price=200&rating=4'
        )
        self.assertEqual(response.status_code, 200)
        
        # Verify search tracking
        self.assertTrue(SearchQuery.objects.filter(query_text='cleaning').exists())
```

### 4. Regression Testing

#### 4.1 Automated Regression Tests

```python
# tests/test_regression.py
class RegressionTestSuite(TestCase):
    """
    Comprehensive regression test suite
    
    Purpose: Ensure no existing functionality is broken
    Impact: Critical for maintaining system stability
    """
    
    def test_user_authentication_regression(self):
        """Test user authentication still works"""
        # Test login
        response = self.client.post('/api/auth/login/', {
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, 200)
    
    def test_service_crud_regression(self):
        """Test service CRUD operations still work"""
        # Test service creation
        service_data = {
            'title': 'Test Service',
            'description': 'Test Description',
            'price': 100.00,
            'category': self.category.id
        }
        response = self.client.post('/api/services/', service_data)
        self.assertEqual(response.status_code, 201)
    
    def test_booking_crud_regression(self):
        """Test booking CRUD operations still work"""
        # Test booking creation with existing API
        booking_data = {
            'service': self.service.id,
            'booking_date': '2024-02-01',
            'booking_time': '10:00:00',
            'address': 'Test Address',
            'city': 'Test City',
            'phone': '1234567890'
        }
        response = self.client.post('/api/bookings/', booking_data)
        self.assertEqual(response.status_code, 201)
```

### 5. Performance Testing

#### 5.1 Load Testing

```python
# tests/test_performance.py
import time
from django.test import TestCase
from django.test.utils import override_settings

class PerformanceTestSuite(TestCase):
    """
    Performance testing for new features
    
    Purpose: Ensure new features don't degrade performance
    Impact: Critical for user experience
    """
    
    def test_search_performance(self):
        """Test search performance with large dataset"""
        # Create large dataset
        self.create_large_service_dataset(1000)
        
        # Test search performance
        start_time = time.time()
        response = self.client.get('/api/services/search/advanced/?q=test')
        end_time = time.time()
        
        # Verify response time is acceptable
        self.assertLess(end_time - start_time, 2.0)  # Less than 2 seconds
        self.assertEqual(response.status_code, 200)
    
    def test_booking_wizard_performance(self):
        """Test booking wizard performance"""
        start_time = time.time()
        response = self.client.get('/api/bookings/wizard/available-slots/?service_id=1&date=2024-02-01')
        end_time = time.time()
        
        # Verify response time is acceptable
        self.assertLess(end_time - start_time, 1.0)  # Less than 1 second
        self.assertEqual(response.status_code, 200)
```

### 6. Security Testing

#### 6.1 Security Test Suite

```python
# tests/test_security.py
class SecurityTestSuite(TestCase):
    """
    Security testing for new features
    
    Purpose: Ensure new features are secure
    Impact: Critical for data protection
    """
    
    def test_payment_data_security(self):
        """Test payment data is handled securely"""
        # Test payment data encryption
        payment_data = {
            'card_number': '4111111111111111',
            'cvv': '123'
        }
        
        # Verify sensitive data is not stored in plain text
        response = self.client.post('/api/payments/process/', payment_data)
        
        # Check database doesn't contain plain text card data
        payment = Payment.objects.first()
        self.assertNotIn('4111111111111111', str(payment.gateway_response))
    
    def test_booking_authorization(self):
        """Test booking authorization is enforced"""
        # Test unauthorized access to booking wizard
        self.client.logout()
        response = self.client.post('/api/bookings/wizard/create-step/', {})
        self.assertEqual(response.status_code, 401)
```

### 7. Migration Testing

#### 7.1 Migration Test Suite

```python
# tests/test_migrations.py
from django_migration_testcase import MigrationTest

class TestMigrations(MigrationTest):
    """
    Test database migrations
    
    Purpose: Ensure migrations work correctly and are reversible
    Impact: Critical for deployment safety
    """
    
    migrate_from = '0001_initial'
    migrate_to = '0004_add_provider_enhancements'
    
    def setUpBeforeMigration(self, apps):
        """Set up data before migration"""
        User = apps.get_model('accounts', 'User')
        Booking = apps.get_model('bookings', 'Booking')
        
        # Create test data with old schema
        user = User.objects.create(email='test@example.com')
        booking = Booking.objects.create(
            customer=user,
            booking_date='2024-02-01',
            booking_time='10:00:00',
            price=100.00,
            total_amount=100.00
        )
        
        self.user_id = user.id
        self.booking_id = booking.id
    
    def test_migration_preserves_data(self):
        """Test that migration preserves existing data"""
        User = self.apps.get_model('accounts', 'User')
        Booking = self.apps.get_model('bookings', 'Booking')
        
        # Verify existing data is preserved
        user = User.objects.get(id=self.user_id)
        booking = Booking.objects.get(id=self.booking_id)
        
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(booking.price, 100.00)
        
        # Verify new fields have default values
        self.assertEqual(booking.booking_step, 'completed')
        self.assertEqual(booking.preferred_provider_gender, 'any')
```

### 8. Browser Compatibility Testing

#### 8.1 Cross-Browser Tests

```typescript
// e2e/browser-compatibility.spec.ts
import { test, devices } from '@playwright/test';

const browsers = ['chromium', 'firefox', 'webkit'];
const devices_list = [
  devices['Desktop Chrome'],
  devices['Desktop Firefox'],
  devices['Desktop Safari'],
  devices['iPhone 12'],
  devices['iPad Pro']
];

browsers.forEach(browserName => {
  test.describe(`${browserName} compatibility`, () => {
    test('booking wizard works across browsers', async ({ page }) => {
      /**
       * Test booking wizard browser compatibility
       * 
       * Purpose: Ensure new features work across all supported browsers
       * Expected: Booking wizard functions correctly in all browsers
       */
      
      await page.goto('/services/1');
      await page.click('[data-testid="book-now-button"]');
      
      // Test wizard functionality
      await expect(page.locator('[data-testid="booking-wizard"]')).toBeVisible();
      
      // Test step navigation
      await page.click('[data-testid="next-step"]');
      await expect(page.locator('text=Step 2 of 5')).toBeVisible();
    });
  });
});
```

### 9. Accessibility Testing

#### 9.1 A11y Test Suite

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Tests', () => {
  test('booking wizard is accessible', async ({ page }) => {
    /**
     * Test booking wizard accessibility
     * 
     * Purpose: Ensure new features are accessible to all users
     * Expected: No accessibility violations
     */
    
    await page.goto('/services/1');
    await injectAxe(page);
    
    // Open booking wizard
    await page.click('[data-testid="book-now-button"]');
    
    // Check accessibility
    await checkA11y(page, '[data-testid="booking-wizard"]', {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });
});
```

### 10. Test Execution Strategy

#### 10.1 Test Execution Order

```bash
#!/bin/bash
# test-execution.sh

echo "Starting comprehensive test suite..."

# 1. Pre-implementation baseline tests
echo "Running baseline tests..."
npm run test:baseline
python manage.py test --tag=baseline

# 2. Unit tests
echo "Running unit tests..."
npm test -- --coverage
python manage.py test --tag=unit

# 3. Integration tests
echo "Running integration tests..."
python manage.py test --tag=integration

# 4. End-to-end tests
echo "Running E2E tests..."
npm run test:e2e

# 5. Performance tests
echo "Running performance tests..."
python manage.py test --tag=performance

# 6. Security tests
echo "Running security tests..."
python manage.py test --tag=security

# 7. Migration tests
echo "Running migration tests..."
python manage.py test --tag=migration

# 8. Regression tests
echo "Running regression tests..."
python manage.py test --tag=regression

echo "All tests completed!"
```

#### 10.2 Continuous Integration

```yaml
# .github/workflows/test-implementation.yml
name: Implementation Testing

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: 3.9
    
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: |
        pip install -r backend/requirements.txt
        npm install --prefix frontend
    
    - name: Run backend tests
      run: |
        cd backend
        python manage.py test --verbosity=2
    
    - name: Run frontend tests
      run: |
        cd frontend
        npm test -- --coverage --watchAll=false
    
    - name: Run E2E tests
      run: |
        cd frontend
        npm run test:e2e:ci
```

This comprehensive testing guide ensures that both Phase 1 and Phase 2 implementations maintain backward compatibility while adding new functionality reliably and securely.
