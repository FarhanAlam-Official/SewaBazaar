"""
Django signal handlers for the accounts application.

This module defines signal handlers that automatically manage the relationship
between User and Profile models. When a User is created, a corresponding Profile
is automatically created. When a User is saved, the associated Profile is also saved.

The signal handlers ensure data consistency between User and Profile models
and automate the profile creation process for new users.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, Profile

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Create a Profile instance when a new User is created.
    
    This signal handler automatically creates a Profile instance whenever
    a new User is created in the system. This ensures that every user
    has an associated profile for storing additional information.
    
    The profile creation only happens when a new user is created (created=True).
    For existing users that are updated, this handler does nothing.
    
    Args:
        sender: The model class that sent the signal (User)
        instance: The actual instance of the User that was saved
        created: Boolean indicating whether a new record was created
        **kwargs: Additional keyword arguments
        
    Example:
        When a new user registers, this signal automatically creates
        a blank profile for them to fill out later.
    """
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Save the Profile instance when the User is saved.
    
    This signal handler ensures that the associated Profile instance
    is also saved whenever the User instance is saved. This maintains
    data consistency between the User and Profile models.
    
    This handler is triggered for both new and existing users, but
    only attempts to save the profile for existing users that have
    an associated profile.
    
    Args:
        sender: The model class that sent the signal (User)
        instance: The actual instance of the User that was saved
        **kwargs: Additional keyword arguments
        
    Example:
        When a user updates their email address, this signal ensures
        that any changes to their profile are also saved.
    """
    instance.profile.save()