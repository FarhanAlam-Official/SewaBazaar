from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
import random

from apps.notifications.models import Notification, UserNotificationSetting
from apps.bookings.models import Booking
from apps.services.models import Service

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample notifications for testing the notification system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=20,
            help='Number of notifications to create per user (default: 20)'
        )
        parser.add_argument(
            '--users',
            type=str,
            help='Comma-separated list of user emails to create notifications for (default: all providers)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing notifications before creating new ones'
        )

    def handle(self, *args, **options):
        count = options['count']
        user_emails = options['users']
        clear_existing = options['clear']

        # Get target users
        if user_emails:
            emails = [email.strip() for email in user_emails.split(',')]
            users = User.objects.filter(email__in=emails)
            if not users.exists():
                self.stdout.write(
                    self.style.ERROR(f'No users found with emails: {", ".join(emails)}')
                )
                return
        else:
            # Get all provider users
            users = User.objects.filter(role='provider')
            if not users.exists():
                self.stdout.write(
                    self.style.ERROR('No provider users found. Please create some provider accounts first.')
                )
                return

        # Clear existing notifications if requested
        if clear_existing:
            deleted_count = Notification.objects.filter(user__in=users).delete()[0]
            self.stdout.write(
                self.style.SUCCESS(f'Cleared {deleted_count} existing notifications')
            )

        # Create notification preferences for users who don't have them
        for user in users:
            UserNotificationSetting.objects.get_or_create(
                user=user,
                defaults={
                    'email_notifications': True,
                    'push_notifications': True,
                    'sms_notifications': False,
                    'booking_requests': True,
                    'booking_updates': True,
                    'payment_notifications': True,
                    'review_notifications': True,
                    'system_notifications': True,
                    'marketing_notifications': False,
                    'reminder_notifications': True,
                }
            )

        # Sample notification templates
        notification_templates = {
            'booking_request': [
                {
                    'title': 'New Booking Request',
                    'message': 'You have received a new booking request for {service_name} on {date}.',
                    'action_required': True,
                    'action_url': '/dashboard/provider/bookings',
                    'priority': 'high'
                },
                {
                    'title': 'Urgent Booking Request',
                    'message': 'Customer {customer_name} wants to book {service_name} for tomorrow.',
                    'action_required': True,
                    'action_url': '/dashboard/provider/bookings',
                    'priority': 'high'
                },
                {
                    'title': 'Weekend Booking Request',
                    'message': 'New weekend booking request for {service_name}. Premium rates apply.',
                    'action_required': True,
                    'action_url': '/dashboard/provider/bookings',
                    'priority': 'medium'
                }
            ],
            'booking_update': [
                {
                    'title': 'Booking Confirmed',
                    'message': 'Your booking for {service_name} has been confirmed by the customer.',
                    'action_required': False,
                    'action_url': '/dashboard/provider/bookings',
                    'priority': 'medium'
                },
                {
                    'title': 'Booking Cancelled',
                    'message': 'Customer has cancelled their booking for {service_name}.',
                    'action_required': False,
                    'action_url': '/dashboard/provider/bookings',
                    'priority': 'medium'
                },
                {
                    'title': 'Booking Rescheduled',
                    'message': 'Customer has requested to reschedule {service_name} booking.',
                    'action_required': True,
                    'action_url': '/dashboard/provider/bookings',
                    'priority': 'medium'
                }
            ],
            'review': [
                {
                    'title': 'New 5-Star Review!',
                    'message': 'You received an excellent 5-star review for {service_name}!',
                    'action_required': False,
                    'action_url': '/dashboard/provider/reviews',
                    'priority': 'low'
                },
                {
                    'title': 'New Review Received',
                    'message': 'Customer left a {rating}-star review for {service_name}.',
                    'action_required': False,
                    'action_url': '/dashboard/provider/reviews',
                    'priority': 'low'
                },
                {
                    'title': 'Review Response Needed',
                    'message': 'Customer left feedback on {service_name}. Consider responding.',
                    'action_required': True,
                    'action_url': '/dashboard/provider/reviews',
                    'priority': 'medium'
                }
            ],
            'payment': [
                {
                    'title': 'Payment Received',
                    'message': 'You received ₹{amount} payment for {service_name}.',
                    'action_required': False,
                    'action_url': '/dashboard/provider/earnings',
                    'priority': 'medium'
                },
                {
                    'title': 'Payout Processed',
                    'message': 'Your weekly payout of ₹{amount} has been processed.',
                    'action_required': False,
                    'action_url': '/dashboard/provider/earnings',
                    'priority': 'medium'
                },
                {
                    'title': 'Payment Pending',
                    'message': 'Payment for {service_name} is pending customer confirmation.',
                    'action_required': False,
                    'action_url': '/dashboard/provider/earnings',
                    'priority': 'low'
                }
            ],
            'system': [
                {
                    'title': 'Profile Verification Complete',
                    'message': 'Your provider profile has been verified and approved!',
                    'action_required': False,
                    'action_url': '/dashboard/provider/profile',
                    'priority': 'medium'
                },
                {
                    'title': 'New Feature Available',
                    'message': 'Check out the new analytics dashboard to track your performance.',
                    'action_required': False,
                    'action_url': '/dashboard/provider/analytics',
                    'priority': 'low'
                },
                {
                    'title': 'System Maintenance',
                    'message': 'Scheduled maintenance tonight from 2-4 AM. Services may be affected.',
                    'action_required': False,
                    'action_url': None,
                    'priority': 'medium'
                },
                {
                    'title': 'Security Alert',
                    'message': 'New login detected from unknown device. Please verify if this was you.',
                    'action_required': True,
                    'action_url': '/dashboard/provider/profile',
                    'priority': 'high'
                }
            ],
            'reminder': [
                {
                    'title': 'Upcoming Booking',
                    'message': 'You have a booking for {service_name} tomorrow at {time}.',
                    'action_required': False,
                    'action_url': '/dashboard/provider/bookings',
                    'priority': 'medium'
                },
                {
                    'title': 'Update Your Availability',
                    'message': 'Remember to update your availability for next week.',
                    'action_required': True,
                    'action_url': '/dashboard/provider/schedule',
                    'priority': 'low'
                },
                {
                    'title': 'Complete Your Profile',
                    'message': 'Add more photos to your portfolio to attract more customers.',
                    'action_required': True,
                    'action_url': '/dashboard/provider/profile',
                    'priority': 'low'
                }
            ]
        }

        # Sample data for message formatting
        service_names = [
            'House Cleaning', 'Plumbing Repair', 'Electrical Work', 'Gardening',
            'AC Repair', 'Painting', 'Carpentry', 'Appliance Repair'
        ]
        customer_names = [
            'John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson',
            'David Brown', 'Lisa Davis', 'Tom Anderson', 'Emma Taylor'
        ]
        amounts = ['1500', '2500', '3200', '1800', '4500', '2100', '3800', '2900']
        ratings = ['4', '5', '3', '4', '5']
        times = ['10:00 AM', '2:00 PM', '4:30 PM', '9:00 AM', '11:30 AM']

        notifications_created = 0

        for user in users:
            self.stdout.write(f'Creating notifications for {user.email}...')
            
            user_notifications = []
            
            for _ in range(count):
                # Choose random notification type
                notification_type = random.choice(list(notification_templates.keys()))
                template = random.choice(notification_templates[notification_type])
                
                # Format message with sample data
                message = template['message'].format(
                    service_name=random.choice(service_names),
                    customer_name=random.choice(customer_names),
                    amount=random.choice(amounts),
                    rating=random.choice(ratings),
                    time=random.choice(times),
                    date=(timezone.now() + timedelta(days=random.randint(1, 7))).strftime('%B %d')
                )
                
                # Create notification data
                notification_data = {
                    'booking_id': random.randint(1, 100),
                    'service_id': random.randint(1, 20),
                    'customer_id': random.randint(1, 50)
                }
                
                # Random created time (last 30 days)
                created_at = timezone.now() - timedelta(
                    days=random.randint(0, 30),
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59)
                )
                
                notification = Notification(
                    user=user,
                    title=template['title'],
                    message=message,
                    notification_type=notification_type,
                    type=notification_type,
                    is_read=random.choice([True, False, False, False]),  # 25% chance of being read
                    data=notification_data,
                    action_required=template['action_required'],
                    action_url=template['action_url'],
                    priority=template['priority'],
                    created_at=created_at
                )
                
                user_notifications.append(notification)
            
            # Bulk create notifications for this user
            Notification.objects.bulk_create(user_notifications)
            notifications_created += len(user_notifications)
            
            self.stdout.write(
                self.style.SUCCESS(f'Created {len(user_notifications)} notifications for {user.email}')
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully created {notifications_created} notifications for {len(users)} users!'
            )
        )
        
        # Show summary statistics
        total_notifications = Notification.objects.count()
        unread_notifications = Notification.objects.filter(is_read=False).count()
        
        self.stdout.write('\n' + '='*50)
        self.stdout.write('NOTIFICATION SUMMARY')
        self.stdout.write('='*50)
        self.stdout.write(f'Total notifications in system: {total_notifications}')
        self.stdout.write(f'Unread notifications: {unread_notifications}')
        self.stdout.write(f'Read notifications: {total_notifications - unread_notifications}')
        
        # Show breakdown by type
        self.stdout.write('\nBreakdown by type:')
        for notification_type in notification_templates.keys():
            count = Notification.objects.filter(notification_type=notification_type).count()
            self.stdout.write(f'  {notification_type}: {count}')
        
        # Show breakdown by priority
        self.stdout.write('\nBreakdown by priority:')
        for priority in ['high', 'medium', 'low']:
            count = Notification.objects.filter(priority=priority).count()
            self.stdout.write(f'  {priority}: {count}')
        
        self.stdout.write('\n' + '='*50)
        self.stdout.write('API TESTING ENDPOINTS')
        self.stdout.write('='*50)
        self.stdout.write('Test these endpoints in your browser or API client:')
        self.stdout.write('• GET /api/notifications/ - List all notifications')
        self.stdout.write('• GET /api/notifications/?type=booking_request - Filter by type')
        self.stdout.write('• GET /api/notifications/?is_read=false - Filter unread')
        self.stdout.write('• GET /api/notifications/unread_count/ - Get unread count')
        self.stdout.write('• GET /api/notifications/preferences/ - Get preferences')
        self.stdout.write('• PATCH /api/notifications/{id}/ - Mark as read')
        self.stdout.write('• POST /api/notifications/mark-all-read/ - Mark all as read')
        self.stdout.write('• DELETE /api/notifications/{id}/ - Delete notification')
        self.stdout.write('='*50)