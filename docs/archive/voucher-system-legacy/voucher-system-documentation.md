# SewaBazaar Voucher & Rewards System - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [API Endpoints](#api-endpoints)
6. [Database Schema](#database-schema)
7. [Components Guide](#components-guide)
8. [Admin Management](#admin-management)
9. [Usage Examples](#usage-examples)
10. [Development Setup](#development-setup)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Future Enhancements](#future-enhancements)

---

## Overview

The SewaBazaar Voucher & Rewards System is a comprehensive loyalty program that allows customers to earn points through various activities and redeem them for discount vouchers. The system includes QR code generation, mobile-friendly interfaces, and advanced admin management features.

### Key Features

- **Point Earning System**: Customers earn points for bookings, reviews, and referrals
- **Voucher Management**: Create, redeem, and track voucher usage
- **QR Code Integration**: Generate and scan QR codes for easy redemption
- **Tier System**: Bronze, Silver, Gold, Platinum, Diamond membership tiers
- **Admin Dashboard**: Comprehensive voucher management and analytics
- **Mobile-First Design**: Responsive components for all devices

### User Roles

- **Customers**: Earn points, redeem vouchers, view rewards dashboard
- **Admins**: Manage vouchers, view analytics, configure system settings
- **Service Providers**: View voucher redemptions for their services

---

## System Architecture

```bash
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend     │    │    Database     │
│   (Next.js)     │◄──►│    (Django)     │◄──►│   (SQLite)      │
│                 │    │                 │    │                 │
│ - React Comps   │    │ - REST API      │    │ - Models        │
│ - Voucher UI    │    │ - Admin Panel   │    │ - Migrations    │
│ - QR Scanner    │    │ - Serializers   │    │ - Indexes       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Django 4.2, Django REST Framework, Python 3.9+
- **Database**: SQLite (development), PostgreSQL (production)
- **Additional**: QR Code generation, JWT authentication, Celery (future)

---

## Backend Implementation

### Models

#### RewardAccount

```python
class RewardAccount(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='reward_account')
    points_balance = models.PositiveIntegerField(default=0)
    total_points_earned = models.PositiveIntegerField(default=0)
    total_points_redeemed = models.PositiveIntegerField(default=0)
    current_tier = models.CharField(max_length=20, choices=TIER_CHOICES, default='Bronze')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### RewardVoucher

```python
class RewardVoucher(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('used', 'Used'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vouchers')
    voucher_code = models.CharField(max_length=50, unique=True)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    used_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    points_redeemed = models.PositiveIntegerField()
    expires_at = models.DateTimeField()
    qr_code_data = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    booking = models.ForeignKey('bookings.Booking', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)
```

### API Views

#### Key Endpoints Implementation

```python
# views.py
class VoucherListCreateView(generics.ListCreateAPIView):
    serializer_class = RewardVoucherSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return RewardVoucher.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Custom voucher creation logic
        points_amount = serializer.validated_data['points_amount']
        user_account = get_object_or_404(RewardAccount, user=self.request.user)
        
        if user_account.points_balance < points_amount:
            raise ValidationError("Insufficient points")
        
        # Deduct points and create voucher
        voucher = serializer.save(user=self.request.user)
        user_account.points_balance -= points_amount
        user_account.save()
```

### Signal Handlers

```python
# signals.py
@receiver(post_save, sender=Booking)
def award_booking_points(sender, instance, created, **kwargs):
    """Award points when booking is completed"""
    if instance.status == 'completed' and created:
        account, _ = RewardAccount.objects.get_or_create(user=instance.customer)
        points = calculate_booking_points(instance.total_amount)
        account.points_balance += points
        account.total_points_earned += points
        account.save()
```

---

## Frontend Implementation

### Component Structure

```bash
src/components/vouchers/
├── VoucherCard.tsx          # Individual voucher display
├── VoucherList.tsx          # List of vouchers with filtering
├── VoucherQRModal.tsx       # QR code display modal
├── VoucherSkeleton.tsx      # Loading skeleton
├── VoucherManagementPage.tsx # Full management interface
└── index.ts                 # Export barrel
```

### Core Components

#### VoucherCard Component

```typescript
interface VoucherData {
  id: string
  voucher_code: string
  value: number
  used_amount: number
  remaining_value: number
  status: 'active' | 'used' | 'expired' | 'cancelled'
  created_at: string
  expires_at: string
  used_at?: string
  points_redeemed: number
  qr_code_data: string
  metadata: Record<string, any>
}

export function VoucherCard({ voucher, onUse, onShare, onViewQR }: VoucherCardProps) {
  // Component implementation
}
```

#### VoucherList Component

```typescript
interface VoucherListProps {
  vouchers: VoucherData[]
  loading: boolean
  error?: string
  onUseVoucher: (voucherId: string) => void
  onShareVoucher: (voucher: VoucherData) => void
  onViewQR: (voucher: VoucherData) => void
}

export function VoucherList(props: VoucherListProps) {
  // List implementation with filtering and pagination
}
```

### API Service Layer

```typescript
// VoucherService.ts
class VoucherService {
  private static baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
  
  static async getUserVouchers(): Promise<VoucherData[]> {
    const token = localStorage.getItem('token')
    const response = await fetch(`${this.baseUrl}/rewards/vouchers/`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch vouchers')
    }
    
    return response.json()
  }
  
  static async redeemVoucher(pointsAmount: number): Promise<VoucherData> {
    // Implementation
  }
}
```

---

## API Endpoints

### Authentication Required

All voucher endpoints require authentication via Token authentication.

#### Headers

```bash
Authorization: Token <user_token>
Content-Type: application/json
```

### Voucher Endpoints

#### GET /api/rewards/vouchers/

**Description**: Get user's vouchers  
**Method**: GET  
**Authentication**: Required  

**Response**:

```json
[
  {
    "id": "1",
    "voucher_code": "SB-20250911-ABCD12",
    "value": "100.00",
    "used_amount": "0.00",
    "remaining_value": "100.00",
    "status": "active",
    "created_at": "2025-09-11T10:00:00Z",
    "expires_at": "2025-12-11T23:59:59Z",
    "used_at": null,
    "points_redeemed": 200,
    "qr_code_data": "data:image/png;base64,iVBORw0KGgo...",
    "metadata": {
      "tier": "gold",
      "campaign": "welcome"
    }
  }
]
```

#### POST /api/rewards/vouchers/redeem/

**Description**: Redeem points for voucher  
**Method**: POST  
**Authentication**: Required  

**Request Body**:

```json
{
  "points_amount": 200
}
```

**Response**:

```json
{
  "id": "2",
  "voucher_code": "SB-20250911-XYZ789",
  "value": "100.00",
  "remaining_value": "100.00",
  "status": "active",
  "created_at": "2025-09-11T10:30:00Z",
  "expires_at": "2025-12-11T23:59:59Z",
  "points_redeemed": 200,
  "qr_code_data": "data:image/png;base64,..."
}
```

#### POST /api/rewards/vouchers/validate/

**Description**: Validate voucher code  
**Method**: POST  
**Authentication**: Required  

**Request Body**:

```json
{
  "voucher_code": "SB-20250911-ABCD12"
}
```

**Response**:

```json
{
  "id": "1",
  "voucher_code": "SB-20250911-ABCD12",
  "remaining_value": "100.00",
  "status": "active",
  "expires_at": "2025-12-11T23:59:59Z"
}
```

#### GET /api/rewards/account/

**Description**: Get user's reward account  
**Method**: GET  
**Authentication**: Required  

**Response**:

```json
{
  "points_balance": 850,
  "total_points_earned": 2450,
  "total_points_redeemed": 1600,
  "current_tier": "Gold",
  "tier_name": "Gold Member",
  "points_to_next_tier": 50
}
```

### Error Responses

#### 400 Bad Request

```json
{
  "detail": "Insufficient points for redemption",
  "code": "insufficient_points"
}
```

#### 404 Not Found

```json
{
  "detail": "Voucher not found",
  "code": "voucher_not_found"
}
```

#### 401 Unauthorized

```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## Database Schema

### Tables Overview

#### reward_account

```sql
CREATE TABLE "rewards_rewardaccount" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "points_balance" integer unsigned NOT NULL CHECK ("points_balance" >= 0),
    "total_points_earned" integer unsigned NOT NULL CHECK ("total_points_earned" >= 0),
    "total_points_redeemed" integer unsigned NOT NULL CHECK ("total_points_redeemed" >= 0),
    "current_tier" varchar(20) NOT NULL,
    "created_at" datetime NOT NULL,
    "updated_at" datetime NOT NULL,
    "user_id" bigint NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED
);
```

#### reward_voucher

```sql
CREATE TABLE "rewards_rewardvoucher" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "voucher_code" varchar(50) NOT NULL UNIQUE,
    "value" decimal NOT NULL,
    "used_amount" decimal NOT NULL,
    "status" varchar(20) NOT NULL,
    "points_redeemed" integer unsigned NOT NULL CHECK ("points_redeemed" >= 0),
    "expires_at" datetime NOT NULL,
    "qr_code_data" text NOT NULL,
    "metadata" text NOT NULL,
    "created_at" datetime NOT NULL,
    "used_at" datetime NULL,
    "booking_id" bigint NULL REFERENCES "bookings_booking" ("id"),
    "user_id" bigint NOT NULL REFERENCES "auth_user" ("id")
);
```

### Indexes

```sql
CREATE INDEX "rewards_rewardaccount_user_id" ON "rewards_rewardaccount" ("user_id");
CREATE INDEX "rewards_rewardvoucher_user_id" ON "rewards_rewardvoucher" ("user_id");
CREATE INDEX "rewards_rewardvoucher_voucher_code" ON "rewards_rewardvoucher" ("voucher_code");
CREATE INDEX "rewards_rewardvoucher_status" ON "rewards_rewardvoucher" ("status");
CREATE INDEX "rewards_rewardvoucher_expires_at" ON "rewards_rewardvoucher" ("expires_at");
```

---

## Components Guide

### Using VoucherList Component

```typescript
import { VoucherList } from '@/components/vouchers'

function MyPage() {
  const [vouchers, setVouchers] = useState<VoucherData[]>([])
  const [loading, setLoading] = useState(true)
  
  const handleUseVoucher = (voucherId: string) => {
    // Store voucher for checkout
    const voucher = vouchers.find(v => v.id === voucherId)
    sessionStorage.setItem('selectedVoucher', JSON.stringify(voucher))
  }
  
  const handleShareVoucher = (voucher: VoucherData) => {
    navigator.clipboard.writeText(voucher.voucher_code)
  }
  
  const handleViewQR = (voucher: VoucherData) => {
    // Show QR modal
  }
  
  return (
    <VoucherList
      vouchers={vouchers}
      loading={loading}
      onUseVoucher={handleUseVoucher}
      onShareVoucher={handleShareVoucher}
      onViewQR={handleViewQR}
    />
  )
}
```

### QR Code Integration

```typescript
import { VoucherQRModal } from '@/components/vouchers'

function VoucherPage() {
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherData | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  
  return (
    <>
      {/* Your voucher list */}
      
      <VoucherQRModal
        voucher={selectedVoucher}
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
      />
    </>
  )
}
```

---

## Admin Management

### Django Admin Interface

#### Voucher Management Features

- **Bulk Operations**: Cancel, extend expiry, export vouchers
- **Analytics Dashboard**: Usage statistics, revenue impact
- **Search & Filtering**: By user, status, date range, value
- **Custom Actions**: Generate promotional vouchers, send notifications

#### Admin Actions Example

```python
# admin.py
@admin.action(description='Cancel selected vouchers')
def cancel_vouchers(self, request, queryset):
    """Cancel multiple vouchers at once"""
    updated = queryset.filter(status='active').update(
        status='cancelled',
        updated_at=timezone.now()
    )
    self.message_user(request, f'{updated} vouchers cancelled successfully.')

@admin.action(description='Extend expiry by 30 days')
def extend_expiry(self, request, queryset):
    """Extend voucher expiry by 30 days"""
    for voucher in queryset:
        voucher.expires_at += timedelta(days=30)
        voucher.save()
```

### Admin Dashboard Screenshots

```bash
[Voucher List View]
┌─────────────────────────────────────────────────────────────┐
│ Voucher Code     │ User    │ Value │ Status │ Expires    │   │
├─────────────────────────────────────────────────────────────┤
│ SB-20250911-001  │ john123 │ ₹100  │ Active │ 2025-12-11 │ ✓ │
│ SB-20250910-002  │ alice45 │ ₹50   │ Used   │ 2025-11-10 │ ✗ │
└─────────────────────────────────────────────────────────────┘
```

---

## Usage Examples

### Customer Journey Example

#### 1. Earning Points

```typescript
// After completing a booking
const booking = await completeBooking(bookingId)
// System automatically awards points via signals
// 10 points per ₹100 spent
```

#### 2. Checking Points Balance

```typescript
const account = await VoucherService.getRewardAccount()
console.log(`Available points: ${account.points_balance}`)
console.log(`Current tier: ${account.current_tier}`)
```

#### 3. Redeeming Voucher

```typescript
// Redeem 200 points for ₹100 voucher
const newVoucher = await VoucherService.redeemVoucher(200)
console.log(`New voucher: ${newVoucher.voucher_code}`)
```

#### 4. Using Voucher at Checkout

```typescript
// Store voucher for checkout
sessionStorage.setItem('selectedVoucher', JSON.stringify({
  id: voucher.id,
  code: voucher.voucher_code,
  value: voucher.remaining_value
}))

// At checkout, retrieve and apply
const selectedVoucher = JSON.parse(sessionStorage.getItem('selectedVoucher') || 'null')
if (selectedVoucher) {
  const discount = Math.min(selectedVoucher.value, orderTotal)
  const finalAmount = orderTotal - discount
}
```

### Admin Operations Example

#### Generating Promotional Vouchers

```python
# Django shell or admin command
from apps.rewards.models import RewardVoucher, User
from django.utils import timezone
from datetime import timedelta

# Create promotional vouchers for all Gold tier users
gold_users = User.objects.filter(reward_account__current_tier='Gold')

for user in gold_users:
    voucher = RewardVoucher.objects.create(
        user=user,
        voucher_code=f'PROMO-{timezone.now().strftime("%Y%m%d")}-{user.id}',
        value=150,
        points_redeemed=0,  # Free promotional voucher
        expires_at=timezone.now() + timedelta(days=30),
        metadata={
            'type': 'promotional',
            'campaign': 'gold_tier_bonus',
            'tier': 'gold'
        }
    )
```

---

## Development Setup

### Backend Setup

1. **Install Dependencies**

```bash
cd backend
pip install -r requirements.txt
```

2.**Database Migration**

```bash
python manage.py makemigrations rewards
python manage.py migrate
```

3.**Create Superuser**

```bash
python manage.py createsuperuser
```

4.**Run Development Server**

```bash
python manage.py runserver
```

### Frontend Setup

1. **Install Dependencies**

```bash
cd frontend
npm install
```

2.**Environment Variables**

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NODE_ENV=development
```

3.**Run Development Server**

```bash
npm run dev
```

### Testing the Integration

1. **Create Test User Account**
2. **Award Points via Admin**: Add points to user's reward account
3. **Test Voucher Redemption**: Use frontend to redeem points
4. **Verify QR Codes**: Check QR code generation and display
5. **Test Checkout**: Apply voucher during booking process

---

## Testing

### Backend Tests

#### Model Tests

```python
# tests_vouchers.py
class VoucherModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser', 'test@example.com', 'pass')
        self.account = RewardAccount.objects.create(user=self.user, points_balance=500)
    
    def test_voucher_creation(self):
        voucher = RewardVoucher.objects.create(
            user=self.user,
            voucher_code='TEST-001',
            value=100,
            points_redeemed=200,
            expires_at=timezone.now() + timedelta(days=30)
        )
        self.assertEqual(voucher.remaining_value, 100)
        self.assertEqual(voucher.status, 'active')
```

#### API Tests

```python
class VoucherAPITest(APITestCase):
    def test_redeem_voucher(self):
        response = self.client.post('/api/rewards/vouchers/redeem/', {
            'points_amount': 200
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['value'], '100.00')
```

### Frontend Tests

#### Component Tests

```typescript
// VoucherCard.test.tsx
import { render, screen } from '@testing-library/react'
import { VoucherCard } from '../VoucherCard'

test('renders voucher card with correct information', () => {
  const mockVoucher = {
    id: '1',
    voucher_code: 'TEST-001',
    value: 100,
    remaining_value: 100,
    status: 'active' as const,
    // ... other properties
  }
  
  render(<VoucherCard voucher={mockVoucher} />)
  
  expect(screen.getByText('TEST-001')).toBeInTheDocument()
  expect(screen.getByText('₹100')).toBeInTheDocument()
})
```

### Running Tests

```bash
# Backend tests
cd backend
python manage.py test apps.rewards

# Frontend tests
cd frontend
npm test
```

---

## Deployment

### Production Configuration

#### Backend (Django)

```python
# settings/production.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# Enable caching for voucher operations
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}
```

#### Frontend (Next.js)

```bash
# Build for production
npm run build

# Environment variables for production
NEXT_PUBLIC_API_URL=https://api.sewabazaar.com/api
NODE_ENV=production
```

### Docker Configuration

```dockerfile
# Dockerfile (backend)
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "sewabazaar.wsgi:application", "--bind", "0.0.0.0:8000"]
```

```dockerfile
# Dockerfile (frontend)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

---

## Future Enhancements

### Phase 3.2: Enhanced Redemption Interface

- **Advanced Filters**: Filter vouchers by value, expiry, status
- **Batch Operations**: Use multiple vouchers in single transaction
- **Smart Suggestions**: Recommend best vouchers for current cart

### Phase 3.3: QR Code Scanner

- **Mobile Camera Integration**: Scan QR codes using device camera
- **Offline Support**: Cache vouchers for offline usage
- **Quick Scan**: Fast QR code recognition and processing

### Phase 3.4: Checkout Integration

- **Auto-Apply**: Automatically suggest best available vouchers
- **Combination Logic**: Use multiple vouchers optimally
- **Real-time Validation**: Validate vouchers during checkout

### Phase 4.1: Advanced Features

- **Social Sharing**: Share vouchers with friends and family
- **Referral Bonuses**: Earn points for successful referrals
- **Promotional Campaigns**: Time-limited special offers

### Phase 4.2: Mobile Features

- **Push Notifications**: Notify users of expiring vouchers
- **Mobile Wallet**: Apple Pay/Google Pay integration
- **Location-based**: Geo-targeted voucher offers

### Phase 4.3: Analytics & Insights

- **Usage Analytics**: Track voucher performance and user behavior
- **Business Intelligence**: Revenue impact analysis
- **Predictive Analytics**: Forecast voucher usage patterns

### Phase 4.4: Performance & Optimization

- **Caching Strategy**: Redis caching for voucher data
- **Background Jobs**: Celery for email notifications and analytics
- **API Rate Limiting**: Protect against abuse and overuse

---

## Support & Troubleshooting

### Common Issues

#### 1. "Failed to fetch vouchers" Error

**Problem**: API endpoints not available or CORS issues  
**Solution**:

- Check if backend server is running on correct port
- Verify CORS configuration in Django settings
- Check authentication token validity

#### 2. QR Code Not Generating

**Problem**: QR code data not displaying correctly  
**Solution**:

- Verify qrcode library installation: `pip install qrcode[pil]`
- Check voucher model has qr_code_data field
- Ensure QR code generation in voucher creation

#### 3. Points Not Updating

**Problem**: Points balance not reflecting after actions  
**Solution**:

- Check Django signals are properly connected
- Verify database transactions are committing
- Clear cache if using Redis caching

### Development Tips

1. **Use Mock Data**: Enable mock data in development for frontend testing
2. **Database Seeding**: Create sample vouchers and accounts for testing
3. **API Documentation**: Use Django REST framework browsable API
4. **Component Storybook**: Create stories for voucher components
5. **Error Boundaries**: Implement React error boundaries for robust UI

### Performance Considerations

1. **Database Indexing**: Ensure proper indexes on frequently queried fields
2. **Pagination**: Implement pagination for large voucher lists
3. **Lazy Loading**: Load voucher images and QR codes on demand
4. **Caching**: Cache frequently accessed voucher data
5. **API Optimization**: Use select_related and prefetch_related in Django

---

## Conclusion

The SewaBazaar Voucher & Rewards System is a comprehensive solution that enhances customer engagement through a sophisticated loyalty program. The system is designed to be scalable, maintainable, and user-friendly, providing value to both customers and business administrators.

### Key Achievements

- ✅ Complete backend voucher management system
- ✅ Modern React frontend with responsive design
- ✅ QR code integration for mobile-friendly experience
- ✅ Comprehensive admin interface with analytics
- ✅ Robust API with proper error handling
- ✅ Mock data support for development
- ✅ Comprehensive documentation and examples

### Next Steps

1. Implement remaining phases (3.2-4.4) based on business priorities
2. Gather user feedback and iterate on UI/UX
3. Monitor system performance and optimize as needed
4. Expand promotional campaign features
5. Integrate with additional payment gateways

For technical support or feature requests, please refer to the project repository or contact the development team.

---

*Documentation created on September 12, 2025*  
*Version: 1.0.0*  
*Last updated: September 12, 2025*
