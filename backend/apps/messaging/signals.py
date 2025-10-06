"""
Signal handlers for the messaging app.

This module contains Django signal handlers for messaging-related events.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Message


@receiver(post_save, sender=Message)
def message_updated(sender, instance, created, **kwargs):
    """
    Handle message updates, particularly for deletion events.
    Send real-time notifications when a message is deleted for everyone.
    """
    if not created and instance.deletion_type == 'everyone':
        # Message was deleted for everyone, notify all participants
        channel_layer = get_channel_layer()
        
        # Get conversation participants
        conversation = instance.conversation
        participants = [conversation.customer.id, conversation.provider.id]
        
        # Send deletion notification to all participants
        for user_id in participants:
            group_name = f'user_{user_id}'
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'message_deleted',
                    'message_id': instance.id,
                    'conversation_id': conversation.id,
                    'deletion_type': 'everyone'
                }
            )


@receiver(post_save, sender=Message)
def create_message_notification(sender, instance, created, **kwargs):
    """
    Create a notification when a new message is received.
    
    This signal handler creates a notification for the recipient
    when a new message is sent in a conversation, similar to how
    booking and review notifications are generated.
    
    Args:
        sender (Model): The model class that sent the signal
        instance (Message): The message instance that was saved
        created (bool): Whether the instance was created or updated
        **kwargs: Arbitrary keyword arguments
    """
    # Only create notifications for new messages, not updates
    if created and instance.message_type != 'system':
        from apps.notifications.models import Notification, UserNotificationSetting
        
        conversation = instance.conversation
        sender_user = instance.sender
        
        # Determine the recipient (the other person in the conversation)
        if sender_user == conversation.customer:
            recipient = conversation.provider
            sender_name = conversation.customer.first_name or conversation.customer.username
        else:
            recipient = conversation.customer
            sender_name = conversation.provider.first_name or conversation.provider.username
        
        # Check if the recipient has message notifications enabled
        try:
            settings = UserNotificationSetting.objects.get(user=recipient)
            if not settings.message_notifications:
                return  # User has disabled message notifications
        except UserNotificationSetting.DoesNotExist:
            # If no settings exist, assume default (enabled)
            pass
        
        # Get message preview based on message type
        if instance.message_type == 'text':
            # For text messages, show a preview of the text content
            message_preview = instance.get_decrypted_text()
            if len(message_preview) > 50:
                message_preview = message_preview[:47] + "..."
            notification_message = f"New message from {sender_name}: {message_preview}"
        elif instance.message_type == 'image':
            notification_message = f"New image from {sender_name}"
        elif instance.message_type == 'file':
            notification_message = f"New file from {sender_name}"
        elif instance.message_type == 'audio':
            notification_message = f"New audio message from {sender_name}"
        else:
            notification_message = f"New message from {sender_name}"
        
        # Create the notification
        Notification.objects.create(
            user=recipient,
            title="New Message Received",
            message=notification_message,
            notification_type="message",
            type="message",  # Use both fields for compatibility
            related_id=conversation.id,  # Link to conversation instead of message
            data={
                'conversation_id': conversation.id,
                'message_id': instance.id,
                'sender_id': sender_user.id,
                'sender_name': sender_name,
                'service_title': conversation.service.title,
                'message_type': instance.message_type
            },
            action_required=False,
            action_url=f"/dashboard/messages/{conversation.id}",  # Link to conversation
            priority="medium"
        )