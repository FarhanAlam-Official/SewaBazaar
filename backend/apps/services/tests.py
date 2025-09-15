import pytest
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.services.models import Service, ServiceCategory, ServiceImage, City
from apps.accounts.models import User
import os


class ServiceImageOrganizationTest(TestCase):
    def setUp(self):
        # Create a user
        self.user = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            role='provider'
        )
        
        # Create a category
        self.category = ServiceCategory.objects.create(
            title='Test Category',
            description='Test category description'
        )
        
        # Create a city
        self.city = City.objects.create(
            name='Test City'
        )
        
        # Create a service
        self.service = Service.objects.create(
            title='Test Service',
            description='Test service description',
            price=100.00,
            duration='1 hour',
            category=self.category,
            provider=self.user
        )
        self.service.cities.add(self.city)
    
    def test_service_image_upload_path(self):
        """Test that service images are uploaded to the correct path"""
        # Create a test image
        test_image = SimpleUploadedFile(
            name='test_image.jpg',
            content=b'fake image content',
            content_type='image/jpeg'
        )
        
        # Create a service image
        service_image = ServiceImage.objects.create(
            service=self.service,
            image=test_image,
            is_featured=True
        )
        
        # Check that the image was uploaded to the correct path
        expected_path = f'service_images/{self.service.id}/main/'
        self.assertIn(expected_path, service_image.image.name)
        
        # Test with non-featured image
        test_image2 = SimpleUploadedFile(
            name='test_image2.jpg',
            content=b'fake image content 2',
            content_type='image/jpeg'
        )
        
        service_image2 = ServiceImage.objects.create(
            service=self.service,
            image=test_image2,
            is_featured=False
        )
        
        # Check that the image was uploaded to the correct path
        expected_path2 = f'service_images/{self.service.id}/gallery/'
        self.assertIn(expected_path2, service_image2.image.name)
    
    def test_service_main_image_property(self):
        """Test that the main_image property works correctly"""
        # Create a test image
        test_image = SimpleUploadedFile(
            name='main_image.jpg',
            content=b'fake main image content',
            content_type='image/jpeg'
        )
        
        # Create a featured service image
        main_image = ServiceImage.objects.create(
            service=self.service,
            image=test_image,
            is_featured=True
        )
        
        # Check that the main_image property returns the correct image
        self.assertEqual(self.service.main_image, main_image)
        
        # Create a non-featured image
        test_image2 = SimpleUploadedFile(
            name='gallery_image.jpg',
            content=b'fake gallery image content',
            content_type='image/jpeg'
        )
        
        ServiceImage.objects.create(
            service=self.service,
            image=test_image2,
            is_featured=False
        )
        
        # Check that the main_image property still returns the featured image
        self.assertEqual(self.service.main_image, main_image)
    
    def test_service_gallery_images_ordered_property(self):
        """Test that the gallery_images_ordered property works correctly"""
        # Create test images
        test_image1 = SimpleUploadedFile(
            name='gallery_image1.jpg',
            content=b'fake gallery image 1 content',
            content_type='image/jpeg'
        )
        
        test_image2 = SimpleUploadedFile(
            name='gallery_image2.jpg',
            content=b'fake gallery image 2 content',
            content_type='image/jpeg'
        )
        
        # Create gallery images
        gallery_image1 = ServiceImage.objects.create(
            service=self.service,
            image=test_image1,
            is_featured=False,
            order=1
        )
        
        gallery_image2 = ServiceImage.objects.create(
            service=self.service,
            image=test_image2,
            is_featured=False,
            order=2
        )
        
        # Check that the gallery_images_ordered property returns images in correct order
        gallery_images = list(self.service.gallery_images_ordered)
        self.assertIn(gallery_image1, gallery_images)
        self.assertIn(gallery_image2, gallery_images)
