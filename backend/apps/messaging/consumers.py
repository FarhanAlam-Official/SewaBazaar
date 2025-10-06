"""
WebSocket consumers for real-time messaging functionality.
"""

import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone
from .models import Conversation, Message
from .serializers import MessageSerializer

User = get_user_model()


class MessagingConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time messaging features including:
    - Real-time message delivery
    - Typing indicators  
    - Online status tracking
    """
    
    async def connect(self):
        """Handle WebSocket connection with improved error handling"""
        try:
            # Get user from query parameters
            query_string = self.scope['query_string'].decode()
            user_id = None
            
            # Parse user_id from query string
            for param in query_string.split('&'):
                if param.startswith('user_id='):
                    user_id = param.split('=')[1]
                    break
            
            if not user_id:
                print(f"❌ WebSocket connection rejected: No user_id provided")
                await self.close()
                return
            
            try:
                self.user = await self.get_user(int(user_id))
                if not self.user:
                    print(f"❌ WebSocket connection rejected: User {user_id} not found")
                    await self.close()
                    return
            except (ValueError, ObjectDoesNotExist) as e:
                print(f"❌ WebSocket connection rejected: Invalid user {user_id} - {str(e)}")
                await self.close()
                return
            
            self.user_id = self.user.id
            self.user_group_name = f'user_{self.user_id}'
            
            # Join user group for direct messaging
            try:
                await self.channel_layer.group_add(
                    self.user_group_name,
                    self.channel_name
                )
                print(f"✅ User {self.user_id} joined group {self.user_group_name}")
            except Exception as e:
                print(f"❌ Failed to join channel group: {str(e)}")
                await self.close()
                return
            
            # Accept the connection
            await self.accept()
            print(f"✅ WebSocket connected for user {self.user_id}")
            
            # Broadcast user online status
            await self.broadcast_user_status(True)
            
            # Send connection confirmation
            await self.send(text_data=json.dumps({
                'type': 'connection',
                'data': {
                    'status': 'connected',
                    'user_id': self.user_id
                }
            }))
            
        except Exception as e:
            print(f"❌ WebSocket connection error: {str(e)}")
            await self.close()
            return
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'user_id'):
            # Broadcast user offline status
            await self.broadcast_user_status(False)
            
            # Leave user group
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle received WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            message_data = data.get('data', {})
            
            if message_type == 'message':
                await self.handle_chat_message(message_data)
            elif message_type == 'typing':
                await self.handle_typing_status(message_data)
            elif message_type == 'heartbeat':
                await self.handle_heartbeat()
            elif message_type == 'voice_message':
                await self.handle_voice_message(message_data)
            elif message_type == 'message_status':
                await self.handle_message_status_update(message_data)
            else:
                await self.send_error(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON format")
        except Exception as e:
            await self.send_error(f"Error processing message: {str(e)}")
    
    async def handle_chat_message(self, data):
        """Handle incoming chat messages"""
        try:
            conversation_id = data.get('conversation_id')
            content = data.get('content', '').strip()
            attachments = data.get('attachments', [])
            
            if not conversation_id or not content:
                await self.send_error("Missing conversation_id or content")
                return
            
            # Verify user is participant in conversation
            conversation = await self.get_conversation(conversation_id)
            if not conversation:
                await self.send_error("Conversation not found or access denied")
                return
            
            # Create message in database
            message = await self.create_message(conversation, content, attachments)
            if not message:
                await self.send_error("Failed to create message")
                return
            
            # Serialize message for transmission
            message_data = await self.serialize_message(message)
            
            # Send to all conversation participants
            await self.send_to_conversation_participants(conversation_id, {
                'type': 'message',
                'data': message_data
            })
            
        except Exception as e:
            await self.send_error(f"Error handling chat message: {str(e)}")
    
    async def handle_typing_status(self, data):
        """Handle typing indicator updates"""
        try:
            conversation_id = data.get('conversation_id')
            is_typing = data.get('is_typing', False)
            
            if not conversation_id:
                await self.send_error("Missing conversation_id")
                return
            
            # Verify user is participant in conversation
            conversation = await self.get_conversation(conversation_id)
            if not conversation:
                return
            
            # Send typing status to other participants (exclude sender)
            await self.send_to_conversation_participants(
                conversation_id,
                {
                    'type': 'typing',
                    'data': {
                        'user_id': self.user_id,
                        'user_name': f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username,
                        'is_typing': is_typing,
                        'conversation_id': conversation_id
                    }
                },
                exclude_user=self.user_id
            )
            
        except Exception as e:
            await self.send_error(f"Error handling typing status: {str(e)}")
    
    async def handle_heartbeat(self):
        """Handle heartbeat/ping messages"""
        await self.send(text_data=json.dumps({
            'type': 'heartbeat',
            'data': {'status': 'pong'}
        }))
    
    async def handle_voice_message(self, data):
        """Handle voice message notifications"""
        try:
            conversation_id = data.get('conversation_id')
            sender_id = data.get('sender_id')
            duration = data.get('duration', 0)
            file_size = data.get('file_size', 'Unknown')
            status = data.get('status', 'sent')
            
            if not conversation_id:
                await self.send_error("Missing conversation_id")
                return
            
            # Verify user is participant in conversation
            conversation = await self.get_conversation(conversation_id)
            if not conversation:
                await self.send_error("Conversation not found or access denied")
                return
            
            # Send voice message notification to all participants
            await self.send_to_conversation_participants(conversation_id, {
                'type': 'voice_message',
                'data': {
                    'conversation_id': conversation_id,
                    'sender_id': sender_id,
                    'sender_name': f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username,
                    'duration': duration,
                    'file_size': file_size,
                    'status': status,
                    'timestamp': timezone.now().isoformat()
                }
            })
            
        except Exception as e:
            await self.send_error(f"Error handling voice message: {str(e)}")
    
    async def handle_message_status_update(self, data):
        """Handle message status updates (delivered, read, etc.)"""
        try:
            message_id = data.get('message_id')
            conversation_id = data.get('conversation_id')
            status = data.get('status')
            message_type = data.get('message_type', 'text')
            
            if not all([message_id, conversation_id, status]):
                await self.send_error("Missing required fields for status update")
                return
            
            # Verify user is participant in conversation
            conversation = await self.get_conversation(conversation_id)
            if not conversation:
                return
            
            # Send status update to all participants
            await self.send_to_conversation_participants(conversation_id, {
                'type': 'message_status',
                'data': {
                    'message_id': message_id,
                    'conversation_id': conversation_id,
                    'status': status,
                    'message_type': message_type,
                    'updated_by': self.user_id,
                    'timestamp': timezone.now().isoformat()
                }
            })
            
        except Exception as e:
            await self.send_error(f"Error handling message status update: {str(e)}")
    
    async def broadcast_user_status(self, is_online):
        """Broadcast user online/offline status to all users"""
        try:
            # Get all conversations this user is part of
            conversations = await self.get_user_conversations()
            
            # Send status to all participants in those conversations
            for conversation in conversations:
                await self.send_to_conversation_participants(
                    conversation.id,
                    {
                        'type': 'status',
                        'data': {
                            'user_id': self.user_id,
                            'user_name': f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username,
                            'is_online': is_online
                        }
                    },
                    exclude_user=self.user_id
                )
        except Exception as e:
            print(f"Error broadcasting user status: {str(e)}")
    
    async def send_to_conversation_participants(self, conversation_id, message, exclude_user=None):
        """Send message to all participants in a conversation"""
        try:
            participants = await self.get_conversation_participants(conversation_id)
            
            for participant in participants:
                if exclude_user and participant['user_id'] == exclude_user:
                    continue
                
                group_name = f'user_{participant["user_id"]}'
                await self.channel_layer.group_send(
                    group_name,
                    {
                        'type': 'websocket_message',
                        'message': message
                    }
                )
        except Exception as e:
            print(f"Error sending to conversation participants: {str(e)}")
    
    async def websocket_message(self, event):
        """Handle messages from channel layer"""
        message = event['message']
        await self.send(text_data=json.dumps(message))
    
    async def send_error(self, error_message):
        """Send error message to client"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'data': {'message': error_message}
        }))
    
    # Database helper methods
    @database_sync_to_async
    def get_user(self, user_id):
        """Get user by ID"""
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
    
    @database_sync_to_async
    def get_conversation(self, conversation_id):
        """Get conversation if user is participant"""
        try:
            from django.db.models import Q
            return Conversation.objects.filter(
                Q(id=conversation_id) & 
                (Q(customer=self.user) | Q(provider=self.user))
            ).first()
        except Exception:
            return None
    
    @database_sync_to_async
    def get_conversation_participants(self, conversation_id):
        """Get all participants in a conversation"""
        try:
            conversation = Conversation.objects.select_related('customer', 'provider').get(id=conversation_id)
            # Return both customer and provider as participants
            return [
                {'user_id': conversation.customer.id, 'user': conversation.customer},
                {'user_id': conversation.provider.id, 'user': conversation.provider}
            ]
        except Exception:
            return []
    
    @database_sync_to_async  
    def get_user_conversations(self):
        """Get all conversations for current user"""
        try:
            from django.db.models import Q
            return list(Conversation.objects.filter(
                Q(customer=self.user) | Q(provider=self.user)
            ))
        except Exception:
            return []
    
    @database_sync_to_async
    def create_message(self, conversation, content, attachments=None):
        """Create a new message in the database"""
        try:
            message = Message.objects.create(
                conversation=conversation,
                sender=self.user,
                text=content,  # Using 'text' field as per model
                message_type='text'
            )
            # Handle attachments if provided
            # TODO: Implement attachment handling
            return message
        except Exception as e:
            print(f"Error creating message: {str(e)}")
            return None
    
    @database_sync_to_async
    def serialize_message(self, message):
        """Serialize message for WebSocket transmission"""
        try:
            serializer = MessageSerializer(message)
            return serializer.data
        except Exception as e:
            print(f"Error serializing message: {str(e)}")
            return None
    
    async def message_deleted(self, event):
        """
        Handle message deletion notification
        """
        await self.send(text_data=json.dumps({
            'type': 'message_deleted',
            'message_id': event['message_id'],
            'conversation_id': event['conversation_id'],
            'deletion_type': event['deletion_type']
        }))