# Khalti Payment Gateway Integration Guide

## Overview

SewaBazaar integrates with Khalti Payment Gateway to provide a secure, reliable digital payment solution for Nepali customers. This document provides a comprehensive guide to the integration, covering backend services, API endpoints, frontend components, and testing strategies.

## Table of Contents

1. [Integration Architecture](#integration-architecture)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [Configuration](#configuration)
5. [Payment Flow](#payment-flow)
6. [API Endpoints](#api-endpoints)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Integration Architecture

The Khalti integration follows a redirected payment flow using Khalti's e-Payment API v2:

1. **Initiation**: Backend initiates payment with Khalti API
2. **Redirection**: User is redirected to Khalti payment page
3. **Payment**: User completes payment on Khalti platform
4. **Callback**: Khalti redirects back to SewaBazaar with payment details
5. **Verification**: Backend verifies payment with Khalti and updates the booking status

![Khalti Payment Flow](../assets/khalti-flow-diagram.txt)

---

## Backend Implementation

### Core Service: `KhaltiPaymentService`

The primary implementation is in `backend/apps/bookings/services.py` class `KhaltiPaymentService`. This service handles:

- Payment initiation
- Payment verification
- Processing payment callbacks
- Updating booking records

Key methods:

```python
def initiate_payment(self, booking, return_url, website_url)
def lookup_payment(self, pidx)
def process_booking_payment_with_callback(self, booking_id, pidx, transaction_id, purchase_order_id, user)
```

### Backend Environment Variables

The backend requires the following environment variables:

```env
KHALTI_SECRET_KEY=your_secret_key
KHALTI_PUBLIC_KEY=your_public_key
KHALTI_BASE_URL=https://dev.khalti.com/api/v2  # For sandbox
# KHALTI_BASE_URL=https://khalti.com/api/v2  # For production
```

---

## Frontend Implementation

### Main Components

1. **KhaltiPayment Component**
   - Located at: `frontend/src/components/services/KhaltiPayment.tsx`
   - Handles initiating payments and showing payment status

2. **Payment Callback Page**
   - Located at: `frontend/src/app/payment/callback/page.tsx`
   - Processes callback from Khalti after payment completion
   - Verifies payment status with backend

### Frontend Environment Variables

The frontend requires the following environment variables:

```env
NEXT_PUBLIC_KHALTI_PUBLIC_KEY=your_public_key
NEXT_PUBLIC_KHALTI_ENVIRONMENT=development  # or production
NEXT_PUBLIC_KHALTI_BASE_URL=https://dev.khalti.com/api/v2
```

---

## Configuration

### Sandbox vs Production

The integration supports both sandbox (testing) and production environments:

**Sandbox**:

- Base URL: `https://dev.khalti.com/api/v2`
- Default test public key: `8b58c9047e584751beaddea7cc632b2c`
- Default test secret key: `2d71118e5d26404fb3b1fe1fd386d33a`

**Production**:

- Base URL: `https://khalti.com/api/v2`
- Requires real API keys from Khalti merchant dashboard

### Switching Environments

To switch environments:

1. Update environment variables in `.env.local` (frontend) and `.env` (backend)
2. Update API base URLs in both environments
3. Run tests to verify the configuration

---

## Payment Flow

### 1. Initiate Payment

When a user clicks "Pay with Khalti":

```javascript
// Frontend code snippet
const initiateKhaltiPayment = async () => {
  setPaymentState({ status: 'initiating', message: 'Initiating payment...' });
  
  try {
    const requestPayload = {
      booking_id: booking.id,
      return_url: `${window.location.origin}/payment/callback`,
      website_url: window.location.origin
    };
    
    const response = await api.post('/bookings/payments/initiate_khalti_payment/', requestPayload);
    
    if (response.data && response.data.success) {
      setPaymentState({ status: 'redirecting', message: 'Redirecting to Khalti...' });
      
      // Redirect to Khalti payment page
      window.location.href = response.data.data.payment_url;
    } else {
      throw new Error(response.data?.error || 'Payment initiation failed');
    }
  } catch (error) {
    // Error handling
  }
};
```

### 2. Process Callback

After payment, Khalti redirects to the callback URL with parameters:

```javascript
// Frontend callback processing
const processPayment = async (bookingId, pidx, transactionId, status) => {
  try {
    const response = await api.post('/bookings/payments/process_khalti_callback/', {
      pidx: pidx,
      transaction_id: transactionId,
      booking_id: parseInt(bookingId),
      purchase_order_id: `booking_${bookingId}_${Date.now()}`
    });
    
    // Handle response
  } catch (error) {
    // Error handling
  }
};
```

### 3. Backend Verification

The backend verifies the payment with Khalti:

```python
# Backend verification (simplified)
def process_booking_payment_with_callback(self, booking_id, pidx, transaction_id, purchase_order_id, user):
    # Get booking
    booking = Booking.objects.get(id=booking_id, customer=user)
    
    # Lookup payment status with Khalti
    lookup_result = self.lookup_payment(pidx)
    
    if lookup_result['success'] and lookup_result['data']['status'] == 'Completed':
        # Create payment record
        payment = Payment.objects.create(
            booking=booking,
            # ... other fields
            khalti_token=pidx,
            khalti_transaction_id=transaction_id,
            status='completed'
        )
        
        # Update booking status
        booking.status = 'confirmed'
        booking.save()
        
        return {'success': True, ...}
```

---

## API Endpoints

### Backend Endpoints

1. **Initiate Payment**
   - URL: `/api/bookings/payments/initiate_khalti_payment/`
   - Method: POST
   - Request Body:

     ```json
     {
       "booking_id": 123,
       "return_url": "https://example.com/payment/callback",
       "website_url": "https://example.com"
     }
     ```

   - Response:

     ```json
     {
       "success": true,
       "data": {
         "pidx": "payment_identifier",
         "payment_url": "https://khalti.com/payment/..."
       }
     }
     ```

2. **Process Callback**
   - URL: `/api/bookings/payments/process_khalti_callback/`
   - Method: POST
   - Request Body:

     ```json
     {
       "pidx": "payment_identifier",
       "transaction_id": "transaction_id_from_khalti",
       "booking_id": 123,
       "purchase_order_id": "booking_123_timestamp"
     }
     ```

   - Response:

     ```json
     {
       "success": true,
       "payment_id": "payment_uuid",
       "transaction_id": "transaction_id",
       "khalti_transaction_id": "khalti_tx_id",
       "booking_status": "confirmed",
       "message": "Payment completed successfully"
     }
     ```

---

## Testing

### Test Files

1. **Integration Tests**:
   - `tests/backend/services/test_khalti_integration.py` - Comprehensive test suite for Khalti integration
   - `tests/backend/fixtures/khalti_test_data.json` - Test data fixtures

2. **Unit Tests**:
   - `tests/backend/unit/test_khalti_service.py` - Unit tests for Khalti service methods

3. **API Tests**:
   - `tests/backend/api/test_khalti_endpoints.py` - API endpoint tests for Khalti payment routes

### Running Tests

To test the Khalti integration using our new testing structure:

```bash
# Run all Khalti integration tests
python -m tests.run_tests --backend --integration -- -k khalti

# Run specific Khalti test file
pytest tests/backend/services/test_khalti_integration.py -v

# Run with coverage
python -m tests.run_tests --backend --integration --coverage -- -k khalti
```

### Test Scenarios

1. **Configuration Tests**:
   - Verify API keys and environment variables
   - Test environment switching (sandbox/production)
   - Validate base URL configuration

2. **Integration Tests**:
   - Payment initiation flow
   - Payment verification process
   - Callback handling
   - Error recovery

3. **Payment Flow Tests**:
   - Full booking payment workflow
   - Cancelled payment handling
   - Failed payment handling
   - Retry payment flow

4. **Security Tests**:
   - Validate token verification
   - Test authentication requirements
   - Verify proper error handling
   - Check permission controls

---

## Troubleshooting

### Common Issues

1. **400 Bad Request**
   - Check request payload format
   - Verify amount is in paisa (NPR × 100)
   - Ensure customer information is valid

2. **Callback Errors**
   - Verify return_url is properly configured
   - Check that callback parameters are being processed correctly

3. **Verification Failures**
   - Check if the payment status in Khalti is "Completed"
   - Verify the amount matches the booking amount

4. **Test Failures**
   - Check test environment variables are set correctly
   - Verify test data fixtures are up to date
   - Check connectivity to Khalti test environment

### Debugging Tools

1. **Logs**: Check `backend/logs/sewabazaar.log` for detailed API interactions
2. **Test Runner**: Use `python -m tests.run_tests --verbose` for detailed test output
3. **Payment Dashboard**: Verify transactions in the Khalti merchant dashboard
4. **Network Inspector**: Inspect network calls using browser developer tools

---

## References

- [Khalti e-Payment API Documentation](https://docs.khalti.com/checkout/epayment/)
- [SewaBazaar Payment Flow Diagrams](../design/payment-flows.md)
- [SewaBazaar Testing Guide](../testing/TESTING_README.md)
- [Test Data Fixtures](../../tests/backend/fixtures/README.md)
