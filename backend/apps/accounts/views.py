from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import viewsets, status, generics, permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
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
