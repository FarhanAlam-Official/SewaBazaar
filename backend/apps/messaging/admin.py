"""
Admin configuration for messaging models.

This module provides Django admin interface configuration for the messaging system,
enabling administrators to view and manage conversations and messages.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Conversation, Message, MessageReadStatus
from .encryption import is_message_encrypted, decrypt_message_text


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    """Admin interface for Conversation model."""
    
    list_display = [
        'id', 
        'service_link', 
        'customer_link', 
        'provider_link', 
        'last_message_preview_short',
        'unread_count_customer',
        'unread_count_provider',
        'is_active',
        'created_at'
    ]
    list_filter = [
        'is_active',
        'provider_archived',
        'customer_archived',
        'created_at',
        'service__category'
    ]
    search_fields = [
        'service__title',
        'customer__email',
        'customer__first_name',
        'customer__last_name',
        'provider__email',
        'provider__first_name',
        'provider__last_name'
    ]
    readonly_fields = [
        'created_at',
        'last_message_at',
        'unread_count_provider',
        'unread_count_customer'
    ]
    ordering = ['-last_message_at', '-created_at']
    
    def service_link(self, obj):
        """Create a link to the service admin page."""
        url = reverse('admin:services_service_change', args=[obj.service.pk])
        return format_html('<a href="{}">{}</a>', url, obj.service.title)
    service_link.short_description = 'Service'
    
    def customer_link(self, obj):
        """Create a link to the customer admin page."""
        url = reverse('admin:accounts_user_change', args=[obj.customer.pk])
        return format_html('<a href="{}">{}</a>', url, obj.customer.full_name)
    customer_link.short_description = 'Customer'
    
    def provider_link(self, obj):
        """Create a link to the provider admin page."""
        url = reverse('admin:accounts_user_change', args=[obj.provider.pk])
        return format_html('<a href="{}">{}</a>', url, obj.provider.full_name)
    provider_link.short_description = 'Provider'
    
    def last_message_preview_short(self, obj):
        """Display a shortened version of the last message preview."""
        if obj.last_message_preview:
            preview = obj.last_message_preview[:50]
            if len(obj.last_message_preview) > 50:
                preview += "..."
            return preview
        return "-"
    last_message_preview_short.short_description = 'Last Message'


class MessageReadStatusInline(admin.TabularInline):
    """Inline admin for MessageReadStatus."""
    
    model = MessageReadStatus
    extra = 0
    readonly_fields = ['user', 'read_at']
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """Admin interface for Message model."""
    
    list_display = [
        'id',
        'conversation_link',
        'sender_link',
        'message_preview',
        'message_type',
        'status',
        'is_flagged',
        'created_at'
    ]
    list_filter = [
        'message_type',
        'status',
        'is_flagged',
        'created_at',
        'conversation__service__category'
    ]
    search_fields = [
        'text',
        'sender__email',
        'sender__first_name',
        'sender__last_name',
        'conversation__service__title'
    ]
    readonly_fields = [
        'conversation',
        'sender',
        'created_at',
        'updated_at',
        'attachment_preview',
        'decrypted_text_display'
    ]
    inlines = [MessageReadStatusInline]
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('conversation', 'sender', 'message_type', 'status')
        }),
        ('Content', {
            'fields': ('text', 'decrypted_text_display', 'attachment', 'attachment_preview'),
            'description': 'Message content is encrypted for privacy protection. Only authorized users can decrypt messages.'
        }),
        ('Moderation', {
            'fields': ('is_flagged', 'moderation_reason'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'deleted_by'),
            'classes': ('collapse',)
        }),
    )
    
    def conversation_link(self, obj):
        """Create a link to the conversation admin page."""
        url = reverse('admin:messaging_conversation_change', args=[obj.conversation.pk])
        return format_html('<a href="{}">Conversation #{}</a>', url, obj.conversation.id)
    conversation_link.short_description = 'Conversation'
    
    def sender_link(self, obj):
        """Create a link to the sender admin page."""
        url = reverse('admin:accounts_user_change', args=[obj.sender.pk])
        return format_html('<a href="{}">{}</a>', url, obj.sender.full_name)
    sender_link.short_description = 'Sender'
    
    def message_preview(self, obj):
        """Display a preview of the message content with encryption handling."""
        if obj.text:
            # Check if text is encrypted
            if is_message_encrypted(obj.text):
                # Show only encrypted indicator, not the actual content
                return format_html(
                    '<span style="color: #28a745; font-weight: bold;">🔒 [ENCRYPTED MESSAGE]</span>'
                )
            else:
                # Text is not encrypted - show warning
                preview = obj.text[:100]
                if len(obj.text) > 100:
                    preview += "..."
                return format_html(
                    '<span style="color: #dc3545; font-weight: bold;">⚠️ UNENCRYPTED: {}</span>',
                    preview
                )
        elif obj.attachment:
            return f"[{obj.message_type.upper()}] {obj.attachment.name}"
        return "-"
    message_preview.short_description = 'Preview'
    
    def attachment_preview(self, obj):
        """Display attachment preview if it's an image."""
        if obj.attachment and obj.message_type == 'image':
            return format_html(
                '<img src="{}" style="max-width: 200px; max-height: 200px;" />',
                obj.attachment.url
            )
        elif obj.attachment:
            return format_html(
                '<a href="{}" target="_blank">{}</a>',
                obj.attachment.url,
                obj.attachment.name
            )
        return "-"
    attachment_preview.short_description = 'Attachment Preview'
    
    def decrypted_text_display(self, obj):
        """Display decrypted text for admin viewing with privacy protection."""
        if not obj.text:
            return "-"
        
        if is_message_encrypted(obj.text):
            # Show privacy notice instead of actual content
            return format_html(
                '<div style="background-color: #e3f2fd; padding: 15px; border: 2px solid #2196f3; border-radius: 8px; text-align: center;">'
                '<strong style="color: #1976d2; font-size: 16px;">🔒 PRIVACY PROTECTED</strong><br>'
                '<span style="color: #666; font-size: 14px;">Message content is encrypted for privacy protection</span><br>'
                '<span style="color: #999; font-size: 12px;">Only authorized users can decrypt this message</span>'
                '</div>'
            )
        else:
            return format_html(
                '<div style="background-color: #fff3cd; padding: 10px; border: 1px solid #ffeaa7; border-radius: 4px; color: #856404;">'
                '<strong>⚠️ Unencrypted Message:</strong><br>'
                '<span style="white-space: pre-wrap;">{}</span>'
                '</div>',
                obj.text
            )
    decrypted_text_display.short_description = 'Message Content'


@admin.register(MessageReadStatus)
class MessageReadStatusAdmin(admin.ModelAdmin):
    """Admin interface for MessageReadStatus model."""
    
    list_display = [
        'id',
        'message_link',
        'user_link',
        'read_at'
    ]
    list_filter = [
        'read_at',
        'user__role'
    ]
    search_fields = [
        'user__email',
        'user__first_name',
        'user__last_name',
        'message__text'
    ]
    readonly_fields = ['message', 'user', 'read_at']
    ordering = ['-read_at']
    
    def message_link(self, obj):
        """Create a link to the message admin page."""
        url = reverse('admin:messaging_message_change', args=[obj.message.pk])
        preview = obj.message.text[:50] if obj.message.text else f"[{obj.message.message_type}]"
        return format_html('<a href="{}">{}</a>', url, preview)
    message_link.short_description = 'Message'
    
    def user_link(self, obj):
        """Create a link to the user admin page."""
        url = reverse('admin:accounts_user_change', args=[obj.user.pk])
        return format_html('<a href="{}">{}</a>', url, obj.user.full_name)
    user_link.short_description = 'User'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
