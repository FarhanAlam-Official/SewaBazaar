"""
SewaBazaar Bookings Application

This Django application handles all booking-related functionality for the SewaBazaar platform,
including booking management, payment processing, time slot automation, and provider dashboard features.

Key Features:
- Booking creation and management with multi-step wizard
- Payment processing with Khalti integration and cash payment support
- Automated time slot generation and maintenance
- Provider dashboard with analytics and customer management
- Service delivery verification workflow
- Voucher and reward system integration
- Comprehensive booking analytics and reporting

The application is structured with the following core components:
- Models: Booking, Payment, Time Slots, Provider Availability, etc.
- Views: REST API endpoints for bookings, payments, and provider dashboard
- Serializers: Data serialization for API responses
- Services: Business logic for payments, slot management, and booking workflows
- Management Commands: Automated maintenance and setup tools
- Tasks: Celery tasks for background processing
- Admin: Django admin interfaces for data management

This application integrates with other SewaBazaar modules including:
- Services: For service information and provider details
- Accounts: For user authentication and profile management
- Rewards: For voucher and points system
- Reviews: For customer feedback and ratings
- Common: For shared utilities and components

The bookings app implements a sophisticated booking system with:
1. Multi-step booking process with validation
2. Flexible payment options (digital wallets, bank transfers, cash)
3. Automated time slot management with categorization
4. Service delivery verification workflow
5. Provider analytics and performance tracking
6. Customer relationship management
7. Comprehensive error handling and logging
"""