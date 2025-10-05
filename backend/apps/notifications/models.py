from django.db import models
from django.conf import settings


class Notification(models.Model):
    """
    Model for storing user notifications.
    
    This model represents notifications sent to users for various events
    such as bookings, reviews, payments, and system messages. It includes
    fields for notification type, priority, read status, and additional
    metadata.
    
    Attributes:
        TYPE_CHOICES (tuple): Available notification types
        PRIORITY_CHOICES (tuple): Available priority levels
        user (ForeignKey): The user this notification is for
        title (str): The notification title
        message (str): The notification message content
        notification_type (str): The type of notification (backward compatibility)
        type (str): The type of notification (new field)
        is_read (bool): Whether the notification has been read
        related_id (int): ID of related object (backward compatibility)
        data (dict): Additional structured data
        action_required (bool): Whether user action is required
        action_url (str): URL for the required action
        priority (str): Priority level of the notification
        created_at (datetime): When the notification was created
    """
    TYPE_CHOICES = (
        ('booking', 'Booking'),
        ('review', 'Review'),
        ('system', 'System'),
        ('payment', 'Payment'),
        ('booking_request', 'Booking Request'),
        ('booking_update', 'Booking Update'),
        ('reminder', 'Reminder'),
        ('message', 'Message'),
    )
    
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='notifications'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Keep existing field for backward compatibility
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='system')
    
    # Add new field that maps to the same data but with better name for frontend
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, blank=True, null=True)
    
    is_read = models.BooleanField(default=False)
    
    # Keep existing field for backward compatibility
    related_id = models.PositiveIntegerField(blank=True, null=True)
    
    # Add new structured data field
    data = models.JSONField(default=dict, blank=True)
    
    # New fields for enhanced functionality
    action_required = models.BooleanField(default=False)
    action_url = models.URLField(blank=True, null=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        """
        Save the notification instance.
        
        Ensures consistency between the [notification_type](file:///d:/Semester%20Final%20Project/6th%20Sem%20Final%20Project/SewaBazaar/backend/apps/notifications/models.py#L38-L38) and [type](file:///d:/Semester%20Final%20Project/6th%20Sem%20Final%20Project/SewaBazaar/backend/apps/notifications/models.py#L40-L40) fields.
        
        Args:
            *args: Variable length argument list
            **kwargs: Arbitrary keyword arguments
        """
        # Sync the type field with notification_type for consistency
        if self.type and self.notification_type != self.type:
            self.notification_type = self.type
        elif self.notification_type and not self.type:
            self.type = self.notification_type
        super().save(*args, **kwargs)
    
    def __str__(self):
        """
        Return a string representation of the notification.
        
        Returns:
            str: A string representation of the notification
        """
        return f"{self.notification_type} notification for {self.user.email}: {self.title}"
    
    class Meta:
        ordering = ['-created_at']


class UserNotificationSetting(models.Model):
    """
    Model for storing per-user notification preferences.
    
    This model stores user-specific notification preferences including
    delivery methods, notification type preferences, and topic subscriptions.
    
    Attributes:
        user (OneToOneField): The user these settings belong to
        email_enabled (bool): Email notifications enabled (backward compatibility)
        push_enabled (bool): Push notifications enabled (backward compatibility)
        topics (list): Subscribed topics (backward compatibility)
        email_notifications (bool): Email notifications enabled
        push_notifications (bool): Push notifications enabled
        sms_notifications (bool): SMS notifications enabled
        booking_requests (bool): Booking request notifications enabled
        booking_updates (bool): Booking update notifications enabled
        payment_notifications (bool): Payment notifications enabled
        review_notifications (bool): Review notifications enabled
        system_notifications (bool): System notifications enabled
        marketing_notifications (bool): Marketing notifications enabled
        reminder_notifications (bool): Reminder notifications enabled
        message_notifications (bool): Message notifications enabled
        updated_at (datetime): When the settings were last updated
    """
    """Per-user notification preferences"""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_settings')
    
    # Keep existing fields for backward compatibility
    email_enabled = models.BooleanField(default=True)
    push_enabled = models.BooleanField(default=True)
    topics = models.JSONField(default=list, blank=True)
    
    # New delivery method fields (with better names)
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    
    # New notification type preferences
    booking_requests = models.BooleanField(default=True)
    booking_updates = models.BooleanField(default=True)
    payment_notifications = models.BooleanField(default=True)
    review_notifications = models.BooleanField(default=True)
    system_notifications = models.BooleanField(default=True)
    marketing_notifications = models.BooleanField(default=False)
    reminder_notifications = models.BooleanField(default=True)
    message_notifications = models.BooleanField(default=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        """
        Save the notification settings instance.
        
        Ensures consistency between old and new fields for backward compatibility.
        
        Args:
            *args: Variable length argument list
            **kwargs: Arbitrary keyword arguments
        """
        # Sync old and new fields for backward compatibility
        if self.email_enabled != self.email_notifications:
            self.email_notifications = self.email_enabled
        if self.push_enabled != self.push_notifications:
            self.push_notifications = self.push_enabled
        super().save(*args, **kwargs)

    def __str__(self):
        """
        Return a string representation of the notification settings.
        
        Returns:
            str: A string representation of the notification settings
        """
        return f"NotificationSettings({self.user.email})"