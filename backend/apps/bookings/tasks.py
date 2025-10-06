"""
CELERY TASKS FOR TIME SLOT AUTOMATION

Alternative to cron jobs using Celery for more advanced scheduling and monitoring.
Provides better error handling, retry logic, and monitoring capabilities.

Features:
- Automatic retry on failures
- Dead letter queue for failed tasks
- Task monitoring and logging
- Distributed task execution
- Priority queues for different maintenance types

Setup:
1. pip install celery redis
2. Configure Redis as message broker
3. Add celery configuration to settings.py
4. Start celery worker and beat scheduler

This module contains Celery tasks for automating time slot maintenance operations
including daily maintenance, weekly optimization, provider synchronization, 
health checks, and emergency slot generation.
"""

from celery import shared_task
from celery.utils.log import get_task_logger
from django.core.management import call_command
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta, date
import traceback
import os

logger = get_task_logger(__name__)


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={'max_retries': 3, 'countdown': 300},  # Retry 3 times, wait 5 minutes
    name='maintain_booking_slots_task'
)
def maintain_booking_slots_task(self, days_ahead=30, dry_run=False, provider_id=None):
    """
    Daily time slot maintenance task.
    
    This task performs daily maintenance of booking slots, including cleanup of expired
    slots and generation of new slots for the specified number of days ahead.
    
    Args:
        days_ahead (int): Number of days ahead to maintain slots (default: 30)
        dry_run (bool): Run in dry-run mode without making changes (default: False)
        provider_id (int): Specific provider ID to process (optional)
    
    Returns:
        dict: Task execution results containing status, timing information, and parameters used
        
    Example:
        >>> maintain_booking_slots_task.delay(30, False, 123)
        {'status': 'success', 'task_id': '...', 'duration_seconds': 15.2, ...}
    """
    task_start = timezone.now()
    logger.info(f"Starting time slot maintenance task - Task ID: {self.request.id}")
    
    try:
        # Prepare command arguments
        cmd_args = ['maintain_booking_slots']
        cmd_kwargs = {
            'days_ahead': days_ahead,
            'verbosity': 2
        }
        
        if dry_run:
            cmd_kwargs['dry_run'] = True
            
        if provider_id:
            cmd_kwargs['provider_id'] = provider_id
        
        # Execute maintenance command
        call_command(*cmd_args, **cmd_kwargs)
        
        task_end = timezone.now()
        duration = (task_end - task_start).total_seconds()
        
        result = {
            'status': 'success',
            'task_id': self.request.id,
            'started_at': task_start.isoformat(),
            'completed_at': task_end.isoformat(),
            'duration_seconds': duration,
            'days_ahead': days_ahead,
            'dry_run': dry_run,
            'provider_id': provider_id
        }
        
        logger.info(f"Time slot maintenance completed successfully in {duration:.2f}s")
        return result
        
    except Exception as exc:
        task_end = timezone.now()
        duration = (task_end - task_start).total_seconds()
        
        error_details = {
            'status': 'error',
            'task_id': self.request.id,
            'started_at': task_start.isoformat(),
            'failed_at': task_end.isoformat(),
            'duration_seconds': duration,
            'error_message': str(exc),
            'error_traceback': traceback.format_exc(),
            'retry_count': self.request.retries
        }
        
        logger.error(f"Time slot maintenance failed: {str(exc)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Send notification on failure (if configured)
        send_maintenance_alert.delay(
            alert_type='error',
            message=f"Time slot maintenance failed: {str(exc)}",
            details=error_details
        )
        
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={'max_retries': 2, 'countdown': 600},  # Retry 2 times, wait 10 minutes
    name='optimize_booking_slots_task'
)
def optimize_booking_slots_task(self, extended_days=45):
    """
    Weekly time slot optimization task.
    
    This task performs extended maintenance operations including weekly slot optimization
    and additional slot generation for a longer time horizon.
    
    Args:
        extended_days (int): Extended days for optimization (default: 45)
    
    Returns:
        dict: Optimization results containing status, timing information, and parameters used
        
    Example:
        >>> optimize_booking_slots_task.delay(45)
        {'status': 'success', 'task_id': '...', 'duration_seconds': 45.7, ...}
    """
    task_start = timezone.now()
    logger.info(f"Starting weekly time slot optimization - Task ID: {self.request.id}")
    
    try:
        # Run extended maintenance
        call_command(
            'maintain_booking_slots',
            days_ahead=extended_days,
            verbosity=2
        )
        
        # Run additional optimization
        call_command(
            'generate_booking_slots',
            days=extended_days,
            verbosity=1
        )
        
        task_end = timezone.now()
        duration = (task_end - task_start).total_seconds()
        
        result = {
            'status': 'success',
            'task_id': self.request.id,
            'type': 'weekly_optimization',
            'started_at': task_start.isoformat(),
            'completed_at': task_end.isoformat(),
            'duration_seconds': duration,
            'extended_days': extended_days
        }
        
        logger.info(f"Weekly optimization completed successfully in {duration:.2f}s")
        return result
        
    except Exception as exc:
        logger.error(f"Weekly optimization failed: {str(exc)}")
        
        # Send alert
        send_maintenance_alert.delay(
            alert_type='optimization_error',
            message=f"Weekly slot optimization failed: {str(exc)}",
            details={'task_id': self.request.id, 'error': str(exc)}
        )
        
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    name='provider_availability_sync_task'
)
def provider_availability_sync_task(self, provider_id=None):
    """
    Monthly provider availability synchronization task.
    
    This task synchronizes provider availability settings and generates booking slots
    based on provider schedules for an extended time period.
    
    Args:
        provider_id (int): Specific provider to sync (optional)
    
    Returns:
        dict: Sync results containing status, timing information, and parameters used
        
    Example:
        >>> provider_availability_sync_task.delay(123)
        {'status': 'success', 'task_id': '...', 'duration_seconds': 22.1, ...}
    """
    task_start = timezone.now()
    logger.info(f"Starting provider availability sync - Task ID: {self.request.id}")
    
    try:
        cmd_kwargs = {
            'days': 60,  # Generate 2 months ahead
            'verbosity': 1
        }
        
        if provider_id:
            cmd_kwargs['provider_id'] = provider_id
        
        call_command('generate_booking_slots', **cmd_kwargs)
        
        task_end = timezone.now()
        duration = (task_end - task_start).total_seconds()
        
        result = {
            'status': 'success',
            'task_id': self.request.id,
            'type': 'availability_sync',
            'started_at': task_start.isoformat(),
            'completed_at': task_end.isoformat(),
            'duration_seconds': duration,
            'provider_id': provider_id
        }
        
        logger.info(f"Provider availability sync completed in {duration:.2f}s")
        return result
        
    except Exception as exc:
        logger.error(f"Provider availability sync failed: {str(exc)}")
        raise self.retry(exc=exc)


@shared_task(name='send_maintenance_alert')
def send_maintenance_alert(alert_type, message, details=None):
    """
    Send maintenance alerts via email and/or Slack.
    
    This task sends notifications about maintenance operations and system alerts
    through configured communication channels.
    
    Args:
        alert_type (str): Type of alert (error, warning, info, optimization_error)
        message (str): Alert message describing the issue or event
        details (dict): Additional details about the alert (optional)
        
    Example:
        >>> send_maintenance_alert.delay('error', 'Slot generation failed', {'error': 'Database timeout'})
    """
    try:
        # Email notification
        admin_email = getattr(settings, 'TIME_SLOT_AUTOMATION', {}).get('NOTIFY_EMAIL')
        if admin_email and getattr(settings, 'TIME_SLOT_AUTOMATION', {}).get('NOTIFY_ON_ERRORS', False):
            send_email_alert(alert_type, message, details, admin_email)
        
        # Slack notification
        slack_webhook = getattr(settings, 'TIME_SLOT_AUTOMATION', {}).get('SLACK_WEBHOOK')
        if slack_webhook:
            send_slack_alert(alert_type, message, details, slack_webhook)
            
        logger.info(f"Maintenance alert sent: {alert_type} - {message}")
        
    except Exception as exc:
        logger.error(f"Failed to send maintenance alert: {str(exc)}")


def send_email_alert(alert_type, message, details, admin_email):
    """
    Send email alert notification.
    
    Sends an email notification with alert details to the configured admin email address.
    
    Args:
        alert_type (str): Type of alert
        message (str): Alert message
        details (dict): Additional alert details
        admin_email (str): Email address to send alert to
    """
    from django.core.mail import send_mail
    from django.conf import settings
    
    subject = f"SewaBazaar Time Slot Maintenance Alert - {alert_type.upper()}"
    
    email_body = f"""
Time Slot Maintenance Alert

Type: {alert_type.upper()}
Message: {message}
Timestamp: {timezone.now()}

Details:
{details or 'No additional details'}

---
SewaBazaar Automated Maintenance System
"""
    
    send_mail(
        subject=subject,
        message=email_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[admin_email],
        fail_silently=False
    )


def send_slack_alert(alert_type, message, details, webhook_url):
    """
    Send Slack alert notification.
    
    Sends a formatted Slack message to the configured webhook URL with alert details.
    
    Args:
        alert_type (str): Type of alert
        message (str): Alert message
        details (dict): Additional alert details
        webhook_url (str): Slack webhook URL
    """
    import requests
    
    color_map = {
        'error': '#FF0000',
        'warning': '#FFA500', 
        'info': '#00FF00',
        'optimization_error': '#FF4500'
    }
    
    slack_payload = {
        "attachments": [
            {
                "color": color_map.get(alert_type, '#808080'),
                "title": f"Time Slot Maintenance Alert - {alert_type.upper()}",
                "text": message,
                "fields": [
                    {
                        "title": "Timestamp",
                        "value": timezone.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "short": True
                    },
                    {
                        "title": "System",
                        "value": "SewaBazaar",
                        "short": True
                    }
                ],
                "footer": "Automated Maintenance System"
            }
        ]
    }
    
    if details:
        slack_payload["attachments"][0]["fields"].append({
            "title": "Details",
            "value": str(details)[:1000],  # Limit details length
            "short": False
        })
    
    requests.post(webhook_url, json=slack_payload, timeout=10)


@shared_task(name='health_check_task')
def health_check_task():
    """
    System health check for time slot automation.
    
    Performs a comprehensive health check of the time slot automation system,
    including coverage metrics, slot availability, and provider configuration status.
    
    Returns:
        dict: Health check results containing system status and metrics
        
    Example:
        >>> health_check_task.delay()
        {'status': 'healthy', 'coverage_percentage': 95.2, 'total_future_slots': 1250, ...}
    """
    from apps.bookings.models import BookingSlot, ProviderAvailability
    from apps.services.models import Service
    
    try:
        health_data = {}
        
        # Check slot coverage
        today = date.today()
        future_30_days = today + timedelta(days=30)
        
        total_services = Service.objects.filter(status='active').count()
        services_with_slots = BookingSlot.objects.filter(
            date__gte=today,
            date__lte=future_30_days,
            service__status='active'
        ).values('service').distinct().count()
        
        coverage_percentage = (services_with_slots / total_services * 100) if total_services > 0 else 0
        
        health_data.update({
            'timestamp': timezone.now().isoformat(),
            'total_active_services': total_services,
            'services_with_slots': services_with_slots,
            'coverage_percentage': round(coverage_percentage, 1),
            'total_future_slots': BookingSlot.objects.filter(
                date__gte=today,
                date__lte=future_30_days,
                is_available=True
            ).count(),
            'providers_with_availability': ProviderAvailability.objects.values('provider').distinct().count()
        })
        
        # Check for issues
        issues = []
        if coverage_percentage < 50:
            issues.append("Low service coverage - many services missing slots")
        
        if health_data['total_future_slots'] < 100:
            issues.append("Very low slot availability")
        
        health_data['issues'] = issues
        health_data['status'] = 'healthy' if not issues else 'warning'
        
        # Send alert if there are issues
        if issues:
            send_maintenance_alert.delay(
                alert_type='warning',
                message=f"Time slot system health issues detected: {', '.join(issues)}",
                details=health_data
            )
        
        logger.info(f"Health check completed - Status: {health_data['status']}")
        return health_data
        
    except Exception as exc:
        logger.error(f"Health check failed: {str(exc)}")
        return {
            'status': 'error',
            'error': str(exc),
            'timestamp': timezone.now().isoformat()
        }


# Emergency maintenance tasks
@shared_task(name='emergency_slot_generation')
def emergency_slot_generation(service_id, days_ahead=7):
    """
    Emergency slot generation for specific service.
    
    Generates booking slots immediately for a specific service when normal
    generation processes have failed or when urgent slot availability is needed.
    
    Args:
        service_id (int): Service ID that needs immediate slots
        days_ahead (int): Days ahead to generate (default: 7)
        
    Example:
        >>> emergency_slot_generation.delay(123, 7)
    """
    logger.info(f"Emergency slot generation for service {service_id}")
    
    try:
        call_command(
            'maintain_time_slots',
            service_id=service_id,
            days_ahead=days_ahead,
            verbosity=2
        )
        
        send_maintenance_alert.delay(
            alert_type='info',
            message=f"Emergency slot generation completed for service {service_id}",
            details={'service_id': service_id, 'days_ahead': days_ahead}
        )
        
    except Exception as exc:
        logger.error(f"Emergency slot generation failed: {str(exc)}")
        raise


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={'max_retries': 3, 'countdown': 300},  # Retry 3 times, wait 5 minutes
    name='auto_cancel_expired_bookings_task'
)
def auto_cancel_expired_bookings_task(self, grace_period=1, dry_run=False):
    """
    Auto-cancel bookings that have passed their scheduled date.
    
    Automatically cancels bookings that have not been completed and have passed
    their scheduled service date by the specified grace period.
    
    Args:
        grace_period (int): Days to wait after booking date before cancelling (default: 1)
        dry_run (bool): Run in dry-run mode without making changes (default: False)
    
    Returns:
        dict: Task execution results containing status, timing information, and parameters used
        
    Example:
        >>> auto_cancel_expired_bookings_task.delay(1, False)
        {'status': 'success', 'task_id': '...', 'duration_seconds': 8.3, ...}
    """
    task_start = timezone.now()
    logger.info(f"Starting expired booking cancellation task - Task ID: {self.request.id}")
    
    try:
        # Prepare command arguments
        cmd_args = ['auto_cancel_expired_bookings']
        cmd_kwargs = {
            'grace_period': grace_period,
            'verbosity': 2
        }
        
        if dry_run:
            cmd_kwargs['dry_run'] = True
        
        # Execute command
        call_command(*cmd_args, **cmd_kwargs)
        
        task_end = timezone.now()
        duration = (task_end - task_start).total_seconds()
        
        result = {
            'status': 'success',
            'task_id': self.request.id,
            'started_at': task_start.isoformat(),
            'completed_at': task_end.isoformat(),
            'duration_seconds': duration,
            'grace_period': grace_period,
            'dry_run': dry_run
        }
        
        logger.info(f"Expired booking cancellation completed successfully in {duration:.2f}s")
        return result
        
    except Exception as exc:
        task_end = timezone.now()
        duration = (task_end - task_start).total_seconds()
        
        error_details = {
            'status': 'error',
            'task_id': self.request.id,
            'started_at': task_start.isoformat(),
            'failed_at': task_end.isoformat(),
            'duration_seconds': duration,
            'error_message': str(exc),
            'error_traceback': traceback.format_exc(),
            'retry_count': self.request.retries
        }
        
        logger.error(f"Expired booking cancellation failed: {str(exc)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Send notification on failure
        send_maintenance_alert.delay(
            alert_type='error',
            message=f"Expired booking cancellation failed: {str(exc)}",
            details=error_details
        )
        
        raise self.retry(exc=exc)