# Messaging System Documentation

## Overview

The SewaBazaar messaging system provides secure, real-time communication between customers and service providers. Built with Django and featuring end-to-end encryption, it enables seamless interaction throughout the service booking and delivery process.

## System Status: ✅ COMPLETED

**Implementation Date:** September 2025  
**Current Version:** 2.0  
**Integration Status:** Fully integrated with booking and notification systems

## Architecture

### Backend Models

#### Conversation Model

```python
class Conversation(models.Model):
    service = ForeignKey('services.Service')
    provider = ForeignKey(User, limit_choices_to={'role': 'provider'})
    customer = ForeignKey(User, limit_choices_to={'role': 'customer'})
    subject = CharField(max_length=200, blank=True)
    status = CharField(choices=STATUS_CHOICES, default='active')
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
    last_message_at = DateTimeField(null=True, blank=True)
```

**Key Features:**

- Service-specific conversation threads
- Status tracking (active, archived, closed)
- Automatic timestamp management
- Performance metrics tracking

#### Message Model

```python
class Message(models.Model):
    conversation = ForeignKey(Conversation, related_name='messages')
    sender = ForeignKey(User)
    content = TextField()
    message_type = CharField(choices=MESSAGE_TYPE_CHOICES, default='text')
    attachment = FileField(upload_to=message_attachment_path, blank=True)
    is_encrypted = BooleanField(default=False)
    sent_at = DateTimeField(auto_now_add=True)
    edited_at = DateTimeField(null=True, blank=True)
```

**Key Features:**

- End-to-end encryption support
- File attachment capabilities
- Message type classification (text, image, file, voice)
- Edit history tracking

#### MessageReadStatus Model

```python
class MessageReadStatus(models.Model):
    message = ForeignKey(Message, related_name='read_statuses')
    user = ForeignKey(User)
    read_at = DateTimeField(auto_now_add=True)
```

**Key Features:**

- Read receipt tracking
- Multi-participant read status
- Delivery confirmation

### Security Features

#### Message Encryption

```python
def encrypt_message_text(plaintext):
    """Encrypt message content using Fernet symmetric encryption"""
    
def decrypt_message_text(encrypted_text):
    """Decrypt message content for authorized users"""
    
def is_message_encrypted(content):
    """Check if message content is encrypted"""
```

**Security Measures:**

- Fernet symmetric encryption for message content
- Key rotation and management
- Encrypted file attachment support
- Access control validation

#### File Upload Security

```python
def message_attachment_path(instance, filename):
    """Secure file upload path generation"""
    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    return f'message_attachments/{instance.conversation.id}/{timestamp}_{filename}'
```

**Security Features:**

- Timestamp-based file naming
- Conversation-specific file isolation
- File extension validation
- Size limit enforcement

## API Endpoints

### Conversation Management

#### List Conversations

```bash
GET /api/messaging/conversations/
```

**Query Parameters:**

- `status` (string): Filter by conversation status
- `service` (int): Filter by service ID
- `search` (string): Search by participant name or service title

**Response:**

```json
{
    "results": [
        {
            "id": 1,
            "service": {
                "id": 123,
                "title": "House Cleaning Service",
                "provider": "John's Cleaning Co."
            },
            "provider": {
                "id": 456,
                "name": "John Smith",
                "avatar": "/media/avatars/john.jpg"
            },
            "customer": {
                "id": 789,
                "name": "Jane Doe",
                "avatar": "/media/avatars/jane.jpg"
            },
            "subject": "Availability for this weekend?",
            "status": "active",
            "last_message_at": "2025-10-06T10:30:00Z",
            "unread_count": 2
        }
    ]
}
```

#### Create Conversation

```bash
POST /api/messaging/conversations/
{
    "service_id": 123,
    "provider_id": 456,
    "subject": "Service inquiry",
    "initial_message": "Hi, I'm interested in your service..."
}
```

#### Get Conversation Details

```bash
GET /api/messaging/conversations/{id}/
```

**Response includes:**

- Full conversation metadata
- Recent messages (paginated)
- Participant information
- Read status indicators

### Message Management

#### Send Message

```bash
POST /api/messaging/messages/
{
    "conversation_id": 1,
    "content": "Hello, when are you available?",
    "message_type": "text",
    "encrypt": true
}
```

#### Send Message with Attachment

```bash
POST /api/messaging/messages/
Content-Type: multipart/form-data

conversation_id: 1
content: "Here's the image you requested"
attachment: [file]
message_type: "image"
```

#### List Messages

```bash
GET /api/messaging/conversations/{conversation_id}/messages/
```

**Query Parameters:**

- `page` (int): Page number for pagination
- `page_size` (int): Messages per page (default: 20)
- `before` (datetime): Get messages before this timestamp

#### Mark Messages as Read

```bash
POST /api/messaging/conversations/{id}/mark_as_read/
{
    "message_ids": [123, 124, 125]
}
```

### Conversation Actions

#### Archive Conversation

```bash
POST /api/messaging/conversations/{id}/archive/
```

#### Delete Conversation

```bash
DELETE /api/messaging/conversations/{id}/
```

#### Update Conversation Status

```bash
PATCH /api/messaging/conversations/{id}/
{
    "status": "closed",
    "subject": "Updated subject line"
}
```

## Frontend Implementation

### React Components

#### ConversationList Component

- Displays user's conversation threads
- Real-time updates for new messages
- Search and filter functionality
- Unread message indicators

#### MessageThread Component  

- Shows messages within a conversation
- Message composition and sending
- File upload and attachment handling
- Read status indicators
- Message encryption/decryption

#### MessageComposer Component

- Rich text message composition
- File attachment interface
- Emoji and formatting support
- Send/typing indicators

### State Management

```typescript
interface ConversationState {
    conversations: Conversation[]
    activeConversation: Conversation | null
    messages: Record<number, Message[]>
    loading: boolean
    error: string | null
}
```

### Real-time Updates

```typescript
// WebSocket connection for real-time messaging
const useMessagingSocket = (conversationId: number) => {
    // Socket connection management
    // Message event handlers
    // Connection status tracking
}
```

## Integration Points

### Booking System Integration

- **Automatic Conversation Creation:** When a booking is created
- **Status Synchronization:** Booking status updates reflected in messages
- **Service Context:** Messages maintain connection to specific service bookings

### Notification System Integration

- **New Message Notifications:** Real-time push notifications
- **Email Notifications:** Configurable email alerts for messages
- **In-app Notifications:** Badge counts and notification center integration

### User Profile Integration

- **Profile Information:** Access to user profiles within conversations
- **Verification Status:** Provider verification badges in messaging interface
- **Service History:** Context about previous interactions

## Performance Optimizations

### Database Optimizations

- **Efficient Queries:** select_related and prefetch_related for conversation loading
- **Message Pagination:** Cursor-based pagination for large conversation threads
- **Index Optimization:** Database indexes on conversation participants and timestamps

### Caching Strategy

- **Conversation List Caching:** Redis caching for frequently accessed conversations
- **Message Caching:** Cache recent messages for active conversations
- **User Status Caching:** Cache online/offline status for participants

### File Handling

- **Chunked Upload:** Large file uploads with progress tracking
- **Image Compression:** Automatic image optimization for attachments
- **CDN Integration:** Static file serving through content delivery network

## Security Considerations

### Access Control

- **Conversation Participants:** Only participants can access conversation messages
- **Service-based Permissions:** Conversations tied to specific service interactions
- **Admin Override:** System administrators can moderate conversations when needed

### Data Privacy

- **Message Encryption:** End-to-end encryption for sensitive communications
- **File Security:** Secure file storage with access controls
- **Data Retention:** Configurable message and file retention policies
- **GDPR Compliance:** User data export and deletion capabilities

### Moderation Features

- **Content Filtering:** Automatic detection of inappropriate content
- **Report System:** Users can report conversations for review
- **Admin Tools:** Administrative interface for conversation moderation
- **Audit Trail:** Complete logging of all messaging activities

## Testing Strategy

### Unit Tests

- **Model Tests:** Message encryption/decryption, conversation logic
- **API Tests:** Endpoint functionality and security
- **Permission Tests:** Access control validation

### Integration Tests

- **End-to-end Messaging:** Complete conversation workflows
- **File Upload Tests:** Attachment handling and security
- **Real-time Tests:** WebSocket functionality and performance

## Related Documentation

- [Booking System Integration](../features/booking-management/README.md)
- [Notification System](../features/notifications/README.md)  
- [Security Guidelines](../security/README.md)
- [API Reference](../api/README.md)
