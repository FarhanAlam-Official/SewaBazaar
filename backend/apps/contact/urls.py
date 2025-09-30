from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContactMessageViewSet

# Create a router and register our viewset with it
# This automatically generates the URL patterns for our API
router = DefaultRouter()
router.register(r'messages', ContactMessageViewSet, basename='contact-messages')

# The API URLs are now determined automatically by the router
# This includes all the standard CRUD operations plus our custom actions
urlpatterns = [
    path('', include(router.urls)),
]