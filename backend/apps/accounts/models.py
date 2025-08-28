from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
import os
from uuid import uuid4

def profile_picture_path(instance, filename):
    # Get the file extension
    ext = filename.split('.')[-1]
    # Generate a unique filename with UUID
    filename = f"{uuid4().hex}.{ext}"
    # Return the upload path
    return os.path.join('profile_pictures', str(instance.id), filename)

class User(AbstractUser):
    """
    Custom User model with additional fields for SewaBazaar
    """
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('provider', 'Service Provider'),
        ('admin', 'Admin'),
    )
    
    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='customer')
    phone = models.CharField(max_length=15, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    profile_picture = models.ImageField(
        upload_to=profile_picture_path,
        blank=True,
        null=True,
        help_text=_('Profile picture for the user')
    )
    
    # Make email the username field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    def __str__(self):
        return self.email
        
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def save(self, *args, **kwargs):
        # If this is a new user (no ID yet), save first to get the ID
        if not self.id:
            super().save(*args, **kwargs)
        
        # If there's a new profile picture and this is an existing user
        if self.id and self.profile_picture:
            # Check if there was an old picture
            try:
                old_instance = User.objects.get(id=self.id)
                if old_instance.profile_picture and old_instance.profile_picture != self.profile_picture:
                    # Delete the old picture file
                    old_instance.profile_picture.delete(save=False)
            except User.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)
        
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

def portfolio_media_path(instance, filename):
    """Generate path for portfolio media files"""
    ext = filename.split('.')[-1]
    filename = f"{uuid4().hex}.{ext}"
    return os.path.join('portfolio', str(instance.user.id), filename)


class Profile(models.Model):
    """
    Extended profile information for users
    
    PHASE 2 ENHANCED: Added public provider profile fields
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    
    # Provider-specific fields (existing)
    company_name = models.CharField(max_length=255, blank=True, null=True)
    service_areas = models.ManyToManyField('services.City', blank=True, related_name='providers')
    is_approved = models.BooleanField(default=False)
    
    # PHASE 2 NEW: Public provider profile fields
    display_name = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Public display name for provider profile"
    )
    years_of_experience = models.PositiveIntegerField(
        default=0,
        help_text="Years of professional experience"
    )
    certifications = models.JSONField(
        default=list,
        blank=True,
        help_text="List of certifications and qualifications"
    )
    location_city = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Primary service location city"
    )
    
    # PHASE 2 NEW: Cached rating fields for performance
    avg_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00,
        help_text="Cached average rating from reviews"
    )
    reviews_count = models.PositiveIntegerField(
        default=0,
        help_text="Cached count of reviews"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Profile for {self.user.email}"
    
    @property
    def public_display_name(self):
        """Get the best available display name for public profile"""
        if self.display_name:
            return self.display_name
        elif self.user.first_name and self.user.last_name:
            return f"{self.user.first_name} {self.user.last_name}"
        else:
            return self.user.email.split('@')[0]
    
    @property
    def is_provider(self):
        """Check if this profile belongs to a provider"""
        return self.user.role == 'provider'


class PortfolioMedia(models.Model):
    """
    PHASE 2 NEW MODEL: Portfolio media for providers
    
    Purpose: Store portfolio images/videos for provider profiles
    Impact: New model - enhances provider profiles with visual content
    """
    MEDIA_TYPE_CHOICES = (
        ('image', 'Image'),
        ('video', 'Video'),
    )
    
    profile = models.ForeignKey(
        Profile, 
        on_delete=models.CASCADE, 
        related_name='portfolio_media'
    )
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPE_CHOICES, default='image')
    file = models.FileField(upload_to=portfolio_media_path)
    title = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0, help_text="Display order")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = 'Portfolio Media'
        verbose_name_plural = 'Portfolio Media'
    
    def __str__(self):
        return f"{self.media_type} for {self.profile.user.email}"
