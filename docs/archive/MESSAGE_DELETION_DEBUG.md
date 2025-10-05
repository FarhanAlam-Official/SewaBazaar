# Message Deletion System - Debugging Guide

## Current Implementation Status

✅ **Backend Changes Completed:**

- Enhanced message deletion API with time limits (7 minutes)
- Permission validation (only sender can delete for everyone)
- WebSocket signals for real-time notifications
- Proper message filtering in serializers

✅ **Frontend Changes Completed:**

- Enhanced delete confirmation dialog
- Time-based UI validation
- Real-time WebSocket event handling
- Optimistic UI updates

## 🚨 **CRITICAL ISSUE: Conversation API Failing**

The chat is currently showing "Failed to load conversation" error. This needs to be fixed before testing message deletion.

### Debugging Steps for API Issue

1. **Check Backend Logs** - Look for these debug messages:

   ```bash
   🔍 ConversationViewSet.get_queryset called for user: X (role)
   🔍 Retrieving conversation Y for user X (role)
   🔒 Permission check for conversation Y: User X (role) - Participant: True/False
   ```

2. **Check Frontend Console** - Look for these debug messages:

   ```bash
   Debug Info: {conversationId, token, apiUrl, fullUrl}
   Conversation Load Error: Failed to load conversation: 404/403/500...
   ```

3. **Test API Directly** - Use browser dev tools or curl:

   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        "http://127.0.0.1:8000/api/messaging/conversations/CONVERSATION_ID/?page=1&page_size=50"
   ```

4. **Check Database** - Verify conversation exists and user has access:

   ```sql
   SELECT * FROM messaging_conversation WHERE id = CONVERSATION_ID;
   ```

## Testing Steps

### 1. Basic Functionality Test

1. Open the chat in two different browsers/users
2. Send a message from User A
3. Delete the message "for everyone" from User A
4. **Expected Result:** Both users should see "🚫 This message was deleted"

### 2. Time Limit Test

1. Send a message
2. Wait more than 7 minutes
3. Try to delete the message
4. **Expected Result:** Only "Delete for Me" option should be available

### 3. Permission Test

1. User A sends a message
2. User B tries to delete User A's message
3. **Expected Result:** Error message about permissions

## Debugging Checklist

If deletion is not working properly, check:

### Backend Logs

- Look for signal debug messages: `🗑️ Signal triggered: Message X deleted for everyone`
- Check WebSocket consumer logs: `🗑️ Sending message deletion to user X`
- Verify API calls are successful (status 204)

### Frontend Console

- Check WebSocket messages: `📨 WebSocket message received:`
- Look for deletion events: `🗑️ Real-time deletion event received:`
- Verify state updates: `📝 Updated conversation:`

### Database State

```sql
-- Check if message was properly marked as deleted
SELECT id, text, deletion_type FROM messaging_message WHERE id = [MESSAGE_ID];
```

## Common Issues & Solutions

### Issue 1: Messages not showing as deleted for receiver

**Cause:** WebSocket group mismatch or signal not firing
**Solution:** Check backend logs for signal debug messages

### Issue 2: Frontend not updating in real-time

**Cause:** WebSocket event handler not properly registered
**Solution:** Check browser console for WebSocket connection status

### Issue 3: Time limit not working

**Cause:** Timezone or date calculation issues
**Solution:** Check server vs client timezone settings

## Quick Debug Commands

### Backend

```python
# In Django shell
from apps.messaging.models import Message
msg = Message.objects.get(id=YOUR_MESSAGE_ID)
print(f"Deletion type: {msg.deletion_type}")
print(f"Created at: {msg.created_at}")
```

### Frontend

```javascript
// In browser console
// Check WebSocket connection
console.log(window.webSocketConnection)

// Check current conversation state
console.log(window.conversationState)
```

## Files Modified

### Backend

- `backend/apps/messaging/views.py` - Enhanced destroy method
- `backend/apps/messaging/signals.py` - Added real-time notifications
- `backend/apps/messaging/consumers.py` - Added message_deleted handler
- `backend/apps/messaging/serializers.py` - Fixed message filtering

### Frontend

- `frontend/src/components/messaging/ChatPage.tsx` - Enhanced delete handling
- `frontend/src/components/messaging/MessageBubble.tsx` - Updated UI and validation
- `frontend/src/hooks/useWebSocket.ts` - Added deletion event support
