"""
Messaging models for SewaBazaar Contact Provider feature.

This module contains the database models for the messaging system that enables
communication between customers and service providers.

Models:
- Conversation: Represents a conversation thread between customer and provider
- Message: Individual messages within a conversation
- MessageReadStatus: Tracks read status of messages
"""

from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import FileExtensionValidator
from .encryption import encrypt_message_text, decrypt_message_text, is_message_encrypted


def message_attachment_path(instance, filename):
    """
    Generate upload path for message attachments.
    
    Path format: message_attachments/{conversation_id}/{timestamp}_{filename}
    """
    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    return f'message_attachments/{instance.conversation.id}/{timestamp}_{filename}'


class Conversation(models.Model):
    """
    Represents a conversation between a customer and provider about a specific service.
    
    Each conversation is tied to a specific service and involves exactly one customer
    and one provider. This model stores conversation metadata and performance metrics.
    """
    
    # Core relationships
    service = models.ForeignKey(
        'services.Service', 
        on_delete=models.CASCADE, 
        related_name='conversations',
        help_text="The service this conversation is about"
    )
    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='provider_conversations',
        limit_choices_to={'role': 'provider'},
        help_text="The service provider in this conversation"
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='customer_conversations',
        limit_choices_to={'role': 'customer'},
        help_text="The customer in this conversation"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    last_message_at = models.DateTimeField(null=True, blank=True)
    last_message_preview = models.TextField(
        max_length=100, 
        blank=True,
        help_text="Preview of the last message for conversation lists"
    )
    
    # Status and settings
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this conversation is active"
    )
    provider_archived = models.BooleanField(
        default=False,
        help_text="Whether provider has archived this conversation"
    )
    customer_archived = models.BooleanField(
        default=False,
        help_text="Whether customer has archived this conversation"
    )
    
    # Performance fields for quick queries
    unread_count_provider = models.PositiveIntegerField(
        default=0,
        help_text="Number of unread messages for provider"
    )
    unread_count_customer = models.PositiveIntegerField(
        default=0,
        help_text="Number of unread messages for customer"
    )
    
    class Meta:
        # Ensure one conversation per service-customer-provider combination
        unique_together = ['service', 'provider', 'customer']
        ordering = ['-last_message_at', '-created_at']
        indexes = [
            models.Index(fields=['provider', '-last_message_at']),
            models.Index(fields=['customer', '-last_message_at']),
            models.Index(fields=['service', 'provider', 'customer']),
        ]
        verbose_name = 'Conversation'
        verbose_name_plural = 'Conversations'

    def __str__(self):
        return f"Conversation: {self.customer.full_name} ↔ {self.provider.full_name} about {self.service.title}"
    
    def get_unread_count_for_user(self, user):
        """Get unread message count for a specific user."""
        if user == self.provider:
            return self.unread_count_provider
        elif user == self.customer:
            return self.unread_count_customer
        return 0
    
    def mark_as_read_for_user(self, user):
        """Mark all messages as read for a specific user."""
        if user == self.provider:
            self.unread_count_provider = 0
        elif user == self.customer:
            self.unread_count_customer = 0
        self.save(update_fields=['unread_count_provider', 'unread_count_customer'])


class Message(models.Model):
    """
    Represents an individual message within a conversation.
    
    Messages can be text, images, files, or system messages. Each message
    tracks its delivery status and supports soft deletion.
    """
    
    MESSAGE_TYPES = (
        ('text', 'Text Message'),
        ('image', 'Image'),
        ('file', 'File Attachment'),
        ('audio', 'Audio Message'),
        ('system', 'System Message'),
    )
    
    MESSAGE_STATUS = (
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('read', 'Read'),
    )
    
    # Core fields
    conversation = models.ForeignKey(
        Conversation, 
        related_name='messages', 
        on_delete=models.CASCADE
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        help_text="User who sent this message"
    )
    
    # Content
    message_type = models.CharField(
        max_length=20, 
        choices=MESSAGE_TYPES, 
        default='text'
    )
    text = models.TextField(
        blank=True,
        help_text="Text content of the message"
    )
    attachment = models.FileField(
        upload_to=message_attachment_path,
        null=True,
        blank=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'webm', 'mp3', 'wav', 'ogg', 'm4a', 'mp4']
            )
        ],
        help_text="File attachment (images, PDFs, documents)"
    )
    
    # Status and metadata
    status = models.CharField(
        max_length=20, 
        choices=MESSAGE_STATUS, 
        default='sent'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Soft delete functionality - stores user IDs who deleted this message
    deleted_by = models.JSONField(
        default=list,
        help_text="List of user IDs who have deleted this message"
    )
    
    # Deletion type tracking
    deletion_type = models.CharField(
        max_length=20,
        choices=[
            ('self', 'Deleted for Self'),
            ('everyone', 'Deleted for Everyone'),
        ],
        null=True,
        blank=True,
        help_text="Type of deletion - only applies when message is deleted for everyone"
    )
    
    # Moderation fields
    is_flagged = models.BooleanField(
        default=False,
        help_text="Whether this message has been flagged for review"
    )
    moderation_reason = models.CharField(
        max_length=100, 
        blank=True,
        help_text="Reason for flagging this message"
    )
    
    class Meta:
        ordering = ['created_at']  # Changed to ascending (oldest first) for proper pagination
        indexes = [
            models.Index(fields=['conversation', 'created_at']),  # Updated index to match new ordering
            models.Index(fields=['sender', 'created_at']),      # Updated index to match new ordering
        ]
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'

    def __str__(self):
        # Don't show decrypted content in admin for privacy
        if self.text and is_message_encrypted(self.text):
            return f"Message from {self.sender.full_name}: [ENCRYPTED]"
        else:
            preview = self.text[:50] + "..." if len(self.text) > 50 else self.text
            return f"Message from {self.sender.full_name}: {preview}"
    
    def is_deleted_for_user(self, user):
        """Check if message is deleted for a specific user."""
        return user.id in self.deleted_by
    
    def delete_for_user(self, user):
        """Soft delete message for a specific user."""
        if user.id not in self.deleted_by:
            self.deleted_by.append(user.id)
            self.save(update_fields=['deleted_by'])
    
    def get_decrypted_text(self):
        """Get decrypted message text for display."""
        if not self.text:
            return self.text
        
        # Check if text is encrypted
        if is_message_encrypted(self.text):
            try:
                return decrypt_message_text(self.text)
            except Exception:
                # If decryption fails, return encrypted text with indicator
                return "[ENCRYPTED]"
        else:
            # Text is not encrypted, return as-is
            return self.text
    
    def get_encrypted_text(self):
        """Get encrypted message text for storage."""
        if not self.text:
            return self.text
        
        # Only encrypt if not already encrypted
        if not is_message_encrypted(self.text):
            return encrypt_message_text(self.text)
        else:
            return self.text
    
    def save(self, *args, **kwargs):
        """Override save to encrypt text and update conversation metadata."""
        is_new = self.pk is None
        
        # Encrypt text content before saving
        if self.text and not is_message_encrypted(self.text):
            self.text = encrypt_message_text(self.text)
        
        # Set attachment type based on file extension
        if self.attachment:
            file_ext = self.attachment.name.split('.')[-1].lower()
            if file_ext in ['jpg', 'jpeg', 'png', 'gif']:
                self.message_type = 'image'
            elif file_ext in ['webm', 'mp3', 'wav', 'ogg', 'm4a', 'mp4']:
                self.message_type = 'audio'
            else:
                self.message_type = 'file'
        
        super().save(*args, **kwargs)
        
        # Update conversation metadata for new messages
        if is_new and self.conversation:
            self.conversation.last_message_at = self.created_at
            self.conversation.last_message_preview = self.text[:100] if self.text else f"[{self.message_type}]"
            
            # Increment unread count for recipient
            if self.sender == self.conversation.provider:
                self.conversation.unread_count_customer += 1
            else:
                self.conversation.unread_count_provider += 1
            
            self.conversation.save(update_fields=[
                'last_message_at', 
                'last_message_preview', 
                'unread_count_provider', 
                'unread_count_customer'
            ])


class MessageReadStatus(models.Model):
    """
    Tracks when messages are read by users.
    
    This model enables read receipts and helps determine message delivery status.
    """
    
    message = models.ForeignKey(
        Message, 
        on_delete=models.CASCADE, 
        related_name='read_statuses'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE
    )
    read_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['message', 'user']
        indexes = [
            models.Index(fields=['message', 'user']),
        ]
        verbose_name = 'Message Read Status'
        verbose_name_plural = 'Message Read Statuses'

    def __str__(self):
        return f"{self.user.full_name} read message at {self.read_at}"
