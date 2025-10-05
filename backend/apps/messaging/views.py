"""
API views for the messaging app.

This module contains ViewSets and API endpoints for managing conversations
and messages between customers and service providers.
"""

from rest_framework import viewsets, status, permissions, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction

from .models import Conversation, Message, MessageReadStatus
from .serializers import (
    ConversationSerializer, 
    ConversationCreateSerializer,
    ConversationDetailSerializer,
    MessageSerializer,
    MessageCreateSerializer
)
from .permissions import IsConversationParticipant, IsMessageSender
from .filters import ConversationFilter, MessageFilter


class HealthCheckView(APIView):
    """
    Simple health check endpoint for messaging service.
    """
    permission_classes = []
    
    def get(self, request):
        return Response({
            'status': 'healthy',
            'service': 'messaging',
            'version': '1.0.0'
        })


class ConversationViewSet(ModelViewSet):
    """
    ViewSet for managing conversations.
    
    Provides CRUD operations for conversations with proper permissions
    and filtering for authenticated users.
    """
    
    permission_classes = [permissions.IsAuthenticated, IsConversationParticipant]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ConversationFilter
    search_fields = ['service__title', 'customer__first_name', 'customer__last_name', 
                    'provider__first_name', 'provider__last_name']
    ordering_fields = ['created_at', 'last_message_at']
    ordering = ['-last_message_at', '-created_at']
    
    def get_queryset(self):
        """Return conversations for the authenticated user."""
        user = self.request.user
        
        if user.role == 'customer':
            queryset = Conversation.objects.filter(
                customer=user,
                customer_archived=False
            )
        elif user.role == 'provider':
            queryset = Conversation.objects.filter(
                provider=user,
                provider_archived=False
            )
        else:
            # Admin users can see all conversations
            queryset = Conversation.objects.all()
        
        # Optimize queries with select_related and prefetch_related
        return queryset.select_related(
            'service', 'provider', 'customer'
        ).prefetch_related(
            Prefetch(
                'messages', 
                queryset=Message.objects.select_related('sender').order_by('created_at'),  # Changed to ascending for consistency
                to_attr='latest_messages'
            )
        )
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return ConversationCreateSerializer
        elif self.action == 'retrieve':
            return ConversationDetailSerializer
        return ConversationSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new conversation with initial message."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        result = serializer.save()
        conversation = result['conversation']
        
        # Return the created conversation
        response_serializer = ConversationSerializer(
            conversation, 
            context={'request': request}
        )
        
        return Response({
            'conversation': response_serializer.data,
            'conversation_id': conversation.id,
            'message': 'Conversation created successfully'
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark all messages in conversation as read for current user."""
        conversation = self.get_object()
        conversation.mark_as_read_for_user(request.user)
        
        return Response({
            'message': 'Conversation marked as read',
            'unread_count': conversation.get_unread_count_for_user(request.user)
        })
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive conversation for current user."""
        conversation = self.get_object()
        user = request.user
        
        if user == conversation.customer:
            conversation.customer_archived = True
        elif user == conversation.provider:
            conversation.provider_archived = True
        
        conversation.save(update_fields=['customer_archived', 'provider_archived'])
        
        return Response({'message': 'Conversation archived successfully'})
    
    @action(detail=True, methods=['post'])
    def unarchive(self, request, pk=None):
        """Unarchive conversation for current user."""
        conversation = self.get_object()
        user = request.user
        
        if user == conversation.customer:
            conversation.customer_archived = False
        elif user == conversation.provider:
            conversation.provider_archived = False
        
        conversation.save(update_fields=['customer_archived', 'provider_archived'])
        
        return Response({'message': 'Conversation unarchived successfully'})
    
    @action(detail=False, methods=['get'])
    def archived(self, request):
        """Get archived conversations for current user."""
        user = request.user
        
        if user.role == 'customer':
            queryset = Conversation.objects.filter(
                customer=user,
                customer_archived=True
            )
        elif user.role == 'provider':
            queryset = Conversation.objects.filter(
                provider=user,
                provider_archived=True
            )
        else:
            queryset = Conversation.objects.none()
        
        queryset = queryset.select_related('service', 'provider', 'customer')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class MessageViewSet(ModelViewSet):
    """
    ViewSet for managing messages.
    
    Provides CRUD operations for messages with proper permissions
    and real-time capabilities.
    """
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = MessageFilter
    search_fields = ['text']
    ordering_fields = ['created_at']
    ordering = ['created_at']  # Changed to ascending for proper chat pagination
    
    def get_queryset(self):
        """Return messages for conversations the user is part of."""
        user = self.request.user
        
        # Get conversations user is part of
        user_conversations = Conversation.objects.filter(
            Q(customer=user) | Q(provider=user)
        ).values_list('id', flat=True)
        
        # Return messages from those conversations, excluding deleted ones
        # Use Python filtering for JSON field compatibility across all database backends
        all_messages = Message.objects.filter(
            conversation_id__in=user_conversations
        ).select_related('conversation', 'sender')
        
        # Filter messages based on deletion type
        filtered_messages = []
        for message in all_messages:
            # Check if message was deleted for everyone
            if message.deletion_type == 'everyone':
                # Keep message visible but mark as deleted (shows placeholder)
                filtered_messages.append(message.id)
            else:
                # Check if message was deleted by current user for self only
                deleted_by_list = message.deleted_by if isinstance(message.deleted_by, list) else []
                if user.id not in deleted_by_list:
                    filtered_messages.append(message.id)
        
        # Return QuerySet filtered by the message IDs (maintains QuerySet compatibility)
        return Message.objects.filter(
            id__in=filtered_messages
        ).select_related('conversation', 'sender')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return MessageCreateSerializer
        return MessageSerializer
    
    def get_permissions(self):
        """Return appropriate permissions based on action."""
        if self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsMessageSender]
        else:
            permission_classes = [permissions.IsAuthenticated, IsConversationParticipant]
        
        return [permission() for permission in permission_classes]
    
    def create(self, request, *args, **kwargs):
        """Create a new message with WebSocket broadcasting."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        message = serializer.save()
        
        # Broadcast message via WebSocket
        self._broadcast_message_via_websocket(message)
        
        # Return the created message with full data
        response_serializer = MessageSerializer(message, context={'request': request})
        
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    def _broadcast_message_via_websocket(self, message):
        """Broadcast new message to conversation participants via WebSocket."""
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            
            channel_layer = get_channel_layer()
            if not channel_layer:
                return
            
            # Serialize message for WebSocket
            serializer = MessageSerializer(message)
            message_data = serializer.data
            
            # Get conversation participants
            conversation = message.conversation
            participants = [conversation.customer.id, conversation.provider.id]
            
            # Send to each participant
            for participant_id in participants:
                group_name = f'user_{participant_id}'
                async_to_sync(channel_layer.group_send)(
                    group_name,
                    {
                        'type': 'websocket_message',
                        'message': {
                            'type': 'message',
                            'data': message_data
                        }
                    }
                )
        except Exception as e:
            # Log error but don't fail the API request
            print(f"Error broadcasting WebSocket message: {str(e)}")

    def _broadcast_deletion_via_websocket(self, message, deletion_type, participants=None):
        """Broadcast message deletion to specified participants via WebSocket."""
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            
            channel_layer = get_channel_layer()
            if not channel_layer:
                return
            
            # Use provided participants or default to conversation participants
            if participants is None:
                conversation = message.conversation
                participants = [conversation.customer.id, conversation.provider.id]
            
            # Send deletion update to each participant
            for participant_id in participants:
                group_name = f'user_{participant_id}'
                async_to_sync(channel_layer.group_send)(
                    group_name,
                    {
                        'type': 'message_deleted',  # This matches the consumer method
                        'message_id': message.id,
                        'conversation_id': message.conversation.id,
                        'deletion_type': deletion_type
                    }
                )
        except Exception as e:
            # Log error but don't fail the API request
            print(f"Error broadcasting WebSocket deletion: {str(e)}")

    def destroy(self, request, *args, **kwargs):
        """Delete message based on deletion type."""
        message = self.get_object()
        
        # Parse JSON body for DELETE request
        try:
            import json
            body = json.loads(request.body.decode('utf-8'))
            deletion_type = body.get('deletion_type', 'self')
        except (json.JSONDecodeError, AttributeError):
            deletion_type = 'self'
        
        if deletion_type == 'everyone':
            # Validate user permissions
            if message.sender != request.user:
                return Response(
                    {'error': 'Only the message sender can delete for everyone'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check 15-minute time limit for "delete for everyone"
            from django.utils import timezone
            time_limit = timezone.timedelta(minutes=15)
            time_since_creation = timezone.now() - message.created_at
            
            if time_since_creation > time_limit:
                return Response(
                    {
                        'error': 'Cannot delete for everyone after 15 minutes',
                        'time_limit_minutes': 15,
                        'message_age_minutes': int(time_since_creation.total_seconds() / 60)
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Delete for everyone - hide message from all participants
            message.deletion_type = 'everyone'
            message.save(update_fields=['deletion_type'])  # This triggers the signal
        else:
            # Delete for self - only hide from current user
            if request.user.id not in message.deleted_by:
                message.deleted_by.append(request.user.id)
                message.save(update_fields=['deleted_by'])
                # For "delete for self", we need to broadcast to the deleter only
                self._broadcast_deletion_via_websocket(message, 'self', [request.user.id])
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['post'])
    def flag(self, request, pk=None):
        """Flag message for moderation."""
        message = self.get_object()
        reason = request.data.get('reason', '')
        
        message.is_flagged = True
        message.moderation_reason = reason[:100]  # Limit reason length
        message.save(update_fields=['is_flagged', 'moderation_reason'])
        
        return Response({
            'message': 'Message flagged for review',
            'flagged': True
        })
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark specific message as read."""
        message = self.get_object()
        user = request.user
        
        # Only allow marking as read if user is not the sender
        if message.sender == user:
            return Response(
                {'error': 'Cannot mark own message as read'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create read status if not exists
        read_status, created = MessageReadStatus.objects.get_or_create(
            message=message,
            user=user
        )
        
        # Update message status if newly read
        if created and message.status != 'read':
            message.status = 'read'
            message.save(update_fields=['status'])
        
        return Response({
            'message': 'Message marked as read',
            'read_at': read_status.read_at
        })


class ConversationMessagesListView(generics.ListAPIView):
    """
    List messages for a specific conversation with pagination.
    
    This view provides paginated message history for a conversation
    with proper permission checks.
    """
    
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsConversationParticipant]
    filter_backends = [OrderingFilter]
    ordering = ['created_at']  # Changed to ascending for proper chat pagination
    
    def get_queryset(self):
        """Return messages for the specific conversation."""
        conversation_id = self.kwargs.get('conversation_id')
        user = self.request.user
        
        try:
            # Verify user is part of the conversation
            conversation = Conversation.objects.get(
                id=conversation_id,
                **({
                    'customer': user
                } if user.role == 'customer' else {
                    'provider': user
                })
            )
        except Conversation.DoesNotExist:
            return Message.objects.none()
        
        # Return messages excluding deleted ones for this user
        # Note: Using Python filtering for SQLite compatibility
        all_messages = Message.objects.filter(
            conversation=conversation
        ).select_related('sender')
        
        # Filter out messages deleted by this user using Python filtering
        filtered_messages = []
        for message in all_messages:
            # Handle cases where deleted_by might be None, empty list, or invalid data
            deleted_by_list = message.deleted_by if isinstance(message.deleted_by, list) else []
            if user.id not in deleted_by_list:
                filtered_messages.append(message)
        
        return filtered_messages
    
    def list(self, request, *args, **kwargs):
        """List messages with auto-read marking."""
        response = super().list(request, *args, **kwargs)
        
        # Auto-mark conversation as read when fetching messages
        conversation_id = self.kwargs.get('conversation_id')
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            conversation.mark_as_read_for_user(request.user)
        except Conversation.DoesNotExist:
            pass
        
        return response


class TypingStatusView(generics.GenericAPIView):
    """
    Handle typing status updates for real-time communication.
    
    This view manages typing indicators for conversations.
    """
    
    permission_classes = [permissions.IsAuthenticated, IsConversationParticipant]
    
    def post(self, request, conversation_id):
        """Update typing status for user in conversation."""
        is_typing = request.data.get('is_typing', False)
        
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            
            # Verify user is part of conversation
            if request.user not in [conversation.customer, conversation.provider]:
                return Response(
                    {'error': 'Not authorized for this conversation'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Here we would typically broadcast typing status via WebSocket
            # For now, just return success
            return Response({
                'typing': is_typing,
                'user_id': request.user.id,
                'conversation_id': conversation_id
            })
            
        except Conversation.DoesNotExist:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
