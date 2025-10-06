# Phase 3C: Backend Integration - Next Steps

## Overview

With Phase 3A (Real-time Features) complete, Phase 3C will integrate our WebSocket infrastructure with Django backend APIs and implement server-side WebSocket handling.

## Backend Requirements to Implement

### 1. Django WebSocket Server Setup

**Install Dependencies:**

```bash
pip install channels channels-redis
```

**Configure Django Settings:**

```python
# settings.py
INSTALLED_APPS = [
    'channels',
    'apps.messaging',  # Your messaging app
    # ...
]

ASGI_APPLICATION = 'sewabazaar.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    },
}
```

### 2. WebSocket Consumer Classes

**File:** `backend/apps/messaging/consumers.py`

```python
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import Conversation, Message

class MessagingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get user from query params
        user_id = self.scope['query_string'].decode().split('=')[1]
        self.user_id = user_id
        self.user_group_name = f'user_{user_id}'

        # Join user group
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        await self.accept()

        # Send online status
        await self.send_user_status(True)

    async def disconnect(self, close_code):
        # Send offline status
        await self.send_user_status(False)

        # Leave user group
        await self.channel_layer.group_discard(
            self.user_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data['type']

        if message_type == 'message':
            await self.handle_message(data['data'])
        elif message_type == 'typing':
            await self.handle_typing(data['data'])

    async def handle_message(self, data):
        conversation_id = data['conversation_id']
        content = data['content']

        # Save message to database
        message = await self.create_message(conversation_id, content)

        # Send to conversation participants
        await self.send_to_conversation(conversation_id, {
            'type': 'message',
            'data': message
        })

    async def handle_typing(self, data):
        conversation_id = data['conversation_id']
        is_typing = data['is_typing']

        # Send typing status to conversation participants
        await self.send_to_conversation(conversation_id, {
            'type': 'typing',
            'data': {
                'user_id': self.user_id,
                'user_name': await self.get_user_name(),
                'is_typing': is_typing
            }
        }, exclude_self=True)
```

### 3. API Endpoints Integration

**File:** `backend/apps/messaging/views.py`

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer

class ConversationViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related('messages', 'participants')

    @action(detail=True, methods=['post'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        serializer = MessageSerializer(data=request.data)

        if serializer.is_valid():
            message = serializer.save(
                sender=request.user,
                conversation=conversation
            )
            return Response(MessageSerializer(message).data,
                          status=status.HTTP_201_CREATED)
        return Response(serializer.errors,
                       status=status.HTTP_400_BAD_REQUEST)
```

### 4. Frontend Environment Configuration

**File:** `frontend/.env.local`

```env
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/messaging/
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

### 5. Authentication Integration

**Update WebSocket Hook:**

```typescript
// In useWebSocket.ts
const connect = useCallback(() => {
  if (!isAuthenticated || !user) return;

  const token = localStorage.getItem("token");
  const wsUrl = `${url}?token=${token}`;
  ws.current = new WebSocket(wsUrl);
}, [isAuthenticated, user, url]);
```

## Implementation Order for Phase 3C

### Step 1: Django WebSocket Setup ⏳

1. Install channels and redis dependencies
2. Configure Django settings for WebSocket support
3. Create ASGI application configuration
4. Set up Redis for channel layers

### Step 2: WebSocket Consumers ⏳

1. Create MessagingConsumer class
2. Implement connection/disconnection handlers
3. Add message handling logic
4. Add typing status handling
5. Add online status broadcasting

### Step 3: API Integration ⏳

1. Create/update Django REST API endpoints
2. Integrate with existing models
3. Add proper authentication
4. Add file upload handling for attachments

### Step 4: Frontend Integration ⏳

1. Replace mock API endpoints with real Django URLs
2. Update authentication headers
3. Test WebSocket connection with Django
4. Verify real-time features end-to-end

### Step 5: Testing & Validation ⏳

1. Test real-time messaging between multiple users
2. Verify typing indicators work across sessions
3. Test online/offline status updates
4. Validate message persistence in database

## Expected Outcomes

After Phase 3C completion:

- ✅ Real-time WebSocket server running on Django
- ✅ Database persistence for all messages
- ✅ Multi-user real-time communication
- ✅ Authentication-secured WebSocket connections
- ✅ API endpoints fully integrated with frontend
- ✅ File attachment support through API
- ✅ Production-ready messaging system

## Ready for Phase 3B

After Phase 3C, we'll implement Phase 3B (Advanced Functionality):

- Message search and filtering
- Message reactions and emojis
- Voice message recording and playback
- File preview capabilities
- Message editing and deletion
- Advanced notification system

The real-time infrastructure from Phase 3A provides the foundation for all these advanced features.
