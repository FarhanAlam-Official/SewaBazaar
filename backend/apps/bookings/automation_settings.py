"""
TIME SLOT AUTOMATION CONFIGURATION

Add this configuration to your Django settings.py file to enable 
automatic time slot maintenance and scheduling.

Features:
- Automatic slot generation for rolling 30-day window
- Daily cleanup of expired slots
- Provider availability synchronization
- Configurable scheduling and maintenance windows

Installation:
1. pip install django-crontab
2. Add 'django_crontab' to INSTALLED_APPS
3. Add this configuration to settings.py
4. Run: python manage.py crontab add
"""

# Time Slot Automation Settings
TIME_SLOT_AUTOMATION = {
    # Enable/disable automation
    'ENABLED': True,
    
    # Rolling window configuration
    'DAYS_AHEAD': 30,  # Maintain slots for next 30 days
    'CLEANUP_EXPIRED': True,  # Remove expired slots daily
    'PRESERVE_BOOKED_EXPIRED': True,  # Keep expired slots with bookings
    
    # Scheduling configuration
    'DAILY_MAINTENANCE_TIME': '02:00',  # Run daily at 2 AM
    'WEEKLY_OPTIMIZATION_TIME': '03:00',  # Weekly optimization at 3 AM Sunday
    
    # Safety and performance settings
    'MAX_SLOTS_PER_SERVICE': 1000,  # Prevent runaway slot generation
    'BATCH_SIZE': 100,  # Process in batches for large datasets
    'DRY_RUN_MODE': False,  # Set to True to test without making changes
    
    # Logging configuration
    'LOG_LEVEL': 'INFO',
    'LOG_TO_FILE': True,
    'LOG_FILE_PATH': 'logs/time_slot_automation.log',
    
    # Notification settings (future feature)
    'NOTIFY_ON_ERRORS': True,
    'NOTIFY_EMAIL': None,  # Set admin email for notifications
    'SLACK_WEBHOOK': None,  # Set Slack webhook for notifications
}

# Cron Jobs Configuration for django-crontab
CRONJOBS = [
    # Daily booking slot maintenance - cleanup expired and generate new slots
    ('0 2 * * *', 'django.core.management.call_command', ['maintain_booking_slots'], {
        'verbosity': 1,
    }),
    
    # Weekly extended slot generation (45 days ahead) - Sundays at 3 AM
    ('0 3 * * 0', 'django.core.management.call_command', ['maintain_booking_slots'], {
        'days_ahead': 45,
        'verbosity': 1,
    }),
    
    # Monthly provider availability sync - First day of month at 4 AM
    ('0 4 1 * *', 'django.core.management.call_command', ['generate_booking_slots'], {
        'days': 60,  # Generate 2 months ahead
        'verbosity': 1,
    }),
]

# Crontab configuration for production
CRONTAB_LOCK_JOBS = True  # Prevent overlapping maintenance jobs
CRONTAB_COMMAND_PREFIX = f'DJANGO_SETTINGS_MODULE={locals().get("DJANGO_SETTINGS_MODULE", "backend.settings")}'

# Logging configuration for automation
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'automation': {
            'format': '{levelname} {asctime} {name} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'automation_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/time_slot_automation.log',
            'maxBytes': 1024*1024*5,  # 5 MB
            'backupCount': 10,
            'formatter': 'automation',
        },
        'automation_console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'automation',
        },
    },
    'loggers': {
        'time_slot_automation': {
            'handlers': ['automation_file', 'automation_console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.core.management.commands.maintain_booking_slots': {
            'handlers': ['automation_file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Optional: Celery configuration for more advanced scheduling
# Uncomment if you prefer Celery over cron jobs
"""
CELERY_BEAT_SCHEDULE = {
    'maintain-time-slots': {
        'task': 'apps.bookings.tasks.maintain_booking_slots_task',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
        'options': {'queue': 'maintenance'}
    },
    'weekly-slot-optimization': {
        'task': 'apps.bookings.tasks.optimize_booking_slots_task',
        'schedule': crontab(hour=3, minute=0, day_of_week=0),  # Sunday at 3 AM
        'options': {'queue': 'maintenance'}
    },
}

CELERY_TASK_ROUTES = {
    'apps.bookings.tasks.*': {'queue': 'maintenance'},
}
"""

# Environment-specific overrides
import os
from django.core.management.utils import get_random_secret_key

# Development settings
if os.environ.get('DJANGO_DEBUG', 'False').lower() == 'true':
    TIME_SLOT_AUTOMATION.update({
        'DRY_RUN_MODE': True,  # Safe mode for development
        'DAYS_AHEAD': 7,  # Shorter window for testing
        'LOG_LEVEL': 'DEBUG',
    })

# Production settings
if os.environ.get('DJANGO_ENV') == 'production':
    TIME_SLOT_AUTOMATION.update({
        'NOTIFY_ON_ERRORS': True,
        'NOTIFY_EMAIL': os.environ.get('ADMIN_EMAIL'),
        'LOG_TO_FILE': True,
    })

# Testing settings
if 'test' in sys.argv:
    TIME_SLOT_AUTOMATION.update({
        'ENABLED': False,  # Disable automation during tests
        'DRY_RUN_MODE': True,
    })
    
    # Disable cron jobs during testing
    CRONJOBS = []