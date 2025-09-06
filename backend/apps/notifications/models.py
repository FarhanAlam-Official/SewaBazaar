from django.db import models
from django.db import models
from django.conf import settings

class Notification(models.Model):
    TYPE_CHOICES = (
        ('booking', 'Booking'),
        ('review', 'Review'),
        ('system', 'System'),
        ('payment', 'Payment'),
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='notifications'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    is_read = models.BooleanField(default=False)
    related_id = models.PositiveIntegerField(blank=True, null=True)  # ID of related object (booking, review, etc.)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.notification_type} notification for {self.user.email}: {self.title}"
    
    class Meta:
        ordering = ['-created_at']
