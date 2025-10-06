"""
SewaBazaar Bookings Models

This module defines all the database models for the bookings system, which handles
the core functionality of booking services, processing payments, and managing
provider availability and time slots.

The bookings system implements a sophisticated workflow with:
1. Multi-step booking process with validation
2. Flexible payment options (digital wallets, bank transfers, cash)
3. Automated time slot management with categorization
4. Service delivery verification workflow
5. Provider analytics and performance tracking
6. Customer relationship management
7. Comprehensive error handling and logging

Key Models:
- ProviderAvailability: Defines when providers are generally available to work
- ServiceTimeSlot: Service-specific time slots that override provider general availability
- PaymentMethod: Centralized payment method management and support for multiple payment gateways
- BookingSlot: Actual booking instances for specific dates
- Booking: Core booking information and status management
- CustomerFeedback: Customer feedback and ratings for completed bookings
- BookingAnalytics: Analytics and insights for bookings
- ServiceDelivery: Tracks service delivery and customer confirmation
- Payment: Tracks payment transactions for bookings with comprehensive payment support
- ProviderAnalytics: Track daily provider performance metrics
- ProviderEarnings: Track provider earnings per booking
- ProviderSchedule: Provider custom schedule and blocked times
- ProviderCustomerRelation: Track provider-customer relationships and history

The models support complex business logic including:
- Multi-step booking process tracking
- Enhanced booking details and preferences
- Integration with payment system
- Improved scheduling with time slots
- Service delivery verification workflow
- Provider analytics and performance tracking
- Customer relationship management
- Voucher and reward system integration
"""

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
    
    This model stores the general availability schedule for providers, which serves
    as the foundation for generating specific booking slots. It defines the working
    hours for each day of the week and includes break times.
    
    Attributes:
        provider (ForeignKey): Reference to the provider user account
        weekday (int): Day of the week (0=Monday, 6=Sunday)
        start_time (TimeField): Start of working hours
        end_time (TimeField): End of working hours
        is_available (BooleanField): Whether the provider is available on this day
        break_start (TimeField): Lunch/break start time (optional)
        break_end (TimeField): Lunch/break end time (optional)
        created_at (DateTimeField): When the availability was created
        updated_at (DateTimeField): When the availability was last updated
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
    
    This model allows services to have specific time slots that override the
    provider's general availability. This is useful for services that have
    special timing requirements or seasonal availability.
    
    Attributes:
        service (ForeignKey): Reference to the service
        day_of_week (int): Day of week (0=Monday, 6=Sunday)
        start_time (TimeField): Start time for the slot
        end_time (TimeField): End time for the slot
        duration_hours (DecimalField): How long this service typically takes
        is_peak_time (BooleanField): Whether this is a peak time with higher pricing
        peak_price_multiplier (DecimalField): Price multiplier for peak times
        is_active (BooleanField): Whether this time slot is active
        max_bookings_per_slot (PositiveIntegerField): How many customers can book this time slot
        created_at (DateTimeField): When the time slot was created
        updated_at (DateTimeField): When the time slot was last updated
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
    Purpose: Centralize payment method management and support multiple payment gateways
    Impact: New model - no impact on existing functionality
    
    This model centralizes payment method management and supports multiple payment
    gateways including digital wallets, bank transfers, and cash payments. It provides
    a flexible configuration system for different payment methods with icons and
    gateway-specific settings.
    
    Attributes:
        name (CharField): Name of the payment method (e.g., "Khalti", "eSewa", "Cash")
        payment_type (CharField): Type of payment method
        is_active (BooleanField): Whether this payment method is active
        processing_fee_percentage (DecimalField): Processing fee percentage
        icon_image (ImageField): Uploaded icon image for this payment method
        icon_url (URLField): URL to an external icon image
        icon_emoji (CharField): Emoji icon as fallback
        gateway_config (JSONField): Gateway-specific configuration
        is_featured (BooleanField): Whether this is a featured payment method
        priority_order (PositiveIntegerField): Display order priority
        description (TextField): Payment method description
        supported_currencies (JSONField): Supported currencies
        min_amount (DecimalField): Minimum transaction amount
        max_amount (DecimalField): Maximum transaction amount
        created_at (DateTimeField): When the payment method was created
        updated_at (DateTimeField): When the payment method was last updated
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
    Purpose: Convert provider availability + service time slots into bookable instances
    Impact: Links provider schedule with customer bookings
    
    This model represents actual bookable time slots for specific dates. It converts
    the provider's general availability and service-specific time slots into concrete
    booking instances that customers can reserve.
    
    Attributes:
        service (ForeignKey): Reference to the service
        provider (ForeignKey): Reference to the provider
        date (DateField): Specific date for this slot
        start_time (TimeField): Start time for the slot
        end_time (TimeField): End time for the slot
        is_available (BooleanField): Whether this slot is available for booking
        max_bookings (PositiveIntegerField): Maximum bookings allowed for this slot
        current_bookings (PositiveIntegerField): Current number of bookings for this slot
        slot_type (CharField): Type of slot (normal, express, urgent, emergency)
        base_price_override (DecimalField): Override service price for this specific slot
        is_rush (BooleanField): Whether this is an express slot with premium pricing
        rush_fee_percentage (DecimalField): Additional fee percentage
        provider_note (TextField): Special instructions from provider
        created_from_availability (BooleanField): Whether generated from provider availability
        created_at (DateTimeField): When the slot was created
        updated_at (DateTimeField): When the slot was last updated
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
    
    This model represents a customer booking for a service. It tracks all the
    essential information about the booking including customer details, service
    information, scheduling, pricing, and status.
    
    Attributes:
        customer (ForeignKey): Reference to the customer user account
        service (ForeignKey): Reference to the booked service
        booking_date (DateField): Date of the booking
        booking_time (TimeField): Time of the booking
        address (TextField): Service address
        city (CharField): Service city
        phone (CharField): Customer phone number
        status (CharField): Current status of the booking
        price (DecimalField): Base price of the service
        discount (DecimalField): Discount amount
        total_amount (DecimalField): Total amount to be paid
        points_earned (PositiveIntegerField): Total reward points earned from this booking
        cancellation_reason (TextField): Reason for cancellation (optional)
        rejection_reason (TextField): Reason for rejection (optional)
        reschedule_reason (TextField): Latest reason for rescheduling the booking
        reschedule_history (JSONField): Complete history of reschedule reasons with timestamps
        created_at (DateTimeField): When the booking was created
        updated_at (DateTimeField): When the booking was last updated
        booking_step (CharField): Current step in the booking process
        booking_slot (ForeignKey): Associated booking slot for time management
        special_instructions (TextField): Additional instructions from customer
        provider_notes (TextField): Provider's notes about this booking
        estimated_duration (DurationField): Estimated service duration
        preferred_provider_gender (CharField): Customer's preference for provider gender
        is_recurring (BooleanField): Whether this is a recurring booking
        recurring_frequency (CharField): Frequency for recurring bookings
        is_express_booking (BooleanField): Whether this is an express/rush booking with premium pricing
        express_fee (DecimalField): Additional fee for express service
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
    
    # === REWARDS SYSTEM INTEGRATION (Phase 1) ===
    points_earned = models.PositiveIntegerField(
        default=0,
        help_text="Total reward points earned from this booking"
    )
    
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
    
    # NEW FIELD: Provider notes for booking management
    provider_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Provider's notes about this booking"
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
    
    def __str__(self):
        return f"Booking #{self.id} - {self.service.title} by {self.customer.email}"
    
    def save(self, *args, **kwargs):
        # Calculate total amount if not set
        if not self.total_amount:
            self.total_amount = self.price - self.discount
        
        # Update booking slot availability
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
    
    # Enhanced booking tracking and feedback
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
    Purpose: Collect detailed feedback from customers to improve provider quality
    Impact: New model - enhances service quality tracking and provider ratings
    
    This model collects detailed feedback from customers about completed bookings,
    including overall ratings and detailed breakdowns by different aspects of service.
    
    Attributes:
        booking (OneToOneField): Reference to the booking
        rating (IntegerField): Overall service rating
        punctuality_rating (IntegerField): Provider punctuality rating
        quality_rating (IntegerField): Service quality rating
        communication_rating (IntegerField): Communication quality rating
        value_rating (IntegerField): Value for money rating
        comment (TextField): Detailed feedback comment
        would_recommend (BooleanField): Whether customer would recommend to others
        is_anonymous (BooleanField): Whether feedback is anonymous
        is_verified_booking (BooleanField): Whether feedback is from verified booking
        created_at (DateTimeField): When the feedback was created
        updated_at (DateTimeField): When the feedback was last updated
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
    
    # Detailed rating breakdown
    punctuality_rating = models.IntegerField(choices=RATING_CHOICES, help_text="Provider punctuality")
    quality_rating = models.IntegerField(choices=RATING_CHOICES, help_text="Service quality")
    communication_rating = models.IntegerField(choices=RATING_CHOICES, help_text="Communication quality")
    value_rating = models.IntegerField(choices=RATING_CHOICES, help_text="Value for money")
    
    # Feedback details
    comment = models.TextField(help_text="Detailed feedback comment")
    would_recommend = models.BooleanField(default=True, help_text="Would recommend to others")
    
    # Feedback metadata
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
    Purpose: Track booking patterns, provider performance, and business insights
    Impact: New model - provides data-driven insights for platform optimization
    
    This model tracks daily booking analytics and business insights to help with
    platform optimization and decision making.
    
    Attributes:
        date (DateField): Date for this analytics record
        total_bookings (PositiveIntegerField): Total bookings on this date
        confirmed_bookings (PositiveIntegerField): Confirmed bookings on this date
        completed_bookings (PositiveIntegerField): Completed bookings on this date
        cancelled_bookings (PositiveIntegerField): Cancelled bookings on this date
        total_revenue (DecimalField): Total revenue on this date
        average_booking_value (DecimalField): Average booking value on this date
        active_providers (PositiveIntegerField): Active providers on this date
        new_providers (PositiveIntegerField): New providers on this date
        new_customers (PositiveIntegerField): New customers on this date
        returning_customers (PositiveIntegerField): Returning customers on this date
        created_at (DateTimeField): When the analytics record was created
        updated_at (DateTimeField): When the analytics record was last updated
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
    Tracks service delivery and customer confirmation
    
    Purpose: Separate service delivery from payment completion for accurate tracking
    Impact: New model - enables proper service delivery verification and customer confirmation
    
    This model addresses the critical flaw where bookings could be marked as 'completed'
    without actual service delivery verification. It creates a two-step process:
    1. Provider marks service as delivered
    2. Customer confirms service completion
    
    Attributes:
        booking (OneToOneField): Reference to the booking
        delivered_at (DateTimeField): When service was marked as delivered by provider
        delivered_by (ForeignKey): Provider who marked service as delivered
        delivery_notes (TextField): Provider's notes about service delivery completion
        delivery_photos (JSONField): Photos of completed service
        customer_confirmed_at (DateTimeField): When customer confirmed service completion
        customer_rating (IntegerField): Customer satisfaction rating
        customer_notes (TextField): Customer's feedback about the service quality
        would_recommend (BooleanField): Whether customer would recommend this provider
        dispute_raised (BooleanField): Whether customer raised dispute about service
        dispute_reason (TextField): Detailed reason for the dispute
        dispute_resolved (BooleanField): Whether dispute has been resolved by admin
        dispute_resolved_at (DateTimeField): When dispute was resolved
        dispute_resolved_by (ForeignKey): Admin who resolved the dispute
        created_at (DateTimeField): When the service delivery record was created
        updated_at (DateTimeField): When the service delivery record was last updated
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
    Tracks payment transactions for bookings with comprehensive payment support
    
    Purpose: Maintain payment history and transaction tracking for all payment methods
    Impact: Enhanced model - adds comprehensive payment tracking including cash payments
    
    This model now properly tracks ALL payment types including cash payments,
    addressing the critical flaw where cash payments were not being recorded.
    
    Attributes:
        payment_id (UUIDField): Unique payment identifier
        booking (OneToOneField): Reference to the booking
        payment_method (ForeignKey): Reference to the payment method
        amount (DecimalField): Payment amount
        processing_fee (DecimalField): Processing fee
        total_amount (DecimalField): Total payment amount
        khalti_token (CharField): Khalti payment token
        khalti_transaction_id (CharField): Khalti transaction ID
        khalti_response (JSONField): Khalti API response
        transaction_id (CharField): Unique transaction ID
        gateway_response (JSONField): General gateway response
        status (CharField): Payment status
        paid_at (DateTimeField): When payment was completed
        payment_type (CharField): Type of payment method used
        is_cash_payment (BooleanField): Whether this is a cash payment
        cash_collected_at (DateTimeField): When cash was collected from customer
        cash_collected_by (ForeignKey): Provider who collected cash payment
        is_verified (BooleanField): Whether payment has been verified
        verified_at (DateTimeField): When payment was verified
        verified_by (ForeignKey): Admin who verified the payment
        payment_attempts (PositiveIntegerField): Number of payment attempts made
        last_payment_attempt (DateTimeField): Last payment attempt timestamp
        failure_reason (TextField): Reason for payment failure
        refund_amount (DecimalField): Amount refunded to customer
        refund_reason (TextField): Reason for refund
        refunded_at (DateTimeField): When refund was processed
        refunded_by (ForeignKey): Admin who processed the refund
        voucher_discount (DecimalField): Discount amount applied from voucher
        applied_voucher (ForeignKey): Voucher applied to this payment
        original_amount (DecimalField): Original amount before voucher discount
        created_at (DateTimeField): When the payment record was created
        updated_at (DateTimeField): When the payment record was last updated
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
    
    # === VOUCHER INTEGRATION (Phase 2.4) ===
    voucher_discount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        help_text="Discount amount applied from voucher"
    )
    applied_voucher = models.ForeignKey(
        'rewards.RewardVoucher',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payments',
        help_text="Voucher applied to this payment"
    )
    original_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Original amount before voucher discount"
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
    
    def apply_voucher(self, voucher):
        """
        Apply a voucher to this payment for discount (simplified fixed-value system).
        
        Args:
            voucher (RewardVoucher): The voucher to apply
            
        Returns:
            dict: Result of voucher application
        """
        from decimal import Decimal
        
        if self.applied_voucher:
            return {
                'success': False,
                'error': 'A voucher has already been applied to this payment'
            }

        # Check if voucher can be used for this booking amount
        can_use, reason = voucher.can_use_for_booking(self.amount)
        if not can_use:
            return {
                'success': False,
                'error': reason
            }
        
        # Store original amount if not already stored
        if not self.original_amount:
            self.original_amount = self.amount
        
        # In simplified system, discount is always the minimum of voucher value or booking amount
        discount_amount = min(voucher.value, self.amount)
        
        try:
            # Apply the voucher to the booking
            voucher_result = voucher.apply_to_booking(self.booking, self.amount)
            
            if not voucher_result['success']:
                return voucher_result
            
            actual_discount = voucher_result['discount_applied']
            
            # Update payment amounts
            self.voucher_discount = actual_discount
            self.applied_voucher = voucher
            self.amount = Decimal(str(self.original_amount)) - actual_discount
            self.total_amount = self.amount + Decimal(str(self.processing_fee))
            
            self.save(update_fields=[
                'voucher_discount', 'applied_voucher', 'amount', 
                'total_amount', 'original_amount'
            ])
            
            return {
                'success': True,
                'discount_applied': float(actual_discount),
                'new_amount': float(self.amount),
                'new_total': float(self.total_amount),
                'voucher_fully_used': voucher_result['voucher_fully_used']
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def remove_voucher(self):
        """
        Remove applied voucher and restore original amount (simplified fixed-value system).
        
        Returns:
            dict: Result of voucher removal
        """
        from decimal import Decimal
        
        if not self.applied_voucher:
            return {
                'success': False,
                'error': 'No voucher is applied to this payment'
            }
        
        try:
            # Only allow removal if payment is still pending
            if self.status != 'pending':
                return {
                    'success': False,
                    'error': 'Cannot remove voucher from completed payment'
                }
            
            voucher = self.applied_voucher
            discount_to_restore = self.voucher_discount
            
            # In simplified system, if voucher was used, restore it to active
            if voucher.status == 'used':
                voucher.status = 'active'
                voucher.used_amount = Decimal('0.00')  # Reset used amount
                voucher.used_at = None
                voucher.save(update_fields=['status', 'used_amount', 'used_at'])
            
            # Restore payment amounts
            original_amount = Decimal(str(self.original_amount)) if self.original_amount else (self.amount + discount_to_restore)
            self.amount = original_amount
            self.total_amount = self.amount + Decimal(str(self.processing_fee))
            self.voucher_discount = Decimal('0.00')
            self.applied_voucher = None
            
            self.save(update_fields=[
                'amount', 'total_amount', 'voucher_discount', 'applied_voucher'
            ])
            
            return {
                'success': True,
                'discount_removed': float(discount_to_restore),
                'restored_amount': float(self.amount),
                'restored_total': float(self.total_amount)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'

# ===== NEW PROVIDER DASHBOARD MODELS =====
# These models are added to support the provider dashboard functionality
# They are completely new and don't modify any existing functionality

class ProviderAnalytics(models.Model):
    """
    Track daily provider performance metrics
    
    Purpose: Store aggregated analytics data for provider dashboard
    Impact: New model - enables provider performance tracking and analytics
    
    This model stores daily analytics data for providers to track their performance
    and business metrics through the provider dashboard.
    
    Attributes:
        provider (ForeignKey): Reference to the provider
        date (DateField): Date for this analytics record
        bookings_count (PositiveIntegerField): Total bookings on this date
        confirmed_bookings (PositiveIntegerField): Confirmed bookings on this date
        completed_bookings (PositiveIntegerField): Completed bookings on this date
        cancelled_bookings (PositiveIntegerField): Cancelled bookings on this date
        gross_revenue (DecimalField): Total gross revenue for this date
        net_revenue (DecimalField): Net revenue after platform fees
        platform_fees (DecimalField): Platform fees deducted
        average_rating (DecimalField): Average rating received on this date
        response_time_hours (DecimalField): Average response time to bookings in hours
        completion_rate (DecimalField): Percentage of bookings completed successfully
        new_customers (PositiveIntegerField): New customers served on this date
        returning_customers (PositiveIntegerField): Returning customers served on this date
        created_at (DateTimeField): When the analytics record was created
        updated_at (DateTimeField): When the analytics record was last updated
    """
    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='analytics',
        limit_choices_to={'role': 'provider'},
        help_text="Provider this analytics record belongs to"
    )
    date = models.DateField(help_text="Date for this analytics record")
    
    # Booking metrics
    bookings_count = models.PositiveIntegerField(
        default=0,
        help_text="Total bookings on this date"
    )
    confirmed_bookings = models.PositiveIntegerField(
        default=0,
        help_text="Confirmed bookings on this date"
    )
    completed_bookings = models.PositiveIntegerField(
        default=0,
        help_text="Completed bookings on this date"
    )
    cancelled_bookings = models.PositiveIntegerField(
        default=0,
        help_text="Cancelled bookings on this date"
    )
    
    # Revenue metrics
    gross_revenue = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Total gross revenue for this date"
    )
    net_revenue = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Net revenue after platform fees"
    )
    platform_fees = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Platform fees deducted"
    )
    
    # Performance metrics
    average_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0,
        help_text="Average rating received on this date"
    )
    response_time_hours = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Average response time to bookings in hours"
    )
    completion_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Percentage of bookings completed successfully"
    )
    
    # Customer metrics
    new_customers = models.PositiveIntegerField(
        default=0,
        help_text="New customers served on this date"
    )
    returning_customers = models.PositiveIntegerField(
        default=0,
        help_text="Returning customers served on this date"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['provider', 'date']
        ordering = ['-date']
        verbose_name = 'Provider Analytics'
        verbose_name_plural = 'Provider Analytics'
        indexes = [
            models.Index(fields=['provider', 'date']),
            models.Index(fields=['date']),
        ]
    
    def __str__(self):
        return f"Analytics for {self.provider.get_full_name()} on {self.date}"


class ProviderEarnings(models.Model):
    """
    Track provider earnings per booking
    
    Purpose: Detailed earnings tracking for each booking with platform fee calculations
    Impact: New model - enables detailed financial tracking and payout management
    
    This model tracks provider earnings for each booking with detailed platform fee
    calculations and payout management.
    
    Attributes:
        provider (ForeignKey): Reference to the provider
        booking (OneToOneField): Reference to the booking
        gross_amount (DecimalField): Total booking amount before fees
        platform_fee_percentage (DecimalField): Platform fee percentage applied
        platform_fee (DecimalField): Platform fee amount deducted
        net_amount (DecimalField): Net amount payable to provider
        payout_status (CharField): Status of payout to provider
        payout_date (DateTimeField): When payout was processed
        payout_reference (CharField): Bank transfer or payment reference
        payout_method (CharField): Method used for payout
        earned_at (DateTimeField): When this earning was recorded
        notes (TextField): Additional notes about this earning
        created_at (DateTimeField): When the earning record was created
        updated_at (DateTimeField): When the earning record was last updated
    """
    PAYOUT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('disputed', 'Disputed'),
    )
    
    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='earnings',
        limit_choices_to={'role': 'provider'},
        help_text="Provider who earned this amount"
    )
    booking = models.OneToOneField(
        'Booking',
        on_delete=models.CASCADE,
        related_name='provider_earnings',
        help_text="Booking this earning is associated with"
    )
    
    # Earning amounts
    gross_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Total booking amount before fees"
    )
    platform_fee_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=10.00,
        help_text="Platform fee percentage applied"
    )
    platform_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Platform fee amount deducted"
    )
    net_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Net amount payable to provider"
    )
    
    # Payout tracking
    payout_status = models.CharField(
        max_length=20,
        choices=PAYOUT_STATUS_CHOICES,
        default='pending',
        help_text="Status of payout to provider"
    )
    payout_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When payout was processed"
    )
    payout_reference = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Bank transfer or payment reference"
    )
    payout_method = models.CharField(
        max_length=50,
        choices=[
            ('bank_transfer', 'Bank Transfer'),
            ('digital_wallet', 'Digital Wallet'),
            ('check', 'Check'),
        ],
        default='bank_transfer',
        help_text="Method used for payout"
    )
    
    # Additional tracking
    earned_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this earning was recorded"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes about this earning"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-earned_at']
        verbose_name = 'Provider Earnings'
        verbose_name_plural = 'Provider Earnings'
        indexes = [
            models.Index(fields=['provider', 'payout_status']),
            models.Index(fields=['payout_date']),
            models.Index(fields=['earned_at']),
        ]
    
    def __str__(self):
        return f"Earnings for {self.provider.get_full_name()} - Booking #{self.booking.id}"
    
    def save(self, *args, **kwargs):
        # Auto-calculate platform fee and net amount if not set
        if not self.platform_fee:
            self.platform_fee = (self.gross_amount * self.platform_fee_percentage) / 00
        
        if not self.net_amount:
            self.net_amount = self.gross_amount - self.platform_fee
        
        super().save(*args, **kwargs)
    
    @property
    def is_paid(self):
        """Check if earning has been paid out"""
        return self.payout_status == 'paid'
    
    @property
    def days_since_earned(self):
        """Calculate days since earning was recorded"""
        from django.utils import timezone
        return (timezone.now() - self.earned_at).days


class ProviderSchedule(models.Model):
    """
    Provider custom schedule and blocked times
    
    Purpose: Track provider-specific schedule overrides and blocked time periods
    Impact: New model - enables advanced schedule management beyond general availability
    
    This model allows providers to manage custom schedules and blocked time periods
    that override their general availability.
    
    Attributes:
        provider (ForeignKey): Reference to the provider
        date (DateField): Date for this schedule entry
        start_time (TimeField): Start time (null for all-day entries)
        end_time (TimeField): End time (null for all-day entries)
        is_all_day (BooleanField): Whether this is an all-day schedule entry
        schedule_type (CharField): Type of schedule entry
        max_bookings (PositiveIntegerField): Maximum bookings allowed during this time
        title (CharField): Title for this schedule entry
        notes (TextField): Additional notes about this schedule entry
        is_recurring (BooleanField): Whether this schedule repeats
        recurring_pattern (CharField): Pattern for recurring schedule
        recurring_until (DateField): End date for recurring schedule
        created_at (DateTimeField): When the schedule entry was created
        updated_at (DateTimeField): When the schedule entry was last updated
    """
    SCHEDULE_TYPE_CHOICES = (
        ('available', 'Available'),
        ('blocked', 'Blocked'),
        ('vacation', 'Vacation'),
        ('maintenance', 'Maintenance'),
    )
    
    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='custom_schedule',
        limit_choices_to={'role': 'provider'},
        help_text="Provider this schedule belongs to"
    )
    
    # Date and time
    date = models.DateField(help_text="Date for this schedule entry")
    start_time = models.TimeField(
        null=True,
        blank=True,
        help_text="Start time (null for all-day entries)"
    )
    end_time = models.TimeField(
        null=True,
        blank=True,
        help_text="End time (null for all-day entries)"
    )
    is_all_day = models.BooleanField(
        default=False,
        help_text="Whether this is an all-day schedule entry"
    )
    
    # Schedule details
    schedule_type = models.CharField(
        max_length=20,
        choices=SCHEDULE_TYPE_CHOICES,
        default='available',
        help_text="Type of schedule entry"
    )
    max_bookings = models.PositiveIntegerField(
        default=1,
        help_text="Maximum bookings allowed during this time"
    )
    
    # Additional information
    title = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Title for this schedule entry"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes about this schedule entry"
    )
    
    # Recurring schedule
    is_recurring = models.BooleanField(
        default=False,
        help_text="Whether this schedule repeats"
    )
    recurring_pattern = models.CharField(
        max_length=20,
        choices=[
            ('daily', 'Daily'),
            ('weekly', 'Weekly'),
            ('monthly', 'Monthly'),
        ],
        blank=True,
        null=True,
        help_text="Pattern for recurring schedule"
    )
    recurring_until = models.DateField(
        null=True,
        blank=True,
        help_text="End date for recurring schedule"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['date', 'start_time']
        verbose_name = 'Provider Schedule'
        verbose_name_plural = 'Provider Schedules'
        indexes = [
            models.Index(fields=['provider', 'date']),
            models.Index(fields=['date', 'schedule_type']),
        ]
    
    def __str__(self):
        time_str = f" ({self.start_time}-{self.end_time})" if not self.is_all_day else " (All Day)"
        return f"{self.provider.get_full_name()} - {self.date}{time_str} - {self.get_schedule_type_display()}"
    
    @property
    def is_blocked(self):
        """Check if this schedule entry blocks availability"""
        return self.schedule_type in ['blocked', 'vacation', 'maintenance']
    
    @property
    def duration_hours(self):
        """Calculate duration in hours"""
        if self.is_all_day or not self.start_time or not self.end_time:
            return 24 if self.is_all_day else 0
        
        from datetime import datetime, timedelta
        start = datetime.combine(self.date, self.start_time)
        end = datetime.combine(self.date, self.end_time)
        
        # Handle overnight schedules
        if end < start:
            end += timedelta(days=1)
        
        return (end - start).total_seconds() / 3600


class ProviderCustomerRelation(models.Model):
    """
    Track provider-customer relationships and history
    
    Purpose: Store relationship data between providers and customers for better service
    Impact: New model - enables customer relationship management for providers
    
    This model tracks the relationship between providers and customers, including
    booking history, preferences, and relationship status.
    
    Attributes:
        provider (ForeignKey): Reference to the provider
        customer (ForeignKey): Reference to the customer
        total_bookings (PositiveIntegerField): Total bookings between this provider and customer
        total_spent (DecimalField): Total amount spent by customer with this provider
        average_rating (DecimalField): Average rating given by customer to provider
        is_favorite_customer (BooleanField): Whether provider marked this as favorite customer
        is_blocked (BooleanField): Whether provider blocked this customer
        first_booking_date (DateTimeField): Date of first booking between them
        last_booking_date (DateTimeField): Date of most recent booking
        notes (TextField): Provider's private notes about this customer
        created_at (DateTimeField): When the relationship record was created
        updated_at (DateTimeField): When the relationship record was last updated
    """
    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='customer_relations',
        limit_choices_to={'role': 'provider'},
        help_text="Provider in this relationship"
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='provider_relations',
        limit_choices_to={'role': 'customer'},
        help_text="Customer in this relationship"
    )
    
    # Relationship metrics
    total_bookings = models.PositiveIntegerField(
        default=0,
        help_text="Total bookings between this provider and customer"
    )
    total_spent = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Total amount spent by customer with this provider"
    )
    average_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0,
        help_text="Average rating given by customer to provider"
    )
    
    # Relationship status
    is_favorite_customer = models.BooleanField(
        default=False,
        help_text="Whether provider marked this as favorite customer"
    )
    is_blocked = models.BooleanField(
        default=False,
        help_text="Whether provider blocked this customer"
    )
    
    # Dates
    first_booking_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date of first booking between them"
    )
    last_booking_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date of most recent booking"
    )
    
    # Provider notes about customer
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Provider's private notes about this customer"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['provider', 'customer']
        ordering = ['-last_booking_date']
        verbose_name = 'Provider-Customer Relation'
        verbose_name_plural = 'Provider-Customer Relations'
        indexes = [
            models.Index(fields=['provider', 'is_blocked']),
            models.Index(fields=['provider', 'is_favorite_customer']),
            models.Index(fields=['last_booking_date']),
        ]
    
    def __str__(self):
        return f"{self.provider.get_full_name()} - {self.customer.get_full_name()}"
    
    @property
    def customer_status(self):
        """Get customer status for this provider"""
        if self.is_blocked:
            return 'blocked'
        elif self.is_favorite_customer:
            return 'favorite'
        elif self.total_bookings >= 5:
            return 'regular'
        elif self.total_bookings >= 2:
            return 'returning'
        else:
            return 'new'
    
    @property
    def days_since_last_booking(self):
        """Calculate days since last booking"""
        if not self.last_booking_date:
            return None
        
        from django.utils import timezone
        return (timezone.now() - self.last_booking_date).days


# === CACHE INVALIDATION SIGNALS ===

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache

@receiver(post_save, sender=Booking)
def invalidate_provider_cache_on_booking_save(sender, instance, **kwargs):
    """
    Invalidate provider analytics cache when booking is saved
    """
    if instance.service and instance.service.provider:
        provider_id = instance.service.provider.id
        
        # Clear provider analytics cache
        cache_keys = [
            f"provider_analytics:{provider_id}:statistics",
            f"provider_analytics:{provider_id}:earnings_analytics",
            f"provider_analytics:{provider_id}:service_performance"
        ]
        
        cache.delete_many(cache_keys)

@receiver(post_delete, sender=Booking)
def invalidate_provider_cache_on_booking_delete(sender, instance, **kwargs):
    """
    Invalidate provider analytics cache when booking is deleted
    """
    if instance.service and instance.service.provider:
        provider_id = instance.service.provider.id
        
        # Clear provider analytics cache
        cache_keys = [
            f"provider_analytics:{provider_id}:statistics",
            f"provider_analytics:{provider_id}:earnings_analytics",
            f"provider_analytics:{provider_id}:service_performance"
        ]
        
        cache.delete_many(cache_keys)