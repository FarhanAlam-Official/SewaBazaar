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
    provider_name = serializers.CharField(source='provider.full_name', read_only=True)
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
            'provider', 'provider_name', 'cities', 'city_ids', 'image', 
            'images', 'includes', 'excludes', 'status', 'is_featured',
            'average_rating', 'reviews_count', 'availability',
            'created_at', 'updated_at', 'is_favorited'
        ]
        read_only_fields = ['slug', 'provider', 'status', 'is_featured', 
                           'average_rating', 'reviews_count', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['image'] = instance.image.url
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
