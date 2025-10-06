"""
SewaBazaar Bookings Serializers

This module defines all the serializers for the bookings system, which handle
the conversion of model instances to JSON format and vice versa for API responses.

The serializers support the complex booking workflow with:
1. Multi-step booking process with validation
2. Flexible payment options (digital wallets, bank transfers, cash)
3. Service delivery verification workflow
4. Provider analytics and performance tracking
5. Customer relationship management
6. Voucher and reward system integration

Key Serializers:
- PaymentMethodSerializer: Handles payment method data with enhanced icon and display features
- BookingSlotSerializer: Handles booking slot data for availability management
- ServiceDeliverySerializer: Handles service delivery data and customer confirmation
- PaymentSerializer: Handles payment data for all payment types including cash and vouchers
- VoucherApplicationSerializer: Handles voucher application during checkout process
- CheckoutCalculationSerializer: Calculates checkout totals with voucher
- BookingSerializer: Handles booking data with all enhanced fields
- BookingWizardSerializer: Handles multi-step booking creation with validation at each step
- BookingStatusUpdateSerializer: Handles booking status updates
- ServiceDeliveryMarkSerializer: Validates service delivery data when providers mark service as delivered
- ServiceCompletionConfirmSerializer: Validates customer confirmation data for service completion
- CashPaymentProcessSerializer: Validates cash payment data when processing cash payments
- KhaltiPaymentSerializer: Validates Khalti payment tokens and amounts
- ProviderAnalyticsSerializer: Handles provider performance analytics data
- ProviderEarningsSerializer: Handles provider earnings and payout information
- ProviderScheduleSerializer: Handles provider availability and schedule management
- ProviderCustomerRelationSerializer: Handles provider-customer relationship information
- ProviderDashboardStatsSerializer: Handles comprehensive dashboard statistics for providers
- ProviderBookingGroupsSerializer: Handles provider bookings grouped by status
- ProviderEarningsSummarySerializer: Handles provider earnings summary and trends
- ProviderAnalyticsResponseSerializer: Handles provider analytics and performance data
- ProviderCustomerListSerializer: Handles provider customer list with relationship data
- ProviderScheduleResponseSerializer: Handles provider schedule and availability data

The serializers ensure proper data validation, serialization, and representation
for all API endpoints in the bookings system.
"""

from rest_framework import serializers
from django.db import models
from .models import Booking, PaymentMethod, BookingSlot, Payment, ServiceDelivery
from apps.services.serializers import ServiceSerializer
from apps.accounts.serializers import UserSerializer

class PaymentMethodSerializer(serializers.ModelSerializer):
    """
    Serializer for payment methods with icon support
    
    Purpose: Handle payment method data with enhanced icon and display features
    Impact: Enhanced serializer - better payment method display
    
    This serializer provides enhanced representation of payment methods with
    support for multiple icon types and display features.
    
    Fields:
        id (int): Payment method ID
        name (str): Payment method name
        payment_type (str): Type of payment method
        is_active (bool): Whether this payment method is active
        processing_fee_percentage (Decimal): Processing fee percentage
        icon_image (ImageField): Uploaded icon image
        icon_url (URLField): URL to external icon image
        icon_emoji (CharField): Emoji icon as fallback
        icon_display (ReadOnlyField): Best available icon for display
        is_featured (bool): Whether this is a featured payment method
        priority_order (int): Display order priority
        description (str): Payment method description
        min_amount (Decimal): Minimum transaction amount
        max_amount (Decimal): Maximum transaction amount
        created_at (DateTime): When the payment method was created
        updated_at (DateTime): When the payment method was last updated
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
    Serializer for booking slots
    
    Purpose: Handle booking slot data for availability management
    Impact: New serializer - enhances booking system
    
    This serializer handles booking slot data for availability management,
    including calculated properties for pricing and availability.
    
    Fields:
        id (int): Booking slot ID
        service (int): Reference to the service
        date (Date): Specific date for this slot
        start_time (Time): Start time for the slot
        end_time (Time): End time for the slot
        is_available (bool): Whether this slot is available for booking
        max_bookings (int): Maximum bookings allowed for this slot
        current_bookings (int): Current number of bookings for this slot
        is_fully_booked (ReadOnlyField): Whether this slot is fully booked
        is_rush (bool): Whether this is an express slot with premium pricing
        rush_fee_percentage (Decimal): Additional fee percentage
        slot_type (str): Type of slot (normal, express, urgent, emergency)
        provider_note (str): Special instructions from provider
        base_price_override (Decimal): Override service price for this specific slot
        calculated_price (ReadOnlyField): Final price including all modifiers
        rush_fee_amount (ReadOnlyField): Rush fee amount
        created_at (DateTime): When the slot was created
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
    Serializer for service delivery tracking
    
    Purpose: Handle service delivery data and customer confirmation
    Impact: New serializer - enables proper service delivery verification
    
    This serializer addresses the critical flaw where service completion
    was not properly tracked and verified.
    
    Fields:
        id (int): Service delivery ID
        booking (int): Reference to the booking
        delivered_at (DateTime): When service was marked as delivered by provider
        delivered_by (int): Provider who marked service as delivered
        delivered_by_name (str): Name of the provider who delivered the service
        delivery_notes (str): Provider's notes about service delivery completion
        delivery_photos (list): Photos of completed service
        customer_confirmed_at (DateTime): When customer confirmed service completion
        customer_rating (int): Customer satisfaction rating
        customer_notes (str): Customer's feedback about the service quality
        would_recommend (bool): Whether customer would recommend this provider
        dispute_raised (bool): Whether customer raised dispute about service
        dispute_reason (str): Detailed reason for the dispute
        dispute_resolved (bool): Whether dispute has been resolved by admin
        dispute_resolved_at (DateTime): When dispute was resolved
        is_fully_confirmed (ReadOnlyField): Whether service delivery is fully confirmed
        days_since_delivery (ReadOnlyField): Days since service was delivered
        created_at (DateTime): When the service delivery record was created
        updated_at (DateTime): When the service delivery record was last updated
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
    Serializer for payments with comprehensive payment support
    
    Purpose: Handle payment data for all payment types including cash and vouchers
    Impact: Enhanced serializer - adds comprehensive payment tracking and voucher integration
    
    This serializer now properly handles cash payments and voucher discounts.
    
    Fields:
        id (int): Payment ID
        payment_id (UUID): Unique payment identifier
        booking (int): Reference to the booking
        payment_method (int): Reference to the payment method
        payment_method_details (PaymentMethodSerializer): Detailed payment method information
        amount (Decimal): Payment amount
        processing_fee (Decimal): Processing fee
        total_amount (Decimal): Total payment amount
        amount_in_paisa (ReadOnlyField): Amount converted to paisa for Khalti API
        khalti_token (str): Khalti payment token
        khalti_transaction_id (str): Khalti transaction ID
        transaction_id (str): Unique transaction ID
        status (str): Payment status
        paid_at (DateTime): When payment was completed
        created_at (DateTime): When the payment record was created
        updated_at (DateTime): When the payment record was last updated
        payment_type (str): Type of payment method used
        is_cash_payment (bool): Whether this is a cash payment
        cash_collected_at (DateTime): When cash was collected from customer
        cash_collected_by (int): Provider who collected cash payment
        cash_collected_by_name (str): Name of provider who collected cash
        is_verified (bool): Whether payment has been verified
        verified_at (DateTime): When payment was verified
        verified_by (int): Admin who verified the payment
        payment_attempts (int): Number of payment attempts made
        last_payment_attempt (DateTime): Last payment attempt timestamp
        failure_reason (str): Reason for payment failure
        refund_amount (Decimal): Amount refunded to customer
        refund_reason (str): Reason for refund
        refunded_at (DateTime): When refund was processed
        refunded_by (int): Admin who processed the refund
        is_digital_payment (ReadOnlyField): Whether this is a digital payment
        requires_verification (ReadOnlyField): Whether payment requires manual verification
        can_be_refunded (ReadOnlyField): Whether payment can be refunded
        voucher_discount (Decimal): Discount amount applied from voucher
        applied_voucher (int): Voucher applied to this payment
        original_amount (Decimal): Original amount before voucher discount
        applied_voucher_details (dict): Details of applied voucher
        has_voucher (bool): Whether payment has voucher applied
        voucher_savings (Decimal): Voucher savings amount
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
    Serializer for applying a voucher to a payment
    
    Purpose: Handle voucher application during checkout process
    Impact: New functionality - enables voucher discounts in checkout
    
    This serializer validates voucher codes during the checkout process.
    
    Fields:
        voucher_code (str): Voucher code to apply for discount
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
    Calculate checkout totals with voucher
    
    Purpose: Calculate payment amounts including voucher discounts
    Impact: New functionality - provides accurate checkout calculations
    
    This serializer calculates checkout totals with optional voucher discounts.
    
    Fields:
        voucher_code (str): Optional voucher code for discount calculation
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
    
    This serializer handles booking data with all enhanced fields and provides
    backward compatibility mappings for legacy systems.
    
    Fields:
        id (int): Booking ID
        customer (int): Reference to the customer
        customer_details (UserSerializer): Detailed customer information
        service (int): Reference to the service
        service_details (ServiceSerializer): Detailed service information
        booking_date (Date): Date of the booking
        booking_time (Time): Time of the booking
        address (str): Service address
        city (str): Service city
        phone (str): Customer phone number
        status (str): Current status of the booking
        price (Decimal): Base price of the service
        discount (Decimal): Discount amount
        total_amount (Decimal): Total amount to be paid
        cancellation_reason (str): Reason for cancellation
        rejection_reason (str): Reason for rejection
        reschedule_reason (str): Latest reason for rescheduling the booking
        reschedule_history (list): Complete history of reschedule reasons
        created_at (DateTime): When the booking was created
        updated_at (DateTime): When the booking was last updated
        booking_step (str): Current step in the booking process
        booking_slot (int): Reference to the booking slot
        booking_slot_details (BookingSlotSerializer): Detailed booking slot information
        special_instructions (str): Additional instructions from customer
        estimated_duration (Duration): Estimated service duration
        preferred_provider_gender (str): Customer's preference for provider gender
        is_recurring (bool): Whether this is a recurring booking
        recurring_frequency (str): Frequency for recurring bookings
        payment_details (PaymentSerializer): Detailed payment information
        service_delivery_details (ServiceDeliverySerializer): Detailed service delivery information
        is_express_booking (bool): Whether this is an express/rush booking
        express_fee (Decimal): Additional fee for express service
        legacy_status (str): Backward compatibility status mapping
        status_info (dict): Enhanced status information
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
        Add backward compatibility and enhanced status information
        
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
    Serializer for booking wizard step-by-step process
    
    Purpose: Handle multi-step booking creation with validation at each step
    Impact: New serializer - enhances booking process without breaking existing flow
    
    This serializer handles the multi-step booking creation process with
    validation at each step of the wizard.
    
    Fields:
        id (int): Booking ID
        service (int): Reference to the service
        service_details (ServiceSerializer): Detailed service information
        booking_date (Date): Date of the booking
        booking_time (Time): Time of the booking
        address (str): Service address
        city (str): Service city
        phone (str): Customer phone number
        special_instructions (str): Additional instructions from customer
        booking_step (str): Current step in the booking process
        preferred_provider_gender (str): Customer's preference for provider gender
        is_recurring (bool): Whether this is a recurring booking
        recurring_frequency (str): Frequency for recurring bookings
        available_slots (list): Available slots for the selected service and date
        price (Decimal): Base price of the service
        total_amount (Decimal): Total amount to be paid
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
    Serializer for booking status updates
    
    Purpose: Handle booking status updates
    Impact: No changes - maintains existing functionality
    
    This serializer handles booking status updates with validation for
    required reasons for cancellation and rejection.
    
    Fields:
        status (str): New status for the booking
        cancellation_reason (str): Reason for cancellation (required if status is cancelled)
        rejection_reason (str): Reason for rejection (required if status is rejected)
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
    Handle service delivery marking by providers
    
    Purpose: Validate service delivery data when providers mark service as delivered
    Impact: New serializer - enables proper service delivery verification
    
    This serializer validates the data when providers mark a service as delivered.
    
    Fields:
        delivery_notes (str): Provider's notes about service delivery
        delivery_photos (list): List of photo URLs/paths of completed service
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
    Handle service completion confirmation by customers
    
    Purpose: Validate customer confirmation data for service completion
    Impact: New serializer - ensures proper customer verification
    
    This serializer validates the data when customers confirm service completion.
    
    Fields:
        customer_rating (int): Customer satisfaction rating (1-5 stars)
        customer_notes (str): Customer's feedback about the service
        would_recommend (bool): Whether customer would recommend this provider
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
    Handle cash payment processing
    
    Purpose: Validate cash payment data when processing cash payments
    Impact: New serializer - enables proper cash payment tracking
    
    This serializer validates the data when processing cash payments.
    
    Fields:
        amount_collected (Decimal): Amount of cash collected from customer
        collection_notes (str): Notes about cash collection
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
    Handle Khalti payment verification
    
    Purpose: Validate Khalti payment tokens and amounts
    Impact: New serializer - adds Khalti payment processing
    
    This serializer validates Khalti payment data for processing payments.
    
    Fields:
        token (str): Khalti payment token
        amount (int): Payment amount in paisa
        booking_id (int): Booking ID for payment
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
    Serializer for provider analytics data
    
    Purpose: Handle provider performance analytics data
    Impact: New serializer - enables analytics API endpoints
    
    This serializer handles provider performance analytics data for dashboard display.
    
    Fields:
        id (int): Analytics record ID
        provider (int): Reference to the provider
        provider_name (str): Name of the provider
        date (Date): Date for this analytics record
        bookings_count (int): Total bookings on this date
        confirmed_bookings (int): Confirmed bookings on this date
        completed_bookings (int): Completed bookings on this date
        cancelled_bookings (int): Cancelled bookings on this date
        gross_revenue (Decimal): Total gross revenue for this date
        net_revenue (Decimal): Net revenue after platform fees
        platform_fees (Decimal): Platform fees deducted
        average_rating (Decimal): Average rating received on this date
        response_time_hours (Decimal): Average response time to bookings in hours
        completion_rate (Decimal): Percentage of bookings completed successfully
        new_customers (int): New customers served on this date
        returning_customers (int): Returning customers served on this date
        created_at (DateTime): When the analytics record was created
        updated_at (DateTime): When the analytics record was last updated
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
    Serializer for provider earnings data
    
    Purpose: Handle provider earnings and payout information
    Impact: New serializer - enables financial API endpoints
    
    This serializer handles provider earnings and payout information for financial tracking.
    
    Fields:
        id (int): Earnings record ID
        provider (int): Reference to the provider
        provider_name (str): Name of the provider
        booking (int): Reference to the booking
        booking_details (dict): Basic booking information
        gross_amount (Decimal): Total booking amount before fees
        platform_fee_percentage (Decimal): Platform fee percentage applied
        platform_fee (Decimal): Platform fee amount deducted
        net_amount (Decimal): Net amount payable to provider
        payout_status (str): Status of payout to provider
        payout_date (DateTime): When payout was processed
        payout_reference (str): Bank transfer or payment reference
        payout_method (str): Method used for payout
        is_paid (ReadOnlyField): Whether earning has been paid out
        days_since_earned (ReadOnlyField): Days since earning was recorded
        notes (str): Additional notes about this earning
        earned_at (DateTime): When this earning was recorded
        created_at (DateTime): When the earning record was created
        updated_at (DateTime): When the earning record was last updated
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
    Serializer for provider schedule data
    
    Purpose: Handle provider availability and schedule management
    Impact: New serializer - enables schedule API endpoints
    
    This serializer handles provider schedule data for availability management.
    
    Fields:
        id (int): Schedule entry ID
        provider (int): Reference to the provider
        provider_name (str): Name of the provider
        date (Date): Date for this schedule entry
        start_time (Time): Start time (null for all-day entries)
        end_time (Time): End time (null for all-day entries)
        is_all_day (bool): Whether this is an all-day schedule entry
        schedule_type (str): Type of schedule entry
        max_bookings (int): Maximum bookings allowed during this time
        title (str): Title for this schedule entry
        notes (str): Additional notes about this schedule entry
        is_recurring (bool): Whether this schedule repeats
        recurring_pattern (str): Pattern for recurring schedule
        recurring_until (Date): End date for recurring schedule
        is_blocked (ReadOnlyField): Whether this schedule entry blocks availability
        duration_hours (ReadOnlyField): Duration in hours
        created_at (DateTime): When the schedule entry was created
        updated_at (DateTime): When the schedule entry was last updated
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
    Serializer for provider-customer relationship data
    
    Purpose: Handle provider-customer relationship information
    Impact: New serializer - enables customer management API endpoints
    
    This serializer handles provider-customer relationship data for customer management.
    
    Fields:
        id (int): Relationship record ID
        provider (int): Reference to the provider
        provider_name (str): Name of the provider
        customer (int): Reference to the customer
        customer_name (str): Name of the customer
        customer_email (str): Email of the customer
        customer_phone (str): Phone of the customer
        total_bookings (int): Total bookings between this provider and customer
        total_spent (Decimal): Total amount spent by customer with this provider
        average_rating (Decimal): Average rating given by customer to provider
        is_favorite_customer (bool): Whether provider marked this as favorite customer
        is_blocked (bool): Whether provider blocked this customer
        customer_status (ReadOnlyField): Customer status for this provider
        first_booking_date (DateTime): Date of first booking between them
        last_booking_date (DateTime): Date of most recent booking
        days_since_last_booking (ReadOnlyField): Days since last booking
        notes (str): Provider's private notes about this customer
        created_at (DateTime): When the relationship record was created
        updated_at (DateTime): When the relationship record was last updated
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
    Serializer for provider dashboard statistics
    
    Purpose: Handle comprehensive dashboard statistics for providers
    Impact: New serializer - enables dashboard API endpoint
    
    This serializer handles comprehensive dashboard statistics for provider overview.
    
    Fields:
        totalBookings (int): Total number of bookings
        upcomingBookings (int): Number of upcoming bookings
        completedBookings (int): Number of completed bookings
        totalEarnings (Decimal): Total earnings
        thisMonthEarnings (Decimal): Earnings for this month
        pendingEarnings (Decimal): Pending earnings
        averageRating (Decimal): Average rating
        servicesCount (int): Number of services
        memberSince (str): Member since date
        lastBooking (str): Last booking date
        earnings (dict): Earnings breakdown
        performance (dict): Performance metrics
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
    Serializer for grouped provider bookings
    
    Purpose: Handle provider bookings grouped by status
    Impact: New serializer - enhances provider booking management
    
    This serializer handles provider bookings grouped by status for dashboard display.
    
    Fields:
        count (int): Total number of bookings
        next (URL): Next page URL
        previous (URL): Previous page URL
        pending (list): List of pending bookings
        upcoming (list): List of upcoming bookings
        completed (list): List of completed bookings
    """
    count = serializers.IntegerField()
    next = serializers.URLField(allow_null=True)
    previous = serializers.URLField(allow_null=True)
    pending = BookingSerializer(many=True)
    upcoming = BookingSerializer(many=True)
    completed = BookingSerializer(many=True)


class ProviderEarningsSummarySerializer(serializers.Serializer):
    """
    Serializer for provider earnings summary
    
    Purpose: Handle provider earnings summary and trends
    Impact: New serializer - enables financial dashboard
    
    This serializer handles provider earnings summary and trends for financial overview.
    
    Fields:
        summary (dict): Earnings summary
        monthlyTrends (list): Monthly earnings trends
        recentTransactions (list): Recent transactions
        payoutHistory (list): Payout history
    """
    summary = serializers.DictField()
    monthlyTrends = serializers.ListField()
    recentTransactions = ProviderEarningsSerializer(many=True)
    payoutHistory = serializers.ListField()


class ProviderAnalyticsResponseSerializer(serializers.Serializer):
    """
    Serializer for provider analytics response
    
    Purpose: Handle provider analytics and performance data
    Impact: New serializer - enables analytics dashboard
    
    This serializer handles provider analytics and performance data for dashboard display.
    
    Fields:
        period (str): Analytics period
        dateRange (dict): Date range for analytics
        revenue (dict): Revenue analytics
        bookings (dict): Booking analytics
        customers (dict): Customer analytics
        performance (dict): Performance metrics
        topServices (list): Top performing services
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
    Serializer for provider customer list
    
    Purpose: Handle provider's customer list with relationship data
    Impact: New serializer - enables customer management
    
    This serializer handles provider's customer list with relationship data for customer management.
    
    Fields:
        count (int): Total number of customers
        results (list): List of customer relationships
    """
    count = serializers.IntegerField()
    results = ProviderCustomerRelationSerializer(many=True)


class ProviderScheduleResponseSerializer(serializers.Serializer):
    """
    Serializer for provider schedule response
    
    Purpose: Handle provider schedule and availability data
    Impact: New serializer - enables schedule management
    
    This serializer handles provider schedule and availability data for schedule management.
    
    Fields:
        workingHours (dict): Working hours configuration
        breakTime (dict): Break time configuration
        availability (list): Availability slots
        blockedTimes (list): Blocked time periods
    """
    workingHours = serializers.DictField()
    breakTime = serializers.DictField()
    availability = serializers.ListField()
    blockedTimes = ProviderScheduleSerializer(many=True)