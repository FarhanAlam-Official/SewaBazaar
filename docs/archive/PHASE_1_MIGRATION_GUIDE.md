# Phase 1 Migration Guide - Database Setup

## Overview

This guide provides step-by-step instructions for migrating the database to support Phase 1 features including the new booking system and Khalti payment integration.

## Prerequisites

- Django backend is set up and running
- Database is accessible (SQLite for development, PostgreSQL for production)
- Virtual environment is activated

## Migration Steps

### Step 1: Create and Apply Migrations

```bash
# Navigate to backend directory
cd backend

# Create migrations for the new models
python manage.py makemigrations bookings

# Apply the migrations
python manage.py migrate

# Verify migrations were applied
python manage.py showmigrations bookings
```

### Step 2: Create Default Payment Methods

Create a management command to populate default payment methods:

```bash
# Create the management command file
mkdir -p apps/bookings/management/commands

# Create the command (file content provided separately)
python manage.py create_default_payment_methods
```

### Step 3: Update Admin Interface

The admin interface has been updated to include the new models. Access it at:

```url
http://localhost:8000/admin/
```

New admin sections available:

- Payment Methods
- Booking Slots  
- Payments
- Enhanced Booking management

### Step 4: Verify Database Schema

Check that the following tables were created:

```sql
-- New tables
bookings_paymentmethod
bookings_bookingslot  
bookings_payment

-- Updated table (new columns added)
bookings_booking (with new Phase 1 fields)
```

### Step 5: Test API Endpoints

Verify the new API endpoints are working:

```bash
# Test payment methods endpoint
curl http://localhost:8000/api/payment-methods/

# Test booking slots endpoint  
curl http://localhost:8000/api/booking-slots/available-slots/?service_id=1&date=2024-02-01

# Test booking wizard endpoint
curl -X POST http://localhost:8000/api/booking-wizard/calculate-price/ \
  -H "Content-Type: application/json" \
  -d '{"service_id": 1}'
```

## Database Schema Changes

### New Models

#### PaymentMethod

- Stores available payment methods (Khalti, Cash, etc.)
- Configurable processing fees and gateway settings
- Active/inactive status management

#### BookingSlot  

- Manages time slot availability for services
- Prevents double bookings
- Supports group services with max booking limits

#### Payment

- Tracks payment transactions with Khalti integration
- Stores transaction IDs and gateway responses
- Links to bookings for payment history

### Extended Models

#### Booking (Enhanced)

New fields added with backward compatibility:

- `booking_step`: Track multi-step booking progress
- `booking_slot`: Link to time slot management
- `special_instructions`: Additional customer notes
- `estimated_duration`: Service duration tracking
- `preferred_provider_gender`: Customer preferences
- `is_recurring`: Support for recurring bookings
- `recurring_frequency`: Frequency for recurring services

## Data Migration Notes

### Existing Data Preservation

- All existing bookings remain unchanged
- New fields have safe default values
- No data loss during migration
- Existing API endpoints continue to work

### Default Values

- `booking_step`: 'completed' (existing bookings are considered complete)
- `preferred_provider_gender`: 'any'
- `is_recurring`: False
- All other new fields are nullable or have appropriate defaults

## Rollback Procedure

If you need to rollback the migration:

```bash
# Rollback to previous migration
python manage.py migrate bookings 0001_initial

# Or rollback all bookings migrations
python manage.py migrate bookings zero
```

**Warning**: Rolling back will remove all new Phase 1 data including payments and booking slots.

## Testing the Migration

### 1. Verify Existing Functionality

```bash
# Test existing booking creation still works
python manage.py test apps.bookings.tests.test_existing_functionality
```

### 2. Test New Features

```bash
# Test new Phase 1 features
python manage.py test apps.bookings.tests.test_phase1_features
```

### 3. Manual Testing Checklist

- [ ] Existing bookings display correctly in admin
- [ ] New booking wizard API endpoints respond
- [ ] Payment methods are populated
- [ ] Booking slots can be created and managed
- [ ] Khalti payment integration works in sandbox

## Troubleshooting

### Common Issues

#### Migration Conflicts

```bash
# If you encounter migration conflicts
python manage.py migrate --fake bookings 0001_initial
python manage.py migrate bookings
```

#### Missing Dependencies

```bash
# Install any missing packages
pip install -r requirements.txt
```

#### Permission Issues

```bash
# Ensure proper database permissions
# For SQLite, check file permissions
# For PostgreSQL, verify user permissions
```

### Error Messages

#### "Table already exists"

This usually means a partial migration occurred. Try:

```bash
python manage.py migrate --fake-initial
```

#### "Column does not exist"

This indicates the migration didn't complete. Re-run:

```bash
python manage.py migrate bookings --verbosity=2
```

## Production Deployment

### Pre-deployment Checklist

- [ ] Backup production database
- [ ] Test migration on staging environment
- [ ] Verify all existing functionality works
- [ ] Test new Phase 1 features
- [ ] Update environment variables for Khalti

### Deployment Steps

1. Put application in maintenance mode
2. Backup database
3. Apply migrations
4. Run management commands
5. Test critical functionality
6. Remove maintenance mode

### Post-deployment Verification

- [ ] All existing bookings are accessible
- [ ] New booking wizard works
- [ ] Payment methods are available
- [ ] Khalti integration functions in sandbox
- [ ] Admin interface shows new models

## Support

If you encounter issues during migration:

1. Check the logs in `backend/logs/sewabazaar.log`
2. Verify database connectivity
3. Ensure all environment variables are set
4. Test API endpoints individually
5. Check Django admin for data integrity

For additional support, refer to the main implementation documentation or create an issue in the project repository.
