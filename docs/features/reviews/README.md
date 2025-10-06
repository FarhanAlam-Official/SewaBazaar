# Reviews System Documentation

## Overview

The SewaBazaar reviews system enables customers to rate and review services, helping build trust and quality assurance in the marketplace. The system includes comprehensive review management, rating analytics, and provider reputation tracking.

## System Status: ✅ COMPLETED

**Implementation Date:** September 2025  
**Current Version:** 2.0  
**Integration Status:** Fully integrated with booking and provider systems

## Architecture

### Backend Models

#### Review Model

```python
class Review(models.Model):
    RATING_CHOICES = [
        (1, '1 Star - Poor'),
        (2, '2 Stars - Fair'), 
        (3, '3 Stars - Good'),
        (4, '4 Stars - Very Good'),
        (5, '5 Stars - Excellent'),
    ]
    
    booking = models.OneToOneField('bookings.Booking', on_delete=models.CASCADE)
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_given')
    reviewee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_received')
    service = models.ForeignKey('services.Service', on_delete=models.CASCADE)
    
    rating = models.IntegerField(choices=RATING_CHOICES)
    title = models.CharField(max_length=200)
    comment = models.TextField()
    
    # Review aspects
    quality_rating = models.IntegerField(choices=RATING_CHOICES)
    timeliness_rating = models.IntegerField(choices=RATING_CHOICES) 
    communication_rating = models.IntegerField(choices=RATING_CHOICES)
    value_rating = models.IntegerField(choices=RATING_CHOICES)
    
    # Metadata
    is_verified = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    helpful_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Key Features:**

- Comprehensive rating system with multiple aspects
- Verified review tracking linked to actual bookings
- Featured review highlighting for quality content
- Helpfulness voting system

#### ReviewResponse Model

```python
class ReviewResponse(models.Model):
    review = models.OneToOneField(Review, on_delete=models.CASCADE)
    responder = models.ForeignKey(User, on_delete=models.CASCADE)
    response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Key Features:**

- Provider response capability to reviews
- Professional feedback mechanism
- Customer service improvement tracking

#### ReviewHelpfulness Model

```python
class ReviewHelpfulness(models.Model):
    review = models.ForeignKey(Review, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    is_helpful = models.BooleanField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['review', 'user']
```

**Key Features:**

- Community-driven review quality assessment
- Spam and fake review detection
- Review credibility scoring

## Review Process Workflow

### 1. Review Eligibility

```python
def can_leave_review(booking):
    """Check if booking is eligible for review"""
    return (
        booking.status == 'completed' and
        booking.completion_date and
        booking.completion_date >= timezone.now() - timedelta(days=30) and
        not hasattr(booking, 'review')
    )
```

**Requirements:**

- Booking must be completed
- Within 30-day review window
- No existing review for the booking
- Customer must be verified

### 2. Review Creation Process

```python
def create_review(booking, review_data):
    """Create comprehensive review with validation"""
    
    # Validate eligibility
    if not can_leave_review(booking):
        raise ValidationError("Booking not eligible for review")
    
    # Create review
    review = Review.objects.create(
        booking=booking,
        reviewer=booking.customer,
        reviewee=booking.provider.user,
        service=booking.service,
        **review_data
    )
    
    # Update provider rating
    update_provider_rating(booking.provider)
    
    # Send notifications
    send_review_notification(review)
    
    return review
```

### 3. Rating Calculation

```python
def calculate_provider_rating(provider):
    """Calculate comprehensive provider rating"""
    
    reviews = Review.objects.filter(reviewee=provider.user)
    
    if not reviews.exists():
        return None
    
    ratings = {
        'overall': reviews.aggregate(Avg('rating'))['rating__avg'],
        'quality': reviews.aggregate(Avg('quality_rating'))['quality_rating__avg'],
        'timeliness': reviews.aggregate(Avg('timeliness_rating'))['timeliness_rating__avg'],
        'communication': reviews.aggregate(Avg('communication_rating'))['communication_rating__avg'],
        'value': reviews.aggregate(Avg('value_rating'))['value_rating__avg'],
        'total_reviews': reviews.count()
    }
    
    return ratings
```

## API Endpoints

### Review Management

#### Create Review

```bash
POST /api/reviews/
{
    "booking_id": 123,
    "rating": 5,
    "title": "Excellent Service!",
    "comment": "Very professional and thorough cleaning. Highly recommended!",
    "quality_rating": 5,
    "timeliness_rating": 4,
    "communication_rating": 5,
    "value_rating": 4
}
```

**Response:**

```json
{
    "id": 456,
    "booking": 123,
    "rating": 5,
    "title": "Excellent Service!",
    "comment": "Very professional and thorough cleaning. Highly recommended!",
    "quality_rating": 5,
    "timeliness_rating": 4,
    "communication_rating": 5,
    "value_rating": 4,
    "is_verified": true,
    "helpful_count": 0,
    "created_at": "2025-10-06T14:30:00Z",
    "reviewer": {
        "id": 789,
        "first_name": "Jane",
        "last_name": "Smith"
    },
    "service": {
        "id": 101,
        "title": "House Cleaning Service"
    }
}
```

#### Get Reviews

```bash
GET /api/reviews/?service_id=101&rating_min=4
```

**Query Parameters:**

- `service_id` (int): Filter by service
- `provider_id` (int): Filter by provider
- `rating_min` (int): Minimum rating filter
- `rating_max` (int): Maximum rating filter
- `verified_only` (boolean): Show only verified reviews
- `featured_only` (boolean): Show only featured reviews
- `page` (int): Page number for pagination

**Response:**

```json
{
    "results": [
        {
            "id": 456,
            "rating": 5,
            "title": "Excellent Service!",
            "comment": "Very professional and thorough cleaning.",
            "quality_rating": 5,
            "timeliness_rating": 4,
            "communication_rating": 5,
            "value_rating": 4,
            "is_verified": true,
            "is_featured": false,
            "helpful_count": 3,
            "created_at": "2025-10-06T14:30:00Z",
            "reviewer": {
                "first_name": "Jane",
                "last_name": "S."
            },
            "response": {
                "response": "Thank you for the wonderful review!",
                "created_at": "2025-10-06T16:00:00Z"
            }
        }
    ],
    "average_rating": 4.7,
    "rating_distribution": {
        "1": 0,
        "2": 1,
        "3": 2,
        "4": 5,
        "5": 12
    }
}
```

#### Add Review Response

```bash
POST /api/reviews/{review_id}/respond/
{
    "response": "Thank you for your feedback! We're glad you were satisfied with our service."
}
```

#### Mark Review as Helpful

```bash
POST /api/reviews/{review_id}/helpful/
{
    "is_helpful": true
}
```

### Provider Rating Analytics

#### Get Provider Rating Summary

```bash
GET /api/providers/{provider_id}/rating-summary/
```

**Response:**

```json
{
    "overall_rating": 4.7,
    "total_reviews": 45,
    "rating_breakdown": {
        "quality": 4.8,
        "timeliness": 4.6,
        "communication": 4.7,
        "value": 4.5
    },
    "rating_distribution": {
        "5": 28,
        "4": 12,
        "3": 3,
        "2": 1,
        "1": 1
    },
    "recent_reviews": 15,
    "response_rate": 0.85,
    "featured_reviews_count": 3
}
```

#### Get Rating Trends

```bash
GET /api/providers/{provider_id}/rating-trends/?period=6months
```

**Response:**

```json
{
    "trends": [
        {
            "month": "2025-05",
            "average_rating": 4.6,
            "review_count": 8
        },
        {
            "month": "2025-04", 
            "average_rating": 4.8,
            "review_count": 12
        }
    ],
    "improvement_areas": [
        "timeliness",
        "value"
    ]
}
```

## Frontend Implementation

### Review Components

#### ReviewForm Component

```tsx
interface ReviewFormProps {
    bookingId: number;
    onSubmit: (review: ReviewData) => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ bookingId, onSubmit }) => {
    const [formData, setFormData] = useState<ReviewFormData>({
        rating: 5,
        title: '',
        comment: '',
        quality_rating: 5,
        timeliness_rating: 5,
        communication_rating: 5,
        value_rating: 5
    });
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const review = await createReview({
                booking_id: bookingId,
                ...formData
            });
            
            onSubmit(review);
            toast.success('Review submitted successfully!');
        } catch (error) {
            toast.error('Failed to submit review');
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="review-form">
            {/* Overall Rating */}
            <div className="rating-section">
                <label>Overall Rating</label>
                <StarRating 
                    rating={formData.rating}
                    onChange={(rating) => setFormData({...formData, rating})}
                />
            </div>
            
            {/* Detailed Ratings */}
            <div className="detailed-ratings">
                <RatingInput
                    label="Quality of Work"
                    value={formData.quality_rating}
                    onChange={(value) => setFormData({...formData, quality_rating: value})}
                />
                {/* Additional rating inputs */}
            </div>
            
            {/* Review Content */}
            <div className="review-content">
                <input
                    type="text"
                    placeholder="Review title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
                
                <textarea
                    placeholder="Share your experience..."
                    value={formData.comment}
                    onChange={(e) => setFormData({...formData, comment: e.target.value})}
                />
            </div>
            
            <button type="submit">Submit Review</button>
        </form>
    );
};
```

#### ReviewCard Component

```tsx
interface ReviewCardProps {
    review: Review;
    canRespond?: boolean;
    onResponse?: (response: string) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ 
    review, 
    canRespond, 
    onResponse 
}) => {
    const [showResponse, setShowResponse] = useState(false);
    
    return (
        <div className="review-card">
            <div className="review-header">
                <div className="reviewer-info">
                    <span className="reviewer-name">
                        {review.reviewer.first_name} {review.reviewer.last_name.charAt(0)}.
                    </span>
                    {review.is_verified && (
                        <span className="verified-badge">Verified</span>
                    )}
                </div>
                
                <div className="review-meta">
                    <StarRating rating={review.rating} readOnly />
                    <span className="review-date">
                        {formatDate(review.created_at)}
                    </span>
                </div>
            </div>
            
            <div className="review-content">
                <h4 className="review-title">{review.title}</h4>
                <p className="review-comment">{review.comment}</p>
                
                {/* Detailed Ratings */}
                <div className="detailed-ratings">
                    <RatingBar label="Quality" rating={review.quality_rating} />
                    <RatingBar label="Timeliness" rating={review.timeliness_rating} />
                    <RatingBar label="Communication" rating={review.communication_rating} />
                    <RatingBar label="Value" rating={review.value_rating} />
                </div>
            </div>
            
            {/* Provider Response */}
            {review.response && (
                <div className="provider-response">
                    <h5>Provider Response:</h5>
                    <p>{review.response.response}</p>
                    <span className="response-date">
                        {formatDate(review.response.created_at)}
                    </span>
                </div>
            )}
            
            {/* Review Actions */}
            <div className="review-actions">
                <HelpfulButton
                    reviewId={review.id}
                    helpfulCount={review.helpful_count}
                />
                
                {canRespond && !review.response && (
                    <button 
                        onClick={() => setShowResponse(true)}
                        className="respond-button"
                    >
                        Respond
                    </button>
                )}
            </div>
            
            {/* Response Form */}
            {showResponse && (
                <ResponseForm
                    onSubmit={(response) => {
                        onResponse?.(response);
                        setShowResponse(false);
                    }}
                    onCancel={() => setShowResponse(false)}
                />
            )}
        </div>
    );
};
```

#### RatingAnalytics Component

```tsx
const RatingAnalytics: React.FC<{ providerId: number }> = ({ providerId }) => {
    const [analytics, setAnalytics] = useState<RatingAnalytics | null>(null);
    
    useEffect(() => {
        fetchRatingAnalytics(providerId).then(setAnalytics);
    }, [providerId]);
    
    if (!analytics) return <LoadingSpinner />;
    
    return (
        <div className="rating-analytics">
            {/* Overall Rating Display */}
            <div className="overall-rating">
                <div className="rating-score">
                    {analytics.overall_rating.toFixed(1)}
                </div>
                <StarRating rating={analytics.overall_rating} readOnly />
                <div className="review-count">
                    {analytics.total_reviews} reviews
                </div>
            </div>
            
            {/* Rating Distribution */}
            <div className="rating-distribution">
                {Object.entries(analytics.rating_distribution).map(([stars, count]) => (
                    <div key={stars} className="rating-bar">
                        <span>{stars} stars</span>
                        <div className="bar">
                            <div 
                                className="fill"
                                style={{ 
                                    width: `${(count / analytics.total_reviews) * 100}%` 
                                }}
                            />
                        </div>
                        <span>{count}</span>
                    </div>
                ))}
            </div>
            
            {/* Detailed Breakdown */}
            <div className="detailed-breakdown">
                <h4>Rating Breakdown</h4>
                <div className="breakdown-grid">
                    <RatingBreakdownItem 
                        label="Quality" 
                        rating={analytics.rating_breakdown.quality} 
                    />
                    <RatingBreakdownItem 
                        label="Timeliness" 
                        rating={analytics.rating_breakdown.timeliness} 
                    />
                    <RatingBreakdownItem 
                        label="Communication" 
                        rating={analytics.rating_breakdown.communication} 
                    />
                    <RatingBreakdownItem 
                        label="Value" 
                        rating={analytics.rating_breakdown.value} 
                    />
                </div>
            </div>
        </div>
    );
};
```

## Review Quality Management

### Automated Review Validation

```python
def validate_review_quality(review_text, rating):
    """Validate review for quality and authenticity"""
    
    quality_checks = {
        'min_length': len(review_text) >= 10,
        'not_spam': not is_spam_content(review_text),
        'appropriate_language': is_appropriate_language(review_text),
        'rating_consistency': check_rating_text_consistency(review_text, rating)
    }
    
    return quality_checks

def detect_fake_reviews(reviewer, provider):
    """Detect potential fake review patterns"""
    
    # Check reviewer patterns
    reviewer_reviews = Review.objects.filter(reviewer=reviewer)
    
    flags = {
        'rapid_reviews': reviewer_reviews.filter(
            created_at__gte=timezone.now() - timedelta(hours=24)
        ).count() > 5,
        
        'same_provider_multiple': reviewer_reviews.filter(
            reviewee=provider
        ).count() > 1,
        
        'suspicious_language': check_suspicious_patterns(reviewer_reviews)
    }
    
    return flags
```

### Review Moderation

```python
class ReviewModerationService:
    """Service for review content moderation"""
    
    def moderate_review(self, review):
        """Comprehensive review moderation"""
        
        moderation_result = {
            'approved': True,
            'flags': [],
            'requires_manual_review': False
        }
        
        # Content checks
        if self.contains_inappropriate_content(review.comment):
            moderation_result['flags'].append('inappropriate_content')
            moderation_result['approved'] = False
        
        # Rating authenticity
        if self.detect_fake_patterns(review):
            moderation_result['flags'].append('suspicious_pattern')
            moderation_result['requires_manual_review'] = True
        
        # Spam detection
        if self.is_spam_review(review):
            moderation_result['flags'].append('spam')
            moderation_result['approved'] = False
        
        return moderation_result
```

## Integration Points

### Booking System Integration

```python
# Automatic review prompts after booking completion
@receiver(post_save, sender=Booking)
def booking_completed(sender, instance, **kwargs):
    if instance.status == 'completed' and instance.completion_date:
        # Schedule review reminder
        schedule_review_reminder.delay(
            booking_id=instance.id,
            delay=timedelta(days=1)  # Send reminder after 1 day
        )
```

### Notification Integration

```python
# Review-related notifications
def send_review_notifications(review):
    """Send notifications for new reviews"""
    
    # Notify provider of new review
    create_notification(
        recipient=review.reviewee,
        notification_type='review_received',
        title='New Review Received',
        message=f'You received a {review.rating}-star review',
        data={'review_id': review.id}
    )
    
    # Notify for featured reviews
    if review.is_featured:
        create_notification(
            recipient=review.reviewer,
            notification_type='review_featured',
            title='Your Review was Featured!',
            message='Your review was selected as a featured review',
            data={'review_id': review.id}
        )
```

### Provider Profile Integration

```python
# Update provider profile with latest ratings
@receiver(post_save, sender=Review)
def update_provider_profile(sender, instance, **kwargs):
    provider_profile = instance.reviewee.provider_profile
    
    # Recalculate ratings
    ratings = calculate_provider_rating(instance.reviewee)
    
    # Update profile
    provider_profile.overall_rating = ratings['overall']
    provider_profile.total_reviews = ratings['total_reviews']
    provider_profile.quality_rating = ratings['quality']
    provider_profile.save()
```

## Analytics & Reporting

### Review Analytics Dashboard

- **Rating Trends:** Historical rating performance
- **Review Volume:** Review frequency analysis
- **Response Rate:** Provider response statistics
- **Quality Metrics:** Review quality and helpfulness scores
- **Comparative Analysis:** Peer provider comparisons

### Performance Metrics

```python
def generate_review_analytics(provider, period='30d'):
    """Generate comprehensive review analytics"""
    
    start_date = timezone.now() - timedelta(days=int(period[:-1]))
    reviews = Review.objects.filter(
        reviewee=provider,
        created_at__gte=start_date
    )
    
    analytics = {
        'total_reviews': reviews.count(),
        'average_rating': reviews.aggregate(Avg('rating'))['rating__avg'] or 0,
        'rating_trend': calculate_rating_trend(reviews),
        'response_rate': calculate_response_rate(reviews),
        'improvement_areas': identify_improvement_areas(reviews),
        'top_keywords': extract_review_keywords(reviews)
    }
    
    return analytics
```

## Security & Privacy

### Review Data Protection

- **Anonymization:** Optional anonymous reviews
- **Data Retention:** Configurable review data retention
- **Privacy Controls:** User control over review visibility
- **Content Security:** XSS and injection protection

### Review Authenticity

- **Verified Reviews:** Linked to actual bookings
- **Pattern Detection:** Automated fake review detection
- **Moderation Queue:** Manual review for flagged content
- **Reputation Management:** Fair and transparent rating system

## Related Documentation

- [Booking System](../booking-management/README.md)
- [Notification System](../notifications/README.md)
- [Provider Management](../provider-management/README.md)
- [API Reference](../../api/README.md)
