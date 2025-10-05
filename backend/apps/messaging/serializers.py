"""
Serializers for the messaging app.

This module contains Django REST Framework serializers for the messaging system,
providing API serialization for conversations and messages with proper validation
and nested relationships.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction

from .models import Conversation, Message, MessageReadStatus
from .encryption import decrypt_message_text, is_message_encrypted
from apps.services.models import Service

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user serializer for nested relationships."""
    
    full_name = serializers.ReadOnlyField()
    avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'role', 'avatar']
        read_only_fields = ['id', 'email', 'role', 'avatar']
    
    def get_avatar(self, obj):
        """Get the profile picture URL."""
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
        return None


class ServiceBasicSerializer(serializers.ModelSerializer):
    """Basic service serializer for nested relationships."""
    
    class Meta:
        model = Service
        fields = ['id', 'title', 'slug', 'price', 'duration']
        read_only_fields = fields


class MessageReadStatusSerializer(serializers.ModelSerializer):
    """Serializer for message read status."""
    
    user = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = MessageReadStatus
        fields = ['id', 'user', 'read_at']
        read_only_fields = fields


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for messages with nested relationships."""
    
    sender = UserBasicSerializer(read_only=True)
    read_statuses = MessageReadStatusSerializer(many=True, read_only=True)
    is_deleted_for_user = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()
    timestamp = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'message_type', 'text', 'attachment',
            'attachment_url', 'status', 'created_at', 'updated_at', 'timestamp', 'is_flagged',
            'moderation_reason', 'read_statuses', 'is_deleted_for_user', 'deletion_type'
        ]
        read_only_fields = [
            'id', 'sender', 'message_type', 'status', 'created_at', 'updated_at',
            'is_flagged', 'moderation_reason', 'attachment_url', 'is_deleted_for_user'
        ]
    
    def get_is_deleted_for_user(self, obj):
        """Check if message is deleted for the current user."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.is_deleted_for_user(request.user)
        return False
    
    def get_attachment_url(self, obj):
        """Get full URL for attachment if it exists."""
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
        return None
    
    def to_representation(self, instance):
        """Override to decrypt message text for API responses."""
        data = super().to_representation(instance)
        
        # Decrypt text if it's encrypted
        if data.get('text') and is_message_encrypted(data['text']):
            try:
                data['text'] = decrypt_message_text(data['text'])
            except Exception:
                # If decryption fails, show encrypted indicator
                data['text'] = "[ENCRYPTED]"
        
        return data
    
    def validate_text(self, value):
        """Validate message text."""
        if not value and not self.initial_data.get('attachment'):
            raise serializers.ValidationError("Message must have either text or attachment.")
        
        if value and len(value.strip()) > 5000:
            raise serializers.ValidationError("Message text cannot exceed 5000 characters.")
        
        return value.strip() if value else value
    
    def validate_attachment(self, value):
        """Validate attachment file."""
        if value:
            # Check file size (5MB limit)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("File size cannot exceed 5MB.")
            
            # Check file extension
            allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'webm', 'mp3', 'wav', 'ogg', 'm4a', 'mp4']
            file_extension = value.name.split('.')[-1].lower()
            
            if file_extension not in allowed_extensions:
                raise serializers.ValidationError(
                    f"File type '{file_extension}' not allowed. "
                    f"Allowed types: {', '.join(allowed_extensions)}"
                )
        
        return value


class MessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating messages."""
    
    class Meta:
        model = Message
        fields = ['conversation', 'text', 'attachment']
    
    def validate(self, attrs):
        """Validate message creation data."""
        conversation = attrs.get('conversation')
        request = self.context.get('request')
        
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")
        
        user = request.user
        
        # Check if user is part of the conversation
        if user != conversation.customer and user != conversation.provider:
            raise serializers.ValidationError("You are not part of this conversation.")
        
        # Check if conversation is active
        if not conversation.is_active:
            raise serializers.ValidationError("This conversation is no longer active.")
        
        # Validate that either text or attachment is provided
        text = attrs.get('text', '').strip()
        attachment = attrs.get('attachment')
        
        if not text and not attachment:
            raise serializers.ValidationError("Message must have either text or attachment.")
        
        return attrs
    
    def create(self, validated_data):
        """Create a new message with encryption."""
        request = self.context.get('request')
        validated_data['sender'] = request.user
        
        # Encrypt text content before saving
        if validated_data.get('text'):
            from .encryption import encrypt_message_text, is_message_encrypted
            text = validated_data['text']
            if not is_message_encrypted(text):
                validated_data['text'] = encrypt_message_text(text)
        
        return super().create(validated_data)


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for conversations with nested relationships."""
    
    service = ServiceBasicSerializer(read_only=True)
    provider = UserBasicSerializer(read_only=True)
    customer = UserBasicSerializer(read_only=True)
    latest_messages = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'service', 'provider', 'customer', 'created_at', 'last_message_at',
            'last_message_preview', 'is_active', 'provider_archived', 'customer_archived',
            'unread_count', 'latest_messages'
        ]
        read_only_fields = [
            'id', 'created_at', 'last_message_at', 'last_message_preview', 'unread_count'
        ]
    
    def get_latest_messages(self, obj):
        """Get the latest 10 messages for the conversation."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return []
        
        user = request.user
        messages = obj.messages.all()[:10]  # Simplified - get all messages for now
        
        return MessageSerializer(messages, many=True, context=self.context).data
    
    def get_unread_count(self, obj):
        """Get unread message count for the current user."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_unread_count_for_user(request.user)
        return 0


class ConversationCreateSerializer(serializers.Serializer):
    """Serializer for creating new conversations."""
    
    service_id = serializers.IntegerField()
    provider_id = serializers.IntegerField()
    initial_message = serializers.CharField(max_length=5000, trim_whitespace=True)
    
    def validate_service_id(self, value):
        """Validate service exists and is active."""
        try:
            service = Service.objects.get(id=value, status='active')
            return service
        except Service.DoesNotExist:
            raise serializers.ValidationError("Service not found or not active.")
    
    def validate_provider_id(self, value):
        """Validate provider exists and has correct role."""
        try:
            provider = User.objects.get(id=value, role='provider')
            return provider
        except User.DoesNotExist:
            raise serializers.ValidationError("Provider not found.")
    
    def validate(self, attrs):
        """Cross-field validation."""
        service = attrs.get('service_id')
        provider = attrs.get('provider_id')
        request = self.context.get('request')
        
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")
        
        user = request.user
        
        # Only customers can initiate conversations
        if user.role != 'customer':
            raise serializers.ValidationError("Only customers can initiate conversations.")
        
        # Verify the service belongs to the specified provider
        if service.provider != provider:
            raise serializers.ValidationError("Service does not belong to the specified provider.")
        
        # Check if conversation already exists
        existing_conversation = Conversation.objects.filter(
            service=service,
            provider=provider,
            customer=user
        ).first()
        
        if existing_conversation:
            attrs['existing_conversation'] = existing_conversation
        
        return attrs
    
    @transaction.atomic
    def create(self, validated_data):
        """Create conversation and initial message."""
        request = self.context.get('request')
        customer = request.user
        service = validated_data['service_id']
        provider = validated_data['provider_id']
        initial_message = validated_data['initial_message']
        
        # Check if conversation already exists
        existing_conversation = validated_data.get('existing_conversation')
        if existing_conversation:
            # Just add the message to existing conversation
            conversation = existing_conversation
        else:
            # Create new conversation
            conversation = Conversation.objects.create(
                service=service,
                provider=provider,
                customer=customer
            )
        
        # Encrypt initial message before creating
        from .encryption import encrypt_message_text, is_message_encrypted
        encrypted_message = initial_message
        if not is_message_encrypted(initial_message):
            encrypted_message = encrypt_message_text(initial_message)
        
        # Create initial message
        message = Message.objects.create(
            conversation=conversation,
            sender=customer,
            text=encrypted_message
        )
        
        return {
            'conversation': conversation,
            'message': message
        }


class ConversationDetailSerializer(ConversationSerializer):
    """Detailed serializer for individual conversation view."""
    
    messages = serializers.SerializerMethodField()
    
    class Meta(ConversationSerializer.Meta):
        fields = ConversationSerializer.Meta.fields + ['messages']
    
    def get_messages(self, obj):
        """Get paginated messages for the conversation."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return []
        
        user = request.user
        
        # Get pagination parameters from request
        page_size = int(request.query_params.get('page_size', 50))  # Increased default page size
        page = int(request.query_params.get('page', 1))
        
        # Get ALL messages first, then filter
        all_messages = obj.messages.select_related('sender').order_by('created_at')
        
        # Filter out messages deleted by this user using Python filtering
        # This is less efficient but works with all database backends
        filtered_messages = []
        for message in all_messages:
            # Handle cases where deleted_by might be None, empty list, or invalid data
            deleted_by_list = message.deleted_by if isinstance(message.deleted_by, list) else []
            if user.id not in deleted_by_list:
                filtered_messages.append(message)
        
        # For chat pagination, we need to paginate from the END (most recent messages first)
        total_messages = len(filtered_messages)
        
        if page == 1:
            # First page: get the most recent messages
            start_idx = max(0, total_messages - page_size)
            messages = filtered_messages[start_idx:]
        else:
            # Subsequent pages: get older messages
            # Calculate how many messages to skip from the end
            messages_from_end = page * page_size
            start_idx = max(0, total_messages - messages_from_end)
            end_idx = total_messages - (page - 1) * page_size
            messages = filtered_messages[start_idx:end_idx]
        
        return MessageSerializer(messages, many=True, context=self.context).data