from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ContactMessage, ContactMessageAttachment

User = get_user_model()


class ContactMessageAttachmentSerializer(serializers.ModelSerializer):
    """
    Serializer for contact message attachments.
    
    This serializer handles the serialization and deserialization of
    ContactMessageAttachment instances, including read-only fields
    for formatted file size.
    """
    
    file_size_formatted = serializers.ReadOnlyField()
    
    class Meta:
        model = ContactMessageAttachment
        fields = [
            'id', 'file', 'original_filename', 'file_size', 
            'file_size_formatted', 'content_type', 'uploaded_at'
        ]
        read_only_fields = ['id', 'uploaded_at', 'file_size_formatted']


class ContactMessageCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating contact messages.
    
    This serializer handles the creation of new contact messages, including
    validation of all fields and processing of file attachments.
    """
    
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
        """
        Validate file attachments.
        
        Ensures that attachments meet the following criteria:
        - Maximum of 5 attachments per message
        - Each file is within the 10MB size limit
        - Each file has an allowed content type
        
        Args:
            value (list): List of file attachments
            
        Returns:
            list: Validated list of file attachments
            
        Raises:
            serializers.ValidationError: If attachments don't meet criteria
        """
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
        """
        Validate email format.
        
        Ensures that the provided email address contains an '@' symbol.
        
        Args:
            value (str): Email address to validate
            
        Returns:
            str: Validated and lowercased email address
            
        Raises:
            serializers.ValidationError: If email format is invalid
        """
        if not value or '@' not in value:
            raise serializers.ValidationError("Please provide a valid email address")
        return value.lower()
    
    def validate_message(self, value):
        """
        Validate message content.
        
        Ensures that the message content:
        - Is at least 10 characters long
        - Does not appear to be spam (based on keyword detection)
        
        Args:
            value (str): Message content to validate
            
        Returns:
            str: Validated and stripped message content
            
        Raises:
            serializers.ValidationError: If message content is invalid
        """
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
        """
        Create contact message with attachments.
        
        Creates a new ContactMessage instance and processes any file attachments.
        Also captures metadata such as IP address and user agent from the request.
        
        Args:
            validated_data (dict): Validated data for creating the contact message
            
        Returns:
            ContactMessage: The newly created contact message instance
        """
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
    """
    Serializer for reading contact messages.
    
    This serializer provides a comprehensive view of contact messages,
    including related attachments and user information.
    """
    
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
    """
    Serializer for admin responses to contact messages.
    
    This serializer handles updating contact messages with admin responses,
    including validation of the response content.
    """
    
    class Meta:
        model = ContactMessage
        fields = ['admin_response', 'status', 'priority']
        extra_kwargs = {
            'admin_response': {'required': True, 'allow_blank': False},
        }
    
    def validate_admin_response(self, value):
        """
        Validate admin response.
        
        Ensures that the admin response is at least 10 characters long.
        
        Args:
            value (str): Admin response to validate
            
        Returns:
            str: Validated and stripped admin response
            
        Raises:
            serializers.ValidationError: If response is too short
        """
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Response must be at least 10 characters long")
        return value.strip()
    
    def update(self, instance, validated_data):
        """
        Update message with admin response.
        
        Updates a ContactMessage instance with admin response data and
        sets the responding admin user if available in the request context.
        
        Args:
            instance (ContactMessage): The contact message instance to update
            validated_data (dict): Validated data for updating the contact message
            
        Returns:
            ContactMessage: The updated contact message instance
        """
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            instance.responded_by = request.user
        
        return super().update(instance, validated_data)


class ContactMessageStatsSerializer(serializers.Serializer):
    """
    Serializer for contact message statistics.
    
    This serializer provides a structured representation of contact message
    statistics including counts, time-based metrics, and breakdowns.
    """
    
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