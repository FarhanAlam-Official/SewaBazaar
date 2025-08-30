from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BookingViewSet, PaymentMethodViewSet, BookingSlotViewSet, 
    PaymentViewSet, BookingWizardViewSet
)

# Create router for all booking-related endpoints
router = DefaultRouter()

# Register all viewsets at the root level for clean URLs
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'payment-methods', PaymentMethodViewSet, basename='paymentmethod')
router.register(r'booking-slots', BookingSlotViewSet, basename='bookingslot')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'booking-wizard', BookingWizardViewSet, basename='bookingwizard')

urlpatterns = [
    path('', include(router.urls)),
]
