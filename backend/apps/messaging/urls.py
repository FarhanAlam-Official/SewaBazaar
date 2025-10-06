"""
URL configuration for the messaging app.

This module defines URL patterns for messaging API endpoints,
including routes for conversations and messages.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'messaging'

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'conversations', views.ConversationViewSet, basename='conversation')
router.register(r'messages', views.MessageViewSet, basename='message')

urlpatterns = [
    # API routes - following existing pattern without /api/v1
    path('', include(router.urls)),
    
    # Health check endpoint for messaging service
    path('health/', views.HealthCheckView.as_view(), name='health-check'),
]