"""
SewaBazaar Services App Serializers

This module contains all the Django REST Framework serializers for the services application,
which handle the conversion between model instances and JSON representations for the API.

Serializers:
- CitySerializer: Serializes City model data
- ServiceCategorySerializer: Serializes ServiceCategory model data
- ServiceImageSerializer: Serializes ServiceImage model data
- ServiceAvailabilitySerializer: Serializes ServiceAvailability model data
- ServiceSerializer: Serializes Service model data with related information
- ServiceDetailSerializer: Extends ServiceSerializer with detailed information
- FavoriteSerializer: Serializes Favorite model data
"""

from rest_framework import serializers
from .models import City, ServiceCategory, Service, ServiceImage, ServiceAvailability, Favorite
from apps.reviews.serializers import ReviewSerializer

class CitySerializer(serializers.ModelSerializer):
    """
    Serializer for City model.
    
    Converts City model instances to/from JSON for API endpoints.
    Provides a simple representation of city data.
    
    Fields:
        id (int): Unique identifier for the city
        name (str): Name of the city
        region (str): Region where the city is located
        is_active (bool): Whether the city is currently active
    """
    class Meta:
        model = City
        fields = ['id', 'name', 'region', 'is_active']

class ServiceCategorySerializer(serializers.ModelSerializer):
    """
    Serializer for ServiceCategory model.
    
    Converts ServiceCategory model instances to/from JSON for API endpoints.
    Handles auto-generated slug field appropriately.
    
    Fields:
        id (int): Unique identifier for the category
        title (str): Name of the category
        description (str): Detailed description of the category
        icon (str): Icon identifier for the category
        slug (str): URL-friendly version of the title (read-only)
        is_active (bool): Whether the category is currently active
    """
    slug = serializers.SlugField(read_only=True)  # Make slug read-only since it's auto-generated
    
    class Meta:
        model = ServiceCategory
        fields = ['id', 'title', 'description', 'icon', 'slug', 'is_active']

class ServiceImageSerializer(serializers.ModelSerializer):
    """
    Serializer for ServiceImage model.
    
    Converts ServiceImage model instances to/from JSON for API endpoints.
    Handles image URL generation for proper frontend display.
    
    Fields:
        id (int): Unique identifier for the image
        image (str): URL of the image file
        caption (str): Caption/description for the image
        is_featured (bool): Whether this is the featured image
        order (int): Display order in gallery
        alt_text (str): Accessibility alt text
    """
    class Meta:
        model = ServiceImage
        fields = ['id', 'image', 'caption', 'is_featured', 'order', 'alt_text']
        
    def to_representation(self, instance):
        """
        Override to_representation to generate absolute image URLs.
        
        Ensures that image URLs are properly formatted for frontend consumption.
        
        Args:
            instance (ServiceImage): The ServiceImage instance being serialized
            
        Returns:
            dict: Serialized representation with absolute image URLs
        """
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if instance.image and request:
            representation['image'] = request.build_absolute_uri(instance.image.url)
        else:
            representation['image'] = instance.image.url if instance.image else None
        return representation

class ServiceAvailabilitySerializer(serializers.ModelSerializer):
    """
    Serializer for ServiceAvailability model.
    
    Converts ServiceAvailability model instances to/from JSON for API endpoints.
    Includes human-readable day names for better frontend display.
    
    Fields:
        id (int): Unique identifier for the availability record
        day_of_week (int): Day of the week (0=Monday, 6=Sunday)
        day_name (str): Human-readable day name (read-only)
        start_time (time): Start time for availability
        end_time (time): End time for availability
        is_available (bool): Whether the service is available during this time
    """
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = ServiceAvailability
        fields = ['id', 'day_of_week', 'day_name', 'start_time', 'end_time', 'is_available']

class ServiceSerializer(serializers.ModelSerializer):
    """
    Serializer for Service model with related data.
    
    Converts Service model instances to/from JSON for API endpoints.
    Includes related data like category, provider, cities, images, and availability.
    
    Fields:
        id (int): Unique identifier for the service
        title (str): Title/name of the service
        slug (str): URL-friendly version of the title
        description (str): Detailed description of the service
        short_description (str): Brief description for listings
        price (Decimal): Price of the service
        discount_price (Decimal): Discounted price if applicable
        duration (str): Estimated duration of the service
        category (int): ID of the service category
        category_name (str): Name of the service category (read-only)
        provider (dict): Provider information (read-only)
        cities (list): Cities where this service is offered (read-only)
        city_ids (list): City IDs for creating/updating (write-only)
        image (str): Main image URL (read-only)
        images (list): Gallery images (read-only)
        includes (str): What's included in the service
        excludes (str): What's not included in the service
        status (str): Current status of the service listing
        is_featured (bool): Whether this is a featured/promoted service
        average_rating (Decimal): Average user rating for this service
        reviews_count (int): Number of reviews for this service
        availability (list): Availability schedules (read-only)
        created_at (DateTime): When the service was created
        updated_at (DateTime): When the service was last updated
        is_favorited (bool): Whether current user has favorited this service
        tags (list): Search tags for better discovery
        is_verified_provider (bool): Whether the provider has verified credentials
        response_time (str): Provider's typical response time
        cancellation_policy (str): Service cancellation policy
        view_count (int): Number of profile views
        inquiry_count (int): Number of inquiries received
        last_activity (DateTime): Last activity timestamp
    """
    category_name = serializers.CharField(source='category.title', read_only=True)
    provider = serializers.SerializerMethodField()
    cities = CitySerializer(many=True, read_only=True)
    city_ids = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.all(), 
        write_only=True, 
        many=True,
        source='cities'
    )
    image = serializers.SerializerMethodField()  # Virtual field for main image
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
        read_only_fields = ['slug', 'is_featured', 
                           'average_rating', 'reviews_count', 'created_at', 'updated_at',
                           'view_count', 'inquiry_count', 'last_activity']
    
    def get_provider(self, obj):
        """
        Get provider information in the format expected by frontend.
        
        Provides a structured representation of the service provider with
        relevant profile information.
        
        Args:
            obj (Service): The Service instance being serialized
            
        Returns:
            dict: Provider information
        """
        return {
            'id': obj.provider.id,
            'name': obj.provider.full_name,
            'is_verified': getattr(obj.provider.profile, 'is_approved', False) if hasattr(obj.provider, 'profile') else False,
            'avg_rating': getattr(obj.provider.profile, 'avg_rating', 0.0) if hasattr(obj.provider, 'profile') else 0.0,
            'reviews_count': getattr(obj.provider.profile, 'reviews_count', 0) if hasattr(obj.provider, 'profile') else 0
        }
    
    def get_image(self, obj):
        """
        Get main image URL from featured ServiceImage.
        
        Returns the URL of the featured image for the service, if available.
        
        Args:
            obj (Service): The Service instance being serialized
            
        Returns:
            str: URL of the main image or None if not available
        """
        main_image = obj.main_image  # Uses the property we defined in the model
        if main_image and main_image.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(main_image.image.url)
            else:
                return main_image.image.url
        return None
    
    def to_representation(self, instance):
        """
        Override to_representation to handle nullable fields safely.
        
        Ensures that nullable fields are properly handled to prevent errors
        when some fields might not exist in older model instances.
        
        Args:
            instance (Service): The Service instance being serialized
            
        Returns:
            dict: Serialized representation with safe field handling
        """
        representation = super().to_representation(instance)
        
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
        """
        Override create method to handle cities relationship.
        
        Properly associates cities with the newly created service.
        
        Args:
            validated_data (dict): Validated data from the serializer
            
        Returns:
            Service: The created Service instance
        """
        cities = validated_data.pop('cities', [])
        service = Service.objects.create(**validated_data)
        service.cities.set(cities)
        return service
    
    def update(self, instance, validated_data):
        """
        Override update method to handle cities relationship.
        
        Properly updates the cities relationship for the service.
        
        Args:
            instance (Service): The Service instance being updated
            validated_data (dict): Validated data from the serializer
            
        Returns:
            Service: The updated Service instance
        """
        cities = validated_data.pop('cities', None)
        if cities is not None:
            instance.cities.set(cities)
        return super().update(instance, validated_data)

    def get_is_favorited(self, obj):
        """
        Check if the current user has favorited this service.
        
        Args:
            obj (Service): The Service instance being serialized
            
        Returns:
            bool: True if favorited by current user, False otherwise
        """
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, service=obj).exists()
        return False

class ServiceDetailSerializer(ServiceSerializer):
    """
    Extended serializer for detailed service information.
    
    Extends the base ServiceSerializer to include reviews data for detailed
    service views.
    
    Additional Fields:
        reviews (list): Reviews for this service
    """
    reviews = ReviewSerializer(source='review_set', many=True, read_only=True)
    
    class Meta(ServiceSerializer.Meta):
        fields = ServiceSerializer.Meta.fields + ['reviews']

class FavoriteSerializer(serializers.ModelSerializer):
    """
    Serializer for Favorite model.
    
    Converts Favorite model instances to/from JSON for API endpoints.
    Includes detailed service information for better frontend display.
    
    Fields:
        id (int): Unique identifier for the favorite
        user (int): ID of the user who favorited the service
        service (int): ID of the favorited service
        service_details (dict): Detailed service information (read-only)
        created_at (DateTime): When the service was favorited
    """
    service_details = ServiceSerializer(source='service', read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'user', 'service', 'service_details', 'created_at']
        read_only_fields = ['user']