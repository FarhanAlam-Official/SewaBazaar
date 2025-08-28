from django.db import models
from django.conf import settings
from apps.services.models import Service
import uuid
from datetime import timedelta

class PaymentMethod(models.Model):
    """
    PHASE 1 NEW MODEL: Stores available payment methods for the platform
    
    Purpose: Centralize payment method management and support multiple payment gateways
    Impact: New model - no impact on existing functionality
    """
    PAYMENT_TYPE_CHOICES = (
        ('digital_wallet', 'Digital Wallet'),
        ('bank_transfer', 'Bank Transfer'),
        ('cash', 'Cash on Service'),
    )
    
    name = models.CharField(max_length=100)  # e.g., "Khalti", "eSewa", "Cash"
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES)
    is_active = models.BooleanField(default=True)
    processing_fee_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    icon = models.CharField(max_length=100, blank=True, null=True)  # Icon class or URL
    gateway_config = models.JSONField(default=dict, blank=True)  # Gateway-specific configuration
    
    # PHASE 2 NEW: Enhanced payment method features
    is_featured = models.BooleanField(default=False, help_text="Featured payment method")
    priority_order = models.PositiveIntegerField(default=0, help_text="Display order priority")
    description = models.TextField(blank=True, null=True, help_text="Payment method description")
    supported_currencies = models.JSONField(default=list, blank=True, help_text="Supported currencies")
    min_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Minimum transaction amount")
    max_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Maximum transaction amount")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_payment_type_display()})"
    
    class Meta:
        ordering = ['payment_type', 'name']
        verbose_name = 'Payment Method'
        verbose_name_plural = 'Payment Methods'


class BookingSlot(models.Model):
    """
    PHASE 1 NEW MODEL: Manages time slot availability for services
    
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


class Booking(models.Model):
    """
    EXISTING FUNCTIONALITY (PRESERVED):
    - Basic booking information (customer, service, date, time, address)
    - Status management (pending, confirmed, completed, cancelled, rejected)
    - Price calculation and total amount
    - Timestamps for creation and updates
    
    PHASE 1 NEW FUNCTIONALITY:
    - Multi-step booking process tracking
    - Enhanced booking details and preferences
    - Integration with payment system
    - Improved scheduling with time slots
    """
    
    # EXISTING STATUS CHOICES (unchanged)
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rejected', 'Rejected'),
    )
    
    # EXISTING FIELDS (unchanged)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='bookings'
    )
    service = models.ForeignKey(
        Service, 
        on_delete=models.CASCADE, 
        related_name='bookings'
    )
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
    
    # PHASE 1 NEW FIELDS (backward compatible - all have defaults or are nullable)
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
        default=timedelta(hours=1),
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
    
    # EXISTING METHODS (unchanged)
    def __str__(self):
        return f"Booking #{self.id} - {self.service.title} by {self.customer.email}"
    
    def save(self, *args, **kwargs):
        # EXISTING LOGIC: Calculate total amount if not set
        if not self.total_amount:
            self.total_amount = self.price - self.discount
        
        # PHASE 1 NEW LOGIC: Update booking slot availability
        if self.booking_slot and self.status in ['confirmed', 'completed']:
            if self.pk is None:  # New booking
                self.booking_slot.current_bookings += 1
                self.booking_slot.save()
        
        super().save(*args, **kwargs)
    
    # PHASE 2 NEW: Enhanced booking tracking and feedback
    @property
    def is_completed_with_feedback(self):
        """Check if booking is completed and has customer feedback"""
        return self.status == 'completed' and hasattr(self, 'customer_feedback')
    
    @property
    def provider_rating(self):
        """Get the rating given by customer to provider"""
        if hasattr(self, 'customer_feedback'):
            return self.customer_feedback.rating
        return None
    
    class Meta:
        ordering = ['-booking_date', '-booking_time']


class CustomerFeedback(models.Model):
    """
    PHASE 2 NEW MODEL: Customer feedback and ratings for completed bookings
    
    Purpose: Collect detailed feedback from customers to improve provider quality
    Impact: New model - enhances service quality tracking and provider ratings
    """
    RATING_CHOICES = (
        (1, '1 - Poor'),
        (2, '2 - Fair'),
        (3, '3 - Good'),
        (4, '4 - Very Good'),
        (5, '5 - Excellent'),
    )
    
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='customer_feedback')
    
    # Overall rating
    rating = models.IntegerField(choices=RATING_CHOICES, help_text="Overall service rating")
    
    # PHASE 2 NEW: Detailed rating breakdown
    punctuality_rating = models.IntegerField(choices=RATING_CHOICES, help_text="Provider punctuality")
    quality_rating = models.IntegerField(choices=RATING_CHOICES, help_text="Service quality")
    communication_rating = models.IntegerField(choices=RATING_CHOICES, help_text="Communication quality")
    value_rating = models.IntegerField(choices=RATING_CHOICES, help_text="Value for money")
    
    # Feedback details
    comment = models.TextField(help_text="Detailed feedback comment")
    would_recommend = models.BooleanField(default=True, help_text="Would recommend to others")
    
    # PHASE 2 NEW: Feedback metadata
    is_anonymous = models.BooleanField(default=False, help_text="Anonymous feedback")
    is_verified_booking = models.BooleanField(default=True, help_text="Feedback from verified booking")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Feedback for Booking #{self.booking.id}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update provider's cached ratings
        self._update_provider_ratings()
    
    def _update_provider_ratings(self):
        """Update provider's cached rating fields"""
        provider = self.booking.service.provider
        if hasattr(provider, 'profile'):
            profile = provider.profile
            # Calculate average rating from all feedback
            all_feedback = CustomerFeedback.objects.filter(
                booking__service__provider=provider
            )
            if all_feedback.exists():
                avg_rating = all_feedback.aggregate(
                    models.Avg('rating')
                )['rating__avg']
                profile.avg_rating = round(avg_rating, 2)
                profile.reviews_count = all_feedback.count()
                profile.save(update_fields=['avg_rating', 'reviews_count'])
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Customer Feedback'
        verbose_name_plural = 'Customer Feedback'


class BookingAnalytics(models.Model):
    """
    PHASE 2 NEW MODEL: Analytics and insights for bookings
    
    Purpose: Track booking patterns, provider performance, and business insights
    Impact: New model - provides data-driven insights for platform optimization
    """
    date = models.DateField(unique=True)
    
    # Daily booking metrics
    total_bookings = models.PositiveIntegerField(default=0)
    confirmed_bookings = models.PositiveIntegerField(default=0)
    completed_bookings = models.PositiveIntegerField(default=0)
    cancelled_bookings = models.PositiveIntegerField(default=0)
    
    # Revenue metrics
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    average_booking_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Provider metrics
    active_providers = models.PositiveIntegerField(default=0)
    new_providers = models.PositiveIntegerField(default=0)
    
    # Customer metrics
    new_customers = models.PositiveIntegerField(default=0)
    returning_customers = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Analytics for {self.date}"
    
    class Meta:
        ordering = ['-date']
        verbose_name = 'Booking Analytics'
        verbose_name_plural = 'Booking Analytics'


class Payment(models.Model):
    """
    PHASE 1 NEW MODEL: Tracks payment transactions for bookings with Khalti integration
    
    Purpose: Maintain payment history and transaction tracking with Khalti gateway
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
    
    # Unique payment identifier
    payment_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    # Booking relationship
    booking = models.OneToOneField('Booking', on_delete=models.CASCADE, related_name='payment')
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.PROTECT)
    
    # Payment amounts (in NPR paisa for Khalti - multiply by 100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    processing_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Khalti specific fields
    khalti_token = models.CharField(max_length=200, blank=True, null=True)
    khalti_transaction_id = models.CharField(max_length=100, blank=True, null=True)
    khalti_response = models.JSONField(default=dict, blank=True)
    
    # General payment tracking
    transaction_id = models.CharField(max_length=100, unique=True)
    gateway_response = models.JSONField(default=dict, blank=True)
    
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    paid_at = models.DateTimeField(null=True, blank=True)
    
    # PHASE 2 NEW: Enhanced payment tracking
    payment_attempts = models.PositiveIntegerField(default=1, help_text="Number of payment attempts")
    last_payment_attempt = models.DateTimeField(auto_now=True, help_text="Last payment attempt timestamp")
    failure_reason = models.TextField(blank=True, null=True, help_text="Reason for payment failure")
    
    # PHASE 2 NEW: Refund tracking
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Amount refunded")
    refund_reason = models.TextField(blank=True, null=True, help_text="Reason for refund")
    refunded_at = models.DateTimeField(null=True, blank=True, help_text="Refund timestamp")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Payment #{self.transaction_id} - {self.booking}"
    
    def save(self, *args, **kwargs):
        if not self.total_amount:
            self.total_amount = self.amount + self.processing_fee
        
        # Generate transaction ID if not provided
        if not self.transaction_id:
            self.transaction_id = f"SB_{self.payment_id.hex[:8].upper()}"
        
        super().save(*args, **kwargs)
    
    @property
    def amount_in_paisa(self):
        """Convert amount to paisa for Khalti API (multiply by 100)"""
        return int(self.total_amount * 100)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
