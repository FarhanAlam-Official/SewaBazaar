# SewaBazaar Backend Testing Guide

This directory contains comprehensive test files to verify that your SewaBazaar backend is working correctly.

## Test Files Overview

### 1. `simple_api_test.py` ⭐ **RECOMMENDED**
**Standalone test script that doesn't require Django setup**

```bash
# Run from backend directory
python simple_api_test.py

# Or with custom URL
python simple_api_test.py http://localhost:8000
```

**What it tests:**
- ✅ Server connectivity
- ✅ Services API endpoints
- ✅ Categories and Cities
- ✅ Booking endpoints (public parts)
- ✅ Authentication endpoints
- ✅ API documentation availability

### 2. `test_api_endpoints.py`
**Comprehensive Django-integrated test suite**

```bash
# Requires Django environment
python test_api_endpoints.py
```

**What it tests:**
- 🔍 Full API endpoint testing
- 🔐 Authentication flows
- 📊 Data integrity checks
- 🛠️ Business logic validation
- 📅 Complete booking workflow

### 3. Django Management Command
**Built-in Django testing command**

```bash
# Test database models and business logic
python manage.py test_backend

# Create test data
python manage.py test_backend --create-test-data

# Test API endpoints only
python manage.py test_backend --api-only
```

## Quick Start Testing

### Step 1: Start Your Backend Server
```bash
cd backend
python manage.py runserver
```

### Step 2: Run Simple Tests (Recommended)
```bash
# In another terminal, same backend directory
python simple_api_test.py
```

Expected output if everything is working:
```
🧪 SewaBazaar Backend API Test Suite
==================================================
🔍 Testing Server Connection...
✅ Server Status
   Backend server is running

🛠️ Testing Services API...
✅ Services List
   Found 5 services (total: 5)
✅ Service Detail
   Retrieved details for 'House Cleaning Service'

📋 Testing Categories and Cities...
✅ Categories
   Found 8 categories
✅ Cities
   Found 5 cities

📅 Testing Booking Endpoints...
✅ Payment Methods
   Found 3 payment methods
✅ Booking Slots
   Endpoint exists but requires valid service_id

🔐 Testing Authentication...
✅ Login Endpoint
   Login endpoint is working (rejected invalid credentials)

📚 Testing API Documentation...
✅ Swagger Docs
   Available at http://127.0.0.1:8000/swagger/
```

## What Each Test Checks

### Services Functionality (/services and /services/id)
- ✅ Can fetch services list
- ✅ Can get individual service details
- ✅ Categories and cities are populated
- ✅ Service data structure is correct

### Booking Functionality (/services/id/book)
- ✅ Booking endpoints exist
- ✅ Payment methods are configured
- ✅ Time slots system is available
- ✅ Authentication is working

## Troubleshooting Common Issues

### ❌ "Cannot connect to server"
**Solution:** Start the Django server
```bash
cd backend
python manage.py runserver
```

### ❌ "No services found"
**Solution:** Populate sample data
```bash
python manage.py populate_sample_data
# or
python manage.py test_backend --create-test-data
```

### ❌ "Database errors"
**Solution:** Run migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### ❌ "Authentication errors"
**Solution:** Create test users
```bash
python manage.py createsuperuser
# or use the test command to create test users
python manage.py test_backend --create-test-data
```

## Test Results Interpretation

### 🎉 All Tests Pass
Your backend is fully functional! Both `/services` and `/services/id/book` should work perfectly.

### ⚠️ Some Tests Pass
Your backend is partially functional:
- Services may work but booking might have issues
- Check which specific tests failed

### ❌ Most Tests Fail
Common issues:
1. Server not running
2. Database not migrated
3. No sample data
4. Missing dependencies

## Advanced Testing

### Run Full Django Test Suite
```bash
python manage.py test apps.services apps.bookings apps.accounts apps.reviews --verbosity=2
```

### Test Specific Components
```bash
# Test only services
python manage.py test apps.services

# Test only bookings
python manage.py test apps.bookings
```

### Load Testing (Optional)
```bash
# Install dependencies first
pip install locust

# Run load tests (if available)
locust -f locustfile.py
```

## API Documentation

Once your server is running, visit:
- **Swagger UI**: http://127.0.0.1:8000/swagger/
- **ReDoc**: http://127.0.0.1:8000/redoc/

## Getting Help

If tests fail:
1. Check the console output for specific error messages
2. Verify server is running on the correct port
3. Ensure database is properly migrated
4. Check if sample data exists
5. Review Django logs for detailed error information

## Frontend Integration Testing

After backend tests pass, test frontend integration:
1. Start backend: `python manage.py runserver`
2. Start frontend: `npm run dev` (in frontend directory)
3. Visit: http://localhost:3000/services
4. Try booking a service

The frontend should now connect to real backend data instead of using mock data.