"""
Review eligibility and management services.

This module contains service classes for determining review eligibility,
handling review business logic, and providing review analytics.

Purpose: Handle review eligibility validation and business logic
Impact: New service layer - provides gated review functionality
"""

from django.db.models import Q
from django.utils import timezone
from .models import Review
from apps.bookings.models import Booking
import logging

logger = logging.getLogger(__name__)


class ReviewEligibilityService:
    """
    Service class for determining review eligibility.
    
    Centralizes review eligibility logic and validation to ensure
    only eligible customers can review providers and that reviews
    are properly managed within time windows.
    
    Methods:
        is_eligible: Check if a customer is eligible to review a provider
        get_eligible_bookings: Get all bookings eligible for review
        can_edit_review: Check if a user can edit a specific review
        can_delete_review: Check if a user can delete a specific review
    """
    """
    Service class for determining review eligibility
    
    Purpose: Centralize review eligibility logic and validation
    Impact: Ensures only eligible customers can review providers
    """
    
    @staticmethod
    def is_eligible(customer, provider, booking_id=None):
        """
        Check if a customer is eligible to review a provider.
        
        Determines eligibility based on completed bookings with the provider
        that don't already have reviews. Optionally checks a specific booking.
        
        Args:
            customer (User): User instance (customer)
            provider (User): User instance (provider)
            booking_id (int, optional): Specific booking ID to check
            
        Returns:
            dict: {
                'eligible': bool,
                'reason': str,
                'eligible_bookings': list,
                'booking': Booking instance (if booking_id provided)
            }
        """
        result = {
            'eligible': False,
            'reason': '',
            'eligible_bookings': [],
            'booking': None
        }
        
        # Basic validation
        if not customer or customer.role != 'customer':
            result['reason'] = 'Only customers can write reviews'
            return result
        
        if not provider or provider.role != 'provider':
            result['reason'] = 'Invalid provider'
            return result
        
        if customer == provider:
            result['reason'] = 'You cannot review yourself'
            return result
        
        # Get completed bookings for this customer with this provider
        eligible_bookings = Booking.objects.filter(
            customer=customer,
            service__provider=provider,
            status='completed'
        ).exclude(
            # Exclude bookings that already have reviews
            review__isnull=False
        ).order_by('-booking_date')
        
        if not eligible_bookings.exists():
            # Check if there are any bookings at all
            any_bookings = Booking.objects.filter(
                customer=customer,
                service__provider=provider
            ).exists()
            
            if not any_bookings:
                result['reason'] = 'You have not booked any services with this provider'
            else:
                # Check if all bookings already have reviews
                all_reviewed = not Booking.objects.filter(
                    customer=customer,
                    service__provider=provider,
                    status='completed'
                ).exclude(review__isnull=False).exists()
                
                if all_reviewed:
                    result['reason'] = 'You have already reviewed all your completed bookings with this provider'
                else:
                    result['reason'] = 'You can only review completed bookings'
            
            return result
        
        # If specific booking ID provided, validate it
        if booking_id:
            try:
                booking = eligible_bookings.get(id=booking_id)
                result['booking'] = booking
                result['eligible'] = True
                result['reason'] = 'Eligible to review this booking'
            except Booking.DoesNotExist:
                result['reason'] = 'Invalid booking or booking not eligible for review'
                return result
        else:
            # General eligibility - has at least one eligible booking
            result['eligible'] = True
            result['reason'] = f'You have {eligible_bookings.count()} completed booking(s) eligible for review'
        
        result['eligible_bookings'] = list(eligible_bookings.values(
            'id', 'service__title', 'booking_date', 'booking_time', 'total_amount'
        ))
        
        return result
    
    @staticmethod
    def get_eligible_bookings(customer, provider):
        """
        Get all bookings eligible for review.
        
        Retrieves all completed bookings for a customer with a provider
        that don't already have reviews.
        
        Args:
            customer (User): User instance (customer)
            provider (User): User instance (provider)
            
        Returns:
            QuerySet: Eligible booking instances
        """
        return Booking.objects.filter(
            customer=customer,
            service__provider=provider,
            status='completed'
        ).exclude(
            review__isnull=False
        ).order_by('-booking_date')
    
    @staticmethod
    def can_edit_review(review, user):
        """
        Check if a user can edit a specific review.
        
        Determines if a user can edit a review based on ownership and
        time window constraints (24 hours from creation).
        
        Args:
            review (Review): Review instance
            user (User): User instance
            
        Returns:
            dict: {'can_edit': bool, 'reason': str}
        """
        if not review:
            return {'can_edit': False, 'reason': 'Review not found'}
        
        # Admin can always edit
        if user.role == 'admin':
            return {'can_edit': True, 'reason': 'Admin privileges'}
        
        # Only the review author can edit
        if review.customer != user:
            return {'can_edit': False, 'reason': 'You can only edit your own reviews'}
        
        # Check time window
        if not review.can_be_edited:
            return {'can_edit': False, 'reason': 'Review edit window has expired (24 hours)'}
        
        return {'can_edit': True, 'reason': 'Review can be edited'}
    
    @staticmethod
    def can_delete_review(review, user):
        """
        Check if a user can delete a specific review.
        
        Determines if a user can delete a review based on ownership.
        There is no time limit for deletion.
        
        Args:
            review (Review): Review instance
            user (User): User instance
            
        Returns:
            dict: {'can_delete': bool, 'reason': str}
        """
        if not review:
            return {'can_delete': False, 'reason': 'Review not found'}
        
        # Admin can always delete
        if user.role == 'admin':
            return {'can_delete': True, 'reason': 'Admin privileges'}
        
        # Only the review author can delete (no time limit for deletion)
        if review.customer != user:
            return {'can_delete': False, 'reason': 'You can only delete your own reviews'}
        
        return {'can_delete': True, 'reason': 'Review can be deleted'}


class ReviewAnalyticsService:
    """
    Service class for review analytics and statistics.
    
    Provides review analytics and rating breakdowns for providers,
    including average ratings, distribution breakdowns, and trends.
    
    Methods:
        get_provider_rating_summary: Get comprehensive rating summary for a provider
        get_recent_reviews: Get recent reviews for a provider
        get_review_trends: Get review trends for a provider over specified days
    """
    """
    Service class for review analytics and statistics
    
    Purpose: Provide review analytics and rating breakdowns
    Impact: Supports provider profile rating summaries
    """
    
    @staticmethod
    def get_provider_rating_summary(provider):
        """
        Get comprehensive rating summary for a provider.
        
        Calculates the provider's average rating, total review count,
        and distribution breakdown (how many 1-star, 2-star, etc. reviews).
        
        Args:
            provider (User): User instance (provider)
            
        Returns:
            dict: Rating summary with average, count, and breakdown
        """
        reviews = Review.objects.filter(provider=provider)
        
        if not reviews.exists():
            return {
                'average': 0.0,
                'count': 0,
                'breakdown': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            }
        
        # Calculate breakdown
        breakdown = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        total_rating = 0
        count = 0
        
        for review in reviews:
            breakdown[review.rating] += 1
            total_rating += review.rating
            count += 1
        
        average = round(total_rating / count, 2) if count > 0 else 0.0
        
        return {
            'average': average,
            'count': count,
            'breakdown': breakdown
        }
    
    @staticmethod
    def get_recent_reviews(provider, limit=5):
        """
        Get recent reviews for a provider.
        
        Retrieves the most recent reviews for a provider, including
        customer and booking information.
        
        Args:
            provider (User): User instance (provider)
            limit (int): Number of recent reviews to return (default: 5)
            
        Returns:
            QuerySet: Recent review instances
        """
        return Review.objects.filter(
            provider=provider
        ).select_related(
            'customer', 'booking__service'
        ).order_by('-created_at')[:limit]
    
    @staticmethod
    def get_review_trends(provider, days=30):
        """
        Get review trends for a provider over specified days.
        
        Analyzes review trends for a provider over a specified period,
        comparing recent average ratings to overall average ratings
        to determine if ratings are improving, declining, or stable.
        
        Args:
            provider (User): User instance (provider)
            days (int): Number of days to analyze (default: 30)
            
        Returns:
            dict: Trend analysis data
        """
        from django.utils import timezone
        from datetime import timedelta
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        recent_reviews = Review.objects.filter(
            provider=provider,
            created_at__gte=start_date
        )
        
        if not recent_reviews.exists():
            return {
                'period_days': days,
                'reviews_count': 0,
                'average_rating': 0.0,
                'trend': 'no_data'
            }
        
        # Calculate average for the period
        total_rating = sum(review.rating for review in recent_reviews)
        count = recent_reviews.count()
        period_average = round(total_rating / count, 2)
        
        # Compare with overall average
        overall_summary = ReviewAnalyticsService.get_provider_rating_summary(provider)
        overall_average = overall_summary['average']
        
        if period_average > overall_average:
            trend = 'improving'
        elif period_average < overall_average:
            trend = 'declining'
        else:
            trend = 'stable'
        
        return {
            'period_days': days,
            'reviews_count': count,
            'average_rating': period_average,
            'overall_average': overall_average,
            'trend': trend
        }