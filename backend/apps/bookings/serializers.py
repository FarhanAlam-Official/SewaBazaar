from rest_framework import serializers
from .models import Booking
from apps.services.serializers import ServiceSerializer
from apps.accounts.serializers import UserSerializer

class BookingSerializer(serializers.ModelSerializer):
    service_details = ServiceSerializer(source='service', read_only=True)
    customer_details = UserSerializer(source='customer', read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'customer', 'customer_details', 'service', 'service_details',
            'booking_date', 'booking_time', 'address', 'city', 'phone', 'note',
            'status', 'price', 'discount', 'total_amount', 'cancellation_reason',
            'rejection_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['customer', 'status', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Set the price from the service
        service = validated_data.get('service')
        validated_data['price'] = service.discount_price if service.discount_price else service.price
        validated_data['total_amount'] = validated_data['price'] - validated_data.get('discount', 0)
        
        return super().create(validated_data)

class BookingStatusUpdateSerializer(serializers.ModelSerializer):
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
