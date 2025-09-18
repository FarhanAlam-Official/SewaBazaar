from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Booking, PaymentMethod, BookingSlot, Payment


class PaymentMethodAdmin(ModelAdmin):
    """
    ENHANCED ADMIN: Admin interface for payment methods with icon support
    
    Purpose: Manage payment methods with enhanced icon and display features
    Impact: Enhanced admin interface - better payment method management
    """
    list_display = ('name', 'payment_type', 'is_active', 'is_featured', 'processing_fee_percentage', 'created_at')
    list_filter = ('payment_type', 'is_active', 'is_featured', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (None, {
            'fields': ('name', 'payment_type', 'is_active', 'is_featured')
        }),
        ('Icon Configuration', {
            'fields': ('icon_image', 'icon_url', 'icon_emoji'),
            'description': 'Choose one icon method: upload image, provide URL, or use emoji'
        }),
        ('Settings', {
            'fields': ('processing_fee_percentage', 'priority_order', 'description')
        }),
        ('Limits', {
            'fields': ('min_amount', 'max_amount'),
            'classes': ('collapse',)
        }),
        ('Gateway Configuration', {
            'fields': ('gateway_config',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class BookingSlotAdmin(ModelAdmin):
    """
    PHASE 1 NEW ADMIN: Admin interface for booking slots
    
    Purpose: Manage booking slots and availability
    Impact: New admin interface - enhances booking management
    """
    list_display = ('service', 'date', 'start_time', 'end_time', 'current_bookings', 'max_bookings', 'is_available')
    list_filter = ('date', 'is_available', 'service__category')
    search_fields = ('service__title', 'service__provider__email')
    readonly_fields = ('current_bookings', 'created_at', 'updated_at')
    date_hierarchy = 'date'
    
    fieldsets = (
        (None, {
            'fields': ('service', 'date', 'start_time', 'end_time')
        }),
        ('Availability', {
            'fields': ('is_available', 'max_bookings', 'current_bookings')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class PaymentAdmin(ModelAdmin):
    """
    PHASE 1 NEW ADMIN: Admin interface for payments
    
    Purpose: Manage payments and track transactions
    Impact: New admin interface - adds payment management capability
    """
    list_display = ('transaction_id', 'booking', 'payment_method', 'total_amount', 'status', 'paid_at')
    list_filter = ('status', 'payment_method', 'paid_at', 'created_at')
    search_fields = ('transaction_id', 'khalti_transaction_id', 'booking__customer__email')
    readonly_fields = ('payment_id', 'transaction_id', 'khalti_transaction_id', 'amount_in_paisa', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (None, {
            'fields': ('booking', 'payment_method', 'status')
        }),
        ('Payment Details', {
            'fields': ('amount', 'processing_fee', 'total_amount', 'amount_in_paisa')
        }),
        ('Khalti Information', {
            'fields': ('khalti_token', 'khalti_transaction_id', 'khalti_response'),
            'classes': ('collapse',)
        }),
        ('Transaction Details', {
            'fields': ('payment_id', 'transaction_id', 'gateway_response', 'paid_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Make certain fields readonly after creation"""
        readonly = list(self.readonly_fields)
        if obj:  # Editing existing object
            readonly.extend(['booking', 'payment_method', 'amount'])
        return readonly


class BookingAdmin(ModelAdmin):
    """
    EXISTING ADMIN WITH PHASE 1 ENHANCEMENTS:
    - Preserves all existing functionality
    - Adds new Phase 1 fields
    - Maintains backward compatibility
    """
    list_display = (
        'id', 'service', 'customer', 'booking_date', 'booking_time', 
        'status', 'booking_step', 'total_amount', 'has_payment', 'has_reschedule_reason', 'reschedule_count'  # Added reschedule fields
    )
    list_filter = ('status', 'booking_step', 'booking_date', 'is_recurring', 'reschedule_reason')  # Added reschedule filter
    search_fields = (
        'service__title', 'customer__email', 'customer__first_name', 
        'customer__last_name', 'address', 'city'
    )
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'booking_date'
    
    fieldsets = (
        (None, {
            'fields': ('customer', 'service', 'status', 'booking_step')  # Added booking_step
        }),
        ('Booking Details', {
            'fields': (
                'booking_date', 'booking_time', 'address', 'city', 'phone', 
                'special_instructions'  # Added special_instructions
            )
        }),
        ('PHASE 1 NEW: Enhanced Details', {  # New fieldset
            'fields': (
                'booking_slot', 'estimated_duration', 'preferred_provider_gender',
                'is_recurring', 'recurring_frequency'
            ),
            'classes': ('collapse',)
        }),
        ('Financial Details', {
            'fields': ('price', 'discount', 'total_amount')
        }),
        ('Status Information', {
            'fields': ('cancellation_reason', 'rejection_reason', 'reschedule_reason', 'reschedule_history')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def has_payment(self, obj):
        """Check if booking has associated payment"""
        return hasattr(obj, 'payment')
    has_payment.boolean = True
    has_payment.short_description = 'Has Payment'
    
    def has_reschedule_reason(self, obj):
        """Check if booking has been rescheduled"""
        return bool(obj.reschedule_reason)
    has_reschedule_reason.boolean = True
    has_reschedule_reason.short_description = 'Rescheduled'
    
    def reschedule_count(self, obj):
        """Get number of times booking has been rescheduled"""
        if obj.reschedule_history:
            return len(obj.reschedule_history)
        return 0
    reschedule_count.short_description = 'Reschedule Count'
    
    def get_readonly_fields(self, request, obj=None):
        """Make reschedule_history read-only in admin"""
        readonly = list(super().get_readonly_fields(request, obj))
        readonly.append('reschedule_history')
        return readonly


# EXISTING REGISTRATION (unchanged)
admin.site.register(Booking, BookingAdmin)

# PHASE 1 NEW REGISTRATIONS
admin.site.register(PaymentMethod, PaymentMethodAdmin)
admin.site.register(BookingSlot, BookingSlotAdmin)
admin.site.register(Payment, PaymentAdmin)
