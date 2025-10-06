# Provider Management System Documentation

## Overview

The SewaBazaar Provider Management System provides comprehensive tools for service providers to manage their customer relationships, track earnings, and analyze business performance.

## Features Implemented

### Customer Management System ✅

**Location:** `/dashboard/provider/customers`

#### Core Functionality

- **Real API Integration:** Connected to actual backend endpoints
- **Advanced Search & Filtering:** Search by name, email, phone with status filters
- **Customer Relationship Management:** Favorite customers, blocking, notes management
- **Comprehensive Analytics:** Customer stats, retention rates, activity tracking
- **Professional UI/UX:** Modern animations, responsive design, loading states
- **Export Functionality:** CSV export of customer data
- **Real-time Updates:** Live data refresh and state management

#### Customer Categorization

- **New Customers:** Recently registered users
- **Returning Customers:** Multiple bookings over time
- **Regular Customers:** Frequent service users
- **Favorite Customers:** Manually marked by provider
- **Blocked Customers:** Restricted access

#### Advanced Features

- Customer details modal with full relationship history
- Notes management for each customer relationship
- Recent activity timeline for customer interactions
- Comprehensive error handling and loading states
- Advanced sorting (name, bookings, spending, ratings, last booking)

### Earnings Management System ✅

#### Earnings Calculation

- **Base Calculation:** Total booking amounts minus platform fee (10%)
- **Status Requirements:** Only completed bookings with confirmed payments
- **Time Periods:** Daily, weekly, monthly, and custom date ranges
- **Pending Earnings:** Available-for-payout calculations

#### Key Endpoints

- `/api/bookings/provider_dashboard/earnings/` - Main earnings endpoint
- **Filters:** Completed bookings with paid status enforcement
- **Platform Fee:** 10% hard-coded across multiple endpoints
- **Date Logic:** Calendar month-based calculations using `created_at`

#### Analytics Features

- Monthly earnings trends (last 6 calendar months)
- Pending vs. completed earnings breakdown
- Customer spending analysis
- Service performance metrics

### Profile Change Tracking ✅

#### Implementation Details

- **ProfileChangeHistory Model:** Tracks individual profile changes
- **Field Tracking:** Monitors email, phone, name, avatar, address, bio changes
- **Change History:** Stores old and new values with descriptions
- **Timeline Integration:** Displays detailed activity in customer timeline
- **Backward Compatibility:** Maintains existing profile update activities

#### Tracked Changes

- Contact information updates (email, phone)
- Personal information changes (name, bio)
- Profile media updates (avatar changes)
- Address and location modifications

## API Reference

### Customer Management APIs

```bash
GET /api/provider/customers/              # List provider's customers
GET /api/provider/customers/{id}/         # Get customer details
POST /api/provider/customers/{id}/note/   # Add customer note
POST /api/provider/customers/{id}/favorite/ # Toggle favorite status
POST /api/provider/customers/{id}/block/  # Block/unblock customer
GET /api/provider/customers/export/      # Export customer data (CSV)
```

### Earnings APIs

```bash
GET /api/bookings/provider_dashboard/earnings/     # Get earnings summary
GET /api/bookings/provider_dashboard/analytics/    # Get detailed analytics
GET /api/provider/earnings/trends/                 # Get earnings trends
GET /api/provider/earnings/pending/                # Get pending payments
```

### Profile Tracking APIs

```bash
GET /api/accounts/profile/changes/        # Get profile change history
POST /api/accounts/profile/update/        # Update profile (with tracking)
GET /api/accounts/activity/timeline/      # Get complete activity timeline
```

## Frontend Implementation

### File Structure

```bash
frontend/src/app/dashboard/provider/customers/
├── page.tsx                    # Main customer management page
├── components/
│   ├── CustomerCard.tsx        # Individual customer display
│   ├── CustomerModal.tsx       # Customer details modal
│   ├── CustomerFilters.tsx     # Search and filter controls
│   └── CustomerExport.tsx      # Export functionality
└── services/
    └── customerService.ts      # API service layer
```

### Key Components

- **Modern React Implementation:** Hooks-based with TypeScript
- **State Management:** Efficient local state with React hooks
- **Error Handling:** Comprehensive error boundaries and user feedback
- **Loading States:** Skeleton components and loading indicators
- **Responsive Design:** Mobile-first approach with Tailwind CSS

## Business Logic

### Customer Relationship Scoring

- **New Customer:** < 2 bookings, registered < 30 days
- **Returning Customer:** 2-5 bookings over multiple months
- **Regular Customer:** 5+ bookings with consistent frequency
- **VIP Customer:** High spending + high frequency + excellent ratings

### Earnings Calculations

```bash
Gross Earnings = Sum(completed_bookings.total_amount)
Platform Fee = Gross Earnings * 0.10
Net Earnings = Gross Earnings - Platform Fee
Pending Earnings = Net Earnings - Total Paid Out
```

### Data Consistency Rules

- Only completed bookings count toward earnings
- Payment confirmation required for earnings inclusion
- Grace periods applied for booking status updates
- Automatic reconciliation for payment processing delays

## Performance Optimizations

### Backend Optimizations

- Database query optimization with select_related/prefetch_related
- Pagination for large customer datasets
- Efficient filtering and search using database indexes
- Caching for frequently accessed analytics data

### Frontend Optimizations

- Lazy loading for customer lists
- Debounced search functionality
- Memoized components to prevent unnecessary re-renders
- Virtual scrolling for large datasets

## Security Considerations

### Access Controls

- Provider-specific data isolation
- Role-based permissions for different provider tiers
- Secure API endpoints with authentication middleware
- Data privacy compliance for customer information

### Data Protection

- Encrypted sensitive customer data
- Audit trails for all customer relationship changes
- Secure export functionality with access logging
- GDPR compliance for data handling

## Related Documentation

- [Customer Dashboard](../customer-dashboard/README.md)
- [Booking Management](../booking-management/README.md)
- [API Reference](../../api/provider.md)
