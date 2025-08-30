from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import datetime, date
import logging

from .models import Booking, PaymentMethod, BookingSlot, Payment
from .serializers import (
    BookingSerializer, BookingStatusUpdateSerializer, PaymentMethodSerializer,
    BookingSlotSerializer, PaymentSerializer, BookingWizardSerializer,
    KhaltiPaymentSerializer
)
from .services import KhaltiPaymentService, BookingSlotService, BookingWizardService
from apps.common.permissions import IsCustomer, IsProvider, IsAdmin, IsOwnerOrAdmin
from apps.services.models import Service

logger = logging.getLogger(__name__)


class PaymentMethodViewSet(viewsets.ReadOnlyModelViewSet):
    """
    PHASE 1 NEW VIEWSET: ViewSet for payment methods
    
    Purpose: Provide available payment methods to frontend
    Impact: New API - no impact on existing functionality
    """
    queryset = PaymentMethod.objects.filter(is_active=True)
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """Filter active payment methods"""
        return PaymentMethod.objects.filter(is_active=True).order_by('payment_type', 'name')


class BookingSlotViewSet(viewsets.ModelViewSet):
    """
    PHASE 1 NEW VIEWSET: ViewSet for booking slots management
    
    Purpose: Handle booking slot availability and management
    Impact: New API - enhances booking system with time slot management
    """
    queryset = BookingSlot.objects.all()
    serializer_class = BookingSlotSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['service', 'date', 'is_available']
    ordering_fields = ['date', 'start_time']
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated, IsProvider | IsAdmin]
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['get'])
    def available_slots(self, request):
        """
        Get available slots for a service on a specific date
        
        GET /api/booking-slots/available-slots/?service_id=1&date=2024-02-01
        """
        service_id = request.query_params.get('service_id')
        date_str = request.query_params.get('date')
        
        if not service_id or not date_str:
            return Response(
                {"error": "service_id and date parameters are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            service = Service.objects.get(id=service_id)
            booking_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            
            # Get available slots
            available_slots = BookingSlotService.get_available_slots(service, booking_date)
            
            # If no slots exist, create default ones
            if not available_slots.exists():
                BookingSlotService.create_default_slots(service, booking_date)
                available_slots = BookingSlotService.get_available_slots(service, booking_date)
            
            serializer = self.get_serializer(available_slots, many=True)
            return Response(serializer.data)
            
        except Service.DoesNotExist:
            return Response(
                {"error": "Service not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )


class PaymentViewSet(viewsets.ModelViewSet):
    """
    PHASE 1 NEW VIEWSET: ViewSet for payment processing with Khalti integration
    
    Purpose: Handle payment transactions and Khalti integration
    Impact: New API - adds payment functionality without affecting existing booking flow
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter payments based on user role"""
        user = self.request.user
        
        if user.role == 'admin':
            return Payment.objects.all()
        elif user.role == 'customer':
            return Payment.objects.filter(booking__customer=user)
        elif user.role == 'provider':
            return Payment.objects.filter(booking__service__provider=user)
        
        return Payment.objects.none()
    
    @action(detail=False, methods=['post'], serializer_class=KhaltiPaymentSerializer)
    def process_khalti_payment(self, request):
        """
        Process Khalti payment verification
        
        POST /api/payments/process-khalti-payment/
        {
            "token": "khalti_payment_token",
            "amount": 10000,  // amount in paisa
            "booking_id": 1
        }
        """
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            token = serializer.validated_data['token']
            amount = serializer.validated_data['amount']
            booking_id = serializer.validated_data['booking_id']
            
            # Process payment using Khalti service
            khalti_service = KhaltiPaymentService()
            result = khalti_service.process_booking_payment(
                booking_id=booking_id,
                token=token,
                amount=amount,
                user=request.user
            )
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def verify_payment(self, request, pk=None):
        """
        Re-verify payment with Khalti
        
        POST /api/payments/{id}/verify-payment/
        """
        payment = self.get_object()
        
        if not payment.khalti_token:
            return Response(
                {"error": "No Khalti token found for this payment"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        khalti_service = KhaltiPaymentService()
        result = khalti_service.verify_payment(payment.khalti_token, payment.amount_in_paisa)
        
        if result['success']:
            # Update payment status if verification successful
            payment.khalti_response = result['data']
            payment.status = 'completed'
            payment.paid_at = timezone.now()
            payment.save()
            
            # Update booking status
            payment.booking.status = 'confirmed'
            payment.booking.save()
        
        return Response(result)


class BookingWizardViewSet(viewsets.ViewSet):
    """
    PHASE 1 NEW VIEWSET: ViewSet for booking wizard multi-step process
    
    Purpose: Handle step-by-step booking creation with validation at each step
    Impact: New API - enhances booking process without breaking existing flow
    """
    permission_classes = [permissions.IsAuthenticated, IsCustomer]
    
    @action(detail=False, methods=['post'])
    def create_step(self, request):
        """
        Create or update booking at specific step
        
        POST /api/booking-wizard/create-step/
        {
            "booking_step": "service_selection",
            "service": 1,
            "booking_date": "2024-02-01",
            "booking_time": "10:00:00",
            "address": "Test Address",
            "phone": "1234567890"
        }
        """
        wizard_service = BookingWizardService()
        result = wizard_service.create_booking_step(request.user, request.data)
        
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def calculate_price(self, request):
        """
        Calculate dynamic pricing based on selections
        
        POST /api/booking-wizard/calculate-price/
        {
            "service_id": 1,
            "date": "2024-02-01",
            "time": "10:00",
            "add_ons": []
        }
        """
        service_id = request.data.get('service_id')
        date_str = request.data.get('date')
        time_str = request.data.get('time')
        add_ons = request.data.get('add_ons', [])
        
        if not service_id:
            return Response(
                {"error": "service_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            service = Service.objects.get(id=service_id)
            booking_date = datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else None
            booking_time = datetime.strptime(time_str, '%H:%M').time() if time_str else None
            
            wizard_service = BookingWizardService()
            result = wizard_service.calculate_booking_price(
                service=service,
                date=booking_date,
                time=booking_time,
                add_ons=add_ons
            )
            
            return Response(result)
            
        except Service.DoesNotExist:
            return Response(
                {"error": "Service not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return Response(
                {"error": f"Invalid date/time format: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class BookingViewSet(viewsets.ModelViewSet):
    """
    EXISTING VIEWSET WITH PHASE 1 ENHANCEMENTS:
    - Preserves all existing functionality
    - Adds new Phase 1 endpoints
    - Maintains backward compatibility
    """
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'booking_date', 'booking_step']  # Added booking_step filter
    ordering_fields = ['booking_date', 'booking_time', 'created_at']
    
    def get_queryset(self):
        """EXISTING LOGIC (unchanged)"""
        user = self.request.user
        
        # Handle anonymous users during schema generation
        if not user.is_authenticated:
            return Booking.objects.none()
        
        # Admin can see all bookings
        if user.role == 'admin':
            return Booking.objects.all()
            
        # Customers can see their own bookings
        if user.role == 'customer':
            return Booking.objects.filter(customer=user)
            
        # Providers can see bookings for their services
        if user.role == 'provider':
            return Booking.objects.filter(service__provider=user)
            
        return Booking.objects.none()
    
    def get_permissions(self):
        """EXISTING LOGIC (unchanged)"""
        if self.action == 'create':
            permission_classes = [permissions.IsAuthenticated, IsCustomer]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
        elif self.action in ['update_status']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """EXISTING LOGIC (unchanged)"""
        serializer.save(customer=self.request.user)
    
    @action(detail=True, methods=['patch'], serializer_class=BookingStatusUpdateSerializer)
    def update_status(self, request, pk=None):
        """EXISTING METHOD (unchanged)"""
        booking = self.get_object()
        serializer = self.get_serializer(booking, data=request.data, partial=True)
        
        if serializer.is_valid():
            # Check permissions based on the requested status change
            new_status = serializer.validated_data.get('status')
            
            # Only the customer can cancel their booking
            if new_status == 'cancelled' and request.user != booking.customer and request.user.role != 'admin':
                return Response(
                    {"detail": "Only the customer or admin can cancel a booking"},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Only the provider can confirm, complete or reject a booking
            if new_status in ['confirmed', 'completed', 'rejected']:
                service_provider = booking.service.provider
                if request.user != service_provider and request.user.role != 'admin':
                    return Response(
                        {"detail": "Only the service provider or admin can update this status"},
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def customer_bookings(self, request):
        """EXISTING METHOD (unchanged)"""
        if request.user.role != 'customer' and request.user.role != 'admin':
            return Response(
                {"detail": "Only customers or admins can access this endpoint"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        queryset = Booking.objects.filter(customer=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def provider_bookings(self, request):
        """EXISTING METHOD (unchanged)"""
        if request.user.role != 'provider' and request.user.role != 'admin':
            return Response(
                {"detail": "Only providers or admins can access this endpoint"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        queryset = Booking.objects.filter(service__provider=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    # PHASE 1 NEW METHODS
    @action(detail=True, methods=['post'])
    def initiate_payment(self, request, pk=None):
        """
        PHASE 1 NEW METHOD: Initiate payment for a booking
        
        POST /api/bookings/{id}/initiate-payment/
        {
            "payment_method_id": 1
        }
        """
        booking = self.get_object()
        
        # Check if user can initiate payment for this booking
        if request.user != booking.customer and request.user.role != 'admin':
            return Response(
                {"detail": "Only the customer or admin can initiate payment"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if payment already exists
        if hasattr(booking, 'payment'):
            return Response(
                {"detail": "Payment already exists for this booking"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment_method_id = request.data.get('payment_method_id')
        
        if not payment_method_id:
            return Response(
                {"error": "payment_method_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            payment_method = PaymentMethod.objects.get(id=payment_method_id, is_active=True)
            
            # Create payment record
            payment = Payment.objects.create(
                booking=booking,
                payment_method=payment_method,
                amount=booking.total_amount,
                total_amount=booking.total_amount,
                status='pending'
            )
            
            # Update booking step
            booking.booking_step = 'payment'
            booking.save()
            
            serializer = PaymentSerializer(payment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except PaymentMethod.DoesNotExist:
            return Response(
                {"error": "Invalid payment method"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def booking_analytics(self, request):
        """
        PHASE 1 NEW METHOD: Get booking analytics and statistics
        
        GET /api/bookings/booking-analytics/
        """
        user = request.user
        
        if user.role == 'customer':
            queryset = Booking.objects.filter(customer=user)
        elif user.role == 'provider':
            queryset = Booking.objects.filter(service__provider=user)
        elif user.role == 'admin':
            queryset = Booking.objects.all()
        else:
            return Response(
                {"detail": "Access denied"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Calculate analytics
        total_bookings = queryset.count()
        pending_bookings = queryset.filter(status='pending').count()
        confirmed_bookings = queryset.filter(status='confirmed').count()
        completed_bookings = queryset.filter(status='completed').count()
        cancelled_bookings = queryset.filter(status='cancelled').count()
        
        # Calculate revenue (for providers and admins)
        total_revenue = 0
        if user.role in ['provider', 'admin']:
            completed_payments = Payment.objects.filter(
                booking__in=queryset,
                status='completed'
            )
            total_revenue = sum(payment.total_amount for payment in completed_payments)
        
        analytics = {
            'total_bookings': total_bookings,
            'pending_bookings': pending_bookings,
            'confirmed_bookings': confirmed_bookings,
            'completed_bookings': completed_bookings,
            'cancelled_bookings': cancelled_bookings,
            'completion_rate': (completed_bookings / total_bookings * 100) if total_bookings > 0 else 0,
            'total_revenue': float(total_revenue) if user.role in ['provider', 'admin'] else None
        }
        
        return Response(analytics)
