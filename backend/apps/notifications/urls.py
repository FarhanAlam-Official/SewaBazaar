from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet

# Create a router and register the notification viewset
# This automatically generates the URL patterns for our notification API
router = DefaultRouter()
router.register(r'', NotificationViewSet)

# The API URLs are now determined automatically by the router
# This includes all the standard CRUD operations plus our custom actions
urlpatterns = [
    path('', include(router.urls)),
]