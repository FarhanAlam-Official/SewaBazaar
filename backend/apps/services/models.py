import os
from uuid import uuid4

from django.db import models
from django.utils.text import slugify
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

def service_image_upload_path(instance, filename):
    """
    Generate upload path for service images with descriptive naming
    
    Path format: 
    - Main images: service_images/{service_id}/main/{servicename}_{service_id}_{uuid}.{ext}
    - Gallery images: service_images/{service_id}/gallery/{servicename}_{service_id}_{uuid}.{ext}
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
    name = models.CharField(max_length=100)
    region = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = 'Cities'
        ordering = ['name']

class ServiceCategory(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)  # Icon name or code
    slug = models.SlugField(unique=True)
    is_active = models.BooleanField(default=True)
    
    def save(self, *args, **kwargs):
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
        return self.title
    
    class Meta:
        verbose_name_plural = 'Service Categories'
        ordering = ['title']

class Service(models.Model):
    """
    Service model representing a service offered by providers
    
    PHASE 2 ENHANCED: Added enhanced discovery, performance, and portfolio fields
    
    Images are handled through ServiceImage model:
    - Featured images: ServiceImage with is_featured=True
    - Gallery images: ServiceImage with is_featured=False
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
    
    # PHASE 2 NEW: Enhanced discovery and search fields
    tags = models.JSONField(default=list, blank=True, help_text="Search tags for better discovery")
    is_verified_provider = models.BooleanField(default=False, help_text="Provider has verified credentials")
    response_time = models.CharField(max_length=50, blank=True, null=True, help_text="e.g. 'Within 2 hours'")
    cancellation_policy = models.CharField(max_length=100, blank=True, null=True, help_text="e.g. 'Free cancellation up to 24h'")
    
    # PHASE 2 NEW: Performance and ranking fields
    view_count = models.PositiveIntegerField(default=0, help_text="Number of profile views")
    inquiry_count = models.PositiveIntegerField(default=0, help_text="Number of inquiries received")
    last_activity = models.DateTimeField(auto_now=True, help_text="Last activity timestamp")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
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
        return self.title
    
    @property
    def main_image(self):
        """Get the featured image for this service, if available"""
        try:
            return self.images.filter(is_featured=True).first()
        except:
            return None
    
    @property
    def gallery_images_ordered(self):
        """Get all gallery images ordered by display order"""
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
    Model for storing service images with organized file structure
    
    PHASE 2 ENHANCED: Added enhanced portfolio management fields
    
    Images are organized by service ID:
    - Main/featured images: service_images/{service_id}/main/{unique_filename}.{ext}
    - Gallery images: service_images/{service_id}/gallery/{unique_filename}.{ext}
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
        return f"Image for {self.service.title}"
    
    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = 'Service Image'
        verbose_name_plural = 'Service Images'

class ServiceAvailability(models.Model):
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
        return f"{self.service.title} - {self.get_day_of_week_display()} ({self.start_time} - {self.end_time})"
    
    class Meta:
        verbose_name_plural = 'Service Availabilities'
        ordering = ['day_of_week', 'start_time']
        unique_together = ['service', 'day_of_week', 'start_time', 'end_time']

class Favorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    service = models.ForeignKey('Service', on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.email}'s favorite: {self.service.title}"
    
    class Meta:
        unique_together = ['user', 'service']
        ordering = ['-created_at']


class ServiceReview(models.Model):
    """
    PHASE 2 NEW MODEL: Enhanced service reviews and ratings
    
    Purpose: Store detailed reviews with ratings for services
    Impact: New model - enhances service discovery and provider credibility
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
        return f"Review by {self.user.email} for {self.service.title}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update service cached ratings
        self.service.average_rating = self.service.reviews.aggregate(
            models.Avg('rating')
        )['rating__avg'] or 0
        self.service.reviews_count = self.service.reviews.count()
        self.service.save(update_fields=['average_rating', 'reviews_count'])
