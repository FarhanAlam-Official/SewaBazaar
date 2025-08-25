import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Profile
from .serializers import UserSerializer, ProfileSerializer
import factory
from factory.django import DjangoModelFactory

User = get_user_model()

# Factory classes for test data
class UserFactory(DjangoModelFactory):
    class Meta:
        model = User
    
    email = factory.Sequence(lambda n: f'user{n}@example.com')
    username = factory.Sequence(lambda n: f'user{n}')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    password = factory.PostGenerationMethodCall('set_password', 'testpass123')
    role = 'customer'

class ProviderFactory(DjangoModelFactory):
    class Meta:
        model = User
    
    email = factory.Sequence(lambda n: f'provider{n}@example.com')
    username = factory.Sequence(lambda n: f'provider{n}')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    password = factory.PostGenerationMethodCall('set_password', 'testpass123')
    role = 'provider'

class ProfileFactory(DjangoModelFactory):
    class Meta:
        model = Profile
    
    user = factory.SubFactory(UserFactory)
    bio = factory.Faker('text', max_nb_chars=200)
    address = factory.Faker('address')
    city = factory.Faker('city')

# Model Tests
class UserModelTest(TestCase):
    def setUp(self):
        self.user_data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'testpass123',
            'role': 'customer'
        }

    def test_create_user(self):
        """Test creating a basic user"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.email, self.user_data['email'])
        self.assertEqual(user.role, 'customer')
        self.assertFalse(user.is_verified)
        self.assertTrue(user.check_password('testpass123'))

    def test_create_superuser(self):
        """Test creating a superuser"""
        user = User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpass123'
        )
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_staff)
        self.assertEqual(user.role, 'customer')  # Default role

    def test_user_str_representation(self):
        """Test user string representation"""
        user = UserFactory()
        self.assertEqual(str(user), user.email)

    def test_user_full_name_property(self):
        """Test full_name property"""
        user = UserFactory(first_name='John', last_name='Doe')
        self.assertEqual(user.full_name, 'John Doe')

    def test_unique_email_constraint(self):
        """Test that email must be unique"""
        UserFactory(email='duplicate@example.com')
        with self.assertRaises(IntegrityError):
            UserFactory(email='duplicate@example.com')

    def test_role_choices(self):
        """Test valid role choices"""
        valid_roles = ['customer', 'provider', 'admin']
        for role in valid_roles:
            user = UserFactory(role=role)
            self.assertEqual(user.role, role)

    def test_invalid_role(self):
        """Test that invalid role raises error"""
        with self.assertRaises(ValidationError):
            user = UserFactory(role='invalid_role')
            user.full_clean()

class ProfileModelTest(TestCase):
    def setUp(self):
        self.user = UserFactory()
        self.profile_data = {
            'user': self.user,
            'bio': 'Test bio',
            'address': 'Test Address',
            'city': 'Test City',
            'company_name': 'Test Company'
        }

    def test_create_profile(self):
        """Test creating a profile"""
        profile = Profile.objects.create(**self.profile_data)
        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.bio, 'Test bio')
        self.assertFalse(profile.is_approved)

    def test_profile_str_representation(self):
        """Test profile string representation"""
        profile = ProfileFactory()
        expected = f"Profile for {profile.user.email}"
        self.assertEqual(str(profile), expected)

    def test_profile_auto_creation(self):
        """Test that profile is automatically created with user"""
        user = UserFactory()
        self.assertTrue(hasattr(user, 'profile'))
        self.assertIsInstance(user.profile, Profile)

# Serializer Tests
class UserSerializerTest(TestCase):
    def setUp(self):
        self.user = UserFactory()
        self.serializer = UserSerializer(instance=self.user)

    def test_contains_expected_fields(self):
        """Test serializer contains expected fields"""
        data = self.serializer.data
        expected_fields = ['id', 'email', 'username', 'first_name', 'last_name', 
                          'role', 'phone', 'is_verified', 'profile_picture', 'full_name']
        for field in expected_fields:
            self.assertIn(field, data)

    def test_full_name_field(self):
        """Test full_name field in serializer"""
        data = self.serializer.data
        expected_full_name = f"{self.user.first_name} {self.user.last_name}"
        self.assertEqual(data['full_name'], expected_full_name)

class ProfileSerializerTest(TestCase):
    def setUp(self):
        self.profile = ProfileFactory()
        self.serializer = ProfileSerializer(instance=self.profile)

    def test_contains_expected_fields(self):
        """Test serializer contains expected fields"""
        data = self.serializer.data
        expected_fields = ['id', 'bio', 'address', 'city', 'date_of_birth', 
                          'company_name', 'service_areas', 'is_approved', 
                          'created_at', 'updated_at']
        for field in expected_fields:
            self.assertIn(field, data)

# API Tests
class UserAPITest(APITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)

    def test_user_list_requires_authentication(self):
        """Test that user list requires authentication"""
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/accounts/users/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_detail_requires_authentication(self):
        """Test that user detail requires authentication"""
        self.client.force_authenticate(user=None)
        response = self.client.get(f'/api/accounts/users/{self.user.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_can_view_own_profile(self):
        """Test that user can view their own profile"""
        response = self.client.get(f'/api/accounts/users/{self.user.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.user.email)

    def test_user_cannot_view_other_profiles(self):
        """Test that user cannot view other user profiles"""
        other_user = UserFactory()
        response = self.client.get(f'/api/accounts/users/{other_user.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

class AuthenticationAPITest(APITestCase):
    def setUp(self):
        self.user_data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'testpass123',
            'role': 'customer'
        }
        self.user = UserFactory(**self.user_data)

    def test_user_registration(self):
        """Test user registration endpoint"""
        registration_data = {
            'email': 'newuser@example.com',
            'username': 'newuser',
            'first_name': 'New',
            'last_name': 'User',
            'password': 'newpass123',
            'role': 'customer'
        }
        response = self.client.post('/api/accounts/register/', registration_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 2)

    def test_user_login(self):
        """Test user login endpoint"""
        login_data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        response = self.client.post('/api/accounts/login/', login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_invalid_login(self):
        """Test invalid login credentials"""
        login_data = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }
        response = self.client.post('/api/accounts/login/', login_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_jwt_token_refresh(self):
        """Test JWT token refresh"""
        refresh = RefreshToken.for_user(self.user)
        response = self.client.post('/api/accounts/token/refresh/', {
            'refresh': str(refresh)
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

# Integration Tests
class UserProfileIntegrationTest(TestCase):
    def test_user_profile_creation_on_user_creation(self):
        """Test that profile is created when user is created"""
        user = UserFactory()
        self.assertTrue(hasattr(user, 'profile'))
        self.assertIsInstance(user.profile, Profile)

    def test_profile_update_affects_user(self):
        """Test that profile updates work correctly"""
        user = UserFactory()
        profile = user.profile
        profile.bio = 'Updated bio'
        profile.save()
        
        # Refresh from database
        user.refresh_from_db()
        self.assertEqual(user.profile.bio, 'Updated bio')

# Performance Tests
class UserPerformanceTest(TestCase):
    def test_bulk_user_creation(self):
        """Test creating multiple users efficiently"""
        users = []
        for i in range(100):
            user_data = {
                'email': f'bulkuser{i}@example.com',
                'username': f'bulkuser{i}',
                'first_name': f'User{i}',
                'last_name': 'Bulk',
                'password': 'testpass123'
            }
            users.append(User(**user_data))
        
        User.objects.bulk_create(users)
        self.assertEqual(User.objects.count(), 100)

# Edge Cases
class UserEdgeCaseTest(TestCase):
    def test_user_with_empty_fields(self):
        """Test user creation with minimal required fields"""
        user = User.objects.create_user(
            email='minimal@example.com',
            username='minimal',
            password='testpass123'
        )
        self.assertIsNotNone(user.id)
        self.assertEqual(user.first_name, '')
        self.assertEqual(user.last_name, '')

    def test_user_with_very_long_names(self):
        """Test user creation with very long names"""
        long_name = 'A' * 150  # Exceeds CharField max_length
        with self.assertRaises(ValidationError):
            user = UserFactory(first_name=long_name)
            user.full_clean()

    def test_user_email_validation(self):
        """Test email format validation"""
        with self.assertRaises(ValidationError):
            user = UserFactory(email='invalid-email')
            user.full_clean()

