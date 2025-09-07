from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Sum, Count, Q, F, Max
from django.db import models
from django.utils import timezone
from datetime import timedelta, datetime
from rest_framework import viewsets, status, generics, permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import (
    UserSerializer, RegisterSerializer, ChangePasswordSerializer,
    UpdateProfileSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
from apps.common.permissions import IsAdmin

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
        """Get customer spending trends and analytics"""
        user = request.user
        
        if user.role != 'customer':
            return Response(
                {'detail': 'Only customers can access spending trends'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Import here to avoid circular imports
        from apps.bookings.models import Booking
        
        # Get date range (last 12 months)
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=365)
        
        # Monthly spending data
        monthly_spending = []
        current_date = start_date.replace(day=1)  # Start from first day of month
        
        while current_date <= end_date:
            next_month = (current_date.replace(day=28) + timedelta(days=4)).replace(day=1)
            
            month_bookings = Booking.objects.filter(
                customer=user,
                booking_date__gte=current_date,
                booking_date__lt=next_month,
                status='completed',
                payment__status='completed'
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
        
        # Category-wise spending
        category_spending = Booking.objects.filter(
            customer=user,
            status='completed',
            payment__status='completed'
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
        
        # Year-over-year comparison
        this_year = timezone.now().year
        last_year = this_year - 1
        
        this_year_spending = Booking.objects.filter(
            customer=user,
            booking_date__year=this_year,
            status='completed',
            payment__status='completed'
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        last_year_spending = Booking.objects.filter(
            customer=user,
            booking_date__year=last_year,
            status='completed',
            payment__status='completed'
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
                        status='completed',
                        payment__status='completed'
                    ).aggregate(total=Sum('total_amount'))['total'] or 0
                ),
                'average_monthly_spending': sum(item['total_spent'] for item in monthly_spending[-6:]) / 6 if len(monthly_spending) >= 6 else 0,
                'most_expensive_booking': float(
                    Booking.objects.filter(
                        customer=user,
                        status='completed'
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
            
            # Send email
            send_mail(
                'Reset your SewaBazaar password',
                f'Click the link to reset your password: {reset_link}',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            
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
