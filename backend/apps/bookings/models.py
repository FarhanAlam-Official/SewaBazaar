from django.db import models
from django.conf import settings
from apps.services.models import Service
import uuid
from datetime import timedelta


class ProviderAvailability(models.Model):
    """
    Provider's general availability schedule
    
    Purpose: Define when a provider is generally available to work
    Impact: Foundation for all service bookings
    """
    WEEKDAY_CHOICES = (
        (0, 'Monday'),
        (1, 'Tuesday'), 
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    )
    
    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='availability_schedule',
        limit_choices_to={'role': 'provider'}
    )
    weekday = models.IntegerField(choices=WEEKDAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    
    # Break times during the day
    break_start = models.TimeField(null=True, blank=True, help_text="Lunch/break start time")
    break_end = models.TimeField(null=True, blank=True, help_text="Lunch/break end time")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['provider', 'weekday', 'start_time']
        ordering = ['weekday', 'start_time']
        verbose_name = 'Provider Availability'
        verbose_name_plural = 'Provider Availabilities'
    
    def __str__(self):
        return f"{self.provider.get_full_name()} - {self.get_weekday_display()} ({self.start_time}-{self.end_time})"


class ServiceTimeSlot(models.Model):
    """
    Service-specific time slots that override provider general availability
    
    Purpose: Define specific timing for individual services
    Impact: Allows granular control over when specific services can be booked
    """
    service = models.ForeignKey('services.Service', on_delete=models.CASCADE, related_name='time_slots')
    day_of_week = models.IntegerField(
        choices=ProviderAvailability.WEEKDAY_CHOICES,
        help_text="Day of week (0=Monday, 6=Sunday)"
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    duration_hours = models.DecimalField(
        max_digits=4, 
        decimal_places=2, 
        default=1.0,
        help_text="How long this service typically takes"
    )
    
    # Pricing modifiers
    is_peak_time = models.BooleanField(
        default=False,
        help_text="Peak hours with higher pricing"
    )
    peak_price_multiplier = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=1.0,
        help_text="Price multiplier for peak times (e.g., 1.5 for 50% increase)"
    )
    
    # Availability
    is_active = models.BooleanField(default=True)
    max_bookings_per_slot = models.PositiveIntegerField(
        default=1,
        help_text="How many customers can book this time slot"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['service', 'day_of_week', 'start_time']
        ordering = ['day_of_week', 'start_time']
        verbose_name = 'Service Time Slot'
        verbose_name_plural = 'Service Time Slots'
    
    def __str__(self):
        return f"{self.service.title} - {self.get_day_of_week_display()} ({self.start_time}-{self.end_time})"
    
    @property
    def calculated_price(self):
        """Calculate price including peak time multiplier"""
        base_price = self.service.price
        if self.is_peak_time:
            return base_price * self.peak_price_multiplier
        return base_price


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
    
    # Enhanced icon field - supports both image uploads and URLs
    icon_image = models.ImageField(
        upload_to='payment_methods/icons/', 
        blank=True, 
        null=True, 
        help_text="Upload an icon image for this payment method"
    )
    icon_url = models.URLField(
        blank=True, 
        null=True, 
        help_text="URL to an external icon image"
    )
    icon_emoji = models.CharField(
        max_length=10, 
        blank=True, 
        null=True, 
        help_text="Emoji icon as fallback (e.g., 💳, 💰)"
    )
    
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
    
    @property
    def icon_display(self):
        """Return the best available icon for display"""
        if self.icon_image:
            return self.icon_image.url
        elif self.icon_url:
            return self.icon_url
        elif self.icon_emoji:
            return self.icon_emoji
        else:
            # Fallback icons based on payment type
            fallback_icons = {
                'digital_wallet': '💳',
                'bank_transfer': '🏦',
                'cash': '💰'
            }
            return fallback_icons.get(self.payment_type, '💳')
    
    class Meta:
        ordering = ['payment_type', 'name']
        verbose_name = 'Payment Method'
        verbose_name_plural = 'Payment Methods'


class BookingSlot(models.Model):
    """
    ENHANCED MODEL: Actual booking instances for specific dates
    
    Purpose: Convert provider availability + service time slots into bookable instances
    Impact: Links provider schedule with customer bookings
    """
    # Core relationships
    service = models.ForeignKey('services.Service', on_delete=models.CASCADE, related_name='booking_slots')
    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='booking_slots',
        limit_choices_to={'role': 'provider'},
        null=True,  # Allow null for existing data
        blank=True,
        default=1  # Default to first provider for migrations
    )
    
    # Specific date and time
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    # Availability tracking
    is_available = models.BooleanField(default=True)
    max_bookings = models.PositiveIntegerField(default=1)
    current_bookings = models.PositiveIntegerField(default=0)
    
    # Pricing and type
    slot_type = models.CharField(
        max_length=20,
        choices=(
            ('normal', 'Normal'),
            ('express', 'Express'),
            ('urgent', 'Urgent'),
            ('emergency', 'Emergency'),
        ),
        default='normal'
    )
    
    # Dynamic pricing
    base_price_override = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Override service price for this specific slot"
    )
    
    # Express/Rush features
    is_rush = models.BooleanField(
        default=False,
        help_text="Express slot with premium pricing"
    )
    rush_fee_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.00,
        help_text="Additional fee percentage (e.g., 50.00 for 50%)"
    )
    
    # Provider notes
    provider_note = models.TextField(
        blank=True,
        null=True,
        help_text="Special instructions from provider"
    )
    
    # Source tracking
    created_from_availability = models.BooleanField(
        default=True,
        help_text="Generated from provider availability vs manually created"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        rush_indicator = " (EXPRESS)" if self.is_rush else ""
        return f"{self.service.title} - {self.date} ({self.start_time}-{self.end_time}){rush_indicator}"
    
    @property
    def is_fully_booked(self):
        return self.current_bookings >= self.max_bookings
    
    @property
    def calculated_price(self):
        """Calculate final price including all modifiers"""
        base_price = self.base_price_override or self.service.price
        
        # Add rush fee if applicable
        if self.is_rush and self.rush_fee_percentage > 0:
            rush_fee = base_price * (self.rush_fee_percentage / 100)
            base_price += rush_fee
            
        return base_price
    
    @property
    def rush_fee_amount(self):
        """Calculate rush fee amount"""
        if not self.is_rush or self.rush_fee_percentage <= 0:
            return 0
        base_price = self.base_price_override or self.service.price
        return base_price * (self.rush_fee_percentage / 100)
    
    @property
    def duration_minutes(self):
        """Calculate slot duration in minutes"""
        from datetime import datetime, timedelta
        start = datetime.combine(self.date, self.start_time)
        end = datetime.combine(self.date, self.end_time)
        return int((end - start).total_seconds() / 60)
    
    def save(self, *args, **kwargs):
        # Auto-populate provider from service if not set
        if not self.provider and self.service:
            self.provider = self.service.provider
        super().save(*args, **kwargs)
    
    class Meta:
        ordering = ['date', 'start_time']
        unique_together = ['service', 'provider', 'date', 'start_time']
        verbose_name = 'Booking Slot'
        verbose_name_plural = 'Booking Slots'
        indexes = [
            models.Index(fields=['date', 'is_available']),
            models.Index(fields=['provider', 'date']),
            models.Index(fields=['service', 'date']),
        ]


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
    
    # ENHANCED STATUS CHOICES (backward compatible with new additions)
    STATUS_CHOICES = (
        # EXISTING STATUSES (maintained for backward compatibility)
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rejected', 'Rejected'),
        
        # NEW STATUSES (added for better service delivery tracking)
        ('payment_pending', 'Payment Pending'),
        ('service_delivered', 'Service Delivered'),
        ('awaiting_confirmation', 'Awaiting Confirmation'),
        ('disputed', 'Disputed'),
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
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='pending')
    
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    cancellation_reason = models.TextField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    reschedule_reason = models.TextField(blank=True, null=True, help_text="Latest reason for rescheduling the booking")
    reschedule_history = models.JSONField(default=list, blank=True, help_text="Complete history of reschedule reasons with timestamps")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # ENHANCED BOOKING STEP TRACKING (backward compatible with new additions)
    booking_step = models.CharField(
        max_length=25, 
        default='completed',  # Existing bookings are considered completed
        choices=(
            # EXISTING STEPS (maintained for backward compatibility)
            ('service_selection', 'Service Selection'),
            ('datetime_selection', 'Date & Time Selection'),
            ('details_input', 'Details Input'),
            ('payment', 'Payment'),
            ('confirmation', 'Confirmation'),
            ('completed', 'Completed'),
            
            # NEW STEPS (added for better process tracking)
            ('payment_completed', 'Payment Completed'),
            ('service_delivered', 'Service Delivered'),
            ('customer_confirmed', 'Customer Confirmed'),
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
    
    # NEW: Express/Rush booking support
    is_express_booking = models.BooleanField(
        default=False,
        help_text="Whether this is an express/rush booking with premium pricing"
    )
    
    express_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Additional fee for express service"
    )
    
    # EXISTING METHODS (unchanged)
    def __str__(self):
        return f"Booking #{self.id} - {self.service.title} by {self.customer.email}"
    
    def save(self, *args, **kwargs):
        # EXISTING LOGIC: Calculate total amount if not set
        if not self.total_amount:
            self.total_amount = self.price - self.discount
        
        # PHASE 1 NEW LOGIC: Update booking slot availability
        if self.booking_slot:
            if self.pk is None:  # New booking
                # Increment slot booking count for new bookings
                self.booking_slot.current_bookings += 1
                self.booking_slot.save()
            else:
                # For existing bookings, check if status changed to cancelled/rejected
                # and decrement slot count if needed
                old_booking = Booking.objects.filter(pk=self.pk).first()
                if old_booking and old_booking.status != self.status:
                    if old_booking.status in ['pending', 'confirmed', 'completed'] and self.status in ['cancelled', 'rejected']:
                        # Decrement slot count when booking is cancelled/rejected
                        if self.booking_slot.current_bookings > 0:
                            self.booking_slot.current_bookings -= 1
                            self.booking_slot.save()
                    elif old_booking.status in ['cancelled', 'rejected'] and self.status in ['pending', 'confirmed', 'completed']:
                        # Increment slot count when booking is reactivated
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


class ServiceDelivery(models.Model):
    """
    NEW MODEL: Tracks service delivery and customer confirmation
    
    Purpose: Separate service delivery from payment completion for accurate tracking
    Impact: New model - enables proper service delivery verification and customer confirmation
    
    This model addresses the critical flaw where bookings could be marked as 'completed'
    without actual service delivery verification. It creates a two-step process:
    1. Provider marks service as delivered
    2. Customer confirms service completion
    """
    booking = models.OneToOneField(
        Booking, 
        on_delete=models.CASCADE, 
        related_name='service_delivery',
        help_text="Associated booking for this service delivery"
    )
    
    # Service delivery tracking
    delivered_at = models.DateTimeField(
        null=True, 
        blank=True, 
        help_text="When service was marked as delivered by provider"
    )
    delivered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='delivered_services',
        help_text="Provider who marked service as delivered"
    )
    delivery_notes = models.TextField(
        blank=True, 
        help_text="Provider's notes about service delivery completion"
    )
    delivery_photos = models.JSONField(
        default=list, 
        blank=True, 
        help_text="Photos of completed service (stored as list of file paths/URLs)"
    )
    
    # Customer confirmation tracking
    customer_confirmed_at = models.DateTimeField(
        null=True, 
        blank=True, 
        help_text="When customer confirmed service completion"
    )
    customer_rating = models.IntegerField(
        null=True, 
        blank=True, 
        choices=[(i, f'{i} Star{"s" if i != 1 else ""}') for i in range(1, 6)], 
        help_text="Customer satisfaction rating (1-5 stars)"
    )
    customer_notes = models.TextField(
        blank=True, 
        help_text="Customer's feedback about the service quality"
    )
    would_recommend = models.BooleanField(
        null=True, 
        blank=True, 
        help_text="Would customer recommend this provider to others"
    )
    
    # Dispute handling
    dispute_raised = models.BooleanField(
        default=False, 
        help_text="Customer raised dispute about service delivery quality"
    )
    dispute_reason = models.TextField(
        blank=True, 
        help_text="Detailed reason for the dispute"
    )
    dispute_resolved = models.BooleanField(
        default=False, 
        help_text="Dispute has been resolved by admin"
    )
    dispute_resolved_at = models.DateTimeField(
        null=True, 
        blank=True, 
        help_text="When dispute was resolved"
    )
    dispute_resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_disputes',
        help_text="Admin who resolved the dispute"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Service Delivery for Booking #{self.booking.id}"
    
    @property
    def is_fully_confirmed(self):
        """Check if service delivery is fully confirmed by customer"""
        return (
            self.delivered_at is not None and 
            self.customer_confirmed_at is not None and 
            not self.dispute_raised
        )
    
    @property
    def days_since_delivery(self):
        """Calculate days since service was delivered"""
        if not self.delivered_at:
            return None
        from django.utils import timezone
        return (timezone.now() - self.delivered_at).days
    
    class Meta:
        ordering = ['-delivered_at']
        verbose_name = 'Service Delivery'
        verbose_name_plural = 'Service Deliveries'
        indexes = [
            models.Index(fields=['delivered_at']),
            models.Index(fields=['customer_confirmed_at']),
            models.Index(fields=['dispute_raised']),
        ]


class Payment(models.Model):
    """
    ENHANCED MODEL: Tracks payment transactions for bookings with comprehensive payment support
    
    Purpose: Maintain payment history and transaction tracking for all payment methods
    Impact: Enhanced model - adds comprehensive payment tracking including cash payments
    
    This model now properly tracks ALL payment types including cash payments,
    addressing the critical flaw where cash payments were not being recorded.
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
    
    # ENHANCED PAYMENT TRACKING (includes cash payment support)
    payment_type = models.CharField(
        max_length=20,
        choices=[
            ('digital_wallet', 'Digital Wallet'),
            ('bank_transfer', 'Bank Transfer'),
            ('cash', 'Cash on Service'),
        ],
        default='digital_wallet',
        help_text="Type of payment method used for this transaction"
    )
    
    # Cash payment specific fields
    is_cash_payment = models.BooleanField(
        default=False, 
        help_text="Whether this is a cash payment (collected after service delivery)"
    )
    cash_collected_at = models.DateTimeField(
        null=True, 
        blank=True, 
        help_text="When cash was collected from customer"
    )
    cash_collected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='collected_cash_payments',
        help_text="Provider who collected cash payment"
    )
    
    # Payment verification
    is_verified = models.BooleanField(
        default=False, 
        help_text="Payment has been verified (auto-true for digital payments, manual for cash)"
    )
    verified_at = models.DateTimeField(
        null=True, 
        blank=True, 
        help_text="When payment was verified"
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_payments',
        help_text="Admin who verified the payment (for cash payments)"
    )
    
    # Enhanced payment tracking
    payment_attempts = models.PositiveIntegerField(
        default=1, 
        help_text="Number of payment attempts made"
    )
    last_payment_attempt = models.DateTimeField(
        auto_now=True, 
        help_text="Last payment attempt timestamp"
    )
    failure_reason = models.TextField(
        blank=True, 
        null=True, 
        help_text="Reason for payment failure (if applicable)"
    )
    
    # Refund tracking
    refund_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0, 
        help_text="Amount refunded to customer"
    )
    refund_reason = models.TextField(
        blank=True, 
        null=True, 
        help_text="Reason for refund"
    )
    refunded_at = models.DateTimeField(
        null=True, 
        blank=True, 
        help_text="When refund was processed"
    )
    refunded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_refunds',
        help_text="Admin who processed the refund"
    )
    
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
        if self.total_amount is None:
            return None
        return int(self.total_amount * 100)
    
    @property
    def is_digital_payment(self):
        """Check if this is a digital payment (not cash)"""
        return self.payment_type in ['digital_wallet', 'bank_transfer']
    
    @property
    def requires_verification(self):
        """Check if payment requires manual verification"""
        return self.is_cash_payment and not self.is_verified
    
    @property
    def can_be_refunded(self):
        """Check if payment can be refunded"""
        return (
            self.status == 'completed' and 
            self.is_verified and 
            self.refund_amount < self.total_amount
        )
    
    def mark_as_verified(self, verified_by_user):
        """Mark payment as verified (for cash payments)"""
        from django.utils import timezone
        self.is_verified = True
        self.verified_at = timezone.now()
        self.verified_by = verified_by_user
        self.save(update_fields=['is_verified', 'verified_at', 'verified_by'])
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'