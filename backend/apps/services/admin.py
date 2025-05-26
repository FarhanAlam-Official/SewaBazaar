from django.contrib import admin
from .models import City, ServiceCategory, Service, ServiceImage, ServiceAvailability

class CityAdmin(admin.ModelAdmin):
    list_display = ('name', 'region', 'is_active')
    list_filter = ('is_active', 'region')
    search_fields = ('name', 'region')

class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}

class ServiceImageInline(admin.TabularInline):
    model = ServiceImage
    extra = 1

class ServiceAvailabilityInline(admin.TabularInline):
    model = ServiceAvailability
    extra = 1

class ServiceAdmin(admin.ModelAdmin):
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
        ('Location & Media', {
            'fields': ('cities', 'image')
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

admin.site.register(City, CityAdmin)
admin.site.register(ServiceCategory, ServiceCategoryAdmin)
admin.site.register(Service, ServiceAdmin)
