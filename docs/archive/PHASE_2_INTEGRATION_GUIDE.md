# Phase 2 Frontend-Backend Integration Guide

## 🎯 **Integration Overview**

This guide walks you through connecting the Phase 2 frontend (Public Provider Profiles & Reviews) with the backend APIs.

## 📋 **Prerequisites**

### Backend Requirements
- ✅ Django server running on `http://127.0.0.1:8000`
- ✅ Phase 2 backend implementation complete
- ✅ Database migrations applied
- ✅ Sample data created

### Frontend Requirements
- ✅ Next.js server running on `http://localhost:3000`
- ✅ Phase 2 frontend components implemented
- ✅ Environment variables configured

## 🚀 **Step-by-Step Integration**

### Step 1: Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Apply Phase 2 migrations:**
   ```bash
   python manage.py migrate
   ```

3. **Run the migration script to create sample data:**
   ```bash
   python ../PHASE_2_MIGRATION_SCRIPT.py
   ```

4. **Start the Django development server:**
   ```bash
   python manage.py runserver
   ```

5. **Verify backend is running:**
   - Visit: `http://127.0.0.1:8000/swagger/`
   - Check API endpoints are available

### Step 2: Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

3. **Verify environment variables in `.env.local`:**
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
   NEXT_PUBLIC_PUBLIC_PROVIDER_PROFILE=true
   NEXT_PUBLIC_REVIEWS_SYSTEM=true
   NEXT_PUBLIC_PROVIDER_PORTFOLIO=true
   ```

4. **Start the Next.js development server:**
   ```bash
   npm run dev
   ```

### Step 3: Integration Testing

1. **Access the test page:**
   - Visit: `http://localhost:3000`
   - Add the test component to an existing page or create a test route

2. **Test API connectivity:**
   - Use the TestProviderProfile component
   - Run API tests to verify backend connection
   - Check all endpoints are responding correctly

3. **Test provider profiles:**
   - Load sample providers (IDs: 1, 2, 3)
   - Verify profile data loads correctly
   - Test review display and filtering

4. **Test review functionality:**
   - Login as a customer (customer1@example.com / testpass123)
   - Check review eligibility
   - Test review creation (if eligible)
   - Test review editing and deletion

## 🧪 **Testing Scenarios**

### Scenario 1: Public Profile Access
```typescript
// Test public access (no authentication required)
const profile = await ProviderService.getProviderProfile(1);
console.log('Profile loaded:', profile.display_name);
```

### Scenario 2: Review Eligibility Check
```typescript
// Test review eligibility (requires authentication)
const eligibility = await ProviderService.checkReviewEligibility(1);
console.log('Can review:', eligibility.eligible);
```

### Scenario 3: Review Creation
```typescript
// Test review creation (requires completed booking)
const review = await ProviderService.createReview(1, {
  booking_id: 123,
  rating: 5,
  comment: "Excellent service!"
});
```

## 🔧 **API Endpoints Testing**

### Provider Profile Endpoints
```bash
# Get provider profile (public)
curl http://127.0.0.1:8000/api/providers/1/profile/

# Get provider reviews (public)
curl http://127.0.0.1:8000/api/providers/1/reviews/

# Check review eligibility (authenticated)
curl -H "Authorization: Bearer <token>" \
     http://127.0.0.1:8000/api/providers/1/review-eligibility/
```

### Review Management Endpoints
```bash
# Create review (authenticated customer)
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"booking_id": 1, "rating": 5, "comment": "Great service!"}' \
     http://127.0.0.1:8000/api/providers/1/create-review/

# Update review (authenticated owner)
curl -X PATCH \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"rating": 4, "comment": "Updated review"}' \
     http://127.0.0.1:8000/api/reviews/1/
```

## 🐛 **Troubleshooting**

### Common Issues

#### 1. CORS Errors
**Problem:** Frontend can't connect to backend due to CORS policy.

**Solution:** Verify Django CORS settings in `settings.py`:
```python
CORS_ALLOW_ALL_ORIGINS = True  # For development
CORS_ALLOW_CREDENTIALS = True
```

#### 2. API URL Mismatch
**Problem:** Frontend making requests to wrong API URL.

**Solution:** Check `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

#### 3. Authentication Issues
**Problem:** Protected endpoints returning 401 errors.

**Solution:** Ensure JWT token is included in requests:
```typescript
// Check if user is authenticated
const { user, isAuthenticated } = useAuth();
if (!isAuthenticated) {
  // Redirect to login or show message
}
```

#### 4. Database Migration Errors
**Problem:** Models not found or migration conflicts.

**Solution:** Reset migrations if needed:
```bash
# Remove migration files (keep __init__.py)
rm apps/accounts/migrations/0002_*.py
rm apps/reviews/migrations/0002_*.py

# Create fresh migrations
python manage.py makemigrations
python manage.py migrate
```

#### 5. Sample Data Issues
**Problem:** Sample data not created or conflicts.

**Solution:** Clear and recreate data:
```bash
# Clear existing data
python manage.py shell -c "
from apps.reviews.models import Review
from apps.bookings.models import Booking
Review.objects.all().delete()
Booking.objects.all().delete()
"

# Run migration script again
python PHASE_2_MIGRATION_SCRIPT.py
```

## 📊 **Validation Checklist**

### Backend Validation
- [ ] Django server running on port 8000
- [ ] All Phase 2 migrations applied
- [ ] Sample data created successfully
- [ ] API endpoints responding correctly
- [ ] Swagger documentation accessible

### Frontend Validation
- [ ] Next.js server running on port 3000
- [ ] Environment variables configured
- [ ] Phase 2 components rendering
- [ ] API service connecting to backend
- [ ] Test page accessible

### Integration Validation
- [ ] Provider profiles loading from backend
- [ ] Reviews displaying correctly
- [ ] Review eligibility checking working
- [ ] Review creation/editing functional
- [ ] Error handling working properly

## 🎉 **Success Indicators**

When integration is successful, you should see:

1. **Provider Profile Page:**
   - Provider information displays correctly
   - Rating summary shows with breakdown
   - Reviews list with pagination
   - Portfolio media (if available)

2. **Review System:**
   - Eligibility checking works
   - Review form appears for eligible customers
   - Reviews submit successfully
   - Real-time UI updates after actions

3. **API Integration:**
   - All API tests pass
   - No CORS errors in browser console
   - Proper error handling for failed requests
   - Loading states work correctly

## 📈 **Performance Monitoring**

### Key Metrics to Monitor
- **API Response Times:** < 500ms for profile endpoints
- **Page Load Times:** < 2s for provider profile pages
- **Review Submission:** < 1s for review creation
- **Error Rates:** < 1% for API calls

### Monitoring Tools
```javascript
// Add to your API service for monitoring
const startTime = performance.now();
const response = await fetch(url);
const endTime = performance.now();
console.log(`API call took ${endTime - startTime} milliseconds`);
```

## 🔄 **Next Steps After Integration**

1. **User Acceptance Testing:**
   - Test with real users
   - Gather feedback on UX
   - Identify edge cases

2. **Performance Optimization:**
   - Optimize API queries
   - Implement caching strategies
   - Minimize bundle sizes

3. **Security Review:**
   - Validate permission checks
   - Test authentication flows
   - Review data exposure

4. **Production Deployment:**
   - Configure production environment
   - Set up monitoring and logging
   - Plan rollout strategy

## 📞 **Support**

If you encounter issues during integration:

1. **Check the console logs** in both frontend and backend
2. **Verify API responses** using browser dev tools or Postman
3. **Review the migration script output** for any errors
4. **Test individual components** in isolation
5. **Check the troubleshooting section** above

**Integration Status:** 🚀 **Ready for Testing**

The Phase 2 frontend-backend integration is complete and ready for comprehensive testing. Follow this guide to ensure smooth integration and validate all functionality works as expected.