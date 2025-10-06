"""
SewaBazaar Services App URL Configuration

This module defines all API endpoints for the services application using Django REST Framework routers.

URL Structure:
- /api/services/cities/ - City-related endpoints
- /api/services/categories/ - Service category-related endpoints
- /api/services/favorites/ - User favorite services endpoints
- /api/services/ - Service-related endpoints with nested resources

The router automatically generates standard CRUD endpoints for each ViewSet,
plus custom action endpoints defined in the ViewSets.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CityViewSet, ServiceCategoryViewSet, ServiceViewSet, FavoriteViewSet

# Create router and register all ViewSets
router = DefaultRouter()
router.register(r'cities', CityViewSet)
router.register(r'categories', ServiceCategoryViewSet, basename='servicecategory')
router.register(r'favorites', FavoriteViewSet, basename='favorite')
router.register(r'', ServiceViewSet, basename='service')

# URL patterns for the services app
urlpatterns = [
    path('', include(router.urls)),
]