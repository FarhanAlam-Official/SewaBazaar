# Booking Management System Documentation

## Overview

The SewaBazaar Booking Management System handles the complete lifecycle of service bookings, from initial creation through completion, including automated processes for expired bookings.

## Core Features

### Auto-Cancellation System ✅

#### Purpose

Automatically handles bookings that have passed their scheduled date without action from either customer or service provider.

#### Problem Solved

- Prevents indefinitely pending bookings
- Maintains accurate completion rate data
- Reduces clutter in booking histories
- Improves service performance analytics

#### Implementation Details

**Management Command:** `auto_cancel_expired_bookings.py`

- **Grace Period:** Configurable (default: 1 day after scheduled date)
- **Status Transition:** Automatically moves to "cancelled" status
- **Cancellation Reason:** Records as "expired"
- **Notifications:** Optional notifications to both parties

#### Configuration

```python
# Settings for auto-cancellation
AUTO_CANCEL_GRACE_PERIOD = 24  # hours
AUTO_CANCEL_ENABLED = True
AUTO_CANCEL_NOTIFICATION = True
```

#### Scheduling

```bash
# Cron job example (daily at 2 AM)
0 2 * * * python manage.py auto_cancel_expired_bookings

# Or using Django-Q/Celery for scheduled tasks
```

### Booking Status Lifecycle

#### Status Flow

1. **Created** → Initial booking request
2. **Pending** → Awaiting provider confirmation
3. **Confirmed** → Provider accepted booking
4. **Service Delivered** → Service completed by provider
5. **Awaiting Confirmation** → Customer needs to confirm completion
6. **Completed** → Final status, payment processed
7. **Cancelled** → Booking cancelled (manual or automatic)

#### Auto-Cancellation Triggers

- Booking date + grace period exceeded
- No status updates from either party
- Booking stuck in pending/confirmed state
- System maintenance cleanup

### Customer Dashboard Integration

#### Integration Status: 65% Complete

**Current Implementation:**

- Mixed data sources (mock + real API)
- Critical API endpoint issues identified and fixed
- Enhanced error handling implemented
- Ready for Phase 2 implementation

**Architecture:**

- **Frontend:** React 18 + Next.js 14 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** React hooks + Context API
- **API Client:** Axios with interceptors
- **Authentication:** JWT tokens with refresh mechanism

**Backend Integration:**

- **Framework:** Django 4.2 + Django REST Framework
- **Database:** PostgreSQL with Supabase
- **Authentication:** JWT with role-based access control
- **Architecture:** Modular Django apps structure

## API Endpoints

### Core Booking APIs

```bash
GET /api/bookings/                        # List user bookings
POST /api/bookings/                       # Create new booking
GET /api/bookings/{id}/                   # Get booking details
PUT /api/bookings/{id}/                   # Update booking
DELETE /api/bookings/{id}/                # Cancel booking
POST /api/bookings/{id}/confirm/          # Confirm service delivery
POST /api/bookings/{id}/complete/         # Mark as completed
```

### Provider Booking APIs

```bash
GET /api/bookings/provider/               # List provider bookings
POST /api/bookings/{id}/accept/           # Accept booking request
POST /api/bookings/{id}/deliver/          # Mark service as delivered
GET /api/bookings/provider/calendar/      # Get provider calendar
```

### Administrative APIs

```bash
POST /api/admin/bookings/auto-cancel/     # Manual trigger auto-cancel
GET /api/admin/bookings/expired/          # List expired bookings
GET /api/admin/bookings/analytics/        # Booking analytics
```

## Database Schema

### Core Models

#### Booking Model

```python
class Booking(models.Model):
    customer = models.ForeignKey(User, on_delete=models.CASCADE)
    provider = models.ForeignKey(User, on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    
    booking_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    cancellation_reason = models.CharField(max_length=100, blank=True)
    auto_cancelled = models.BooleanField(default=False)
```

#### Payment Integration

```python
class Payment(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES)
    payment_method = models.CharField(max_length=50)
    processed_at = models.DateTimeField(null=True, blank=True)
```

## Business Rules

### Auto-Cancellation Rules

1. **Eligibility Criteria:**
   - Booking date has passed
   - Status is "pending" or "confirmed"
   - Grace period has expired
   - No recent status updates

2. **Grace Period Logic:**
   - Default: 24 hours after scheduled booking time
   - Configurable per service category
   - Weekend and holiday adjustments available

3. **Notification Rules:**
   - Send notification to both customer and provider
   - Include cancellation reason and next steps
   - Option to reschedule or rebook

### Completion Requirements

1. **Provider Actions:**
   - Mark service as delivered
   - Upload completion photos (if required)
   - Add service notes and recommendations

2. **Customer Actions:**
   - Confirm service completion
   - Rate and review service
   - Process payment (if not pre-paid)

## Error Handling

### Common Scenarios

- **Network Timeouts:** Retry logic with exponential backoff
- **Payment Failures:** Automatic retry and fallback options
- **Provider Unavailability:** Automatic rebooking suggestions
- **System Maintenance:** Graceful degradation and user notifications

### Recovery Mechanisms

- **Data Consistency:** Transaction-based operations
- **State Recovery:** Automatic status reconciliation
- **Audit Trail:** Complete booking lifecycle logging
- **Manual Override:** Admin tools for edge cases

## Performance Considerations

### Database Optimization

- **Indexes:** Optimized for common query patterns
- **Partitioning:** Date-based partitioning for large datasets
- **Caching:** Redis caching for frequently accessed data
- **Connection Pooling:** Optimized database connections

### API Performance

- **Pagination:** Efficient pagination for booking lists
- **Filtering:** Optimized filtering with database indexes
- **Batch Operations:** Bulk operations for administrative tasks
- **Rate Limiting:** API rate limiting to prevent abuse

## Monitoring and Analytics

### Key Metrics

- **Completion Rate:** Percentage of bookings completed successfully
- **Auto-Cancellation Rate:** Percentage of bookings auto-cancelled
- **Average Booking Value:** Revenue analytics
- **Response Time:** Provider response times to booking requests

### Dashboard Integration

- Real-time booking status updates
- Provider performance metrics
- Customer satisfaction scores
- Revenue and financial analytics

## Related Documentation

- [Provider Management](../provider-management/README.md)
- [Customer Dashboard](../customer-dashboard/README.md)
- [Payment System](../payment-system/README.md)
- [API Reference](../../api/bookings.md)
