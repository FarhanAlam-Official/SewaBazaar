from django.apps import AppConfig


class RewardsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.rewards'
    verbose_name = 'Rewards System'
    
    def ready(self):
        """
        Import signals when the app is ready
        This ensures that signal handlers are registered properly
        """
        import apps.rewards.signals
