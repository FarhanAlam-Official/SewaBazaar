from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'notification_type', 'is_read', 'related_id', 'created_at']
        read_only_fields = ['user', 'title', 'message', 'notification_type', 'related_id', 'created_at']
