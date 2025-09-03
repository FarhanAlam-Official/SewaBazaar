"""
PHASE 2 NEW FILE: Serializers for public provider profiles and reviews

Purpose: Handle API serialization for provider profiles and gated reviews
Impact: New serializers - support public provider profiles and review system
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Review
from .services import ReviewEligibilityService, ReviewAnalyticsService
from apps.accounts.models import Profile, PortfolioMedia
from apps.bookings.models import Booking

User = get_user_model()


class CustomerSummarySerializer(serializers.ModelSerializer):
    """
    Minimal customer information for review display
    
    Purpose: Show customer info in reviews while protecting PII
    Impact: Provides safe customer representation in public reviews
    """
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'display_name']
    
    def get_display_name(self, obj):
        """Get anonymized display name for customer"""
        if obj.first_name and obj.last_name:
            # Show first name and last initial: "John D."
            return f"{obj.first_name} {obj.last_name[0]}."
        elif obj.first_name:
            return obj.first_name
        else:
            # Fallback to anonymized email
            email_parts = obj.email.split('@')
            if len(email_parts[0]) > 2:
                return f"{email_parts[0][:2]}***"
            else:
                return "Anonymous"


class ProviderSummarySerializer(serializers.ModelSerializer):
    """
    Minimal provider information for various contexts
    
    Purpose: Provide basic provider info without full profile details
    Impact: Used in review contexts and service listings
    """
    display_name = serializers.SerializerMethodField()
    profile_picture = serializers.ImageField(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'display_name', 'profile_picture', 'is_verified']
    
    def get_display_name(self, obj):
        """Get provider's public display name"""
        if hasattr(obj, 'profile') and obj.profile.display_name:
            return obj.profile.display_name
        elif obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        else:
            return obj.email.split('@')[0]


class PortfolioMediaSerializer(serializers.ModelSerializer):
    """
    Serializer for provider portfolio media
    
    Purpose: Handle portfolio images/videos for provider profiles
    Impact: Supports visual portfolio display on provider profiles
    """
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PortfolioMedia
        fields = ['id', 'media_type', 'file_url', 'title', 'description', 'order']
    
    def get_file_url(self, obj):
        """Get full URL for media file"""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class RatingSummarySerializer(serializers.Serializer):
    """
    Serializer for rating summary data
    
    Purpose: Provide rating statistics for provider profiles
    Impact: Shows average rating and distribution breakdown
    """
    average = serializers.DecimalField(max_digits=3, decimal_places=2)
    count = serializers.IntegerField()
    breakdown = serializers.DictField(
        child=serializers.IntegerField(),
        help_text="Rating distribution: {1: count, 2: count, ...}"
    )


class ReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for review display
    
    Purpose: Handle review data for public display
    Impact: Shows reviews on provider profiles with customer anonymization
    """
    customer = CustomerSummarySerializer(read_only=True)
    provider = ProviderSummarySerializer(read_only=True)
    service_title = serializers.ReadOnlyField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    booking_date = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = [
            'id', 'customer', 'provider', 'rating', 'comment',
            'service_title', 'booking_date', 'created_at', 'updated_at',
            'is_edited', 'can_edit', 'can_delete'
        ]
        read_only_fields = ['created_at', 'updated_at', 'is_edited']
    
    def get_can_edit(self, obj):
        """Check if current user can edit this review"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        result = ReviewEligibilityService.can_edit_review(obj, request.user)
        return result['can_edit']
    
    def get_can_delete(self, obj):
        """Check if current user can delete this review"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        result = ReviewEligibilityService.can_delete_review(obj, request.user)
        return result['can_delete']
    
    def get_booking_date(self, obj):
        """Get booking date for context"""
        if obj.booking:
            return obj.booking.booking_date
        return None


class CreateReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new reviews
    
    Purpose: Handle review creation with eligibility validation
    Impact: Ensures only eligible customers can create reviews
    """
    booking_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Review
        fields = ['booking_id', 'rating', 'comment']
    
    def validate_rating(self, value):
        """Validate rating is within bounds"""
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    
    def validate_comment(self, value):
        """Validate comment content"""
        if not value or not value.strip():
            raise serializers.ValidationError("Comment cannot be empty")
        
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Comment must be at least 10 characters long")
        
        if len(value) > 1000:
            raise serializers.ValidationError("Comment cannot exceed 1000 characters")
        
        return value.strip()
    
    def validate(self, attrs):
        """Validate review eligibility"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required")
        
        customer = request.user
        booking_id = attrs['booking_id']
        
        # Get booking and validate
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            raise serializers.ValidationError("Invalid booking ID")
        
        provider = booking.service.provider
        
        # Check eligibility
        eligibility = ReviewEligibilityService.is_eligible(customer, provider, booking_id)
        if not eligibility['eligible']:
            raise serializers.ValidationError(eligibility['reason'])
        
        # Store validated data
        attrs['booking'] = booking
        attrs['provider'] = provider
        attrs['customer'] = customer
        
        return attrs
    
    def create(self, validated_data):
        """Create review with validated data"""
        # Remove booking_id from validated_data as we use the booking object
        validated_data.pop('booking_id', None)
        
        return Review.objects.create(**validated_data)


class UpdateReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing reviews
    
    Purpose: Handle review updates with permission validation
    Impact: Allows customers to edit their reviews within time window
    """
    class Meta:
        model = Review
        fields = ['rating', 'comment']
    
    def validate_rating(self, value):
        """Validate rating is within bounds"""
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    
    def validate_comment(self, value):
        """Validate comment content"""
        if not value or not value.strip():
            raise serializers.ValidationError("Comment cannot be empty")
        
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Comment must be at least 10 characters long")
        
        if len(value) > 1000:
            raise serializers.ValidationError("Comment cannot exceed 1000 characters")
        
        return value.strip()
    
    def validate(self, attrs):
        """Validate update permissions"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required")
        
        review = self.instance
        user = request.user
        
        # Check edit permissions
        permission_check = ReviewEligibilityService.can_edit_review(review, user)
        if not permission_check['can_edit']:
            raise serializers.ValidationError(permission_check['reason'])
        
        return attrs


class ProviderProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for public provider profiles
    
    Purpose: Handle public provider profile data
    Impact: Provides comprehensive provider information for public viewing
    """
    # User fields
    display_name = serializers.SerializerMethodField()
    profile_picture = serializers.ImageField(read_only=True)
    
    # Profile fields
    portfolio_media = PortfolioMediaSerializer(many=True, read_only=True)
    service_categories = serializers.SerializerMethodField()
    
    # Rating summary
    rating_summary = serializers.SerializerMethodField()
    recent_reviews = serializers.SerializerMethodField()
    
    # Computed fields
    total_services = serializers.SerializerMethodField()
    total_bookings = serializers.SerializerMethodField()
    
    class Meta:
        model = Profile
        fields = [
            # Basic info
            'display_name', 'bio', 'profile_picture', 'location_city',
            'years_of_experience', 'certifications',
            
            # Portfolio
            'portfolio_media', 'service_categories',
            
            # Statistics
            'rating_summary', 'recent_reviews', 'total_services', 'total_bookings',
            
            # Metadata
            'created_at'
        ]
    
    def get_display_name(self, obj):
        """Get provider's public display name"""
        return obj.public_display_name
    
    def get_service_categories(self, obj):
        """Get unique service categories for this provider"""
        if obj.user.role != 'provider':
            return []
        
        from apps.services.models import Service
        categories = Service.objects.filter(
            provider=obj.user,
            status='active'
        ).values_list('category__title', flat=True).distinct()
        
        return list(categories)
    
    def get_rating_summary(self, obj):
        """Get rating summary for provider"""
        if obj.user.role != 'provider':
            return {'average': 0.0, 'count': 0, 'breakdown': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}}
        
        summary = ReviewAnalyticsService.get_provider_rating_summary(obj.user)
        return RatingSummarySerializer(summary).data
    
    def get_recent_reviews(self, obj):
        """Get recent reviews for provider"""
        if obj.user.role != 'provider':
            return []
        
        recent_reviews = ReviewAnalyticsService.get_recent_reviews(obj.user, limit=3)
        return ReviewSerializer(recent_reviews, many=True, context=self.context).data
    
    def get_total_services(self, obj):
        """Get total active services count"""
        if obj.user.role != 'provider':
            return 0
        
        from apps.services.models import Service
        return Service.objects.filter(provider=obj.user, status='active').count()
    
    def get_total_bookings(self, obj):
        """Get total completed bookings count"""
        if obj.user.role != 'provider':
            return 0
        
        from apps.bookings.models import Booking
        return Booking.objects.filter(
            service__provider=obj.user,
            status='completed'
        ).count()


class ReviewEligibilitySerializer(serializers.Serializer):
    """
    Serializer for review eligibility check response
    
    Purpose: Provide eligibility information for frontend
    Impact: Helps frontend determine if user can write reviews
    """
    eligible = serializers.BooleanField()
    reason = serializers.CharField()
    eligible_bookings = serializers.ListField(
        child=serializers.DictField(),
        required=False
    )
    booking = serializers.DictField(required=False)