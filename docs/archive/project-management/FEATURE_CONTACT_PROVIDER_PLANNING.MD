# Contact Provider Feature - Refined Implementation Plan

## 📋 Executive Summary

**Goal**: Implement a comprehensive "Contact Provider" feature on the service detail page (`/services/{id}`) enabling real-time communication between customers and service providers.

**Current Architecture Analysis** ✅:

- ✅ Django backend with custom User model (provider/customer roles)
- ✅ Profile system with provider information
- ✅ Existing notifications infrastructure
- ✅ Next.js frontend with service detail page
- ✅ Authentication system in place
- ✅ Comprehensive UI component library

## 🎯 Refined Requirements & Scope

### Core User Flow

1. **Customer Journey**:

   - Views service at `/services/{id}`
   - Clicks "Contact Provider" button
   - Gets quick contact modal (if not logged in → login prompt)
   - Can send quick message OR open full chat
   - Receives real-time responses

2. **Provider Journey**:
   - Receives instant notification of new message
   - Can respond via provider dashboard
   - Access to conversation history and customer context
   - Mobile-friendly quick responses

### Features Breakdown

#### 🔥 MVP Features (Phase 1 - 2 weeks)

- [x] **Quick Contact Modal**: Minimal friction, one-click messaging
- [x] **Real-time Messaging**: WebSocket-based instant delivery
- [x] **Authentication Gate**: Login required before messaging
- [x] **Email Fallback**: Brevo integration for offline providers
- [x] **Conversation Persistence**: Database storage with history
- [x] **Unread Counts**: Real-time notification badges
- [x] **Basic Rate Limiting**: Prevent spam and abuse

#### 🚀 Advanced Features (Phase 2 - 3 weeks)

- [x] **File Attachments**: Images and PDFs (max 5MB)
- [x] **Typing Indicators**: Real-time typing status
- [x] **Message Status**: Sent/Delivered/Read receipts
- [x] **WhatsApp Integration**: Fallback contact method
- [x] **Content Moderation**: AI-powered filtering
- [x] **Message Templates**: Quick response options for providers
- [x] **Analytics**: Conversation metrics and insights

## 🏗️ Technical Architecture

### Backend Implementation (Django)

#### 1. Database Models

```python
# backend/apps/messaging/models.py

class Conversation(models.Model):
    # Core relationships
    service = models.ForeignKey('services.Service', on_delete=models.CASCADE, related_name='conversations')
    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='provider_conversations')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='customer_conversations')

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    last_message_at = models.DateTimeField(null=True, blank=True)
    last_message_preview = models.TextField(max_length=100, blank=True)

    # Status and settings
    is_active = models.BooleanField(default=True)
    provider_archived = models.BooleanField(default=False)
    customer_archived = models.BooleanField(default=False)

    # Performance fields
    unread_count_provider = models.PositiveIntegerField(default=0)
    unread_count_customer = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ['service', 'provider', 'customer']
        indexes = [
            models.Index(fields=['provider', '-last_message_at']),
            models.Index(fields=['customer', '-last_message_at']),
        ]

class Message(models.Model):
    MESSAGE_TYPES = (
        ('text', 'Text'),
        ('image', 'Image'),
        ('file', 'File'),
        ('system', 'System'),
    )

    MESSAGE_STATUS = (
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('read', 'Read'),
    )

    # Core fields
    conversation = models.ForeignKey(Conversation, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    # Content
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='text')
    text = models.TextField(blank=True)
    attachment = models.FileField(upload_to='message_attachments/', null=True, blank=True)

    # Status and metadata
    status = models.CharField(max_length=20, choices=MESSAGE_STATUS, default='sent')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Soft delete functionality
    deleted_by = models.JSONField(default=list)  # [user_id, ...]

    # Moderation
    is_flagged = models.BooleanField(default=False)
    moderation_reason = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['conversation', '-created_at']),
        ]

class MessageReadStatus(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='read_statuses')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['message', 'user']
```

#### 2. API Endpoints

```python
# backend/apps/messaging/urls.py
urlpatterns = [
    # Conversations
    path('conversations/', ConversationListCreateView.as_view(), name='conversation-list-create'),
    path('conversations/<int:pk>/', ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<int:pk>/messages/', MessageListCreateView.as_view(), name='message-list-create'),
    path('conversations/<int:pk>/mark-read/', MarkConversationReadView.as_view(), name='mark-conversation-read'),

    # Messages
    path('messages/<int:pk>/', MessageDetailView.as_view(), name='message-detail'),
    path('messages/<int:pk>/flag/', FlagMessageView.as_view(), name='flag-message'),

    # Real-time
    path('conversations/<int:pk>/typing/', TypingStatusView.as_view(), name='typing-status'),
]
```

#### 3. WebSocket Implementation

```python
# backend/apps/messaging/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Conversation, Message

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data['type']

        if message_type == 'chat_message':
            await self.handle_chat_message(data)
        elif message_type == 'typing_status':
            await self.handle_typing_status(data)

    async def handle_chat_message(self, data):
        # Save message to database
        message = await self.save_message(data)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': message.id,
                    'text': message.text,
                    'sender_id': message.sender.id,
                    'sender_name': message.sender.full_name,
                    'created_at': message.created_at.isoformat(),
                    'message_type': message.message_type,
                }
            }
        )
```

### Frontend Implementation (Next.js + React)

#### 1. Component Architecture

```bash
src/components/messaging/
├── ContactButton.tsx           # Service page contact button
├── QuickContactModal.tsx       # Quick message modal
├── ChatPage.tsx               # Full chat interface
├── ConversationList.tsx       # Dashboard conversation list
├── MessageBubble.tsx          # Individual message component
├── TypingIndicator.tsx        # Typing status display
├── FileUpload.tsx             # Attachment upload
└── MessageTemplates.tsx       # Quick response templates
```

#### 2. Core Components

**ContactButton Component**:

```tsx
// src/components/messaging/ContactButton.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, Mail } from "lucide-react";
import { QuickContactModal } from "./QuickContactModal";
import { useAuth } from "@/contexts/AuthContext";
import { showToast } from "@/components/ui/enhanced-toast";

interface ContactButtonProps {
  serviceId: number;
  providerId: number;
  providerName: string;
  providerPhone?: string;
  providerEmail?: string;
  className?: string;
}

export function ContactButton({
  serviceId,
  providerId,
  providerName,
  providerPhone,
  providerEmail,
  className,
}: ContactButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const handleContactClick = () => {
    if (!isAuthenticated) {
      showToast({
        title: "Authentication Required",
        description: "Please log in to contact the provider",
        type: "warning",
      });
      // Redirect to login with return URL
      window.location.href = `/auth/login?return=/services/${serviceId}`;
      return;
    }

    if (user?.role !== "customer") {
      showToast({
        title: "Access Denied",
        description: "Only customers can contact providers",
        type: "error",
      });
      return;
    }

    setShowModal(true);
  };

  return (
    <>
      <div className={`flex gap-2 ${className}`}>
        <Button
          onClick={handleContactClick}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          size="lg"
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          Contact Provider
        </Button>

        {/* Alternative contact methods */}
        {providerPhone && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.open(`tel:${providerPhone}`)}
            title="Call Provider"
          >
            <Phone className="h-5 w-5" />
          </Button>
        )}

        {providerEmail && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.open(`mailto:${providerEmail}`)}
            title="Email Provider"
          >
            <Mail className="h-5 w-5" />
          </Button>
        )}
      </div>

      <QuickContactModal
        open={showModal}
        onClose={() => setShowModal(false)}
        serviceId={serviceId}
        providerId={providerId}
        providerName={providerName}
      />
    </>
  );
}
```

**QuickContactModal Component**:

```tsx
// src/components/messaging/QuickContactModal.tsx
"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import { showToast } from "@/components/ui/enhanced-toast";
import { messagingApi } from "@/services/messaging.api";

interface QuickContactModalProps {
  open: boolean;
  onClose: () => void;
  serviceId: number;
  providerId: number;
  providerName: string;
}

export function QuickContactModal({
  open,
  onClose,
  serviceId,
  providerId,
  providerName,
}: QuickContactModalProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Quick message templates
  const templates = [
    "Hi, I'm interested in this service. Could you provide more details?",
    "What's your availability for this service?",
    "Can you provide a custom quote for my requirements?",
    "I'd like to discuss the service details before booking.",
  ];

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      const response = await messagingApi.createConversation({
        service_id: serviceId,
        provider_id: providerId,
        initial_message: message.trim(),
      });

      showToast({
        title: "Message Sent!",
        description: `Your message has been sent to ${providerName}`,
        type: "success",
      });

      // Option to continue conversation
      const continueChat = confirm(
        "Would you like to continue this conversation?"
      );
      if (continueChat) {
        window.location.href = `/dashboard/customer/messages/${response.conversation_id}`;
      }

      onClose();
      setMessage("");
    } catch (error) {
      showToast({
        title: "Failed to Send",
        description: "Please try again later",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Contact {providerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick templates */}
          <div>
            <Label className="text-sm font-medium">Quick Messages:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {templates.map((template, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => setMessage(template)}
                >
                  {template.substring(0, 30)}...
                </Badge>
              ))}
            </div>
          </div>

          {/* Message textarea */}
          <div>
            <Label htmlFor="message">Your Message:</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length}/500 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                // Redirect to full chat page with pre-filled message
                const chatUrl = `/chat/new?service=${serviceId}&provider=${providerId}&message=${encodeURIComponent(
                  message
                )}`;
                window.location.href = chatUrl;
              }}
            >
              Open Full Chat
            </Button>

            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

#### 3. Real-time WebSocket Hook

```tsx
// src/hooks/useWebSocket.ts
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useWebSocket(conversationId: number) {
  const { user } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!conversationId || !user) return;

    const wsUrl = `ws://localhost:8000/ws/chat/${conversationId}/`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "chat_message") {
        setMessages((prev) => [data.message, ...prev]);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.current?.close();
    };
  }, [conversationId, user]);

  const sendMessage = (message: string) => {
    if (ws.current && isConnected) {
      ws.current.send(
        JSON.stringify({
          type: "chat_message",
          message: message,
        })
      );
    }
  };

  return { isConnected, messages, sendMessage };
}
```

#### 4. Integration with Service Detail Page

```tsx
// Add to src/app/services/[id]/page.tsx

import { ContactButton } from "@/components/messaging/ContactButton";

// In the service detail component:
<div className="mt-8">
  <ContactButton
    serviceId={service.id}
    providerId={service.provider.id}
    providerName={service.provider.full_name}
    providerPhone={service.provider.profile?.phone}
    providerEmail={service.provider.email}
    className="w-full"
  />
</div>;
```

## 🔧 Implementation Steps

### Phase 1 - MVP (2 weeks)

#### Week 1: Backend Foundation

**Day 1-2**: Database Models & Migrations ✅ **COMPLETED**

- [x] Create `messaging` Django app ✅
- [x] Implement `Conversation` and `Message` models ✅
- [x] Run migrations and test model relationships ✅
- [x] Add model admin interface ✅
- [x] Write comprehensive unit tests (14 tests passing) ✅
- [x] Verify no existing functionality broken ✅

**Day 3-4**: API Development

- [ ] Create serializers for models
- [ ] Implement ViewSets for CRUD operations
- [ ] Add authentication and permission checks
- [ ] Write API unit tests

**Day 5-7**: WebSocket Setup

- [ ] Configure Django Channels
- [ ] Implement `ChatConsumer` for real-time messaging
- [ ] Add Redis for channel layers
- [ ] Test WebSocket connections

#### Week 2: Frontend Implementation

**Day 8-10**: React Components

- [ ] Create `ContactButton` component
- [ ] Implement `QuickContactModal`
- [ ] Add authentication checks and error handling
- [ ] Integrate with existing service detail page

**Day 11-12**: WebSocket Integration

- [ ] Create `useWebSocket` hook
- [ ] Implement real-time message updates
- [ ] Add connection status indicators
- [ ] Handle reconnection logic

**Day 13-14**: Testing & Polish

- [ ] End-to-end testing of complete flow
- [ ] Mobile responsive design
- [ ] Performance optimization
- [ ] Bug fixes and code review

### Phase 2 - Advanced Features (3 weeks)

#### Week 3: Enhanced Messaging

- [ ] File upload functionality
- [ ] Message status indicators (sent/delivered/read)
- [ ] Typing indicators
- [ ] Message search and filtering

#### Week 4: Provider Features

- [ ] Provider dashboard integration
- [ ] Quick response templates
- [ ] Customer management interface
- [ ] Conversation analytics

#### Week 5: Notifications & Integrations

- [ ] Email notifications via Brevo
- [ ] WhatsApp integration
- [ ] Push notifications
- [ ] Content moderation system

## 🛡️ Security & Performance Considerations

### Security Measures

1. **Rate Limiting**: Max 10 messages per minute per user
2. **Content Validation**: Sanitize HTML, validate file types
3. **Permission Checks**: Ensure users can only access their conversations
4. **File Upload Security**: Virus scanning, size limits (5MB max)
5. **Soft Delete**: Messages deleted by users, not permanently removed

### Performance Optimizations

1. **Database Indexing**: Optimized queries for conversation lists
2. **Pagination**: Limit message history loads (30 messages per page)
3. **Caching**: Redis for active conversations and online status
4. **File Compression**: Optimize uploaded images
5. **WebSocket Management**: Efficient connection pooling

### Privacy & Compliance

1. **Data Retention**: 2-year message retention policy
2. **Export Functionality**: Users can download their conversation data
3. **GDPR Compliance**: Right to deletion, data portability
4. **Encryption**: TLS for all communications, encrypted file storage

## 📊 Success Metrics & Testing

### Key Performance Indicators

- **Adoption Rate**: % of service views that result in contact
- **Response Time**: Average time for provider to respond
- **Conversion Rate**: % of conversations that lead to bookings
- **User Satisfaction**: Rating of messaging experience
- **System Performance**: Message delivery time, uptime

### Testing Strategy

```bash
# Backend Tests
pytest apps/messaging/tests.py --cov=apps.messaging

# Frontend Tests
npm run test:messaging

# E2E Tests
npm run test:e2e -- --spec="messaging.cy.ts"

# Performance Tests
npm run test:performance -- --url="/services/1"
```

## 🚀 Deployment & Monitoring

### Infrastructure Requirements

- **Redis**: For Django Channels and caching
- **WebSocket Support**: Ensure hosting supports persistent connections
- **File Storage**: S3 or equivalent for message attachments
- **Email Service**: Brevo configuration for notifications

### Monitoring & Alerts

- WebSocket connection health
- Message delivery success rates
- File upload failures
- Rate limiting triggers
- Database performance metrics

## 📝 Documentation & Handover

### Developer Documentation

- API reference with examples
- WebSocket event specifications
- Component prop interfaces
- Database schema documentation

### User Guides

- Customer: How to contact providers
- Provider: Managing conversations and responses
- Admin: Moderation tools and analytics

---

## 🎉 Conclusion

This plan provides a comprehensive roadmap for implementing a robust, scalable contact provider feature. The hybrid approach (quick modal + full chat) offers both convenience and functionality, while the phased implementation ensures steady progress and early value delivery.

The architecture leverages your existing Django/Next.js stack effectively and follows your established patterns. With proper testing and monitoring, this feature will significantly enhance the user experience and increase booking conversions.

**Next Steps**:

1. Review and approve this plan
2. Set up project board with tasks
3. Begin Phase 1 implementation
4. Regular progress reviews and adjustments

Ready to start coding! 🚀
