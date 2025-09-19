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

# ===== NEW PROVIDER DASHBOARD ADMIN INTERFACES =====

from .models import ProviderAnalytics, ProviderEarnings, ProviderSchedule, ProviderCustomerRelation


class ProviderAnalyticsAdmin(ModelAdmin):
    """
    NEW ADMIN: Admin interface for provider analytics
    
    Purpose: Manage and view provider performance analytics
    Impact: New admin interface - enables analytics management
    """
    list_display = (
        'provider', 'date', 'bookings_count', 'completed_bookings', 
        'gross_revenue', 'net_revenue', 'average_rating'
    )
    list_filter = ('date', 'provider')
    search_fields = ('provider__email', 'provider__first_name', 'provider__last_name')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'date'
    
    fieldsets = (
        (None, {
            'fields': ('provider', 'date')
        }),
        ('Booking Metrics', {
            'fields': (
                'bookings_count', 'confirmed_bookings', 
                'completed_bookings', 'cancelled_bookings'
            )
        }),
        ('Revenue Metrics', {
            'fields': ('gross_revenue', 'net_revenue', 'platform_fees')
        }),
        ('Performance Metrics', {
            'fields': (
                'average_rating', 'response_time_hours', 'completion_rate'
            )
        }),
        ('Customer Metrics', {
            'fields': ('new_customers', 'returning_customers')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('provider')


class ProviderEarningsAdmin(ModelAdmin):
    """
    NEW ADMIN: Admin interface for provider earnings
    
    Purpose: Manage provider earnings and payouts
    Impact: New admin interface - enables financial management
    """
    list_display = (
        'provider', 'booking', 'gross_amount', 'platform_fee', 
        'net_amount', 'payout_status', 'payout_date'
    )
    list_filter = ('payout_status', 'payout_method', 'payout_date', 'earned_at')
    search_fields = (
        'provider__email', 'provider__first_name', 'provider__last_name',
        'booking__id', 'payout_reference'
    )
    readonly_fields = ('earned_at', 'created_at', 'updated_at')
    date_hierarchy = 'earned_at'
    
    fieldsets = (
        (None, {
            'fields': ('provider', 'booking')
        }),
        ('Earning Details', {
            'fields': (
                'gross_amount', 'platform_fee_percentage', 
                'platform_fee', 'net_amount'
            )
        }),
        ('Payout Information', {
            'fields': (
                'payout_status', 'payout_date', 'payout_reference', 
                'payout_method'
            )
        }),
        ('Additional Information', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('earned_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('provider', 'booking')


class ProviderScheduleAdmin(ModelAdmin):
    """
    NEW ADMIN: Admin interface for provider schedules
    
    Purpose: Manage provider availability and blocked times
    Impact: New admin interface - enables schedule management
    """
    list_display = (
        'provider', 'date', 'start_time', 'end_time', 
        'schedule_type', 'is_all_day', 'max_bookings'
    )
    list_filter = ('schedule_type', 'is_all_day', 'is_recurring', 'date')
    search_fields = (
        'provider__email', 'provider__first_name', 'provider__last_name',
        'title', 'notes'
    )
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'date'
    
    fieldsets = (
        (None, {
            'fields': ('provider', 'date', 'schedule_type')
        }),
        ('Time Details', {
            'fields': (
                'start_time', 'end_time', 'is_all_day', 'max_bookings'
            )
        }),
        ('Additional Information', {
            'fields': ('title', 'notes')
        }),
        ('Recurring Schedule', {
            'fields': (
                'is_recurring', 'recurring_pattern', 'recurring_until'
            ),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('provider')


class ProviderCustomerRelationAdmin(ModelAdmin):
    """
    NEW ADMIN: Admin interface for provider-customer relationships
    
    Purpose: Manage provider-customer relationship data
    Impact: New admin interface - enables relationship management
    """
    list_display = (
        'provider', 'customer', 'total_bookings', 'total_spent',
        'average_rating', 'customer_status', 'last_booking_date'
    )
    list_filter = (
        'is_favorite_customer', 'is_blocked', 'last_booking_date',
        'first_booking_date'
    )
    search_fields = (
        'provider__email', 'provider__first_name', 'provider__last_name',
        'customer__email', 'customer__first_name', 'customer__last_name'
    )
    readonly_fields = ('customer_status', 'days_since_last_booking', 'created_at', 'updated_at')
    date_hierarchy = 'last_booking_date'
    
    fieldsets = (
        (None, {
            'fields': ('provider', 'customer')
        }),
        ('Relationship Metrics', {
            'fields': (
                'total_bookings', 'total_spent', 'average_rating'
            )
        }),
        ('Relationship Status', {
            'fields': (
                'is_favorite_customer', 'is_blocked', 'customer_status'
            )
        }),
        ('Important Dates', {
            'fields': (
                'first_booking_date', 'last_booking_date', 
                'days_since_last_booking'
            )
        }),
        ('Provider Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('provider', 'customer')


# Register the new provider dashboard models
admin.site.register(ProviderAnalytics, ProviderAnalyticsAdmin)
admin.site.register(ProviderEarnings, ProviderEarningsAdmin)
admin.site.register(ProviderSchedule, ProviderScheduleAdmin)
admin.site.register(ProviderCustomerRelation, ProviderCustomerRelationAdmin)