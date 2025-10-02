from django.apps import AppConfig


class ReviewsConfig(AppConfig):
    """
    Configuration class for the reviews app.
    
    This class defines the configuration for the reviews Django app,
    including the default auto field and app name.
    
    Attributes:
        default_auto_field (str): The default auto field type for models
        name (str): The full Python path to the app
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.reviews'