import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
import io
import json
from unittest.mock import patch, MagicMock

from .models import Profile, PortfolioMedia
from .serializers import ProfileSerializer, PortfolioMediaSerializer, UserSerializer

User = get_user_model()


class ProviderProfileModelTest(TestCase):
    """Test cases for Provider Profile model"""
    
    def setUp(self):
        self.provider = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            role='provider'
        )
    
    def test_profile_creation(self):
        """Test creating a provider profile"""
        profile = Profile.objects.create(
            user=self.provider,
            bio='Experienced service provider',
            address='123 Test Street',
            city='Kathmandu',
            company_name='Test Company',
            years_of_experience=5,
            certifications=['Certification 1', 'Certification 2'],
            location_city='Kathmandu'
        )
        
        self.assertEqual(profile.user, self.provider)
        self.assertEqual(profile.bio, 'Experienced service provider')
        self.assertEqual(profile.city, 'Kathmandu')
        self.assertEqual(profile.years_of_experience, 5)
        self.assertEqual(len(profile.certifications), 2)
        self.assertFalse(profile.is_approved)  # Default should be False
    
    def test_profile_str_representation(self):
        """Test string representation of profile"""
        profile = Profile.objects.create(
            user=self.provider,
            display_name='Test Provider'
        )
        
        expected_str = f"Profile for {self.provider.email}"
        self.assertEqual(str(profile), expected_str)
    
    def test_profile_avg_rating_default(self):
        """Test that average rating defaults to 0.0"""
        profile = Profile.objects.create(user=self.provider)
        self.assertEqual(profile.avg_rating, 0.0)
    
    def test_profile_reviews_count_default(self):
        """Test that reviews count defaults to 0"""
        profile = Profile.objects.create(user=self.provider)
        self.assertEqual(profile.reviews_count, 0)


class PortfolioMediaModelTest(TestCase):
    """Test cases for Portfolio Media model"""
    
    def setUp(self):
        self.provider = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            role='provider'
        )
        self.profile = Profile.objects.create(user=self.provider)
    
    def create_test_image(self):
        """Create a test image file"""
        image = Image.new('RGB', (100, 100), color='red')
        image_file = io.BytesIO()
        image.save(image_file, format='JPEG')
        image_file.seek(0)
        return SimpleUploadedFile(
            name='test_image.jpg',
            content=image_file.getvalue(),
            content_type='image/jpeg'
        )
    
    def test_portfolio_media_creation(self):
        """Test creating portfolio media"""
        test_image = self.create_test_image()
        
        media = PortfolioMedia.objects.create(
            profile=self.profile,
            media_type='image',
            file=test_image,
            title='Test Image',
            description='Test image description',
            order=1
        )
        
        self.assertEqual(media.profile, self.profile)
        self.assertEqual(media.media_type, 'image')
        self.assertEqual(media.title, 'Test Image')
        self.assertEqual(media.order, 1)
        self.assertTrue(media.file.name.endswith('.jpg'))
    
    def test_portfolio_media_str_representation(self):
        """Test string representation of portfolio media"""
        media = PortfolioMedia.objects.create(
            profile=self.profile,
            media_type='image',
            title='Test Image'
        )
        
        expected_str = f"Test Image - image for {self.provider.email}"
        self.assertEqual(str(media), expected_str)
    
    def test_portfolio_media_ordering(self):
        """Test portfolio media ordering by order field"""
        media1 = PortfolioMedia.objects.create(
            profile=self.profile,
            media_type='image',
            title='Image 1',
            order=2
        )
        
        media2 = PortfolioMedia.objects.create(
            profile=self.profile,
            media_type='image',
            title='Image 2',
            order=1
        )
        
        media_list = list(PortfolioMedia.objects.all())
        self.assertEqual(media_list[0], media2)  # Lower order comes first
        self.assertEqual(media_list[1], media1)


class ProviderProfileAPITest(APITestCase):
    """Test cases for Provider Profile API endpoints"""
    
    def setUp(self):
        self.provider = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            role='provider'
        )
        self.profile = Profile.objects.create(
            user=self.provider,
            bio='Test provider bio',
            city='Kathmandu'
        )
        
        self.customer = User.objects.create_user(
            email='customer@test.com',
            username='customer',
            password='testpass123',
            role='customer'
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.provider)
    
    def test_get_provider_profile(self):
        """Test getting provider profile"""
        url = reverse('user-profile')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['profile']['bio'], 'Test provider bio')
        self.assertEqual(response.data['profile']['city'], 'Kathmandu')
    
    def test_update_provider_profile(self):
        """Test updating provider profile"""
        url = reverse('user-profile')
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'profile': {
                'bio': 'Updated bio',
                'city': 'Pokhara',
                'years_of_experience': 3,
                'certifications': ['New Certification']
            }
        }
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'John')
        self.assertEqual(response.data['profile']['bio'], 'Updated bio')
        self.assertEqual(response.data['profile']['city'], 'Pokhara')
        self.assertEqual(response.data['profile']['years_of_experience'], 3)
    
    def test_upload_profile_picture(self):
        """Test uploading profile picture"""
        # Create test image
        image = Image.new('RGB', (100, 100), color='blue')
        image_file = io.BytesIO()
        image.save(image_file, format='JPEG')
        image_file.seek(0)
        
        test_image = SimpleUploadedFile(
            name='profile_pic.jpg',
            content=image_file.getvalue(),
            content_type='image/jpeg'
        )
        
        url = reverse('user-profile')
        data = {
            'profile_picture': test_image,
            'first_name': 'John'
        }
        response = self.client.patch(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['profile_picture_url'])
        
        # Verify in database
        self.provider.refresh_from_db()
        self.assertTrue(self.provider.profile_picture.name.endswith('.jpg'))
    
    def test_customer_cannot_update_provider_profile(self):
        """Test that customers cannot update provider profiles"""
        self.client.force_authenticate(user=self.customer)
        
        url = reverse('user-profile')
        data = {'first_name': 'Hacker'}
        response = self.client.patch(url, data, format='json')
        
        # Customer should get their own profile, not the provider's
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # But the provider's name should not be changed
        self.provider.refresh_from_db()
        self.assertNotEqual(self.provider.first_name, 'Hacker')


class PortfolioMediaAPITest(APITestCase):
    """Test cases for Portfolio Media API endpoints"""
    
    def setUp(self):
        self.provider = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            role='provider'
        )
        self.profile = Profile.objects.create(user=self.provider)
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.provider)
    
    def create_test_image(self):
        """Create a test image file"""
        image = Image.new('RGB', (100, 100), color='green')
        image_file = io.BytesIO()
        image.save(image_file, format='JPEG')
        image_file.seek(0)
        return SimpleUploadedFile(
            name='test_portfolio.jpg',
            content=image_file.getvalue(),
            content_type='image/jpeg'
        )
    
    def test_upload_portfolio_media(self):
        """Test uploading portfolio media"""
        test_image = self.create_test_image()
        
        url = reverse('portfoliomedia-list')
        data = {
            'media_type': 'image',
            'file': test_image,
            'title': 'My Work Sample',
            'description': 'Sample of my work',
            'order': 1
        }
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'My Work Sample')
        self.assertEqual(response.data['media_type'], 'image')
        self.assertIsNotNone(response.data['file_url'])
    
    def test_list_portfolio_media(self):
        """Test listing portfolio media"""
        # Create test media
        media = PortfolioMedia.objects.create(
            profile=self.profile,
            media_type='image',
            title='Test Media',
            order=1
        )
        
        url = reverse('portfoliomedia-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], media.id)
    
    def test_update_portfolio_media(self):
        """Test updating portfolio media"""
        media = PortfolioMedia.objects.create(
            profile=self.profile,
            media_type='image',
            title='Original Title',
            order=1
        )
        
        url = reverse('portfoliomedia-detail', kwargs={'pk': media.pk})
        data = {
            'title': 'Updated Title',
            'description': 'Updated description'
        }
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Title')
        self.assertEqual(response.data['description'], 'Updated description')
    
    def test_delete_portfolio_media(self):
        """Test deleting portfolio media"""
        media = PortfolioMedia.objects.create(
            profile=self.profile,
            media_type='image',
            title='To Delete',
            order=1
        )
        
        url = reverse('portfoliomedia-detail', kwargs={'pk': media.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PortfolioMedia.objects.filter(pk=media.pk).exists())
    
    def test_reorder_portfolio_media(self):
        """Test reordering portfolio media"""
        media1 = PortfolioMedia.objects.create(
            profile=self.profile,
            media_type='image',
            title='Media 1',
            order=1
        )
        
        media2 = PortfolioMedia.objects.create(
            profile=self.profile,
            media_type='image',
            title='Media 2',
            order=2
        )
        
        url = reverse('portfoliomedia-reorder')
        data = {
            'media_order': [
                {'id': media2.id, 'order': 1},
                {'id': media1.id, 'order': 2}
            ]
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify order was updated
        media1.refresh_from_db()
        media2.refresh_from_db()
        self.assertEqual(media1.order, 2)
        self.assertEqual(media2.order, 1)


class ProviderAuthenticationTest(APITestCase):
    """Test cases for provider authentication and permissions"""
    
    def setUp(self):
        self.provider_data = {
            'email': 'newprovider@test.com',
            'username': 'newprovider',
            'password': 'testpass123',
            'password2': 'testpass123',
            'first_name': 'John',
            'last_name': 'Doe',
            'role': 'provider',
            'phone': '+977-1234567890'
        }
    
    def test_provider_registration(self):
        """Test provider registration"""
        url = reverse('register')
        response = self.client.post(url, self.provider_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], 'newprovider@test.com')
        self.assertEqual(response.data['role'], 'provider')
        
        # Verify user was created
        user = User.objects.get(email='newprovider@test.com')
        self.assertEqual(user.role, 'provider')
        
        # Verify profile was created
        self.assertTrue(hasattr(user, 'profile'))
    
    def test_provider_login(self):
        """Test provider login"""
        # First create a provider
        provider = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            role='provider'
        )
        Profile.objects.create(user=provider)
        
        url = reverse('token_obtain_pair')
        data = {
            'email': 'provider@test.com',
            'password': 'testpass123'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
    
    def test_provider_token_refresh(self):
        """Test provider token refresh"""
        # Create provider and get tokens
        provider = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            role='provider'
        )
        Profile.objects.create(user=provider)
        
        # Get initial tokens
        url = reverse('token_obtain_pair')
        data = {
            'email': 'provider@test.com',
            'password': 'testpass123'
        }
        response = self.client.post(url, data, format='json')
        refresh_token = response.data['refresh']
        
        # Test token refresh
        url = reverse('token_refresh')
        data = {'refresh': refresh_token}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
    
    def test_invalid_provider_registration(self):
        """Test invalid provider registration data"""
        invalid_data = self.provider_data.copy()
        invalid_data['password2'] = 'different_password'
        
        url = reverse('register')
        response = self.client.post(url, invalid_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)


class ProviderSerializerTest(TestCase):
    """Test cases for provider-related serializers"""
    
    def setUp(self):
        self.provider = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            role='provider'
        )
        self.profile = Profile.objects.create(
            user=self.provider,
            bio='Test bio',
            city='Kathmandu'
        )
    
    def test_profile_serializer(self):
        """Test ProfileSerializer"""
        serializer = ProfileSerializer(self.profile)
        data = serializer.data
        
        self.assertEqual(data['bio'], 'Test bio')
        self.assertEqual(data['city'], 'Kathmandu')
        self.assertIn('service_areas', data)
        self.assertIn('portfolio_media', data)
    
    def test_user_serializer_with_profile(self):
        """Test UserSerializer includes profile data"""
        serializer = UserSerializer(self.provider)
        data = serializer.data
        
        self.assertEqual(data['email'], 'provider@test.com')
        self.assertEqual(data['role'], 'provider')
        self.assertIn('profile', data)
        self.assertEqual(data['profile']['bio'], 'Test bio')
    
    def test_portfolio_media_serializer(self):
        """Test PortfolioMediaSerializer"""
        media = PortfolioMedia.objects.create(
            profile=self.profile,
            media_type='image',
            title='Test Media',
            description='Test description',
            order=1
        )
        
        serializer = PortfolioMediaSerializer(media)
        data = serializer.data
        
        self.assertEqual(data['title'], 'Test Media')
        self.assertEqual(data['media_type'], 'image')
        self.assertEqual(data['description'], 'Test description')
        self.assertEqual(data['order'], 1)
        self.assertIn('file_url', data)


class ProviderProfileValidationTest(TestCase):
    """Test cases for provider profile validation"""
    
    def setUp(self):
        self.provider = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            role='provider'
        )
    
    def test_profile_bio_max_length(self):
        """Test profile bio maximum length validation"""
        long_bio = 'x' * 1001  # Assuming max length is 1000
        
        with self.assertRaises(Exception):  # ValidationError or similar
            Profile.objects.create(
                user=self.provider,
                bio=long_bio
            )
    
    def test_years_of_experience_validation(self):
        """Test years of experience validation"""
        # Test negative years
        with self.assertRaises(Exception):
            Profile.objects.create(
                user=self.provider,
                years_of_experience=-1
            )
        
        # Test unrealistic years (e.g., more than 100)
        with self.assertRaises(Exception):
            Profile.objects.create(
                user=self.provider,
                years_of_experience=101
            )
    
    def test_certifications_json_field(self):
        """Test certifications JSON field"""
        profile = Profile.objects.create(
            user=self.provider,
            certifications=['Cert 1', 'Cert 2', 'Cert 3']
        )
        
        self.assertEqual(len(profile.certifications), 3)
        self.assertIn('Cert 1', profile.certifications)


class ProviderSecurityTest(TestCase):
    """Test cases for provider security features"""
    
    def setUp(self):
        self.provider = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            role='provider'
        )
        Profile.objects.create(user=self.provider)
    
    def test_password_change_security(self):
        """Test password change security"""
        client = APIClient()
        client.force_authenticate(user=self.provider)
        
        url = reverse('change-password')
        data = {
            'current_password': 'testpass123',
            'new_password': 'newtestpass456'
        }
        response = client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify password was changed
        self.provider.refresh_from_db()
        self.assertTrue(self.provider.check_password('newtestpass456'))
    
    def test_invalid_current_password(self):
        """Test password change with invalid current password"""
        client = APIClient()
        client.force_authenticate(user=self.provider)
        
        url = reverse('change-password')
        data = {
            'current_password': 'wrongpassword',
            'new_password': 'newtestpass456'
        }
        response = client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Verify password was not changed
        self.provider.refresh_from_db()
        self.assertTrue(self.provider.check_password('testpass123'))
    
    @patch('apps.accounts.views.send_mail')
    def test_password_reset_email(self, mock_send_mail):
        """Test password reset email functionality"""
        client = APIClient()
        
        url = reverse('password-reset-request')
        data = {'email': 'provider@test.com'}
        response = client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(mock_send_mail.called)


if __name__ == '__main__':
    pytest.main([__file__])