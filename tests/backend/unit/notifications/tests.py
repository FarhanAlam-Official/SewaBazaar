import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
from unittest.mock import patch, MagicMock
import json
from datetime import datetime, timedelta
from django.utils import timezone

from backend.apps.notifications.models import Notification, UserNotificationSetting
from backend.apps.notifications.serializers import NotificationSerializer, UserNotificationSettingSerializer
from backend.apps.accounts.models import Profile

User = get_user_model()


class NotificationModelTest(TestCase):
    """Test cases for Notification model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@provider.com',
            username='testprovider',
            password='testpass123',
            role='provider'
        )
        # Profile is created automatically by signal
    
    def test_notification_creation(self):
        """Test creating a notification with all fields"""
        notification = Notification.objects.create(
            user=self.user,
            title='Test Notification',
            message='This is a test notification',
            notification_type='booking_request',
            type='booking_request',
            priority='high',
            action_required=True,
            action_url='/dashboard/bookings',
            data={'booking_id': 123}
        )
        
        self.assertEqual(notification.user, self.user)
        self.assertEqual(notification.title, 'Test Notification')
        self.assertEqual(notification.notification_type, 'booking_request')
        self.assertEqual(notification.type, 'booking_request')
        self.assertEqual(notification.priority, 'high')
        self.assertTrue(notification.action_required)
        self.assertEqual(notification.action_url, '/dashboard/bookings')
        self.assertEqual(notification.data['booking_id'], 123)
        self.assertFalse(notification.is_read)
    
    def test_notification_str_representation(self):
        """Test string representation of notification"""
        notification = Notification.objects.create(
            user=self.user,
            title='Test Notification',
            message='Test message',
            notification_type='system'
        )
        
        expected_str = f"system notification for {self.user.email}: Test Notification"
        self.assertEqual(str(notification), expected_str)
    
    def test_notification_ordering(self):
        """Test notifications are ordered by created_at descending"""
        # Create notifications with different timestamps
        old_notification = Notification.objects.create(
            user=self.user,
            title='Old Notification',
            message='Old message',
            notification_type='system'
        )
        old_notification.created_at = timezone.now() - timedelta(hours=1)
        old_notification.save()
        
        new_notification = Notification.objects.create(
            user=self.user,
            title='New Notification',
            message='New message',
            notification_type='system'
        )
        
        notifications = Notification.objects.all()
        self.assertEqual(notifications.first(), new_notification)
        self.assertEqual(notifications.last(), old_notification)
    
    def test_notification_save_sync_fields(self):
        """Test that save method syncs type and notification_type fields"""
        # Test setting notification_type syncs to type
        notification = Notification.objects.create(
            user=self.user,
            title='Test',
            message='Test',
            notification_type='payment'
        )
        self.assertEqual(notification.type, 'payment')
        
        # Test setting type syncs to notification_type
        notification2 = Notification.objects.create(
            user=self.user,
            title='Test2',
            message='Test2',
            type='review'
        )
        self.assertEqual(notification2.notification_type, 'review')


class UserNotificationSettingModelTest(TestCase):
    """Test cases for UserNotificationSetting model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@provider.com',
            username='testprovider',
            password='testpass123',
            role='provider'
        )
        # Profile is created automatically by signal
    
    def test_notification_setting_creation(self):
        """Test creating notification settings with default values"""
        settings = UserNotificationSetting.objects.create(user=self.user)
        
        # Test default values
        self.assertTrue(settings.email_enabled)
        self.assertTrue(settings.push_enabled)
        self.assertTrue(settings.email_notifications)
        self.assertTrue(settings.push_notifications)
        self.assertFalse(settings.sms_notifications)
        self.assertTrue(settings.booking_requests)
        self.assertTrue(settings.booking_updates)
        self.assertTrue(settings.payment_notifications)
        self.assertTrue(settings.review_notifications)
        self.assertTrue(settings.system_notifications)
        self.assertFalse(settings.marketing_notifications)
        self.assertTrue(settings.reminder_notifications)
    
    def test_notification_setting_str_representation(self):
        """Test string representation of notification settings"""
        settings = UserNotificationSetting.objects.create(user=self.user)
        expected_str = f"NotificationSettings({self.user.email})"
        self.assertEqual(str(settings), expected_str)
    
    def test_notification_setting_save_sync(self):
        """Test that save method syncs old and new fields"""
        settings = UserNotificationSetting.objects.create(
            user=self.user,
            email_enabled=False,
            push_enabled=False
        )
        
        # Check that new fields are synced
        self.assertFalse(settings.email_notifications)
        self.assertFalse(settings.push_notifications)


class NotificationAPITest(APITestCase):
    """Test cases for Notification API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@provider.com',
            username='testprovider',
            password='testpass123',
            role='provider'
        )
        # Profile is created automatically by signal
        
        self.other_user = User.objects.create_user(
            email='other@provider.com',
            username='otherprovider',
            password='testpass123',
            role='provider'
        )
        # Profile is created automatically by signal
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Create test notifications
        self.notification1 = Notification.objects.create(
            user=self.user,
            title='Test Notification 1',
            message='Test message 1',
            notification_type='booking_request',
            priority='high',
            is_read=False
        )
        
        self.notification2 = Notification.objects.create(
            user=self.user,
            title='Test Notification 2',
            message='Test message 2',
            notification_type='system',
            priority='medium',
            is_read=True
        )
        
        # Create notification for other user (should not be accessible)
        self.other_notification = Notification.objects.create(
            user=self.other_user,
            title='Other User Notification',
            message='Other message',
            notification_type='review'
        )
    
    def test_list_notifications(self):
        """Test listing notifications for authenticated user"""
        url = reverse('notification-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Only user's notifications
        
        # Check that other user's notification is not included
        notification_ids = [n['id'] for n in response.data]
        self.assertIn(self.notification1.id, notification_ids)
        self.assertIn(self.notification2.id, notification_ids)
        self.assertNotIn(self.other_notification.id, notification_ids)
    
    def test_filter_notifications_by_type(self):
        """Test filtering notifications by type"""
        url = reverse('notification-list')
        response = self.client.get(url, {'type': 'booking_request'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.notification1.id)
    
    def test_filter_notifications_by_read_status(self):
        """Test filtering notifications by read status"""
        url = reverse('notification-list')
        response = self.client.get(url, {'is_read': 'false'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.notification1.id)
        self.assertFalse(response.data[0]['is_read'])
    
    def test_update_notification_mark_as_read(self):
        """Test marking notification as read"""
        url = reverse('notification-detail', kwargs={'pk': self.notification1.pk})
        data = {'is_read': True}
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_read'])
        
        # Verify in database
        self.notification1.refresh_from_db()
        self.assertTrue(self.notification1.is_read)
    
    def test_delete_notification(self):
        """Test deleting a notification"""
        url = reverse('notification-detail', kwargs={'pk': self.notification1.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Notification.objects.filter(pk=self.notification1.pk).exists())
    
    def test_mark_all_as_read(self):
        """Test marking all notifications as read"""
        url = reverse('notification-mark-all-read')
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        
        # Verify all user's notifications are marked as read
        user_notifications = Notification.objects.filter(user=self.user)
        for notification in user_notifications:
            self.assertTrue(notification.is_read)
    
    def test_unread_count(self):
        """Test getting unread notification count"""
        url = reverse('notification-unread-count')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['unread_count'], 1)  # Only notification1 is unread
    
    def test_unauthorized_access(self):
        """Test that unauthenticated users cannot access notifications"""
        self.client.force_authenticate(user=None)
        url = reverse('notification-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_cannot_access_other_user_notifications(self):
        """Test that users cannot access other users' notifications"""
        url = reverse('notification-detail', kwargs={'pk': self.other_notification.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class NotificationPreferencesAPITest(APITestCase):
    """Test cases for Notification Preferences API"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@provider.com',
            username='testprovider',
            password='testpass123',
            role='provider'
        )
        # Profile is created automatically by signal
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_get_notification_preferences(self):
        """Test getting notification preferences"""
        url = reverse('notification-preferences')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that all preference fields are present
        expected_fields = [
            'email_notifications', 'push_notifications', 'sms_notifications',
            'booking_requests', 'booking_updates', 'payment_notifications',
            'review_notifications', 'system_notifications', 'marketing_notifications',
            'reminder_notifications', 'email_enabled', 'push_enabled', 'topics'
        ]
        
        for field in expected_fields:
            self.assertIn(field, response.data)
    
    def test_update_notification_preferences(self):
        """Test updating notification preferences"""
        url = reverse('notification-preferences')
        data = {
            'email_notifications': False,
            'push_notifications': True,
            'booking_requests': False,
            'marketing_notifications': True
        }
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['email_notifications'])
        self.assertTrue(response.data['push_notifications'])
        self.assertFalse(response.data['booking_requests'])
        self.assertTrue(response.data['marketing_notifications'])
        
        # Verify in database
        settings = UserNotificationSetting.objects.get(user=self.user)
        self.assertFalse(settings.email_notifications)
        self.assertTrue(settings.push_notifications)
        self.assertFalse(settings.booking_requests)
        self.assertTrue(settings.marketing_notifications)
    
    def test_preferences_created_automatically(self):
        """Test that preferences are created automatically if they don't exist"""
        # Ensure no preferences exist
        UserNotificationSetting.objects.filter(user=self.user).delete()
        
        url = reverse('notification-preferences')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify preferences were created
        self.assertTrue(UserNotificationSetting.objects.filter(user=self.user).exists())


class NotificationSerializerTest(TestCase):
    """Test cases for Notification serializers"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@provider.com',
            username='testprovider',
            password='testpass123',
            role='provider'
        )
        # Profile is created automatically by signal
    
    def test_notification_serializer(self):
        """Test NotificationSerializer"""
        notification = Notification.objects.create(
            user=self.user,
            title='Test Notification',
            message='Test message',
            notification_type='booking_request',
            type='booking_request',
            priority='high',
            action_required=True,
            action_url='/dashboard/bookings',
            data={'booking_id': 123}
        )
        
        serializer = NotificationSerializer(notification)
        data = serializer.data
        
        self.assertEqual(data['title'], 'Test Notification')
        self.assertEqual(data['message'], 'Test message')
        self.assertEqual(data['type'], 'booking_request')
        self.assertEqual(data['priority'], 'high')
        self.assertTrue(data['action_required'])
        self.assertEqual(data['action_url'], '/dashboard/bookings')
        self.assertEqual(data['data']['booking_id'], 123)
    
    def test_notification_serializer_type_fallback(self):
        """Test that serializer falls back to notification_type if type is None"""
        notification = Notification.objects.create(
            user=self.user,
            title='Test Notification',
            message='Test message',
            notification_type='system',
            type=None  # Explicitly set to None
        )
        
        serializer = NotificationSerializer(notification)
        data = serializer.data
        
        self.assertEqual(data['type'], 'system')
    
    def test_user_notification_setting_serializer(self):
        """Test UserNotificationSettingSerializer"""
        settings = UserNotificationSetting.objects.create(
            user=self.user,
            email_notifications=False,
            push_notifications=True,
            booking_requests=False
        )
        
        serializer = UserNotificationSettingSerializer(settings)
        data = serializer.data
        
        self.assertFalse(data['email_notifications'])
        self.assertTrue(data['push_notifications'])
        self.assertFalse(data['booking_requests'])
    
    def test_user_notification_setting_serializer_update(self):
        """Test updating notification settings through serializer"""
        settings = UserNotificationSetting.objects.create(user=self.user)
        
        data = {
            'email_notifications': False,
            'push_notifications': True,
            'booking_requests': False
        }
        
        serializer = UserNotificationSettingSerializer(settings, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
        updated_settings = serializer.save()
        
        self.assertFalse(updated_settings.email_notifications)
        self.assertTrue(updated_settings.push_notifications)
        self.assertFalse(updated_settings.booking_requests)
        
        # Check that old fields are synced
        self.assertFalse(updated_settings.email_enabled)
        self.assertTrue(updated_settings.push_enabled)


class NotificationSignalTest(TestCase):
    """Test cases for notification signals"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@provider.com',
            username='testprovider',
            password='testpass123',
            role='provider'
        )
        # Profile is created automatically by signal
    
    @patch('apps.notifications.signals.Notification.objects.create')
    def test_booking_status_change_creates_notification(self, mock_create):
        """Test that booking status changes create notifications"""
        # This would test the signal handlers, but since we don't have
        # the actual booking model integration here, we'll mock it
        from apps.notifications.signals import booking_status_changed
        
        # Create a mock booking instance
        mock_booking = MagicMock()
        mock_booking.service.title = 'Test Service'
        mock_booking.customer = self.user
        mock_booking.service.provider = self.user
        mock_booking.status = 'confirmed'
        mock_booking.id = 123
        
        # Test the signal handler directly
        booking_status_changed(sender=None, instance=mock_booking, created=False)
        
        # Verify notification was created
        self.assertTrue(mock_create.called)


class NotificationPerformanceTest(TestCase):
    """Test cases for notification performance"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@provider.com',
            username='testprovider',
            password='testpass123',
            role='provider'
        )
        # Profile is created automatically by signal
    
    def test_bulk_notification_creation(self):
        """Test creating many notifications efficiently"""
        notifications = []
        for i in range(100):
            notifications.append(Notification(
                user=self.user,
                title=f'Notification {i}',
                message=f'Message {i}',
                notification_type='system'
            ))
        
        # Bulk create should be efficient
        created_notifications = Notification.objects.bulk_create(notifications)
        self.assertEqual(len(created_notifications), 100)
    
    def test_notification_query_performance(self):
        """Test that notification queries are efficient"""
        # Create many notifications
        notifications = []
        for i in range(50):
            notifications.append(Notification(
                user=self.user,
                title=f'Notification {i}',
                message=f'Message {i}',
                notification_type='system',
                is_read=(i % 2 == 0)  # Half read, half unread
            ))
        
        Notification.objects.bulk_create(notifications)
        
        # Test that queries are efficient (should use indexes)
        with self.assertNumQueries(1):
            unread_count = Notification.objects.filter(user=self.user, is_read=False).count()
            self.assertEqual(unread_count, 25)
        
        with self.assertNumQueries(1):
            recent_notifications = list(Notification.objects.filter(user=self.user)[:10])
            self.assertEqual(len(recent_notifications), 10)


if __name__ == '__main__':
    pytest.main([__file__])