from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    """
    Configuration class for the notifications app.
    
    This class defines the configuration for the notifications Django app,
    including the default auto field and the ready method for importing signals.
    
    Attributes:
        default_auto_field (str): The default auto field type for models
        name (str): The full Python path to the app
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.notifications'
    
    def ready(self):
        """
        Perform initialization when the app is ready.
        
        Imports the signals module to ensure signal handlers are connected
        when the application starts.
        """
        import apps.notifications.signals