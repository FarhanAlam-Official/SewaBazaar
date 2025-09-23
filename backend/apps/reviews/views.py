"""
PHASE 2 NEW FILE: Views for public provider profiles and reviews

Purpose: Handle API endpoints for provider profiles and gated reviews
Impact: New API endpoints - provides public provider profiles and review system
"""

from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.conf import settings

from .models import Review
from .serializers import (
    ReviewSerializer, CreateReviewSerializer, UpdateReviewSerializer,
    ProviderProfileSerializer, ReviewEligibilitySerializer
)
from .services import ReviewEligibilityService, ReviewAnalyticsService
from apps.accounts.models import Profile
from apps.common.permissions import IsCustomer

User = get_user_model()


class ProviderProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    PHASE 2 NEW VIEWSET: Public provider profiles
    
    Purpose: Provide public access to provider profile information
    Impact: New API - allows public viewing of provider profiles
    
    Endpoints:
    - GET /api/providers/{id}/profile/ - Get provider profile
    - GET /api/providers/{id}/reviews/ - Get provider reviews
    - GET /api/providers/{id}/review-eligibility/ - Check review eligibility
    """
    serializer_class = ProviderProfileSerializer
    permission_classes = [permissions.AllowAny]  # Public access
    lookup_field = 'user_id'
    
    def get_queryset(self):
        """Get profiles for providers only"""
        return Profile.objects.filter(
            user__role='provider',
            user__is_active=True
        ).select_related('user')
    
    def get_object(self):
        """Get profile by provider user ID"""
        user_id = self.kwargs.get('user_id')
        provider = get_object_or_404(User, id=user_id, role='provider', is_active=True)
        
        # Get or create profile for provider
        profile, created = Profile.objects.get_or_create(user=provider)
        return profile
    
    @action(detail=True, methods=['get'])
    def reviews(self, request, user_id=None):
        """
        Get paginated reviews for a provider
        
        GET /api/providers/{id}/reviews/?page=1&page_size=10&rating=5
        """
        provider = get_object_or_404(User, id=user_id, role='provider', is_active=True)
        
        # Get reviews for this provider
        reviews = Review.objects.filter(provider=provider).select_related(
            'customer', 'booking__service'
        ).order_by('-created_at')
        
        # Filter by rating if specified
        rating_filter = request.query_params.get('rating')
        if rating_filter:
            try:
                rating = int(rating_filter)
                if 1 <= rating <= 5:
                    reviews = reviews.filter(rating=rating)
            except (ValueError, TypeError):
                pass
        
        # Paginate results
        page = self.paginate_queryset(reviews)
        if page is not None:
            serializer = ReviewSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = ReviewSerializer(reviews, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def review_eligibility(self, request, user_id=None):
        """
        Check if current user can review this provider
        
        GET /api/providers/{id}/review-eligibility/?booking_id=123
        """
        if not request.user.is_authenticated:
            return Response({
                'eligible': False,
                'reason': 'Authentication required to check review eligibility'
            })
        
        provider = get_object_or_404(User, id=user_id, role='provider', is_active=True)
        customer = request.user
        booking_id = request.query_params.get('booking_id')
        
        # Check eligibility
        eligibility = ReviewEligibilityService.is_eligible(
            customer, provider, booking_id
        )
        
        serializer = ReviewEligibilitySerializer(eligibility)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsCustomer])
    def create_review(self, request, user_id=None):
        """
        Create a review for this provider
        
        POST /api/providers/{id}/create-review/
        {
            "booking_id": 123,
            "rating": 5,
            "comment": "Great service!"
        }
        """
        provider = get_object_or_404(User, id=user_id, role='provider', is_active=True)
        
        # Add provider context to serializer
        serializer = CreateReviewSerializer(
            data=request.data,
            context={'request': request, 'provider': provider}
        )
        
        if serializer.is_valid():
            review = serializer.save()
            response_serializer = ReviewSerializer(review, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReviewViewSet(viewsets.ModelViewSet):
    """
    PHASE 2 NEW VIEWSET: Review management
    
    Purpose: Handle CRUD operations for reviews
    Impact: New API - allows review management with proper permissions
    
    Endpoints:
    - GET /api/reviews/ - List user's reviews
    - GET /api/reviews/{id}/ - Get specific review
    - PATCH /api/reviews/{id}/ - Update review (within time window)
    - DELETE /api/reviews/{id}/ - Delete review
    """
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['rating', 'provider']
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Get reviews based on user role"""
        user = self.request.user
        
        # Handle anonymous users during schema generation
        if not user.is_authenticated:
            return Review.objects.none()
        
        if user.role == 'admin':
            return Review.objects.all().select_related('customer', 'provider', 'booking__service')
        elif user.role == 'customer':
            return Review.objects.filter(customer=user).select_related('provider', 'booking__service')
        elif user.role == 'provider':
            return Review.objects.filter(provider=user).select_related('customer', 'booking__service')
        
        return Review.objects.none()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return CreateReviewSerializer
        elif self.action in ['update', 'partial_update']:
            return UpdateReviewSerializer
        return ReviewSerializer
    
    def perform_create(self, serializer):
        """Create review with authenticated user as customer"""
        # The CreateReviewSerializer already validates and sets customer, provider, booking
        # in its validate method, so we just need to save
        review = serializer.save()
        # The response will be handled by the DRF ModelViewSet create method
        # which will serialize the created instance using the main serializer
    
    def create(self, request, *args, **kwargs):
        """Create review and return full review data"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()  # Save and get the instance directly
        headers = self.get_success_headers(serializer.data)
        
        # Use the main serializer to return the created review data
        response_serializer = ReviewSerializer(instance, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        """Update review with permission check"""
        review = self.get_object()
        
        # Check edit permissions
        permission_check = ReviewEligibilityService.can_edit_review(review, request.user)
        if not permission_check['can_edit']:
            return Response(
                {'error': permission_check['reason']},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Perform the update
        serializer = self.get_serializer(review, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_review = serializer.save()
        
        # Return the full review data using the main ReviewSerializer
        response_serializer = ReviewSerializer(updated_review, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_200_OK)
    
    def destroy(self, request, *args, **kwargs):
        """Delete review with permission check"""
        review = self.get_object()
        
        # Check delete permissions
        permission_check = ReviewEligibilityService.can_delete_review(review, request.user)
        if not permission_check['can_delete']:
            return Response(
                {'error': permission_check['reason']},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reply(self, request, pk=None):
        """
        Provider adds or updates a public reply to a review
        POST /api/reviews/{id}/reply/
        { "response": "Thank you!" }
        """
        review = self.get_object()
        user = request.user
        # Only the provider who is the subject of the review can reply
        if getattr(user, 'role', None) != 'provider' or review.provider_id != user.id:
            return Response({ 'error': 'Only the reviewed provider can reply to this review' }, status=status.HTTP_403_FORBIDDEN)
        response_text = request.data.get('response', '')
        if not response_text or not str(response_text).strip():
            return Response({ 'error': 'Response text is required' }, status=status.HTTP_400_BAD_REQUEST)
        # Limit length similar to comment rules
        response_text = str(response_text).strip()
        if len(response_text) > 1000:
            return Response({ 'error': 'Response cannot exceed 1000 characters' }, status=status.HTTP_400_BAD_REQUEST)
        from django.utils import timezone
        # Set fields
        if not review.provider_response_created_at:
            review.provider_response_created_at = timezone.now()
        review.provider_response = response_text
        review.provider_response_updated_at = timezone.now()
        review.provider_responded_by = user
        review.save(update_fields=['provider_response', 'provider_response_created_at', 'provider_response_updated_at', 'provider_responded_by', 'updated_at'])
        # Return updated review payload
        return Response(ReviewSerializer(review, context={'request': request}).data)
    
    @action(detail=False, methods=['get'])
    def my_reviews(self, request):
        """
        Get current user's reviews
        
        GET /api/reviews/my-reviews/
        """
        if request.user.role != 'customer':
            return Response(
                {'error': 'Only customers can access their reviews'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        reviews = Review.objects.filter(customer=request.user).select_related(
            'provider', 'booking__service'
        ).order_by('-created_at')
        
        page = self.paginate_queryset(reviews)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_reviews_with_rewards(self, request):
        """
        Get user's reviews with reward claim status
        
        GET /api/reviews/my_reviews_with_rewards/
        """
        user = request.user
        if user.role != 'customer':
            return Response({'error': 'Only customers can access this endpoint'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        reviews = Review.objects.filter(customer=user).select_related(
            'provider', 'booking__service'
        ).order_by('-created_at')
        
        # Serialize reviews with reward claim status
        review_data = []
        for review in reviews:
            serializer = ReviewSerializer(review, context={'request': request})
            review_dict = serializer.data
            # Add reward claim status
            review_dict['is_reward_claimed'] = review.is_reward_claimed
            review_data.append(review_dict)
        
        return Response(review_data)
    
    @action(detail=False, methods=['get'])
    def provider_reviews(self, request):
        """
        Get reviews for current provider
        
        GET /api/reviews/provider_reviews/
        """
        if request.user.role != 'provider':
            return Response(
                {'error': 'Only providers can access their reviews'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        reviews = Review.objects.filter(provider=request.user).select_related(
            'customer', 'booking__service'
        ).order_by('-created_at')
        
        # Add rating summary
        rating_summary = ReviewAnalyticsService.get_provider_rating_summary(request.user)
        
        page = self.paginate_queryset(reviews)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response_data = self.get_paginated_response(serializer.data).data
            response_data['rating_summary'] = rating_summary
            return Response(response_data)
        
        serializer = self.get_serializer(reviews, many=True)
        return Response({
            'results': serializer.data,
            'rating_summary': rating_summary
        })


# Feature flag check decorator
def feature_flag_required(flag_name):
    """Decorator to check if feature flag is enabled"""
    def decorator(view_func):
        def wrapper(self, request, *args, **kwargs):
            feature_flags = getattr(settings, 'FEATURE_FLAGS', {})
            if not feature_flags.get(flag_name, False):
                return Response(
                    {'error': f'Feature {flag_name} is not enabled'},
                    status=status.HTTP_404_NOT_FOUND
                )
            return view_func(self, request, *args, **kwargs)
        return wrapper
    return decorator


# Apply feature flags to viewsets
original_dispatch = ProviderProfileViewSet.dispatch
def provider_profile_dispatch(self, request, *args, **kwargs):
    feature_flags = getattr(settings, 'FEATURE_FLAGS', {})
    if not feature_flags.get('PUBLIC_PROVIDER_PROFILE', True):
        return Response(
            {'error': 'Public provider profiles are not enabled'},
            status=status.HTTP_404_NOT_FOUND
        )
    return original_dispatch(self, request, *args, **kwargs)

ProviderProfileViewSet.dispatch = provider_profile_dispatch

original_review_dispatch = ReviewViewSet.dispatch
def review_dispatch(self, request, *args, **kwargs):
    feature_flags = getattr(settings, 'FEATURE_FLAGS', {})
    if not feature_flags.get('REVIEWS_SYSTEM', True):
        return Response(
            {'error': 'Reviews system is not enabled'},
            status=status.HTTP_404_NOT_FOUND
        )
    return original_review_dispatch(self, request, *args, **kwargs)

ReviewViewSet.dispatch = review_dispatch