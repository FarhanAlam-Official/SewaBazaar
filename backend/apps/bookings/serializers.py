from rest_framework import serializers
from django.db import models
from .models import Booking, PaymentMethod, BookingSlot, Payment, ServiceDelivery
from apps.services.serializers import ServiceSerializer
from apps.accounts.serializers import UserSerializer

class PaymentMethodSerializer(serializers.ModelSerializer):
    """
    ENHANCED SERIALIZER: Serializer for payment methods with icon support
    
    Purpose: Handle payment method data with enhanced icon and display features
    Impact: Enhanced serializer - better payment method display
    """
    icon_display = serializers.ReadOnlyField()  # Property method for best available icon
    
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'name', 'payment_type', 'is_active', 
            'processing_fee_percentage', 'icon_image', 'icon_url', 'icon_emoji', 
            'icon_display', 'is_featured', 'priority_order', 'description',
            'min_amount', 'max_amount', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'icon_display']


class BookingSlotSerializer(serializers.ModelSerializer):
    """
    PHASE 1 NEW SERIALIZER: Serializer for booking slots
    
    Purpose: Handle booking slot data for availability management
    Impact: New serializer - enhances booking system
    """
    is_fully_booked = serializers.ReadOnlyField()
    calculated_price = serializers.ReadOnlyField()
    rush_fee_amount = serializers.ReadOnlyField()
    
    class Meta:
        model = BookingSlot
        fields = [
            'id', 'service', 'date', 'start_time', 'end_time', 
            'is_available', 'max_bookings', 'current_bookings', 
            'is_fully_booked', 'is_rush', 'rush_fee_percentage',
            'slot_type', 'provider_note', 'base_price_override',
            'calculated_price', 'rush_fee_amount', 'created_at'
        ]
        read_only_fields = ['current_bookings', 'created_at', 'calculated_price', 'rush_fee_amount']


class ServiceDeliverySerializer(serializers.ModelSerializer):
    """
    NEW SERIALIZER: Serializer for service delivery tracking
    
    Purpose: Handle service delivery data and customer confirmation
    Impact: New serializer - enables proper service delivery verification
    
    This serializer addresses the critical flaw where service completion
    was not properly tracked and verified.
    """
    delivered_by_name = serializers.CharField(source='delivered_by.get_full_name', read_only=True)
    is_fully_confirmed = serializers.ReadOnlyField()
    days_since_delivery = serializers.ReadOnlyField()
    
    class Meta:
        model = ServiceDelivery
        fields = [
            'id', 'booking', 'delivered_at', 'delivered_by', 'delivered_by_name',
            'delivery_notes', 'delivery_photos', 'customer_confirmed_at',
            'customer_rating', 'customer_notes', 'would_recommend',
            'dispute_raised', 'dispute_reason', 'dispute_resolved',
            'dispute_resolved_at', 'is_fully_confirmed', 'days_since_delivery',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'delivered_by', 'delivered_by_name', 'customer_confirmed_at',
            'dispute_resolved', 'dispute_resolved_at', 'is_fully_confirmed',
            'days_since_delivery', 'created_at', 'updated_at'
        ]


class PaymentSerializer(serializers.ModelSerializer):
    """
    ENHANCED SERIALIZER: Serializer for payments with comprehensive payment support
    
    Purpose: Handle payment data for all payment types including cash and vouchers
    Impact: Enhanced serializer - adds comprehensive payment tracking and voucher integration
    
    This serializer now properly handles cash payments and voucher discounts.
    """
    payment_method_details = PaymentMethodSerializer(source='payment_method', read_only=True)
    amount_in_paisa = serializers.ReadOnlyField()
    is_digital_payment = serializers.ReadOnlyField()
    requires_verification = serializers.ReadOnlyField()
    can_be_refunded = serializers.ReadOnlyField()
    cash_collected_by_name = serializers.CharField(source='cash_collected_by.get_full_name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    
    # === VOUCHER INTEGRATION FIELDS ===
    applied_voucher_details = serializers.SerializerMethodField()
    has_voucher = serializers.SerializerMethodField()
    voucher_savings = serializers.DecimalField(source='voucher_discount', max_digits=10, decimal_places=2, read_only=True)
    
    def get_applied_voucher_details(self, obj):
        """Get details of applied voucher"""
        if obj.applied_voucher:
            return {
                'code': obj.applied_voucher.voucher_code,
                'discount': float(obj.voucher_discount),
                'status': obj.applied_voucher.status
            }
        return None
    
    def get_has_voucher(self, obj):
        """Check if payment has voucher applied"""
        return obj.applied_voucher is not None
    
    class Meta:
        model = Payment
        fields = [
            # EXISTING FIELDS (maintained for backward compatibility)
            'id', 'payment_id', 'booking', 'payment_method', 'payment_method_details',
            'amount', 'processing_fee', 'total_amount', 'amount_in_paisa',
            'khalti_token', 'khalti_transaction_id', 'transaction_id',
            'status', 'paid_at', 'created_at', 'updated_at',
            
            # ENHANCED FIELDS (new payment tracking)
            'payment_type', 'is_cash_payment', 'cash_collected_at', 'cash_collected_by',
            'cash_collected_by_name', 'is_verified', 'verified_at', 'verified_by',
            'verified_by_name', 'payment_attempts', 'last_payment_attempt',
            'failure_reason', 'refund_amount', 'refund_reason', 'refunded_at',
            'refunded_by', 'is_digital_payment', 'requires_verification', 'can_be_refunded',
            
            # === VOUCHER INTEGRATION FIELDS ===
            'voucher_discount', 'applied_voucher', 'original_amount',
            'applied_voucher_details', 'has_voucher', 'voucher_savings'
        ]
        read_only_fields = [
            'payment_id', 'transaction_id', 'khalti_transaction_id', 
            'paid_at', 'created_at', 'updated_at', 'cash_collected_by_name',
            'verified_by_name', 'is_digital_payment', 'requires_verification', 'can_be_refunded',
            'applied_voucher_details', 'has_voucher', 'voucher_savings'
        ]


class VoucherApplicationSerializer(serializers.Serializer):
    """
    PHASE 2.4 NEW SERIALIZER: Apply voucher to payment
    
    Purpose: Handle voucher application during checkout process
    Impact: New functionality - enables voucher discounts in checkout
    """
    voucher_code = serializers.CharField(
        max_length=20, 
        help_text="Voucher code to apply for discount"
    )
    
    def validate_voucher_code(self, value):
        """Validate voucher code exists and is usable"""
        from apps.rewards.models import RewardVoucher
        
        try:
            voucher = RewardVoucher.objects.get(voucher_code=value)
            if not voucher.is_valid:
                raise serializers.ValidationError("Voucher is not valid for use")
            return value
        except RewardVoucher.DoesNotExist:
            raise serializers.ValidationError("Invalid voucher code")


class CheckoutCalculationSerializer(serializers.Serializer):
    """
    PHASE 2.4 NEW SERIALIZER: Calculate checkout totals with voucher
    
    Purpose: Calculate payment amounts including voucher discounts
    Impact: New functionality - provides accurate checkout calculations
    """
    voucher_code = serializers.CharField(
        max_length=20, 
        required=False,
        help_text="Optional voucher code for discount calculation"
    )
    
    def validate_voucher_code(self, value):
        """Validate voucher code if provided"""
        if value:
            from apps.rewards.models import RewardVoucher
            
            try:
                voucher = RewardVoucher.objects.get(voucher_code=value)
                if not voucher.is_valid:
                    raise serializers.ValidationError("Voucher is not valid for use")
            except RewardVoucher.DoesNotExist:
                raise serializers.ValidationError("Invalid voucher code")
        return value


class BookingSerializer(serializers.ModelSerializer):
    """
    EXISTING SERIALIZER WITH PHASE 1 ENHANCEMENTS:
    - Preserves all existing functionality
    - Adds new Phase 1 fields
    - Maintains backward compatibility
    """
    service_details = ServiceSerializer(source='service', read_only=True)
    customer_details = UserSerializer(source='customer', read_only=True)
    booking_slot_details = BookingSlotSerializer(source='booking_slot', read_only=True)
    payment_details = PaymentSerializer(source='payment', read_only=True)
    service_delivery_details = ServiceDeliverySerializer(source='service_delivery', read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            # EXISTING FIELDS (unchanged)
            'id', 'customer', 'customer_details', 'service', 'service_details',
            'booking_date', 'booking_time', 'address', 'city', 'phone',
            'status', 'price', 'discount', 'total_amount', 'cancellation_reason',
            'rejection_reason', 'reschedule_reason', 'reschedule_history', 'created_at', 'updated_at',
            
            # PHASE 1 NEW FIELDS
            'booking_step', 'booking_slot', 'booking_slot_details', 
            'special_instructions', 'estimated_duration', 'preferred_provider_gender',
            'is_recurring', 'recurring_frequency', 'payment_details',
            
            # EXPRESS BOOKING FIELDS
            'is_express_booking', 'express_fee',
            
            # SERVICE DELIVERY TRACKING (NEW)
            'service_delivery_details'
        ]
        read_only_fields = ['customer', 'status', 'created_at', 'updated_at', 'payment_details']
    
    def create(self, validated_data):
        """
        EXISTING LOGIC (preserved) + PHASE 1 ENHANCEMENTS + PAST SLOT VALIDATION
        """
        # EXISTING LOGIC: Set the price from the service
        service = validated_data.get('service')
        validated_data['price'] = service.discount_price if service.discount_price else service.price
        validated_data['total_amount'] = validated_data['price'] - validated_data.get('discount', 0)
        
        # NEW VALIDATION: Prevent booking past slots for today
        from django.utils import timezone
        from datetime import date
        booking_date = validated_data.get('booking_date')
        booking_time = validated_data.get('booking_time')
        booking_slot = validated_data.get('booking_slot')
        
        # Check if booking is for today
        today = timezone.now().date()
        if booking_date == today:
            # Get current time
            current_time = timezone.now().time()
            
            # If booking_slot is provided, check its end time
            if booking_slot:
                # Check if slot end time is in the past
                if booking_slot.end_time <= current_time:
                    from rest_framework import serializers
                    raise serializers.ValidationError({
                        'booking_slot': 'Cannot book past time slots for today. Please select a future time slot.'
                    })
            # If booking_time is provided directly (legacy), check it
            elif booking_time:
                # Compare with current time
                if booking_time <= current_time:
                    from rest_framework import serializers
                    raise serializers.ValidationError({
                        'booking_time': 'Cannot book past time slots for today. Please select a future time.'
                    })
        
        return super().create(validated_data)
    
    def to_representation(self, instance):
        """
        ENHANCED REPRESENTATION: Add backward compatibility and enhanced status info
        
        This method ensures backward compatibility while providing enhanced
        status information for the new service delivery workflow.
        """
        data = super().to_representation(instance)
        
        # Add backward compatibility mapping for status
        status_mapping = {
            'payment_pending': 'pending',
            'service_delivered': 'confirmed',  # Show as confirmed until customer confirms
            'awaiting_confirmation': 'confirmed',
            'completed': 'completed',  # Only true completed status
            'disputed': 'cancelled',
        }
        
        # Add legacy status for backward compatibility
        if instance.status in status_mapping:
            data['legacy_status'] = status_mapping[instance.status]
        else:
            data['legacy_status'] = instance.status
        
        # Add enhanced status information
        data['status_info'] = {
            'current_status': instance.status,
            'booking_step': instance.booking_step,
            'is_payment_completed': instance.status in ['confirmed', 'service_delivered', 'awaiting_confirmation', 'completed'],
            'is_service_delivered': instance.status in ['service_delivered', 'awaiting_confirmation', 'completed'],
            'is_fully_completed': instance.status == 'completed',
            'requires_customer_confirmation': instance.status == 'service_delivered',
            'can_mark_delivered': instance.status == 'confirmed',
            'can_confirm_completion': instance.status == 'service_delivered'
        }
        
        return data


class BookingWizardSerializer(serializers.ModelSerializer):
    """
    PHASE 1 NEW SERIALIZER: Serializer for booking wizard step-by-step process
    
    Purpose: Handle multi-step booking creation with validation at each step
    Impact: New serializer - enhances booking process without breaking existing flow
    """
    service_details = ServiceSerializer(source='service', read_only=True)
    available_slots = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = [
            'id', 'service', 'service_details', 'booking_date', 'booking_time',
            'address', 'city', 'phone', 'special_instructions', 'booking_step',
            'preferred_provider_gender', 'is_recurring', 'recurring_frequency',
            'available_slots', 'price', 'total_amount'
        ]
        read_only_fields = ['price', 'total_amount', 'available_slots']
    
    def get_available_slots(self, obj):
        """Get available slots for the selected service and date"""
        if obj.service and obj.booking_date:
            slots = BookingSlot.objects.filter(
                service=obj.service,
                date=obj.booking_date,
                is_available=True
            ).exclude(current_bookings__gte=models.F('max_bookings'))
            return BookingSlotSerializer(slots, many=True).data
        return []
    
    def validate(self, attrs):
        """Validate booking data based on current step"""
        booking_step = attrs.get('booking_step', 'service_selection')
        
        if booking_step == 'datetime_selection':
            if not attrs.get('booking_date') or not attrs.get('booking_time'):
                raise serializers.ValidationError("Date and time are required for this step")
            
            # NEW VALIDATION: Prevent booking past slots for today
            from django.utils import timezone
            from datetime import date
            booking_date = attrs.get('booking_date')
            booking_time = attrs.get('booking_time')
            
            # Check if booking is for today
            today = timezone.now().date()
            if booking_date == today:
                # Get current time
                current_time = timezone.now().time()
                
                # Compare with current time
                if booking_time <= current_time:
                    raise serializers.ValidationError({
                        'booking_time': 'Cannot book past time slots for today. Please select a future time.'
                    })
        
        elif booking_step == 'details_input':
            if not attrs.get('address') or not attrs.get('phone'):
                raise serializers.ValidationError("Address and phone are required for this step")
        
        return attrs


class BookingStatusUpdateSerializer(serializers.ModelSerializer):
    """
    EXISTING SERIALIZER (unchanged)
    
    Purpose: Handle booking status updates
    Impact: No changes - maintains existing functionality
    """
    class Meta:
        model = Booking
        fields = ['status', 'cancellation_reason', 'rejection_reason']
    
    def validate(self, attrs):
        status = attrs.get('status')
        cancellation_reason = attrs.get('cancellation_reason')
        rejection_reason = attrs.get('rejection_reason')
        
        # Validate that cancellation reason is provided when cancelling
        if status == 'cancelled' and not cancellation_reason:
            raise serializers.ValidationError({"cancellation_reason": "Cancellation reason is required"})
            
        # Validate that rejection reason is provided when rejecting
        if status == 'rejected' and not rejection_reason:
            raise serializers.ValidationError({"rejection_reason": "Rejection reason is required"})
            
        return attrs


class ServiceDeliveryMarkSerializer(serializers.Serializer):
    """
    NEW SERIALIZER: Handle service delivery marking by providers
    
    Purpose: Validate service delivery data when providers mark service as delivered
    Impact: New serializer - enables proper service delivery verification
    """
    delivery_notes = serializers.CharField(
        max_length=1000, 
        required=False, 
        allow_blank=True,
        help_text="Provider's notes about service delivery"
    )
    delivery_photos = serializers.ListField(
        child=serializers.CharField(max_length=500),
        required=False,
        allow_empty=True,
        help_text="List of photo URLs/paths of completed service"
    )
    
    def validate_delivery_notes(self, value):
        """Validate delivery notes length"""
        if value and len(value.strip()) < 10:
            raise serializers.ValidationError("Delivery notes should be at least 10 characters long")
        return value.strip() if value else ""


class ServiceCompletionConfirmSerializer(serializers.Serializer):
    """
    NEW SERIALIZER: Handle service completion confirmation by customers
    
    Purpose: Validate customer confirmation data for service completion
    Impact: New serializer - ensures proper customer verification
    """
    customer_rating = serializers.IntegerField(
        min_value=1, 
        max_value=5, 
        help_text="Customer satisfaction rating (1-5 stars)"
    )
    customer_notes = serializers.CharField(
        max_length=1000, 
        required=False, 
        allow_blank=True,
        help_text="Customer's feedback about the service"
    )
    would_recommend = serializers.BooleanField(
        help_text="Would customer recommend this provider"
    )
    
    def validate_customer_notes(self, value):
        """Validate customer notes length"""
        if value and len(value.strip()) < 5:
            raise serializers.ValidationError("Customer notes should be at least 5 characters long")
        return value.strip() if value else ""


class CashPaymentProcessSerializer(serializers.Serializer):
    """
    NEW SERIALIZER: Handle cash payment processing
    
    Purpose: Validate cash payment data when processing cash payments
    Impact: New serializer - enables proper cash payment tracking
    """
    amount_collected = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        min_value=0.01,
        help_text="Amount of cash collected from customer"
    )
    collection_notes = serializers.CharField(
        max_length=500, 
        required=False, 
        allow_blank=True,
        help_text="Notes about cash collection"
    )
    
    def validate_amount_collected(self, value):
        """Validate amount is reasonable"""
        if value <= 0:
            raise serializers.ValidationError("Amount collected must be positive")
        if value > 100000:  # 1 lakh max
            raise serializers.ValidationError("Amount collected seems too high")
        return value


class KhaltiPaymentSerializer(serializers.Serializer):
    """
    PHASE 1 NEW SERIALIZER: Handle Khalti payment verification
    
    Purpose: Validate Khalti payment tokens and amounts
    Impact: New serializer - adds Khalti payment processing
    """
    token = serializers.CharField(max_length=200, help_text="Khalti payment token")
    amount = serializers.IntegerField(help_text="Payment amount in paisa")
    booking_id = serializers.IntegerField(help_text="Booking ID for payment")
    
    def validate_amount(self, value):
        """Validate amount is positive"""
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive")
        return value
    
    def validate_booking_id(self, value):
        """Validate booking exists and belongs to current user"""
        try:
            booking = Booking.objects.get(id=value)
            # Additional validation can be added here
            return value
        except Booking.DoesNotExist:
            raise serializers.ValidationError("Invalid booking ID")

# ===== NEW PROVIDER DASHBOARD SERIALIZERS =====

from .models import ProviderAnalytics, ProviderEarnings, ProviderSchedule, ProviderCustomerRelation


class ProviderAnalyticsSerializer(serializers.ModelSerializer):
    """
    NEW SERIALIZER: Serializer for provider analytics data
    
    Purpose: Handle provider performance analytics data
    Impact: New serializer - enables analytics API endpoints
    """
    provider_name = serializers.CharField(source='provider.get_full_name', read_only=True)
    
    class Meta:
        model = ProviderAnalytics
        fields = [
            'id', 'provider', 'provider_name', 'date',
            'bookings_count', 'confirmed_bookings', 'completed_bookings', 'cancelled_bookings',
            'gross_revenue', 'net_revenue', 'platform_fees',
            'average_rating', 'response_time_hours', 'completion_rate',
            'new_customers', 'returning_customers',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'provider_name']


class ProviderEarningsSerializer(serializers.ModelSerializer):
    """
    NEW SERIALIZER: Serializer for provider earnings data
    
    Purpose: Handle provider earnings and payout information
    Impact: New serializer - enables financial API endpoints
    """
    provider_name = serializers.CharField(source='provider.get_full_name', read_only=True)
    booking_details = serializers.SerializerMethodField()
    is_paid = serializers.ReadOnlyField()
    days_since_earned = serializers.ReadOnlyField()
    
    class Meta:
        model = ProviderEarnings
        fields = [
            'id', 'provider', 'provider_name', 'booking', 'booking_details',
            'gross_amount', 'platform_fee_percentage', 'platform_fee', 'net_amount',
            'payout_status', 'payout_date', 'payout_reference', 'payout_method',
            'is_paid', 'days_since_earned', 'notes',
            'earned_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'platform_fee', 'net_amount', 'is_paid', 'days_since_earned',
            'earned_at', 'created_at', 'updated_at', 'provider_name'
        ]
    
    def get_booking_details(self, obj):
        """Get basic booking information"""
        return {
            'id': obj.booking.id,
            'service_title': obj.booking.service.title,
            'customer_name': obj.booking.customer.get_full_name(),
            'booking_date': obj.booking.booking_date,
            'status': obj.booking.status
        }


class ProviderScheduleSerializer(serializers.ModelSerializer):
    """
    NEW SERIALIZER: Serializer for provider schedule data
    
    Purpose: Handle provider availability and schedule management
    Impact: New serializer - enables schedule API endpoints
    """
    provider_name = serializers.CharField(source='provider.get_full_name', read_only=True)
    is_blocked = serializers.ReadOnlyField()
    duration_hours = serializers.ReadOnlyField()
    
    class Meta:
        model = ProviderSchedule
        fields = [
            'id', 'provider', 'provider_name', 'date',
            'start_time', 'end_time', 'is_all_day',
            'schedule_type', 'max_bookings', 'title', 'notes',
            'is_recurring', 'recurring_pattern', 'recurring_until',
            'is_blocked', 'duration_hours',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'is_blocked', 'duration_hours', 'created_at', 'updated_at', 'provider_name'
        ]
    
    def validate(self, data):
        """Validate schedule data"""
        if not data.get('is_all_day'):
            if not data.get('start_time') or not data.get('end_time'):
                raise serializers.ValidationError(
                    "Start time and end time are required for non-all-day schedules"
                )
        
        if data.get('is_recurring') and not data.get('recurring_pattern'):
            raise serializers.ValidationError(
                "Recurring pattern is required for recurring schedules"
            )
        
        return data


class ProviderCustomerRelationSerializer(serializers.ModelSerializer):
    """
    NEW SERIALIZER: Serializer for provider-customer relationship data
    
    Purpose: Handle provider-customer relationship information
    Impact: New serializer - enables customer management API endpoints
    """
    provider_name = serializers.CharField(source='provider.get_full_name', read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    customer_status = serializers.ReadOnlyField()
    days_since_last_booking = serializers.ReadOnlyField()
    
    class Meta:
        model = ProviderCustomerRelation
        fields = [
            'id', 'provider', 'provider_name', 'customer', 'customer_name',
            'customer_email', 'customer_phone',
            'total_bookings', 'total_spent', 'average_rating',
            'is_favorite_customer', 'is_blocked', 'customer_status',
            'first_booking_date', 'last_booking_date', 'days_since_last_booking',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'total_bookings', 'total_spent', 'average_rating',
            'first_booking_date', 'last_booking_date', 'customer_status',
            'days_since_last_booking', 'created_at', 'updated_at',
            'provider_name', 'customer_name', 'customer_email', 'customer_phone'
        ]


class ProviderDashboardStatsSerializer(serializers.Serializer):
    """
    NEW SERIALIZER: Serializer for provider dashboard statistics
    
    Purpose: Handle comprehensive dashboard statistics for providers
    Impact: New serializer - enables dashboard API endpoint
    """
    # Basic stats
    totalBookings = serializers.IntegerField()
    upcomingBookings = serializers.IntegerField()
    completedBookings = serializers.IntegerField()
    totalEarnings = serializers.DecimalField(max_digits=10, decimal_places=2)
    thisMonthEarnings = serializers.DecimalField(max_digits=10, decimal_places=2)
    pendingEarnings = serializers.DecimalField(max_digits=10, decimal_places=2)
    averageRating = serializers.DecimalField(max_digits=3, decimal_places=2)
    servicesCount = serializers.IntegerField()
    memberSince = serializers.CharField()
    lastBooking = serializers.CharField()
    
    # Earnings breakdown
    earnings = serializers.DictField()
    
    # Performance metrics
    performance = serializers.DictField()


class ProviderBookingGroupsSerializer(serializers.Serializer):
    """
    NEW SERIALIZER: Serializer for grouped provider bookings
    
    Purpose: Handle provider bookings grouped by status
    Impact: New serializer - enhances provider booking management
    """
    count = serializers.IntegerField()
    next = serializers.URLField(allow_null=True)
    previous = serializers.URLField(allow_null=True)
    pending = BookingSerializer(many=True)
    upcoming = BookingSerializer(many=True)
    completed = BookingSerializer(many=True)


class ProviderEarningsSummarySerializer(serializers.Serializer):
    """
    NEW SERIALIZER: Serializer for provider earnings summary
    
    Purpose: Handle provider earnings summary and trends
    Impact: New serializer - enables financial dashboard
    """
    summary = serializers.DictField()
    monthlyTrends = serializers.ListField()
    recentTransactions = ProviderEarningsSerializer(many=True)
    payoutHistory = serializers.ListField()


class ProviderAnalyticsResponseSerializer(serializers.Serializer):
    """
    NEW SERIALIZER: Serializer for provider analytics response
    
    Purpose: Handle provider analytics and performance data
    Impact: New serializer - enables analytics dashboard
    """
    period = serializers.CharField()
    dateRange = serializers.DictField()
    revenue = serializers.DictField()
    bookings = serializers.DictField()
    customers = serializers.DictField()
    performance = serializers.DictField()
    topServices = serializers.ListField()


class ProviderCustomerListSerializer(serializers.Serializer):
    """
    NEW SERIALIZER: Serializer for provider customer list
    
    Purpose: Handle provider's customer list with relationship data
    Impact: New serializer - enables customer management
    """
    count = serializers.IntegerField()
    results = ProviderCustomerRelationSerializer(many=True)


class ProviderScheduleResponseSerializer(serializers.Serializer):
    """
    NEW SERIALIZER: Serializer for provider schedule response
    
    Purpose: Handle provider schedule and availability data
    Impact: New serializer - enables schedule management
    """
    workingHours = serializers.DictField()
    breakTime = serializers.DictField()
    availability = serializers.ListField()
    blockedTimes = ProviderScheduleSerializer(many=True)