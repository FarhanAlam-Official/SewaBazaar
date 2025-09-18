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
from rest_framework import viewsets, status, generics, permissions, serializers
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import (
    UserSerializer, RegisterSerializer, ChangePasswordSerializer,
    UpdateProfileSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, UserPreferenceSerializer,
    OTPRequestSerializer, OTPVerifySerializer, PasswordResetWithOTPSerializer
)
from .models import UserPreference
from apps.common.permissions import IsAdmin
from django.core.cache import cache

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
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
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        user = self.request.user
        
        # Handle anonymous users during schema generation
        if not user.is_authenticated:
            return User.objects.none()
        
        if user.role == 'admin':
            return User.objects.all()
        return User.objects.filter(id=user.id)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put'], serializer_class=UpdateProfileSerializer)
    def update_profile(self, request):
        user = request.user
        serializer = UpdateProfileSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user, context={'request': request}).data)
    
    @action(detail=False, methods=['post'], serializer_class=ChangePasswordSerializer)
    def change_password(self, request):
        user = request.user
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Password changed successfully'})

    @action(detail=False, methods=['get', 'put'], url_path='preferences', serializer_class=UserPreferenceSerializer)
    def preferences(self, request):
        """GET/PUT user preferences"""
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
        """Get customer dashboard statistics"""
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
    def activity_timeline(self, request):
        """Get customer activity timeline"""
        user = request.user
        
        if user.role != 'customer':
            return Response(
                {'detail': 'Only customers can access activity timeline'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Import here to avoid circular imports
        from apps.bookings.models import Booking
        from apps.reviews.models import Review
        
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
        
        # Add profile updates
        try:
            if hasattr(user, 'profile') and user.profile.updated_at and user.profile.updated_at > timezone.now() - timedelta(days=30):
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
        except:
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
        ENHANCED: Get customer spending trends and analytics
        
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
        """Manage family members for the authenticated customer"""
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

class PasswordResetRequestView(generics.GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
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
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
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
    serializer_class = serializers.Serializer  # Add empty serializer for Swagger
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)


class TwoFAStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'data': {
                'enabled': bool(getattr(user, 'two_factor_enabled', False)),
                'method': getattr(user, 'two_factor_method', None)
            }
        })


class TwoFAEnableView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Simplified enable: accepts method and generates a fake code in cache for verification."""
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
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
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
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        user.two_factor_enabled = False
        user.two_factor_method = None
        user.save()
        return Response({'message': '2FA disabled', 'data': {'enabled': False}})


class SessionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
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
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, session_id):
        # With JWT we cannot revoke without tracking refresh tokens; respond success for non-current
        if session_id == 'current':
            return Response({'detail': 'Cannot revoke current session'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)


class OTPRequestView(generics.GenericAPIView):
    serializer_class = OTPRequestSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
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
    serializer_class = OTPVerifySerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
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
    serializer_class = PasswordResetWithOTPSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
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
    """Send welcome email to newly registered user"""
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
    """Send password reset email with HTML template"""
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
    """Send OTP email with HTML template"""
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
