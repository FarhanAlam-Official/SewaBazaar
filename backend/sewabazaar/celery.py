"""
Celery configuration for SewaBazaar project.
"""

import os
from celery import Celery
from celery.schedules import crontab

# Set default Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewabazaar.settings')

# Create Celery app
app = Celery('sewabazaar')

# Load configuration from Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()

# Define periodic tasks
app.conf.beat_schedule = {
    # Daily booking slot maintenance at 2:00 AM
    'maintain-booking-slots-daily': {
        'task': 'apps.bookings.tasks.maintain_booking_slots_task',
        'schedule': crontab(hour=2, minute=0),
        'kwargs': {'days_ahead': 30}
    },
    
    # Weekly extended slot optimization at 3:00 AM on Sundays
    'optimize-booking-slots-weekly': {
        'task': 'apps.bookings.tasks.optimize_booking_slots_task',
        'schedule': crontab(hour=3, minute=0, day_of_week=0),
        'kwargs': {'extended_days': 45}
    },
    
    # Monthly provider availability sync at 4:00 AM on 1st day of month
    'provider-availability-sync-monthly': {
        'task': 'apps.bookings.tasks.provider_availability_sync_task',
        'schedule': crontab(hour=4, minute=0, day_of_month=1),
        'kwargs': {}
    },
    
    # Daily system health check at 1:00 AM
    'health-check-daily': {
        'task': 'apps.bookings.tasks.health_check_task',
        'schedule': crontab(hour=1, minute=0),
    },
    
    # Daily auto-cancellation of expired bookings at 5:00 AM
    'auto-cancel-expired-bookings': {
        'task': 'apps.bookings.tasks.auto_cancel_expired_bookings_task',
        'schedule': crontab(hour=5, minute=0),
        'kwargs': {'grace_period': 1, 'dry_run': False}
    },
}

# Configure task queues
app.conf.task_routes = {
    'apps.bookings.tasks.*': {'queue': 'maintenance'},
    'apps.notifications.tasks.*': {'queue': 'notifications'},
    'apps.accounts.tasks.*': {'queue': 'accounts'},
}

# Configure task defaults
app.conf.task_default_queue = 'default'
app.conf.task_default_exchange = 'default'
app.conf.task_default_routing_key = 'default'

# Configure task execution settings
app.conf.task_time_limit = 60 * 5  # 5 minutes
app.conf.task_soft_time_limit = 60 * 4  # 4 minutes
app.conf.task_acks_late = True
app.conf.worker_prefetch_multiplier = 1

# Redis backend settings
app.conf.result_backend = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
app.conf.broker_url = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')

@app.task(bind=True)
def debug_task(self):
    """Debug task to verify Celery is working"""
    print(f'Request: {self.request!r}')
