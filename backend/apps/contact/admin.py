from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from django.contrib import messages
from .models import ContactMessage, ContactMessageAttachment


class ContactMessageAttachmentInline(admin.TabularInline):
    """
    Inline admin for contact message attachments.
    
    This inline allows viewing and managing attachments directly from the
    contact message admin interface.
    """
    model = ContactMessageAttachment
    extra = 0
    readonly_fields = ['file_size_formatted', 'uploaded_at']
    fields = ['file', 'original_filename', 'file_size_formatted', 'content_type', 'uploaded_at']


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    """
    Admin interface for contact messages.
    
    Provides a comprehensive admin interface for managing contact messages
    including list display, filtering, search, field organization, and custom actions.
    """
    
    list_display = [
        'id', 'name', 'email', 'subject_truncated', 'status_badge', 
        'priority_badge', 'created_at', 'is_responded', 'admin_actions'
    ]
    list_filter = [
        'status', 'priority', 'is_spam', 'is_important', 
        'created_at', 'responded_at'
    ]
    search_fields = ['name', 'email', 'subject', 'message']
    readonly_fields = [
        'id', 'user', 'ip_address', 'user_agent', 'created_at', 
        'updated_at', 'is_responded', 'response_time'
    ]
    
    fieldsets = [
        ('Message Information', {
            'fields': ['name', 'email', 'subject', 'message']
        }),
        ('User Information', {
            'fields': ['user', 'ip_address', 'user_agent'],
            'classes': ['collapse']
        }),
        ('Management', {
            'fields': ['status', 'priority', 'is_spam', 'is_important']
        }),
        ('Admin Response', {
            'fields': ['admin_response', 'responded_by', 'responded_at']
        }),
        ('Metadata', {
            'fields': ['id', 'created_at', 'updated_at', 'is_responded', 'response_time'],
            'classes': ['collapse']
        })
    ]
    
    inlines = [ContactMessageAttachmentInline]
    
    actions = [
        'mark_as_resolved', 'mark_as_spam', 'mark_as_important',
        'mark_as_in_progress', 'send_bulk_response'
    ]
    
    def subject_truncated(self, obj):
        """
        Display truncated subject.
        
        Shows a truncated version of the subject (max 50 characters) for better
        display in the admin list view.
        
        Args:
            obj (ContactMessage): The contact message instance
            
        Returns:
            str: Truncated subject
        """
        if len(obj.subject) > 50:
            return f"{obj.subject[:50]}..."
        return obj.subject
    subject_truncated.short_description = 'Subject'
    
    def status_badge(self, obj):
        """
        Display status as colored badge.
        
        Shows the message status as a colored badge for quick visual identification.
        
        Args:
            obj (ContactMessage): The contact message instance
            
        Returns:
            str: HTML formatted status badge
        """
        colors = {
            'pending': '#fbbf24',  # yellow
            'in_progress': '#3b82f6',  # blue
            'resolved': '#10b981',  # green
            'closed': '#6b7280'  # gray
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def priority_badge(self, obj):
        """
        Display priority as colored badge.
        
        Shows the message priority as a colored badge for quick visual identification.
        
        Args:
            obj (ContactMessage): The contact message instance
            
        Returns:
            str: HTML formatted priority badge
        """
        colors = {
            'low': '#10b981',  # green
            'medium': '#f59e0b',  # amber
            'high': '#ef4444',  # red
            'urgent': '#dc2626'  # dark red
        }
        color = colors.get(obj.priority, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_priority_display()
        )
    priority_badge.short_description = 'Priority'
    
    def is_responded(self, obj):
        """
        Display response status.
        
        Shows whether the message has been responded to with a colored indicator.
        
        Args:
            obj (ContactMessage): The contact message instance
            
        Returns:
            str: HTML formatted response status indicator
        """
        if obj.is_responded:
            return format_html(
                '<span style="color: #10b981;">✓ Responded</span>'
            )
        return format_html(
            '<span style="color: #ef4444;">✗ No Response</span>'
        )
    is_responded.short_description = 'Response Status'
    
    def admin_actions(self, obj):
        """
        Display quick action buttons.
        
        Shows quick action buttons for common operations directly in the list view.
        
        Args:
            obj (ContactMessage): The contact message instance
            
        Returns:
            str: HTML formatted action buttons
        """
        actions = []
        
        if obj.status == 'pending':
            actions.append(
                f'<a href="#" onclick="updateStatus({obj.id}, \'in_progress\')" '
                f'style="color: #3b82f6; text-decoration: none;">Start</a>'
            )
        
        if obj.status in ['pending', 'in_progress']:
            actions.append(
                f'<a href="#" onclick="updateStatus({obj.id}, \'resolved\')" '
                f'style="color: #10b981; text-decoration: none;">Resolve</a>'
            )
        
        if not obj.is_spam:
            actions.append(
                f'<a href="#" onclick="markSpam({obj.id})" '
                f'style="color: #ef4444; text-decoration: none;">Spam</a>'
            )
        
        return format_html(' | '.join(actions))
    admin_actions.short_description = 'Quick Actions'
    
    def mark_as_resolved(self, request, queryset):
        """
        Mark selected messages as resolved.
        
        Bulk action to mark multiple contact messages as resolved and set
        the responded timestamp to the current time.
        
        Args:
            request (HttpRequest): The HTTP request object
            queryset (QuerySet): The selected contact messages
        """
        updated = queryset.update(
            status='resolved',
            responded_at=timezone.now()
        )
        self.message_user(
            request,
            f'{updated} messages marked as resolved.',
            messages.SUCCESS
        )
    mark_as_resolved.short_description = 'Mark as resolved'
    
    def mark_as_spam(self, request, queryset):
        """
        Mark selected messages as spam.
        
        Bulk action to mark multiple contact messages as spam and close them.
        
        Args:
            request (HttpRequest): The HTTP request object
            queryset (QuerySet): The selected contact messages
        """
        updated = queryset.update(is_spam=True, status='closed')
        self.message_user(
            request,
            f'{updated} messages marked as spam.',
            messages.SUCCESS
        )
    mark_as_spam.short_description = 'Mark as spam'
    
    def mark_as_important(self, request, queryset):
        """
        Mark selected messages as important.
        
        Bulk action to mark multiple contact messages as important for priority handling.
        
        Args:
            request (HttpRequest): The HTTP request object
            queryset (QuerySet): The selected contact messages
        """
        updated = queryset.update(is_important=True)
        self.message_user(
            request,
            f'{updated} messages marked as important.',
            messages.SUCCESS
        )
    mark_as_important.short_description = 'Mark as important'
    
    def mark_as_in_progress(self, request, queryset):
        """
        Mark selected messages as in progress.
        
        Bulk action to mark multiple contact messages as in progress.
        
        Args:
            request (HttpRequest): The HTTP request object
            queryset (QuerySet): The selected contact messages
        """
        updated = queryset.update(status='in_progress')
        self.message_user(
            request,
            f'{updated} messages marked as in progress.',
            messages.SUCCESS
        )
    mark_as_in_progress.short_description = 'Mark as in progress'
    
    def send_bulk_response(self, request, queryset):
        """
        Send bulk response to selected messages.
        
        Placeholder for a bulk response feature that would allow admins to
        send the same response to multiple messages at once.
        
        Args:
            request (HttpRequest): The HTTP request object
            queryset (QuerySet): The selected contact messages
        """
        # This would open a form to compose a bulk response
        # For now, just show a message
        self.message_user(
            request,
            f'Bulk response feature coming soon for {queryset.count()} messages.',
            messages.INFO
        )
    send_bulk_response.short_description = 'Send bulk response'
    
    class Media:
        js = ['admin/js/contact_admin.js']  # Custom JS for quick actions


@admin.register(ContactMessageAttachment)
class ContactMessageAttachmentAdmin(admin.ModelAdmin):
    """
    Admin interface for contact message attachments.
    
    Provides an admin interface for viewing and managing file attachments
    associated with contact messages.
    """
    
    list_display = [
        'id', 'message_subject', 'original_filename', 
        'file_size_formatted', 'content_type', 'uploaded_at'
    ]
    list_filter = ['content_type', 'uploaded_at']
    search_fields = ['original_filename', 'message__subject', 'message__name']
    readonly_fields = ['file_size_formatted', 'uploaded_at']
    
    def message_subject(self, obj):
        """
        Display related message subject.
        
        Shows a truncated version of the related message subject for better
        display in the admin list view.
        
        Args:
            obj (ContactMessageAttachment): The attachment instance
            
        Returns:
            str: Truncated message subject
        """
        return obj.message.subject[:50] + "..." if len(obj.message.subject) > 50 else obj.message.subject
    message_subject.short_description = 'Message Subject'