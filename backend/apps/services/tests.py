import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
import factory
from factory.django import DjangoModelFactory
from apps.accounts.tests import UserFactory, ProviderFactory
from .models import (
    City, ServiceCategory, Service, ServiceImage, 
    ServiceAvailability, Favorite
)
from .serializers import (
    CitySerializer, ServiceCategorySerializer, ServiceSerializer,
    ServiceDetailSerializer, ServiceImageSerializer, 
    ServiceAvailabilitySerializer, FavoriteSerializer
)

# Factory classes for test data
class CityFactory(DjangoModelFactory):
    class Meta:
        model = City
    
    name = factory.Faker('city')
    region = factory.Faker('state')
    is_active = True

class ServiceCategoryFactory(DjangoModelFactory):
    class Meta:
        model = ServiceCategory
    
    title = factory.Sequence(lambda n: f'Category {n}')
    description = factory.Faker('text', max_nb_chars=200)
    icon = factory.Faker('word')
    slug = factory.Sequence(lambda n: f'category-{n}')
    is_active = True

class ServiceFactory(DjangoModelFactory):
    class Meta:
        model = Service
    
    title = factory.Sequence(lambda n: f'Service {n}')
    description = factory.Faker('text', max_nb_chars=500)
    short_description = factory.Faker('text', max_nb_chars=100)
    price = factory.Faker('pydecimal', left_digits=4, right_digits=2, positive=True)
    discount_price = factory.Faker('pydecimal', left_digits=3, right_digits=2, positive=True)
    duration = factory.Iterator(['1 hour', '2 hours', '30 minutes', '1 day'])
    category = factory.SubFactory(ServiceCategoryFactory)
    provider = factory.SubFactory(ProviderFactory)
    status = 'active'
    is_featured = False
    average_rating = Decimal('0.00')
    reviews_count = 0

class ServiceImageFactory(DjangoModelFactory):
    class Meta:
        model = ServiceImage
    
    service = factory.SubFactory(ServiceFactory)
    caption = factory.Faker('sentence')

class ServiceAvailabilityFactory(DjangoModelFactory):
    class Meta:
        model = ServiceAvailability
    
    service = factory.SubFactory(ServiceFactory)
    day_of_week = factory.Iterator([0, 1, 2, 3, 4, 5, 6])  # Monday to Sunday
    start_time = factory.Faker('time')
    end_time = factory.Faker('time')
    is_available = True

class FavoriteFactory(DjangoModelFactory):
    class Meta:
        model = Favorite
    
    user = factory.SubFactory(UserFactory)
    service = factory.SubFactory(ServiceFactory)

# Model Tests
class CityModelTest(TestCase):
    def setUp(self):
        self.city_data = {
            'name': 'Kathmandu',
            'region': 'Bagmati',
            'is_active': True
        }

    def test_create_city(self):
        """Test creating a city"""
        city = City.objects.create(**self.city_data)
        self.assertEqual(city.name, 'Kathmandu')
        self.assertEqual(city.region, 'Bagmati')
        self.assertTrue(city.is_active)

    def test_city_str_representation(self):
        """Test city string representation"""
        city = CityFactory()
        self.assertEqual(str(city), city.name)

    def test_city_ordering(self):
        """Test city ordering by name"""
        CityFactory(name='Pokhara')
        CityFactory(name='Kathmandu')
        CityFactory(name='Lalitpur')
        
        cities = City.objects.all()
        self.assertEqual(cities[0].name, 'Kathmandu')
        self.assertEqual(cities[1].name, 'Lalitpur')
        self.assertEqual(cities[2].name, 'Pokhara')

class ServiceCategoryModelTest(TestCase):
    def setUp(self):
        self.category_data = {
            'title': 'Plumbing',
            'description': 'Plumbing services',
            'icon': '🔧',
            'is_active': True
        }

    def test_create_category(self):
        """Test creating a service category"""
        category = ServiceCategory.objects.create(**self.category_data)
        self.assertEqual(category.title, 'Plumbing')
        self.assertEqual(category.slug, 'plumbing')
        self.assertTrue(category.is_active)

    def test_category_slug_auto_generation(self):
        """Test automatic slug generation"""
        category = ServiceCategoryFactory(title='Home Cleaning')
        self.assertEqual(category.slug, 'home-cleaning')

    def test_category_str_representation(self):
        """Test category string representation"""
        category = ServiceCategoryFactory()
        self.assertEqual(str(category), category.title)

    def test_unique_slug_constraint(self):
        """Test that slug must be unique"""
        ServiceCategoryFactory(slug='duplicate-slug')
        with self.assertRaises(IntegrityError):
            ServiceCategoryFactory(slug='duplicate-slug')

class ServiceModelTest(TestCase):
    def setUp(self):
        self.provider = ProviderFactory()
        self.category = ServiceCategoryFactory()
        self.city = CityFactory()
        
        self.service_data = {
            'title': 'Professional Plumbing',
            'description': 'Expert plumbing services',
            'short_description': 'Quick and reliable plumbing',
            'price': Decimal('1500.00'),
            'duration': '2 hours',
            'category': self.category,
            'provider': self.provider,
            'status': 'active'
        }

    def test_create_service(self):
        """Test creating a service"""
        service = Service.objects.create(**self.service_data)
        service.cities.add(self.city)
        
        self.assertEqual(service.title, 'Professional Plumbing')
        self.assertEqual(service.slug, 'professional-plumbing')
        self.assertEqual(service.status, 'active')
        self.assertFalse(service.is_featured)
        self.assertEqual(service.average_rating, Decimal('0.00'))
        self.assertEqual(service.reviews_count, 0)

    def test_service_slug_auto_generation(self):
        """Test automatic slug generation for service"""
        service = ServiceFactory(title='Home Cleaning Service')
        self.assertEqual(service.slug, 'home-cleaning-service')

    def test_service_str_representation(self):
        """Test service string representation"""
        service = ServiceFactory()
        self.assertEqual(str(service), service.title)

    def test_service_price_calculation(self):
        """Test service price calculations"""
        service = ServiceFactory(
            price=Decimal('1000.00'),
            discount_price=Decimal('800.00')
        )
        self.assertEqual(service.price, Decimal('1000.00'))
        self.assertEqual(service.discount_price, Decimal('800.00'))

    def test_service_status_choices(self):
        """Test valid status choices"""
        valid_statuses = ['draft', 'pending', 'active', 'inactive']
        for status in valid_statuses:
            service = ServiceFactory(status=status)
            self.assertEqual(service.status, status)

class ServiceAvailabilityModelTest(TestCase):
    def setUp(self):
        self.service = ServiceFactory()
        self.availability_data = {
            'service': self.service,
            'day_of_week': 0,  # Monday
            'start_time': '09:00:00',
            'end_time': '17:00:00',
            'is_available': True
        }

    def test_create_availability(self):
        """Test creating service availability"""
        availability = ServiceAvailability.objects.create(**self.availability_data)
        self.assertEqual(availability.service, self.service)
        self.assertEqual(availability.day_of_week, 0)
        self.assertEqual(str(availability.start_time), '09:00:00')
        self.assertEqual(str(availability.end_time), '17:00:00')
        self.assertTrue(availability.is_available)

    def test_availability_str_representation(self):
        """Test availability string representation"""
        availability = ServiceAvailabilityFactory()
        expected = f"{availability.service.title} - {availability.get_day_of_week_display()} ({availability.start_time} - {availability.end_time})"
        self.assertEqual(str(availability), expected)

    def test_unique_availability_constraint(self):
        """Test unique constraint for availability"""
        ServiceAvailabilityFactory(
            service=self.service,
            day_of_week=0,
            start_time='09:00:00',
            end_time='17:00:00'
        )
        with self.assertRaises(IntegrityError):
            ServiceAvailabilityFactory(
                service=self.service,
                day_of_week=0,
                start_time='09:00:00',
                end_time='17:00:00'
            )

class FavoriteModelTest(TestCase):
    def setUp(self):
        self.user = UserFactory()
        self.service = ServiceFactory()

    def test_create_favorite(self):
        """Test creating a favorite"""
        favorite = Favorite.objects.create(user=self.user, service=self.service)
        self.assertEqual(favorite.user, self.user)
        self.assertEqual(favorite.service, self.service)

    def test_favorite_str_representation(self):
        """Test favorite string representation"""
        favorite = FavoriteFactory()
        expected = f"{favorite.user.email}'s favorite: {favorite.service.title}"
        self.assertEqual(str(favorite), expected)

    def test_unique_favorite_constraint(self):
        """Test unique constraint for favorites"""
        Favorite.objects.create(user=self.user, service=self.service)
        with self.assertRaises(IntegrityError):
            Favorite.objects.create(user=self.user, service=self.service)

# Serializer Tests
class CitySerializerTest(TestCase):
    def setUp(self):
        self.city = CityFactory()
        self.serializer = CitySerializer(instance=self.city)

    def test_contains_expected_fields(self):
        """Test serializer contains expected fields"""
        data = self.serializer.data
        expected_fields = ['id', 'name', 'region', 'is_active']
        for field in expected_fields:
            self.assertIn(field, data)

class ServiceCategorySerializerTest(TestCase):
    def setUp(self):
        self.category = ServiceCategoryFactory()
        self.serializer = ServiceCategorySerializer(instance=self.category)

    def test_contains_expected_fields(self):
        """Test serializer contains expected fields"""
        data = self.serializer.data
        expected_fields = ['id', 'title', 'description', 'icon', 'slug', 'is_active']
        for field in expected_fields:
            self.assertIn(field, data)

class ServiceSerializerTest(TestCase):
    def setUp(self):
        self.service = ServiceFactory()
        self.serializer = ServiceSerializer(instance=self.service)

    def test_contains_expected_fields(self):
        """Test serializer contains expected fields"""
        data = self.serializer.data
        expected_fields = [
            'id', 'title', 'slug', 'description', 'short_description',
            'price', 'discount_price', 'duration', 'category', 'provider',
            'image', 'status', 'is_featured', 'average_rating', 'reviews_count',
            'created_at', 'updated_at'
        ]
        for field in expected_fields:
            self.assertIn(field, data)

class ServiceDetailSerializerTest(TestCase):
    def setUp(self):
        self.service = ServiceFactory()
        self.serializer = ServiceDetailSerializer(instance=self.service)

    def test_contains_additional_fields(self):
        """Test detail serializer contains additional fields"""
        data = self.serializer.data
        additional_fields = ['includes', 'excludes', 'cities', 'gallery_images', 'availability']
        for field in additional_fields:
            self.assertIn(field, data)

# API Tests
class CityAPITest(APITestCase):
    def test_city_list_public_access(self):
        """Test that city list is publicly accessible"""
        CityFactory()
        response = self.client.get('/api/services/cities/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_city_search(self):
        """Test city search functionality"""
        CityFactory(name='Kathmandu')
        CityFactory(name='Pokhara')
        
        response = self.client.get('/api/services/cities/?search=kathmandu')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Kathmandu')

class ServiceCategoryAPITest(APITestCase):
    def test_category_list_public_access(self):
        """Test that category list is publicly accessible"""
        ServiceCategoryFactory()
        response = self.client.get('/api/services/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_category_detail_by_slug(self):
        """Test category detail by slug"""
        category = ServiceCategoryFactory(slug='plumbing')
        response = self.client.get(f'/api/services/categories/{category.slug}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['slug'], 'plumbing')

class ServiceAPITest(APITestCase):
    def setUp(self):
        self.provider = ProviderFactory()
        self.category = ServiceCategoryFactory()
        self.service = ServiceFactory(provider=self.provider, category=self.category)

    def test_service_list_public_access(self):
        """Test that service list is publicly accessible"""
        response = self.client.get('/api/services/services/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_service_detail_by_slug(self):
        """Test service detail by slug"""
        response = self.client.get(f'/api/services/services/{self.service.slug}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], self.service.title)

    def test_service_filtering(self):
        """Test service filtering"""
        ServiceFactory(category=self.category, status='active')
        ServiceFactory(category=self.category, status='inactive')
        
        response = self.client.get('/api/services/services/?status=active')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Including the one from setUp

    def test_service_search(self):
        """Test service search functionality"""
        ServiceFactory(title='Plumbing Service')
        ServiceFactory(title='Cleaning Service')
        
        response = self.client.get('/api/services/services/?search=plumbing')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Plumbing Service')

    def test_service_creation_requires_authentication(self):
        """Test that service creation requires authentication"""
        service_data = {
            'title': 'New Service',
            'description': 'Service description',
            'price': '1000.00',
            'duration': '2 hours',
            'category': self.category.id
        }
        response = self.client.post('/api/services/services/', service_data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_provider_can_create_service(self):
        """Test that provider can create service"""
        self.client.force_authenticate(user=self.provider)
        service_data = {
            'title': 'New Service',
            'description': 'Service description',
            'price': '1000.00',
            'duration': '2 hours',
            'category': self.category.id
        }
        response = self.client.post('/api/services/services/', service_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_customer_cannot_create_service(self):
        """Test that customer cannot create service"""
        customer = UserFactory(role='customer')
        self.client.force_authenticate(user=customer)
        service_data = {
            'title': 'New Service',
            'description': 'Service description',
            'price': '1000.00',
            'duration': '2 hours',
            'category': self.category.id
        }
        response = self.client.post('/api/services/services/', service_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_provider_can_update_own_service(self):
        """Test that provider can update their own service"""
        self.client.force_authenticate(user=self.provider)
        updated_data = {'title': 'Updated Service Title'}
        response = self.client.patch(f'/api/services/services/{self.service.slug}/', updated_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Service Title')

    def test_provider_cannot_update_other_service(self):
        """Test that provider cannot update other provider's service"""
        other_provider = ProviderFactory()
        self.client.force_authenticate(user=other_provider)
        updated_data = {'title': 'Updated Service Title'}
        response = self.client.patch(f'/api/services/services/{self.service.slug}/', updated_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_featured_services_endpoint(self):
        """Test featured services endpoint"""
        ServiceFactory(is_featured=True, status='active')
        ServiceFactory(is_featured=False, status='active')
        
        response = self.client.get('/api/services/services/featured/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

class FavoriteAPITest(APITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.service = ServiceFactory()
        self.client.force_authenticate(user=self.user)

    def test_favorite_list_requires_authentication(self):
        """Test that favorite list requires authentication"""
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/services/favorites/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_can_view_own_favorites(self):
        """Test that user can view their own favorites"""
        FavoriteFactory(user=self.user, service=self.service)
        response = self.client.get('/api/services/favorites/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_favorite_toggle_functionality(self):
        """Test favorite toggle functionality"""
        # Add to favorites
        response = self.client.post('/api/services/favorites/toggle/', {
            'service': self.service.id
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'favorited')
        self.assertTrue(Favorite.objects.filter(user=self.user, service=self.service).exists())

        # Remove from favorites
        response = self.client.post('/api/services/favorites/toggle/', {
            'service': self.service.id
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'unfavorited')
        self.assertFalse(Favorite.objects.filter(user=self.user, service=self.service).exists())

    def test_favorite_toggle_invalid_service(self):
        """Test favorite toggle with invalid service ID"""
        response = self.client.post('/api/services/favorites/toggle/', {
            'service': 99999
        })
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

# Integration Tests
class ServiceIntegrationTest(TestCase):
    def test_service_with_cities_and_availability(self):
        """Test creating service with cities and availability"""
        provider = ProviderFactory()
        category = ServiceCategoryFactory()
        city1 = CityFactory()
        city2 = CityFactory()
        
        service = ServiceFactory(provider=provider, category=category)
        service.cities.add(city1, city2)
        
        # Add availability
        ServiceAvailabilityFactory(
            service=service,
            day_of_week=0,
            start_time='09:00:00',
            end_time='17:00:00'
        )
        
        self.assertEqual(service.cities.count(), 2)
        self.assertEqual(service.availability.count(), 1)

    def test_service_rating_calculation(self):
        """Test service rating calculation with reviews"""
        from apps.reviews.models import Review
        
        service = ServiceFactory()
        user1 = UserFactory()
        user2 = UserFactory()
        
        # Add reviews
        Review.objects.create(
            customer=user1,
            service=service,
            rating=4,
            comment='Good service'
        )
        Review.objects.create(
            customer=user2,
            service=service,
            rating=5,
            comment='Excellent service'
        )
        
        service.refresh_from_db()
        self.assertEqual(service.reviews_count, 2)
        self.assertEqual(service.average_rating, Decimal('4.50'))

# Performance Tests
class ServicePerformanceTest(TestCase):
    def test_bulk_service_creation(self):
        """Test creating multiple services efficiently"""
        provider = ProviderFactory()
        category = ServiceCategoryFactory()
        
        services = []
        for i in range(50):
            service_data = {
                'title': f'Service {i}',
                'description': f'Description for service {i}',
                'price': Decimal('1000.00'),
                'duration': '2 hours',
                'category': category,
                'provider': provider,
                'status': 'active'
            }
            services.append(Service(**service_data))
        
        Service.objects.bulk_create(services)
        self.assertEqual(Service.objects.count(), 50)

# Edge Cases
class ServiceEdgeCaseTest(TestCase):
    def test_service_with_maximum_price(self):
        """Test service with maximum price"""
        service = ServiceFactory(price=Decimal('999999.99'))
        self.assertEqual(service.price, Decimal('999999.99'))

    def test_service_with_zero_price(self):
        """Test service with zero price"""
        with self.assertRaises(ValidationError):
            service = ServiceFactory(price=Decimal('0.00'))
            service.full_clean()

    def test_service_with_very_long_title(self):
        """Test service with very long title"""
        long_title = 'A' * 250  # Exceeds CharField max_length
        with self.assertRaises(ValidationError):
            service = ServiceFactory(title=long_title)
            service.full_clean()

    def test_service_with_invalid_status(self):
        """Test service with invalid status"""
        with self.assertRaises(ValidationError):
            service = ServiceFactory(status='invalid_status')
            service.full_clean()

