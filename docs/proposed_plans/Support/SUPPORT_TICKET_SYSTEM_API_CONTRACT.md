# Support Ticket System API Contract

## Overview

This document defines the API endpoints, request/response formats, and data structures for the Support Ticket System in SewaBazaar.

## Authentication

All endpoints require authentication using the existing JWT token system. Include the Authorization header with Bearer token:

```bash
Authorization: Bearer <jwt_token>
```

## Rate Limiting

Endpoints are subject to rate limiting:

- 30 requests per minute for ticket creation
- 100 requests per minute for other operations

Rate limit headers included in responses:

- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets

## Error Response Format

All error responses follow this format:

```json
{
  "error": "error_code",
  "message": "Human readable error message",
  "details": {
    "field_name": ["error_description"]
  }
}
```

## Pagination

List endpoints support pagination with these query parameters:

- `page` (integer): Page number (default: 1)
- `page_size` (integer): Items per page (default: 10, max: 100)

Responses include pagination metadata:

```json
{
  "count": 100,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    // ... array of objects
  ]
}
```

## Filtering and Sorting

List endpoints support filtering and sorting:

- `status`: Filter by ticket status (open, in_progress, resolved, closed)
- `priority`: Filter by priority (low, medium, high, urgent)
- `category`: Filter by category (billing, technical, account, service, general)
- `ordering`: Sort field (prefix with `-` for descending)
  - `created_at` (default)
  - `updated_at`
  - `priority`

## Ticket Endpoints

### List Tickets

**GET** `/api/support/tickets/`

#### Query Parameters

- `status` (string, optional): Filter by status
- `priority` (string, optional): Filter by priority
- `category` (string, optional): Filter by category
- `page` (integer, optional): Page number
- `page_size` (integer, optional): Items per page
- `ordering` (string, optional): Sort field

#### Response

```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Issue with booking confirmation",
      "status": "open",
      "priority": "medium",
      "category": "booking",
      "last_message_snippet": "I haven't received confirmation for my booking...",
      "unread_count": 1,
      "created_at": "2023-05-15T10:30:00Z",
      "updated_at": "2023-05-15T14:22:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "title": "Payment processing error",
      "status": "resolved",
      "priority": "high",
      "category": "payment",
      "last_message_snippet": "Payment was processed but service wasn't booked...",
      "unread_count": 0,
      "created_at": "2023-05-10T09:15:00Z",
      "updated_at": "2023-05-12T16:45:00Z"
    }
  ]
}
```

### Create Ticket

**POST** `/api/support/tickets/`

#### Request Body

```json
{
  "title": "Issue with service booking",
  "category": "booking",
  "priority": "medium",
  "message_text": "I'm having trouble booking a service. The payment was processed but I didn't receive a confirmation."
}
```

#### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Issue with service booking",
  "customer": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "customer@example.com",
    "name": "John Doe"
  },
  "category": "booking",
  "status": "open",
  "priority": "medium",
  "assigned_agent": null,
  "created_at": "2023-05-15T10:30:00Z",
  "updated_at": "2023-05-15T10:30:00Z"
}
```

### Get Ticket Detail

**GET** `/api/support/tickets/{ticket_id}/`

#### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Issue with service booking",
  "customer": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "customer@example.com",
    "name": "John Doe"
  },
  "category": "booking",
  "status": "open",
  "priority": "medium",
  "assigned_agent": null,
  "created_at": "2023-05-15T10:30:00Z",
  "updated_at": "2023-05-15T14:22:00Z",
  "messages": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "sender": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "email": "customer@example.com",
        "name": "John Doe"
      },
      "message_text": "I'm having trouble booking a service. The payment was processed but I didn't receive a confirmation.",
      "created_at": "2023-05-15T10:30:00Z",
      "is_from_customer": true,
      "is_internal": false,
      "attachments": []
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440001",
      "sender": {
        "id": "999e4567-e89b-12d3-a456-426614174999",
        "email": "support@sewabazaar.com",
        "name": "Support Agent"
      },
      "message_text": "Thank you for contacting us. We're looking into your issue and will get back to you shortly.",
      "created_at": "2023-05-15T14:22:00Z",
      "is_from_customer": false,
      "is_internal": false,
      "attachments": []
    }
  ]
}
```

### Update Ticket

**PUT** `/api/support/tickets/{ticket_id}/`

#### Request Body (Staff only for some fields)

```json
{
  "status": "in_progress",
  "priority": "high",
  "assigned_agent": "999e4567-e89b-12d3-a456-426614174999"
}
```

#### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Issue with service booking",
  "customer": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "customer@example.com",
    "name": "John Doe"
  },
  "category": "booking",
  "status": "in_progress",
  "priority": "high",
  "assigned_agent": {
    "id": "999e4567-e89b-12d3-a456-426614174999",
    "email": "support@sewabazaar.com",
    "name": "Support Agent"
  },
  "created_at": "2023-05-15T10:30:00Z",
  "updated_at": "2023-05-15T15:00:00Z"
}
```

## Message Endpoints

### Create Message

**POST** `/api/support/tickets/{ticket_id}/messages/`

#### Request Body

```json
{
  "message_text": "I checked my email and still don't see the confirmation.",
  "is_internal": false
}
```

#### Response

```json
{
  "id": "990e8400-e29b-41d4-a716-446655440002",
  "sender": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "customer@example.com",
    "name": "John Doe"
  },
  "message_text": "I checked my email and still don't see the confirmation.",
  "created_at": "2023-05-15T16:30:00Z",
  "is_from_customer": true,
  "is_internal": false,
  "attachments": []
}
```

## Attachment Endpoints

### Upload Attachment

**POST** `/api/support/tickets/{ticket_id}/attachments/`

#### Request (multipart/form-data)

```bash
file: [file data]
```

#### Response

```json
{
  "id": "110e8400-e29b-41d4-a716-446655440003",
  "filename": "screenshot.png",
  "file_size": 102400,
  "content_type": "image/png",
  "created_at": "2023-05-15T16:35:00Z",
  "download_url": "https://storage.example.com/support/attachments/110e8400-e29b-41d4-a716-446655440003/screenshot.png"
}
```

## Staff-Only Endpoints

### Assign Ticket

**POST** `/api/support/tickets/{ticket_id}/assign/`

#### Request Body

```json
{
  "agent_id": "999e4567-e89b-12d3-a456-426614174999"
}
```

#### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Issue with service booking",
  "status": "in_progress",
  "priority": "medium",
  "assigned_agent": {
    "id": "999e4567-e89b-12d3-a456-426614174999",
    "email": "support@sewabazaar.com",
    "name": "Support Agent"
  },
  "updated_at": "2023-05-15T17:00:00Z"
}
```

### Escalate Ticket

**POST** `/api/support/tickets/{ticket_id}/escalate/`

#### Request Body

```json
{
  "reason": "Requires supervisor attention",
  "priority": "urgent"
}
```

#### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Issue with service booking",
  "status": "open",
  "priority": "urgent",
  "escalated": true,
  "updated_at": "2023-05-15T17:05:00Z"
}
```

## Data Models

### Ticket

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Unique identifier |
| title | String (255) | Yes | Ticket title |
| customer | ForeignKey (User) | Yes | Customer who created ticket |
| category | String | Yes | Category of issue |
| status | String | Yes | Current status |
| priority | String | Yes | Priority level |
| assigned_agent | ForeignKey (User) | No | Assigned support agent |
| created_at | DateTime | Yes | Creation timestamp |
| updated_at | DateTime | Yes | Last update timestamp |
| closed_at | DateTime | No | Closure timestamp |
| source | String | Yes | How ticket was created |
| tags | JSON | No | Tags for organization |

### Message

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Unique identifier |
| ticket | ForeignKey (Ticket) | Yes | Associated ticket |
| sender | ForeignKey (User) | Yes | Message sender |
| message_text | Text | Yes | Message content |
| created_at | DateTime | Yes | Creation timestamp |
| is_from_customer | Boolean | Yes | Whether from customer |
| is_internal | Boolean | Yes | Staff-only note |
| read_by_customer | Boolean | Yes | Read status for customer |
| read_by_staff | Boolean | Yes | Read status for staff |

### Attachment

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Unique identifier |
| ticket | ForeignKey (Ticket) | Yes | Associated ticket |
| message | ForeignKey (Message) | No | Associated message |
| uploaded_by | ForeignKey (User) | Yes | Uploader |
| file | FileField | Yes | File data |
| filename | String (255) | Yes | Original filename |
| file_size | Integer | Yes | File size in bytes |
| content_type | String (100) | Yes | MIME type |
| created_at | DateTime | Yes | Upload timestamp |

## Enum Values

### Ticket Status

- `open`
- `in_progress`
- `resolved`
- `closed`

### Ticket Priority

- `low`
- `medium`
- `high`
- `urgent`

### Ticket Category

- `billing`
- `technical`
- `account`
- `service`
- `general`

### Ticket Source

- `web`
- `mobile`
- `email`
- `phone`

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `ticket_not_found` | 404 | Ticket with given ID not found |
| `permission_denied` | 403 | User lacks permission for this action |
| `validation_error` | 400 | Request data failed validation |
| `file_too_large` | 400 | Uploaded file exceeds size limit |
| `invalid_file_type` | 400 | Uploaded file type not allowed |
| `rate_limit_exceeded` | 429 | Too many requests in timeframe |

This API contract provides a comprehensive specification for implementing the support ticket system backend, ensuring consistency and clear expectations for frontend integration.
