from django.contrib import admin
from .models import Booking

class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'service', 'customer', 'booking_date', 'booking_time', 'status', 'total_amount')
    list_filter = ('status', 'booking_date')
    search_fields = ('service__title', 'customer__email', 'customer__first_name', 'customer__last_name', 'address', 'city')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (None, {
            'fields': ('customer', 'service', 'status')
        }),
        ('Booking Details', {
            'fields': ('booking_date', 'booking_time', 'address', 'city', 'phone', 'note')
        }),
        ('Financial Details', {
            'fields': ('price', 'discount', 'total_amount')
        }),
        ('Status Information', {
            'fields': ('cancellation_reason', 'rejection_reason')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

admin.site.register(Booking, BookingAdmin)
