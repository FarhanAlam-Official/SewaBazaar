from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
import os


class Review(models.Model):
    """
    PHASE 2 ENHANCED: Booking-based reviews with provider focus
    
    BREAKING CHANGE: Reviews are now tied to bookings instead of services
    This ensures one review per completed booking and focuses on provider ratings
    """
    # Core relationships
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='customer_reviews',
        limit_choices_to={'role': 'customer'}
    )
    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='provider_reviews',
        limit_choices_to={'role': 'provider'},
        help_text="Provider being reviewed"
    )
    booking = models.OneToOneField(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='review',
        help_text="The completed booking this review is for"
    )
    
    # Review content
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Overall rating from 1 to 5 stars"
    )
    comment = models.TextField(
        max_length=1000,
        help_text="Review comment (max 1000 characters)"
    )
    
    # Detailed quality ratings
    punctuality_rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True, blank=True,
        help_text="Punctuality rating from 1 to 5 stars"
    )
    quality_rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True, blank=True,
        help_text="Service quality rating from 1 to 5 stars"
    )
    communication_rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True, blank=True,
        help_text="Communication rating from 1 to 5 stars"
    )
    value_rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True, blank=True,
        help_text="Value for money rating from 1 to 5 stars"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # PHASE 2 NEW: Edit window tracking
    is_edited = models.BooleanField(default=False)
    edit_deadline = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Deadline for editing this review"
    )
    
    def __str__(self):
        return f"Review by {self.customer.email} for {self.provider.email} (Booking #{self.booking.id})"
    
    def save(self, *args, **kwargs):
        # Set edit deadline on creation (24 hours)
        if not self.pk and not self.edit_deadline:
            self.edit_deadline = timezone.now() + timedelta(hours=24)
        
        # Mark as edited if this is an update
        if self.pk:
            self.is_edited = True
            
        super().save(*args, **kwargs)
    
    @property
    def can_be_edited(self):
        """Check if review can still be edited"""
        if not self.edit_deadline:
            return False
        return timezone.now() < self.edit_deadline
    
    @property
    def service_title(self):
        """Get the service title for backward compatibility"""
        return self.booking.service.title if self.booking and self.booking.service else "Unknown Service"
    
    class Meta:
        ordering = ['-created_at']
        # Ensure one review per booking
        constraints = [
            models.UniqueConstraint(
                fields=['booking'],
                name='unique_review_per_booking'
            ),
            models.UniqueConstraint(
                fields=['customer', 'booking'],
                name='unique_customer_booking_review'
            )
        ]
        indexes = [
            models.Index(fields=['provider', '-created_at']),
            models.Index(fields=['rating']),
            models.Index(fields=['created_at']),
        ]


def review_image_upload_path(instance, filename):
    """
    Generate upload path for review images
    
    Path format: reviews/{review_id}/images/{filename}
    """
    # Get file extension
    ext = filename.split('.')[-1]
    
    # Generate new filename with timestamp
    import time
    new_filename = f"{int(time.time())}_{instance.review.id}.{ext}"
    
    return f"reviews/{instance.review.id}/images/{new_filename}"


class ReviewImage(models.Model):
    """
    Model for storing review images
    
    Purpose: Handle multiple images per review
    Impact: Enables photo upload functionality for reviews
    """
    review = models.ForeignKey(
        Review,
        on_delete=models.CASCADE,
        related_name='images',
        help_text="The review this image belongs to"
    )
    image = models.ImageField(
        upload_to=review_image_upload_path,
        help_text="Review image file"
    )
    caption = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Optional image caption"
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="Display order of the image"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', 'created_at']
        verbose_name = 'Review Image'
        verbose_name_plural = 'Review Images'
    
    def __str__(self):
        return f"Image for review {self.review.id}"
    
    def get_image_url(self):
        """Get the image URL"""
        if self.image:
            return self.image.url
        return None


@receiver(post_save, sender=Review)
def update_provider_rating_on_save(sender, instance, created, **kwargs):
    """
    PHASE 2 NEW: Update provider's cached rating when review is created/updated
    
    Purpose: Maintain denormalized rating data for performance
    Impact: Updates Profile.avg_rating and Profile.reviews_count
    """
    # Skip if review has no provider (legacy reviews)
    if not instance.provider_id:
        return
        
    provider = instance.provider
    
    # Get or create profile for provider
    profile, created_profile = provider.profile, False
    if not hasattr(provider, 'profile'):
        from apps.accounts.models import Profile
        profile, created_profile = Profile.objects.get_or_create(user=provider)
    
    # Calculate new aggregates
    provider_reviews = Review.objects.filter(provider=provider)
    reviews_count = provider_reviews.count()
    
    if reviews_count > 0:
        total_rating = sum(review.rating for review in provider_reviews)
        avg_rating = total_rating / reviews_count
    else:
        avg_rating = 0.00
    
    # Update profile
    profile.reviews_count = reviews_count
    profile.avg_rating = round(avg_rating, 2)
    profile.save(update_fields=['reviews_count', 'avg_rating'])


@receiver(post_delete, sender=Review)
def update_provider_rating_on_delete(sender, instance, **kwargs):
    """
    PHASE 2 NEW: Update provider's cached rating when review is deleted
    
    Purpose: Maintain accurate rating data when reviews are removed
    Impact: Updates Profile.avg_rating and Profile.reviews_count
    """
    # Skip if review has no provider (legacy reviews)
    if not instance.provider_id:
        return
        
    provider = instance.provider
    
    # Get profile
    if hasattr(provider, 'profile'):
        profile = provider.profile
        
        # Recalculate aggregates
        provider_reviews = Review.objects.filter(provider=provider)
        reviews_count = provider_reviews.count()
        
        if reviews_count > 0:
            total_rating = sum(review.rating for review in provider_reviews)
            avg_rating = total_rating / reviews_count
        else:
            avg_rating = 0.00
        
        # Update profile
        profile.reviews_count = reviews_count
        profile.avg_rating = round(avg_rating, 2)
        profile.save(update_fields=['reviews_count', 'avg_rating'])


# BACKWARD COMPATIBILITY: Keep old signal for existing service ratings
@receiver(post_save, sender=Review)
def update_service_rating_backward_compatibility(sender, instance, **kwargs):
    """
    BACKWARD COMPATIBILITY: Update service rating for existing functionality
    
    Purpose: Maintain existing service rating functionality while adding provider ratings
    Impact: Updates Service.average_rating and Service.reviews_count
    """
    if instance.booking and instance.booking.service:
        service = instance.booking.service
        
        # Get all reviews for this service (through bookings)
        from apps.bookings.models import Booking
        service_bookings = Booking.objects.filter(service=service)
        service_reviews = Review.objects.filter(booking__in=service_bookings)
        
        reviews_count = service_reviews.count()
        
        if reviews_count > 0:
            total_rating = sum(review.rating for review in service_reviews)
            average_rating = total_rating / reviews_count
        else:
            average_rating = 0
        
        # Update service if it has these fields
        if hasattr(service, 'reviews_count'):
            service.reviews_count = reviews_count
        if hasattr(service, 'average_rating'):
            service.average_rating = average_rating
            service.save()
