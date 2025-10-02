from django.apps import AppConfig


class CommonConfig(AppConfig):
    """
    Configuration class for the common app.
    
    This class defines the configuration for the common Django app,
    which contains shared utilities, pagination, permissions, and storage
    functionality used across other apps in the project.
    
    Attributes:
        default_auto_field (str): The default auto field type for models
        name (str): The full Python path to the app
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.common' 