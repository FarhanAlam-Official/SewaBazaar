"""
Django app configuration for the rewards system.

This module configures the rewards Django app and handles
initialization tasks when the app is ready.
"""

from django.apps import AppConfig


class RewardsConfig(AppConfig):
    """
    Django app configuration for the rewards system.
    
    This class handles app initialization and configuration.
    
    Attributes:
        default_auto_field (str): Default primary key field type
        name (str): App name/path
        verbose_name (str): Human-readable app name
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.rewards'
    verbose_name = 'Rewards System'
    
    def ready(self):
        """
        Import signals when the app is ready.
        
        This ensures that signal handlers are registered properly
        when the Django application starts up.
        """
        import apps.rewards.signals