"""
SewaBazaar Services App Configuration

This module configures the Django app for the services application,
handling app initialization and configuration settings.

The Services app manages all functionality related to service listings,
providers, categories, and related data in the SewaBazaar platform.
"""

from django.apps import AppConfig

class ServicesConfig(AppConfig):
    """
    Django app configuration for the services application.
    
    This class handles app initialization and configuration settings.
    
    Attributes:
        default_auto_field (str): Default primary key field type for models
        name (str): App name/path used by Django
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.services'