from rest_framework import serializers
from .models import City, ServiceCategory, Service, ServiceImage, ServiceAvailability, Favorite
from apps.reviews.serializers import ReviewSerializer

class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ['id', 'name', 'region', 'is_active']

class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ['id', 'title', 'description', 'icon', 'slug', 'is_active']

class ServiceImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceImage
        fields = ['id', 'image', 'caption']
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['image'] = instance.image.url
        return representation

class ServiceAvailabilitySerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = ServiceAvailability
        fields = ['id', 'day_of_week', 'day_name', 'start_time', 'end_time', 'is_available']

class ServiceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.title', read_only=True)
    provider = serializers.SerializerMethodField()
    cities = CitySerializer(many=True, read_only=True)
    city_ids = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.all(), 
        write_only=True, 
        many=True,
        source='cities'
    )
    images = ServiceImageSerializer(many=True, read_only=True)
    availability = ServiceAvailabilitySerializer(many=True, read_only=True)
    is_favorited = serializers.SerializerMethodField()
    
    class Meta:
        model = Service
        fields = [
            'id', 'title', 'slug', 'description', 'short_description', 
            'price', 'discount_price', 'duration', 'category', 'category_name',
            'provider', 'cities', 'city_ids', 'image', 
            'images', 'includes', 'excludes', 'status', 'is_featured',
            'average_rating', 'reviews_count', 'availability',
            'created_at', 'updated_at', 'is_favorited',
            # PHASE 2 NEW FIELDS
            'tags', 'is_verified_provider', 'response_time', 'cancellation_policy',
            'view_count', 'inquiry_count', 'last_activity'
        ]
        read_only_fields = ['slug', 'status', 'is_featured', 
                           'average_rating', 'reviews_count', 'created_at', 'updated_at',
                           'view_count', 'inquiry_count', 'last_activity']
    
    def get_provider(self, obj):
        """Return provider information in the format expected by frontend"""
        return {
            'id': obj.provider.id,
            'name': obj.provider.full_name,
            'is_verified': getattr(obj.provider.profile, 'is_approved', False) if hasattr(obj.provider, 'profile') else False,
            'avg_rating': getattr(obj.provider.profile, 'avg_rating', 0.0) if hasattr(obj.provider, 'profile') else 0.0,
            'reviews_count': getattr(obj.provider.profile, 'reviews_count', 0) if hasattr(obj.provider, 'profile') else 0
        }
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # Handle image field safely
        if instance.image:
            representation['image'] = instance.image.url
        else:
            representation['image'] = None
        
        # Handle tags field safely - check if it exists in the model
        if hasattr(instance, 'tags'):
            representation['tags'] = representation.get('tags') or []
        else:
            representation['tags'] = []
        
        # Handle other nullable fields safely
        if hasattr(instance, 'response_time'):
            representation['response_time'] = representation.get('response_time') or 'Not specified'
        else:
            representation['response_time'] = 'Not specified'
            
        if hasattr(instance, 'cancellation_policy'):
            representation['cancellation_policy'] = representation.get('cancellation_policy') or 'Standard policy'
        else:
            representation['cancellation_policy'] = 'Standard policy'
            
        if hasattr(instance, 'is_verified_provider'):
            representation['is_verified_provider'] = representation.get('is_verified_provider', False)
        else:
            representation['is_verified_provider'] = False
            
        if hasattr(instance, 'view_count'):
            representation['view_count'] = representation.get('view_count', 0)
        else:
            representation['view_count'] = 0
            
        if hasattr(instance, 'inquiry_count'):
            representation['inquiry_count'] = representation.get('inquiry_count', 0)
        else:
            representation['inquiry_count'] = 0
            
        if hasattr(instance, 'last_activity'):
            representation['last_activity'] = representation.get('last_activity')
        else:
            representation['last_activity'] = None
        
        return representation
    
    def create(self, validated_data):
        cities = validated_data.pop('cities', [])
        service = Service.objects.create(**validated_data)
        service.cities.set(cities)
        return service
    
    def update(self, instance, validated_data):
        cities = validated_data.pop('cities', None)
        if cities is not None:
            instance.cities.set(cities)
        return super().update(instance, validated_data)

    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, service=obj).exists()
        return False

class ServiceDetailSerializer(ServiceSerializer):
    reviews = ReviewSerializer(source='review_set', many=True, read_only=True)
    
    class Meta(ServiceSerializer.Meta):
        fields = ServiceSerializer.Meta.fields + ['reviews']

class FavoriteSerializer(serializers.ModelSerializer):
    service_details = ServiceSerializer(source='service', read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'user', 'service', 'service_details', 'created_at']
        read_only_fields = ['user']
