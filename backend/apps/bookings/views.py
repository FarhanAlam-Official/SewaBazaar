from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import datetime, date, timedelta
import logging

from .models import Booking, PaymentMethod, BookingSlot, Payment
from .serializers import (
    BookingSerializer, BookingStatusUpdateSerializer, PaymentMethodSerializer,
    BookingSlotSerializer, PaymentSerializer, BookingWizardSerializer,
    KhaltiPaymentSerializer
)
from .services import KhaltiPaymentService, BookingSlotService, BookingWizardService, TimeSlotService
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
        if self.action in ['list', 'retrieve', 'available_slots']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated, IsProvider | IsAdmin]
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['get'])
    def available_slots(self, request):
        """
        Get available slots for a service on a specific date or date range
        
        GET /api/booking-slots/available_slots/?service_id=1&date=2024-02-01
        GET /api/booking-slots/available_slots/?service_id=1&start_date=2024-02-01&end_date=2024-02-07
        GET /api/booking-slots/available_slots/?service_id=1&date=2024-02-01&prevent_auto_generation=true
        """
        service_id = request.query_params.get('service_id')
        date_str = request.query_params.get('date')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        prevent_auto_generation = request.query_params.get('prevent_auto_generation', 'false').lower() == 'true'
        # Remove express_mode parameter - we'll return all slots and filter on frontend
        
        # Validate required parameters
        if not service_id:
            return Response(
                {"error": "service_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate service_id is numeric
        try:
            service_id = int(service_id)
        except ValueError:
            return Response(
                {"error": "service_id must be a valid integer"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate date parameters
        if not date_str and not (start_date_str and end_date_str):
            return Response(
                {"error": "Either date or both start_date and end_date parameters are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate date formats
        try:
            if date_str:
                booking_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            if start_date_str:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            if end_date_str:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                # Validate date range
                if start_date_str and end_date_str and start_date > end_date:
                    return Response(
                        {"error": "start_date must be before or equal to end_date"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            service = Service.objects.get(id=service_id)
            
            # Handle single date
            if date_str:
                # Get available slots using TimeSlotService directly to avoid auto-generation
                available_slots = TimeSlotService.get_available_slots(service, booking_date)
                
                # Only auto-generate if prevent_auto_generation is False
                if not available_slots.exists() and not prevent_auto_generation:
                    TimeSlotService.generate_slots_from_availability(
                        provider=service.provider,
                        service=service,
                        start_date=booking_date,
                        end_date=booking_date
                    )
                    available_slots = TimeSlotService.get_available_slots(service, booking_date)
                
                # Remove the express_mode filtering - always return all slots
                # Frontend will filter based on slot_type
                
                serializer = self.get_serializer(available_slots, many=True)
                return Response(serializer.data)
            
            # Handle date range
            else:
                all_slots = []
                current_date = start_date
                
                while current_date <= end_date:
                    # Get available slots for this date
                    available_slots = TimeSlotService.get_available_slots(service, current_date)
                    
                    # Only auto-generate if prevent_auto_generation is False
                    if not available_slots.exists() and not prevent_auto_generation:
                        TimeSlotService.generate_slots_from_availability(
                            provider=service.provider,
                            service=service,
                            start_date=current_date,
                            end_date=current_date
                        )
                        available_slots = TimeSlotService.get_available_slots(service, current_date)
                    
                    # Remove the express_mode filtering - always return all slots
                    # Frontend will filter based on slot_type
                    
                    all_slots.extend(available_slots)
                    current_date += timedelta(days=1)
                
                serializer = self.get_serializer(all_slots, many=True)
                return Response(serializer.data)
            
        except Service.DoesNotExist:
            return Response(
                {"error": "Service not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error fetching available slots: {str(e)}")
            return Response(
                {"error": "An unexpected error occurred while fetching slots"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
    
    @action(detail=False, methods=['post'])
    def initiate_khalti_payment(self, request):
        """
        Initiate Khalti e-Payment and get payment URL
        
        POST /api/payments/initiate_khalti_payment/
        {
            "booking_id": 1,
            "return_url": "http://localhost:3000/payment/callback",
            "website_url": "http://localhost:3000"
        }
        """
        # Log the incoming request data for debugging
        logger.info(f"Khalti payment initiation request: {request.data}")
        
        booking_id = request.data.get('booking_id')
        return_url = request.data.get('return_url')
        website_url = request.data.get('website_url')
        
        if not all([booking_id, return_url, website_url]):
            error_msg = "booking_id, return_url, and website_url are required"
            logger.error(f"Khalti initiation validation error: {error_msg}")
            return Response(
                {"error": error_msg, "received_data": request.data},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            booking = Booking.objects.get(id=booking_id, customer=request.user)
            logger.info(f"Found booking: {booking.id} for user: {request.user.id}")
        except Booking.DoesNotExist:
            error_msg = "Booking not found or access denied"
            logger.error(f"Booking lookup error: {error_msg} - booking_id: {booking_id}, user: {request.user.id}")
            return Response(
                {"error": error_msg},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if payment already exists
        if hasattr(booking, 'payment'):
            error_msg = "Payment already exists for this booking"
            logger.warning(f"Payment already exists for booking: {booking_id}")
            return Response(
                {"error": error_msg},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Ensure return_url doesn't have trailing slash
        # This prevents issues with Khalti appending parameters
        if return_url.endswith('/'):
            return_url = return_url.rstrip('/')
            
        # Ensure the return_url doesn't already contain query parameters
        # Khalti will append parameters with ? which can cause issues if there are already parameters
        # We should not add booking_id to the return_url here as Khalti handles the redirect parameters
        # The frontend should handle passing the booking_id to the callback page in a different way
            
        # Initiate payment with Khalti
        khalti_service = KhaltiPaymentService()
        logger.info(f"Initiating Khalti payment for booking: {booking_id}")
        
        result = khalti_service.initiate_payment(
            booking=booking,
            return_url=return_url,
            website_url=website_url
        )
        
        # Log the result for debugging
        logger.info(f"Khalti initiation result: {result}")
        
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            # Include more detailed error information
            error_response = {
                "error": result.get('error', 'Unknown error'),
                "status_code": result.get('status_code'),
                "details": result.get('exception')
            }
            logger.error(f"Khalti initiation failed: {error_response}")
            return Response(error_response, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def debug_khalti_config(self, request):
        """
        Debug endpoint to test Khalti configuration
        
        POST /api/payments/debug_khalti_config/
        """
        khalti_service = KhaltiPaymentService()
        
        config_info = {
            'base_url': khalti_service.base_url,
            'initiate_url': khalti_service.initiate_url,
            'lookup_url': khalti_service.lookup_url,
            'public_key': f"{khalti_service.public_key[:10]}..." if khalti_service.public_key else None,
            'secret_key_configured': bool(khalti_service.secret_key),
            'environment': 'sandbox' if 'dev.khalti.com' in khalti_service.base_url else 'production'
        }
        
        return Response(config_info, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def process_khalti_callback(self, request):
        """
        Process Khalti payment callback from e-Payment API v2
        
        POST /api/payments/process_khalti_callback/
        {
            "pidx": "payment_identifier",
            "transaction_id": "transaction_id_from_khalti",
            "purchase_order_id": "booking_123_timestamp",
            "booking_id": 1
        }
        """
        pidx = request.data.get('pidx')
        transaction_id = request.data.get('transaction_id')
        purchase_order_id = request.data.get('purchase_order_id')
        booking_id = request.data.get('booking_id')
        
        if not all([pidx, transaction_id, booking_id]):
            return Response(
                {"error": "pidx, transaction_id, and booking_id are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process payment using new callback method
        khalti_service = KhaltiPaymentService()
        result = khalti_service.process_booking_payment_with_callback(
            booking_id=booking_id,
            pidx=pidx,
            transaction_id=transaction_id,
            purchase_order_id=purchase_order_id,
            user=request.user
        )
        
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def verify_payment(self, request, pk=None):
        """
        Re-verify payment with Khalti
        
        POST /api/payments/{id}/verify_payment/
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
        
        POST /api/booking-wizard/create_step/
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
        
        POST /api/booking-wizard/calculate_price/
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
            
            # Handle both time formats: 'HH:MM' and 'HH:MM:SS'
            booking_time = None
            if time_str:
                try:
                    # Try parsing with seconds first (HH:MM:SS)
                    booking_time = datetime.strptime(time_str, '%H:%M:%S').time()
                except ValueError:
                    # Fallback to parsing without seconds (HH:MM)
                    booking_time = datetime.strptime(time_str, '%H:%M').time()
            
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
    
    def get_pagination_class(self):
        """Override pagination for specific actions"""
        if self.action == 'customer_bookings':
            # Disable pagination for customer_bookings endpoint
            return None
        return super().get_pagination_class()
    
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
                
            # For cash payments, customer can confirm their own booking
            # For other status changes, only the provider can confirm, complete or reject a booking
            if new_status in ['confirmed', 'completed', 'rejected']:
                service_provider = booking.service.provider
                # Allow customer to confirm their own booking (cash payment scenario)
                if new_status == 'confirmed' and request.user == booking.customer:
                    # Customer can confirm their own booking (cash payment scenario)
                    pass
                elif request.user != service_provider and request.user.role != 'admin':
                    return Response(
                        {"detail": "Only the service provider or admin can update this status"},
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def customer_bookings(self, request):
        """Enhanced customer bookings with grouped data for dashboard"""
        if request.user.role != 'customer' and request.user.role != 'admin':
            return Response(
                {"detail": "Only customers or admins can access this endpoint"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all bookings for the customer
        queryset = Booking.objects.filter(customer=request.user).select_related('service', 'service__provider', 'payment').order_by('-created_at')
        
        # Apply pagination if requested
        page = self.paginate_queryset(queryset)
        if page is not None:
            # If pagination is applied, return paginated response
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        # Check if grouped format is requested (for dashboard)
        format_type = request.query_params.get('format', 'list')
        
        if format_type == 'grouped':
            # Group bookings by status for dashboard
            upcoming = queryset.filter(status__in=['pending', 'confirmed'])
            completed = queryset.filter(status='completed')
            cancelled = queryset.filter(status='cancelled')
            
            # Transform to dashboard format
            def transform_booking(booking):
                return {
                    'id': booking.id,
                    'service': booking.service.title if booking.service else 'Unknown Service',
                    'provider': booking.service.provider.get_full_name() if booking.service and booking.service.provider else 'Unknown Provider',
                    'provider_name': booking.service.provider.get_full_name() if booking.service and booking.service.provider else 'Unknown Provider',
                    'provider_id': booking.service.provider.id if booking.service and booking.service.provider else None,
                    'image': booking.service.image.url if booking.service and booking.service.image else '',
                    'date': booking.booking_date.isoformat() if booking.booking_date else '',
                    'time': booking.booking_time.strftime('%H:%M') if booking.booking_time else '',
                    'location': booking.address or '',
                    'price': float(booking.total_amount),
                    'status': booking.status,
                    'rating': getattr(booking, 'customer_rating', None)
                }
            
            grouped_data = {
                'upcoming': [transform_booking(b) for b in upcoming],
                'completed': [transform_booking(b) for b in completed],
                'cancelled': [transform_booking(b) for b in cancelled]
            }
            
            return Response(grouped_data)
        
        else:
            # Return standard serialized list
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
        
        POST /api/bookings/{id}/initiate_payment/
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
        
        GET /api/bookings/booking_analytics/
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
    
    @action(detail=False, methods=['post'])
    def create_express_booking(self, request):
        """
        Create an express booking with rush pricing
        
        POST /api/bookings/create_express_booking/
        {
            "service_id": 1,
            "booking_date": "2024-02-01",
            "booking_time": "18:00",
            "express_type": "urgent",
            "address": "Service Address",
            "city": "Kathmandu",
            "phone": "9800000000",
            "special_instructions": "Urgent service needed"
        }
        """         
        from apps.services.models import Service
        
        # Validate required fields
        required_fields = ['service_id', 'booking_date', 'booking_time', 'address', 'city', 'phone']
        for field in required_fields:
            if not request.data.get(field):
                return Response(
                    {"error": f"{field} is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        try:
            service = Service.objects.get(id=request.data['service_id'])
            express_type = request.data.get('express_type', 'standard')
            
            booking, slot = BookingSlotService.create_express_booking(
                service=service,
                customer=request.user,
                booking_data=request.data,
                express_type=express_type
            )
            
            if not booking:
                return Response(
                    {"error": "No available slots for express booking at the requested time"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = self.get_serializer(booking)
            return Response({
                "success": True,
                "booking": serializer.data,
                "message": f"Express booking created successfully with {express_type} service",
                "express_fee": float(booking.express_fee),
                "total_amount": float(booking.total_amount)
            }, status=status.HTTP_201_CREATED)
            
        except Service.DoesNotExist:
            return Response(
                {"error": "Service not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Express booking failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # NEW METHODS FOR CANCEL AND RESCHEDULE FUNCTIONALITY
    @action(detail=True, methods=['patch'])
    def cancel_booking(self, request, pk=None):
        """
        Cancel a booking
        
        PATCH /api/bookings/{id}/cancel_booking/
        {
            "cancellation_reason": "Changed my mind"
        }
        """
        booking = self.get_object()
        
        # Check if user can cancel this booking
        if request.user != booking.customer and request.user.role != 'admin':
            return Response(
                {"detail": "Only the customer or admin can cancel this booking"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if booking can be cancelled (not already cancelled or completed)
        if booking.status in ['cancelled', 'completed']:
            return Response(
                {"detail": f"Cannot cancel booking with status '{booking.status}'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update booking status and reason
        cancellation_reason = request.data.get('cancellation_reason', '')
        old_status = booking.status  # Store old status for slot management
        booking.status = 'cancelled'
        booking.cancellation_reason = cancellation_reason
        booking.save()
        
        # If the booking was confirmed or completed, update slot availability
        # Only decrement if the booking was actually using a slot
        if old_status in ['confirmed', 'completed'] and booking.booking_slot:
            booking.booking_slot.current_bookings = max(0, booking.booking_slot.current_bookings - 1)
            booking.booking_slot.save()
        
        serializer = self.get_serializer(booking)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def reschedule_booking(self, request, pk=None):
        """
        Reschedule a booking to a new date and time
        
        PATCH /api/bookings/{id}/reschedule_booking/
        {
            "new_date": "2024-02-01",
            "new_time": "10:00"
        }
        """
        booking = self.get_object()
        
        # Check if user can reschedule this booking
        if request.user != booking.customer and request.user.role != 'admin':
            return Response(
                {"detail": "Only the customer or admin can reschedule this booking"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if booking can be rescheduled (not cancelled or completed)
        if booking.status in ['cancelled', 'completed']:
            return Response(
                {"detail": f"Cannot reschedule booking with status '{booking.status}'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get new date and time from request
        new_date_str = request.data.get('new_date')
        new_time_str = request.data.get('new_time')
        
        if not new_date_str or not new_time_str:
            return Response(
                {"detail": "Both new_date and new_time are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Parse date and time
            from datetime import datetime
            new_date = datetime.strptime(new_date_str, '%Y-%m-%d').date()
            new_time = datetime.strptime(new_time_str, '%H:%M').time()
            
            # Validate that the new date/time is not in the past
            from django.utils import timezone
            today = timezone.now().date()
            now = timezone.now().time()
            
            if new_date < today or (new_date == today and new_time <= now):
                return Response(
                    {"detail": "Cannot reschedule to a past date/time"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Find an available booking slot for the new date/time
            from .models import BookingSlot
            new_slot = None
            
            # Try to find an existing slot
            try:
                new_slot = BookingSlot.objects.get(
                    service=booking.service,
                    date=new_date,
                    start_time=new_time,
                    is_available=True
                )
                
                # Check if the slot is fully booked
                if new_slot.is_fully_booked:
                    return Response(
                        {"detail": "The selected time slot is fully booked"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except BookingSlot.DoesNotExist:
                # If no slot exists, we could create one or return an error
                # For now, we'll return an error since slot creation should be handled by the service
                return Response(
                    {"detail": "No available slot found for the selected date and time"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Store the old slot to update its booking count
            old_slot = booking.booking_slot
            
            # Update booking
            booking.booking_date = new_date
            booking.booking_time = new_time
            booking.booking_slot = new_slot
            booking.save()
            
            # Update slot booking counts
            # Decrement old slot count if it exists
            if old_slot:
                old_slot.current_bookings = max(0, old_slot.current_bookings - 1)
                old_slot.save()
            
            # Increment new slot count
            if new_slot:
                new_slot.current_bookings += 1
                new_slot.save()
            
            serializer = self.get_serializer(booking)
            return Response(serializer.data)
            
        except ValueError as e:
            return Response(
                {"detail": f"Invalid date or time format: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"detail": f"Failed to reschedule booking: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
