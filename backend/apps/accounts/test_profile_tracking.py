"""
Unit tests for profile change tracking functionality
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Profile, ProfileChangeHistory

User = get_user_model()

class ProfileChangeTrackingTest(TestCase):
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        # Create a profile
        self.profile, _ = Profile.objects.get_or_create(user=self.user)
    
    def test_profile_change_history_creation(self):
        """Test that profile change history records are created correctly"""
        # Create a profile change record
        change = ProfileChangeHistory.objects.create(
            user=self.user,
            field_changed='email',
            old_value='old@example.com',
            new_value='new@example.com',
            change_description='Email updated from old@example.com to new@example.com'
        )
        
        # Verify the change was created
        self.assertEqual(ProfileChangeHistory.objects.count(), 1)
        self.assertEqual(change.user, self.user)
        self.assertEqual(change.field_changed, 'email')
        self.assertEqual(change.old_value, 'old@example.com')
        self.assertEqual(change.new_value, 'new@example.com')
        self.assertEqual(
            change.change_description, 
            'Email updated from old@example.com to new@example.com'
        )
    
    def test_profile_change_history_relationship(self):
        """Test that profile change history is properly linked to users"""
        # Create multiple changes for the same user
        change1 = ProfileChangeHistory.objects.create(
            user=self.user,
            field_changed='email',
            old_value='old@example.com',
            new_value='new@example.com',
            change_description='Email updated'
        )
        
        change2 = ProfileChangeHistory.objects.create(
            user=self.user,
            field_changed='phone',
            old_value=None,
            new_value='+977987654321',
            change_description='Phone number added'
        )
        
        # Verify both changes are linked to the user
        self.assertEqual(self.user.profile_changes.count(), 2)
        self.assertIn(change1, self.user.profile_changes.all())
        self.assertIn(change2, self.user.profile_changes.all())