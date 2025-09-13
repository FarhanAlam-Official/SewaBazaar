from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db import models
from datetime import datetime, date, timedelta
import logging

from .models import Booking, PaymentMethod, BookingSlot, Payment, ServiceDelivery
from .serializers import (
    BookingSerializer, BookingStatusUpdateSerializer, PaymentMethodSerializer,
    BookingSlotSerializer, PaymentSerializer, BookingWizardSerializer,
    KhaltiPaymentSerializer, ServiceDeliverySerializer, ServiceDeliveryMarkSerializer,
    ServiceCompletionConfirmSerializer, CashPaymentProcessSerializer,
    VoucherApplicationSerializer, CheckoutCalculationSerializer
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

    @action(detail=False, methods=['get'])
    def customer_history(self, request):
        """
        NEW ENDPOINT: Return authenticated customer's payment history with filters

        Query params (all optional):
        - status: pending|processing|completed|failed|refunded|partially_refunded
        - payment_type: digital_wallet|bank_transfer|cash
        - from: ISO date (YYYY-MM-DD)
        - to: ISO date (YYYY-MM-DD)
        - q: search across service title, provider name, transaction_id
        - page, page_size: pagination

        This endpoint is read-only and scoped to the current customer.
        """
        user = request.user
        if not user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        # Base queryset: payments for bookings owned by this customer
        qs = Payment.objects.select_related(
            'booking', 'booking__service', 'booking__service__provider', 'payment_method'
        ).filter(booking__customer=user).order_by('-created_at')

        # Filters
        status_param = request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        payment_type = request.query_params.get('payment_type')
        if payment_type:
            qs = qs.filter(payment_type=payment_type)

        from_date = request.query_params.get('from')
        to_date = request.query_params.get('to')
        if from_date:
            try:
                qs = qs.filter(created_at__date__gte=from_date)
            except Exception:
                pass
        if to_date:
            try:
                qs = qs.filter(created_at__date__lte=to_date)
            except Exception:
                pass

        q = request.query_params.get('q')
        if q:
            qs = qs.filter(
                models.Q(transaction_id__icontains=q) |
                models.Q(booking__service__title__icontains=q) |
                models.Q(booking__service__provider__first_name__icontains=q) |
                models.Q(booking__service__provider__last_name__icontains=q)
            )

        # Simple manual pagination to avoid altering global settings
        try:
            page = int(request.query_params.get('page', '1'))
            page_size = int(request.query_params.get('page_size', '10'))
        except ValueError:
            page, page_size = 1, 10
        start = (page - 1) * page_size
        end = start + page_size
        total = qs.count()

        page_items = list(qs[start:end])
        serializer = PaymentSerializer(page_items, many=True)

        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'results': serializer.data,
        })
    
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
        # Extract and validate required parameters
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
        
        # Verify booking ownership and access permissions
        try:
            booking = Booking.objects.get(id=booking_id, customer=request.user)
        except Booking.DoesNotExist:
            error_msg = "Booking not found or access denied"
            logger.error(f"Booking lookup error: {error_msg} - booking_id: {booking_id}, user: {request.user.id}")
            return Response(
                {"error": error_msg},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Handle existing payment scenarios - allow re-initiation for pending payments
        existing_payment = getattr(booking, 'payment', None)
        if existing_payment:
            # Only allow re-initiation if current payment is pending and user wants to change method
            if existing_payment.status == 'pending':
                # Delete the existing pending payment to allow fresh initiation
                existing_payment.delete()
            else:
                error_msg = f"Payment already exists for this booking with status: {existing_payment.status}"
                logger.warning(f"Payment already exists for booking: {booking_id} with status: {existing_payment.status}")
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
            
        # Initiate payment with Khalti payment service
        khalti_service = KhaltiPaymentService()
        
        result = khalti_service.initiate_payment(
            booking=booking,
            return_url=return_url,
            website_url=website_url
        )
        
        # Return success or failure response with appropriate status codes
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            # Include detailed error information for troubleshooting
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
            
            # Update booking status - FIXED: Use correct status flow
            payment.booking.status = 'confirmed'  # Payment completed, service scheduled
            payment.booking.booking_step = 'payment_completed'  # FIXED: Correct step for payment completion
            payment.booking.save()
        
        return Response(result)
    
    # === PHASE 2.4: VOUCHER INTEGRATION ENDPOINTS ===
    
    @action(detail=True, methods=['post'], serializer_class=VoucherApplicationSerializer)
    def apply_voucher(self, request, pk=None):
        """
        PHASE 2.4 NEW METHOD: Apply voucher to payment for discount
        
        POST /api/payments/{id}/apply_voucher/
        {
            "voucher_code": "SB-20250911-ABC123"
        }
        """
        payment = self.get_object()
        
        # Check if user can modify this payment
        if request.user != payment.booking.customer and request.user.role != 'admin':
            return Response(
                {"detail": "Only the customer or admin can apply vouchers"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only allow voucher application on pending payments
        if payment.status != 'pending':
            return Response(
                {"detail": "Vouchers can only be applied to pending payments"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from apps.rewards.models import RewardVoucher
            
            voucher_code = serializer.validated_data['voucher_code']
            voucher = RewardVoucher.objects.get(voucher_code=voucher_code)
            
            # Check voucher ownership
            if voucher.user != request.user and request.user.role != 'admin':
                return Response(
                    {"detail": "You can only use your own vouchers"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Apply voucher to payment
            result = payment.apply_voucher(voucher)
            
            if result['success']:
                # Return updated payment data
                payment_serializer = PaymentSerializer(payment)
                return Response({
                    "success": True,
                    "message": "Voucher applied successfully",
                    "voucher_applied": {
                        "code": voucher_code,
                        "discount": result['discount_applied'],
                    },
                    "payment": payment_serializer.data
                })
            else:
                return Response(
                    {"detail": result['error']},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Error applying voucher: {str(e)}")
            return Response(
                {"detail": f"Failed to apply voucher: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def remove_voucher(self, request, pk=None):
        """
        PHASE 2.4 NEW METHOD: Remove applied voucher from payment
        
        POST /api/payments/{id}/remove_voucher/
        """
        payment = self.get_object()
        
        # Check if user can modify this payment
        if request.user != payment.booking.customer and request.user.role != 'admin':
            return Response(
                {"detail": "Only the customer or admin can remove vouchers"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Remove voucher from payment
        result = payment.remove_voucher()
        
        if result['success']:
            # Return updated payment data
            payment_serializer = PaymentSerializer(payment)
            return Response({
                "success": True,
                "message": "Voucher removed successfully",
                "voucher_removed": {
                    "discount_removed": result['discount_removed'],
                },
                "payment": payment_serializer.data
            })
        else:
            return Response(
                {"detail": result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'], serializer_class=CheckoutCalculationSerializer)
    def calculate_checkout(self, request):
        """
        PHASE 2.4 NEW METHOD: Calculate checkout totals with optional voucher
        
        POST /api/payments/calculate_checkout/
        {
            "booking_id": 1,
            "voucher_code": "SB-20250911-ABC123"  // optional
        }
        """
        booking_id = request.data.get('booking_id')
        if not booking_id:
            return Response(
                {"error": "booking_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            booking = Booking.objects.get(id=booking_id, customer=request.user)
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found or access denied"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate base amounts
        base_amount = booking.total_amount
        processing_fee = 0  # Calculate processing fee if needed
        
        # Initialize calculation result
        calculation = {
            "booking_id": booking_id,
            "base_amount": float(base_amount),
            "processing_fee": float(processing_fee),
            "voucher_discount": 0.0,
            "voucher_applied": None,
            "final_amount": float(base_amount + processing_fee),
            "savings": 0.0
        }
        
        # Apply voucher if provided
        voucher_code = serializer.validated_data.get('voucher_code')
        if voucher_code:
            try:
                from apps.rewards.models import RewardVoucher
                
                voucher = RewardVoucher.objects.get(voucher_code=voucher_code)
                
                # Check voucher ownership
                if voucher.user != request.user:
                    return Response(
                        {"detail": "You can only use your own vouchers"},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                if voucher.status == 'active':
                    # In simplified system, calculate potential discount
                    discount = min(voucher.value, base_amount)
                    
                    calculation.update({
                        "voucher_discount": float(discount),
                        "voucher_applied": {
                            "code": voucher_code,
                            "value": float(voucher.value),
                            "discount": float(discount),
                            "will_be_fully_used": discount >= voucher.value
                        },
                        "final_amount": float(base_amount + processing_fee - discount),
                        "savings": float(discount)
                    })
                else:
                    return Response(
                        {"detail": "Voucher is not valid for use"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
            except Exception as e:
                logger.error(f"Error calculating voucher discount: {str(e)}")
                return Response(
                    {"detail": f"Error processing voucher: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(calculation)


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
            # Enable pagination for customer_bookings endpoint
            from rest_framework.pagination import PageNumberPagination
            class CustomPageNumberPagination(PageNumberPagination):
                page_size = 10
                page_size_query_param = 'page_size'
                max_page_size = 100
            return CustomPageNumberPagination
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
                
            # ENHANCED STATUS UPDATE VALIDATION
            # For cash payments, customer can confirm their own booking
            # For other status changes, only the provider can confirm, complete or reject a booking
            if new_status in ['confirmed', 'rejected']:
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
            
            # PREVENT DIRECT 'COMPLETED' STATUS - Must go through service delivery process
            elif new_status == 'completed':
                return Response(
                    {
                        "detail": "Cannot directly set status to 'completed'. Use the service delivery process: mark_service_delivered -> confirm_service_completion",
                        "required_steps": [
                            "1. Provider marks service as delivered using /mark_service_delivered/",
                            "2. Customer confirms service completion using /confirm_service_completion/"
                        ]
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Handle new statuses
            elif new_status in ['payment_pending', 'service_delivered', 'awaiting_confirmation', 'disputed']:
                # These statuses should only be set by the system, not manually
                return Response(
                    {"detail": f"Status '{new_status}' cannot be set manually. Use the appropriate endpoints."},
                    status=status.HTTP_400_BAD_REQUEST
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
        
        # Check if grouped format is requested (for dashboard)
        format_type = request.query_params.get('format', 'list')
        
        if format_type == 'grouped':
            # For grouped format, filter by status if specified
            # This allows the frontend to request specific booking types
            status_filter = request.query_params.get('status')
            if status_filter:
                if status_filter == 'completed':
                    queryset = queryset.filter(status='completed')
                elif status_filter == 'upcoming':
                    queryset = queryset.filter(status__in=['pending', 'confirmed'])
                elif status_filter == 'cancelled':
                    queryset = queryset.filter(status__in=['cancelled', 'rejected'])
            
            # Apply pagination to the filtered queryset
            page = self.paginate_queryset(queryset)
            if page is not None:
                # If pagination is applied, return paginated response
                serializer = self.get_serializer(page, many=True)
                paginated_response = self.get_paginated_response(serializer.data)
                
                # For grouped format with status filter, we only need to return the filtered results
                # in the appropriate group
                results = paginated_response.data.get('results', [])
                
                # Initialize all groups as empty lists
                upcoming_results = []
                completed_results = []
                cancelled_results = []
                
                # Put results in the appropriate group based on status filter
                if status_filter == 'completed':
                    completed_results = results
                elif status_filter == 'upcoming':
                    upcoming_results = results
                elif status_filter == 'cancelled':
                    cancelled_results = results
                else:
                    # No status filter, group by actual status
                    upcoming_results = [item for item in results if item['status'] in ['pending', 'confirmed']]
                    completed_results = [item for item in results if item['status'] == 'completed']
                    cancelled_results = [item for item in results if item['status'] in ['cancelled', 'rejected']]
                
                grouped_response = {
                    'upcoming': upcoming_results,
                    'completed': completed_results,
                    'cancelled': cancelled_results,
                    'count': queryset.count()  # Total count for the filtered queryset
                }
                
                # Add pagination info
                grouped_response.update({
                    'next': paginated_response.data.get('next'),
                    'previous': paginated_response.data.get('previous')
                })
                
                return Response(grouped_response)
            
            # Transform to dashboard format without pagination
            def transform_booking(booking):
                return {
                    'id': booking.id,
                    'service': booking.service.title if booking.service else 'Unknown Service',
                    'service_id': booking.service.id if booking.service else None,
                    'provider': booking.service.provider.get_full_name() if booking.service and booking.service.provider else 'Unknown Provider',
                    'provider_name': booking.service.provider.get_full_name() if booking.service and booking.service.provider else 'Unknown Provider',
                    'provider_id': booking.service.provider.id if booking.service and booking.service.provider else None,
                    'image': booking.service.image.url if booking.service and booking.service.image else '',
                    'date': booking.booking_date.isoformat() if booking.booking_date else '',
                    'time': booking.booking_time.strftime('%H:%M') if booking.booking_time else '',
                    'location': booking.address or '',
                    'price': float(booking.total_amount),
                    'status': booking.status,
                    'rating': getattr(booking, 'customer_rating', None),
                    # Additional fields for better information
                    'phone': booking.phone or '',
                    'city': booking.city or '',
                    'special_instructions': booking.special_instructions or '',
                    'total_amount': float(booking.total_amount),
                    'updated_at': booking.updated_at.isoformat() if booking.updated_at else '',
                    # Service category - using the existing relationship properly
                    'service_category': booking.service.category.title if booking.service and booking.service.category and booking.service.category.title else '',
                    # Reschedule and cancellation fields
                    'reschedule_reason': booking.reschedule_reason or None,
                    'reschedule_history': booking.reschedule_history or [],
                    'cancellation_reason': booking.cancellation_reason or None,
                    # Booking slot details
                    'booking_slot_details': {
                        'id': booking.booking_slot.id,
                        'start_time': booking.booking_slot.start_time.strftime('%H:%M:%S'),
                        'end_time': booking.booking_slot.end_time.strftime('%H:%M:%S'),
                        'slot_type': booking.booking_slot.slot_type
                    } if booking.booking_slot else None
                }
            
            # Apply the same status filter for non-paginated responses
            if status_filter:
                if status_filter == 'completed':
                    queryset = queryset.filter(status='completed')
                elif status_filter == 'upcoming':
                    queryset = queryset.filter(status__in=['pending', 'confirmed'])
                elif status_filter == 'cancelled':
                    queryset = queryset.filter(status__in=['cancelled', 'rejected'])
            
            # Group the results
            upcoming = queryset.filter(status__in=['pending', 'confirmed'])
            completed = queryset.filter(status='completed')
            cancelled = queryset.filter(status__in=['cancelled', 'rejected'])
            
            grouped_data = {
                'upcoming': [transform_booking(b) for b in upcoming],
                'completed': [transform_booking(b) for b in completed],
                'cancelled': [transform_booking(b) for b in cancelled],
                'count': queryset.count()
            }
            
            return Response(grouped_data)
        
        else:
            # Apply pagination if requested for list format
            page = self.paginate_queryset(queryset)
            if page is not None:
                # If pagination is applied, return paginated response
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
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
        
        # If a payment already exists: allow specific scenarios
        existing_payment = getattr(booking, 'payment', None)
        if existing_payment:
            payment_method_id = request.data.get('payment_method_id')
            if not payment_method_id:
                return Response(
                    {"error": "payment_method_id is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            try:
                payment_method = PaymentMethod.objects.get(id=payment_method_id, is_active=True)
                
                # Allow if current payment is pending (any type to any type)
                if existing_payment.status == 'pending':
                    # Update existing pending payment to use new method/type
                    existing_payment.payment_method = payment_method
                    existing_payment.payment_type = payment_method.payment_type
                    
                    # Update cash payment specific fields
                    if payment_method.payment_type == 'cash':
                        existing_payment.is_cash_payment = True
                        existing_payment.is_verified = False
                    else:
                        existing_payment.is_cash_payment = False
                        existing_payment.is_verified = True  # Digital payments are auto-verified on creation
                    
                    existing_payment.save(update_fields=['payment_method', 'payment_type', 'is_cash_payment', 'is_verified', 'updated_at'])
                    serializer = PaymentSerializer(existing_payment)
                    return Response(serializer.data, status=status.HTTP_200_OK)
                    
                # Allow cash payments even for completed digital payments (for cash-on-delivery scenarios)
                elif payment_method.payment_type == 'cash':
                    # Create a new cash payment record
                    cash_payment = Payment.objects.create(
                        booking=booking,
                        payment_method=payment_method,
                        amount=booking.total_amount,
                        total_amount=booking.total_amount,
                        status='pending',
                        payment_type='cash',
                        is_cash_payment=True,
                        is_verified=False,
                    )
                    
                    # Update booking step
                    booking.booking_step = 'payment'
                    booking.save()
                    
                    serializer = PaymentSerializer(cash_payment)
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                    
                # Otherwise block for non-cash payments
                else:
                    return Response(
                        {"detail": f"Payment already exists for this booking with status: {existing_payment.status}. Cannot create new {payment_method.payment_type} payment."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
            except PaymentMethod.DoesNotExist:
                return Response(
                    {"error": "Invalid payment method"},
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
            
            # Create payment record (auto-create pending record for cash as well)
            payment_kwargs = {
                'booking': booking,
                'payment_method': payment_method,
                'amount': booking.total_amount,
                'total_amount': booking.total_amount,
                'status': 'pending',
                'payment_type': payment_method.payment_type,
            }

            # If cash method, mark as cash payment and unverified (will be completed later by provider)
            if payment_method.payment_type == 'cash':
                payment_kwargs.update({
                    'is_cash_payment': True,
                    'is_verified': False,
                })

            payment = Payment.objects.create(**payment_kwargs)
            
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
    
    @action(detail=True, methods=['post'])
    def initiate_payment_with_voucher(self, request, pk=None):
        """
        PHASE 2.4 NEW METHOD: Enhanced payment initiation with voucher support
        
        POST /api/bookings/{id}/initiate_payment_with_voucher/
        {
            "payment_method_id": 1,
            "voucher_code": "SB-20250911-ABC123"  // optional
        }
        """
        booking = self.get_object()
        
        # Check if user can initiate payment for this booking
        if request.user != booking.customer and request.user.role != 'admin':
            return Response(
                {"detail": "Only the customer or admin can initiate payment"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        payment_method_id = request.data.get('payment_method_id')
        voucher_code = request.data.get('voucher_code')
        
        if not payment_method_id:
            return Response(
                {"error": "payment_method_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Validate payment method
            payment_method = PaymentMethod.objects.get(id=payment_method_id, is_active=True)
            
            # Check if a payment already exists
            existing_payment = getattr(booking, 'payment', None)
            if existing_payment and existing_payment.status != 'pending':
                return Response(
                    {"detail": f"Payment already exists with status: {existing_payment.status}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Calculate initial amounts
            base_amount = booking.total_amount
            voucher_discount = 0
            voucher = None
            
            # Process voucher if provided
            if voucher_code:
                try:
                    from apps.rewards.models import RewardVoucher
                    voucher = RewardVoucher.objects.get(voucher_code=voucher_code)
                    
                    # Check voucher ownership
                    if voucher.user != request.user and request.user.role != 'admin':
                        return Response(
                            {"detail": "You can only use your own vouchers"},
                            status=status.HTTP_403_FORBIDDEN
                        )
                    
                    # Validate voucher
                    if voucher.status != 'active':
                        return Response(
                            {"detail": "Voucher is not valid for use"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Calculate discount (simplified fixed-value system)
                    voucher_discount = min(voucher.value, base_amount)
                    
                except RewardVoucher.DoesNotExist:
                    return Response(
                        {"detail": "Invalid voucher code"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Create or update payment record
            final_amount = base_amount - voucher_discount
            processing_fee = 0  # Calculate if needed based on payment method
            
            if existing_payment:
                # Update existing pending payment
                payment = existing_payment
                payment.payment_method = payment_method
                payment.payment_type = payment_method.payment_type
                payment.original_amount = base_amount
                payment.amount = final_amount
                payment.voucher_discount = voucher_discount
                payment.total_amount = final_amount + processing_fee
                payment.is_cash_payment = payment_method.payment_type == 'cash'
                payment.is_verified = payment_method.payment_type != 'cash'
                payment.save()
            else:
                # Create new payment
                payment = Payment.objects.create(
                    booking=booking,
                    payment_method=payment_method,
                    original_amount=base_amount,
                    amount=final_amount,
                    voucher_discount=voucher_discount,
                    processing_fee=processing_fee,
                    total_amount=final_amount + processing_fee,
                    status='pending',
                    payment_type=payment_method.payment_type,
                    is_cash_payment=payment_method.payment_type == 'cash',
                    is_verified=payment_method.payment_type != 'cash'
                )
            
            # Apply voucher if provided
            if voucher and voucher_discount > 0:
                # Use the voucher
                actual_discount = voucher.use_voucher(amount=voucher_discount, booking=booking)
                payment.applied_voucher = voucher
                payment.save(update_fields=['applied_voucher'])
            
            # Update booking step
            booking.booking_step = 'payment'
            booking.save()
            
            # Prepare response
            payment_serializer = PaymentSerializer(payment)
            response_data = {
                "success": True,
                "message": "Payment initiated successfully",
                "payment": payment_serializer.data,
                "summary": {
                    "original_amount": float(base_amount),
                    "voucher_discount": float(voucher_discount),
                    "final_amount": float(final_amount),
                    "total_savings": float(voucher_discount)
                }
            }
            
            if voucher:
                response_data["voucher_applied"] = {
                    "code": voucher_code,
                    "discount": float(voucher_discount),
                    "will_be_fully_used": voucher_discount >= voucher.value
                }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except PaymentMethod.DoesNotExist:
            return Response(
                {"error": "Invalid payment method"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error initiating payment with voucher: {str(e)}")
            return Response(
                {"detail": f"Failed to initiate payment: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
    
    @action(detail=True, methods=['get'])
    def reschedule_options(self, request, pk=None):
        """
        Get available reschedule options for a booking
        
        GET /api/bookings/{id}/reschedule_options/
        Returns available slots for rescheduling with price information
        """
        booking = self.get_object()
        
        # Check if user can reschedule this booking
        if request.user != booking.customer and request.user.role != 'admin':
            return Response(
                {"detail": "Only the customer or admin can view reschedule options"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if booking can be rescheduled
        if booking.status in ['cancelled', 'completed']:
            return Response(
                {"detail": f"Cannot reschedule booking with status '{booking.status}'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get available slots for the service (next 30 days from today)
            from .models import BookingSlot
            from django.utils import timezone
            from datetime import timedelta
            
            today = timezone.now().date()
            end_date = today + timedelta(days=30)
            
            # Get available slots excluding the current booking's slot
            available_slots = BookingSlot.objects.filter(
                service=booking.service,
                date__gte=today,
                date__lte=end_date,
                is_available=True
            ).exclude(
                # Exclude current slot and fully booked slots
                id=booking.booking_slot.id if booking.booking_slot else None
            ).filter(
                current_bookings__lt=models.F('max_bookings')
            ).order_by('date', 'start_time')
            
            # For today's date, filter out past time slots
            current_time = timezone.now().time()
            available_slots = available_slots.exclude(
                date=today,
                end_time__lte=current_time
            )
            
            # Serialize slots with price information
            slot_data = []
            for slot in available_slots:
                slot_info = {
                    'id': slot.id,
                    'date': slot.date.isoformat(),
                    'start_time': slot.start_time.strftime('%H:%M'),
                    'end_time': slot.end_time.strftime('%H:%M'),
                    'slot_type': slot.slot_type,
                    'is_rush': slot.is_rush,
                    'rush_fee_percentage': float(slot.rush_fee_percentage),
                    'calculated_price': float(slot.calculated_price),
                    'provider_note': slot.provider_note,
                    'current_bookings': slot.current_bookings,
                    'max_bookings': slot.max_bookings,
                    'is_fully_booked': slot.is_fully_booked
                }
                slot_data.append(slot_info)
            
            return Response({
                'current_booking': {
                    'id': booking.id,
                    'date': booking.booking_date.isoformat(),
                    'time': booking.booking_time.strftime('%H:%M'),
                    'slot_type': booking.booking_slot.slot_type if booking.booking_slot else 'normal',
                    'total_amount': float(booking.total_amount),
                    'express_fee': float(booking.express_fee) if booking.express_fee else 0
                },
                'available_slots': slot_data,
                'date_range': {
                    'start_date': today.isoformat(),
                    'end_date': end_date.isoformat()
                }
            })
            
        except Exception as e:
            logger.error(f"Error fetching reschedule options: {str(e)}")
            return Response(
                {"detail": f"Failed to fetch reschedule options: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def calculate_reschedule_price(self, request, pk=None):
        """
        Calculate price difference for rescheduling to a new slot
        
        POST /api/bookings/{id}/calculate_reschedule_price/
        {
            "new_slot_id": 123
        }
        """
        booking = self.get_object()
        
        # Check if user can reschedule this booking
        if request.user != booking.customer and request.user.role != 'admin':
            return Response(
                {"detail": "Only the customer or admin can calculate reschedule price"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_slot_id = request.data.get('new_slot_id')
        if not new_slot_id:
            return Response(
                {"detail": "new_slot_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from .models import BookingSlot
            
            # Get the new slot
            try:
                new_slot = BookingSlot.objects.get(
                    id=new_slot_id,
                    service=booking.service,
                    is_available=True
                )
            except BookingSlot.DoesNotExist:
                return Response(
                    {"detail": "Invalid or unavailable slot selected"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if slot is fully booked
            if new_slot.is_fully_booked:
                return Response(
                    {"detail": "The selected slot is fully booked"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Calculate price difference
            current_price = float(booking.total_amount)
            new_price = float(new_slot.calculated_price)
            price_difference = new_price - current_price
            
            # Determine if this is an upgrade or downgrade
            is_upgrade = price_difference > 0
            is_downgrade = price_difference < 0
            is_same_price = price_difference == 0
            
            return Response({
                'current_price': current_price,
                'new_price': new_price,
                'price_difference': price_difference,
                'is_upgrade': is_upgrade,
                'is_downgrade': is_downgrade,
                'is_same_price': is_same_price,
                'new_slot': {
                    'id': new_slot.id,
                    'date': new_slot.date.isoformat(),
                    'start_time': new_slot.start_time.strftime('%H:%M'),
                    'end_time': new_slot.end_time.strftime('%H:%M'),
                    'slot_type': new_slot.slot_type,
                    'is_rush': new_slot.is_rush,
                    'rush_fee_percentage': float(new_slot.rush_fee_percentage)
                }
            })
            
        except Exception as e:
            logger.error(f"Error calculating reschedule price: {str(e)}")
            return Response(
                {"detail": f"Failed to calculate reschedule price: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['patch'])
    def reschedule_booking(self, request, pk=None):
        """
        ENHANCED: Reschedule a booking to a new date and time with price calculation
        
        PATCH /api/bookings/{id}/reschedule_booking/
        {
            "new_slot_id": 123,
            "reschedule_reason": "Schedule conflict" // optional
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
        
        # Check reschedule limit (maximum 3 times)
        reschedule_count = len(booking.reschedule_history) if booking.reschedule_history else 0
        if reschedule_count >= 3:
            return Response(
                {"detail": "Maximum reschedule limit reached. You can only reschedule a booking 3 times."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get new slot ID from request
        new_slot_id = request.data.get('new_slot_id')
        reschedule_reason = request.data.get('reschedule_reason', '')
        special_instructions = request.data.get('special_instructions', '')
        
        if not new_slot_id:
            return Response(
                {"detail": "new_slot_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from .models import BookingSlot
            from django.utils import timezone
            
            # Get the new slot
            try:
                new_slot = BookingSlot.objects.get(
                    id=new_slot_id,
                    service=booking.service,
                    is_available=True
                )
            except BookingSlot.DoesNotExist:
                return Response(
                    {"detail": "Invalid or unavailable slot selected"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate slot availability
            if new_slot.is_fully_booked:
                return Response(
                    {"detail": "The selected time slot is fully booked"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate that the new date/time is not in the past
            today = timezone.now().date()
            current_time = timezone.now().time()
            
            if new_slot.date < today or (new_slot.date == today and new_slot.end_time <= current_time):
                return Response(
                    {"detail": "Cannot reschedule to a past date/time"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Store the old slot and booking details for rollback
            old_slot = booking.booking_slot
            old_date = booking.booking_date
            old_time = booking.booking_time
            old_total_amount = booking.total_amount
            old_express_fee = booking.express_fee
            
            # Calculate new pricing
            new_base_price = float(new_slot.calculated_price)
            new_express_fee = 0
            
            # Calculate express fee based on slot type
            if new_slot.slot_type in ['express', 'urgent', 'emergency']:
                # Get base service price directly from service.price
                base_service_price = float(booking.service.price)
                if new_slot.slot_type == 'express':
                    new_express_fee = base_service_price * 0.5  # 50%
                elif new_slot.slot_type == 'urgent':
                    new_express_fee = base_service_price * 0.75  # 75%
                elif new_slot.slot_type == 'emergency':
                    new_express_fee = base_service_price * 1.0  # 100%
            
            new_total_amount = new_base_price + new_express_fee
            
            # Update booking with new slot and pricing
            booking.booking_date = new_slot.date
            booking.booking_time = new_slot.start_time
            booking.booking_slot = new_slot
            booking.price = new_base_price
            booking.express_fee = new_express_fee
            booking.total_amount = new_total_amount
            booking.is_express_booking = new_slot.slot_type in ['express', 'urgent', 'emergency']
            # Store the latest reschedule reason
            booking.reschedule_reason = reschedule_reason
            
            # Add to reschedule history
            from django.utils import timezone
            reschedule_entry = {
                'reason': reschedule_reason,
                'timestamp': timezone.now().isoformat(),
                'old_date': old_date.isoformat(),
                'old_time': old_time.strftime('%H:%M'),
                'new_date': new_slot.date.isoformat(),
                'new_time': new_slot.start_time.strftime('%H:%M'),
                'price_change': float(new_total_amount) - float(old_total_amount)
            }
            
            # Initialize history if it doesn't exist
            if not booking.reschedule_history:
                booking.reschedule_history = []
            
            # Add new entry to history
            booking.reschedule_history.append(reschedule_entry)
            
            # Update special instructions if provided
            if special_instructions:
                booking.special_instructions = special_instructions.strip()
            
            booking.save()
            
            # Update slot booking counts
            # Decrement old slot count if it exists
            if old_slot:
                old_slot.current_bookings = max(0, old_slot.current_bookings - 1)
                old_slot.save()
            
            # Increment new slot count
            new_slot.current_bookings += 1
            new_slot.save()
            
            # Calculate price difference for response
            price_difference = float(new_total_amount) - float(old_total_amount)
            
            # Prepare response data
            response_data = {
                'booking': self.get_serializer(booking).data,
                'reschedule_info': {
                    'old_date': old_date.isoformat(),
                    'old_time': old_time.strftime('%H:%M'),
                    'new_date': new_slot.date.isoformat(),
                    'new_time': new_slot.start_time.strftime('%H:%M'),
                    'old_total_amount': float(old_total_amount),
                    'new_total_amount': float(new_total_amount),
                    'price_difference': float(price_difference),
                    'is_upgrade': price_difference > 0,
                    'is_downgrade': price_difference < 0,
                    'reschedule_reason': reschedule_reason
                }
            }
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error rescheduling booking: {str(e)}")
            return Response(
                {"detail": f"Failed to reschedule booking: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # NEW SERVICE DELIVERY ENDPOINTS
    @action(detail=True, methods=['post'], serializer_class=ServiceDeliveryMarkSerializer)
    def mark_service_delivered(self, request, pk=None):
        """
        Provider marks service as delivered
        
        POST /api/bookings/{id}/mark_service_delivered/
        {
            "delivery_notes": "Service completed successfully",
            "delivery_photos": ["photo1.jpg", "photo2.jpg"]
        }
        
        This endpoint addresses the critical flaw where providers could mark
        bookings as 'completed' without any verification. Now they must first
        mark as 'service_delivered' and wait for customer confirmation.
        """
        booking = self.get_object()
        
        # Validate permissions - only provider or admin can mark service as delivered
        if request.user != booking.service.provider and request.user.role != 'admin':
            return Response(
                {"detail": "Only the service provider can mark service as delivered"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate booking status - must be confirmed (payment completed)
        if booking.status != 'confirmed':
            return Response(
                {"detail": "Booking must be confirmed (payment completed) before marking as delivered"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate service time - cannot mark as delivered before scheduled time
        service_datetime = timezone.make_aware(
            datetime.combine(booking.booking_date, booking.booking_time)
        )
        if timezone.now() < service_datetime:
            return Response(
                {"detail": "Cannot mark service as delivered before scheduled service time"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate request data using serializer
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create or update service delivery record
            service_delivery, created = ServiceDelivery.objects.get_or_create(
                booking=booking,
                defaults={
                    'delivered_at': timezone.now(),
                    'delivered_by': request.user,
                    'delivery_notes': serializer.validated_data.get('delivery_notes', ''),
                    'delivery_photos': serializer.validated_data.get('delivery_photos', []),
                }
            )
            
            if not created:
                # Update existing record
                service_delivery.delivered_at = timezone.now()
                service_delivery.delivered_by = request.user
                service_delivery.delivery_notes = serializer.validated_data.get('delivery_notes', '')
                service_delivery.delivery_photos = serializer.validated_data.get('delivery_photos', [])
                service_delivery.save()
            
            # Update booking status to service_delivered
            booking.status = 'service_delivered'
            booking.booking_step = 'service_delivered'
            booking.save()
            
            # Return success response with delivery details and next steps
            return Response({
                'success': True,
                'message': 'Service marked as delivered successfully',
                'booking_status': booking.status,
                'delivery_id': service_delivery.id,
                'delivered_at': service_delivery.delivered_at.isoformat(),
                'next_step': 'Customer confirmation required'
            })
            
        except Exception as e:
            logger.error(f"Error marking service as delivered: {str(e)}")
            return Response(
                {"detail": f"Failed to mark service as delivered: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], serializer_class=ServiceCompletionConfirmSerializer)
    def confirm_service_completion(self, request, pk=None):
        """
        Customer confirms service completion
        
        POST /api/bookings/{id}/confirm_service_completion/
        {
            "customer_rating": 5,
            "customer_notes": "Excellent service!",
            "would_recommend": true
        }
        
        This endpoint ensures customer verification of service delivery,
        addressing the critical flaw where services could be marked as
        completed without customer confirmation.
        """
        booking = self.get_object()
        
        # Validate permissions - only customer or admin can confirm service completion
        # This ensures that only authorized users can mark services as confirmed
        if request.user != booking.customer and request.user.role != 'admin':
            return Response(
                {"detail": "Only the customer can confirm service completion"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate booking status - must be service_delivered before customer confirmation
        # This enforces the two-step completion process: provider delivery → customer confirmation
        if booking.status != 'service_delivered':
            return Response(
                {"detail": "Service must be marked as delivered before customer confirmation"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate request data using serializer for comprehensive input validation
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Update service delivery record with customer confirmation details
            # This creates a complete audit trail of the service completion process
            service_delivery = booking.service_delivery
            service_delivery.customer_confirmed_at = timezone.now()
            service_delivery.customer_rating = serializer.validated_data['customer_rating']
            service_delivery.customer_notes = serializer.validated_data.get('customer_notes', '')
            service_delivery.would_recommend = serializer.validated_data['would_recommend']
            service_delivery.save()
            
            # Update booking status to completed and create a comprehensive completion record
            booking.status = 'completed'
            booking.booking_step = 'customer_confirmed'
            booking.save()
            
            # Return success response with confirmation details
            return Response({
                'success': True,
                'message': 'Service completion confirmed successfully',
                'booking_status': booking.status,
                'customer_rating': serializer.validated_data['customer_rating'],
                'confirmed_at': service_delivery.customer_confirmed_at.isoformat()
            })
            
        except ServiceDelivery.DoesNotExist:
            return Response(
                {"detail": "Service delivery record not found. Provider must mark service as delivered first."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error confirming service completion: {str(e)}")
            return Response(
                {"detail": f"Failed to confirm service completion: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], serializer_class=CashPaymentProcessSerializer)
    def process_cash_payment(self, request, pk=None):
        """
        Process cash payment when service is completed
        
        POST /api/bookings/{id}/process_cash_payment/
        {
            "amount_collected": 1500.00,
            "collection_notes": "Cash collected from customer"
        }
        
        This endpoint addresses the critical flaw where cash payments
        were not being tracked, causing revenue leakage.
        """
        booking = self.get_object()
        
        # Validate permissions - provider or admin can process cash payment
        if request.user != booking.service.provider and request.user.role != 'admin':
            return Response(
                {"detail": "Only the service provider can process cash payment"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate booking status - service must be delivered or completed
        if booking.status not in ['service_delivered', 'completed']:
            return Response(
                {"detail": "Service must be delivered before processing cash payment"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate request data using serializer
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get or create cash payment method
            cash_method, created = PaymentMethod.objects.get_or_create(
                name='Cash on Service',
                defaults={
                    'payment_type': 'cash',
                    'is_active': True,
                    'processing_fee_percentage': 0.00,
                    'icon': 'cash-icon',
                    'gateway_config': {'gateway': 'cash'}
                }
            )
            
            # If a pending cash payment exists from initiate_payment, update it; otherwise create
            payment = getattr(booking, 'payment', None)
            if payment and payment.payment_type == 'cash' and payment.status == 'pending':
                # Update existing pending cash payment
                payment.amount = serializer.validated_data['amount_collected']
                payment.total_amount = serializer.validated_data['amount_collected']
                payment.payment_method = cash_method
                payment.status = 'completed'
                payment.paid_at = timezone.now()
                payment.is_cash_payment = True
                payment.cash_collected_at = timezone.now()
                payment.cash_collected_by = request.user
                payment.is_verified = True
                payment.verified_at = timezone.now()
                payment.verified_by = request.user
                payment.save()
            else:
                # Create payment record for cash payment
                payment = Payment.objects.create(
                    booking=booking,
                    payment_method=cash_method,
                    amount=serializer.validated_data['amount_collected'],
                    total_amount=serializer.validated_data['amount_collected'],
                    status='completed',
                    paid_at=timezone.now(),
                    payment_type='cash',
                    is_cash_payment=True,
                    cash_collected_at=timezone.now(),
                    cash_collected_by=request.user,
                    is_verified=True,  # Cash payments are considered verified when collected
                    verified_at=timezone.now(),
                    verified_by=request.user
                )
            
            # Return success response with payment details
            return Response({
                'success': True,
                'message': 'Cash payment processed successfully',
                'payment_id': payment.payment_id,
                'amount_collected': float(payment.amount),
                'transaction_id': payment.transaction_id
            })
            
        except Exception as e:
            logger.error(f"Error processing cash payment: {str(e)}")
            return Response(
                {"detail": f"Failed to process cash payment: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def service_delivery_status(self, request, pk=None):
        """
        Get service delivery status and details
        
        GET /api/bookings/{id}/service_delivery_status/
        
        Returns detailed information about service delivery status,
        including provider delivery notes and customer confirmation.
        """
        booking = self.get_object()
        
        # Check permissions
        if (request.user != booking.customer and 
            request.user != booking.service.provider and 
            request.user.role != 'admin'):
            return Response(
                {"detail": "Access denied"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            service_delivery = booking.service_delivery
            
            return Response({
                'booking_id': booking.id,
                'booking_status': booking.status,
                'booking_step': booking.booking_step,
                'service_delivery': {
                    'delivered_at': service_delivery.delivered_at.isoformat() if service_delivery.delivered_at else None,
                    'delivered_by': service_delivery.delivered_by.get_full_name() if service_delivery.delivered_by else None,
                    'delivery_notes': service_delivery.delivery_notes,
                    'delivery_photos': service_delivery.delivery_photos,
                    'customer_confirmed_at': service_delivery.customer_confirmed_at.isoformat() if service_delivery.customer_confirmed_at else None,
                    'customer_rating': service_delivery.customer_rating,
                    'customer_notes': service_delivery.customer_notes,
                    'would_recommend': service_delivery.would_recommend,
                    'dispute_raised': service_delivery.dispute_raised,
                    'is_fully_confirmed': service_delivery.is_fully_confirmed
                } if service_delivery else None
            })
            
        except Exception as e:
            logger.error(f"Error fetching service delivery status: {str(e)}")
            return Response(
                {"detail": f"Failed to fetch service delivery status: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
