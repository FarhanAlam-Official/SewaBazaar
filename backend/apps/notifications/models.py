from django.db import models
from django.conf import settings

class Notification(models.Model):
    TYPE_CHOICES = (
        ('booking', 'Booking'),
        ('review', 'Review'),
        ('system', 'System'),
        ('payment', 'Payment'),
        ('booking_request', 'Booking Request'),
        ('booking_update', 'Booking Update'),
        ('reminder', 'Reminder'),
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
        # Sync the type field with notification_type for consistency
        if self.type and self.notification_type != self.type:
            self.notification_type = self.type
        elif self.notification_type and not self.type:
            self.type = self.notification_type
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.notification_type} notification for {self.user.email}: {self.title}"
    
    class Meta:
        ordering = ['-created_at']


class UserNotificationSetting(models.Model):
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
    
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Sync old and new fields for backward compatibility
        if self.email_enabled != self.email_notifications:
            self.email_notifications = self.email_enabled
        if self.push_enabled != self.push_notifications:
            self.push_notifications = self.push_enabled
        super().save(*args, **kwargs)

    def __str__(self):
        return f"NotificationSettings({self.user.email})"
