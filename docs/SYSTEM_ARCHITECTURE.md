# SewaBazaar System Architecture Documentation

## Overview

SewaBazaar is a comprehensive local services marketplace platform built with modern web technologies, featuring a sophisticated booking system, real-time messaging, rewards program, and comprehensive user management.

## Current System Status: Production Ready

**Last Updated:** October 2025  
**Version:** 2.0  
**Architecture:** Microservices with Django REST API + Next.js Frontend

## Technology Stack

### Backend (Django 4.2+)

- **Framework:** Django 4.2 with Django REST Framework
- **Database:** PostgreSQL with Supabase
- **Authentication:** JWT with role-based access control  
- **API Documentation:** Swagger/OpenAPI with drf-yasg
- **File Storage:** Django file system with configurable paths
- **Testing:** Pytest with comprehensive test suite

### Frontend (Next.js 14)

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript for type safety
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** React Context + Custom hooks
- **API Client:** Axios with interceptors and error handling
- **Testing:** Jest + React Testing Library

## Core Applications Architecture

### 1. Accounts App (`apps.accounts`)

**Purpose:** User management, authentication, profiles, and provider verification

**Key Models:**

- `User` - Extended AbstractUser with role-based system
- `Profile` - Rich user profiles with provider-specific fields
- `PortfolioProject` - Provider portfolio and work showcase
- `ProviderDocument` - Document verification system
- `FamilyMember` - Family account management
- `ProfileChangeHistory` - Audit trail for profile changes

**Key Features:**

- Multi-role system (customer, provider, admin)
- Advanced provider profiles with portfolio management
- Document verification workflow with status tracking
- Profile change tracking and audit trail
- Family account management
- JWT authentication with refresh tokens

### 2. Services App (`apps.services`)

**Purpose:** Service listings, categories, and service management

**Key Models:**

- `Service` - Core service listings with rich metadata
- `ServiceCategory` - Hierarchical service categorization
- `ServiceImage` - Multiple images per service with ordering
- `ServiceAvailability` - Provider availability schedules
- `City` - Geographic location management
- `Favorite` - User service favorites

**Key Features:**

- Rich service listings with multiple images
- Advanced search and filtering capabilities
- Provider availability integration
- Geographic service coverage
- Service verification and approval workflow
- Performance metrics and analytics

### 3. Bookings App (`apps.bookings`)

**Purpose:** Complete booking lifecycle management

**Key Models:**

- `Booking` - Core booking entity with comprehensive workflow
- `ProviderAvailability` - General availability schedules
- `ServiceTimeSlot` - Service-specific time slot management
- `Payment` - Payment tracking with multiple gateways
- `ServiceDelivery` - Service delivery verification workflow
- `ProviderAnalytics` - Performance metrics and insights
- `ProviderEarnings` - Earnings tracking and calculations

**Key Features:**

- Multi-step booking process with validation
- Flexible payment options (Khalti, COD, Bank Transfer)
- Automated time slot management
- Service delivery verification workflow
- Provider performance analytics
- Customer relationship management
- Comprehensive error handling and logging

### 4. Messaging App (`apps.messaging`)

**Purpose:** Real-time communication between customers and providers

**Key Models:**

- `Conversation` - Thread-based messaging system
- `Message` - Individual messages with encryption support
- `MessageReadStatus` - Message delivery and read tracking

**Key Features:**

- Service-based conversation threads
- End-to-end message encryption
- File attachment support
- Real-time message delivery
- Read status tracking
- Conversation archiving and management

### 5. Rewards App (`apps.rewards`)

**Purpose:** Comprehensive loyalty and voucher system

**Key Models:**

- `RewardAccount` - User points balance and tier management
- `RewardVoucher` - Fixed-value voucher system
- `PointsTransaction` - Complete audit trail
- `RewardsConfig` - System configuration management

**Key Features:**

- Points-based loyalty program
- Tier progression system (Bronze, Silver, Gold, Platinum)
- Fixed-value voucher redemption
- Comprehensive transaction tracking
- Flexible system configuration
- QR code voucher generation

### 6. Reviews App (`apps.reviews`)

**Purpose:** Review and rating system

**Key Models:**

- `Review` - Service reviews with rich metadata
- `ReviewImage` - Multiple images per review

**Key Features:**

- Comprehensive review system
- Image attachments for reviews
- Provider response capabilities
- Review moderation workflow

### 7. Notifications App (`apps.notifications`)

**Purpose:** System-wide notification management

**Key Features:**

- Multi-channel notifications
- Real-time push notifications
- Email notifications
- In-app notification center
- Notification preferences management

## API Architecture

### Base Configuration

- **Base URL:** `/api/`
- **Authentication:** JWT Bearer tokens
- **Documentation:** Available at `/swagger/` and `/redoc/`
- **Versioning:** URL-based versioning (v1)

### Core Endpoints Structure

```bash
# Authentication & Users
/api/auth/                    # Authentication endpoints
/api/auth/profile/           # Profile management

# Services  
/api/services/               # Service CRUD operations
/api/services/categories/    # Service categories
/api/services/cities/        # Available cities

# Bookings
/api/bookings/               # Booking management
/api/bookings/provider/      # Provider-specific booking endpoints
/api/bookings/payment-methods/  # Available payment methods

# Messaging
/api/messaging/conversations/  # Conversation management
/api/messaging/messages/      # Message handling

# Rewards
/api/rewards/account/        # User reward account
/api/rewards/vouchers/       # Voucher management
/api/rewards/transactions/   # Points transaction history

# Reviews
/api/reviews/                # Review management

# Notifications  
/api/notifications/          # Notification handling

# Contact
/api/contact/                # Contact form submissions
```

## Frontend Architecture

### Application Structure

```bash
frontend/src/
├── app/                     # Next.js App Router pages
│   ├── (auth)/             # Authentication pages
│   ├── dashboard/          # Dashboard pages
│   │   ├── customer/       # Customer dashboard
│   │   ├── provider/       # Provider dashboard
│   │   └── admin/          # Admin dashboard
│   ├── services/           # Service pages
│   └── booking/            # Booking flow
├── components/             # Reusable components
│   ├── ui/                 # Base UI components (shadcn/ui)
│   ├── auth/               # Authentication components
│   ├── booking/            # Booking-related components
│   ├── messaging/          # Chat and messaging components
│   └── dashboard/          # Dashboard-specific components
├── lib/                    # Utilities and configurations
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript type definitions
```

### Key Frontend Features

#### Dashboard System

- **Customer Dashboard:** Bookings, payments, reviews, vouchers, profile management
- **Provider Dashboard:** Service management, customer relations, earnings, analytics
- **Admin Dashboard:** User moderation, system analytics, content management

#### Booking System

- Multi-step booking flow with validation
- Real-time availability checking
- Payment integration with multiple gateways
- Service delivery confirmation workflow

#### Messaging System

- Real-time chat interface
- File upload and attachment support
- Conversation management and archiving
- Message encryption and security

#### Voucher System

- QR code display and scanning
- Real-time balance updates
- Redemption workflow integration
- Transaction history and tracking

## Security Implementation

### Authentication & Authorization

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- API endpoint protection with decorators
- Session management and timeout handling

### Data Protection

- Message encryption for sensitive communications
- File upload validation and sanitization
- SQL injection prevention through ORM
- XSS protection with CSP headers
- CSRF protection for forms

### Privacy Compliance

- GDPR-compliant data handling
- User data export capabilities
- Right to deletion implementation
- Data retention policy enforcement

## Database Design

### Architecture Principles

- Normalized relational design
- Foreign key constraints for data integrity
- Audit trails for critical operations
- Soft deletes for important records
- Optimized indexing for performance

### Key Relationships

- Users have Profiles with role-based extensions
- Services belong to Categories and Providers
- Bookings connect Customers, Providers, and Services
- Messages are grouped in Conversations
- Rewards track Points and Vouchers per User

## Testing Strategy

### Backend Testing

- **Unit Tests:** Model validation and business logic
- **Integration Tests:** API endpoint functionality
- **Performance Tests:** Database query optimization
- **Security Tests:** Authentication and authorization

### Frontend Testing

- **Component Tests:** UI component functionality
- **Integration Tests:** Page-level functionality
- **E2E Tests:** Complete user workflows
- **Accessibility Tests:** WCAG compliance

## Performance Optimization

### Backend Optimizations

- Database query optimization with select_related/prefetch_related
- API response caching with Redis
- File serving optimization
- Background task processing with Celery

### Frontend Optimizations

- Code splitting with Next.js
- Image optimization and lazy loading
- Component memoization
- Bundle size optimization

## Deployment Architecture

### Development Environment

- Docker containerization
- Hot reload for development
- Environment-specific configurations
- Local database with test data

### Production Environment

- Containerized deployment with orchestration
- Load balancing and auto-scaling
- SSL/TLS encryption
- Monitoring and logging integration
- Backup and disaster recovery

## Future Roadmap

### Planned Features

- Mobile app development (React Native)
- Advanced analytics dashboard
- AI-powered service recommendations  
- Integration with external payment gateways
- Multi-language support
- Advanced provider verification

### Technical Improvements

- GraphQL API implementation
- Microservices architecture migration
- Real-time notification system enhancement
- Advanced caching strategies
- Performance monitoring and optimization
