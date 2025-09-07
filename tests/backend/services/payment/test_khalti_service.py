"""
Tests for Khalti Payment Service

These tests verify that the Khalti payment integration works correctly.
"""

import pytest
import responses
import json
from decimal import Decimal
from unittest.mock import patch, MagicMock

from apps.bookings.services import KhaltiPaymentService
from apps.bookings.models import Booking, Payment

pytestmark = [pytest.mark.integration]

@pytest.fixture
def khalti_service():
    """Create a KhaltiPaymentService instance for testing"""
    return KhaltiPaymentService()

@pytest.fixture
def mock_khalti_success_response():
    """Mock successful Khalti API response"""
    return {
        'pidx': 'test_pidx_12345',
        'payment_url': 'https://dev.khalti.com/payment/test_pidx_12345',
        'expires_at': '2025-09-10T10:00:00',
        'status': 'Pending'
    }

@pytest.fixture
def mock_khalti_lookup_success():
    """Mock successful Khalti lookup response"""
    return {
        'pidx': 'test_pidx_12345',
        'total_amount': 10000,  # 100 NPR in paisa
        'status': 'Completed',
        'transaction_id': 'txn_12345',
        'fee': 0,
        'refunded': False
    }

@pytest.mark.integration
@responses.activate
def test_initiate_payment(khalti_service, sample_booking, mock_khalti_success_response):
    """Test initiating a payment with Khalti"""
    # Mock the Khalti API response
    responses.add(
        responses.POST,
        f"{khalti_service.base_url}/epayment/initiate/",
        json=mock_khalti_success_response,
        status=200
    )
    
    # Test the payment initiation
    result = khalti_service.initiate_payment(
        booking=sample_booking,
        return_url='http://example.com/callback',
        website_url='http://example.com'
    )
    
    # Verify the result
    assert result['success'] is True
    assert result['data']['pidx'] == mock_khalti_success_response['pidx']
    assert result['data']['payment_url'] == mock_khalti_success_response['payment_url']
    
    # Verify the request
    assert len(responses.calls) == 1
    request_body = json.loads(responses.calls[0].request.body)
    assert request_body['return_url'] == 'http://example.com/callback'
    assert request_body['website_url'] == 'http://example.com'
    assert request_body['amount'] == int(sample_booking.total_amount * 100)  # Convert to paisa

@pytest.mark.integration
@responses.activate
def test_lookup_payment(khalti_service, mock_khalti_lookup_success):
    """Test looking up a payment with Khalti"""
    # Mock the Khalti API response
    responses.add(
        responses.POST,
        f"{khalti_service.base_url}/epayment/lookup/",
        json=mock_khalti_lookup_success,
        status=200
    )
    
    # Test the payment lookup
    result = khalti_service.lookup_payment(pidx='test_pidx_12345')
    
    # Verify the result
    assert result['success'] is True
    assert result['data']['pidx'] == mock_khalti_lookup_success['pidx']
    assert result['data']['status'] == mock_khalti_lookup_success['status']
    
    # Verify the request
    assert len(responses.calls) == 1
    request_body = json.loads(responses.calls[0].request.body)
    assert request_body['pidx'] == 'test_pidx_12345'

@pytest.mark.integration
@patch('apps.bookings.services.KhaltiPaymentService.lookup_payment')
def test_process_booking_payment_with_callback(
    mock_lookup, khalti_service, sample_booking, mock_khalti_lookup_success
):
    """Test processing a payment callback from Khalti"""
    # Mock the lookup response
    mock_lookup.return_value = {
        'success': True,
        'data': mock_khalti_lookup_success
    }
    
    # Test the payment processing
    result = khalti_service.process_booking_payment_with_callback(
        booking_id=sample_booking.id,
        pidx='test_pidx_12345',
        transaction_id='txn_12345',
        purchase_order_id=f'booking_{sample_booking.id}_12345',
        user=sample_booking.customer
    )
    
    # Verify the result
    assert result['success'] is True
    assert result['khalti_transaction_id'] == 'txn_12345'
    
    # Verify the booking was updated
    sample_booking.refresh_from_db()
    assert sample_booking.status == 'confirmed'
    
    # Verify a payment record was created
    payment = Payment.objects.get(booking=sample_booking)
    assert payment.khalti_transaction_id == 'txn_12345'
    assert payment.status == 'completed'
    assert payment.amount == sample_booking.total_amount
