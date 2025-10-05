"""
SewaBazaar Bookings Application Configuration

This module defines the Django application configuration for the bookings system.
The bookings app handles all booking-related functionality including booking management,
payment processing, time slot automation, and provider dashboard features.

The application provides:
- Booking creation and management with multi-step wizard
- Payment processing with Khalti integration and cash payment support
- Automated time slot generation and maintenance
- Provider dashboard with analytics and customer management
- Service delivery verification workflow
- Voucher and reward system integration
- Comprehensive booking analytics and reporting

Key Components:
- Models: Booking, Payment, Time Slots, Provider Availability, etc.
- Views: REST API endpoints for bookings, payments, and provider dashboard
- Serializers: Data serialization for API responses
- Services: Business logic for payments, slot management, and booking workflows
- Management Commands: Automated maintenance and setup tools
- Tasks: Celery tasks for background processing
- Admin: Django admin interfaces for data management

Dependencies:
- Django REST Framework for API endpoints
- Celery for background task processing
- Unfold for enhanced admin interface
- Integration with services, accounts, rewards, and reviews apps

The bookings app implements a sophisticated booking system with:
1. Multi-step booking process with validation
2. Flexible payment options (digital wallets, bank transfers, cash)
3. Automated time slot management with categorization
4. Service delivery verification workflow
5. Provider analytics and performance tracking
6. Customer relationship management
7. Comprehensive error handling and logging
"""

from django.apps import AppConfig


class BookingsConfig(AppConfig):
    """
    Django application configuration for the bookings system.
    
    This class defines the configuration for the bookings Django application,
    including the default database field type and application name.
    
    Attributes:
        default_auto_field (str): The default primary key field type for models.
        name (str): The full Python path to the application.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.bookings'