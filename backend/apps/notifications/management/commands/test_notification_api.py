from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.test import Client
from django.urls import reverse
import json

User = get_user_model()

class Command(BaseCommand):
    help = 'Test notification API endpoints'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user',
            type=str,
            help='Email of user to test with (default: first provider user)'
        )

    def handle(self, *args, **options):
        user_email = options['user']
        
        # Get test user
        if user_email:
            try:
                user = User.objects.get(email=user_email)
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'User with email {user_email} not found')
                )
                return
        else:
            user = User.objects.filter(role='provider').first()
            if not user:
                self.stdout.write(
                    self.style.ERROR('No provider users found')
                )
                return

        self.stdout.write(f'Testing API endpoints for user: {user.email}')
        self.stdout.write('='*60)

        # Create a test client and login
        client = Client()
        client.force_login(user)

        # Test endpoints
        endpoints = [
            {
                'name': 'List all notifications',
                'method': 'GET',
                'url': '/api/notifications/',
                'expected_keys': ['id', 'title', 'message', 'type', 'is_read', 'priority', 'created_at']
            },
            {
                'name': 'Filter by type (booking_request)',
                'method': 'GET',
                'url': '/api/notifications/?type=booking_request',
                'expected_keys': ['id', 'title', 'message', 'type', 'is_read', 'priority', 'created_at']
            },
            {
                'name': 'Filter unread notifications',
                'method': 'GET',
                'url': '/api/notifications/?is_read=false',
                'expected_keys': ['id', 'title', 'message', 'type', 'is_read', 'priority', 'created_at']
            },
            {
                'name': 'Get unread count',
                'method': 'GET',
                'url': '/api/notifications/unread_count/',
                'expected_keys': ['unread_count']
            },
            {
                'name': 'Get notification preferences',
                'method': 'GET',
                'url': '/api/notifications/preferences/',
                'expected_keys': ['email_notifications', 'push_notifications', 'booking_requests']
            }
        ]

        for endpoint in endpoints:
            self.stdout.write(f"\nTesting: {endpoint['name']}")
            self.stdout.write(f"URL: {endpoint['url']}")
            
            try:
                if endpoint['method'] == 'GET':
                    response = client.get(endpoint['url'])
                elif endpoint['method'] == 'POST':
                    response = client.post(endpoint['url'])
                elif endpoint['method'] == 'PATCH':
                    response = client.patch(endpoint['url'])
                
                self.stdout.write(f"Status Code: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Check if it's a list or single object
                    if isinstance(data, list):
                        if data:
                            item = data[0]
                            self.stdout.write(f"Items returned: {len(data)}")
                            self.stdout.write(f"Sample item keys: {list(item.keys())}")
                            
                            # Check expected keys
                            missing_keys = [key for key in endpoint['expected_keys'] if key not in item]
                            if missing_keys:
                                self.stdout.write(
                                    self.style.WARNING(f"Missing keys: {missing_keys}")
                                )
                            else:
                                self.stdout.write(
                                    self.style.SUCCESS("✓ All expected keys present")
                                )
                        else:
                            self.stdout.write("No items returned")
                    else:
                        self.stdout.write(f"Response keys: {list(data.keys())}")
                        
                        # Check expected keys
                        missing_keys = [key for key in endpoint['expected_keys'] if key not in data]
                        if missing_keys:
                            self.stdout.write(
                                self.style.WARNING(f"Missing keys: {missing_keys}")
                            )
                        else:
                            self.stdout.write(
                                self.style.SUCCESS("✓ All expected keys present")
                            )
                        
                        # Show some sample data
                        if 'unread_count' in data:
                            self.stdout.write(f"Unread count: {data['unread_count']}")
                        
                        if 'email_notifications' in data:
                            self.stdout.write(f"Email notifications enabled: {data['email_notifications']}")
                
                else:
                    self.stdout.write(
                        self.style.ERROR(f"Request failed: {response.content.decode()}")
                    )
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Error testing endpoint: {str(e)}")
                )

        # Test updating a notification (mark as read)
        self.stdout.write(f"\nTesting: Update notification (mark as read)")
        
        # Get first unread notification
        unread_response = client.get('/api/notifications/?is_read=false')
        if unread_response.status_code == 200:
            unread_notifications = unread_response.json()
            if unread_notifications:
                notification_id = unread_notifications[0]['id']
                self.stdout.write(f"Testing with notification ID: {notification_id}")
                
                # Mark as read
                update_response = client.patch(
                    f'/api/notifications/{notification_id}/',
                    data=json.dumps({'is_read': True}),
                    content_type='application/json'
                )
                
                self.stdout.write(f"Update Status Code: {update_response.status_code}")
                if update_response.status_code == 200:
                    updated_data = update_response.json()
                    self.stdout.write(f"Updated is_read: {updated_data.get('is_read')}")
                    if updated_data.get('is_read'):
                        self.stdout.write(self.style.SUCCESS("✓ Successfully marked as read"))
                    else:
                        self.stdout.write(self.style.ERROR("✗ Failed to mark as read"))
                else:
                    self.stdout.write(
                        self.style.ERROR(f"Update failed: {update_response.content.decode()}")
                    )
            else:
                self.stdout.write("No unread notifications to test with")
        
        # Test mark all as read
        self.stdout.write(f"\nTesting: Mark all as read")
        mark_all_response = client.post('/api/notifications/mark-all-read/')
        self.stdout.write(f"Status Code: {mark_all_response.status_code}")
        if mark_all_response.status_code == 200:
            result = mark_all_response.json()
            self.stdout.write(f"Result: {result}")
            self.stdout.write(self.style.SUCCESS("✓ Mark all as read successful"))
        else:
            self.stdout.write(
                self.style.ERROR(f"Mark all as read failed: {mark_all_response.content.decode()}")
            )

        self.stdout.write('\n' + '='*60)
        self.stdout.write('API TESTING COMPLETE')
        self.stdout.write('='*60)
        self.stdout.write('You can now test the frontend notification system!')
        self.stdout.write('Navigate to: /dashboard/provider/notifications')
        self.stdout.write('='*60)