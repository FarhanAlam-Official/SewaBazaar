import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
import factory
from factory.django import DjangoModelFactory
from apps.accounts.tests import UserFactory
from apps.services.tests import ServiceFactory
from .models import Review
from .serializers import ReviewSerializer

# Factory classes for test data
class ReviewFactory(DjangoModelFactory):
    class Meta:
        model = Review
    
    customer = factory.SubFactory(UserFactory)
    service = factory.SubFactory(ServiceFactory)
    rating = factory.Iterator([1, 2, 3, 4, 5])
    comment = factory.Faker('text', max_nb_chars=500)

# Model Tests
class ReviewModelTest(TestCase):
    def setUp(self):
        self.customer = UserFactory()
        self.service = ServiceFactory()
        self.review_data = {
            'customer': self.customer,
            'service': self.service,
            'rating': 4,
            'comment': 'Great service, highly recommended!'
        }

    def test_create_review(self):
        """Test creating a review"""
        review = Review.objects.create(**self.review_data)
        self.assertEqual(review.customer, self.customer)
        self.assertEqual(review.service, self.service)
        self.assertEqual(review.rating, 4)
        self.assertEqual(review.comment, 'Great service, highly recommended!')

    def test_review_str_representation(self):
        """Test review string representation"""
        review = ReviewFactory()
        expected = f"Review by {review.customer.email} for {review.service.title}"
        self.assertEqual(str(review), expected)

    def test_review_rating_validation(self):
        """Test review rating validation"""
        # Valid ratings
        valid_ratings = [1, 2, 3, 4, 5]
        for rating in valid_ratings:
            review = ReviewFactory(rating=rating)
            self.assertEqual(review.rating, rating)

        # Invalid ratings
        invalid_ratings = [0, 6, -1, 10]
        for rating in invalid_ratings:
            with self.assertRaises(ValidationError):
                review = ReviewFactory(rating=rating)
                review.full_clean()

    def test_unique_review_constraint(self):
        """Test unique constraint for reviews"""
        Review.objects.create(**self.review_data)
        with self.assertRaises(IntegrityError):
            Review.objects.create(**self.review_data)

    def test_review_ordering(self):
        """Test review ordering by creation date"""
        review1 = ReviewFactory()
        review2 = ReviewFactory()
        review3 = ReviewFactory()
        
        reviews = Review.objects.all()
        # Should be ordered by created_at (desc)
        self.assertEqual(reviews[0], review3)
        self.assertEqual(reviews[1], review2)
        self.assertEqual(reviews[2], review1)

    def test_review_with_minimum_rating(self):
        """Test review with minimum rating"""
        review = ReviewFactory(rating=1)
        self.assertEqual(review.rating, 1)

    def test_review_with_maximum_rating(self):
        """Test review with maximum rating"""
        review = ReviewFactory(rating=5)
        self.assertEqual(review.rating, 5)

    def test_review_with_long_comment(self):
        """Test review with long comment"""
        long_comment = 'A' * 1000  # Long comment
        review = ReviewFactory(comment=long_comment)
        self.assertEqual(review.comment, long_comment)

# Serializer Tests
class ReviewSerializerTest(TestCase):
    def setUp(self):
        self.review = ReviewFactory()
        self.serializer = ReviewSerializer(instance=self.review)

    def test_contains_expected_fields(self):
        """Test serializer contains expected fields"""
        data = self.serializer.data
        expected_fields = ['id', 'customer', 'service', 'rating', 'comment', 'created_at', 'updated_at']
        for field in expected_fields:
            self.assertIn(field, data)

    def test_review_validation(self):
        """Test review serializer validation"""
        customer = UserFactory()
        service = ServiceFactory()
        
        review_data = {
            'customer': customer.id,
            'service': service.id,
            'rating': 4,
            'comment': 'Great service!'
        }
        
        serializer = ReviewSerializer(data=review_data)
        self.assertTrue(serializer.is_valid())

    def test_review_rating_validation_in_serializer(self):
        """Test rating validation in serializer"""
        customer = UserFactory()
        service = ServiceFactory()
        
        # Valid rating
        review_data = {
            'customer': customer.id,
            'service': service.id,
            'rating': 5,
            'comment': 'Excellent service!'
        }
        serializer = ReviewSerializer(data=review_data)
        self.assertTrue(serializer.is_valid())
        
        # Invalid rating
        review_data['rating'] = 6
        serializer = ReviewSerializer(data=review_data)
        self.assertFalse(serializer.is_valid())

# API Tests
class ReviewAPITest(APITestCase):
    def setUp(self):
        self.customer = UserFactory()
        self.service = ServiceFactory()
        self.review = ReviewFactory(
            customer=self.customer,
            service=self.service
        )

    def test_review_list_public_access(self):
        """Test that review list is publicly accessible"""
        response = self.client.get('/api/reviews/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_review_detail_public_access(self):
        """Test that review detail is publicly accessible"""
        response = self.client.get(f'/api/reviews/{self.review.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.review.id)

    def test_review_creation_requires_authentication(self):
        """Test that review creation requires authentication"""
        review_data = {
            'service': self.service.id,
            'rating': 4,
            'comment': 'Great service!'
        }
        response = self.client.post('/api/reviews/', review_data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_customer_can_create_review(self):
        """Test that customer can create review"""
        self.client.force_authenticate(user=self.customer)
        review_data = {
            'service': self.service.id,
            'rating': 4,
            'comment': 'Great service!'
        }
        response = self.client.post('/api/reviews/', review_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_customer_cannot_review_same_service_twice(self):
        """Test that customer cannot review same service twice"""
        self.client.force_authenticate(user=self.customer)
        review_data = {
            'service': self.service.id,
            'rating': 5,
            'comment': 'Another review'
        }
        response = self.client.post('/api/reviews/', review_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_review_update_by_owner(self):
        """Test that review owner can update review"""
        self.client.force_authenticate(user=self.customer)
        updated_data = {'rating': 5, 'comment': 'Updated review'}
        response = self.client.patch(f'/api/reviews/{self.review.id}/', updated_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['rating'], 5)
        self.assertEqual(response.data['comment'], 'Updated review')

    def test_review_update_by_non_owner(self):
        """Test that non-owner cannot update review"""
        other_customer = UserFactory()
        self.client.force_authenticate(user=other_customer)
        updated_data = {'rating': 1, 'comment': 'Malicious update'}
        response = self.client.patch(f'/api/reviews/{self.review.id}/', updated_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_review_deletion_by_owner(self):
        """Test that review owner can delete review"""
        self.client.force_authenticate(user=self.customer)
        response = self.client.delete(f'/api/reviews/{self.review.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_review_deletion_by_non_owner(self):
        """Test that non-owner cannot delete review"""
        other_customer = UserFactory()
        self.client.force_authenticate(user=other_customer)
        response = self.client.delete(f'/api/reviews/{self.review.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_review_filtering_by_service(self):
        """Test review filtering by service"""
        other_service = ServiceFactory()
        ReviewFactory(service=other_service)
        
        response = self.client.get(f'/api/reviews/?service={self.service.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['service'], self.service.id)

    def test_review_filtering_by_rating(self):
        """Test review filtering by rating"""
        ReviewFactory(service=self.service, rating=5)
        ReviewFactory(service=self.service, rating=3)
        
        response = self.client.get('/api/reviews/?rating=5')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['rating'], 5)

    def test_review_filtering_by_customer(self):
        """Test review filtering by customer"""
        other_customer = UserFactory()
        ReviewFactory(customer=other_customer, service=self.service)
        
        response = self.client.get(f'/api/reviews/?customer={self.customer.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['customer'], self.customer.id)

# Integration Tests
class ReviewIntegrationTest(TestCase):
    def test_review_affects_service_rating(self):
        """Test that review affects service average rating"""
        service = ServiceFactory()
        customer1 = UserFactory()
        customer2 = UserFactory()
        
        # Add first review
        Review.objects.create(
            customer=customer1,
            service=service,
            rating=4,
            comment='Good service'
        )
        service.refresh_from_db()
        self.assertEqual(service.average_rating, Decimal('4.00'))
        self.assertEqual(service.reviews_count, 1)
        
        # Add second review
        Review.objects.create(
            customer=customer2,
            service=service,
            rating=5,
            comment='Excellent service'
        )
        service.refresh_from_db()
        self.assertEqual(service.average_rating, Decimal('4.50'))
        self.assertEqual(service.reviews_count, 2)

    def test_review_update_affects_service_rating(self):
        """Test that review update affects service average rating"""
        service = ServiceFactory()
        customer = UserFactory()
        
        # Create review
        review = Review.objects.create(
            customer=customer,
            service=service,
            rating=3,
            comment='Average service'
        )
        service.refresh_from_db()
        self.assertEqual(service.average_rating, Decimal('3.00'))
        
        # Update review
        review.rating = 5
        review.save()
        service.refresh_from_db()
        self.assertEqual(service.average_rating, Decimal('5.00'))

    def test_review_deletion_affects_service_rating(self):
        """Test that review deletion affects service average rating"""
        service = ServiceFactory()
        customer1 = UserFactory()
        customer2 = UserFactory()
        
        # Add two reviews
        review1 = Review.objects.create(
            customer=customer1,
            service=service,
            rating=4,
            comment='Good service'
        )
        Review.objects.create(
            customer=customer2,
            service=service,
            rating=5,
            comment='Excellent service'
        )
        service.refresh_from_db()
        self.assertEqual(service.average_rating, Decimal('4.50'))
        self.assertEqual(service.reviews_count, 2)
        
        # Delete one review
        review1.delete()
        service.refresh_from_db()
        self.assertEqual(service.average_rating, Decimal('5.00'))
        self.assertEqual(service.reviews_count, 1)

    def test_service_with_no_reviews(self):
        """Test service with no reviews"""
        service = ServiceFactory()
        self.assertEqual(service.average_rating, Decimal('0.00'))
        self.assertEqual(service.reviews_count, 0)

# Performance Tests
class ReviewPerformanceTest(TestCase):
    def test_bulk_review_creation(self):
        """Test creating multiple reviews efficiently"""
        service = ServiceFactory()
        customers = [UserFactory() for _ in range(50)]
        
        reviews = []
        for i, customer in enumerate(customers):
            review_data = {
                'customer': customer,
                'service': service,
                'rating': (i % 5) + 1,  # Ratings 1-5
                'comment': f'Review {i}'
            }
            reviews.append(Review(**review_data))
        
        Review.objects.bulk_create(reviews)
        self.assertEqual(Review.objects.count(), 50)

    def test_review_query_performance(self):
        """Test review query performance"""
        service = ServiceFactory()
        
        # Create multiple reviews
        for i in range(100):
            ReviewFactory(service=service)
        
        # Test query performance
        import time
        start_time = time.time()
        reviews = Review.objects.filter(service=service)
        end_time = time.time()
        
        self.assertEqual(reviews.count(), 100)
        self.assertLess(end_time - start_time, 0.1)  # Should be fast

# Edge Cases
class ReviewEdgeCaseTest(TestCase):
    def test_review_with_minimum_rating(self):
        """Test review with minimum rating"""
        review = ReviewFactory(rating=1)
        self.assertEqual(review.rating, 1)

    def test_review_with_maximum_rating(self):
        """Test review with maximum rating"""
        review = ReviewFactory(rating=5)
        self.assertEqual(review.rating, 5)

    def test_review_with_empty_comment(self):
        """Test review with empty comment"""
        review = ReviewFactory(comment='')
        self.assertEqual(review.comment, '')

    def test_review_with_very_long_comment(self):
        """Test review with very long comment"""
        long_comment = 'A' * 2000  # Very long comment
        review = ReviewFactory(comment=long_comment)
        self.assertEqual(review.comment, long_comment)

    def test_review_with_special_characters(self):
        """Test review with special characters"""
        special_comment = 'Review with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
        review = ReviewFactory(comment=special_comment)
        self.assertEqual(review.comment, special_comment)

    def test_review_with_unicode_characters(self):
        """Test review with unicode characters"""
        unicode_comment = 'Review with unicode: नेपाली भाषा में समीक्षा'
        review = ReviewFactory(comment=unicode_comment)
        self.assertEqual(review.comment, unicode_comment)

# Business Logic Tests
class ReviewBusinessLogicTest(TestCase):
    def test_average_rating_calculation(self):
        """Test average rating calculation logic"""
        service = ServiceFactory()
        ratings = [1, 2, 3, 4, 5]
        
        for rating in ratings:
            ReviewFactory(service=service, rating=rating)
        
        service.refresh_from_db()
        expected_average = sum(ratings) / len(ratings)
        self.assertEqual(service.average_rating, Decimal(str(expected_average)))

    def test_average_rating_with_decimal(self):
        """Test average rating with decimal result"""
        service = ServiceFactory()
        
        # Add reviews that will result in decimal average
        ReviewFactory(service=service, rating=4)
        ReviewFactory(service=service, rating=5)
        
        service.refresh_from_db()
        self.assertEqual(service.average_rating, Decimal('4.50'))

    def test_average_rating_rounding(self):
        """Test average rating rounding"""
        service = ServiceFactory()
        
        # Add reviews that will result in repeating decimal
        ReviewFactory(service=service, rating=1)
        ReviewFactory(service=service, rating=2)
        ReviewFactory(service=service, rating=3)
        
        service.refresh_from_db()
        # Should round to 2 decimal places
        self.assertEqual(service.average_rating, Decimal('2.00'))

    def test_review_count_accuracy(self):
        """Test review count accuracy"""
        service = ServiceFactory()
        self.assertEqual(service.reviews_count, 0)
        
        # Add reviews
        for i in range(10):
            ReviewFactory(service=service)
        
        service.refresh_from_db()
        self.assertEqual(service.reviews_count, 10)
        
        # Delete a review
        Review.objects.filter(service=service).first().delete()
        service.refresh_from_db()
        self.assertEqual(service.reviews_count, 9)

    def test_unique_review_constraint_enforcement(self):
        """Test unique review constraint enforcement"""
        customer = UserFactory()
        service = ServiceFactory()
        
        # Create first review
        Review.objects.create(
            customer=customer,
            service=service,
            rating=4,
            comment='First review'
        )
        
        # Try to create second review by same customer for same service
        with self.assertRaises(IntegrityError):
            Review.objects.create(
                customer=customer,
                service=service,
                rating=5,
                comment='Second review'
            )

    def test_review_signal_triggering(self):
        """Test that review signals are triggered correctly"""
        service = ServiceFactory()
        customer = UserFactory()
        
        # Create review and check if signal updates service
        review = Review.objects.create(
            customer=customer,
            service=service,
            rating=4,
            comment='Test review'
        )
        
        service.refresh_from_db()
        self.assertEqual(service.average_rating, Decimal('4.00'))
        self.assertEqual(service.reviews_count, 1)
        
        # Update review and check if signal updates service
        review.rating = 5
        review.save()
        
        service.refresh_from_db()
        self.assertEqual(service.average_rating, Decimal('5.00'))
        self.assertEqual(service.reviews_count, 1)
        
        # Delete review and check if signal updates service
        review.delete()
        
        service.refresh_from_db()
        self.assertEqual(service.average_rating, Decimal('0.00'))
        self.assertEqual(service.reviews_count, 0)

