"""
Auth-related test fixtures
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

@pytest.fixture
def api_client():
    """Return an API client for testing"""
    return APIClient()

@pytest.fixture
def auth_client(db):
    """Return an authenticated API client"""
    client = APIClient()
    user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        role='customer'
    )
    client.force_authenticate(user=user)
    return client, user

@pytest.fixture
def admin_client(db):
    """Return an admin-authenticated API client"""
    client = APIClient()
    admin = User.objects.create_user(
        username='admin',
        email='admin@example.com',
        password='adminpass123',
        role='admin',
        is_staff=True,
        is_superuser=True
    )
    client.force_authenticate(user=admin)
    return client, admin

@pytest.fixture
def provider_client(db):
    """Return a service provider authenticated API client"""
    client = APIClient()
    provider = User.objects.create_user(
        username='provider',
        email='provider@example.com',
        password='providerpass123',
        role='provider'
    )
    client.force_authenticate(user=provider)
    return client, provider
