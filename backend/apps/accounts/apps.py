from django.apps import AppConfig

class AccountsConfig(AppConfig):
    """
    Configuration class for the accounts app.
    
    This class handles the configuration and initialization of the accounts application,
    including setting up default configurations and connecting signals.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'
    
    def ready(self):
        """
        Method called when the Django application is ready.
        
        This method is responsible for importing and connecting signals
        when the application starts up.
        """
        import apps.accounts.signals