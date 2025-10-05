from rest_framework import serializers
from .models import Notification, UserNotificationSetting


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for notification objects.
    
    This serializer handles the serialization and deserialization of
    Notification instances, including the mapping between the old
    [notification_type](file:///d:/Semester%20Final%20Project/6th%20Sem%20Final%20Project/SewaBazaar/backend/apps/notifications/models.py#L38-L38) field and the new [type](file:///d:/Semester%20Final%20Project/6th%20Sem%20Final%20Project/SewaBazaar/backend/apps/notifications/models.py#L40-L40) field for backward compatibility.
    
    Attributes:
        type (SerializerMethodField): The notification type (with backward compatibility)
    """
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
        """
        Get the notification type with backward compatibility.
        
        Returns the [type](file:///d:/Semester%20Final%20Project/6th%20Sem%20Final%20Project/SewaBazaar/backend/apps/notifications/models.py#L40-L40) field if it exists, otherwise falls back to [notification_type](file:///d:/Semester%20Final%20Project/6th%20Sem%20Final%20Project/SewaBazaar/backend/apps/notifications/models.py#L38-L38).
        
        Args:
            obj (Notification): The notification instance
            
        Returns:
            str: The notification type
        """
        # Return the type field if it exists, otherwise fall back to notification_type
        return obj.type or obj.notification_type


class UserNotificationSettingSerializer(serializers.ModelSerializer):
    """
    Serializer for user notification settings.
    
    This serializer handles the serialization and deserialization of
    UserNotificationSetting instances, including synchronization between
    old and new fields for backward compatibility.
    """
    class Meta:
        model = UserNotificationSetting
        fields = [
            # New fields for the frontend
            'email_notifications', 'push_notifications', 'sms_notifications',
            'booking_requests', 'booking_updates', 'payment_notifications',
            'review_notifications', 'system_notifications', 'marketing_notifications',
            'reminder_notifications', 'message_notifications',
            # Keep old fields for backward compatibility
            'email_enabled', 'push_enabled', 'topics'
        ]
    
    def update(self, instance, validated_data):
        """
        Update the notification settings instance.
        
        Synchronizes old and new fields when updating to maintain
        backward compatibility.
        
        Args:
            instance (UserNotificationSetting): The settings instance to update
            validated_data (dict): The validated data to update with
            
        Returns:
            UserNotificationSetting: The updated settings instance
        """
        # Sync old and new fields when updating
        if 'email_notifications' in validated_data:
            validated_data['email_enabled'] = validated_data['email_notifications']
        if 'push_notifications' in validated_data:
            validated_data['push_enabled'] = validated_data['push_notifications']
        
        return super().update(instance, validated_data)