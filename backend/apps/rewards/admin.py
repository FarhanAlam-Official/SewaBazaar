"""
Django Admin Configuration for Rewards System

This module configures the Django admin interface for rewards system models.
Provides easy management and monitoring of:
- Rewards configuration
- User reward accounts  
- Points transactions
- System analytics

Phase 1: Core admin interfaces with enhanced functionality
"""

from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Sum, Count
from django.urls import path
from django.shortcuts import render, redirect
from django.contrib import messages
from django.http import HttpResponse, JsonResponse
from django.core.exceptions import ValidationError
import qrcode
import io
import base64
from unfold.admin import ModelAdmin
from .models import RewardsConfig, RewardAccount, PointsTransaction, RewardVoucher


@admin.register(RewardsConfig)
class RewardsConfigAdmin(ModelAdmin):
    """
    Admin interface for managing rewards system configuration.
    
    Features:
    - Easy editing of all reward parameters
    - Visual status indicators
    - Audit trail of changes
    - Quick activation/deactivation
    
    Fields:
        is_active (bool): Whether the rewards system is currently active
        maintenance_mode (bool): Put rewards system in maintenance mode
        points_per_rupee (Decimal): Points earned per rupee spent
        points_per_review (int): Points earned for writing a review
        points_per_referral (int): Points earned for referring a new customer
        first_booking_bonus (int): Bonus points for first booking
        weekend_booking_bonus (int): Bonus points for weekend bookings
        rupees_per_point (Decimal): Rupees earned per point redeemed
        min_redemption_points (int): Minimum points required for redemption
        voucher_denominations (list): Available voucher amounts in rupees
        tier_thresholds (dict): Points required for each tier
        tier_multipliers (dict): Point earning multipliers for each tier
        points_expiry_months (int): Number of months after which unused points expire
        voucher_validity_days (int): Number of days a voucher remains valid
        created_at (DateTime): When this configuration was created
        updated_at (DateTime): When this configuration was last updated
        updated_by (User): Admin who last updated this configuration
    """
    
    list_display = [
        'id',
        'status_indicator',
        'points_per_rupee',
        'rupees_per_point',
        'min_redemption_points',
        'updated_by',
        'updated_at'
    ]
    
    list_filter = [
        'is_active',
        'maintenance_mode',
        'updated_at'
    ]
    
    search_fields = [
        'updated_by__email',
        'updated_by__first_name',
        'updated_by__last_name'
    ]
    
    readonly_fields = [
        'created_at',
        'updated_at'
    ]
    
    fieldsets = (
        ('System Status', {
            'fields': ('is_active', 'maintenance_mode'),
            'classes': ('wide',)
        }),
        ('Point Earning Rules', {
            'fields': (
                'points_per_rupee',
                'points_per_review', 
                'points_per_referral',
                'first_booking_bonus',
                'weekend_booking_bonus'
            ),
            'classes': ('wide',)
        }),
        ('Redemption Rules', {
            'fields': (
                'rupees_per_point',
                'min_redemption_points',
                'voucher_denominations'
            ),
            'classes': ('wide',)
        }),
        ('Tier System', {
            'fields': (
                'tier_thresholds',
                'tier_multipliers'
            ),
            'classes': ('wide',)
        }),
        ('Expiry Rules', {
            'fields': (
                'points_expiry_months',
                'voucher_validity_days'
            ),
            'classes': ('wide',)
        }),
        ('Audit Information', {
            'fields': (
                'created_at',
                'updated_at',
                'updated_by'
            ),
            'classes': ('collapse',)
        }),
    )
    
    def status_indicator(self, obj):
        """
        Display visual status indicator for the configuration.
        
        Args:
            obj (RewardsConfig): The rewards configuration instance
            
        Returns:
            str: HTML formatted status indicator
        """
        if obj.maintenance_mode:
            return format_html(
                '<span style="color: orange; font-weight: bold;">🔧 Maintenance</span>'
            )
        elif obj.is_active:
            return format_html(
                '<span style="color: green; font-weight: bold;">✅ Active</span>'
            )
        else:
            return format_html(
                '<span style="color: red; font-weight: bold;">❌ Inactive</span>'
            )
    
    status_indicator.short_description = 'Status'
    
    def save_model(self, request, obj, form, change):
        """
        Automatically set the updated_by field when saving.
        
        Args:
            request (HttpRequest): The HTTP request object
            obj (RewardsConfig): The rewards configuration instance
            form (Form): The form instance
            change (bool): Whether this is a change or creation
        """
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)
    
    def has_delete_permission(self, request, obj=None):
        """
        Prevent deletion of active configurations.
        
        Args:
            request (HttpRequest): The HTTP request object
            obj (RewardsConfig, optional): The rewards configuration instance
            
        Returns:
            bool: Whether deletion is permitted
        """
        if obj and obj.is_active:
            return False
        return super().has_delete_permission(request, obj)


@admin.register(RewardVoucher)
class RewardVoucherAdmin(ModelAdmin):
    """
    PHASE 2.5: Comprehensive Admin interface for voucher management.
    
    Features:
    - QR code display and generation
    - Bulk operations (extend, cancel, etc.)
    - Advanced filtering and search
    - Voucher analytics and reporting
    - Status management
    - User-friendly voucher details
    
    Fields:
        voucher_code (str): Unique voucher code for redemption
        user (User): User who redeemed points for this voucher
        value (Decimal): Voucher value in rupees
        points_redeemed (int): Number of points redeemed to create this voucher
        status (str): Current voucher status
        used_amount (Decimal): Amount of voucher that has been used
        used_at (DateTime): When the voucher was used
        booking (Booking): Booking where this voucher was used
        qr_code_data (str): QR code data for mobile redemption
        metadata (dict): Additional voucher metadata
        created_at (DateTime): When the voucher was created
        expires_at (DateTime): When the voucher expires
        updated_at (DateTime): When this voucher was last updated
    """
    
    list_display = [
        'voucher_code_display',
        'user_info',
        'value_display',
        'status_indicator',
        'usage_info',
        'expiry_status',
        'qr_code_preview',
        'created_at'
    ]
    
    list_filter = [
        'status',
        'created_at',
        'expires_at',
        'used_at',
        'value',
        'points_redeemed',
        'user__role'
    ]
    
    search_fields = [
        'voucher_code',
        'user__email',
        'user__first_name',
        'user__last_name',
        'booking__id'
    ]
    
    readonly_fields = [
        'voucher_code',
        'qr_code_display',
        'qr_code_data',
        'created_at',
        'updated_at',
        'usage_summary',
        'related_transactions'
    ]
    
    fieldsets = (
        ('Voucher Information', {
            'fields': (
                'voucher_code',
                'user',
                'value',
                'points_redeemed',
                'status'
            )
        }),
        ('Usage Details', {
            'fields': (
                'used_amount',
                'used_at',
                'booking',
                'usage_summary'
            )
        }),
        ('Expiry & Dates', {
            'fields': (
                'expires_at',
                'created_at',
                'updated_at'
            )
        }),
        ('QR Code', {
            'fields': (
                'qr_code_display',
                'qr_code_data'
            ),
            'classes': ('collapse',)
        }),
        ('System Data', {
            'fields': (
                'metadata',
                'related_transactions'
            ),
            'classes': ('collapse',)
        })
    )
    
    actions = [
        'extend_expiry',
        'cancel_vouchers',
        'export_vouchers',
        'generate_qr_codes'
    ]
    
    def get_queryset(self, request):
        """
        Optimize queryset with select_related.
        
        Args:
            request (HttpRequest): The HTTP request object
            
        Returns:
            QuerySet: Optimized queryset
        """
        return super().get_queryset(request).select_related('user', 'booking')
    
    def voucher_code_display(self, obj):
        """
        Display voucher code with copy functionality.
        
        Args:
            obj (RewardVoucher): The reward voucher instance
            
        Returns:
            str: HTML formatted voucher code
        """
        return format_html(
            '<code style="background: #f8f9fa; padding: 4px 8px; border-radius: 4px; font-family: monospace;">{}</code>',
            obj.voucher_code
        )
    voucher_code_display.short_description = 'Voucher Code'
    voucher_code_display.admin_order_field = 'voucher_code'
    
    def user_info(self, obj):
        """
        Display user information with profile link.
        
        Args:
            obj (RewardVoucher): The reward voucher instance
            
        Returns:
            str: HTML formatted user information
        """
        return format_html(
            '<a href="/admin/accounts/user/{}/change/" target="_blank">{}</a><br>'
            '<small style="color: #6c757d;">{}</small>',
            obj.user.id,
            obj.user.get_full_name() or obj.user.email,
            obj.user.email
        )
    user_info.short_description = 'User'
    user_info.admin_order_field = 'user__first_name'
    
    def value_display(self, obj):
        """
        Display voucher value with usage indicator.
        
        Args:
            obj (RewardVoucher): The reward voucher instance
            
        Returns:
            str: HTML formatted value display
        """
        used_percentage = (obj.used_amount / obj.value * 100) if obj.value > 0 else 0
        
        if obj.status == 'used':
            color = '#dc3545'  # Red
        elif used_percentage > 0:
            color = '#ffc107'  # Yellow
        else:
            color = '#28a745'  # Green
            
        return format_html(
            '<div style="display: flex; align-items: center;">'
            '<strong style="color: {};">Rs. {}</strong>'
            '<div style="margin-left: 8px; width: 60px; height: 8px; background: #e9ecef; border-radius: 4px;">'
            '<div style="width: {}%; height: 100%; background: {}; border-radius: 4px;"></div>'
            '</div>'
            '</div>',
            color, obj.value, used_percentage, color
        )
    value_display.short_description = 'Value & Usage'
    value_display.admin_order_field = 'value'
    
    def status_indicator(self, obj):
        """
        Display status with color coding.
        
        Args:
            obj (RewardVoucher): The reward voucher instance
            
        Returns:
            str: HTML formatted status indicator
        """
        status_colors = {
            'active': '#28a745',
            'used': '#6c757d',
            'expired': '#dc3545',
            'cancelled': '#fd7e14'
        }
        color = status_colors.get(obj.status, '#6c757d')
        
        return format_html(
            '<span style="display: inline-block; padding: 4px 8px; background: {}; color: white; '
            'border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase;">{}</span>',
            color, obj.status
        )
    status_indicator.short_description = 'Status'
    status_indicator.admin_order_field = 'status'
    
    def usage_info(self, obj):
        """
        Display usage information.
        
        Args:
            obj (RewardVoucher): The reward voucher instance
            
        Returns:
            str: HTML formatted usage information
        """
        if obj.used_amount > 0:
            remaining = obj.value - obj.used_amount
            return format_html(
                '<div style="font-size: 12px;">'
                '<div>Used: Rs. {}</div>'
                '<div style="color: #28a745;">Remaining: Rs. {}</div>'
                '</div>',
                obj.used_amount, remaining
            )
        return format_html('<small style="color: #6c757d;">Unused</small>')
    usage_info.short_description = 'Usage'
    
    def expiry_status(self, obj):
        """
        Display expiry status with countdown.
        
        Args:
            obj (RewardVoucher): The reward voucher instance
            
        Returns:
            str: HTML formatted expiry status
        """
        if obj.is_expired:
            return format_html(
                '<span style="color: #dc3545; font-weight: bold;">Expired</span><br>'
                '<small>{}</small>',
                obj.expires_at.strftime('%Y-%m-%d')
            )
        
        days_left = (obj.expires_at - timezone.now()).days
        if days_left <= 7:
            color = '#dc3545'  # Red for urgent
        elif days_left <= 30:
            color = '#ffc107'  # Yellow for warning
        else:
            color = '#28a745'  # Green for safe
            
        return format_html(
            '<span style="color: {}; font-weight: bold;">{} days</span><br>'
            '<small>{}</small>',
            color, days_left, obj.expires_at.strftime('%Y-%m-%d')
        )
    expiry_status.short_description = 'Expires'
    expiry_status.admin_order_field = 'expires_at'
    
    def qr_code_preview(self, obj):
        """
        Display small QR code preview with modal link.
        
        Args:
            obj (RewardVoucher): The reward voucher instance
            
        Returns:
            str: HTML formatted QR code preview
        """
        try:
            # Generate small QR code
            qr = qrcode.QRCode(version=1, box_size=2, border=1)
            qr.add_data(obj.qr_code_data)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_str = base64.b64encode(buffer.getvalue()).decode()
            
            return format_html(
                '<img src="data:image/png;base64,{}" style="width: 40px; height: 40px; cursor: pointer;" '
                'onclick="showQRModal(\'{}\', \'{}\')" title="Click to view full size"/>',
                img_str, obj.voucher_code, img_str
            )
        except Exception:
            return format_html('<small style="color: #dc3545;">Error generating QR</small>')
    qr_code_preview.short_description = 'QR Code'
    
    def qr_code_display(self, obj):
        """
        Display full-size QR code for voucher.
        
        Args:
            obj (RewardVoucher): The reward voucher instance
            
        Returns:
            str: HTML formatted full-size QR code
        """
        try:
            # Generate full-size QR code
            qr = qrcode.QRCode(version=1, box_size=10, border=4)
            qr.add_data(obj.qr_code_data)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_str = base64.b64encode(buffer.getvalue()).decode()
            
            return format_html(
                '<div style="text-align: center; padding: 20px; background: white; border: 1px solid #ddd;">'
                '<img src="data:image/png;base64,{}" style="max-width: 300px;"/><br>'
                '<p style="margin-top: 10px; font-family: monospace; font-size: 14px;">{}</p>'
                '</div>',
                img_str, obj.voucher_code
            )
        except Exception as e:
            return format_html('<p style="color: red;">Error generating QR code: {}</p>', str(e))
    qr_code_display.short_description = 'QR Code'
    
    def usage_summary(self, obj):
        """
        Display detailed usage summary.
        
        Args:
            obj (RewardVoucher): The reward voucher instance
            
        Returns:
            str: HTML formatted usage summary
        """
        html = '<div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">'
        html += f'<h4>Voucher Usage Summary</h4>'
        html += f'<table style="width: 100%; border-collapse: collapse;">'
        html += f'<tr><td><strong>Original Value:</strong></td><td>Rs. {obj.value}</td></tr>'
        html += f'<tr><td><strong>Points Cost:</strong></td><td>{obj.points_redeemed} points</td></tr>'
        html += f'<tr><td><strong>Used Amount:</strong></td><td>Rs. {obj.used_amount}</td></tr>'
        html += f'<tr><td><strong>Remaining:</strong></td><td>Rs. {obj.remaining_value}</td></tr>'
        html += f'<tr><td><strong>Usage Percentage:</strong></td><td>{(obj.used_amount/obj.value*100):.1f}%</td></tr>'
        
        if obj.booking:
            html += f'<tr><td><strong>Used in Booking:</strong></td><td><a href="/admin/bookings/booking/{obj.booking.id}/change/">#{obj.booking.id}</a></td></tr>'
        
        if obj.used_at:
            html += f'<tr><td><strong>Used Date:</strong></td><td>{obj.used_at.strftime("%Y-%m-%d %H:%M")}</td></tr>'
            
        html += '</table></div>'
        return format_html(html)
    usage_summary.short_description = 'Usage Summary'
    
    def related_transactions(self, obj):
        """
        Display related points transactions.
        
        Args:
            obj (RewardVoucher): The reward voucher instance
            
        Returns:
            str: HTML formatted related transactions
        """
        transactions = PointsTransaction.objects.filter(voucher=obj)
        
        if not transactions.exists():
            return format_html('<p>No related transactions found.</p>')
        
        html = '<div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">'
        html += '<h4>Related Transactions</h4>'
        html += '<table style="width: 100%; border-collapse: collapse; font-size: 12px;">'
        html += '<tr style="background: #e9ecef;"><th>Date</th><th>Type</th><th>Points</th><th>Description</th></tr>'
        
        for tx in transactions:
            color = 'green' if tx.points > 0 else 'red'
            html += f'<tr>'
            html += f'<td>{tx.created_at.strftime("%Y-%m-%d")}</td>'
            html += f'<td>{tx.transaction_type}</td>'
            html += f'<td style="color: {color};">{tx.points:+d}</td>'
            html += f'<td>{tx.description}</td>'
            html += f'</tr>'
            
        html += '</table></div>'
        return format_html(html)
    related_transactions.short_description = 'Related Transactions'
    
    # === BULK ACTIONS ===
    
    def extend_expiry(self, request, queryset):
        """
        Bulk action to extend voucher expiry.
        
        Args:
            request (HttpRequest): The HTTP request object
            queryset (QuerySet): Selected vouchers
            
        Returns:
            HttpResponse: Redirect or render response
        """
        if 'apply' in request.POST:
            days = int(request.POST.get('days', 30))
            count = 0
            
            for voucher in queryset:
                if voucher.status == 'active':
                    voucher.extend_expiry(days)
                    count += 1
            
            self.message_user(
                request,
                f'Successfully extended expiry for {count} vouchers by {days} days.',
                messages.SUCCESS
            )
            return redirect(request.get_full_path())
        
        return render(request, 'admin/rewards/voucher_extend_expiry.html', {
            'vouchers': queryset,
            'action_checkbox_name': admin.ACTION_CHECKBOX_NAME,
        })
    extend_expiry.short_description = "Extend expiry date"
    
    def cancel_vouchers(self, request, queryset):
        """
        Bulk action to cancel vouchers.
        
        Args:
            request (HttpRequest): The HTTP request object
            queryset (QuerySet): Selected vouchers
            
        Returns:
            HttpResponse: Redirect or render response
        """
        if 'apply' in request.POST:
            reason = request.POST.get('reason', 'Bulk cancellation by admin')
            count = 0
            
            for voucher in queryset:
                if voucher.status == 'active':
                    try:
                        voucher.cancel_voucher(reason=reason)
                        count += 1
                    except ValueError as e:
                        continue
            
            self.message_user(
                request,
                f'Successfully cancelled {count} vouchers.',
                messages.SUCCESS
            )
            return redirect(request.get_full_path())
        
        return render(request, 'admin/rewards/voucher_cancel.html', {
            'vouchers': queryset,
            'action_checkbox_name': admin.ACTION_CHECKBOX_NAME,
        })
    cancel_vouchers.short_description = "Cancel selected vouchers"
    
    def export_vouchers(self, request, queryset):
        """
        Export vouchers to CSV.
        
        Args:
            request (HttpRequest): The HTTP request object
            queryset (QuerySet): Selected vouchers
            
        Returns:
            HttpResponse: CSV file response
        """
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="vouchers_export.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Voucher Code', 'User Email', 'Value', 'Status', 'Used Amount',
            'Remaining', 'Created', 'Expires', 'Used Date'
        ])
        
        for voucher in queryset:
            writer.writerow([
                voucher.voucher_code,
                voucher.user.email,
                voucher.value,
                voucher.status,
                voucher.used_amount,
                voucher.remaining_value,
                voucher.created_at.strftime('%Y-%m-%d'),
                voucher.expires_at.strftime('%Y-%m-%d'),
                voucher.used_at.strftime('%Y-%m-%d') if voucher.used_at else ''
            ])
        
        return response
    export_vouchers.short_description = "Export to CSV"
    
    def generate_qr_codes(self, request, queryset):
        """
        Generate QR codes for selected vouchers.
        
        Args:
            request (HttpRequest): The HTTP request object
            queryset (QuerySet): Selected vouchers
        """
        # This would typically generate a PDF with QR codes
        # For now, we'll just update the QR code data
        count = 0
        for voucher in queryset:
            if not voucher.qr_code_data:
                voucher.qr_code_data = voucher.generate_qr_data()
                voucher.save(update_fields=['qr_code_data'])
                count += 1
        
        self.message_user(
            request,
            f'Generated QR codes for {count} vouchers.',
            messages.SUCCESS
        )
    generate_qr_codes.short_description = "Generate QR codes"
    
    def get_urls(self):
        """
        Add custom URLs for voucher management.
        
        Returns:
            list: URL patterns
        """
        urls = super().get_urls()
        from django.urls import path
        custom_urls = [
            path('analytics/', self.admin_site.admin_view(self.voucher_analytics_view), name='voucher_analytics'),
            path('bulk_create/', self.admin_site.admin_view(self.bulk_create_view), name='voucher_bulk_create'),
        ]
        return custom_urls + urls
    
    def voucher_analytics_view(self, request):
        """
        Custom view for voucher analytics.
        
        Args:
            request (HttpRequest): The HTTP request object
            
        Returns:
            HttpResponse: Rendered analytics view
        """
        from django.db.models import Q, Avg, Sum
        from datetime import datetime, timedelta
        
        # Calculate analytics
        total_vouchers = RewardVoucher.objects.count()
        active_vouchers = RewardVoucher.objects.filter(status='active').count()
        used_vouchers = RewardVoucher.objects.filter(status='used').count()
        expired_vouchers = RewardVoucher.objects.filter(status='expired').count()
        
        total_value = RewardVoucher.objects.aggregate(Sum('value'))['value__sum'] or 0
        total_used = RewardVoucher.objects.aggregate(Sum('used_amount'))['used_amount__sum'] or 0
        
        # Recent activity
        last_30_days = timezone.now() - timedelta(days=30)
        recent_vouchers = RewardVoucher.objects.filter(created_at__gte=last_30_days).count()
        recent_usage = RewardVoucher.objects.filter(used_at__gte=last_30_days).count()
        
        context = {
            'title': 'Voucher Analytics',
            'total_vouchers': total_vouchers,
            'active_vouchers': active_vouchers,
            'used_vouchers': used_vouchers,
            'expired_vouchers': expired_vouchers,
            'total_value': total_value,
            'total_used': total_used,
            'utilization_rate': (total_used / total_value * 100) if total_value > 0 else 0,
            'recent_vouchers': recent_vouchers,
            'recent_usage': recent_usage,
        }
        
        return render(request, 'admin/rewards/voucher_analytics.html', context)
    
    def bulk_create_view(self, request):
        """
        Custom view for bulk voucher creation.
        
        Args:
            request (HttpRequest): The HTTP request object
            
        Returns:
            HttpResponse: Rendered bulk create view
        """
        if request.method == 'POST':
            # Handle bulk creation logic here
            pass
        
        return render(request, 'admin/rewards/voucher_bulk_create.html')
    
    class Media:
        """Add custom CSS and JS for enhanced admin interface."""
        css = {
            'all': ('admin/css/voucher_admin.css',)
        }
        js = ('admin/js/voucher_admin.js',)


@admin.register(RewardAccount)
class RewardAccountAdmin(ModelAdmin):
    """
    Admin interface for viewing and managing user reward accounts.
    
    Features:
    - Comprehensive account overview
    - Points adjustment capabilities
    - Tier management
    - Activity tracking
    
    Fields:
        user (User): User who owns this reward account
        current_balance (int): Current available points balance
        total_points_earned (int): Total points earned throughout account lifetime
        total_points_redeemed (int): Total points redeemed throughout account lifetime
        tier_level (str): Current customer tier
        tier_updated_at (DateTime): When the tier was last updated
        lifetime_value (Decimal): Total amount spent by user across all bookings
        last_points_earned (DateTime): When user last earned points
        last_points_redeemed (DateTime): When user last redeemed points
        total_referrals (int): Number of successful referrals made by this user
        created_at (DateTime): When this account was created
        updated_at (DateTime): When this account was last updated
    """
    
    list_display = [
        'user_name',
        'user_email',
        'current_balance',
        'tier_badge',
        'total_points_earned',
        'total_points_redeemed',
        'lifetime_value',
        'last_activity'
    ]
    
    list_filter = [
        'tier_level',
        'created_at',
        'tier_updated_at'
    ]
    
    search_fields = [
        'user__email',
        'user__first_name',
        'user__last_name',
        'user__username'
    ]
    
    readonly_fields = [
        'created_at',
        'updated_at',
        'tier_updated_at',
        'get_tier_progress_display'
    ]
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',),
            'classes': ('wide',)
        }),
        ('Points Balance', {
            'fields': (
                'current_balance',
                'total_points_earned',
                'total_points_redeemed'
            ),
            'classes': ('wide',)
        }),
        ('Tier Information', {
            'fields': (
                'tier_level',
                'tier_updated_at',
                'get_tier_progress_display'
            ),
            'classes': ('wide',)
        }),
        ('Engagement Metrics', {
            'fields': (
                'lifetime_value',
                'total_referrals',
                'last_points_earned',
                'last_points_redeemed'
            ),
            'classes': ('wide',)
        }),
        ('Audit Information', {
            'fields': (
                'created_at',
                'updated_at'
            ),
            'classes': ('collapse',)
        }),
    )
    
    def user_name(self, obj):
        """
        Display user's full name.
        
        Args:
            obj (RewardAccount): The reward account instance
            
        Returns:
            str: User's full name
        """
        return obj.user.get_full_name() or obj.user.username
    
    user_name.short_description = 'User Name'
    user_name.admin_order_field = 'user__first_name'
    
    def user_email(self, obj):
        """
        Display user's email address.
        
        Args:
            obj (RewardAccount): The reward account instance
            
        Returns:
            str: User's email address
        """
        return obj.user.email
    
    user_email.short_description = 'Email'
    user_email.admin_order_field = 'user__email'
    
    def tier_badge(self, obj):
        """
        Display tier as a colored badge.
        
        Args:
            obj (RewardAccount): The reward account instance
            
        Returns:
            str: HTML formatted tier badge
        """
        colors = {
            'bronze': '#CD7F32',
            'silver': '#C0C0C0', 
            'gold': '#FFD700',
            'platinum': '#E5E4E2'
        }
        
        color = colors.get(obj.tier_level, '#CD7F32')
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>',
            color,
            obj.get_tier_level_display().upper()
        )
    
    tier_badge.short_description = 'Tier'
    tier_badge.admin_order_field = 'tier_level'
    
    def last_activity(self, obj):
        """
        Display most recent points activity.
        
        Args:
            obj (RewardAccount): The reward account instance
            
        Returns:
            str: HTML formatted last activity information
        """
        last_earned = obj.last_points_earned
        last_redeemed = obj.last_points_redeemed
        
        if not last_earned and not last_redeemed:
            return "No activity"
        
        if not last_redeemed or (last_earned and last_earned > last_redeemed):
            return format_html(
                '<span style="color: green;">Earned: {}</span>',
                last_earned.strftime('%Y-%m-%d')
            )
        else:
            return format_html(
                '<span style="color: orange;">Redeemed: {}</span>',
                last_redeemed.strftime('%Y-%m-%d')
            )
    
    last_activity.short_description = 'Last Activity'
    
    def get_tier_progress_display(self, obj):
        """
        Display tier progress information.
        
        Args:
            obj (RewardAccount): The reward account instance
            
        Returns:
            str: HTML formatted tier progress information
        """
        progress = obj.get_tier_progress()
        
        if progress['is_max_tier']:
            return "🏆 Maximum tier reached"
        
        return format_html(
            'Progress to {}: {}/{} points ({}%)<br>'
            '<div style="background-color: #f0f0f0; border-radius: 10px; overflow: hidden; width: 200px; height: 10px;">'
            '<div style="background-color: #4CAF50; height: 100%; width: {}%;"></div></div>',
            progress['next_tier'].title(),
            obj.total_points_earned,
            obj.total_points_earned + progress['points_needed'],
            progress['progress_percentage'],
            progress['progress_percentage']
        )
    
    get_tier_progress_display.short_description = 'Tier Progress'
    
    actions = ['reset_points_balance', 'upgrade_to_next_tier']
    
    def reset_points_balance(self, request, queryset):
        """
        Admin action to reset points balance (for testing/support).
        
        Args:
            request (HttpRequest): The HTTP request object
            queryset (QuerySet): Selected reward accounts
        """
        for account in queryset:
            # Create adjustment transaction
            PointsTransaction.objects.create(
                user=account.user,
                transaction_type='adjustment_negative',
                points=-account.current_balance,
                balance_after=0,
                description=f"Admin reset by {request.user.get_full_name()}",
                processed_by=request.user
            )
            
            # Reset balance
            account.current_balance = 0
            account.save()
        
        self.message_user(
            request,
            f"Successfully reset points balance for {queryset.count()} accounts."
        )
    
    reset_points_balance.short_description = "Reset points balance to zero"
    
    def upgrade_to_next_tier(self, request, queryset):
        """
        Admin action to upgrade users to next tier (for testing/support).
        
        Args:
            request (HttpRequest): The HTTP request object
            queryset (QuerySet): Selected reward accounts
        """
        count = 0
        for account in queryset:
            progress = account.get_tier_progress()
            if not progress['is_max_tier']:
                # Add enough points to reach next tier
                points_needed = progress['points_needed'] + 1
                
                account.add_points(
                    points=points_needed,
                    transaction_type='earned_admin_bonus',
                    description=f"Tier upgrade bonus by {request.user.get_full_name()}"
                )
                count += 1
        
        self.message_user(
            request,
            f"Successfully upgraded {count} accounts to next tier."
        )
    
    upgrade_to_next_tier.short_description = "Upgrade to next tier"


@admin.register(PointsTransaction)
class PointsTransactionAdmin(ModelAdmin):
    """
    Admin interface for viewing points transaction history.
    
    Features:
    - Complete transaction audit trail
    - Filtering by transaction type and user
    - Related object links
    - Transaction analytics
    
    Fields:
        transaction_id (UUID): Unique identifier for this transaction
        user (User): User who performed this transaction
        transaction_type (str): Type of points transaction
        points (int): Points amount (positive for earning, negative for redemption)
        balance_after (int): User's points balance after this transaction
        description (str): Human-readable description of the transaction
        metadata (dict): Additional transaction data
        booking (Booking): Related booking if applicable
        voucher (RewardVoucher): Related voucher if applicable
        processed_by (User): Admin who processed this transaction
        created_at (DateTime): When this transaction was created
    """
    
    list_display = [
        'transaction_id_short',
        'user_name',
        'transaction_type',
        'points_display',
        'balance_after',
        'description_short',
        'created_at'
    ]
    
    list_filter = [
        'transaction_type',
        'created_at',
        ('booking', admin.RelatedOnlyFieldListFilter),
        ('voucher', admin.RelatedOnlyFieldListFilter)
    ]
    
    search_fields = [
        'user__email',
        'user__first_name',
        'user__last_name',
        'description',
        'transaction_id'
    ]
    
    readonly_fields = [
        'transaction_id',
        'created_at',
        'balance_after'
    ]
    
    fieldsets = (
        ('Transaction Details', {
            'fields': (
                'transaction_id',
                'user',
                'transaction_type',
                'points',
                'balance_after',
                'description'
            ),
            'classes': ('wide',)
        }),
        ('Related Objects', {
            'fields': (
                'booking',
                'voucher',
                'processed_by'
            ),
            'classes': ('wide',)
        }),
        ('Additional Data', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Audit Information', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def user_name(self, obj):
        """
        Display user's full name.
        
        Args:
            obj (PointsTransaction): The points transaction instance
            
        Returns:
            str: User's full name
        """
        return obj.user.get_full_name() or obj.user.username
    
    user_name.short_description = 'User'
    user_name.admin_order_field = 'user__first_name'
    
    def transaction_id_short(self, obj):
        """
        Display shortened transaction ID.
        
        Args:
            obj (PointsTransaction): The points transaction instance
            
        Returns:
            str: Shortened transaction ID
        """
        return str(obj.transaction_id)[:8] + '...'
    
    transaction_id_short.short_description = 'Transaction ID'
    transaction_id_short.admin_order_field = 'transaction_id'
    
    def points_display(self, obj):
        """
        Display points with color coding.
        
        Args:
            obj (PointsTransaction): The points transaction instance
            
        Returns:
            str: HTML formatted points display
        """
        if obj.points > 0:
            return format_html(
                '<span style="color: green; font-weight: bold;">+{}</span>',
                obj.points
            )
        else:
            return format_html(
                '<span style="color: red; font-weight: bold;">{}</span>',
                obj.points
            )
    
    points_display.short_description = 'Points'
    points_display.admin_order_field = 'points'
    
    def description_short(self, obj):
        """
        Display shortened description.
        
        Args:
            obj (PointsTransaction): The points transaction instance
            
        Returns:
            str: Shortened description
        """
        if len(obj.description) > 50:
            return obj.description[:47] + '...'
        return obj.description
    
    description_short.short_description = 'Description'
    description_short.admin_order_field = 'description'
    
    def has_add_permission(self, request):
        """
        Prevent manual addition of transactions through admin.
        
        Args:
            request (HttpRequest): The HTTP request object
            
        Returns:
            bool: False to prevent addition
        """
        return False
    
    def has_change_permission(self, request, obj=None):
        """
        Prevent editing of transactions (audit trail integrity).
        
        Args:
            request (HttpRequest): The HTTP request object
            obj (PointsTransaction, optional): The points transaction instance
            
        Returns:
            bool: False to prevent changes
        """
        return False
    
    def has_delete_permission(self, request, obj=None):
        """
        Prevent deletion of transactions (audit trail integrity).
        
        Args:
            request (HttpRequest): The HTTP request object
            obj (PointsTransaction, optional): The points transaction instance
            
        Returns:
            bool: False to prevent deletion
        """
        return False


# Custom admin site modifications
admin.site.site_header = "SewaBazaar Rewards Administration"
admin.site.site_title = "SewaBazaar Rewards Admin"
admin.site.index_title = "Welcome to SewaBazaar Rewards Administration"