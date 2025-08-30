# Phase 2: Provider Profiles & Discovery - Technical Specifications

## Overview
This document provides detailed technical specifications for implementing enhanced provider profiles and discovery features while maintaining backward compatibility with existing functionality.

## 1. Database Schema Extensions

### 1.1 New Models

#### ProviderImage Model
```python
# apps/accounts/models.py
class ProviderImage(models.Model):
    """
    Portfolio images for service providers
    
    Purpose: Allow providers to showcase their work through images
    Impact: New model - enhances provider profiles without affecting existing functionality
    """
    provider = models.ForeignKey(
        'User', 
        on_delete=models.CASCADE, 
        related_name='portfolio_images',
        limit_choices_to={'role': 'provider'}
    )
    image = models.ImageField(upload_to='provider_portfolio/')
    title = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    service_category = models.ForeignKey(
        'services.ServiceCategory', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    is_featured = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.provider.full_name} - {self.title or 'Portfolio Image'}"
    
    class Meta:
        ordering = ['display_order', '-created_at']
        verbose_name = 'Provider Image'
        verbose_name_plural = 'Provider Images'
```

#### ProviderAvailability Model
```python
# apps/accounts/models.py
class ProviderAvailability(models.Model):
    """
    Provider working hours and availability schedule
    
    Purpose: Manage provider availability for better booking scheduling
    Impact: New model - enhances scheduling without breaking existing booking system
    """
    DAY_CHOICES = (
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    )
    
    provider = models.ForeignKey(
        'User', 
        on_delete=models.CASCADE, 
        related_name='availability_schedule',
        limit_choices_to={'role': 'provider'}
    )
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    break_start = models.TimeField(null=True, blank=True)
    break_end = models.TimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.provider.full_name} - {self.get_day_of_week_display()} ({self.start_time}-{self.end_time})"
    
    class Meta:
        ordering = ['day_of_week', 'start_time']
        unique_together = ['provider', 'day_of_week', 'start_time']
        verbose_name = 'Provider Availability'
        verbose_name_plural = 'Provider Availabilities'
```

#### ProviderStats Model
```python
# apps/accounts/models.py
class ProviderStats(models.Model):
    """
    Provider performance statistics and metrics
    
    Purpose: Track provider performance for better discovery and ranking
    Impact: New model - adds analytics without affecting existing functionality
    """
    provider = models.OneToOneField(
        'User', 
        on_delete=models.CASCADE, 
        related_name='stats',
        limit_choices_to={'role': 'provider'}
    )
    
    # Performance Metrics
    total_bookings = models.PositiveIntegerField(default=0)
    completed_bookings = models.PositiveIntegerField(default=0)
    cancelled_bookings = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_reviews = models.PositiveIntegerField(default=0)
    
    # Response Metrics
    average_response_time = models.DurationField(null=True, blank=True)
    response_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # Percentage
    
    # Financial Metrics
    total_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    this_month_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Activity Metrics
    profile_views = models.PositiveIntegerField(default=0)
    service_inquiries = models.PositiveIntegerField(default=0)
    repeat_customers = models.PositiveIntegerField(default=0)
    
    # Dates
    last_active = models.DateTimeField(null=True, blank=True)
    last_booking = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Stats for {self.provider.full_name}"
    
    @property
    def completion_rate(self):
        if self.total_bookings == 0:
            return 0
        return (self.completed_bookings / self.total_bookings) * 100
    
    class Meta:
        verbose_name = 'Provider Stats'
        verbose_name_plural = 'Provider Stats'
```

#### SearchQuery Model
```python
# apps/services/models.py
class SearchQuery(models.Model):
    """
    Track search queries for analytics and improvement
    
    Purpose: Analyze search patterns to improve discovery features
    Impact: New model - analytics only, no impact on existing functionality
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='search_queries'
    )
    query_text = models.CharField(max_length=500)
    category = models.ForeignKey(
        'ServiceCategory', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    city = models.ForeignKey(
        'City', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    filters_applied = models.JSONField(default=dict, blank=True)
    results_count = models.PositiveIntegerField(default=0)
    clicked_result = models.ForeignKey(
        'Service', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    session_id = models.CharField(max_length=100, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Search: {self.query_text[:50]}"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Search Query'
        verbose_name_plural = 'Search Queries'
```

### 1.2 Existing Model Extensions

#### Extended Profile Model
```python
# apps/accounts/models.py - Extensions to existing Profile model
class Profile(models.Model):
    """
    EXISTING FUNCTIONALITY:
    - Basic profile information (bio, address, city, date_of_birth)
    - Provider-specific fields (company_name, service_areas, is_approved)
    - Timestamps for creation and updates
    
    NEW FUNCTIONALITY:
    - Enhanced provider information and credentials
    - Professional details and certifications
    - Performance metrics integration
    - Social media and contact information
    """
    
    # EXISTING FIELDS (unchanged)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    company_name = models.CharField(max_length=255, blank=True, null=True)
    service_areas = models.ManyToManyField('services.City', blank=True, related_name='providers')
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # NEW FIELDS (backward compatible - all have defaults or are nullable)
    years_of_experience = models.PositiveIntegerField(
        null=True, 
        blank=True,
        help_text="Years of professional experience"
    )
    
    certifications = models.TextField(
        blank=True, 
        null=True,
        help_text="Professional certifications and qualifications"
    )
    
    specializations = models.TextField(
        blank=True, 
        null=True,
        help_text="Areas of specialization"
    )
    
    languages_spoken = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Languages spoken (comma-separated)"
    )
    
    website_url = models.URLField(
        blank=True,
        null=True,
        help_text="Professional website URL"
    )
    
    facebook_url = models.URLField(
        blank=True,
        null=True,
        help_text="Facebook profile URL"
    )
    
    instagram_url = models.URLField(
        blank=True,
        null=True,
        help_text="Instagram profile URL"
    )
    
    linkedin_url = models.URLField(
        blank=True,
        null=True,
        help_text="LinkedIn profile URL"
    )
    
    emergency_contact_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Emergency contact person name"
    )
    
    emergency_contact_phone = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        help_text="Emergency contact phone number"
    )
    
    business_license = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Business license number"
    )
    
    insurance_details = models.TextField(
        blank=True,
        null=True,
        help_text="Insurance coverage details"
    )
    
    minimum_service_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Minimum charge for services"
    )
    
    travel_radius = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Maximum travel distance in kilometers"
    )
    
    preferred_contact_method = models.CharField(
        max_length=20,
        choices=(
            ('phone', 'Phone'),
            ('email', 'Email'),
            ('whatsapp', 'WhatsApp'),
            ('app_message', 'App Message'),
        ),
        default='phone',
        help_text="Preferred method of contact"
    )
    
    # EXISTING METHODS (unchanged)
    def __str__(self):
        return f"Profile for {self.user.email}"
```

#### Extended Service Model
```python
# apps/services/models.py - Extensions to existing Service model
class Service(models.Model):
    """
    EXISTING FUNCTIONALITY:
    - Basic service information (title, description, price, category)
    - Provider association and city coverage
    - Status management and featured services
    - Rating and review integration
    - Image and gallery support
    
    NEW FUNCTIONALITY:
    - Enhanced search and discovery features
    - Advanced filtering capabilities
    - Recommendation system integration
    - Performance tracking
    """
    
    # EXISTING FIELDS (unchanged)
    # ... all existing fields remain the same ...
    
    # NEW FIELDS (backward compatible - all have defaults or are nullable)
    tags = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Comma-separated tags for better searchability"
    )
    
    difficulty_level = models.CharField(
        max_length=20,
        choices=(
            ('basic', 'Basic'),
            ('intermediate', 'Intermediate'),
            ('advanced', 'Advanced'),
            ('expert', 'Expert'),
        ),
        default='basic',
        help_text="Service complexity level"
    )
    
    equipment_required = models.TextField(
        blank=True,
        null=True,
        help_text="Equipment or tools required for the service"
    )
    
    preparation_time = models.DurationField(
        null=True,
        blank=True,
        help_text="Time needed for preparation before service"
    )
    
    cleanup_time = models.DurationField(
        null=True,
        blank=True,
        help_text="Time needed for cleanup after service"
    )
    
    is_emergency_service = models.BooleanField(
        default=False,
        help_text="Whether this service is available for emergencies"
    )
    
    requires_consultation = models.BooleanField(
        default=False,
        help_text="Whether this service requires prior consultation"
    )
    
    group_service_max = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Maximum number of people for group services"
    )
    
    seasonal_availability = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Seasonal availability information"
    )
    
    view_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of times this service has been viewed"
    )
    
    inquiry_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of inquiries received for this service"
    )
    
    booking_count = models.PositiveIntegerField(
        default=0,
        help_text="Total number of bookings for this service"
    )
    
    last_booked = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last time this service was booked"
    )
```

## 2. Frontend Component Architecture

### 2.1 Enhanced Provider Profile Components

```typescript
// components/provider/ProviderProfile.tsx
/**
 * Enhanced provider profile display component
 * 
 * Purpose: Showcase provider information, portfolio, and services
 * Impact: New component - enhances provider visibility
 * 
 * Features:
 * - Comprehensive provider information
 * - Portfolio gallery
 * - Service listings
 * - Reviews and ratings
 * - Contact and booking options
 */
interface ProviderProfileProps {
  providerId: string;
  showBookingButton?: boolean;
  showContactInfo?: boolean;
}

export const ProviderProfile: React.FC<ProviderProfileProps> = ({
  providerId,
  showBookingButton = true,
  showContactInfo = true
}) => {
  return (
    <div className="provider-profile">
      <ProviderHeader />
      <ProviderStats />
      <ProviderPortfolio />
      <ProviderServices />
      <ProviderReviews />
      <ProviderContact />
    </div>
  );
};
```

```typescript
// components/provider/ProviderPortfolio.tsx
/**
 * Provider portfolio gallery component
 * 
 * Purpose: Display provider's work samples and portfolio images
 * Impact: New component - enhances provider credibility
 * 
 * Features:
 * - Image gallery with lightbox
 * - Categorized portfolio items
 * - Image descriptions and details
 * - Responsive grid layout
 */
interface ProviderPortfolioProps {
  providerId: string;
  images: ProviderImage[];
  categories?: ServiceCategory[];
}

export const ProviderPortfolio: React.FC<ProviderPortfolioProps> = ({
  providerId,
  images,
  categories
}) => {
  return (
    <div className="provider-portfolio">
      <div className="portfolio-filters">
        {/* Category filters */}
      </div>
      <div className="portfolio-grid">
        {/* Image gallery */}
      </div>
    </div>
  );
};
```

### 2.2 Enhanced Search Components

```typescript
// components/search/AdvancedSearch.tsx
/**
 * Advanced search form with multiple filters
 * 
 * Purpose: Provide comprehensive search capabilities
 * Impact: Enhances existing search - maintains backward compatibility
 * 
 * Features:
 * - Multiple filter criteria
 * - Location-based search
 * - Price range filtering
 * - Rating and review filters
 * - Availability filters
 */
interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
  showMapView?: boolean;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  initialFilters,
  showMapView = false
}) => {
  return (
    <div className="advanced-search">
      <SearchFilters />
      <LocationSearch />
      <PriceRangeFilter />
      <RatingFilter />
      <AvailabilityFilter />
      {showMapView && <MapView />}
    </div>
  );
};
```

```typescript
// components/search/SearchResults.tsx
/**
 * Enhanced search results display
 * 
 * Purpose: Display search results with improved layout and information
 * Impact: Enhances existing search results - backward compatible
 * 
 * Features:
 * - Multiple view modes (grid, list, map)
 * - Advanced sorting options
 * - Pagination and infinite scroll
 * - Result analytics and tracking
 */
interface SearchResultsProps {
  results: Service[];
  totalCount: number;
  viewMode: 'grid' | 'list' | 'map';
  sortBy: string;
  onViewModeChange: (mode: string) => void;
  onSortChange: (sort: string) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  totalCount,
  viewMode,
  sortBy,
  onViewModeChange,
  onSortChange
}) => {
  return (
    <div className="search-results">
      <ResultsHeader />
      <ResultsControls />
      <ResultsList />
      <ResultsPagination />
    </div>
  );
};
```

## 3. API Extensions

### 3.1 Enhanced Provider API

```python
# apps/accounts/views.py - Enhanced provider endpoints
class ProviderViewSet(viewsets.ModelViewSet):
    """
    EXISTING FUNCTIONALITY:
    - Basic provider CRUD operations
    - Profile management
    - Service area management
    
    NEW FUNCTIONALITY:
    - Enhanced provider profiles with portfolio
    - Provider statistics and analytics
    - Availability management
    - Advanced filtering and search
    """
    
    @action(detail=True, methods=['get'])
    def portfolio(self, request, pk=None):
        """
        Get provider portfolio images
        
        GET /api/providers/{id}/portfolio/
        """
        provider = self.get_object()
        images = provider.portfolio_images.all()
        serializer = ProviderImageSerializer(images, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_portfolio_image(self, request, pk=None):
        """
        Add image to provider portfolio
        
        POST /api/providers/{id}/add-portfolio-image/
        """
        provider = self.get_object()
        serializer = ProviderImageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(provider=provider)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        """
        Get provider availability schedule
        
        GET /api/providers/{id}/availability/
        """
        provider = self.get_object()
        availability = provider.availability_schedule.all()
        serializer = ProviderAvailabilitySerializer(availability, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """
        Get provider performance statistics
        
        GET /api/providers/{id}/stats/
        """
        provider = self.get_object()
        stats, created = ProviderStats.objects.get_or_create(provider=provider)
        serializer = ProviderStatsSerializer(stats)
        return Response(serializer.data)
```

### 3.2 Enhanced Search API

```python
# apps/services/views.py - Enhanced search endpoints
class ServiceSearchViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Enhanced service search with advanced filtering and analytics
    
    Purpose: Provide comprehensive search capabilities with tracking
    Impact: New API - existing search remains unchanged for backward compatibility
    """
    
    @action(detail=False, methods=['get'])
    def advanced_search(self, request):
        """
        Advanced search with multiple criteria
        
        GET /api/services/search/advanced/?q=cleaning&category=1&city=1&min_price=100&max_price=1000&rating=4&available_today=true
        """
        # Track search query
        self._track_search_query(request)
        
        # Apply advanced filters
        queryset = self._apply_advanced_filters(request)
        
        # Apply sorting
        queryset = self._apply_sorting(queryset, request)
        
        # Paginate results
        page = self.paginate_queryset(queryset)
        serializer = ServiceSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recommendations(self, request):
        """
        Get personalized service recommendations
        
        GET /api/services/search/recommendations/
        """
        user = request.user
        if user.is_authenticated:
            recommendations = self._get_user_recommendations(user)
        else:
            recommendations = self._get_popular_services()
        
        serializer = ServiceSerializer(recommendations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def trending(self, request):
        """
        Get trending services
        
        GET /api/services/search/trending/
        """
        trending_services = self._get_trending_services()
        serializer = ServiceSerializer(trending_services, many=True)
        return Response(serializer.data)
    
    def _track_search_query(self, request):
        """Track search query for analytics"""
        SearchQuery.objects.create(
            user=request.user if request.user.is_authenticated else None,
            query_text=request.GET.get('q', ''),
            category_id=request.GET.get('category'),
            city_id=request.GET.get('city'),
            filters_applied=dict(request.GET),
            session_id=request.session.session_key
        )
```

## 4. Testing Strategy

### 4.1 Unit Tests

```python
# tests/test_provider_models.py
class TestProviderExtensions(TestCase):
    """
    Test new provider model functionality while ensuring existing functionality works
    """
    
    def test_existing_profile_functionality(self):
        """Ensure existing profile functionality still works"""
        # Test existing profile creation and management
        pass
    
    def test_provider_portfolio_functionality(self):
        """Test new provider portfolio features"""
        # Test portfolio image management
        pass
    
    def test_provider_stats_calculation(self):
        """Test provider statistics calculation"""
        # Test stats model and calculations
        pass
```

### 4.2 Integration Tests

```python
# tests/test_search_api.py
class TestSearchAPIExtensions(APITestCase):
    """
    Test search API extensions while ensuring existing search works
    """
    
    def test_existing_search_functionality(self):
        """Ensure existing search API still works"""
        # Test existing search endpoints
        pass
    
    def test_advanced_search_functionality(self):
        """Test new advanced search features"""
        # Test advanced search with multiple filters
        pass
    
    def test_recommendation_system(self):
        """Test recommendation system"""
        # Test personalized recommendations
        pass
```

## 5. Migration Strategy

### 5.1 Database Migrations

```python
# migrations/0004_add_provider_enhancements.py
from django.db import migrations, models

class Migration(migrations.Migration):
    """
    Add provider enhancement features while maintaining backward compatibility
    
    Purpose: Extend provider functionality without breaking existing data
    Impact: Safe migration - all new fields have defaults or are nullable
    """
    
    dependencies = [
        ('accounts', '0003_previous_migration'),
    ]
    
    operations = [
        # Add new models
        migrations.CreateModel(
            name='ProviderImage',
            fields=[
                # ProviderImage fields
            ],
        ),
        
        migrations.CreateModel(
            name='ProviderAvailability',
            fields=[
                # ProviderAvailability fields
            ],
        ),
        
        # Add new fields to existing Profile model
        migrations.AddField(
            model_name='profile',
            name='years_of_experience',
            field=models.PositiveIntegerField(null=True, blank=True),
        ),
        
        # Add other new fields with safe defaults
    ]
```

## 6. Performance Considerations

### 6.1 Database Optimization

```python
# Database indexes for improved search performance
class Meta:
    indexes = [
        models.Index(fields=['category', 'city', 'status']),
        models.Index(fields=['average_rating', '-created_at']),
        models.Index(fields=['price', 'discount_price']),
        models.Index(fields=['tags']),  # For tag-based search
    ]
```

### 6.2 Caching Strategy

```python
# Cache frequently accessed data
from django.core.cache import cache

def get_popular_services():
    """Get popular services with caching"""
    cache_key = 'popular_services'
    popular_services = cache.get(cache_key)
    
    if popular_services is None:
        popular_services = Service.objects.filter(
            status='active'
        ).order_by('-booking_count', '-average_rating')[:20]
        cache.set(cache_key, popular_services, 3600)  # Cache for 1 hour
    
    return popular_services
```

This comprehensive Phase 2 specification ensures enhanced provider profiles and discovery features while maintaining full backward compatibility with existing functionality.