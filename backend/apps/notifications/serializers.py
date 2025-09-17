from rest_framework import serializers
from .models import Notification, UserNotificationSetting

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'notification_type', 'is_read', 'related_id', 'created_at']
        read_only_fields = ['user', 'title', 'message', 'notification_type', 'related_id', 'created_at']


class UserNotificationSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserNotificationSetting
        fields = ['email_enabled', 'push_enabled', 'topics']
