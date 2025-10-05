"""
Management command to test message notifications.

This command creates a test message to verify that message notifications
are being generated correctly when a new message is sent.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.messaging.models import Conversation, Message
from apps.services.models import Service
from apps.notifications.models import Notification

User = get_user_model()


class Command(BaseCommand):
    help = 'Test message notifications by creating a sample message'

    def add_arguments(self, parser):
        parser.add_argument(
            '--cleanup',
            action='store_true',
            help='Clean up test data after creating it',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Testing message notifications...'))

        try:
            # Find or create test users
            try:
                customer = User.objects.filter(role='customer').first()
                provider = User.objects.filter(role='provider').first()
                
                if not customer or not provider:
                    self.stdout.write(self.style.ERROR('Need at least one customer and one provider to test'))
                    return

                self.stdout.write(f'Customer: {customer.email}')
                self.stdout.write(f'Provider: {provider.email}')

                # Find a service from the provider
                service = Service.objects.filter(provider=provider).first()
                if not service:
                    self.stdout.write(self.style.ERROR(f'Provider {provider.email} has no services'))
                    return

                self.stdout.write(f'Service: {service.title}')

                # Create or get conversation
                conversation, created = Conversation.objects.get_or_create(
                    service=service,
                    provider=provider,
                    customer=customer,
                    defaults={
                        'is_active': True
                    }
                )

                if created:
                    self.stdout.write(self.style.SUCCESS(f'Created new conversation: {conversation.id}'))
                else:
                    self.stdout.write(f'Using existing conversation: {conversation.id}')

                # Count existing notifications before
                notification_count_before = Notification.objects.filter(
                    user=provider, 
                    type='message'
                ).count()

                # Create a test message from customer to provider
                message = Message.objects.create(
                    conversation=conversation,
                    sender=customer,
                    message_type='text',
                    text='This is a test message to check if notifications work correctly!'
                )

                self.stdout.write(self.style.SUCCESS(f'Created test message: {message.id}'))

                # Count notifications after
                notification_count_after = Notification.objects.filter(
                    user=provider, 
                    type='message'
                ).count()

                # Check if notification was created
                if notification_count_after > notification_count_before:
                    latest_notification = Notification.objects.filter(
                        user=provider, 
                        type='message'
                    ).order_by('-created_at').first()

                    self.stdout.write(self.style.SUCCESS(
                        f'✓ Message notification created successfully!'
                    ))
                    self.stdout.write(f'  - Notification ID: {latest_notification.id}')
                    self.stdout.write(f'  - Title: {latest_notification.title}')
                    self.stdout.write(f'  - Message: {latest_notification.message}')
                    self.stdout.write(f'  - Recipient: {latest_notification.user.email}')
                    self.stdout.write(f'  - Data: {latest_notification.data}')
                else:
                    self.stdout.write(self.style.ERROR('✗ No notification was created'))

                # Cleanup if requested
                if options['cleanup']:
                    message.delete()
                    if created:
                        conversation.delete()
                    if notification_count_after > notification_count_before:
                        latest_notification.delete()
                    self.stdout.write(self.style.WARNING('Test data cleaned up'))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error during test: {str(e)}'))
                import traceback
                traceback.print_exc()

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to test message notifications: {str(e)}'))