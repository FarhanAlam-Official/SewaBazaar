from rest_framework import serializers
from .models import Notification, UserNotificationSetting

class NotificationSerializer(serializers.ModelSerializer):
    # Use the new 'type' field but fall back to 'notification_type' for compatibility
    type = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'type', 'is_read', 'data', 
            'action_required', 'action_url', 'priority', 'created_at'
        ]
        read_only_fields = [
            'id', 'title', 'message', 'type', 'data', 
            'action_required', 'action_url', 'priority', 'created_at'
        ]
    
    def get_type(self, obj):
        # Return the type field if it exists, otherwise fall back to notification_type
        return obj.type or obj.notification_type


class UserNotificationSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserNotificationSetting
        fields = [
            # New fields for the frontend
            'email_notifications', 'push_notifications', 'sms_notifications',
            'booking_requests', 'booking_updates', 'payment_notifications',
            'review_notifications', 'system_notifications', 'marketing_notifications',
            'reminder_notifications',
            # Keep old fields for backward compatibility
            'email_enabled', 'push_enabled', 'topics'
        ]
    
    def update(self, instance, validated_data):
        # Sync old and new fields when updating
        if 'email_notifications' in validated_data:
            validated_data['email_enabled'] = validated_data['email_notifications']
        if 'push_notifications' in validated_data:
            validated_data['push_enabled'] = validated_data['push_notifications']
        
        return super().update(instance, validated_data)
