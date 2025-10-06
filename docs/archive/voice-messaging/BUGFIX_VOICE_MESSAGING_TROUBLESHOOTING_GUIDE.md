# Voice Message Error Troubleshooting Guide

## 🔍 Current Errors Analysis

Based on the error logs you provided, here are the specific issues and solutions:

### Error 1: 401 Unauthorized

**Issue**: Authentication token is invalid or expired
**Solutions**:

1. Check if user is properly logged in
2. Verify token exists in cookies
3. Check token expiration
4. Re-authenticate if needed

### Error 2: 400 Bad Request  

**Issue**: Request format is invalid
**Solutions**:

1. Verify FormData structure matches backend expectations
2. Check conversation ID is valid
3. Ensure file format is supported
4. Validate required fields are present

### Error 3: Audio Playback Error

**Issue**: Browser cannot play recorded audio
**Solutions**:

1. Check audio format compatibility
2. Verify blob URL creation
3. Ensure proper error handling
4. Add fallback options

## 🛠️ Debug Steps

### Step 1: Check Authentication

Open browser console and run:

```javascript
// Check if access token exists
console.log('Token:', document.cookie.includes('access_token'))

// Check token value (masked)
const token = document.cookie.match(/access_token=([^;]+)/)?.[1]
console.log('Token exists:', !!token)
console.log('Token length:', token?.length || 0)
```

### Step 2: Test API Endpoint

```javascript
// Test basic message endpoint
fetch('/api/messaging/messages/', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => console.log('API Status:', r.status))
```

### Step 3: Check Conversation Access

```javascript
// Verify conversation exists and user has access
const conversationId = 1 // Replace with actual ID
fetch(`/api/messaging/conversations/${conversationId}/`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(data => console.log('Conversation:', data))
```

### Step 4: Test File Upload Format

```javascript
// Test FormData structure
const formData = new FormData()
formData.append('text', 'Test voice message')  
formData.append('conversation', '1')
formData.append('attachment', new Blob(['test']), 'test.webm')

for (const [key, value] of formData.entries()) {
  console.log(`${key}:`, value)
}
```

## 🔧 Enhanced Error Handling

The voice message system has been updated with better error handling:

### Authentication Validation

- Pre-validates token exists before sending
- Shows clear error message for missing auth
- Logs authentication details for debugging

### Request Debugging  

- Logs all FormData contents before sending
- Shows detailed request information
- Captures response headers and status

### Audio Error Recovery

- Improves audio playback error handling
- Shows user-friendly error messages  
- Allows sending even if preview fails

## 🚀 Quick Fixes to Try

### Fix 1: Re-authenticate

```bash
# Log out and log back in to refresh token
# Check your login page or authentication flow
```

### Fix 2: Check Backend API

```bash
# Verify Django server is running
cd backend
python manage.py runserver

# Check messaging app is installed in INSTALLED_APPS
# Verify URL routing includes messaging URLs
```

### Fix 3: Test Audio Recording

```javascript
// Test browser audio support
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('✅ Microphone access granted')
    stream.getTracks().forEach(track => track.stop())
  })
  .catch(err => console.error('❌ Microphone error:', err))
```

### Fix 4: Check Network

```bash
# Verify API endpoint is accessible
curl -X GET http://localhost:8000/api/messaging/health/

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -X GET http://localhost:8000/api/messaging/messages/
```

## 🔍 Debugging Console Commands

### Check Current State

```javascript
// In browser console on chat page
console.log('Current user:', window.currentUser)
console.log('Conversation ID:', window.conversationId)  
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)
```

### Test Voice Recording

```javascript
// Test MediaRecorder support
console.log('MediaRecorder supported:', 'MediaRecorder' in window)
console.log('WebM support:', MediaRecorder.isTypeSupported('audio/webm'))
console.log('MP4 support:', MediaRecorder.isTypeSupported('audio/mp4'))
```

### Validate Token

```javascript
// Check token format and validity
const token = document.cookie.match(/access_token=([^;]+)/)?.[1]
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    console.log('Token payload:', payload)
    console.log('Token expires:', new Date(payload.exp * 1000))
  } catch (e) {
    console.log('Token format:', typeof token, token.length)
  }
}
```

## 📋 Checklist for Resolution

- [ ] User is properly authenticated  
- [ ] Django backend server is running
- [ ] Messaging URLs are properly configured
- [ ] Conversation exists and user has access
- [ ] Browser supports MediaRecorder API
- [ ] Microphone permissions are granted
- [ ] Network connection is stable
- [ ] CORS settings allow file uploads
- [ ] File size is under backend limits (5MB)

## 🎯 Expected Behavior

After fixes, you should see:

1. **Successful authentication** - No 401 errors
2. **Proper request format** - No 400 errors  
3. **Working audio preview** - No playback errors
4. **Real-time delivery** - Messages appear instantly
5. **Status updates** - Read/delivered confirmations

## 📞 Next Steps

1. **Run the debug commands** above to identify specific issues
2. **Check authentication flow** - ensure login creates proper tokens
3. **Verify API endpoints** - test messaging API manually
4. **Test audio recording** - validate browser capabilities
5. **Check network connectivity** - ensure backend is accessible

The enhanced error handling will provide more specific information about what's failing. Check the browser console for the detailed debug logs after trying to send a voice message.
