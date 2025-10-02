from django.apps import AppConfig


class ContactConfig(AppConfig):
    """
    Configuration class for the contact app.
    
    This class defines the configuration for the contact Django app,
    including the default auto field and verbose name.
    
    Attributes:
        default_auto_field (str): The default auto field type for models
        name (str): The full Python path to the app
        verbose_name (str): The human-readable name of the app
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.contact'
    verbose_name = 'Contact Messages'