"""
PHASE 2 NEW FILE: URL configuration for provider profiles and reviews

Purpose: Define API endpoints for provider profiles and review system
Impact: New URLs - provides public provider profiles and review management
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProviderProfileViewSet, ReviewViewSet

# Create router for reviews
review_router = DefaultRouter()
review_router.register(r'', ReviewViewSet, basename='review')

# Create router for provider profiles
provider_router = DefaultRouter()
provider_router.register(r'providers', ProviderProfileViewSet, basename='provider-profile')

urlpatterns = [
    # Review management endpoints
    # GET /api/reviews/ - List reviews
    # GET /api/reviews/{id}/ - Get specific review
    # PATCH /api/reviews/{id}/ - Update review
    # DELETE /api/reviews/{id}/ - Delete review
    # GET /api/reviews/my_reviews/ - Get current user's reviews
    # GET /api/reviews/provider_reviews/ - Get current provider's reviews
    path('', include(review_router.urls)),
    
    # Provider profile endpoints
    # GET /api/reviews/providers/{id}/profile/ - Get provider profile
    # GET /api/reviews/providers/{id}/reviews/ - Get provider reviews  
    # GET /api/reviews/providers/{id}/review-eligibility/ - Check review eligibility
    # POST /api/reviews/providers/{id}/create-review/ - Create review
    path('', include(provider_router.urls)),
]