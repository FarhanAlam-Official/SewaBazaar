"""
SewaBazaar Services App Filters

This module defines custom filters for the services application using django-filter,
allowing advanced filtering of services through URL query parameters.

Filters:
- ServiceFilter: Provides filtering capabilities for Service model queries

The filters enable users to search and filter services by various criteria
including category, location, price range, and provider.
"""

import django_filters
from .models import Service

class ServiceFilter(django_filters.FilterSet):
    """
    Custom filter set for Service model.
    
    Provides advanced filtering capabilities for services through URL query parameters.
    
    Available Filters:
    - category: Filter by category slug
    - city: Filter by city ID
    - min_price: Filter by minimum price
    - max_price: Filter by maximum price
    - provider: Filter by provider ID
    
    Usage Examples:
    - /api/services/?category=plumbing
    - /api/services/?city=1&min_price=100&max_price=500
    - /api/services/?provider=5
    """
    category = django_filters.CharFilter(field_name='category__slug')
    city = django_filters.NumberFilter(field_name='cities__id')
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    provider = django_filters.NumberFilter(field_name='provider__id')
    
    class Meta:
        model = Service
        fields = ['category', 'city', 'min_price', 'max_price', 'provider']