"""
SewaBazaar Services App Admin Configuration

This module configures the Django admin interface for the services application,
providing management interfaces for services, categories, cities, and related data.

Admin Classes:
- CityAdmin: Admin interface for City model
- ServiceCategoryAdmin: Admin interface for ServiceCategory model
- ServiceAdmin: Admin interface for Service model with inlines
- FavoriteAdmin: Admin interface for Favorite model
"""

from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from .models import City, ServiceCategory, Service, ServiceImage, ServiceAvailability, Favorite

class CityAdmin(ModelAdmin):
    """
    Admin interface for City model.
    
    Provides a clean interface for managing cities where services are offered.
    
    Features:
    - List display with name, region, and active status
    - Filtering by active status and region
    - Search by name and region
    """
    list_display = ('name', 'region', 'is_active')
    list_filter = ('is_active', 'region')
    search_fields = ('name', 'region')

class ServiceCategoryAdmin(ModelAdmin):
    """
    Admin interface for ServiceCategory model.
    
    Provides management interface for service categories with slug auto-generation.
    
    Features:
    - List display with title, slug, and active status
    - Filtering by active status
    - Search by title and description
    - Automatic slug generation from title
    """
    list_display = ('title', 'slug', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}

class ServiceImageInline(TabularInline):
    """
    Inline admin interface for ServiceImage model.
    
    Allows managing service images directly from the service admin page.
    
    Features:
    - Tabular inline display
    - One extra empty form by default
    """
    model = ServiceImage
    extra = 1

class ServiceAvailabilityInline(TabularInline):
    """
    Inline admin interface for ServiceAvailability model.
    
    Allows managing service availability schedules directly from the service admin page.
    
    Features:
    - Tabular inline display
    - No extra empty forms by default
    - Conditional add permission based on service existence
    """
    model = ServiceAvailability
    extra = 0
    
    def has_add_permission(self, request, obj=None):
        """
        Allow adding new availability only when editing an existing service.
        
        Prevents availability creation when creating a new service until the
        service itself is saved.
        
        Args:
            request (HttpRequest): The HTTP request object
            obj (Service, optional): The service object being edited
            
        Returns:
            bool: Whether add permission is granted
        """
        # Allow adding new availability only when editing an existing service
        return obj is not None

class ServiceAdmin(ModelAdmin):
    """
    Admin interface for Service model.
    
    Comprehensive admin interface for managing services with related data.
    
    Features:
    - List display with key service information
    - Filtering by status, category, featured status, and cities
    - Search by title, description, and provider information
    - Automatic slug generation from title
    - Inline management of images and availability
    - Custom fieldsets for organized data entry
    - User-specific queryset filtering
    """
    list_display = ('title', 'category', 'provider', 'price', 'status', 'average_rating', 'created_at')
    list_filter = ('status', 'category', 'is_featured', 'cities')
    search_fields = ('title', 'description', 'provider__email', 'provider__first_name', 'provider__last_name')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [ServiceImageInline, ServiceAvailabilityInline]
    readonly_fields = ('average_rating', 'reviews_count')
    
    fieldsets = (
        (None, {
            'fields': ('title', 'slug', 'description', 'short_description', 'category', 'provider')
        }),
        ('Pricing & Duration', {
            'fields': ('price', 'discount_price', 'duration')
        }),
        ('Location', {
            'fields': ('cities',)
        }),
        ('Service Details', {
            'fields': ('includes', 'excludes')
        }),
        ('Status & Metrics', {
            'fields': ('status', 'is_featured', 'average_rating', 'reviews_count')
        }),
    )
    
    def get_queryset(self, request):
        """
        Get user-specific queryset for services.
        
        Admins and superusers can see all services, while providers can
        only see their own services.
        
        Args:
            request (HttpRequest): The HTTP request object
            
        Returns:
            QuerySet: Filtered Service queryset
        """
        qs = super().get_queryset(request)
        if request.user.is_superuser or request.user.role == 'admin':
            return qs
        return qs.filter(provider=request.user)

# Add Favorite admin
class FavoriteAdmin(ModelAdmin):
    """
    Admin interface for Favorite model.
    
    Provides management interface for user-favorited services.
    
    Features:
    - List display with user, service, and creation date
    - Filtering by creation date
    - Search by user and service information
    - Read-only creation date field
    - User-specific queryset filtering
    """
    list_display = ('user', 'service', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'service__title')
    readonly_fields = ('created_at',)

    def get_queryset(self, request):
        """
        Get user-specific queryset for favorites.
        
        Admins and superusers can see all favorites, while users can
        only see their own favorites.
        
        Args:
            request (HttpRequest): The HTTP request object
            
        Returns:
            QuerySet: Filtered Favorite queryset
        """
        qs = super().get_queryset(request)
        if request.user.is_superuser or request.user.role == 'admin':
            return qs
        return qs.filter(user=request.user)

admin.site.register(City, CityAdmin)
admin.site.register(ServiceCategory, ServiceCategoryAdmin)
admin.site.register(Service, ServiceAdmin)
admin.site.register(Favorite, FavoriteAdmin)