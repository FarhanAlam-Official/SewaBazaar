from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin
from .models import Review, ReviewImage


class ReviewAdmin(ModelAdmin):
    """
    Admin interface for reviews.
    
    Provides an enhanced admin interface for managing reviews with
    comprehensive filtering, display options, and field organization.
    Reviews are displayed with star ratings, booking information,
    and provider response status.
    
    Attributes:
        list_display (tuple): Fields to display in the list view
        list_filter (tuple): Fields to filter by in the list view
        search_fields (tuple): Fields to search in the list view
        readonly_fields (tuple): Fields that are read-only in the admin
        date_hierarchy (str): Field to use for date hierarchy navigation
        ordering (list): Default ordering for the list view
        fieldsets (tuple): Organization of fields in the edit view
    """
    """
    PHASE 2 ENHANCED ADMIN: Booking-based reviews with provider focus
    
    Purpose: Manage reviews with comprehensive filtering and display
    Impact: Enhanced admin interface for review management
    """
    list_display = (
        'id', 'customer_email', 'provider_name', 'service_title', 
        'rating_stars', 'booking_date', 'created_at', 'is_edited',
        'provider_response_present', 'provider_response_updated_at'
    )
    list_filter = (
        'rating', 'created_at', 'is_edited', 
        'provider__role', 'customer__role'
    )
    search_fields = (
        'customer__email', 'customer__first_name', 'customer__last_name',
        'provider__email', 'provider__first_name', 'provider__last_name',
        'booking__service__title', 'comment'
    )
    readonly_fields = (
        'created_at', 'updated_at', 'edit_deadline', 
        'booking_link', 'service_link',
        'provider_response_created_at', 'provider_response_updated_at', 'provider_responded_by'
    )
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    fieldsets = (
        ('Review Information', {
            'fields': ('customer', 'provider', 'booking', 'rating', 'comment')
        }),
        ('Provider Response', {
            'fields': ('provider_response', 'provider_response_created_at', 'provider_response_updated_at', 'provider_responded_by')
        }),
        ('Booking Details', {
            'fields': ('booking_link', 'service_link'),
            'classes': ('collapse',)
        }),
        ('Edit Information', {
            'fields': ('is_edited', 'edit_deadline'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def customer_email(self, obj):
        """
        Display customer email in the admin list view.
        
        Args:
            obj (Review): The review instance
            
        Returns:
            str: Customer email or "-" if no customer
        """
        """Display customer email"""
        return obj.customer.email if obj.customer else "-"
    customer_email.short_description = 'Customer'
    customer_email.admin_order_field = 'customer__email'
    
    def provider_name(self, obj):
        """
        Display provider name in the admin list view.
        
        Uses the provider's profile display name if available, otherwise
        falls back to their full name or email.
        
        Args:
            obj (Review): The review instance
            
        Returns:
            str: Provider name or "-" if no provider
        """
        """Display provider name"""
        if obj.provider:
            if hasattr(obj.provider, 'profile') and obj.provider.profile.display_name:
                return obj.provider.profile.display_name
            elif obj.provider.first_name and obj.provider.last_name:
                return f"{obj.provider.first_name} {obj.provider.last_name}"
            else:
                return obj.provider.email
        return "-"
    provider_name.short_description = 'Provider'
    provider_name.admin_order_field = 'provider__email'
    
    def service_title(self, obj):
        """
        Display service title in the admin list view.
        
        Args:
            obj (Review): The review instance
            
        Returns:
            str: Service title or "-" if no booking
        """
        """Display service title"""
        return obj.service_title if obj.booking else "-"
    service_title.short_description = 'Service'
    
    def rating_stars(self, obj):
        """
        Display rating as stars in the admin list view.
        
        Shows the rating as star icons (★ for filled stars, ☆ for empty stars)
        along with the numeric rating.
        
        Args:
            obj (Review): The review instance
            
        Returns:
            str: HTML formatted star rating
        """
        """Display rating as stars"""
        stars = '★' * obj.rating + '☆' * (5 - obj.rating)
        return format_html(
            '<span style="color: #ffc107; font-size: 16px;">{}</span> ({})',
            stars, obj.rating
        )
    rating_stars.short_description = 'Rating'
    rating_stars.admin_order_field = 'rating'
    
    def booking_date(self, obj):
        """
        Display booking date in the admin list view.
        
        Args:
            obj (Review): The review instance
            
        Returns:
            date: Booking date or "-" if no booking
        """
        """Display booking date"""
        if obj.booking:
            return obj.booking.booking_date
        return "-"
    booking_date.short_description = 'Booking Date'
    booking_date.admin_order_field = 'booking__booking_date'
    
    def booking_link(self, obj):
        """
        Display link to booking admin in the edit view.
        
        Args:
            obj (Review): The review instance
            
        Returns:
            str: HTML formatted link to booking admin or "-" if no booking
        """
        """Link to booking admin"""
        if obj.booking:
            from django.urls import reverse
            from django.utils.html import format_html
            
            url = reverse('admin:bookings_booking_change', args=[obj.booking.id])
            return format_html('<a href="{}">Booking #{}</a>', url, obj.booking.id)
        return "-"
    booking_link.short_description = 'Booking'
    
    def service_link(self, obj):
        """
        Display link to service admin in the edit view.
        
        Args:
            obj (Review): The review instance
            
        Returns:
            str: HTML formatted link to service admin or "-" if no service
        """
        """Link to service admin"""
        if obj.booking and obj.booking.service:
            from django.urls import reverse
            from django.utils.html import format_html
            
            url = reverse('admin:services_service_change', args=[obj.booking.service.id])
            return format_html('<a href="{}">{}</a>', url, obj.booking.service.title)
        return "-"
    service_link.short_description = 'Service'

    def provider_response_present(self, obj):
        """
        Show if provider has replied in the admin list view.
        
        Args:
            obj (Review): The review instance
            
        Returns:
            bool: True if provider has replied, False otherwise
        """
        """Show if provider has replied"""
        return bool(obj.provider_response and obj.provider_response.strip())
    provider_response_present.boolean = True
    provider_response_present.short_description = 'Replied'
    
    def get_queryset(self, request):
        """
        Optimize queryset with select_related for better performance.
        
        Args:
            request (HttpRequest): The HTTP request object
            
        Returns:
            QuerySet: Optimized queryset
        """
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related(
            'customer', 'provider', 'booking__service'
        )
    
    def has_add_permission(self, request):
        """
        Disable adding reviews through admin (should be done via API).
        
        Args:
            request (HttpRequest): The HTTP request object
            
        Returns:
            bool: False to disable adding reviews through admin
        """
        """Disable adding reviews through admin (should be done via API)"""
        return False


admin.site.register(Review, ReviewAdmin)


class ReviewImageAdmin(ModelAdmin):
    """
    Admin interface for ReviewImage model.
    
    Provides an admin interface for managing review images with
    image previews in the list view.
    
    Attributes:
        list_display (list): Fields to display in the list view
        list_filter (list): Fields to filter by in the list view
        search_fields (list): Fields to search in the list view
        ordering (list): Default ordering for the list view
    """
    """Admin interface for ReviewImage model"""
    list_display = ['id', 'review', 'image_preview', 'caption', 'order', 'created_at']
    list_filter = ['created_at']
    search_fields = ['review__id', 'caption']
    ordering = ['-created_at']
    
    def image_preview(self, obj):
        """
        Display image preview in admin list view.
        
        Shows a small thumbnail preview of the image.
        
        Args:
            obj (ReviewImage): The review image instance
            
        Returns:
            str: HTML formatted image preview or "No image"
        """
        """Display image preview in admin"""
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 50px; height: 50px; object-fit: cover;" />',
                obj.image.url
            )
        return "No image"
    image_preview.short_description = 'Preview'


admin.site.register(ReviewImage, ReviewImageAdmin)