from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ContactMessage, ContactMessageAttachment

User = get_user_model()


class ContactMessageAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for contact message attachments"""
    
    file_size_formatted = serializers.ReadOnlyField()
    
    class Meta:
        model = ContactMessageAttachment
        fields = [
            'id', 'file', 'original_filename', 'file_size', 
            'file_size_formatted', 'content_type', 'uploaded_at'
        ]
        read_only_fields = ['id', 'uploaded_at', 'file_size_formatted']


class ContactMessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating contact messages"""
    
    # Optional file attachments
    attachments = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        allow_empty=True,
        write_only=True,
        help_text="Optional file attachments (max 5 files, 10MB each)"
    )
    
    class Meta:
        model = ContactMessage
        fields = [
            'name', 'email', 'subject', 'message', 'attachments'
        ]
        extra_kwargs = {
            'name': {'required': True, 'allow_blank': False},
            'email': {'required': True},
            'subject': {'required': True, 'allow_blank': False},
            'message': {'required': True, 'allow_blank': False},
        }
    
    def validate_attachments(self, value):
        """Validate file attachments"""
        if not value:
            return value
        
        # Limit number of attachments
        if len(value) > 5:
            raise serializers.ValidationError("Maximum 5 attachments allowed")
        
        # Validate each file
        allowed_types = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        
        max_size = 10 * 1024 * 1024  # 10MB
        
        for file in value:
            # Check file size
            if file.size > max_size:
                raise serializers.ValidationError(
                    f"File '{file.name}' exceeds maximum size of 10MB"
                )
            
            # Check file type
            if file.content_type not in allowed_types:
                raise serializers.ValidationError(
                    f"File type '{file.content_type}' is not allowed"
                )
        
        return value
    
    def validate_email(self, value):
        """Validate email format"""
        if not value or '@' not in value:
            raise serializers.ValidationError("Please provide a valid email address")
        return value.lower()
    
    def validate_message(self, value):
        """Validate message content"""
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Message must be at least 10 characters long")
        
        # Basic spam detection
        spam_keywords = ['viagra', 'casino', 'lottery', 'winner', 'congratulations']
        message_lower = value.lower()
        
        spam_count = sum(1 for keyword in spam_keywords if keyword in message_lower)
        if spam_count >= 2:
            raise serializers.ValidationError("Message appears to be spam")
        
        return value.strip()
    
    def create(self, validated_data):
        """Create contact message with attachments"""
        attachments_data = validated_data.pop('attachments', [])
        
        # Get user from request context if available
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        
        # Get IP address and user agent from request
        if request:
            # Get IP address
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                validated_data['ip_address'] = x_forwarded_for.split(',')[0].strip()
            else:
                validated_data['ip_address'] = request.META.get('REMOTE_ADDR')
            
            # Get user agent
            validated_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
        
        # Create the message
        message = ContactMessage.objects.create(**validated_data)
        
        # Create attachments
        for attachment_file in attachments_data:
            ContactMessageAttachment.objects.create(
                message=message,
                file=attachment_file,
                original_filename=attachment_file.name,
                file_size=attachment_file.size,
                content_type=attachment_file.content_type
            )
        
        return message


class ContactMessageSerializer(serializers.ModelSerializer):
    """Serializer for reading contact messages"""
    
    attachments = ContactMessageAttachmentSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    responded_by_name = serializers.CharField(source='responded_by.get_full_name', read_only=True)
    is_responded = serializers.ReadOnlyField()
    response_time = serializers.ReadOnlyField()
    
    class Meta:
        model = ContactMessage
        fields = [
            'id', 'name', 'email', 'subject', 'message', 'user', 'user_name',
            'status', 'priority', 'admin_response', 'responded_by', 'responded_by_name',
            'responded_at', 'ip_address', 'created_at', 'updated_at',
            'is_spam', 'is_important', 'attachments', 'is_responded', 'response_time'
        ]
        read_only_fields = [
            'id', 'user', 'ip_address', 'user_agent', 'created_at', 'updated_at',
            'is_responded', 'response_time'
        ]


class ContactMessageResponseSerializer(serializers.ModelSerializer):
    """Serializer for admin responses to contact messages"""
    
    class Meta:
        model = ContactMessage
        fields = ['admin_response', 'status', 'priority']
        extra_kwargs = {
            'admin_response': {'required': True, 'allow_blank': False},
        }
    
    def validate_admin_response(self, value):
        """Validate admin response"""
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Response must be at least 10 characters long")
        return value.strip()
    
    def update(self, instance, validated_data):
        """Update message with admin response"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            instance.responded_by = request.user
        
        return super().update(instance, validated_data)


class ContactMessageStatsSerializer(serializers.Serializer):
    """Serializer for contact message statistics"""
    
    total_messages = serializers.IntegerField()
    pending_messages = serializers.IntegerField()
    in_progress_messages = serializers.IntegerField()
    resolved_messages = serializers.IntegerField()
    spam_messages = serializers.IntegerField()
    
    messages_today = serializers.IntegerField()
    messages_this_week = serializers.IntegerField()
    messages_this_month = serializers.IntegerField()
    
    average_response_time_hours = serializers.FloatField()
    response_rate_percentage = serializers.FloatField()
    
    priority_breakdown = serializers.DictField()
    status_breakdown = serializers.DictField()