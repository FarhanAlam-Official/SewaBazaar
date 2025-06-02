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

class Profile(models.Model):
    """
    Extended profile information for users
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    
    # Provider-specific fields
    company_name = models.CharField(max_length=255, blank=True, null=True)
    service_areas = models.ManyToManyField('services.City', blank=True, related_name='providers')
    is_approved = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Profile for {self.user.email}"
