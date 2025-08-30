# Phase 1: Core Booking System - Technical Specifications

## Overview
This document provides detailed technical specifications for implementing the core booking system while maintaining backward compatibility with existing functionality.

## 1. Database Schema Extensions

### 1.1 New Models

#### PaymentMethod Model
```python
# apps/bookings/models.py
class PaymentMethod(models.Model):
    """
    Stores available payment methods for the platform
    
    Purpose: Centralize payment method management and support multiple payment gateways
    Impact: New model - no impact on existing functionality
    """
    PAYMENT_TYPE_CHOICES = (
        ('card', 'Credit/Debit Card'),
        ('digital_wallet', 'Digital Wallet'),
        ('bank_transfer', 'Bank Transfer'),
        ('cash', 'Cash on Service'),
    )
    
    name = models.CharField(max_length=100)  # e.g., "Visa", "PayPal", "eSewa"
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES)
    is_active = models.BooleanField(default=True)
    processing_fee_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    icon = models.CharField(max_length=100, blank=True, null=True)  # Icon class or URL
    gateway_config = models.JSONField(default=dict, blank=True)  # Gateway-specific configuration
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_payment_type_display()})"
    
    class Meta:
        ordering = ['payment_type', 'name']
        verbose_name = 'Payment Method'
        verbose_name_plural = 'Payment Methods'
```

#### BookingSlot Model
```python
# apps/bookings/models.py
class BookingSlot(models.Model):
    """
    Manages time slot availability for services
    
    Purpose: Provide granular control over booking availability and prevent double bookings
    Impact: New model - enhances existing booking system without breaking changes
    """
    service = models.ForeignKey('services.Service', on_delete=models.CASCADE, related_name='booking_slots')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    max_bookings = models.PositiveIntegerField(default=1)  # For group services
    current_bookings = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.service.title} - {self.date} ({self.start_time}-{self.end_time})"
    
    @property
    def is_fully_booked(self):
        return self.current_bookings >= self.max_bookings
    
    class Meta:
        ordering = ['date', 'start_time']
        unique_together = ['service', 'date', 'start_time', 'end_time']
        verbose_name = 'Booking Slot'
        verbose_name_plural = 'Booking Slots'
```

#### Payment Model
```python
# apps/bookings/models.py
class Payment(models.Model):
    """
    Tracks payment transactions for bookings
    
    Purpose: Maintain payment history and transaction tracking
    Impact: New model - adds payment functionality without affecting existing bookings
    """
    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('partially_refunded', 'Partially Refunded'),
    )
    
    booking = models.OneToOneField('Booking', on_delete=models.CASCADE, related_name='payment')
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.PROTECT)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    processing_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    transaction_id = models.CharField(max_length=100, unique=True)
    gateway_transaction_id = models.CharField(max_length=100, blank=True, null=True)
    gateway_response = models.JSONField(default=dict, blank=True)
    
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    paid_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Payment #{self.transaction_id} - {self.booking}"
    
    def save(self, *args, **kwargs):
        if not self.total_amount:
            self.total_amount = self.amount + self.processing_fee
        super().save(*args, **kwargs)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
```

### 1.2 Existing Model Extensions

#### Extended Booking Model
```python
# apps/bookings/models.py - Extensions to existing Booking model
class Booking(models.Model):
    """
    EXISTING FUNCTIONALITY:
    - Basic booking information (customer, service, date, time, address)
    - Status management (pending, confirmed, completed, cancelled, rejected)
    - Price calculation and total amount
    - Timestamps for creation and updates
    
    NEW FUNCTIONALITY:
    - Multi-step booking process tracking
    - Enhanced booking details and preferences
    - Integration with payment system
    - Improved scheduling with time slots
    """
    
    # EXISTING FIELDS (unchanged)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='bookings')
    booking_date = models.DateField()
    booking_time = models.TimeField()
    address = models.TextField()
    city = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    note = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    cancellation_reason = models.TextField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # NEW FIELDS (backward compatible - all have defaults or are nullable)
    booking_step = models.CharField(
        max_length=20, 
        default='completed',  # Existing bookings are considered completed
        choices=(
            ('service_selection', 'Service Selection'),
            ('datetime_selection', 'Date & Time Selection'),
            ('details_input', 'Details Input'),
            ('payment', 'Payment'),
            ('confirmation', 'Confirmation'),
            ('completed', 'Completed'),
        ),
        help_text="Current step in the booking process"
    )
    
    booking_slot = models.ForeignKey(
        BookingSlot, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='bookings',
        help_text="Associated booking slot for time management"
    )
    
    special_instructions = models.TextField(
        blank=True, 
        null=True,
        help_text="Additional instructions from customer"
    )
    
    estimated_duration = models.DurationField(
        null=True, 
        blank=True,
        help_text="Estimated service duration"
    )
    
    preferred_provider_gender = models.CharField(
        max_length=10,
        choices=(
            ('any', 'Any'),
            ('male', 'Male'),
            ('female', 'Female'),
        ),
        default='any',
        help_text="Customer's preference for provider gender"
    )
    
    is_recurring = models.BooleanField(
        default=False,
        help_text="Whether this is a recurring booking"
    )
    
    recurring_frequency = models.CharField(
        max_length=20,
        choices=(
            ('weekly', 'Weekly'),
            ('biweekly', 'Bi-weekly'),
            ('monthly', 'Monthly'),
        ),
        blank=True,
        null=True,
        help_text="Frequency for recurring bookings"
    )
```

## 2. Frontend Component Architecture

### 2.1 New Components Structure

```typescript
// components/booking/BookingWizard.tsx
/**
 * Multi-step booking wizard component
 * 
 * Purpose: Provide intuitive step-by-step booking process
 * Impact: New component - existing booking flow remains as fallback
 * 
 * Features:
 * - Progress indicator
 * - Step validation
 * - Data persistence between steps
 * - Responsive design
 */
interface BookingWizardProps {
  serviceId?: string;
  onComplete: (booking: Booking) => void;
  onCancel: () => void;
  fallbackToOldFlow?: boolean; // Backward compatibility flag
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  serviceId,
  onComplete,
  onCancel,
  fallbackToOldFlow = false
}) => {
  // Implementation with fallback to existing booking form
  if (fallbackToOldFlow) {
    return <ExistingBookingForm />;
  }
  
  // New wizard implementation
  return (
    <div className="booking-wizard">
      {/* Multi-step form implementation */}
    </div>
  );
};
```

```typescript
// components/booking/PaymentForm.tsx
/**
 * Secure payment form component
 * 
 * Purpose: Handle payment processing with multiple payment methods
 * Impact: New component - adds payment functionality
 * 
 * Features:
 * - Multiple payment method support
 * - Secure payment processing
 * - Error handling and validation
 * - PCI compliance considerations
 */
interface PaymentFormProps {
  booking: Booking;
  paymentMethods: PaymentMethod[];
  onSuccess: (payment: Payment) => void;
  onError: (error: string) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  booking,
  paymentMethods,
  onSuccess,
  onError
}) => {
  // Secure payment form implementation
  return (
    <form className="payment-form">
      {/* Payment method selection and processing */}
    </form>
  );
};
```

## 3. API Extensions

### 3.1 New API Endpoints

#### Booking Wizard API
```python
# apps/bookings/views.py - New ViewSet for enhanced booking
class BookingWizardViewSet(viewsets.ModelViewSet):
    """
    Enhanced booking API with multi-step process support
    
    Purpose: Provide step-by-step booking creation with validation at each step
    Impact: New API - existing booking API remains unchanged for backward compatibility
    """
    
    @action(detail=False, methods=['post'])
    def create_step(self, request):
        """
        Create or update booking at specific step
        
        POST /api/bookings/wizard/create-step/
        {
            "step": "service_selection",
            "service_id": 1,
            "booking_data": {...}
        }
        """
        pass
    
    @action(detail=False, methods=['get'])
    def available_slots(self, request):
        """
        Get available time slots for a service and date
        
        GET /api/bookings/wizard/available-slots/?service_id=1&date=2024-01-15
        """
        pass
    
    @action(detail=False, methods=['post'])
    def calculate_price(self, request):
        """
        Calculate dynamic pricing based on selections
        
        POST /api/bookings/wizard/calculate-price/
        {
            "service_id": 1,
            "date": "2024-01-15",
            "time": "10:00",
            "add_ons": [...]
        }
        """
        pass
```

## 4. Testing Strategy

### 4.1 Unit Tests
- Test all new functions and methods
- Maintain existing test coverage
- Add tests for edge cases and error handling

### 4.2 Integration Tests
- Test API endpoint interactions
- Database migration testing
- Payment gateway integration testing

### 4.3 End-to-End Tests
- Complete booking flow testing
- User journey testing
- Cross-browser compatibility testing

## 5. Migration Strategy

### 5.1 Database Migrations
All new fields have default values or are nullable to ensure backward compatibility.

### 5.2 Feature Flags
Gradual rollout with ability to disable new features if issues arise.

### 5.3 Rollback Plan
Quick rollback procedures for each phase with monitoring and alerts.

This comprehensive technical specification ensures that Phase 1 implementation maintains backward compatibility while adding powerful new booking features.