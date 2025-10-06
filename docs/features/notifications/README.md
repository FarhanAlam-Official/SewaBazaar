# Notifications System Documentation

## Overview

The SewaBazaar notification system provides comprehensive multi-channel notifications to keep users informed about bookings, messages, rewards, and system updates. Built with Django and integrated with real-time WebSocket connections, it ensures users never miss important updates.

## System Status: ✅ COMPLETED

**Implementation Date:** September 2025  
**Current Version:** 2.0  
**Integration Status:** Fully integrated with all core systems

## Architecture

### Backend Models

#### Notification Model

```python
class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('booking_confirmed', 'Booking Confirmed'),
        ('booking_cancelled', 'Booking Cancelled'),
        ('payment_received', 'Payment Received'),
        ('message_received', 'New Message'),
        ('review_received', 'New Review'),
        ('reward_earned', 'Reward Points Earned'),
        ('voucher_redeemed', 'Voucher Redeemed'),
        ('service_reminder', 'Service Reminder'),
        ('system_announcement', 'System Announcement'),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE)
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
```

**Key Features:**

- Type-based notification classification
- Rich metadata storage in JSON field
- Read status tracking with timestamps
- User-specific notification delivery

#### NotificationPreference Model

```python
class NotificationPreference(models.Model):
    DELIVERY_CHANNELS = [
        ('in_app', 'In-App Notifications'),
        ('email', 'Email Notifications'), 
        ('sms', 'SMS Notifications'),
        ('push', 'Push Notifications'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    notification_type = models.CharField(max_length=50)
    channels = models.JSONField(default=list)
    is_enabled = models.BooleanField(default=True)
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
```

**Key Features:**

- Multi-channel delivery preferences
- Notification type-specific settings
- Quiet hours configuration
- Granular control over notification types

## Notification Types & Triggers

### Booking Notifications

#### Booking Confirmed

```python
{
    "type": "booking_confirmed",
    "trigger": "Booking status changed to 'confirmed'",
    "recipients": ["customer", "provider"],
    "data": {
        "booking_id": 123,
        "service_title": "House Cleaning",
        "booking_date": "2025-10-15T10:00:00Z",
        "provider_name": "John's Cleaning Co."
    }
}
```

#### Service Reminder

```python
{
    "type": "service_reminder", 
    "trigger": "24 hours before scheduled service",
    "recipients": ["customer", "provider"],
    "data": {
        "booking_id": 123,
        "service_title": "House Cleaning",
        "reminder_time": "24_hours_before"
    }
}
```

### Messaging Notifications

#### New Message Received

```python
{
    "type": "message_received",
    "trigger": "New message in conversation",
    "recipients": ["conversation_participant"],
    "data": {
        "conversation_id": 456,
        "sender_name": "Jane Smith",
        "message_preview": "Hi, I have a question about...",
        "service_title": "Plumbing Repair"
    }
}
```

### Rewards Notifications

#### Points Earned

```python
{
    "type": "reward_earned",
    "trigger": "Points added to user account", 
    "recipients": ["reward_account_owner"],
    "data": {
        "points_earned": 250,
        "total_balance": 1750,
        "earning_reason": "Booking completion bonus",
        "booking_id": 123
    }
}
```

#### Voucher Available

```python
{
    "type": "voucher_redeemed",
    "trigger": "Voucher successfully redeemed",
    "recipients": ["voucher_owner"],
    "data": {
        "voucher_code": "SAVE100-ABC123",
        "voucher_value": 100.00,
        "booking_id": 789
    }
}
```

## API Endpoints

### Notification Management

#### List User Notifications

```bash
GET /api/notifications/
```

**Query Parameters:**

- `is_read` (boolean): Filter by read status
- `notification_type` (string): Filter by notification type
- `page` (int): Page number for pagination

**Response:**

```json
{
    "results": [
        {
            "id": 123,
            "notification_type": "booking_confirmed",
            "title": "Booking Confirmed",
            "message": "Your house cleaning service has been confirmed for Oct 15, 2025 at 10:00 AM",
            "data": {
                "booking_id": 456,
                "service_title": "House Cleaning",
                "provider_name": "John's Cleaning Co."
            },
            "is_read": false,
            "created_at": "2025-10-06T08:30:00Z",
            "read_at": null
        }
    ],
    "unread_count": 5
}
```

#### Mark Notifications as Read

```bash
POST /api/notifications/mark_read/
{
    "notification_ids": [123, 124, 125]
}
```

#### Mark All as Read

```bash
POST /api/notifications/mark_all_read/
```

#### Delete Notification

```bash
DELETE /api/notifications/{id}/
```

### Notification Preferences

#### Get User Preferences

```bash
GET /api/notifications/preferences/
```

**Response:**

```json
{
    "preferences": [
        {
            "notification_type": "booking_confirmed",
            "channels": ["in_app", "email"],
            "is_enabled": true
        },
        {
            "notification_type": "message_received",
            "channels": ["in_app", "push"],
            "is_enabled": true
        }
    ],
    "quiet_hours": {
        "start": "22:00",
        "end": "08:00"
    }
}
```

#### Update Preferences

```bash
PUT /api/notifications/preferences/
{
    "preferences": [
        {
            "notification_type": "booking_confirmed",
            "channels": ["in_app", "email", "sms"],
            "is_enabled": true
        }
    ],
    "quiet_hours": {
        "start": "23:00",
        "end": "07:00"
    }
}
```

## Real-time Delivery

### WebSocket Integration

```javascript
// WebSocket connection for real-time notifications
const notificationSocket = new WebSocket(
    'ws://localhost:8000/ws/notifications/'
);

notificationSocket.onmessage = function(event) {
    const notification = JSON.parse(event.data);
    
    // Update notification counter
    updateNotificationBadge(notification.unread_count);
    
    // Show toast notification
    showToastNotification(notification);
    
    // Update notification list
    addToNotificationList(notification);
};
```

### Push Notifications

```python
# Push notification service integration
def send_push_notification(user, notification_data):
    """Send push notification using FCM or similar service"""
    
    # Get user's device tokens
    device_tokens = get_user_device_tokens(user)
    
    # Construct push notification payload
    payload = {
        "title": notification_data.title,
        "body": notification_data.message,
        "data": notification_data.data,
        "click_action": generate_deep_link(notification_data)
    }
    
    # Send to push service
    send_to_fcm(device_tokens, payload)
```

## Frontend Implementation

### Notification Components

#### NotificationBell Component

```tsx
interface NotificationBellProps {
    unreadCount: number;
    onClick: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ 
    unreadCount, 
    onClick 
}) => {
    return (
        <button 
            className="relative p-2 hover:bg-gray-100 rounded-full"
            onClick={onClick}
        >
            <BellIcon className="w-6 h-6" />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </button>
    );
};
```

#### NotificationPanel Component

```tsx
const NotificationPanel: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Fetch notifications on mount
    useEffect(() => {
        fetchNotifications();
    }, []);
    
    // Real-time notification updates
    useEffect(() => {
        const socket = connectToNotificationSocket();
        
        socket.onmessage = (event) => {
            const newNotification = JSON.parse(event.data);
            setNotifications(prev => [newNotification, ...prev]);
        };
        
        return () => socket.close();
    }, []);
    
    return (
        <div className="notification-panel">
            {/* Notification list rendering */}
        </div>
    );
};
```

### State Management

```typescript
interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    preferences: NotificationPreference[];
    loading: boolean;
    error: string | null;
}

const useNotifications = () => {
    const [state, setState] = useState<NotificationState>(initialState);
    
    const markAsRead = useCallback(async (notificationIds: number[]) => {
        // API call to mark as read
        // Update local state
    }, []);
    
    const updatePreferences = useCallback(async (preferences: NotificationPreference[]) => {
        // API call to update preferences
        // Update local state
    }, []);
    
    return {
        ...state,
        markAsRead,
        updatePreferences
    };
};
```

## Integration Points

### Booking System Integration

```python
# Automatic notification triggers
@receiver(post_save, sender=Booking)
def booking_status_changed(sender, instance, **kwargs):
    if instance.status == 'confirmed':
        create_notification(
            recipient=instance.customer,
            notification_type='booking_confirmed',
            title='Booking Confirmed',
            message=f'Your {instance.service.title} booking has been confirmed',
            data={'booking_id': instance.id}
        )
```

### Messaging System Integration

```python
# New message notifications
@receiver(post_save, sender=Message) 
def message_sent(sender, instance, **kwargs):
    # Get conversation participants
    participants = instance.conversation.get_other_participants(instance.sender)
    
    for participant in participants:
        create_notification(
            recipient=participant,
            notification_type='message_received',
            title='New Message',
            message=f'You have a new message from {instance.sender.get_full_name()}',
            data={
                'conversation_id': instance.conversation.id,
                'message_id': instance.id
            }
        )
```

### Rewards System Integration

```python
# Points earned notifications
@receiver(post_save, sender=PointsTransaction)
def points_earned(sender, instance, **kwargs):
    if instance.transaction_type == 'earned':
        create_notification(
            recipient=instance.account.user,
            notification_type='reward_earned',
            title='Points Earned!',
            message=f'You earned {instance.points} points',
            data={
                'points_earned': instance.points,
                'total_balance': instance.account.current_balance
            }
        )
```

## Delivery Channels

### In-App Notifications

- **Real-time Display:** WebSocket-based instant delivery
- **Notification Center:** Persistent notification history
- **Badge Counters:** Unread notification indicators
- **Toast Messages:** Non-intrusive notification popups

### Email Notifications

- **Template System:** Rich HTML email templates
- **Batch Processing:** Efficient bulk email delivery
- **Personalization:** User-specific content customization
- **Delivery Tracking:** Email open and click tracking

### SMS Notifications

- **Critical Alerts:** High-priority notifications only
- **Template Messages:** Predefined SMS templates
- **Delivery Confirmation:** SMS delivery status tracking
- **Cost Optimization:** Smart delivery based on importance

### Push Notification

- **Mobile App Integration:** FCM for Android, APNS for iOS
- **Deep Linking:** Direct navigation to relevant app sections
- **Rich Content:** Images and action buttons in notifications
- **Scheduling:** Time-based notification delivery

## Performance Optimization

### Database Optimization

- **Efficient Queries:** Optimized notification retrieval
- **Batch Processing:** Bulk notification creation
- **Index Strategy:** Proper database indexing for fast lookups
- **Cleanup Jobs:** Automatic old notification cleanup

### Delivery Optimization

- **Queue System:** Asynchronous notification processing
- **Rate Limiting:** Prevent notification spam
- **Deduplication:** Avoid duplicate notifications
- **Retry Logic:** Reliable delivery with fallback options

## Security & Privacy

### Data Protection

- **Personal Information:** Minimal personal data in notifications
- **Content Filtering:** Automatic content sanitization
- **Access Controls:** User-specific notification access
- **Data Retention:** Configurable notification retention policies

### Privacy Controls

- **Opt-out Options:** Granular notification control
- **Data Export:** User notification data export
- **Right to Deletion:** Complete notification data removal
- **Consent Management:** Clear consent for notification types

## Related Documentation

- [WebSocket Integration](../real-time/websockets.md)
- [Email System](../integrations/email.md)
- [Push Notifications](../integrations/push-notifications.md)
- [API Reference](../api/README.md)
