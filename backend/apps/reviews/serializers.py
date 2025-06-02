from rest_framework import serializers
from .models import Review
from apps.accounts.serializers import UserSerializer

class ReviewSerializer(serializers.ModelSerializer):
    customer_details = UserSerializer(source='customer', read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'customer', 'customer_details', 'service', 'rating', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['customer', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        # Check if the user has already reviewed this service
        request = self.context.get('request')
        if request and request.method == 'POST':
            customer = request.user
            service = attrs.get('service')
            
            if Review.objects.filter(customer=customer, service=service).exists():
                raise serializers.ValidationError("You have already reviewed this service")
                
        return attrs
