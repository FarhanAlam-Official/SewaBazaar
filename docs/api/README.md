# SewaBazaar API Documentation

## Overview

The SewaBazaar API is a comprehensive REST API that powers Nepal's premier local services marketplace. Built with Django REST Framework, it provides robust endpoints for service management, bookings, messaging, rewards, reviews, notifications, and user management.

## Base Configuration

- **Base URL:** `http://localhost:8000/api/` (Development)
- **Production URL:** `https://api.sewabazaar.com/api/` (Production)
- **API Version:** v1
- **Authentication:** JWT Bearer tokens
- **Content-Type:** `application/json`
- **Documentation:** Available at `/swagger/` and `/redoc/`

## Authentication

### JWT Token Authentication

The API uses JWT (JSON Web Token) authentication with access and refresh tokens.

#### Login

```bash
POST /api/auth/login/
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "password123"
}
```

**Response:**

```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "user_type": "customer"
    }
}
```

#### Using Authentication

Include the access token in the Authorization header:

```bash
# Include in request headers
Authorization: Bearer <access_token>
```

### Token Refresh

```bash
POST /api/auth/refresh/
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## Provider Earnings Endpoints

### Earnings Summary

```bash
GET /api/bookings/provider_dashboard/earnings/
```

**Query Parameters:**

- `require_paid` (boolean): Filter for paid bookings only (default: true)
- `period` (string): Time period filter ('month', 'week', 'day')

**Response:**

```json
{
  "total_earnings": 45000.0,
  "pending_earnings": 12000.0,
  "this_month": 15000.0,
  "platform_fee_rate": 0.1,
  "completed_bookings": 156,
  "trends": {
    "last_6_months": [
      { "month": "2024-09", "earnings": 12000.0 },
      { "month": "2024-10", "earnings": 15000.0 }
    ]
  }
}
```

### Earnings Analytics

```bash
GET /api/bookings/provider_dashboard/analytics/
```

**Response:**

```json
{
  "revenue_breakdown": {
    "gross_revenue": 50000.0,
    "platform_fees": 5000.0,
    "net_earnings": 45000.0
  },
  "booking_statistics": {
    "total_bookings": 200,
    "completed_rate": 0.85,
    "average_booking_value": 250.0
  }
}
```

## Booking Management Endpoints

### List Bookings

```bash
GET /api/bookings/
```

**Query Parameters:**

- `status` (string): Filter by status ('pending', 'confirmed', 'completed', 'cancelled')
- `date_from` (date): Start date filter (YYYY-MM-DD)
- `date_to` (date): End date filter (YYYY-MM-DD)
- `page` (integer): Page number for pagination
- `page_size` (integer): Number of items per page

### Create Booking

```bash
POST /api/bookings/
{
    "service_id": 123,
    "provider_id": 456,
    "booking_date": "2024-12-25T14:30:00Z",
    "notes": "Special requirements...",
    "customer_address": "123 Main St, Kathmandu"
}
```

### Update Booking Status

```bash
PUT /api/bookings/{booking_id}/
{
    "status": "confirmed",
    "provider_notes": "Confirmed for scheduled time"
}
```

### Auto-Cancel Expired Bookings

```bash
POST /api/admin/bookings/auto-cancel/
{
    "grace_period_hours": 24,
    "dry_run": false
}
```

## Rewards System Endpoints

### User Reward Account

```bash
GET /api/rewards/account/
```

**Response:**

```json
{
  "points_balance": 2500,
  "tier": "gold",
  "lifetime_points": 15000,
  "next_tier_threshold": 20000,
  "vouchers_available": 3
}
```

### Points Transactions

```bash
GET /api/rewards/transactions/
```

**Response:**

```json
{
  "results": [
    {
      "id": 123,
      "transaction_type": "earned",
      "points": 250,
      "description": "Booking completion bonus",
      "created_at": "2024-10-06T10:30:00Z"
    }
  ]
}
```

### Redeem Voucher

```bash
POST /api/rewards/vouchers/redeem/
{
    "voucher_code": "SAVE100",
    "booking_id": 789
}
```

## Provider Customer Management

### List Provider Customers

```bash
GET /api/provider/customers/
```

**Query Parameters:**

- `search` (string): Search by name, email, or phone
- `status` (string): Filter by customer status
- `sort_by` (string): Sort field ('name', 'bookings', 'spending', 'last_booking')
- `order` (string): Sort order ('asc', 'desc')

**Response:**

```json
{
  "results": [
    {
      "id": 123,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+977-9841234567",
      "total_bookings": 15,
      "total_spent": 12500.0,
      "last_booking_date": "2024-10-01T00:00:00Z",
      "status": "regular",
      "is_favorite": true
    }
  ]
}
```

### Customer Details

```bash
GET /api/provider/customers/{customer_id}/
```

### Add Customer Note

```bash
POST /api/provider/customers/{customer_id}/note/
{
    "note": "Preferred morning appointments",
    "is_important": true
}
```

### Toggle Favorite Customer

```bash
POST /api/provider/customers/{customer_id}/favorite/
{
    "is_favorite": true
}
```

## Voucher System Endpoints

### List User Vouchers

```bash
GET /api/rewards/vouchers/
```

**Query Parameters:**

- `status` (string): Filter by status ('available', 'used', 'expired')
- `denomination` (integer): Filter by voucher value

### Apply Voucher to Booking

```bash
POST /api/rewards/vouchers/{voucher_id}/apply/
{
    "booking_id": 789,
    "confirm_usage": true
}
```

### Get Voucher QR Code

```bash
GET /api/rewards/vouchers/{voucher_id}/qr/
```

**Response:**

```json
{
  "qr_code_url": "data:image/png;base64,iVBORw0KGgoAAAANSU...",
  "voucher_code": "SAVE100-ABC123",
  "expiry_date": "2025-01-01T00:00:00Z"
}
```

## Error Handling

### Standard Error Response

```json
{
  "error": "validation_error",
  "message": "Invalid input data provided",
  "details": {
    "field_name": ["This field is required"]
  },
  "status_code": 400
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

## Rate Limiting

- **Authentication Endpoints:** 5 requests per minute
- **Data Retrieval:** 100 requests per minute
- **Data Modification:** 50 requests per minute
- **File Uploads:** 10 requests per minute

## Pagination

### Standard Pagination Response

```json
{
    "count": 150,
    "next": "https://api.sewabazaar.com/api/bookings/?page=3",
    "previous": "https://api.sewabazaar.com/api/bookings/?page=1",
    "results": [...]
}
```

### Pagination Parameters

- `page` - Page number (default: 1)
- `page_size` - Items per page (default: 20, max: 100)

## WebSocket Endpoints

### Real-time Notifications

```bash
wss://api.sewabazaar.com/ws/notifications/
```

**Connection Headers:**

```bash
Authorization: Bearer <access_token>
```

**Message Types:**

- `booking_update` - Booking status changes
- `payment_confirmation` - Payment processing updates
- `reward_earned` - Points awarded notifications
- `system_message` - System announcements

## User Management Extensions

### Customer Profile Extensions

#### Update Customer Preferences

```bash
PATCH /api/customers/me/preferences/
{
    "preferred_categories": [1, 2, 3],
    "notification_preferences": {
        "email_notifications": true,
        "sms_notifications": false,
        "push_notifications": true
    },
    "booking_preferences": {
        "auto_confirm": false,
        "preferred_time_slots": ["morning", "afternoon"]
    }
}
```

#### Customer Activity Timeline

```bash
GET /api/customers/me/activity/
```

**Response:**

```json
{
    "activities": [
        {
            "id": 123,
            "activity_type": "booking_created",
            "title": "New booking created",
            "description": "House cleaning service booked",
            "timestamp": "2025-10-06T10:30:00Z",
            "related_booking": 789
        }
    ]
}
```

### Provider Management Extensions

#### Provider Verification Status

```bash
GET /api/providers/me/verification/
```

**Response:**

```json
{
    "verification_status": "verified",
    "documents": {
        "business_license": "approved",
        "insurance_certificate": "approved",
        "identity_document": "approved"
    },
    "verification_date": "2025-09-15T00:00:00Z",
    "next_renewal_date": "2026-09-15T00:00:00Z"
}
```

#### Submit Verification Documents

```bash
POST /api/providers/me/verification/documents/
Content-Type: multipart/form-data

business_license: [file]
insurance_certificate: [file]
identity_document: [file]
```

## Service Management Extensions

### Service Categories with Subcategories

```bash
GET /api/categories/tree/
```

**Response:**

```json
{
    "categories": [
        {
            "id": 1,
            "name": "Cleaning Services",
            "subcategories": [
                {
                    "id": 101,
                    "name": "House Cleaning",
                    "service_count": 25
                },
                {
                    "id": 102,
                    "name": "Office Cleaning",
                    "service_count": 15
                }
            ]
        }
    ]
}
```

### Advanced Service Search

```bash
GET /api/services/search/
```

**Query Parameters:**

- `q` (string): Search query
- `category` (int): Category filter
- `location` (string): Location filter
- `price_range` (string): Price range (e.g., "100-500")
- `rating_min` (decimal): Minimum rating
- `available_date` (date): Availability check
- `sort` (string): Sort by (rating, price, distance, popularity)

### Service Availability Check

```bash
POST /api/services/{service_id}/availability/
{
    "date": "2025-10-15",
    "duration": 120
}
```

**Response:**

```json
{
    "available": true,
    "time_slots": [
        {
            "start_time": "09:00",
            "end_time": "11:00",
            "available": true
        },
        {
            "start_time": "14:00",
            "end_time": "16:00",
            "available": true
        }
    ]
}
```

## Messaging System Extensions

### Message Encryption Status

```bash
GET /api/conversations/{conversation_id}/encryption/
```

**Response:**

```json
{
    "encryption_enabled": true,
    "encryption_type": "AES-256",
    "key_rotation_date": "2025-10-01T00:00:00Z"
}
```

### Message Search

```bash
GET /api/conversations/{conversation_id}/messages/search/?q=appointment
```

### Conversation Archive

```bash
POST /api/conversations/{conversation_id}/archive/
{
    "archive": true
}
```

### Message Reactions

```bash
POST /api/messages/{message_id}/react/
{
    "reaction": "👍"
}
```

## Reviews System Extensions

### Review Analytics for Providers

```bash
GET /api/providers/me/reviews/analytics/
```

**Response:**

```json
{
    "overall_rating": 4.7,
    "total_reviews": 45,
    "rating_trends": [
        {
            "month": "2025-09",
            "average_rating": 4.6,
            "review_count": 8
        }
    ],
    "improvement_areas": ["timeliness", "value"],
    "top_keywords": ["professional", "thorough", "reliable"]
}
```

### Review Response by Provider

```bash
POST /api/reviews/{review_id}/respond/
{
    "response": "Thank you for your feedback! We're glad you were satisfied."
}
```

### Review Helpfulness Voting

```bash
POST /api/reviews/{review_id}/helpful/
{
    "is_helpful": true
}
```

### Featured Reviews

```bash
GET /api/reviews/featured/
```

## Notifications System Extensions

### Real-time Notification Delivery

```bash
GET /api/notifications/realtime/
```

**WebSocket Connection:**

```javascript
const notificationSocket = new WebSocket(
    'ws://localhost:8000/ws/notifications/',
    [],
    { headers: { 'Authorization': 'Bearer ' + token } }
);
```

### Notification Templates

```bash
GET /api/notifications/templates/
```

### Bulk Notification Operations

```bash
POST /api/notifications/bulk/mark_read/
{
    "notification_ids": [1, 2, 3, 4, 5]
}
```

### Notification Analytics

```bash
GET /api/notifications/analytics/
```

**Response:**

```json
{
    "total_sent": 1250,
    "delivery_rate": 0.95,
    "read_rate": 0.78,
    "channel_performance": {
        "in_app": 0.85,
        "email": 0.65,
        "sms": 0.90
    }
}
```

## Rewards System Extensions

### Tier-based Benefits

```bash
GET /api/rewards/tiers/
```

**Response:**

```json
{
    "tiers": [
        {
            "name": "bronze",
            "threshold": 0,
            "benefits": ["Basic support", "Standard rewards"],
            "point_multiplier": 1.0
        },
        {
            "name": "silver", 
            "threshold": 1000,
            "benefits": ["Priority support", "Bonus rewards"],
            "point_multiplier": 1.2
        }
    ]
}
```

### Referral System

```bash
POST /api/rewards/referrals/
{
    "referred_email": "friend@example.com",
    "referral_message": "Join SewaBazaar for quality services!"
}
```

**Response:**

```json
{
    "referral_code": "REF-ABC123",
    "reward_points": 200,
    "referral_link": "https://sewabazaar.com/join?ref=REF-ABC123"
}
```

### Points Transfer

```bash
POST /api/rewards/points/transfer/
{
    "recipient_user_id": 456,
    "points": 100,
    "message": "Gift for excellent service"
}
```

## Payment System Extensions

### Multi-currency Support

```bash
GET /api/payments/currencies/
```

**Response:**

```json
{
    "supported_currencies": ["NPR", "USD", "INR"],
    "exchange_rates": {
        "USD_TO_NPR": 133.50,
        "INR_TO_NPR": 1.60
    }
}
```

### Payment Method Management

```bash
GET /api/payments/methods/
```

**Response:**

```json
{
    "payment_methods": [
        {
            "id": 1,
            "type": "esewa",
            "display_name": "eSewa (9841******67)",
            "is_default": true
        },
        {
            "id": 2,
            "type": "khalti",
            "display_name": "Khalti (9851******89)",
            "is_default": false
        }
    ]
}
```

### Payment History

```bash
GET /api/payments/history/
```

### Refund Processing

```bash
POST /api/payments/{payment_id}/refund/
{
    "amount": 500.00,
    "reason": "Service cancellation",
    "refund_method": "original"
}
```

## Administrative Extensions

### System Health Monitoring

```bash
GET /api/admin/health/
```

**Response:**

```json
{
    "status": "healthy",
    "database": "connected",
    "redis": "connected",
    "external_services": {
        "esewa": "operational",
        "khalti": "operational",
        "email_service": "operational"
    },
    "response_time": 45
}
```

### User Analytics Dashboard

```bash
GET /api/admin/analytics/users/
```

**Response:**

```json
{
    "total_users": 15000,
    "active_users": 8500,
    "new_registrations": {
        "this_month": 450,
        "last_month": 380
    },
    "user_distribution": {
        "customers": 12000,
        "providers": 3000
    }
}
```

### Content Moderation

```bash
GET /api/admin/moderation/reports/
```

```bash
POST /api/admin/moderation/reviews/{review_id}/action/
{
    "action": "approve", // "reject", "flag", "approve"
    "reason": "Content meets community guidelines"
}
```

### Bulk Operations

```bash
POST /api/admin/users/bulk/verify/
{
    "user_ids": [1, 2, 3, 4, 5],
    "verification_status": "verified"
}
```

## File Management Extensions

### File Upload with Progress Tracking

```bash
POST /api/files/upload/
Content-Type: multipart/form-data

file: [file]
upload_type: "service_image" // "avatar", "document", "message_attachment"
```

**Response:**

```json
{
    "file_id": "file_abc123",
    "url": "https://cdn.sewabazaar.com/files/abc123.jpg",
    "size": 1024000,
    "mime_type": "image/jpeg",
    "upload_progress": 100
}
```

### File Processing Status

```bash
GET /api/files/{file_id}/status/
```

## Analytics & Reporting Extensions

### Business Intelligence Dashboard

```bash
GET /api/analytics/dashboard/
```

**Response:**

```json
{
    "revenue": {
        "total": 2500000.00,
        "this_month": 350000.00,
        "growth_rate": 0.15
    },
    "bookings": {
        "total": 5000,
        "completed": 4200,
        "completion_rate": 0.84
    },
    "user_engagement": {
        "daily_active": 1200,
        "weekly_active": 4500,
        "monthly_active": 12000
    }
}
```

### Custom Report Generation

```bash
POST /api/analytics/reports/generate/
{
    "report_type": "revenue_analysis",
    "date_range": {
        "start": "2025-01-01",
        "end": "2025-10-31"
    },
    "filters": {
        "categories": [1, 2, 3],
        "locations": ["Kathmandu", "Pokhara"]
    }
}
```

### Export Data

```bash
GET /api/analytics/export/?format=csv&type=bookings&period=last_month
```

## Webhook System

### Webhook Configuration

```bash
POST /api/webhooks/
{
    "url": "https://yourapp.com/webhooks/sewabazaar",
    "events": ["booking.confirmed", "payment.completed", "review.created"],
    "secret": "your_webhook_secret"
}
```

### Webhook Events

Available webhook events:

- `booking.created`
- `booking.confirmed`
- `booking.completed`
- `booking.cancelled`
- `payment.completed`
- `payment.failed`
- `review.created`
- `user.verified`
- `service.activated`

### Webhook Delivery Status

```bash
GET /api/webhooks/{webhook_id}/deliveries/
```

## Testing & Development

### Test Environment Endpoints

```bash
# Reset test database
POST /api/test/reset/
{
    "confirm": true
}

# Generate test data
POST /api/test/seed/
{
    "users": 100,
    "services": 50,
    "bookings": 200
}
```

### API Health Check

```bash
GET /api/health/
```

**Response:**

```json
{
    "status": "ok",
    "version": "2.1.0",
    "environment": "production",
    "uptime": 8640000,
    "timestamp": "2025-10-06T12:00:00Z"
}
```

## Related Documentation

- [Authentication Guide](./AUTHENTICATION.md)
- [WebSocket Integration](./WEBSOCKET_INTEGRATION.md)
- [Payment Gateway Setup](./PAYMENT_GATEWAY_SETUP.md)
- [Webhook Configuration](./WEBHOOK_CONFIGURATION.md)
- [SDK Documentation](./SDK_DOCUMENTATION.md)
- [Postman Collection](./postman/SewaBazaar_API_Collection.json)
- [Rate Limiting Guide](./RATE_LIMITING.md)
- [Error Code Reference](./ERROR_CODES.md)
- [Deployment Guide](./DEPLOYMENT.md)
