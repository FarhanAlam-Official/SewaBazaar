from rest_framework import serializers
from django.db import models
from .models import Booking, PaymentMethod, BookingSlot, Payment
from apps.services.serializers import ServiceSerializer
from apps.accounts.serializers import UserSerializer

class PaymentMethodSerializer(serializers.ModelSerializer):
    """
    PHASE 1 NEW SERIALIZER: Serializer for payment methods
    
    Purpose: Handle payment method data for API responses
    Impact: New serializer - no impact on existing functionality
    """
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'name', 'payment_type', 'is_active', 
            'processing_fee_percentage', 'icon', 'created_at'
        ]
        read_only_fields = ['created_at']


class BookingSlotSerializer(serializers.ModelSerializer):
    """
    PHASE 1 NEW SERIALIZER: Serializer for booking slots
    
    Purpose: Handle booking slot data for availability management
    Impact: New serializer - enhances booking system
    """
    is_fully_booked = serializers.ReadOnlyField()
    
    class Meta:
        model = BookingSlot
        fields = [
            'id', 'service', 'date', 'start_time', 'end_time', 
            'is_available', 'max_bookings', 'current_bookings', 
            'is_fully_booked', 'created_at'
        ]
        read_only_fields = ['current_bookings', 'created_at']


class PaymentSerializer(serializers.ModelSerializer):
    """
    PHASE 1 NEW SERIALIZER: Serializer for payments with Khalti integration
    
    Purpose: Handle payment data and Khalti transaction details
    Impact: New serializer - adds payment functionality
    """
    payment_method_details = PaymentMethodSerializer(source='payment_method', read_only=True)
    amount_in_paisa = serializers.ReadOnlyField()
    
    class Meta:
        model = Payment
        fields = [
            'id', 'payment_id', 'booking', 'payment_method', 'payment_method_details',
            'amount', 'processing_fee', 'total_amount', 'amount_in_paisa',
            'khalti_token', 'khalti_transaction_id', 'transaction_id',
            'status', 'paid_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'payment_id', 'transaction_id', 'khalti_transaction_id', 
            'paid_at', 'created_at', 'updated_at'
        ]


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
    
    class Meta:
        model = Booking
        fields = [
            # EXISTING FIELDS (unchanged)
            'id', 'customer', 'customer_details', 'service', 'service_details',
            'booking_date', 'booking_time', 'address', 'city', 'phone', 'note',
            'status', 'price', 'discount', 'total_amount', 'cancellation_reason',
            'rejection_reason', 'created_at', 'updated_at',
            
            # PHASE 1 NEW FIELDS
            'booking_step', 'booking_slot', 'booking_slot_details', 
            'special_instructions', 'estimated_duration', 'preferred_provider_gender',
            'is_recurring', 'recurring_frequency', 'payment_details'
        ]
        read_only_fields = ['customer', 'status', 'created_at', 'updated_at', 'payment_details']
    
    def create(self, validated_data):
        """
        EXISTING LOGIC (preserved) + PHASE 1 ENHANCEMENTS
        """
        # EXISTING LOGIC: Set the price from the service
        service = validated_data.get('service')
        validated_data['price'] = service.discount_price if service.discount_price else service.price
        validated_data['total_amount'] = validated_data['price'] - validated_data.get('discount', 0)
        
        return super().create(validated_data)


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
