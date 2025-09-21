from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BookingViewSet, PaymentMethodViewSet, BookingSlotViewSet, 
    PaymentViewSet, BookingWizardViewSet, ProviderDashboardViewSet,
    ProviderBookingUpdateViewSet, ProviderAnalyticsViewSet,
    ProviderBookingManagementViewSet, ProviderServicesManagementViewSet,
    ProviderEarningsManagementViewSet, ProviderScheduleViewSet
)

# Create router for all booking-related endpoints
router = DefaultRouter()

# Register all viewsets at the root level for clean URLs
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'payment_methods', PaymentMethodViewSet, basename='paymentmethod')
router.register(r'booking_slots', BookingSlotViewSet, basename='bookingslot')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'booking_wizard', BookingWizardViewSet, basename='bookingwizard')

# NEW: Provider dashboard endpoints (using underscores for consistency with existing patterns)
router.register(r'provider_dashboard', ProviderDashboardViewSet, basename='provider_dashboard')
router.register(r'provider_booking_update', ProviderBookingUpdateViewSet, basename='provider_booking_update')
router.register(r'provider_analytics', ProviderAnalyticsViewSet, basename='provider_analytics')
router.register(r'provider_bookings', ProviderBookingManagementViewSet, basename='provider_bookings')
router.register(r'provider_services', ProviderServicesManagementViewSet, basename='provider_services')
router.register(r'provider_earnings', ProviderEarningsManagementViewSet, basename='provider_earnings')
router.register(r'provider_schedule', ProviderScheduleViewSet, basename='provider_schedule')

urlpatterns = [
    path('', include(router.urls)),
]
