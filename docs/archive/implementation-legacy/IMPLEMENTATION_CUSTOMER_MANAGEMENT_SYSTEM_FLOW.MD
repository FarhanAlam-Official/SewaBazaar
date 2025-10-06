# Provider Customer Management System - Complete Flow

## Overview

The Provider Customer Management System allows service providers to manage their customer relationships, track customer behavior, and analyze business metrics. Here's how it works from beginning to end:

## System Architecture

### Frontend (Next.js/React)

- **Page**: `/dashboard/provider/customers/page.tsx`
- **API Service**: `/services/provider.api.ts`
- **Components**: Enhanced UI components with animations and real-time updates

### Backend (Django REST Framework)

- **ViewSet**: `ProviderDashboardViewSet` in `/apps/bookings/views.py`
- **Models**: `ProviderCustomerRelation`, `Booking`, `User`, `Review`
- **URLs**: `/api/bookings/provider_dashboard/`

## Complete User Flow

### 1. **Page Load & Initial Data Fetch**

**Frontend Process:**

```typescript
// 1. User navigates to /dashboard/provider/customers
// 2. Page component loads and calls loadCustomerData()
const loadCustomerData = async () => {
  // Fetch three data sources simultaneously
  const [customers, stats, activity] = await Promise.allSettled([
    providerApi.getProviderCustomers(),     // Customer list
    providerApi.getCustomerStats(),         // Statistics
    providerApi.getRecentCustomerActivity() // Recent activity
  ])
}
```

**API Calls Made:**

- `GET /api/bookings/provider_dashboard/customers/`
- `GET /api/bookings/provider_dashboard/customer_stats/`
- `GET /api/bookings/provider_dashboard/recent_customer_activity/`

**Backend Process:**

```python
# ProviderDashboardViewSet.customers()
def customers(self, request):
    # 1. Get all bookings for this provider
    customer_bookings = Booking.objects.filter(
        service__provider=provider
    ).values('customer').annotate(
        total_bookings=Count('id'),
        total_spent=Sum('total_amount'),
        # ... other aggregations
    )
    
    # 2. Create/update ProviderCustomerRelation records
    for booking_data in customer_bookings:
        relation, created = ProviderCustomerRelation.objects.get_or_create(
            provider=provider,
            customer=customer,
            defaults={...}
        )
    
    # 3. Apply search, filtering, sorting
    # 4. Return paginated results
```

### 2. **Customer Data Processing**

**Data Transformation:**

```python
# Backend determines customer status automatically
if relation.is_blocked:
    customer_status = 'blocked'
elif relation.is_favorite_customer:
    customer_status = 'favorite'
elif relation.total_bookings >= 5:
    customer_status = 'regular'
elif relation.total_bookings > 1:
    customer_status = 'returning'
else:
    customer_status = 'new'
```

**Frontend Display:**

```typescript
// Customer data structure returned to frontend
interface CustomerRelation {
  id: number
  customer: {
    id: number
    first_name: string
    last_name: string
    email: string
    phone?: string
    profile_picture?: string
    city?: string
    date_joined: string
  }
  total_bookings: number
  total_spent: number
  average_rating: number
  is_favorite_customer: boolean
  is_blocked: boolean
  customer_status: 'new' | 'returning' | 'regular' | 'favorite' | 'blocked'
  // ... more fields
}
```

### 3. **Customer Relationship Actions**

#### **Adding to Favorites:**

```typescript
// Frontend: User clicks favorite button
const handleToggleFavorite = async (customerId: number, isFavorite: boolean) => {
  await providerApi.updateCustomerRelation(customerId, { 
    is_favorite_customer: !isFavorite 
  })
  // Update local state
  setCustomers(prev => prev.map(customer => 
    customer.id === customerId 
      ? { ...customer, is_favorite_customer: !isFavorite }
      : customer
  ))
}
```

**API Call:**

```bash
PATCH /api/bookings/provider_dashboard/{relation_id}/update_customer_relation/
Body: { "is_favorite_customer": true }
```

**Backend Processing:**

```python
def update_customer_relation(self, request, pk=None):
    relation = ProviderCustomerRelation.objects.get(
        id=pk,
        provider=request.user
    )
    
    if 'is_favorite_customer' in request.data:
        relation.is_favorite_customer = request.data['is_favorite_customer']
    
    relation.save()
    return Response(serializer.data)
```

#### **Blocking Customers:**

Same process but with `is_blocked` field.

#### **Adding Notes:**

```typescript
// Frontend: User opens notes dialog and saves
const handleSaveNotes = async () => {
  await providerApi.updateCustomerRelation(selectedCustomer.id, { 
    notes: customerNotes 
  })
}
```

### 4. **Search and Filtering**

**Frontend:**

```typescript
// Real-time search as user types
const filteredAndSortedCustomers = useMemo(() => {
  let filtered = customers
  
  // Apply search filter
  if (searchQuery) {
    filtered = filtered.filter(customer => 
      customer.customer.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.customer.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }
  
  // Apply status filter
  if (statusFilter !== "all") {
    filtered = filtered.filter(customer => customer.customer_status === statusFilter)
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.customer.first_name.localeCompare(b.customer.first_name)
      case 'total_bookings': return b.total_bookings - a.total_bookings
      // ... other sorting options
    }
  })
  
  return filtered
}, [customers, searchQuery, statusFilter, sortBy])
```

**Backend Search:**

```python
# Backend handles server-side search for large datasets
if search:
    search_lower = search.lower()
    if not any([
        search_lower in customer.first_name.lower(),
        search_lower in customer.last_name.lower(),
        search_lower in customer.email.lower(),
        search_lower in (customer.phone or '').lower()
    ]):
        continue  # Skip this customer
```

### 5. **Statistics Dashboard**

**Data Sources:**

```python
def customer_stats(self, request):
    relations = ProviderCustomerRelation.objects.filter(provider=provider)
    
    stats = {
        'total_customers': relations.count(),
        'regular_customers': relations.filter(total_bookings__gte=5).count(),
        'new_customers_this_month': relations.filter(
            first_booking_date__gte=current_month
        ).count(),
        'average_rating': relations.aggregate(avg=Avg('average_rating'))['avg'] or 0,
        'retention_rate': (returning_customers / max(total_customers, 1)) * 100
    }
```

**Frontend Display:**

```typescript
// Animated stats cards with trend indicators
<EnhancedStatsCard
  title="Total Customers"
  value={stats?.total_customers || 0}
  subtitle="All time customers"
  icon={Users}
  tone="primary"
/>
```

### 6. **Recent Activity Timeline**

**Backend Activity Aggregation:**

```python
def recent_customer_activity(self, request):
    activities = []
    
    # Recent bookings
    recent_bookings = Booking.objects.filter(
        service__provider=provider
    ).select_related('customer', 'service').order_by('-created_at')[:limit]
    
    for booking in recent_bookings:
        activities.append({
            'id': f'booking_{booking.id}',
            'type': 'booking',
            'customer_name': booking.customer.get_full_name(),
            'title': 'New Booking',
            'description': f'Booked {booking.service.title}',
            'timestamp': booking.created_at.isoformat(),
            'amount': float(booking.total_amount)
        })
    
    # Recent reviews
    recent_reviews = Review.objects.filter(
        provider=provider
    ).select_related('customer').order_by('-created_at')[:limit//2]
    
    # Sort all activities by timestamp
    activities.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return Response({'activities': activities[:limit]})
```

### 7. **Export Functionality**

**Frontend Export Trigger:**

```typescript
const handleExportCustomers = async () => {
  const blob = await providerApi.exportCustomerData('csv')
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `customers-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
}
```

**Backend CSV Generation:**

```python
def export_customers(self, request):
    relations = ProviderCustomerRelation.objects.filter(
        provider=provider
    ).select_related('customer').order_by('-last_booking_date')
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="customers_{timezone.now().strftime("%Y%m%d")}.csv"'
    
    writer = csv.writer(response)
    writer.writerow([
        'Customer Name', 'Email', 'Phone', 'Total Bookings', 
        'Total Spent', 'Average Rating', 'Customer Status',
        'First Booking', 'Last Booking', 'Is Favorite', 'Is Blocked', 'Notes'
    ])
    
    for relation in relations:
        writer.writerow([
            relation.customer.get_full_name(),
            relation.customer.email,
            # ... all customer data
        ])
    
    return response
```

### 8. **Error Handling & User Feedback**

**Frontend Error Handling:**

```typescript
try {
  await providerApi.updateCustomerRelation(customerId, data)
  showToast.success({
    title: "Success",
    description: "Customer updated successfully"
  })
} catch (error: any) {
  showToast.error({
    title: "Error",
    description: error.message || "Failed to update customer"
  })
}
```

**Backend Error Responses:**

```python
try:
    relation = ProviderCustomerRelation.objects.get(
        id=pk,
        provider=request.user
    )
    # ... process update
    return Response(serializer.data)
except ProviderCustomerRelation.DoesNotExist:
    return Response(
        {'error': 'Customer relation not found'},
        status=status.HTTP_404_NOT_FOUND
    )
except Exception as e:
    return Response(
        {'error': f'Failed to update: {str(e)}'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
```

## Database Relationships

```bash
User (Customer)
├── Booking (multiple bookings per customer)
│   ├── Service (belongs to Provider)
│   ├── Payment
│   └── Review
└── ProviderCustomerRelation (one per provider-customer pair)
    ├── total_bookings (calculated from Bookings)
    ├── total_spent (sum of booking amounts)
    ├── average_rating (average of review ratings)
    ├── is_favorite_customer (provider preference)
    ├── is_blocked (provider action)
    └── notes (provider notes)
```

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/bookings/provider_dashboard/customers/` | Get customer list |
| PATCH | `/api/bookings/provider_dashboard/{id}/update_customer_relation/` | Update customer relation |
| GET | `/api/bookings/provider_dashboard/customer_stats/` | Get customer statistics |
| GET | `/api/bookings/provider_dashboard/recent_customer_activity/` | Get recent activity |
| GET | `/api/bookings/provider_dashboard/export_customers/` | Export customer data |

## Security & Permissions

1. **Authentication**: All endpoints require user authentication
2. **Authorization**: Only providers can access their own customer data
3. **Data Filtering**: Backend automatically filters by `provider=request.user`
4. **Input Validation**: All user inputs are validated and sanitized
5. **Rate Limiting**: API calls are rate-limited to prevent abuse

## Performance Optimizations

1. **Database Queries**: Use `select_related()` and `prefetch_related()` to minimize queries
2. **Caching**: Statistics are cached for 15 minutes
3. **Pagination**: Large customer lists are paginated
4. **Lazy Loading**: Data is loaded on-demand
5. **Debounced Search**: Search queries are debounced to reduce API calls

## Real-time Features

1. **Live Updates**: Customer data refreshes automatically
2. **Optimistic Updates**: UI updates immediately, then syncs with server
3. **Error Recovery**: Failed operations are retried automatically
4. **Toast Notifications**: Users get immediate feedback on all actions

This system provides a comprehensive, production-ready customer relationship management solution for service providers with real-time data, advanced analytics, and professional user experience.
