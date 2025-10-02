from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.db.models import Sum, Count, Q, F, Max
from django.db import models
from django.utils import timezone
from datetime import timedelta, datetime
from rest_framework import viewsets, status, generics, permissions, serializers, filters
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from .serializers import (
    UserSerializer, RegisterSerializer, ChangePasswordSerializer,
    UpdateProfileSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, UserPreferenceSerializer,
    OTPRequestSerializer, OTPVerifySerializer, PasswordResetWithOTPSerializer,
    ProviderDocumentSerializer, ProviderDocumentCreateSerializer,
    ProviderDocumentUpdateSerializer, DocumentStatusUpdateSerializer,
    ProviderDocumentStatsSerializer, DocumentRequirementSerializer,
    DocumentVerificationHistorySerializer
)
from .models import (
    UserPreference, Profile, PortfolioProject, PortfolioMedia,
    ProviderDocument, DocumentVerificationHistory, DocumentRequirement
)
from apps.common.permissions import IsAdmin
from django.core.cache import cache

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    """
    View for user registration.
    
    Handles creation of new user accounts with automatic token generation
    and welcome email sending.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        """
        Create a new user account and generate authentication tokens.
        
        Args:
            request: The HTTP request object
            *args: Additional positional arguments
            **kwargs: Additional keyword arguments
            
        Returns:
            Response: JSON response with tokens and user data
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        # Send welcome email
        try:
            send_welcome_email(user, request)
        except Exception as e:
            # Log error but don't fail registration
            import logging
            logging.getLogger('django').error('Welcome email send failed: %s', e)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user accounts.
    
    Provides CRUD operations for user accounts with role-based permissions
    and additional actions for profile management, preferences, and dashboard statistics.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_serializer_context(self):
        """
        Get serializer context including request object.
        
        Returns:
            dict: Context dictionary for serializers
        """
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_permissions(self):
        """
        Get permissions based on action.
        
        Returns:
            list: List of permission instances
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Get filtered queryset based on user role.
        
        Returns:
            QuerySet: Filtered user queryset
        """
        user = self.request.user
        
        # Handle anonymous users during schema generation
        if not user.is_authenticated:
            return User.objects.none()
        
        if user.role == 'admin':
            return User.objects.all()
        return User.objects.filter(id=user.id)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Get current user's profile information.
        
        Args:
            request: The HTTP request object
            
        Returns:
            Response: JSON response with current user's data
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put'], serializer_class=UpdateProfileSerializer)
    def update_profile(self, request):
        """
        Update current user's profile information.
        
        Args:
            request: The HTTP request object
            
        Returns:
            Response: JSON response with updated user data
        """
        user = request.user
        old_values = {}
        
        # Capture old values before update for tracking
        old_values = {
            'email': user.email,
            'phone': user.phone,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'profile_picture': user.profile_picture,
            'address': None,
            'bio': None,
        }
        
        # Get profile values if profile exists
        if hasattr(user, 'profile'):
            old_values['address'] = getattr(user.profile, 'address', None)
            old_values['bio'] = getattr(user.profile, 'bio', None)
        
        serializer = UpdateProfileSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Track specific profile changes
        self._track_profile_changes(user, old_values, request.data)
        
        return Response(UserSerializer(user, context={'request': request}).data)
    
    def _track_profile_changes(self, user, old_values, new_data):
        """
        Track specific profile changes for activity timeline.
        
        Args:
            user: The User instance
            old_values: Dictionary of old values
            new_data: Dictionary of new data from request
        """
        from .models import ProfileChangeHistory
        
        changes = []
        
        # Email change
        if 'email' in new_data and new_data['email'] != old_values['email']:
            changes.append({
                'field_changed': 'email',
                'old_value': old_values['email'],
                'new_value': new_data['email'],
                'change_description': f"Email updated from {old_values['email']} to {new_data['email']}"
            })
        
        # Phone change
        if 'phone' in new_data and new_data['phone'] != old_values['phone']:
            changes.append({
                'field_changed': 'phone',
                'old_value': old_values['phone'],
                'new_value': new_data['phone'],
                'change_description': f"Phone number updated from {old_values['phone'] or 'not set'} to {new_data['phone'] or 'not set'}"
            })
        
        # Name changes
        first_name_changed = 'first_name' in new_data and new_data['first_name'] != old_values['first_name']
        last_name_changed = 'last_name' in new_data and new_data['last_name'] != old_values['last_name']
        
        if first_name_changed or last_name_changed:
            old_name = f"{old_values['first_name'] or ''} {old_values['last_name'] or ''}".strip()
            new_name = f"{new_data.get('first_name', old_values['first_name']) or ''} {new_data.get('last_name', old_values['last_name']) or ''}".strip()
            changes.append({
                'field_changed': 'name',
                'old_value': old_name,
                'new_value': new_name,
                'change_description': f"Name updated from '{old_name}' to '{new_name}'"
            })
        
        # Profile picture change
        if user.profile_picture != old_values['profile_picture']:
            changes.append({
                'field_changed': 'avatar',
                'old_value': 'Had profile picture' if old_values['profile_picture'] else 'No profile picture',
                'new_value': 'Has profile picture' if user.profile_picture else 'No profile picture',
                'change_description': "Profile picture updated" if user.profile_picture else "Profile picture removed"
            })
        
        # Profile fields (address, bio)
        if hasattr(user, 'profile'):
            if 'address' in new_data and new_data['address'] != old_values['address']:
                changes.append({
                    'field_changed': 'address',
                    'old_value': old_values['address'],
                    'new_value': new_data['address'],
                    'change_description': f"Address updated from '{old_values['address'] or 'not set'}' to '{new_data['address'] or 'not set'}'"
                })
            
            if 'bio' in new_data and new_data['bio'] != old_values['bio']:
                changes.append({
                    'field_changed': 'bio',
                    'old_value': old_values['bio'],
                    'new_value': new_data['bio'],
                    'change_description': "Bio updated" if new_data['bio'] else "Bio removed"
                })
        
        # Create change history records
        for change in changes:
            ProfileChangeHistory.objects.create(
                user=user,
                field_changed=change['field_changed'],
                old_value=change['old_value'],
                new_value=change['new_value'],
                change_description=change['change_description']
            )
    
    @action(detail=False, methods=['post'], serializer_class=ChangePasswordSerializer)
    def change_password(self, request):
        """
        Change current user's password.
        
        Args:
            request: The HTTP request object
            
        Returns:
            Response: JSON response confirming password change
        """
        user = request.user
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Password changed successfully'})

    @action(detail=False, methods=['get', 'put'], url_path='preferences', serializer_class=UserPreferenceSerializer)
    def preferences(self, request):
        """
        GET/PUT user preferences.
        
        Args:
            request: The HTTP request object
            
        Returns:
            Response: JSON response with user preferences
        """
        user = request.user
        pref, _ = UserPreference.objects.get_or_create(user=user)
        if request.method == 'GET':
            return Response({'data': UserPreferenceSerializer(pref).data})
        serializer = UserPreferenceSerializer(pref, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'data': serializer.data, 'message': 'Preferences updated'})
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """
        Get customer dashboard statistics.
        
        Args:
            request: The HTTP request object
            
        Returns:
            Response: JSON response with customer dashboard statistics
        """
        user = request.user
        
        # Only allow customers to access their own stats
        if user.role != 'customer':
            return Response(
                {'detail': 'Only customers can access dashboard stats'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Import here to avoid circular imports
        from apps.bookings.models import Booking
        from apps.services.models import Service
        
        # Get user's bookings
        user_bookings = Booking.objects.filter(customer=user).select_related('payment')
        
        # Calculate statistics
        total_bookings = user_bookings.count()
        upcoming_bookings = user_bookings.filter(
            status__in=['pending', 'confirmed']
        ).count()
        completed_bookings = user_bookings.filter(status='completed').count()
        cancelled_bookings = user_bookings.filter(status='cancelled').count()
        
        # Calculate total spent from completed bookings with completed payments
        total_spent = user_bookings.filter(
            status='completed',
            payment__status='completed'
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        # Get saved services count (favorites)
        saved_services = 0
        try:
            # Check if user has favorites relationship
            if hasattr(user, 'favorites'):
                saved_services = user.favorites.count()
            elif hasattr(user, 'favorite_services'):
                saved_services = user.favorite_services.count()
        except:
            saved_services = 0
        
        # Format member since date
        member_since = user.date_joined.strftime('%B %Y')
        
        # Get recent bookings for dashboard (last 3 bookings)
        recent_bookings = user_bookings.order_by('-created_at')[:3]
        recent_bookings_data = []
        
        for booking in recent_bookings:
            booking_data = {
                'id': booking.id,
                'service_title': booking.service.title,
                'booking_date': booking.booking_date.isoformat(),
                'booking_time': booking.booking_time.strftime('%H:%M'),
                'status': booking.status,
                'total_amount': float(booking.total_amount),
            }
            
            # Add payment status if payment exists
            if hasattr(booking, 'payment') and booking.payment:
                booking_data['payment_status'] = booking.payment.status
            else:
                booking_data['payment_status'] = 'pending'
                
            recent_bookings_data.append(booking_data)
        
        # Get last booking date
        last_booking = None
        if user_bookings.exists():
            last_booking_obj = user_bookings.order_by('-created_at').first()
            last_booking = last_booking_obj.booking_date.isoformat()
        
        return Response({
            'total_bookings': total_bookings,
            'upcoming_bookings': upcoming_bookings, 
            'completed_bookings': completed_bookings,
            'cancelled_bookings': cancelled_bookings,
            'total_spent': float(total_spent),
            'saved_services': saved_services,
            'member_since': member_since,
            'user_role': user.role,
            'recent_bookings': recent_bookings_data,
            'last_booking': last_booking,
        })
    
    @action(detail=False, methods=['get'])
    def provider_dashboard_stats(self, request):
        """
        NEW ENDPOINT: Get provider dashboard statistics.
        
        Purpose: Provide comprehensive dashboard data for providers
        Impact: New endpoint - enables provider dashboard functionality
        
        Args:
            request: The HTTP request object
            
        Returns:
            Response: JSON response with provider dashboard statistics
        """
        user = request.user
        
        # Only allow providers to access their own stats
        if user.role != 'provider':
            return Response(
                {'detail': 'Only providers can access provider dashboard stats'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Import here to avoid circular imports
        from apps.bookings.models import Booking, ProviderEarnings
        from apps.services.models import Service
        from apps.reviews.models import Review
        from decimal import Decimal
        
        # Get provider's services
        provider_services = Service.objects.filter(provider=user)
        services_count = provider_services.count()
        
        # Get bookings for provider's services
        provider_bookings = Booking.objects.filter(
            service__provider=user
        ).select_related('service', 'customer', 'payment')
        
        # Calculate booking statistics
        total_bookings = provider_bookings.count()
        upcoming_bookings = provider_bookings.filter(
            status__in=['pending', 'confirmed'],
            booking_date__gte=timezone.now().date()
        ).count()
        completed_bookings = provider_bookings.filter(status='completed').count()
        
        # Calculate earnings
        completed_bookings_with_payment = provider_bookings.filter(
            status='completed',
            payment__status='completed'
        )
        
        total_earnings = completed_bookings_with_payment.aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0')
        
        # Calculate this month's earnings
        current_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        this_month_earnings = completed_bookings_with_payment.filter(
            created_at__gte=current_month_start
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0')
        
        # Calculate pending earnings (service delivered but payment pending)
        pending_earnings = provider_bookings.filter(
            status__in=['service_delivered', 'awaiting_confirmation'],
            payment__status__in=['pending', 'processing']
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0')
        
        # Calculate average rating
        reviews = Review.objects.filter(provider=user)
        average_rating = reviews.aggregate(
            avg_rating=models.Avg('rating')
        )['avg_rating'] or Decimal('0')
        
        # Format member since date
        member_since = user.date_joined.strftime('%B %Y')
        
        # Get last booking date
        last_booking = ""
        if provider_bookings.exists():
            last_booking_obj = provider_bookings.order_by('-created_at').first()
            last_booking = last_booking_obj.created_at.strftime('%B %d, %Y')
        
        # Calculate performance metrics
        response_rate = 98  # This would be calculated from actual response data
        completion_rate = 95  # This would be calculated from booking completion data
        on_time_rate = 92  # This would be calculated from delivery tracking data
        
        return Response({
            'totalBookings': total_bookings,
            'upcomingBookings': upcoming_bookings,
            'completedBookings': completed_bookings,
            'totalEarnings': float(total_earnings),
            'thisMonthEarnings': float(this_month_earnings),
            'pendingEarnings': float(pending_earnings),
            'averageRating': float(average_rating),
            'servicesCount': services_count,
            'memberSince': member_since,
            'lastBooking': last_booking,
            'earnings': {
                'total': float(total_earnings),
                'thisMonth': float(this_month_earnings),
                'pending': float(pending_earnings),
                'lastPayout': None  # This would come from payout tracking
            },
            'performance': {
                'responseRate': response_rate,
                'completionRate': completion_rate,
                'onTimeRate': on_time_rate
            }
        })
    
    @action(detail=False, methods=['get'])
    def activity_timeline(self, request):
        """
        Get customer activity timeline.
        
        Args:
            request: The HTTP request object
            
        Returns:
            Response: JSON response with customer activity timeline
        """
        user = request.user
        
        if user.role != 'customer':
            return Response(
                {'detail': 'Only customers can access activity timeline'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Import here to avoid circular imports
        from apps.bookings.models import Booking
        from apps.reviews.models import Review
        from .models import ProfileChangeHistory
        
        timeline_items = []
        
        # Get recent bookings (last 30 days)
        recent_bookings = Booking.objects.filter(
            customer=user,
            created_at__gte=timezone.now() - timedelta(days=30)
        ).order_by('-created_at')[:10]
        
        for booking in recent_bookings:
            timeline_items.append({
                'id': f"booking_{booking.id}",
                'type': 'booking',
                'title': f"Booked {booking.service.title}",
                'description': f"Booking scheduled for {booking.booking_date}",
                'timestamp': booking.created_at.isoformat(),
                'status': booking.status,
                'icon': 'calendar',
                'metadata': {
                    'booking_id': booking.id,
                    'service_title': booking.service.title,
                    'amount': float(booking.total_amount)
                }
            })
        
        # Get recent reviews (last 30 days)
        try:
            recent_reviews = Review.objects.filter(
                customer=user,
                created_at__gte=timezone.now() - timedelta(days=30)
            ).order_by('-created_at')[:5]
            
            for review in recent_reviews:
                timeline_items.append({
                    'id': f"review_{review.id}",
                    'type': 'review',
                    'title': f"Reviewed {review.provider.get_full_name()}",
                    'description': f"Gave {review.rating} stars rating",
                    'timestamp': review.created_at.isoformat(),
                    'status': 'completed',
                    'icon': 'star',
                    'metadata': {
                        'review_id': review.id,
                        'rating': review.rating,
                        'provider_name': review.provider.get_full_name()
                    }
                })
        except:
            # Reviews model might not be properly configured
            pass
        
        # Get specific profile changes (last 30 days)
        try:
            recent_profile_changes = ProfileChangeHistory.objects.filter(
                user=user,
                created_at__gte=timezone.now() - timedelta(days=30)
            ).order_by('-created_at')[:10]
            
            for change in recent_profile_changes:
                timeline_items.append({
                    'id': f"profile_change_{change.id}",
                    'type': 'profile',
                    'title': f"Profile Update - {change.get_field_changed_display()}",
                    'description': change.change_description,
                    'timestamp': change.created_at.isoformat(),
                    'status': 'completed',
                    'icon': 'user',
                    'metadata': {
                        'field_changed': change.field_changed,
                        'old_value': change.old_value,
                        'new_value': change.new_value
                    }
                })
        except:
            # ProfileChangeHistory model might not be properly configured
            pass
        
        # Add generic profile update (fallback for older changes)
        try:
            if hasattr(user, 'profile') and user.profile.updated_at and user.profile.updated_at > timezone.now() - timedelta(days=30):
                # Only add if we don't have specific changes for this time period
                has_specific_changes = False
                try:
                    for item in timeline_items:
                        if item['type'] == 'profile':
                            item_timestamp = datetime.fromisoformat(item['timestamp'].replace('Z', '+00:00'))
                            if abs((item_timestamp - user.profile.updated_at).total_seconds()) < 300:  # 5 minutes
                                has_specific_changes = True
                                break
                except Exception:
                    # If there's any issue with timestamp parsing, don't add the generic entry
                    has_specific_changes = True
                
                if not has_specific_changes:
                    timeline_items.append({
                        'id': f"profile_{user.id}",
                        'type': 'profile',
                        'title': 'Updated Profile',
                        'description': 'Profile information was updated',
                        'timestamp': user.profile.updated_at.isoformat(),
                        'status': 'completed',
                        'icon': 'user',
                        'metadata': {}
                    })
        except Exception:
            # Profile might not exist or have issues
            pass
        
        # Sort by timestamp (newest first)
        timeline_items.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return Response({
            'timeline': timeline_items[:15],  # Limit to 15 most recent items
            'total_items': len(timeline_items)
        })
    
    @action(detail=False, methods=['get'])
    def spending_trends(self, request):
        """
        ENHANCED: Get customer spending trends and analytics.
        
        FIXES IMPLEMENTED:
        1. MONTHLY SPENDING FIX: Now includes all completed bookings regardless of payment status
           - Previously only included bookings with payment__status='completed'
           - Now includes bookings with completed payments OR bookings without payment records
           - This ensures Khalti payments and other payment methods are properly tracked
        
        2. CATEGORY SPENDING FIX: Same enhancement applied to category-wise spending analysis
        
        3. YEAR-OVER-YEAR COMPARISON FIX: Enhanced to include all completed bookings
        
        4. SUMMARY STATISTICS FIX: Enhanced to include all completed bookings
        
        This resolves the issue where bookings made via Khalti were not showing up in spending analytics
        because they might not have payment records with 'completed' status in our system.
        
        Args:
            request: The HTTP request object
            
        Returns:
            Response: JSON response with customer spending trends
        """
        user = request.user
        
        if user.role != 'customer':
            return Response(
                {'detail': 'Only customers can access spending trends'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Import here to avoid circular imports
        from apps.bookings.models import Booking
        from django.db.models import Q
        
        # ENHANCED: Import Q for complex OR queries to include bookings without payment records
        
        # ENHANCED: Get date range that includes future bookings (last 12 months + next 3 months)
        # This ensures we capture bookings that might be scheduled in the future
        now_date = timezone.now().date()
        start_date = now_date - timedelta(days=365)  # Last 12 months
        end_date = now_date + timedelta(days=120)     # Next 4 months to include future bookings
        
        # Monthly spending data - ENHANCED: Include all completed bookings
        monthly_spending = []
        current_date = start_date.replace(day=1)  # Start from first day of month
        
        while current_date <= end_date:
            next_month = (current_date.replace(day=28) + timedelta(days=4)).replace(day=1)
            
            # ENHANCED: Include completed bookings with OR without payment records
            # This ensures Khalti payments and other payment methods are tracked
            month_bookings = Booking.objects.filter(
                customer=user,
                booking_date__gte=current_date,
                booking_date__lt=next_month,
                status='completed'
            ).filter(
                # Include bookings with completed payments OR bookings without payment records
                # (for cases where payment was made but not recorded in our system)
                Q(payment__status='completed') | Q(payment__isnull=True)
            )
            
            total_amount = month_bookings.aggregate(
                total=Sum('total_amount')
            )['total'] or 0
            
            booking_count = month_bookings.count()
            
            monthly_spending.append({
                'month': current_date.strftime('%Y-%m'),
                'month_name': current_date.strftime('%B %Y'),
                'total_spent': float(total_amount),
                'booking_count': booking_count,
                'average_per_booking': float(total_amount / booking_count) if booking_count > 0 else 0
            })
            
            current_date = next_month
        
        # Category-wise spending - ENHANCED: Include all completed bookings
        category_spending = Booking.objects.filter(
            customer=user,
            status='completed'
        ).filter(
            # Include bookings with completed payments OR bookings without payment records
            Q(payment__status='completed') | Q(payment__isnull=True)
        ).values(
            'service__category__name'
        ).annotate(
            total_spent=Sum('total_amount'),
            booking_count=Count('id')
        ).order_by('-total_spent')[:5]
        
        # Convert to list and handle None categories
        category_data = []
        for item in category_spending:
            category_data.append({
                'category': item['service__category__name'] or 'Other',
                'total_spent': float(item['total_spent']),
                'booking_count': item['booking_count']
            })
        
        # Year-over-year comparison - ENHANCED: Include all completed bookings
        this_year = now_date.year
        last_year = this_year - 1
        
        this_year_spending = Booking.objects.filter(
            customer=user,
            booking_date__year=this_year,
            status='completed'
        ).filter(
            Q(payment__status='completed') | Q(payment__isnull=True)
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        last_year_spending = Booking.objects.filter(
            customer=user,
            booking_date__year=last_year,
            status='completed'
        ).filter(
            Q(payment__status='completed') | Q(payment__isnull=True)
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        yoy_change = 0
        if last_year_spending > 0:
            yoy_change = ((this_year_spending - last_year_spending) / last_year_spending) * 100
        
        return Response({
            'monthly_trends': monthly_spending,
            'category_breakdown': category_data,
            'year_comparison': {
                'this_year': float(this_year_spending),
                'last_year': float(last_year_spending),
                'change_percentage': round(yoy_change, 2)
            },
            'summary': {
                'total_lifetime_spent': float(
                    Booking.objects.filter(
                        customer=user,
                        status='completed'
                    ).filter(
                        Q(payment__status='completed') | Q(payment__isnull=True)
                    ).aggregate(total=Sum('total_amount'))['total'] or 0
                ),
                'average_monthly_spending': sum(item['total_spent'] for item in monthly_spending[-6:]) / 6 if len(monthly_spending) >= 6 else 0,
                'most_expensive_booking': float(
                    Booking.objects.filter(
                        customer=user,
                        status='completed'
                    ).filter(
                        Q(payment__status='completed') | Q(payment__isnull=True)
                    ).aggregate(max_amount=Max('total_amount'))['max_amount'] or 0
                )
            }
        })
    
    @action(detail=False, methods=['get', 'post'])
    def family_members(self, request):
        """
        Manage family members for the authenticated customer.
        
        Args:
            request: The HTTP request object
            
        Returns:
            Response: JSON response with family members data or creation confirmation
        """
        user = request.user
        
        if user.role != 'customer':
            return Response(
                {'detail': 'Only customers can manage family members'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if request.method == 'GET':
            # Get all family members for the user
            from .models import FamilyMember
            
            family_members = FamilyMember.objects.filter(
                primary_user=user,
                is_active=True
            ).order_by('-created_at')
            
            # Transform to frontend expected format
            members_data = []
            for member in family_members:
                members_data.append({
                    'id': str(member.id),
                    'name': member.name,
                    'email': member.email or '',
                    'relationship': member.relationship,
                    'permissions': member.permissions_dict,
                    'addedOn': member.created_at.isoformat()
                })
            
            return Response(members_data)
        
        elif request.method == 'POST':
            # Add new family member
            from .models import FamilyMember
            
            required_fields = ['name', 'relationship']
            for field in required_fields:
                if not request.data.get(field):
                    return Response(
                        {'error': f'{field} is required'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Extract permissions from request
            permissions = request.data.get('permissions', {})
            
            try:
                family_member = FamilyMember.objects.create(
                    primary_user=user,
                    name=request.data['name'],
                    email=request.data.get('email', ''),
                    relationship=request.data['relationship'],
                    can_book_services=permissions.get('bookServices', True),
                    can_use_wallet=permissions.get('useWallet', False),
                    can_view_history=permissions.get('viewHistory', True),
                    can_manage_bookings=permissions.get('manageBookings', False)
                )
                
                return Response({
                    'id': str(family_member.id),
                    'name': family_member.name,
                    'email': family_member.email or '',
                    'relationship': family_member.relationship,
                    'permissions': family_member.permissions_dict,
                    'addedOn': family_member.created_at.isoformat()
                }, status=status.HTTP_201_CREATED)
            
            except Exception as e:
                return Response(
                    {'error': f'Failed to create family member: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
    
    @action(detail=False, methods=['put', 'delete'], url_path='family_members/(?P<member_id>[^/.]+)')
    def manage_family_member(self, request, member_id=None):
        """Update or delete specific family member"""
        user = request.user
        
        if user.role != 'customer':
            return Response(
                {'detail': 'Only customers can manage family members'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        from .models import FamilyMember
        
        try:
            family_member = FamilyMember.objects.get(
                id=member_id,
                primary_user=user
            )
        except FamilyMember.DoesNotExist:
            return Response(
                {'error': 'Family member not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if request.method == 'PUT':
            # Update family member
            if 'name' in request.data:
                family_member.name = request.data['name']
            if 'email' in request.data:
                family_member.email = request.data['email']
            if 'relationship' in request.data:
                family_member.relationship = request.data['relationship']
            
            # Update permissions
            permissions = request.data.get('permissions', {})
            family_member.can_book_services = permissions.get('bookServices', family_member.can_book_services)
            family_member.can_use_wallet = permissions.get('useWallet', family_member.can_use_wallet)
            family_member.can_view_history = permissions.get('viewHistory', family_member.can_view_history)
            family_member.can_manage_bookings = permissions.get('manageBookings', family_member.can_manage_bookings)
            
            family_member.save()
            
            return Response({
                'id': str(family_member.id),
                'name': family_member.name,
                'email': family_member.email or '',
                'relationship': family_member.relationship,
                'permissions': family_member.permissions_dict,
                'addedOn': family_member.created_at.isoformat()
            })
        
        elif request.method == 'DELETE':
            # Delete family member (soft delete)
            family_member.is_active = False
            family_member.save()
            
            return Response(
                {'message': 'Family member removed successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
    
    @action(detail=False, methods=['get', 'post'], url_path='portfolio-projects')
    def portfolio_projects(self, request):
        """Manage portfolio projects for provider profiles"""
        user = request.user
        
        if user.role != 'provider':
            return Response(
                {'detail': 'Only providers can manage portfolio projects'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Ensure user has a profile
        profile, created = Profile.objects.get_or_create(user=user)
        
        if request.method == 'GET':
            # Get all portfolio projects for the user
            projects = PortfolioProject.objects.filter(
                profile=profile
            ).prefetch_related('media_files').order_by('order', '-created_at')
            
            from .serializers import PortfolioProjectSerializer
            serializer = PortfolioProjectSerializer(
                projects, 
                many=True, 
                context={'request': request}
            )
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Create new portfolio project with multiple files
            from .serializers import PortfolioProjectSerializer
            
            # Get files from request
            files = request.FILES.getlist('files') or [request.FILES.get('file')]
            files = [f for f in files if f is not None]  # Remove None values
            
            if not files:
                return Response(
                    {'error': 'At least one file is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate files and count limits per project
            validated_files = []
            images_count = 0
            videos_count = 0
            
            for file in files:
                # Determine media type from file content type
                if file.content_type.startswith('video/'):
                    media_type = 'video'
                    videos_count += 1
                    
                    # Check video size limit (25MB)
                    if file.size > 25 * 1024 * 1024:  # 25MB in bytes
                        return Response(
                            {'error': f'Video file "{file.name}" exceeds 25MB limit'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Check video count limit per project (5 videos max per project)
                    if videos_count > 5:
                        return Response(
                            {'error': 'Maximum 5 videos allowed per project'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                        
                elif file.content_type.startswith('image/'):
                    media_type = 'image'
                    images_count += 1
                    
                    # Check image size limit (10MB)
                    if file.size > 10 * 1024 * 1024:  # 10MB in bytes
                        return Response(
                            {'error': f'Image file "{file.name}" exceeds 10MB limit'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Check image count limit per project (10 images max per project)
                    if images_count > 10:
                        return Response(
                            {'error': 'Maximum 10 images allowed per project'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                else:
                    return Response(
                        {'error': f'Unsupported file type: {file.content_type}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                validated_files.append((file, media_type))
            
            # Get the next project order number
            max_order = PortfolioProject.objects.filter(
                profile=profile
            ).aggregate(max_order=models.Max('order'))['max_order'] or 0
            
            # Create the portfolio project
            project = PortfolioProject.objects.create(
                profile=profile,
                title=request.data.get('title', f'Project {max_order + 1}'),
                description=request.data.get('description', ''),
                order=max_order + 1
            )
            
            # Create media files for the project
            created_media = []
            for i, (file, media_type) in enumerate(validated_files):
                media = PortfolioMedia.objects.create(
                    project=project,
                    media_type=media_type,
                    file=file,
                    order=i + 1,  # Order within the project
                    caption=request.data.get('caption', '')
                )
                created_media.append(media)
            
            # Serialize the created project
            serializer = PortfolioProjectSerializer(
                project, 
                context={'request': request}
            )
            
            return Response({
                'message': f'Successfully created project with {len(created_media)} files',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get', 'patch', 'delete'], url_path='portfolio-projects/(?P<project_id>[^/.]+)')
    def manage_portfolio_project(self, request, project_id=None):
        """Get, update or delete specific portfolio project"""
        user = request.user
        
        if user.role != 'provider':
            return Response(
                {'detail': 'Only providers can manage portfolio projects'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            project = PortfolioProject.objects.get(
                id=project_id,
                profile__user=user
            )
        except PortfolioProject.DoesNotExist:
            return Response(
                {'error': 'Portfolio project not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if request.method == 'GET':
            # Get project details with all media files
            from .serializers import PortfolioProjectSerializer
            serializer = PortfolioProjectSerializer(
                project,
                context={'request': request}
            )
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            # Update project details
            from .serializers import PortfolioProjectSerializer
            
            # Handle file uploads if provided
            files = request.FILES.getlist('files')
            if files:
                # Validate new files
                validated_files = []
                current_images = project.media_files.filter(media_type='image').count()
                current_videos = project.media_files.filter(media_type='video').count()
                
                for file in files:
                    if file.content_type.startswith('video/'):
                        media_type = 'video'
                        current_videos += 1
                        
                        if file.size > 25 * 1024 * 1024:
                            return Response(
                                {'error': f'Video file "{file.name}" exceeds 25MB limit'},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                        
                        if current_videos > 5:
                            return Response(
                                {'error': 'Maximum 5 videos allowed per project'},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                            
                    elif file.content_type.startswith('image/'):
                        media_type = 'image'
                        current_images += 1
                        
                        if file.size > 10 * 1024 * 1024:
                            return Response(
                                {'error': f'Image file "{file.name}" exceeds 10MB limit'},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                        
                        if current_images > 10:
                            return Response(
                                {'error': 'Maximum 10 images allowed per project'},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                    else:
                        return Response(
                            {'error': f'Unsupported file type: {file.content_type}'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    validated_files.append((file, media_type))
                
                # Add new media files to the project
                max_order = project.media_files.aggregate(
                    max_order=models.Max('order')
                )['max_order'] or 0
                
                for i, (file, media_type) in enumerate(validated_files):
                    PortfolioMedia.objects.create(
                        project=project,
                        media_type=media_type,
                        file=file,
                        order=max_order + i + 1,
                        caption=request.data.get('caption', '')
                    )
            
            # Update project fields
            if 'title' in request.data:
                project.title = request.data['title']
            if 'description' in request.data:
                project.description = request.data['description']
            if 'order' in request.data:
                project.order = int(request.data['order'])
            
            project.save()
            
            # Handle media file removal if specified
            remove_media_ids = request.data.getlist('remove_media_ids', [])
            if remove_media_ids:
                project.media_files.filter(id__in=remove_media_ids).delete()
            
            # Support setting a featured image via featured_media_id (sets order=1)
            featured_media_id = request.data.get('featured_media_id')
            if featured_media_id:
                try:
                    featured_media = project.media_files.get(id=featured_media_id)
                except PortfolioMedia.DoesNotExist:
                    featured_media = None
                if featured_media is not None:
                    from django.db import transaction
                    with transaction.atomic():
                        # Reassign orders without violating unique_together:
                        # 1) Temporarily bump all other items' order by +1000
                        others = list(project.media_files.exclude(id=featured_media.id).order_by('order', 'created_at'))
                        for media in others:
                            media.order = (media.order or 0) + 1000
                            media.save(update_fields=['order'])

                        # 2) Update featured flags: only selected is featured
                        project.media_files.update(is_featured=False)
                        featured_media.is_featured = True
                        featured_media.order = 1
                        featured_media.save(update_fields=['is_featured', 'order'])

                        # 3) Normalize others' order starting from 2
                        next_order = 2
                        for media in others:
                            if media.is_featured:
                                media.is_featured = False
                            media.order = next_order
                            media.save(update_fields=['is_featured', 'order'])
                            next_order += 1
            else:
                # Handle media file order updates (no featured change)
                media_orders = request.data.get('media_orders', {})
                # media_orders may come as JSON string, parse if needed
                if isinstance(media_orders, str) and media_orders.strip():
                    try:
                        import json
                        media_orders = json.loads(media_orders)
                    except Exception:
                        media_orders = {}
                if media_orders:
                    from django.db import transaction
                    with transaction.atomic():
                        # Phase 1: bump all item orders to avoid collisions
                        all_items = list(project.media_files.all().order_by('order', 'created_at'))
                        for item in all_items:
                            item.order = (item.order or 0) + 1000
                            item.save(update_fields=['order'])
                        # Phase 2: apply requested orders
                        assigned_orders = set()
                        ordered_pairs = sorted(((int(k), int(v)) for k, v in media_orders.items()), key=lambda x: x[1])
                        affected_ids = set()
                        for media_id, new_order in ordered_pairs:
                            try:
                                media = project.media_files.get(id=media_id)
                                media.order = int(new_order)
                                media.save(update_fields=['order'])
                                assigned_orders.add(int(new_order))
                                affected_ids.add(media_id)
                            except PortfolioMedia.DoesNotExist:
                                continue
                        # Phase 3: normalize remaining items to next available orders
                        next_order = 1
                        for item in project.media_files.exclude(id__in=affected_ids).order_by('order', 'created_at'):
                            while next_order in assigned_orders:
                                next_order += 1
                            item.order = next_order
                            item.save(update_fields=['order'])
                            assigned_orders.add(next_order)
                            next_order += 1
            
            # Return updated project
            serializer = PortfolioProjectSerializer(
                project,
                context={'request': request}
            )
            return Response(serializer.data)
        
        elif request.method == 'DELETE':
            # Delete project and all its media files
            project.delete()
            
            return Response(
                {'message': 'Portfolio project deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
    
    @action(detail=False, methods=['delete'], url_path='portfolio-media/(?P<media_id>[^/.]+)')
    def delete_portfolio_media(self, request, media_id=None):
        """Delete specific portfolio media file"""
        user = request.user
        
        if user.role != 'provider':
            return Response(
                {'detail': 'Only providers can manage portfolio media'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            media_item = PortfolioMedia.objects.get(
                id=media_id,
                project__profile__user=user
            )
        except PortfolioMedia.DoesNotExist:
            return Response(
                {'error': 'Portfolio media not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Prevent deleting the featured image
        if media_item.media_type == 'image' and (getattr(media_item, 'is_featured', False) or media_item.order == 1):
            return Response(
                {'error': 'Cannot delete featured image. Please set another image as featured first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Delete the media file
        media_item.delete()
        
        return Response(
            {'message': 'Portfolio media deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )


class PasswordResetRequestView(generics.GenericAPIView):
    """
    View for handling password reset requests.
    
    This view handles the initial step of the password reset process,
    where a user requests a password reset by providing their email address.
    It generates a reset token and sends an email with reset instructions.
    """
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Handle POST request for password reset.
        
        Validates the email address and sends a password reset email
        with a secure token if the user exists.
        
        Args:
            request: The HTTP request object containing the email address
            
        Returns:
            Response: JSON response indicating that reset email has been sent
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            
            # Generate token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Create reset link (frontend URL)
            reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
            
            # Send password reset email with HTML template
            try:
                send_password_reset_email(user, reset_link, request)
            except Exception as e:
                # Log but always return generic success to avoid leaking info
                import logging
                logging.getLogger('django').error('Password reset email send failed: %s', e)
            return Response({'detail': 'Password reset email has been sent.'})
        except User.DoesNotExist:
            # Don't reveal that the user doesn't exist
            return Response({'detail': 'Password reset email has been sent.'})

class PasswordResetConfirmView(generics.GenericAPIView):
    """
    View for confirming password reset with token validation.
    
    This view handles the final step of the password reset process,
    where a user provides a valid token and a new password to reset their account password.
    """
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Handle POST request for password reset confirmation.
        
        Validates the reset token and sets the new password for the user.
        
        Args:
            request: The HTTP request object containing the token and new password
            
        Returns:
            Response: JSON response indicating success or failure of password reset
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Parse the token
            token_parts = serializer.validated_data['token'].split('/')
            if len(token_parts) != 2:
                return Response({'detail': 'Invalid token format'}, status=status.HTTP_400_BAD_REQUEST)
                
            uid = token_parts[0]
            token = token_parts[1]
            
            # Decode the user ID
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
            
            # Verify the token
            if not default_token_generator.check_token(user, token):
                return Response({'detail': 'Token is invalid or expired'}, status=status.HTTP_400_BAD_REQUEST)
                
            # Set the new password
            user.set_password(serializer.validated_data['password'])
            user.save()
            
            return Response({'detail': 'Password has been reset successfully.'})
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'detail': 'Token is invalid or expired'}, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(generics.GenericAPIView):
    """
    View for handling user logout.
    
    This view handles user logout by blacklisting the refresh token,
    effectively invalidating the user's session.
    """
    serializer_class = serializers.Serializer  # Add empty serializer for Swagger
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        Handle POST request for user logout.
        
        Blacklists the provided refresh token to invalidate the user's session.
        
        Args:
            request: The HTTP request object containing the refresh token
            
        Returns:
            Response: JSON response indicating success or failure of logout
        """
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)


class TwoFAStatusView(APIView):
    """
    View for checking two-factor authentication status.
    
    This view allows authenticated users to check their current
    two-factor authentication status and method.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Get the current two-factor authentication status for the user.
        
        Args:
            request: The HTTP request object
            
        Returns:
            Response: JSON response with 2FA status information
        """
        user = request.user
        return Response({
            'data': {
                'enabled': bool(getattr(user, 'two_factor_enabled', False)),
                'method': getattr(user, 'two_factor_method', None)
            }
        })


class TwoFAEnableView(APIView):
    """
    View for enabling two-factor authentication.
    
    This view handles the initial step of enabling two-factor authentication
    by accepting the preferred method and generating a verification code.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Enable two-factor authentication for the user.
        
        This method accepts the 2FA method (TOTP or SMS) and generates
        a temporary verification code for confirmation.
        
        Args:
            request: The HTTP request object containing the preferred 2FA method
            
        Returns:
            Response: JSON response with verification information
        """
        method = request.data.get('method', 'totp')
        if method not in ('totp', 'sms'):
            return Response({'detail': 'Invalid method'}, status=status.HTTP_400_BAD_REQUEST)
        user = request.user
        # Generate a temporary code (in real impl, create TOTP secret or send SMS)
        code = '123456'
        cache.set(f"2fa_code:{user.id}", code, timeout=300)
        user.two_factor_method = method
        user.two_factor_enabled = False
        user.save()
        payload = {'method': method}
        if method == 'totp':
            payload['otpauth_url'] = 'otpauth://totp/SewaBazaar:{}?secret=DEMO&issuer=SewaBazaar'.format(user.email)
        return Response({'data': payload, 'message': '2FA pending verification'})


class TwoFAVerifyView(APIView):
    """
    View for verifying two-factor authentication setup.
    
    This view handles the verification step of two-factor authentication
    setup by validating the provided code.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Verify and complete two-factor authentication setup.
        
        This method validates the verification code provided by the user
        and completes the 2FA setup process.
        
        Args:
            request: The HTTP request object containing the verification code
            
        Returns:
            Response: JSON response confirming 2FA activation
        """
        user = request.user
        code = request.data.get('code')
        saved = cache.get(f"2fa_code:{user.id}")
        if not code or code != saved:
            return Response({'detail': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)
        user.two_factor_enabled = True
        user.save()
        cache.delete(f"2fa_code:{user.id}")
        return Response({'message': '2FA enabled', 'data': {'enabled': True, 'method': user.two_factor_method}})


class TwoFADisableView(APIView):
    """
    View for disabling two-factor authentication.
    
    This view allows authenticated users to disable their two-factor
    authentication if they no longer wish to use it.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Disable two-factor authentication for the user.
        
        This method disables 2FA for the authenticated user and
        clears their 2FA method preference.
        
        Args:
            request: The HTTP request object
            
        Returns:
            Response: JSON response confirming 2FA deactivation
        """
        user = request.user
        user.two_factor_enabled = False
        user.two_factor_method = None
        user.save()
        return Response({'message': '2FA disabled', 'data': {'enabled': False}})


class SessionsView(APIView):
    """
    View for listing user sessions.
    
    This view provides information about the user's active sessions,
    including device information and IP addresses.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Get information about the user's active sessions.
        
        Args:
            request: The HTTP request object
            
        Returns:
            Response: JSON response with session information
        """
        ua = request.META.get('HTTP_USER_AGENT', 'Unknown')
        ip = request.META.get('REMOTE_ADDR', '') or request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0]
        return Response({'data': [
            {
                'id': 'current',
                'user_agent': ua,
                'ip': ip,
                'city': '',
                'last_active': timezone.now().isoformat(),
                'current': True
            }
        ]})


class SessionDetailView(APIView):
    """
    View for managing individual user sessions.
    
    This view allows users to manage specific sessions, such as
    revoking/terminating sessions from other devices.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, session_id):
        """
        Delete/revoke a specific user session.
        
        Note: With JWT we cannot revoke without tracking refresh tokens;
        this implementation responds with success for non-current sessions.
        
        Args:
            request: The HTTP request object
            session_id: The ID of the session to delete
            
        Returns:
            Response: HTTP 204 No Content or 400 Bad Request
        """
        # With JWT we cannot revoke without tracking refresh tokens; respond success for non-current
        if session_id == 'current':
            return Response({'detail': 'Cannot revoke current session'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)


class OTPRequestView(generics.GenericAPIView):
    """
    View for requesting one-time passwords (OTP).
    
    This view handles OTP requests for user authentication, generating
    and sending a time-limited verification code to the user's email.
    """
    serializer_class = OTPRequestSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        Request an OTP for user authentication.
        
        This method generates a 6-digit OTP, stores it with a 10-minute
        expiration time, and sends it to the user's email address.
        
        Args:
            request: The HTTP request object containing the user's email
            
        Returns:
            Response: JSON response indicating that OTP has been sent
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        # Always respond success, even if user does not exist
        try:
            user = User.objects.get(email=email)
            # Generate 6-digit OTP
            otp = f"{timezone.now().microsecond % 1000000:06d}"
            # Store OTP with TTL 10 minutes
            cache.set(f"otp:{email}", otp, timeout=600)
            # Send OTP email with HTML template
            send_otp_email(email, otp, request)
        except User.DoesNotExist:
            pass
        return Response({'detail': 'If the email exists, an OTP has been sent.'})


class OTPVerifyView(generics.GenericAPIView):
    """
    View for verifying one-time passwords (OTP).
    
    This view handles OTP verification for user authentication, validating
    the provided code and issuing authentication tokens upon successful verification.
    """
    serializer_class = OTPVerifySerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        Verify an OTP for user authentication.
        
        This method validates the provided OTP against the stored code
        and issues authentication tokens if verification is successful.
        
        Args:
            request: The HTTP request object containing email and OTP
            
        Returns:
            Response: JSON response with authentication tokens or error message
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        saved = cache.get(f"otp:{email}")
        if not saved or saved != otp:
            return Response({'detail': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)
        # Optionally issue tokens for login via OTP
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)

        # Clear OTP after successful verification
        cache.delete(f"otp:{email}")

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user, context={'request': request}).data
        })


class OTPResetPasswordView(generics.GenericAPIView):
    """
    View for resetting password using OTP.
    
    This view allows users to reset their password using a valid OTP,
    providing an alternative to the traditional email-based password reset flow.
    """
    serializer_class = PasswordResetWithOTPSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        Reset user password using OTP verification.
        
        This method validates the provided OTP and sets a new password
        for the user's account if verification is successful.
        
        Args:
            request: The HTTP request object containing email, OTP, and new password
            
        Returns:
            Response: JSON response indicating success or failure of password reset
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        password = serializer.validated_data['password']
        saved = cache.get(f"otp:{email}")
        if not saved or saved != otp:
            return Response({'detail': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(password)
        user.save()
        cache.delete(f"otp:{email}")
        return Response({'detail': 'Password has been reset successfully.'})


# Email helper functions
def send_welcome_email(user, request):
    """
    Send welcome email to newly registered user.
    
    This function sends a welcome email to new users with account information
    and next steps for using the platform.
    
    Args:
        user: The User instance for the newly registered user
        request: The HTTP request object
    """
    subject = 'Welcome to SewaBazaar! 🎉'
    
    # Build absolute logo URL from STATIC_URL
    try:
        from django.contrib.sites.models import Site
        current_domain = Site.objects.get_current().domain
        base_url = f"https://{current_domain}" if not settings.DEBUG else settings.FRONTEND_URL.rstrip('/')
    except Exception:
        base_url = settings.FRONTEND_URL.rstrip('/')
    logo_url = base_url + settings.STATIC_URL + 'assets/logo.png'

    html_content = render_to_string('emails/welcome.html', {
        'user': user,
        'frontend_url': settings.FRONTEND_URL,
        'logo_url': logo_url,
    })
    
    text_content = f"""
    Welcome to SewaBazaar!
    
    Hi {user.first_name or user.email},
    
    Welcome to SewaBazaar - Nepal's premier local services marketplace!
    
    Your account has been successfully created. You can now:
    - Complete your profile
    - Browse and book services
    - Earn rewards for your activities
    
    Visit your dashboard: {settings.FRONTEND_URL}/dashboard/{user.role}
    
    Best regards,
    The SewaBazaar Team
    """
    
    msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [user.email])
    msg.attach_alternative(html_content, "text/html")
    msg.send()


def send_password_reset_email(user, reset_link, request):
    """
    Send password reset email with HTML template.
    
    This function sends a password reset email to users who have requested
    to reset their password, including a secure reset link.
    
    Args:
        user: The User instance requesting password reset
        reset_link: The secure password reset link
        request: The HTTP request object
    """
    subject = 'Reset Your SewaBazaar Password'
    
    try:
        from django.contrib.sites.models import Site
        current_domain = Site.objects.get_current().domain
        base_url = f"https://{current_domain}" if not settings.DEBUG else settings.FRONTEND_URL.rstrip('/')
    except Exception:
        base_url = settings.FRONTEND_URL.rstrip('/')
    logo_url = base_url + settings.STATIC_URL + 'assets/logo.png'

    html_content = render_to_string('emails/password_reset.html', {
        'user': user,
        'reset_link': reset_link,
        'frontend_url': settings.FRONTEND_URL,
        'logo_url': logo_url,
    })
    
    text_content = f"""
    Reset Your SewaBazaar Password
    
    Hi there,
    
    We received a request to reset the password for your SewaBazaar account.
    
    Click the link below to reset your password:
    {reset_link}
    
    This link will expire in 24 hours for your security.
    
    If you didn't request this reset, please ignore this email.
    
    Best regards,
    The SewaBazaar Security Team
    """
    
    msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [user.email])
    msg.attach_alternative(html_content, "text/html")
    msg.send()


def send_otp_email(email, otp_code, request):
    """
    Send OTP email with HTML template.
    
    This function sends a one-time password (OTP) email to users for
    verification purposes during login or other security-sensitive operations.
    
    Args:
        email: The email address to send the OTP to
        otp_code: The one-time password code
        request: The HTTP request object
    """
    subject = 'Your SewaBazaar Verification Code'
    
    try:
        from django.contrib.sites.models import Site
        current_domain = Site.objects.get_current().domain
        base_url = f"https://{current_domain}" if not settings.DEBUG else settings.FRONTEND_URL.rstrip('/')
    except Exception:
        base_url = settings.FRONTEND_URL.rstrip('/')
    logo_url = base_url + settings.STATIC_URL + 'assets/logo.png'

    html_content = render_to_string('emails/otp.html', {
        'otp_code': otp_code,
        'frontend_url': settings.FRONTEND_URL,
        'logo_url': logo_url,
    })
    
    text_content = f"""
    Your SewaBazaar Verification Code
    
    Hi there,
    
    You requested a verification code for your SewaBazaar account.
    
    Your verification code is: {otp_code}
    
    This code expires in 10 minutes.
    
    If you didn't request this code, please contact our support team.
    
    Best regards,
    The SewaBazaar Team
    """
    
    msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [email])
    msg.attach_alternative(html_content, "text/html")
    msg.send()


# Document Management Views

class ProviderDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing provider documents and verification.
    
    This ViewSet handles document uploads, updates, and the verification workflow
    for service providers. It provides endpoints for providers to manage their
    verification documents and for admins to review and approve them.
    
    Purpose: Handle document uploads, updates, and verification workflow
    Impact: New ViewSet - enables complete document management system
    """
    serializer_class = ProviderDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['document_type', 'status', 'is_required', 'is_featured']
    search_fields = ['title', 'description', 'issuing_authority']
    ordering_fields = ['created_at', 'updated_at', 'expiry_date', 'order']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Get the queryset for provider documents based on user role.
        
        Admin users can see all documents, providers can only see their own
        documents, and other users cannot access documents.
        
        Returns:
            QuerySet: Filtered queryset of ProviderDocument instances
        """
        user = self.request.user
        
        if not user.is_authenticated:
            return ProviderDocument.objects.none()
        
        # Admin can see all documents
        if user.role == 'admin':
            return ProviderDocument.objects.all().select_related(
                'provider__user', 'reviewed_by'
            ).prefetch_related('verification_history')
        
        # Providers can only see their own documents
        if user.role == 'provider':
            # Ensure user has a profile
            profile, created = Profile.objects.get_or_create(user=user)
            return ProviderDocument.objects.filter(
                provider=profile
            ).select_related('reviewed_by').prefetch_related('verification_history')
        
        # Other users cannot access documents
        return ProviderDocument.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ProviderDocumentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ProviderDocumentUpdateSerializer
        elif self.action == 'update_status':
            return DocumentStatusUpdateSerializer
        return ProviderDocumentSerializer
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action == 'update_status':
            # Only admins can update document status
            permission_classes = [IsAdmin]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only providers can manage their own documents
            permission_classes = [permissions.IsAuthenticated]
        else:
            # Anyone authenticated can view (filtered by get_queryset)
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """
        Set provider when creating document.
        
        This method ensures that only providers can create documents and
        automatically sets the provider relationship.
        
        Args:
            serializer: The serializer instance for the document being created
        
        Raises:
            serializers.ValidationError: If the user is not a provider
        """
        user = self.request.user
        if user.role != 'provider':
            raise serializers.ValidationError("Only providers can upload documents")
        
        # Ensure user has a profile
        profile, created = Profile.objects.get_or_create(user=user)
        serializer.save(provider=profile)
    
    def perform_update(self, serializer):
        """Ensure providers can only update their own documents"""
        user = self.request.user
        document = self.get_object()
        
        if user.role == 'provider' and document.provider.user != user:
            raise serializers.ValidationError("You can only update your own documents")
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Ensure providers can only delete their own documents"""
        user = self.request.user
        
        if user.role == 'provider' and instance.provider.user != user:
            raise serializers.ValidationError("You can only delete your own documents")
        
        # Soft delete by setting status to rejected
        instance.status = 'rejected'
        instance.save()
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get document statistics for the current provider.
        
        This endpoint provides statistics about a provider's documents,
        including counts by status, verification progress, and missing requirements.
        
        Args:
            request: The HTTP request object
            
        Returns:
            Response: JSON response with document statistics
        """
        user = request.user
        
        if user.role != 'provider':
            return Response(
                {'detail': 'Only providers can access document statistics'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Ensure user has a profile
        profile, created = Profile.objects.get_or_create(user=user)
        
        # Get provider's documents
        documents = ProviderDocument.objects.filter(provider=profile)
        
        # Calculate statistics
        total_documents = documents.count()
        pending_documents = documents.filter(status='pending').count()
        approved_documents = documents.filter(status='approved').count()
        rejected_documents = documents.filter(status='rejected').count()
        expired_documents = documents.filter(status='expired').count()
        
        # Calculate verification progress
        if total_documents > 0:
            verification_progress = (approved_documents / total_documents) * 100
        else:
            verification_progress = 0.0
        
        # Get document requirements
        requirements = DocumentRequirement.objects.filter(is_active=True)
        required_documents_count = requirements.filter(is_mandatory=True).count()
        
        # Check completed requirements
        completed_requirements = 0
        missing_requirements = []
        
        for requirement in requirements.filter(is_mandatory=True):
            has_document = documents.filter(
                document_type=requirement.document_type,
                status='approved'
            ).exists()
            
            if has_document:
                completed_requirements += 1
            else:
                missing_requirements.append(requirement.name)
        
        stats_data = {
            'total_documents': total_documents,
            'pending_documents': pending_documents,
            'approved_documents': approved_documents,
            'rejected_documents': rejected_documents,
            'expired_documents': expired_documents,
            'verification_progress': round(verification_progress, 2),
            'required_documents_count': required_documents_count,
            'completed_requirements': completed_requirements,
            'missing_requirements': missing_requirements
        }
        
        serializer = ProviderDocumentStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def update_status(self, request, pk=None):
        """
        Update document verification status (admin only).
        
        This endpoint allows admin users to update the verification status
        of provider documents, such as approving or rejecting them.
        
        Args:
            request: The HTTP request object
            pk: The primary key of the document to update
            
        Returns:
            Response: JSON response with the updated document data
        """
        document = self.get_object()
        serializer = DocumentStatusUpdateSerializer(
            document, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Return updated document
        return Response(
            ProviderDocumentSerializer(document, context={'request': request}).data
        )
    
    @action(detail=False, methods=['get'])
    def requirements(self, request):
        """
        Get document requirements for providers.
        
        This endpoint provides a list of document requirements that
        providers must fulfill for account verification.
        
        Args:
            request: The HTTP request object
            
        Returns:
            Response: JSON response with document requirements
        """
        requirements = DocumentRequirement.objects.filter(
            is_active=True
        ).order_by('order', 'name')
        
        serializer = DocumentRequirementSerializer(requirements, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk_upload(self, request):
        """
        Upload multiple documents at once.
        
        This endpoint allows providers to upload multiple documents in a single
        request, which is more efficient than uploading documents one by one.
        
        Args:
            request: The HTTP request object containing files and metadata
            
        Returns:
            Response: JSON response with created documents and any errors
        """
        user = request.user
        
        if user.role != 'provider':
            return Response(
                {'detail': 'Only providers can upload documents'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Ensure user has a profile
        profile, created = Profile.objects.get_or_create(user=user)
        
        # Get files from request
        files = request.FILES.getlist('files')
        if not files:
            return Response(
                {'error': 'No files provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get document types and titles from request
        document_types = request.data.getlist('document_types', [])
        titles = request.data.getlist('titles', [])
        descriptions = request.data.getlist('descriptions', [])
        
        if len(files) != len(document_types):
            return Response(
                {'error': 'Number of files must match number of document types'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_documents = []
        errors = []
        
        for i, file in enumerate(files):
            try:
                document_type = document_types[i] if i < len(document_types) else 'other'
                title = titles[i] if i < len(titles) else f"Document {i+1}"
                description = descriptions[i] if i < len(descriptions) else ""
                
                # Create document
                document = ProviderDocument.objects.create(
                    provider=profile,
                    document_type=document_type,
                    title=title,
                    description=description,
                    file=file,
                    status='pending'
                )
                
                created_documents.append(document)
                
            except Exception as e:
                errors.append(f"File {i+1}: {str(e)}")
        
        # Serialize created documents
        serializer = ProviderDocumentSerializer(
            created_documents, 
            many=True, 
            context={'request': request}
        )
        
        response_data = {
            'message': f'Successfully uploaded {len(created_documents)} documents',
            'documents': serializer.data
        }
        
        if errors:
            response_data['errors'] = errors
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Get documents expiring within 30 days"""
        user = request.user
        
        if user.role != 'provider':
            return Response(
                {'detail': 'Only providers can access this endpoint'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Ensure user has a profile
        profile, created = Profile.objects.get_or_create(user=user)
        
        # Get documents expiring within 30 days
        expiry_threshold = timezone.now().date() + timedelta(days=30)
        
        expiring_documents = ProviderDocument.objects.filter(
            provider=profile,
            expiry_date__lte=expiry_threshold,
            expiry_date__gte=timezone.now().date(),
            status='approved'
        ).order_by('expiry_date')
        
        serializer = ProviderDocumentSerializer(
            expiring_documents, 
            many=True, 
            context={'request': request}
        )
        
        return Response({
            'count': expiring_documents.count(),
            'documents': serializer.data
        })


class DocumentRequirementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for document requirements (read-only for providers).
    
    This ViewSet provides read-only access to document requirements that
    service providers must fulfill for account verification. Providers can
    view what documents are required and their specifications.
    
    Purpose: Allow providers to view document requirements
    Impact: New ViewSet - enables requirement-based document system
    """
    queryset = DocumentRequirement.objects.filter(is_active=True)
    serializer_class = DocumentRequirementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['document_type', 'is_mandatory', 'priority']
    ordering_fields = ['order', 'name', 'priority']
    ordering = ['order', 'name']
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get requirements grouped by service category"""
        # This would be implemented when service categories are integrated
        requirements = self.get_queryset()
        serializer = self.get_serializer(requirements, many=True)
        return Response(serializer.data)


class DocumentVerificationHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for document verification history (read-only).
    
    This ViewSet provides read-only access to the audit trail of document
    verification activities. Both providers and admins can view the history
    of status changes for verification documents.
    
    Purpose: Allow viewing of document verification audit trail
    Impact: New ViewSet - enables verification history tracking
    """
    serializer_class = DocumentVerificationHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['document', 'previous_status', 'new_status', 'changed_by']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        
        if not user.is_authenticated:
            return DocumentVerificationHistory.objects.none()
        
        # Admin can see all history
        if user.role == 'admin':
            return DocumentVerificationHistory.objects.all().select_related(
                'document', 'changed_by'
            )
        
        # Providers can only see history for their own documents
        if user.role == 'provider':
            # Ensure user has a profile
            profile, created = Profile.objects.get_or_create(user=user)
            return DocumentVerificationHistory.objects.filter(
                document__provider=profile
            ).select_related('document', 'changed_by')
        
        return DocumentVerificationHistory.objects.none()


# Admin-specific Document Management Views

class AdminDocumentViewSet(viewsets.ModelViewSet):
    """
    Admin-only ViewSet for document management and verification.
    
    This ViewSet provides administrative functionality for managing and
    verifying provider documents. Only admin users can access these endpoints
    to review, approve, reject, and manage verification documents.
    
    Purpose: Provide admin interface for document verification workflow
    Impact: New ViewSet - enables admin document management
    """
    serializer_class = ProviderDocumentSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['document_type', 'status', 'priority', 'is_required', 'provider']
    search_fields = ['title', 'description', 'provider__user__email', 'provider__user__first_name', 'provider__user__last_name']
    ordering_fields = ['created_at', 'updated_at', 'expiry_date', 'priority']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Get the queryset for all provider documents (admin only).
        
        Admin users can see all documents from all providers, with
        related data prefetched for performance.
        
        Returns:
            QuerySet: All ProviderDocument instances with related data
        """
        return ProviderDocument.objects.all().select_related(
            'provider__user', 'reviewed_by'
        ).prefetch_related('verification_history')
    
    @action(detail=False, methods=['get'])
    def pending_review(self, request):
        """
        Get documents pending admin review.
        
        This endpoint provides a list of documents that require admin
        review, ordered by priority and creation date.
        
        Args:
            request: The HTTP request object
            
        Returns:
            Response: JSON response with pending documents
        """
        pending_docs = self.get_queryset().filter(
            status__in=['pending', 'resubmission_required']
        ).order_by('priority', '-created_at')
        
        serializer = self.get_serializer(pending_docs, many=True)
        return Response({
            'count': pending_docs.count(),
            'documents': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def verification_queue(self, request):
        """
        Get documents in verification queue with priority sorting.
        
        This endpoint provides a prioritized list of documents that
        are in the verification queue, sorted by priority level and creation date.
        
        Args:
            request: The HTTP request object
            
        Returns:
            Response: JSON response with verification queue documents
        """
        queue_docs = self.get_queryset().filter(
            status__in=['pending', 'under_review', 'resubmission_required']
        ).order_by(
            models.Case(
                models.When(priority='critical', then=models.Value(1)),
                models.When(priority='high', then=models.Value(2)),
                models.When(priority='medium', then=models.Value(3)),
                models.When(priority='low', then=models.Value(4)),
                default=models.Value(5),
                output_field=models.IntegerField()
            ),
            '-created_at'
        )
        
        serializer = self.get_serializer(queue_docs, many=True)
        return Response({
            'count': queue_docs.count(),
            'documents': serializer.data
        })
    
    @action(detail=True, methods=['patch'])
    def approve(self, request, pk=None):
        """
        Approve a document.
        
        This endpoint allows admin users to approve a provider document,
        marking it as verified and valid.
        
        Args:
            request: The HTTP request object
            pk: The primary key of the document to approve
            
        Returns:
            Response: JSON response with the approved document data
        """
        document = self.get_object()
        old_status = document.status
        
        document.status = 'approved'
        document.reviewed_by = request.user
        document.reviewed_at = timezone.now()
        document.review_notes = request.data.get('review_notes', '')
        document.save()
        
        # Create history entry
        DocumentVerificationHistory.objects.create(
            document=document,
            previous_status=old_status,
            new_status='approved',
            changed_by=request.user,
            change_reason='Document approved by admin',
            notes=request.data.get('review_notes', '')
        )
        
        serializer = self.get_serializer(document)
        return Response({
            'message': 'Document approved successfully',
            'document': serializer.data
        })
    
    @action(detail=True, methods=['patch'])
    def reject(self, request, pk=None):
        """
        Reject a document.
        
        This endpoint allows admin users to reject a provider document,
        requiring the provider to resubmit with corrections.
        
        Args:
            request: The HTTP request object
            pk: The primary key of the document to reject
            
        Returns:
            Response: JSON response with the rejected document data
        """
        document = self.get_object()
        old_status = document.status
        
        rejection_reason = request.data.get('rejection_reason', '')
        if not rejection_reason:
            return Response(
                {'error': 'Rejection reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        document.status = 'rejected'
        document.reviewed_by = request.user
        document.reviewed_at = timezone.now()
        document.rejection_reason = rejection_reason
        document.review_notes = request.data.get('review_notes', '')
        document.save()
        
        # Create history entry
        DocumentVerificationHistory.objects.create(
            document=document,
            previous_status=old_status,
            new_status='rejected',
            changed_by=request.user,
            change_reason=rejection_reason,
            notes=request.data.get('review_notes', '')
        )
        
        serializer = self.get_serializer(document)
        return Response({
            'message': 'Document rejected successfully',
            'document': serializer.data
        })
    
    @action(detail=True, methods=['patch'])
    def request_resubmission(self, request, pk=None):
        """Request document resubmission"""
        document = self.get_object()
        old_status = document.status
        
        resubmission_reason = request.data.get('resubmission_reason', '')
        if not resubmission_reason:
            return Response(
                {'error': 'Resubmission reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        document.status = 'resubmission_required'
        document.reviewed_by = request.user
        document.reviewed_at = timezone.now()
        document.rejection_reason = resubmission_reason
        document.review_notes = request.data.get('review_notes', '')
        document.save()
        
        # Create history entry
        DocumentVerificationHistory.objects.create(
            document=document,
            previous_status=old_status,
            new_status='resubmission_required',
            changed_by=request.user,
            change_reason=resubmission_reason,
            notes=request.data.get('review_notes', '')
        )
        
        serializer = self.get_serializer(document)
        return Response({
            'message': 'Resubmission requested successfully',
            'document': serializer.data
        })
    
    @action(detail=True, methods=['patch'])
    def mark_under_review(self, request, pk=None):
        """Mark document as under review"""
        document = self.get_object()
        old_status = document.status
        
        document.status = 'under_review'
        document.reviewed_by = request.user
        document.reviewed_at = timezone.now()
        document.review_notes = request.data.get('review_notes', '')
        document.save()
        
        # Create history entry
        DocumentVerificationHistory.objects.create(
            document=document,
            previous_status=old_status,
            new_status='under_review',
            changed_by=request.user,
            change_reason='Document marked as under review',
            notes=request.data.get('review_notes', '')
        )
        
        serializer = self.get_serializer(document)
        return Response({
            'message': 'Document marked as under review',
            'document': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def bulk_approve(self, request):
        """
        Bulk approve documents.
        
        This endpoint allows admin users to approve multiple documents
        in a single request, improving efficiency for batch operations.
        
        Args:
            request: The HTTP request object containing document IDs
            
        Returns:
            Response: JSON response with approval results
        """
        document_ids = request.data.get('document_ids', [])
        if not document_ids:
            return Response(
                {'error': 'No document IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        documents = self.get_queryset().filter(id__in=document_ids)
        updated_count = 0
        
        for document in documents:
            old_status = document.status
            document.status = 'approved'
            document.reviewed_by = request.user
            document.reviewed_at = timezone.now()
            document.review_notes = request.data.get('review_notes', '')
            document.save()
            
            # Create history entry
            DocumentVerificationHistory.objects.create(
                document=document,
                previous_status=old_status,
                new_status='approved',
                changed_by=request.user,
                change_reason='Bulk approved by admin',
                notes=request.data.get('review_notes', '')
            )
            updated_count += 1
        
        return Response({
            'message': f'{updated_count} documents approved successfully',
            'updated_count': updated_count
        })
    
    @action(detail=False, methods=['post'])
    def bulk_reject(self, request):
        """Bulk reject documents"""
        document_ids = request.data.get('document_ids', [])
        rejection_reason = request.data.get('rejection_reason', '')
        
        if not document_ids:
            return Response(
                {'error': 'No document IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not rejection_reason:
            return Response(
                {'error': 'Rejection reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        documents = self.get_queryset().filter(id__in=document_ids)
        updated_count = 0
        
        for document in documents:
            old_status = document.status
            document.status = 'rejected'
            document.reviewed_by = request.user
            document.reviewed_at = timezone.now()
            document.rejection_reason = rejection_reason
            document.review_notes = request.data.get('review_notes', '')
            document.save()
            
            # Create history entry
            DocumentVerificationHistory.objects.create(
                document=document,
                previous_status=old_status,
                new_status='rejected',
                changed_by=request.user,
                change_reason=rejection_reason,
                notes=request.data.get('review_notes', '')
            )
            updated_count += 1
        
        return Response({
            'message': f'{updated_count} documents rejected successfully',
            'updated_count': updated_count
        })
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get admin document statistics.
        
        This endpoint provides comprehensive statistics about all provider
        documents for admin users, including counts by status, priority,
        document type, and recent activity.
        
        Args:
            request: The HTTP request object
            
        Returns:
            Response: JSON response with document statistics
        """
        total_documents = self.get_queryset().count()
        
        stats = {
            'total_documents': total_documents,
            'pending_documents': self.get_queryset().filter(status='pending').count(),
            'under_review_documents': self.get_queryset().filter(status='under_review').count(),
            'approved_documents': self.get_queryset().filter(status='approved').count(),
            'rejected_documents': self.get_queryset().filter(status='rejected').count(),
            'expired_documents': self.get_queryset().filter(status='expired').count(),
            'resubmission_required': self.get_queryset().filter(status='resubmission_required').count(),
        }
        
        # Priority breakdown
        priority_stats = {}
        for priority in ['critical', 'high', 'medium', 'low']:
            priority_stats[priority] = self.get_queryset().filter(priority=priority).count()
        
        stats['priority_breakdown'] = priority_stats
        
        # Document type breakdown
        type_stats = {}
        for doc_type in ['business_license', 'insurance_certificate', 'professional_certification', 
                        'identity_document', 'tax_certificate', 'bank_statement', 
                        'portfolio_certificate', 'other']:
            type_stats[doc_type] = self.get_queryset().filter(document_type=doc_type).count()
        
        stats['type_breakdown'] = type_stats
        
        # Recent activity (last 7 days)
        recent_date = timezone.now() - timedelta(days=7)
        stats['recent_uploads'] = self.get_queryset().filter(created_at__gte=recent_date).count()
        stats['recent_approvals'] = self.get_queryset().filter(
            status='approved', 
            reviewed_at__gte=recent_date
        ).count()
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def expiring_documents(self, request):
        """Get documents expiring within specified days"""
        days = int(request.query_params.get('days', 30))
        expiry_threshold = timezone.now().date() + timedelta(days=days)
        
        expiring_docs = self.get_queryset().filter(
            expiry_date__lte=expiry_threshold,
            expiry_date__gte=timezone.now().date(),
            status='approved'
        ).order_by('expiry_date')
        
        serializer = self.get_serializer(expiring_docs, many=True)
        return Response({
            'count': expiring_docs.count(),
            'days_threshold': days,
            'documents': serializer.data
        })


class AdminDocumentRequirementViewSet(viewsets.ModelViewSet):
    """
    Admin-only ViewSet for managing document requirements.
    
    This ViewSet provides administrative functionality for managing
    document requirements that providers must fulfill for verification.
    Only admin users can access these endpoints to create, update, and
    manage document requirements.
    
    Purpose: Allow admins to manage document requirements
    Impact: New ViewSet - enables admin requirement management
    """
    queryset = DocumentRequirement.objects.all()
    serializer_class = DocumentRequirementSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['document_type', 'is_mandatory', 'priority', 'is_active']
    ordering_fields = ['order', 'name', 'priority', 'created_at']
    ordering = ['order', 'name']
    
    @action(detail=False, methods=['post'])
    def bulk_update_order(self, request):
        """Bulk update requirement order"""
        order_data = request.data.get('order_data', [])
        if not order_data:
            return Response(
                {'error': 'No order data provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated_count = 0
        for item in order_data:
            requirement_id = item.get('id')
            new_order = item.get('order')
            
            if requirement_id and new_order is not None:
                try:
                    requirement = DocumentRequirement.objects.get(id=requirement_id)
                    requirement.order = new_order
                    requirement.save()
                    updated_count += 1
                except DocumentRequirement.DoesNotExist:
                    continue
        
        return Response({
            'message': f'{updated_count} requirements updated successfully',
            'updated_count': updated_count
        })
    
    @action(detail=True, methods=['patch'])
    def toggle_active(self, request, pk=None):
        """
        Toggle requirement active status.
        
        This endpoint allows admin users to activate or deactivate
        document requirements, controlling which requirements are
        currently enforced for providers.
        
        Args:
            request: The HTTP request object
            pk: The primary key of the requirement to toggle
            
        Returns:
            Response: JSON response with the updated requirement
        """
        requirement = self.get_object()
        requirement.is_active = not requirement.is_active
        requirement.save()
        
        serializer = self.get_serializer(requirement)
        return Response({
            'message': f'Requirement {"activated" if requirement.is_active else "deactivated"} successfully',
            'requirement': serializer.data
        })
