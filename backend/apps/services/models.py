"""
SewaBazaar Services App Models

This module contains all the Django models for the services application,
which manages service listings, categories, providers, and related data.

Models:
- City: Geographic locations where services are offered
- ServiceCategory: Categories for organizing services
- Service: Main service listings with details
- ServiceImage: Images associated with services
- ServiceAvailability: Availability schedules for services
- Favorite: User-favorited services
- ServiceReview: Reviews and ratings for services
"""

import os
from uuid import uuid4

from django.db import models
from django.utils.text import slugify
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

def service_image_upload_path(instance, filename):
    """
    Generate upload path for service images with descriptive naming.
    
    This function creates organized paths for service images based on service ID
    and whether the image is featured/main or part of the gallery.
    
    Path format: 
    - Main images: service_images/{service_id}/main/{servicename}_{service_id}_{uuid}.{ext}
    - Gallery images: service_images/{service_id}/gallery/{servicename}_{service_id}_{uuid}.{ext}
    
    Args:
        instance (ServiceImage): The ServiceImage instance being saved
        filename (str): Original filename of the uploaded image
        
    Returns:
        str: Generated file path for the image
    """
    # Get file extension
    ext = filename.split('.')[-1].lower()
    
    # Generate unique filename with service name and ID
    service_name = slugify(instance.service.title)[:30]  # Limit length to 30 chars
    service_id = str(instance.service.id)
    unique_id = uuid4().hex[:8]  # Use shorter UUID for readability
    
    descriptive_filename = f"{service_name}_{service_id}_{unique_id}.{ext}"
    
    # Determine if this is a featured/main image
    if getattr(instance, 'is_featured', False):
        return os.path.join('service_images', service_id, 'main', descriptive_filename)
    else:
        return os.path.join('service_images', service_id, 'gallery', descriptive_filename)

class City(models.Model):
    """
    Model representing geographic cities/locations where services are offered.
    
    This model stores information about cities where service providers operate,
    allowing users to filter services by location.
    
    Attributes:
        name (str): Name of the city
        region (str): Region or state where the city is located
        is_active (bool): Whether the city is currently active for service listings
    """
    name = models.CharField(max_length=100)
    region = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        """
        Return string representation of the City instance.
        
        Returns:
            str: Name of the city
        """
        return self.name
    
    class Meta:
        verbose_name_plural = 'Cities'
        ordering = ['name']

class ServiceCategory(models.Model):
    """
    Model representing categories for organizing services.
    
    This model provides a way to categorize services for better organization
    and discovery. Each category can have multiple services associated with it.
    
    Attributes:
        title (str): Name of the service category
        description (str): Detailed description of the category
        icon (str): Icon identifier for the category (e.g., emoji or icon class)
        slug (str): URL-friendly version of the title for use in URLs
        is_active (bool): Whether the category is currently active
    """
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)  # Icon name or code
    slug = models.SlugField(unique=True)
    is_active = models.BooleanField(default=True)
    
    def save(self, *args, **kwargs):
        """
        Override save method to automatically generate slug if not provided.
        
        Ensures slug uniqueness by appending a counter if needed.
        
        Args:
            *args: Variable length argument list
            **kwargs: Arbitrary keyword arguments
        """
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            
            # Ensure slug uniqueness
            while ServiceCategory.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            self.slug = slug
        super().save(*args, **kwargs)
    
    def __str__(self):
        """
        Return string representation of the ServiceCategory instance.
        
        Returns:
            str: Title of the service category
        """
        return self.title
    
    class Meta:
        verbose_name_plural = 'Service Categories'
        ordering = ['title']

class Service(models.Model):
    """
    Service model representing a service offered by providers.
    
    This is the core model for service listings in the platform. Each service
    is associated with a provider, category, and location(s). Services can have
    images, availability schedules, and user reviews.
    
    PHASE 2 ENHANCED: Added enhanced discovery, performance, and portfolio fields
    
    Images are handled through ServiceImage model:
    - Featured images: ServiceImage with is_featured=True
    - Gallery images: ServiceImage with is_featured=False
    
    Attributes:
        title (str): Title/name of the service
        slug (str): URL-friendly version of the title
        description (str): Detailed description of the service
        short_description (str): Brief description for listings
        price (Decimal): Price of the service
        discount_price (Decimal): Discounted price if applicable
        duration (str): Estimated duration of the service (e.g., '2 hours')
        category (ServiceCategory): Category this service belongs to
        provider (User): User who provides this service
        cities (ManyToManyField): Cities where this service is offered
        gallery_images (ManyToManyField): Gallery images for this service
        includes (str): What's included in the service
        excludes (str): What's not included in the service
        status (str): Current status of the service listing
        is_featured (bool): Whether this is a featured/promoted service
        average_rating (Decimal): Average user rating for this service
        reviews_count (int): Number of reviews for this service
        tags (list): Search tags for better discovery
        is_verified_provider (bool): Whether the provider has verified credentials
        response_time (str): Provider's typical response time
        cancellation_policy (str): Service cancellation policy
        view_count (int): Number of profile views
        inquiry_count (int): Number of inquiries received
        last_activity (DateTime): Last activity timestamp
        created_at (DateTime): When the service was created
        updated_at (DateTime): When the service was last updated
    """
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('pending', 'Pending Approval'),
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )
    
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField()
    short_description = models.CharField(max_length=255, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    duration = models.CharField(max_length=50, help_text="e.g. '2 hours', '30 minutes'")
    
    category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE, related_name='services')
    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='services')
    cities = models.ManyToManyField(City, related_name='services')
    
    # Images are now handled exclusively through ServiceImage model
    gallery_images = models.ManyToManyField('ServiceImage', blank=True, related_name='service_galleries')
    
    includes = models.TextField(blank=True, null=True, help_text="What's included in the service")
    excludes = models.TextField(blank=True, null=True, help_text="What's not included in the service")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_featured = models.BooleanField(default=False)
    
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    reviews_count = models.PositiveIntegerField(default=0)
    
    tags = models.JSONField(default=list, blank=True, help_text="Search tags for better discovery")
    is_verified_provider = models.BooleanField(default=False, help_text="Provider has verified credentials")
    response_time = models.CharField(max_length=50, blank=True, null=True, help_text="e.g. 'Within 2 hours'")
    cancellation_policy = models.CharField(max_length=100, blank=True, null=True, help_text="e.g. 'Free cancellation up to 24h'")
    
    view_count = models.PositiveIntegerField(default=0, help_text="Number of profile views")
    inquiry_count = models.PositiveIntegerField(default=0, help_text="Number of inquiries received")
    last_activity = models.DateTimeField(auto_now=True, help_text="Last activity timestamp")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        """
        Override save method to automatically generate slug if not provided.
        
        Ensures slug uniqueness by appending a counter if needed.
        
        Args:
            *args: Variable length argument list
            **kwargs: Arbitrary keyword arguments
        """
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Service.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)
    
    def __str__(self):
        """
        Return string representation of the Service instance.
        
        Returns:
            str: Title of the service
        """
        return self.title
    
    @property
    def main_image(self):
        """
        Get the featured image for this service, if available.
        
        Returns:
            ServiceImage: The featured image instance or None if not found
        """
        try:
            return self.images.filter(is_featured=True).first()
        except:
            return None
    
    @property
    def gallery_images_ordered(self):
        """
        Get all gallery images ordered by display order.
        
        Returns:
            QuerySet: Ordered ServiceImage instances
        """
        return self.images.all()
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'is_featured']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['average_rating', 'reviews_count']),
            models.Index(fields=['view_count', 'last_activity']),
        ]

class ServiceImage(models.Model):
    """
    Model for storing service images with organized file structure.
    
    This model handles all images associated with services, including both
    featured/main images and gallery images. Images are organized by service ID
    in the file system for better management.
        
    Images are organized by service ID:
    - Main/featured images: service_images/{service_id}/main/{unique_filename}.{ext}
    - Gallery images: service_images/{service_id}/gallery/{unique_filename}.{ext}
    
    Attributes:
        service (Service): The service this image belongs to
        image (ImageField): The actual image file
        caption (str): Caption/description for the image
        order (int): Display order in gallery
        is_featured (bool): Whether this is the featured image for the service
        alt_text (str): Accessibility alt text for the image
        created_at (DateTime): When the image was uploaded
        updated_at (DateTime): When the image was last updated
    """
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to=service_image_upload_path)
    caption = models.CharField(max_length=100, blank=True, null=True)
    
    # PHASE 2 NEW: Enhanced portfolio management
    order = models.PositiveIntegerField(default=0, help_text="Display order in gallery")
    is_featured = models.BooleanField(default=False, help_text="Featured image for service")
    alt_text = models.CharField(max_length=200, blank=True, null=True, help_text="Accessibility alt text")
    
    # PHASE 2 NEW: Timestamp fields (nullable for existing records)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    def __str__(self):
        """
        Return string representation of the ServiceImage instance.
        
        Returns:
            str: Description of the image and its service
        """
        return f"Image for {self.service.title}"
    
    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = 'Service Image'
        verbose_name_plural = 'Service Images'

class ServiceAvailability(models.Model):
    """
    Model for storing service availability schedules.
    
    This model allows service providers to specify when their services are
    available, including days of the week and time slots. It supports detailed
    scheduling for better booking management.
    
    Attributes:
        service (Service): The service this availability schedule belongs to
        day_of_week (int): Day of the week (0=Monday, 6=Sunday)
        start_time (Time): Start time for availability
        end_time (Time): End time for availability
        is_available (bool): Whether the service is available during this time
        max_bookings_per_slot (int): Maximum bookings allowed per time slot
        advance_booking_hours (int): Hours in advance booking is required
        is_instant_booking (bool): Whether instant booking without approval is allowed
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
    
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='availability')
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    
    # PHASE 2 NEW: Enhanced availability management
    max_bookings_per_slot = models.PositiveIntegerField(default=1, help_text="Maximum bookings allowed per time slot")
    advance_booking_hours = models.PositiveIntegerField(default=24, help_text="Hours in advance booking is required")
    is_instant_booking = models.BooleanField(default=False, help_text="Allow instant booking without approval")
    
    def __str__(self):
        """
        Return string representation of the ServiceAvailability instance.
        
        Returns:
            str: Description of the availability schedule
        """
        return f"{self.service.title} - {self.get_day_of_week_display()} ({self.start_time} - {self.end_time})"
    
    class Meta:
        verbose_name_plural = 'Service Availabilities'
        ordering = ['day_of_week', 'start_time']
        unique_together = ['service', 'day_of_week', 'start_time', 'end_time']

class Favorite(models.Model):
    """
    Model for storing user-favorited services.
    
    This model tracks which services users have marked as favorites, allowing
    them to quickly access preferred services later.
    
    Attributes:
        user (User): The user who favorited the service
        service (Service): The service that was favorited
        created_at (DateTime): When the service was favorited
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    service = models.ForeignKey('Service', on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    
    def __str__(self):
        """
        Return string representation of the Favorite instance.
        
        Returns:
            str: Description of the favorite relationship
        """
        return f"{self.user.email}'s favorite: {self.service.title}"
    
    class Meta:
        unique_together = ['user', 'service']
        ordering = ['-created_at']


class ServiceReview(models.Model):
    """
    
    Purpose: Store detailed reviews with ratings for services
    Impact: New model - enhances service discovery and provider credibility
    
    This model provides a comprehensive review system with detailed ratings
    across multiple dimensions, helping users make informed decisions.
    
    Attributes:
        service (Service): The service being reviewed
        user (User): The user who wrote the review
        rating (int): Overall service rating (1-5)
        title (str): Review title
        comment (str): Detailed review comment
        quality_rating (int): Service quality rating (1-5)
        value_rating (int): Value for money rating (1-5)
        communication_rating (int): Communication rating (1-5)
        punctuality_rating (int): Punctuality rating (1-5)
        is_verified_booking (bool): Whether review is from verified booking
        is_helpful_count (int): Number of helpful votes
        is_reported (bool): Whether review has been reported
        created_at (DateTime): When the review was created
        updated_at (DateTime): When the review was last updated
    """
    RATING_CHOICES = (
        (1, '1 - Poor'),
        (2, '2 - Fair'),
        (3, '3 - Good'),
        (4, '4 - Very Good'),
        (5, '5 - Excellent'),
    )
    
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='service_reviews')
    
    # Core review fields
    rating = models.IntegerField(choices=RATING_CHOICES, help_text="Overall service rating")
    title = models.CharField(max_length=200, blank=True, null=True, help_text="Review title")
    comment = models.TextField(help_text="Detailed review comment")
    
    # PHASE 2 NEW: Enhanced rating breakdown
    quality_rating = models.IntegerField(choices=RATING_CHOICES, help_text="Service quality rating")
    value_rating = models.IntegerField(choices=RATING_CHOICES, help_text="Value for money rating")
    communication_rating = models.IntegerField(choices=RATING_CHOICES, help_text="Communication rating")
    punctuality_rating = models.IntegerField(choices=RATING_CHOICES, help_text="Punctuality rating")
    
    # PHASE 2 NEW: Review metadata
    is_verified_booking = models.BooleanField(default=False, help_text="Review from verified booking")
    is_helpful_count = models.PositiveIntegerField(default=0, help_text="Number of helpful votes")
    is_reported = models.BooleanField(default=False, help_text="Review has been reported")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['service', 'user']
        ordering = ['-created_at']
        verbose_name = 'Service Review'
        verbose_name_plural = 'Service Reviews'
    
    def __str__(self):
        """
        Return string representation of the ServiceReview instance.
        
        Returns:
            str: Description of the review
        """
        return f"Review by {self.user.email} for {self.service.title}"
    
    def save(self, *args, **kwargs):
        """
        Override save method to update service cached ratings.
        
        Updates the service's average rating and review count when a review is saved.
        
        Args:
            *args: Variable length argument list
            **kwargs: Arbitrary keyword arguments
        """
        super().save(*args, **kwargs)
        # Update service cached ratings
        self.service.average_rating = self.service.reviews.aggregate(
            models.Avg('rating')
        )['rating__avg'] or 0
        self.service.reviews_count = self.service.reviews.count()
        self.service.save(update_fields=['average_rating', 'reviews_count'])