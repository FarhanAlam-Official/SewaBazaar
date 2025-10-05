"""
Management command to test message notification preferences.

This command tests that message notifications respect user preferences
and are not sent when disabled by the user.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.messaging.models import Conversation, Message
from apps.services.models import Service
from apps.notifications.models import Notification, UserNotificationSetting

User = get_user_model()


class Command(BaseCommand):
    help = 'Test message notification preferences'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Testing message notification preferences...'))

        try:
            # Find test users
            customer = User.objects.filter(role='customer').first()
            provider = User.objects.filter(role='provider').first()
            
            if not customer or not provider:
                self.stdout.write(self.style.ERROR('Need at least one customer and one provider'))
                return

            # Get or create notification settings for provider
            settings, created = UserNotificationSetting.objects.get_or_create(
                user=provider,
                defaults={
                    'message_notifications': True
                }
            )

            if created:
                self.stdout.write(f'Created notification settings for {provider.email}')
            
            # Test with notifications enabled
            self.stdout.write('\n1. Testing with message notifications ENABLED...')
            settings.message_notifications = True
            settings.save()

            service = Service.objects.filter(provider=provider).first()
            conversation, _ = Conversation.objects.get_or_create(
                service=service,
                provider=provider,
                customer=customer,
                defaults={'is_active': True}
            )

            # Count notifications before
            count_before = Notification.objects.filter(user=provider, type='message').count()

            # Create message
            Message.objects.create(
                conversation=conversation,
                sender=customer,
                message_type='text',
                text='Test message with notifications enabled'
            )

            # Count notifications after
            count_after = Notification.objects.filter(user=provider, type='message').count()

            if count_after > count_before:
                self.stdout.write(self.style.SUCCESS('✓ Notification created when enabled'))
            else:
                self.stdout.write(self.style.ERROR('✗ No notification created when enabled'))

            # Test with notifications disabled
            self.stdout.write('\n2. Testing with message notifications DISABLED...')
            settings.message_notifications = False
            settings.save()

            # Count notifications before
            count_before = Notification.objects.filter(user=provider, type='message').count()

            # Create message
            Message.objects.create(
                conversation=conversation,
                sender=customer,
                message_type='text',
                text='Test message with notifications disabled'
            )

            # Count notifications after
            count_after = Notification.objects.filter(user=provider, type='message').count()

            if count_after == count_before:
                self.stdout.write(self.style.SUCCESS('✓ No notification created when disabled'))
            else:
                self.stdout.write(self.style.ERROR('✗ Notification created when disabled'))

            # Reset to enabled
            settings.message_notifications = True
            settings.save()

            self.stdout.write(self.style.SUCCESS('\nMessage notification preferences test completed!'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Test failed: {str(e)}'))
            import traceback
            traceback.print_exc()