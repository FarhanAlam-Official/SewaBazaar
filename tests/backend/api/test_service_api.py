"""
API Tests for SewaBazaar services

These tests verify that the API endpoints work correctly.
"""

import pytest
from django.urls import reverse
from rest_framework import status

# Import pytest fixtures
pytestmark = [pytest.mark.api]

@pytest.mark.api
def test_services_list_endpoint(api_client):
    """Test the services list endpoint returns data correctly"""
    url = reverse('service-list')
    response = api_client.get(url)
    
    assert response.status_code == status.HTTP_200_OK
    assert 'results' in response.data
    assert 'count' in response.data

@pytest.mark.api
def test_service_categories_endpoint(api_client, sample_category):
    """Test the service categories endpoint"""
    url = reverse('servicecategory-list')
    response = api_client.get(url)
    
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) > 0
    
    # Check that our sample category is in the response
    category_names = [cat['name'] for cat in response.data]
    assert sample_category.name in category_names

@pytest.mark.api
def test_service_detail_endpoint(api_client, sample_service):
    """Test the service detail endpoint"""
    url = reverse('service-detail', kwargs={'pk': sample_service.id})
    response = api_client.get(url)
    
    assert response.status_code == status.HTTP_200_OK
    assert response.data['title'] == sample_service.title
    assert response.data['base_price'] == str(sample_service.base_price)
    
@pytest.mark.api
def test_payment_methods_endpoint(api_client, sample_payment_method):
    """Test the payment methods endpoint"""
    url = reverse('paymentmethod-list')
    response = api_client.get(url)
    
    assert response.status_code == status.HTTP_200_OK
    
    # Check that our sample payment methods are in the response
    method_names = [method['name'] for method in response.data]
    assert 'Khalti' in method_names
    assert 'Cash on Delivery' in method_names
