from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from .models import City, ServiceCategory, Service, ServiceImage, ServiceAvailability, Favorite

class CityAdmin(ModelAdmin):
    list_display = ('name', 'region', 'is_active')
    list_filter = ('is_active', 'region')
    search_fields = ('name', 'region')

class ServiceCategoryAdmin(ModelAdmin):
    list_display = ('title', 'slug', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}

class ServiceImageInline(TabularInline):
    model = ServiceImage
    extra = 1

class ServiceAvailabilityInline(TabularInline):
    model = ServiceAvailability
    extra = 0
    
    def has_add_permission(self, request, obj=None):
        # Allow adding new availability only when editing an existing service
        return obj is not None

class ServiceAdmin(ModelAdmin):
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
        qs = super().get_queryset(request)
        if request.user.is_superuser or request.user.role == 'admin':
            return qs
        return qs.filter(provider=request.user)

# Add Favorite admin
class FavoriteAdmin(ModelAdmin):
    list_display = ('user', 'service', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'service__title')
    readonly_fields = ('created_at',)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or request.user.role == 'admin':
            return qs
        return qs.filter(user=request.user)

admin.site.register(City, CityAdmin)
admin.site.register(ServiceCategory, ServiceCategoryAdmin)
admin.site.register(Service, ServiceAdmin)
admin.site.register(Favorite, FavoriteAdmin)