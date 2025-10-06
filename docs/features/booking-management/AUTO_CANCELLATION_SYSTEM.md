# Expired Booking Auto-Cancellation System

## Overview

This document explains the automated booking cancellation system that handles bookings after their scheduled date has passed without action from either the customer or service provider.

## Problem Statement

When a booking reaches its scheduled date and time without action from either the customer or provider (no completion, no cancellation), it remains in a "pending" or "confirmed" state indefinitely. This creates several issues:

1. Inaccurate data about service completion rates
2. Cluttered booking history for users
3. Confusion for both customers and providers
4. Difficulty in analyzing service performance

## Solution

The auto-cancellation system automatically handles bookings that have passed their scheduled date by:

1. Identifying bookings that have passed their date with no status updates
2. Applying a configurable grace period (default: 1 day)
3. Automatically transitioning these to "cancelled" status
4. Recording the cancellation reason as "expired"
5. Optionally sending notifications to both parties

## Implementation Details

### Components

1. **Management Command** (`auto_cancel_expired_bookings.py`):
   - Identifies expired bookings
   - Applies business logic and grace period
   - Updates booking statuses

2. **Django Crontab Configuration**:
   - Scheduled to run daily at 5:00 AM
   - Configurable grace period
   - Added to settings.py CRONJOBS list

### Configuration Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `grace_period` | 1 | Days to wait after booking date before auto-cancelling |
| `dry_run` | False | Run in simulation mode without making actual changes |

## How It Works

1. The cron job runs at 5:00 AM daily
2. It finds all bookings with status "pending" or "confirmed" where:
   - The booking date has passed
   - The current date is at least `grace_period` days after the booking date
3. For each booking:
   - Updates status to "cancelled"
   - Records reason as "expired - auto-cancelled"
   - Creates an audit log entry
   - Optionally sends notifications

## Testing and Verification

You can test the system by running:

```bash
# Dry run to see what would be cancelled without making changes
python manage.py auto_cancel_expired_bookings --dry-run

# Live run with custom grace period
python manage.py auto_cancel_expired_bookings --grace-period=2
```

## Monitoring

The auto-cancellation task logs detailed information to:

- Console output
- Application log file
- System monitoring dashboards (if configured)

## Recommended Settings

For most deployments, we recommend:

- Grace period: 1-2 days
- Daily execution at off-peak hours
- Notifications enabled for both parties

## Future Enhancements

Planned enhancements include:

- Customizable grace periods by service type
- Progressive notifications before auto-cancellation
- Integration with refund processing for paid bookings
- Analytics on auto-cancellation patterns
