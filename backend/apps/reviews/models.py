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
    Model for storing service reviews from customers.
    
    This model represents reviews submitted by customers for services provided
    by service providers. Reviews are now tied to bookings instead of services
    to ensure one review per completed booking and focus on provider ratings.
    
    Attributes:
        customer (ForeignKey): The customer who wrote the review
        provider (ForeignKey): The provider being reviewed
        booking (OneToOneField): The completed booking this review is for
        rating (PositiveSmallIntegerField): Overall rating from 1 to 5 stars
        comment (TextField): Review comment (max 1000 characters)
        punctuality_rating (PositiveSmallIntegerField): Punctuality rating from 1 to 5 stars
        quality_rating (PositiveSmallIntegerField): Service quality rating from 1 to 5 stars
        communication_rating (PositiveSmallIntegerField): Communication rating from 1 to 5 stars
        value_rating (PositiveSmallIntegerField): Value for money rating from 1 to 5 stars
        provider_response (TextField): Provider's public reply to the review
        provider_response_created_at (DateTimeField): When the provider first replied
        provider_response_updated_at (DateTimeField): When the provider last edited the reply
        provider_responded_by (ForeignKey): Which provider account authored the reply
        created_at (DateTimeField): When the review was created
        updated_at (DateTimeField): When the review was last updated
        is_reward_claimed (BooleanField): Whether the reward for this review has been claimed
        is_edited (BooleanField): Whether the review has been edited
        edit_deadline (DateTimeField): Deadline for editing this review
    """
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
    
    # Provider response
    provider_response = models.TextField(
        max_length=1000,
        null=True,
        blank=True,
        help_text="Provider's public reply to the review"
    )
    provider_response_created_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the provider first replied"
    )
    provider_response_updated_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the provider last edited the reply"
    )
    provider_responded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='provider_review_responses',
        help_text="Which provider account authored the reply"
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Reward tracking
    is_reward_claimed = models.BooleanField(
        default=False,
        help_text="Whether the reward for this review has been claimed by the customer"
    )
    
    # PHASE 2 NEW: Edit window tracking
    is_edited = models.BooleanField(default=False)
    edit_deadline = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Deadline for editing this review"
    )
    
    def __str__(self):
        """
        Return a string representation of the review.
        
        Returns:
            str: A string representation of the review
        """
        return f"Review by {self.customer.email} for {self.provider.email} (Booking #{self.booking.id})"
    
    def save(self, *args, **kwargs):
        """
        Save the review instance.
        
        Sets the edit deadline on creation (24 hours) and marks the review
        as edited on updates.
        
        Args:
            *args: Variable length argument list
            **kwargs: Arbitrary keyword arguments
        """
        # Set edit deadline on creation (24 hours)
        if not self.pk and not self.edit_deadline:
            self.edit_deadline = timezone.now() + timedelta(hours=24)
        
        # Mark as edited if this is an update
        if self.pk:
            self.is_edited = True
            
        super().save(*args, **kwargs)
    
    @property
    def can_be_edited(self):
        """
        Check if review can still be edited.
        
        Returns:
            bool: True if the review can be edited, False otherwise
        """
        """Check if review can still be edited"""
        if not self.edit_deadline:
            return False
        return timezone.now() < self.edit_deadline
    
    @property
    def service_title(self):
        """
        Get the service title for backward compatibility.
        
        Returns:
            str: The service title or "Unknown Service" if not available
        """
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
    Generate upload path for review images.
    
    Creates a path in the format: reviews/{review_id}/images/{filename}
    
    Args:
        instance (ReviewImage): The review image instance
        filename (str): The original filename
        
    Returns:
        str: The generated upload path
    """
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
    Model for storing review images.
    
    This model handles multiple images that can be attached to a review,
    allowing customers to provide visual evidence of the service quality.
    
    Attributes:
        review (ForeignKey): The review this image belongs to
        image (ImageField): Review image file
        caption (CharField): Optional image caption
        order (PositiveIntegerField): Display order of the image
        created_at (DateTimeField): When the image was uploaded
    """
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
        """
        Return a string representation of the review image.
        
        Returns:
            str: A string representation of the review image
        """
        return f"Image for review {self.review.id}"
    
    def get_image_url(self):
        """
        Get the image URL.
        
        Returns:
            str: The image URL or None if no image
        """
        """Get the image URL"""
        if self.image:
            return self.image.url
        return None


@receiver(post_save, sender=Review)
def update_provider_rating_on_save(sender, instance, created, **kwargs):
    """
    Update provider's cached rating when review is created/updated.
    
    This signal handler maintains denormalized rating data for performance
    by updating the provider's profile with the new rating information.
    
    Args:
        sender (Model): The model class that sent the signal
        instance (Review): The review instance that was saved
        created (bool): Whether the instance was created or updated
        **kwargs: Arbitrary keyword arguments
    """
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
    Update provider's cached rating when review is deleted.
    
    This signal handler maintains accurate rating data when reviews are
    removed by updating the provider's profile with the new rating information.
    
    Args:
        sender (Model): The model class that sent the signal
        instance (Review): The review instance that was deleted
        **kwargs: Arbitrary keyword arguments
    """
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
    Update service rating for existing functionality (backward compatibility).
    
    This signal handler maintains existing service rating functionality
    while adding provider ratings by updating the service's average rating
    and reviews count.
    
    Args:
        sender (Model): The model class that sent the signal
        instance (Review): The review instance that was saved
        **kwargs: Arbitrary keyword arguments
    """
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