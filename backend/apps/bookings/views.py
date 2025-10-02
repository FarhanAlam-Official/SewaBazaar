from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db import models
from django.conf import settings
from datetime import datetime, date, timedelta
import logging

from .models import (
    Booking,
    PaymentMethod,
    BookingSlot,
    Payment,
    ServiceDelivery,
    ProviderAvailability,
    ProviderSchedule,
)
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
from apps.accounts.models import User
from apps.reviews.models import Review
from rest_framework.pagination import PageNumberPagination
from decimal import Decimal
from django.db.models import Sum, Count, Avg, Max, Min
from django.http import HttpResponse

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
            "website_url": "http://localhost:3000",
            "voucher_code": "SAVE50" // optional
        }
        """
        # Extract and validate required parameters
        booking_id = request.data.get('booking_id')
        return_url = request.data.get('return_url')
        website_url = request.data.get('website_url')
        voucher_code = request.data.get('voucher_code')  # Optional voucher code
        expected_amount = request.data.get('expected_amount')  # Optional frontend calculated amount for validation
        
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
        
        # Handle voucher validation if provided
        applied_voucher = None
        if voucher_code:
            try:
                from apps.rewards.models import RewardVoucher
                applied_voucher = RewardVoucher.objects.get(
                    voucher_code=voucher_code,
                    user=request.user,
                    status='active'
                )
            except RewardVoucher.DoesNotExist:
                error_msg = f"Invalid voucher code: {voucher_code}"
                logger.error(f"Voucher not found: {voucher_code} for user {request.user.id}")
                return Response(
                    {"error": error_msg},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                error_msg = f"Error validating voucher: {str(e)}"
                logger.error(f"Voucher validation error: {error_msg}")
                return Response(
                    {"error": error_msg},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Validate expected amount against calculated amount if provided
        if expected_amount is not None:
            calculated_amount = booking.total_amount
            
            if applied_voucher:
                voucher_value = applied_voucher.value
                calculated_amount = max(0, booking.total_amount - voucher_value)
            
            # Add tax to match frontend calculation (13% VAT)
            from decimal import Decimal
            import math
            # Use standard rounding to match frontend Math.round() behavior (not banker's rounding)
            tax_amount = math.floor(float(calculated_amount) * 0.13 + 0.5)  # Equivalent to Math.round()
            calculated_amount_with_tax = calculated_amount + tax_amount
            
            # Allow small floating point differences (0.01)
            difference = abs(float(expected_amount) - float(calculated_amount_with_tax))
            
            if difference > 0.01:
                error_msg = f"Amount mismatch: expected {expected_amount}, calculated {calculated_amount_with_tax} (base: {calculated_amount}, tax: {tax_amount}, difference: {difference})"
                logger.error(f"Amount validation failed: {error_msg}")
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
            website_url=website_url,
            applied_voucher=applied_voucher
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
            "booking_id": 1,
            "voucher_code": "SAVE50" // optional
        }
        """
        pidx = request.data.get('pidx')
        transaction_id = request.data.get('transaction_id')
        purchase_order_id = request.data.get('purchase_order_id')
        booking_id = request.data.get('booking_id')
        voucher_code = request.data.get('voucher_code')  # Optional voucher code
        expected_amount = request.data.get('expected_amount')  # Optional frontend calculated amount for validation
        
        if not all([pidx, transaction_id, booking_id]):
            return Response(
                {"error": "pidx, transaction_id, and booking_id are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate expected amount if provided
        if expected_amount is not None:
            try:
                booking = Booking.objects.get(id=booking_id, customer=request.user)
                calculated_amount = booking.total_amount
                
                # Apply voucher discount if voucher_code provided
                if voucher_code:
                    try:
                        from apps.rewards.models import RewardVoucher
                        voucher = RewardVoucher.objects.get(
                            voucher_code=voucher_code,
                            user=request.user,
                            status='active'
                        )
                        calculated_amount = max(0, booking.total_amount - voucher.value)
                    except RewardVoucher.DoesNotExist:
                        pass  # Let the payment service handle voucher validation
                
                # Add tax to match frontend calculation (13% VAT)
                from decimal import Decimal
                import math
                # Use standard rounding to match frontend Math.round() behavior (not banker's rounding)
                tax_amount = math.floor(float(calculated_amount) * 0.13 + 0.5)  # Equivalent to Math.round()
                calculated_amount_with_tax = calculated_amount + tax_amount
                
                # Allow small floating point differences (0.01)
                if abs(float(expected_amount) - float(calculated_amount_with_tax)) > 0.01:
                    error_msg = f"Amount mismatch: expected {expected_amount}, calculated {calculated_amount_with_tax} (base: {calculated_amount - tax_amount}, tax: {tax_amount})"
                    logger.error(f"Callback amount validation failed: {error_msg}")
                    return Response(
                        {"error": error_msg},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Booking.DoesNotExist:
                return Response(
                    {"error": "Booking not found or access denied"},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Process payment using new callback method
        khalti_service = KhaltiPaymentService()
        result = khalti_service.process_booking_payment_with_callback(
            booking_id=booking_id,
            pidx=pidx,
            transaction_id=transaction_id,
            purchase_order_id=purchase_order_id,
            user=request.user,
            voucher_code=voucher_code
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
                
                # Optional: include raw serializer output for debugging when debug=1
                if request.query_params.get('debug') == '1':
                    grouped_response['raw'] = {
                        'results': results,
                        'page': paginated_response.data.get('page') if isinstance(paginated_response.data, dict) else None,
                        'page_size': paginated_response.data.get('page_size') if isinstance(paginated_response.data, dict) else None,
                        'next': paginated_response.data.get('next'),
                        'previous': paginated_response.data.get('previous'),
                        'count': paginated_response.data.get('count')
                    }
                
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
                    'image': booking.service.main_image.image.url if booking.service and booking.service.main_image and booking.service.main_image.image else '',
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
                    'rejection_reason': booking.rejection_reason or None,
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
            
            # Optional: include raw serializer output for debugging when debug=1
            if request.query_params.get('debug') == '1':
                raw_serializer = self.get_serializer(queryset, many=True)
                grouped_data['raw'] = raw_serializer.data
            
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
        """
        ENHANCED METHOD: Get provider bookings with grouped format support
        
        GET /api/bookings/provider_bookings/?format=grouped
        """
        if request.user.role != 'provider' and request.user.role != 'admin':
            return Response(
                {"detail": "Only providers or admins can access this endpoint"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get query parameters
        format_type = request.query_params.get('format', 'list')
        
        # Base queryset for provider's bookings
        queryset = Booking.objects.filter(
            service__provider=request.user
        ).select_related('service', 'customer', 'payment', 'booking_slot')
        
        if format_type == 'grouped':
            # Group bookings by status
            pending = queryset.filter(status='pending')
            upcoming = queryset.filter(
                status__in=['confirmed'],
                booking_date__gte=timezone.now().date()
            )
            completed = queryset.filter(status='completed')
            
            response_data = {
                'count': queryset.count(),
                'next': None,
                'previous': None,
                'pending': self.get_serializer(pending, many=True).data,
                'upcoming': self.get_serializer(upcoming, many=True).data,
                'completed': self.get_serializer(completed, many=True).data,
            }
            
            return Response(response_data)
        else:
            # Return regular list
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
    
    @action(detail=False, methods=['get'])
    def provider_earnings(self, request):
        """
        NEW ENDPOINT: Alias for provider earnings to match frontend expectations
        
        GET /api/bookings/provider_earnings/
        """
        if request.user.role != 'provider':
            return Response(
                {"detail": "Only providers can access earnings data"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Redirect to the provider dashboard earnings endpoint logic
        provider_dashboard = ProviderDashboardViewSet()
        provider_dashboard.request = request
        provider_dashboard.format_kwarg = None
        return provider_dashboard.earnings(request)
    
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
            # Try to get service delivery, handle case where it doesn't exist
            try:
                service_delivery = booking.service_delivery
            except ServiceDelivery.DoesNotExist:
                service_delivery = None
            
            return Response({
                'booking_id': booking.id,
                'booking_status': booking.status,
                'booking_step': booking.booking_step,
                'service_delivery': {
                    'delivered_at': service_delivery.delivered_at.isoformat() if service_delivery and service_delivery.delivered_at else None,
                    'delivered_by': service_delivery.delivered_by.get_full_name() if service_delivery and service_delivery.delivered_by else None,
                    'delivery_notes': service_delivery.delivery_notes if service_delivery else None,
                    'delivery_photos': [f"{settings.BACKEND_URL}{photo}" if not photo.startswith('http') else photo for photo in (service_delivery.delivery_photos if service_delivery else [])],
                    'customer_confirmed_at': service_delivery.customer_confirmed_at.isoformat() if service_delivery and service_delivery.customer_confirmed_at else None,
                    'customer_rating': service_delivery.customer_rating if service_delivery else None,
                    'customer_notes': service_delivery.customer_notes if service_delivery else None,
                    'would_recommend': service_delivery.would_recommend if service_delivery else None,
                    'dispute_raised': service_delivery.dispute_raised if service_delivery else False,
                    'is_fully_confirmed': service_delivery.is_fully_confirmed if service_delivery else False
                } if service_delivery else None
            })
            
        except Exception as e:
            logger.error(f"Error fetching service delivery status: {str(e)}")
            return Response(
                {"detail": f"Failed to fetch service delivery status: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    

# ===== NEW PROVIDER DASHBOARD VIEWSETS =====

from .models import ProviderAnalytics, ProviderEarnings, ProviderSchedule, ProviderCustomerRelation
from .serializers import (
    ProviderAnalyticsSerializer, ProviderEarningsSerializer, ProviderScheduleSerializer,
    ProviderCustomerRelationSerializer, ProviderEarningsSummarySerializer,
    ProviderAnalyticsResponseSerializer, ProviderCustomerListSerializer,
    ProviderScheduleResponseSerializer, ProviderBookingGroupsSerializer
)
from apps.common.permissions import (
    IsProviderOwner, CanManageProviderBookings, CanViewProviderData,
    CanManageProviderEarnings, CanManageProviderSchedule
)
from rest_framework.throttling import ScopedRateThrottle


class ProviderDashboardViewSet(viewsets.ViewSet):
    """
    COMPREHENSIVE PROVIDER DASHBOARD VIEWSET
    
    Purpose: Provide all dashboard functionality for providers including:
    - Statistics and analytics
    - Bookings management
    - Earnings tracking
    - Customer management
    - Schedule management
    
    Impact: Consolidated viewset - enables complete provider dashboard features
    """
    permission_classes = [permissions.IsAuthenticated, IsProvider]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'provider_dashboard'
    
    def get_provider(self):
        """Get the current provider from request user"""
        return self.request.user
    
    @action(detail=False, methods=['get'])
    def bookings(self, request):
        """
        Get provider bookings grouped by status
        
        GET /api/bookings/provider_dashboard/bookings/?format=grouped&status=pending
        """
        provider = request.user
        
        # Get query parameters
        format_type = request.query_params.get('format', 'grouped')
        status_filter = request.query_params.get('status')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        # Base queryset for provider's bookings
        queryset = Booking.objects.filter(
            service__provider=provider
        ).select_related('service', 'customer', 'payment', 'booking_slot')
        
        # Apply filters
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if date_from:
            try:
                from_date = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(booking_date__gte=from_date)
            except ValueError:
                pass
        
        if date_to:
            try:
                to_date = datetime.strptime(date_to, '%Y-%m-%d').date()
                queryset = queryset.filter(booking_date__lte=to_date)
            except ValueError:
                pass
        
        if format_type == 'grouped':
            # Group bookings by status
            pending = queryset.filter(status='pending')
            upcoming = queryset.filter(
                status__in=['confirmed'],
                booking_date__gte=timezone.now().date()
            )
            completed = queryset.filter(status='completed')
            cancelled = queryset.filter(status__in=['cancelled', 'canceled'])  # Add cancelled bookings
            rejected = queryset.filter(status='rejected')  # Add rejected bookings
            
            response_data = {
                'count': queryset.count(),
                'next': None,
                'previous': None,
                'pending': self.get_serializer(pending, many=True).data,
                'upcoming': self.get_serializer(upcoming, many=True).data,
                'completed': self.get_serializer(completed, many=True).data,
                'cancelled': self.get_serializer(cancelled, many=True).data,  # Add cancelled bookings
                'rejected': self.get_serializer(rejected, many=True).data,  # Add rejected bookings
            }
            
            return Response(response_data)
        else:
            # Return paginated list
            paginator = PageNumberPagination()
            paginator.page_size = int(request.query_params.get('page_size', 20))
            page = paginator.paginate_queryset(queryset, request)
            
            if page is not None:
                serializer = BookingSerializer(page, many=True)
                return paginator.get_paginated_response(serializer.data)
            
            serializer = BookingSerializer(queryset, many=True)
            return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def earnings(self, request):
        """
        Get provider earnings and financial data
        
        GET /api/bookings/provider_dashboard/earnings/?period=month&year=2024
        """
        provider = request.user
        
        # Get query parameters
        period = request.query_params.get('period', 'month')
        year = int(request.query_params.get('year', timezone.now().year))
        month = request.query_params.get('month')
        
        # Calculate earnings summary (respect configurable paid-only setting)
        completed_bookings = Booking.objects.filter(
            service__provider=provider,
            status='completed'
        )
        try:
            from django.conf import settings as dj_settings
            require_paid = getattr(dj_settings, 'EARNINGS_REQUIRE_PAID', True)
        except Exception:
            require_paid = True
        if require_paid:
            completed_bookings = completed_bookings.filter(payment__status='completed')
        
        total_earnings = completed_bookings.aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0')
        
        # This month earnings
        current_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        this_month_earnings = completed_bookings.filter(
            created_at__gte=current_month_start
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0')
        
        # Pending earnings
        pending_earnings = Booking.objects.filter(
            service__provider=provider,
            status__in=['service_delivered', 'awaiting_confirmation']
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0')
        
        # Monthly trends (calendar-accurate)
        monthly_trends = []
        def month_start(dt):
            return dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        def prev_month_start(dt):
            return (dt.replace(day=1) - timedelta(days=1)).replace(day=1)
        def next_month_start(dt):
            return (dt.replace(day=28) + timedelta(days=4)).replace(day=1)

        try:
            from django.conf import settings as dj_settings
            fee_rate = Decimal(str(getattr(dj_settings, 'PLATFORM_FEE_RATE', 0.10)))
        except Exception:
            fee_rate = Decimal('0.10')

        cur_ms = month_start(timezone.now())
        for i in range(6):
            ms = cur_ms
            for _ in range(i):
                ms = prev_month_start(ms)
            me = next_month_start(ms) - timedelta(seconds=1)

            month_bookings = completed_bookings.filter(
                created_at__gte=ms,
                created_at__lte=me
            )

            gross_earnings = month_bookings.aggregate(
                total=Sum('total_amount')
            )['total'] or Decimal('0')

            platform_fee = gross_earnings * fee_rate
            net_earnings = gross_earnings - platform_fee

            monthly_trends.append({
                'month': ms.strftime('%Y-%m'),
                'grossEarnings': float(gross_earnings),
                'platformFee': float(platform_fee),
                'netEarnings': float(net_earnings),
                'bookingsCount': month_bookings.count()
            })
        
        # Unified pending using available-for-payout (net completed - paid out)
        from .models import ProviderEarnings as ProviderEarningsModel
        total_gross_all = completed_bookings.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
        total_net_all = total_gross_all * (Decimal('1.0') - fee_rate)
        total_paid_out = ProviderEarningsModel.objects.filter(provider=provider, payout_status='paid').aggregate(total=Sum('net_amount'))['total'] or Decimal('0')
        available_for_payout = total_net_all - (total_paid_out or Decimal('0'))

        # Recent transactions (simplified)
        recent_transactions = completed_bookings.order_by('-created_at')[:10]
        transactions_data = []
        
        for booking in recent_transactions:
            gross_amount = booking.total_amount
            platform_fee = gross_amount * fee_rate
            net_amount = gross_amount - platform_fee
            
            transactions_data.append({
                'id': booking.id,
                'booking': {
                    'id': booking.id,
                    'service': booking.service.title,
                    'customer': booking.customer.get_full_name()
                },
                'grossAmount': float(gross_amount),
                'platformFee': float(platform_fee),
                'netAmount': float(net_amount),
                'status': 'completed',
                'paidAt': booking.created_at.isoformat()
            })
        
        response_data = {
            'summary': {
                'totalEarnings': float(total_earnings),
                'thisMonth': float(this_month_earnings),
                'pending': float(available_for_payout),
                'lastPayout': None,
                'nextPayoutDate': None
            },
            'monthlyTrends': monthly_trends,
            'recentTransactions': transactions_data,
            'payoutHistory': []  # Would be implemented with actual payout tracking
        }
        
        return Response(response_data)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """
        Get provider analytics and performance data
        
        GET /api/bookings/provider_dashboard/analytics/?period=month&metric=revenue
        """
        provider = request.user
        
        # Get query parameters
        period = request.query_params.get('period', 'month')
        metric = request.query_params.get('metric', 'all')
        
        # Calculate date range
        if period == 'week':
            start_date = timezone.now() - timedelta(days=7)
        elif period == 'month':
            start_date = timezone.now() - timedelta(days=30)
        elif period == 'quarter':
            start_date = timezone.now() - timedelta(days=90)
        else:  # year
            start_date = timezone.now() - timedelta(days=365)
        
        end_date = timezone.now()
        
        # Get bookings in period
        period_bookings = Booking.objects.filter(
            service__provider=provider,
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        
        # Calculate metrics
        total_bookings = period_bookings.count()
        completed_bookings = period_bookings.filter(status='completed').count()
        cancelled_bookings = period_bookings.filter(status='cancelled').count()
        
        total_revenue = period_bookings.filter(
            status='completed',
            payment__status='completed'
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0')
        
        average_booking_value = total_revenue / total_bookings if total_bookings > 0 else Decimal('0')
        completion_rate = (completed_bookings / total_bookings * 100) if total_bookings > 0 else 0
        
        # Customer metrics
        unique_customers = period_bookings.values('customer').distinct().count()
        new_customers = period_bookings.filter(
            customer__bookings__created_at__gte=start_date
        ).values('customer').distinct().count()
        returning_customers = unique_customers - new_customers
        retention_rate = (returning_customers / unique_customers * 100) if unique_customers > 0 else 0
        
        # Performance metrics
        average_rating = Review.objects.filter(
            provider=provider,
            created_at__gte=start_date
        ).aggregate(
            avg_rating=models.Avg('rating')
        )['avg_rating'] or 0
        
        response_data = {
            'period': period,
            'dateRange': {
                'from': start_date.date().isoformat(),
                'to': end_date.date().isoformat()
            },
            'revenue': {
                'total': float(total_revenue),
                'average': float(average_booking_value),
                'growth': 12.5,  # Would calculate from previous period
                'trend': 'up'
            },
            'bookings': {
                'total': total_bookings,
                'completed': completed_bookings,
                'cancelled': cancelled_bookings,
                'completionRate': completion_rate,
                'averageValue': float(average_booking_value)
            },
            'customers': {
                'total': unique_customers,
                'new': new_customers,
                'returning': returning_customers,
                'retentionRate': retention_rate
            },
            'performance': {
                'averageRating': float(average_rating),
                'responseTime': 2.5,  # Would calculate from actual data
                'onTimeRate': 92.0,   # Would calculate from delivery tracking
                'customerSatisfaction': 95.0  # Would calculate from reviews
            },
            'topServices': []  # Would implement service ranking
        }
        
        return Response(response_data)
    
    @action(detail=False, methods=['get'])
    def customers(self, request):
        """
        Get provider's customer list and relationship data with comprehensive filtering and sorting
        
        GET /api/bookings/provider_dashboard/customers/
        Query parameters:
        - search: Search by customer name, email, or phone
        - status: Filter by customer status (new, returning, regular, favorite, blocked)
        - ordering: Sort by (name, total_bookings, total_spent, last_booking_date, average_rating)
        - page, page_size: Pagination
        """
        provider = request.user
        
        # Get query parameters
        search = request.query_params.get('search', '').strip()
        status_filter = request.query_params.get('status', 'all')
        ordering = request.query_params.get('ordering', '-last_booking_date')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        try:
            # Get or create customer relations for all customers who have booked with this provider
            customer_bookings = (
                Booking.objects
                .filter(service__provider=provider)
                .values('customer')
                .annotate(
                    total_bookings=Count('id'),
                    total_spent=Sum('total_amount'),
                    first_booking_date=models.Min('created_at'),
                    last_booking_date=models.Max('created_at'),
                    avg_rating=Avg('review__rating')  # Assuming reviews are linked to bookings
                )
                .order_by('customer')
            )
            
            # Build comprehensive customer data
            customers_data = []
            
            for booking_data in customer_bookings:
                try:
                    customer = User.objects.get(id=booking_data['customer'])
                    
                    # Get or create customer relation
                    relation, created = ProviderCustomerRelation.objects.get_or_create(
                        provider=provider,
                        customer=customer,
                        defaults={
                            'total_bookings': booking_data['total_bookings'],
                            'total_spent': booking_data['total_spent'] or Decimal('0'),
                            'average_rating': booking_data['avg_rating'] or Decimal('0'),
                            'first_booking_date': booking_data['first_booking_date'],
                            'last_booking_date': booking_data['last_booking_date']
                        }
                    )
                    
                    # Update relation data if not created (existing relation)
                    if not created:
                        relation.total_bookings = booking_data['total_bookings']
                        relation.total_spent = booking_data['total_spent'] or Decimal('0')
                        relation.average_rating = booking_data['avg_rating'] or Decimal('0')
                        relation.first_booking_date = booking_data['first_booking_date']
                        relation.last_booking_date = booking_data['last_booking_date']
                        relation.save()
                    
                    # Apply search filter
                    if search:
                        search_lower = search.lower()
                        if not any([
                            search_lower in customer.first_name.lower(),
                            search_lower in customer.last_name.lower(),
                            search_lower in customer.email.lower(),
                            search_lower in (customer.phone or '').lower()
                        ]):
                            continue
                    
                    # Determine customer status
                    days_since_last = (
                        (timezone.now().date() - relation.last_booking_date.date()).days
                        if relation.last_booking_date else 999
                    )
                    
                    if relation.is_blocked:
                        customer_status = 'blocked'
                    elif relation.is_favorite_customer:
                        customer_status = 'favorite'
                    elif relation.total_bookings >= 5:
                        customer_status = 'regular'
                    elif relation.total_bookings > 1:
                        customer_status = 'returning'
                    else:
                        customer_status = 'new'
                    
                    # Apply status filter
                    if status_filter != 'all' and customer_status != status_filter:
                        continue
                    
                    # Get last booking details
                    last_booking = (
                        Booking.objects
                        .filter(service__provider=provider, customer=customer)
                        .select_related('service')
                        .order_by('-created_at')
                        .first()
                    )
                    
                    # Build customer data
                    customer_data = {
                        'id': relation.id,
                        'customer': {
                            'id': customer.id,
                            'first_name': customer.first_name,
                            'last_name': customer.last_name,
                            'email': customer.email,
                            'phone': customer.phone or '',
                            'profile_picture': (
                                customer.profile_picture.url
                                if hasattr(customer, 'profile_picture') and customer.profile_picture else None
                            ),
                            'city': getattr(customer, 'city', ''),
                            'date_joined': customer.date_joined.isoformat()
                        },
                        'total_bookings': relation.total_bookings,
                        'total_spent': float(relation.total_spent),
                        'average_rating': float(relation.average_rating),
                        'is_favorite_customer': relation.is_favorite_customer,
                        'is_blocked': relation.is_blocked,
                        'first_booking_date': (
                            relation.first_booking_date.isoformat() if relation.first_booking_date else None
                        ),
                        'last_booking_date': (
                            relation.last_booking_date.isoformat() if relation.last_booking_date else None
                        ),
                        'notes': relation.notes or '',
                        'customer_status': customer_status,
                        'days_since_last_booking': days_since_last if days_since_last < 999 else None,
                        'created_at': relation.created_at.isoformat(),
                        'updated_at': relation.updated_at.isoformat(),
                        'last_service': {
                            'title': last_booking.service.title if last_booking else '',
                            'date': (
                                last_booking.booking_date.isoformat()
                                if last_booking and last_booking.booking_date else ''
                            ),
                            'amount': float(last_booking.total_amount) if last_booking else 0
                        }
                    }
                    
                    customers_data.append(customer_data)
                except User.DoesNotExist:
                    continue
                except Exception as e:
                    logger.error(f"Error processing customer {booking_data['customer']}: {str(e)}")
                    continue
            
            # Apply sorting
            reverse_sort = ordering.startswith('-')
            sort_field = ordering.lstrip('-')
            
            if sort_field == 'name':
                customers_data.sort(
                    key=lambda x: f"{x['customer']['first_name']} {x['customer']['last_name']}".lower(),
                    reverse=reverse_sort
                )
            elif sort_field == 'total_bookings':
                customers_data.sort(key=lambda x: x['total_bookings'], reverse=reverse_sort)
            elif sort_field == 'total_spent':
                customers_data.sort(key=lambda x: x['total_spent'], reverse=reverse_sort)
            elif sort_field == 'average_rating':
                customers_data.sort(key=lambda x: x['average_rating'], reverse=reverse_sort)
            else:  # last_booking_date
                customers_data.sort(
                    key=lambda x: x['last_booking_date'] or '1900-01-01',
                    reverse=reverse_sort
                )
            
            # Paginate results
            total_count = len(customers_data)
            start = (page - 1) * page_size
            end = start + page_size
            paginated_data = customers_data[start:end]
            
            response_data = {
                'count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size,
                'results': paginated_data
            }
            
            return Response(response_data)
        except Exception as e:
            logger.error(f'Error fetching customers: {str(e)}')
            return Response(
                {'error': f'Failed to fetch customers: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    @action(detail=True, methods=['patch'])
    def update_customer_relation(self, request, pk=None):
        """
        Update customer relationship data
        
        PATCH /api/bookings/provider_dashboard/customers/{relation_id}/
        """
        try:
            relation = ProviderCustomerRelation.objects.get(
                id=pk,
                provider=request.user
            )
            
            # Update allowed fields
            if 'is_favorite_customer' in request.data:
                relation.is_favorite_customer = request.data['is_favorite_customer']
            
            if 'is_blocked' in request.data:
                relation.is_blocked = request.data['is_blocked']
            
            if 'notes' in request.data:
                relation.notes = request.data['notes']
            
            relation.save()
            
            serializer = ProviderCustomerRelationSerializer(relation)
            return Response(serializer.data)
        except ProviderCustomerRelation.DoesNotExist:
            return Response(
                {'error': 'Customer relation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f'Error updating customer relation: {str(e)}')
            return Response(
                {'error': f'Failed to update customer relation: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    @action(detail=False, methods=['get'])
    def customer_stats(self, request):
        """
        Get customer statistics for provider dashboard
        
        GET /api/bookings/provider_dashboard/customer_stats/
        """
        provider = request.user
        
        try:
            # Get all customer relations
            relations = ProviderCustomerRelation.objects.filter(provider=provider)
            
            # Calculate stats
            total_customers = relations.count()
            regular_customers = relations.filter(total_bookings__gte=5).count()
            favorite_customers = relations.filter(is_favorite_customer=True).count()
            blocked_customers = relations.filter(is_blocked=True).count()
            
            # New customers this month
            current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            new_customers_this_month = relations.filter(
                first_booking_date__gte=current_month
            ).count()
            
            # Average rating
            avg_rating = relations.aggregate(avg=Avg('average_rating'))['avg'] or 0
            
            # Active customers (booked in last 30 days)
            thirty_days_ago = timezone.now() - timedelta(days=30)
            active_customers = relations.filter(
                last_booking_date__gte=thirty_days_ago
            ).count()
            
            # Retention rate (customers who booked more than once)
            returning_customers = relations.filter(total_bookings__gt=1).count()
            retention_rate = (returning_customers / max(total_customers, 1)) * 100
            
            stats = {
                'total_customers': total_customers,
                'regular_customers': regular_customers,
                'new_customers_this_month': new_customers_this_month,
                'active_customers': active_customers,
                'favorite_customers': favorite_customers,
                'blocked_customers': blocked_customers,
                'average_rating': float(avg_rating),
                'retention_rate': float(retention_rate)
            }
            
            return Response(stats)
        except Exception as e:
            logger.error(f'Error fetching customer stats: {str(e)}')
            return Response(
                {'error': f'Failed to fetch customer stats: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    @action(detail=False, methods=['get'])
    def recent_customer_activity(self, request):
        """
        Get recent customer activity for provider dashboard
        
        GET /api/bookings/provider_dashboard/recent_customer_activity/
        """
        provider = request.user
        limit = int(request.query_params.get('limit', 10))
        
        try:
            activities = []
            
            # Recent bookings
            recent_bookings = (
                Booking.objects
                .filter(service__provider=provider)
                .select_related('customer', 'service')
                .order_by('-created_at')[:limit]
            )
            
            for booking in recent_bookings:
                activities.append({
                    'id': f'booking_{booking.id}',
                    'type': 'booking',
                    'customer_name': booking.customer.get_full_name(),
                    'customer_id': booking.customer.id,
                    'title': 'New Booking',
                    'description': f'Booked {booking.service.title}',
                    'timestamp': booking.created_at.isoformat(),
                    'status': booking.status,
                    'amount': float(booking.total_amount)
                })
            
            # Recent reviews
            try:
                recent_reviews = (
                    Review.objects
                    .filter(provider=provider)
                    .select_related('customer')
                    .order_by('-created_at')[:limit//2]
                )
                
                for review in recent_reviews:
                    activities.append({
                        'id': f'review_{review.id}',
                        'type': 'review',
                        'customer_name': review.customer.get_full_name(),
                        'customer_id': review.customer.id,
                        'title': 'New Review',
                        'description': f'Left a {review.rating}-star review',
                        'timestamp': review.created_at.isoformat(),
                        'rating': review.rating
                    })
            except Exception as e:
                logger.warning(f'Error fetching reviews: {str(e)}')
            
            # Sort all activities by timestamp
            activities.sort(key=lambda x: x['timestamp'], reverse=True)
            
            return Response({'activities': activities[:limit]})
        except Exception as e:
            logger.error(f'Error fetching recent customer activity: {str(e)}')
            return Response(
                {'error': f'Failed to fetch recent activity: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    @action(detail=False, methods=['get'])
    def export_customers(self, request):
        """
        Export customer data as CSV
        
        GET /api/bookings/provider_dashboard/customers/export/?format=csv
        """
        provider = request.user
        export_format = request.query_params.get('format', 'csv')
        
        try:
            # Get all customer relations
            relations = (
                ProviderCustomerRelation.objects
                .filter(provider=provider)
                .select_related('customer')
                .order_by('-last_booking_date')
            )
            
            if export_format == 'csv':
                # Create CSV response
                response = HttpResponse(content_type='text/csv')
                response['Content-Disposition'] = (
                    f'attachment; filename="customers_{timezone.now().strftime("%Y%m%d")}.csv"'
                )
                
                import csv
                writer = csv.writer(response)
                writer.writerow([
                    'Customer Name', 'Email', 'Phone', 'Total Bookings', 
                    'Total Spent', 'Average Rating', 'Customer Status',
                    'First Booking', 'Last Booking', 'Is Favorite', 'Is Blocked', 'Notes'
                ])
                
                for relation in relations:
                    # Determine customer status
                    if relation.is_blocked:
                        customer_status = 'Blocked'
                    elif relation.is_favorite_customer:
                        customer_status = 'Favorite'
                    elif relation.total_bookings >= 5:
                        customer_status = 'Regular'
                    elif relation.total_bookings > 1:
                        customer_status = 'Returning'
                    else:
                        customer_status = 'New'
                    
                    writer.writerow([
                        relation.customer.get_full_name(),
                        relation.customer.email,
                        relation.customer.phone or '',
                        relation.total_bookings,
                        float(relation.total_spent),
                        float(relation.average_rating),
                        customer_status,
                        relation.first_booking_date.strftime('%Y-%m-%d') if relation.first_booking_date else '',
                        relation.last_booking_date.strftime('%Y-%m-%d') if relation.last_booking_date else '',
                        'Yes' if relation.is_favorite_customer else 'No',
                        'Yes' if relation.is_blocked else 'No',
                        relation.notes or ''
                    ])
                
                return response
            else:
                return Response(
                    {'error': 'Unsupported export format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            logger.error(f'Error exporting customer data: {str(e)}')
            return Response(
                {'error': f'Failed to export customer data: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get', 'put'])
    def schedule(self, request):
        """
        Get or update provider schedule and availability
        
        GET /api/bookings/provider_dashboard/schedule/?date_from=2024-03-01&date_to=2024-03-31
        PUT /api/bookings/provider_dashboard/schedule/
        """
        provider = request.user
        
        if request.method == 'GET':
            # Get query parameters
            date_from = request.query_params.get('date_from')
            date_to = request.query_params.get('date_to')
            include_blocked = request.query_params.get('include_blocked', 'true').lower() == 'true'
            
            # Get working hours from provider availability
            working_hours = {}
            availability_schedule = ProviderAvailability.objects.filter(provider=provider)
            
            for avail in availability_schedule:
                day_name = avail.get_weekday_display().lower()
                working_hours[day_name] = {
                    'start': avail.start_time.strftime('%H:%M'),
                    'end': avail.end_time.strftime('%H:%M'),
                    'enabled': avail.is_available
                }
            
            # Get break time (simplified - would get from provider settings)
            break_time = {
                'start': '13:00',
                'end': '14:00'
            }
            
            # Get availability slots
            availability = []
            blocked_times = []
            
            if date_from and date_to:
                try:
                    from_date = datetime.strptime(date_from, '%Y-%m-%d').date()
                    to_date = datetime.strptime(date_to, '%Y-%m-%d').date()
                    
                    # Get booking slots in date range
                    slots = BookingSlot.objects.filter(
                        service__provider=provider,
                        date__gte=from_date,
                        date__lte=to_date
                    ).order_by('date', 'start_time')
                    
                    # Group slots by date
                    slots_by_date = {}
                    for slot in slots:
                        date_str = slot.date.isoformat()
                        if date_str not in slots_by_date:
                            slots_by_date[date_str] = []
                        
                        slot_data = {
                            'id': slot.id,
                            'startTime': slot.start_time.strftime('%H:%M'),
                            'endTime': slot.end_time.strftime('%H:%M'),
                            'status': 'available' if slot.is_available and not slot.is_fully_booked else 'booked',
                            'maxBookings': slot.max_bookings,
                            'currentBookings': slot.current_bookings
                        }
                        
                        # Add booking details if slot is booked
                        if slot.is_fully_booked:
                            booking = Booking.objects.filter(booking_slot=slot).first()
                            if booking:
                                slot_data['booking'] = {
                                    'id': booking.id,
                                    'customer': booking.customer.get_full_name(),
                                    'service': booking.service.title
                                }
                        
                        slots_by_date[date_str].append(slot_data)
                    
                    # Convert to expected format
                    for date_str, slots_list in slots_by_date.items():
                        availability.append({
                            'date': date_str,
                            'slots': slots_list
                        })
                    
                    # Get blocked times from provider schedule
                    if include_blocked:
                        blocked_schedules = ProviderSchedule.objects.filter(
                            provider=provider,
                            date__gte=from_date,
                            date__lte=to_date,
                            schedule_type__in=['blocked', 'vacation', 'maintenance']
                        )
                        
                        for schedule in blocked_schedules:
                            blocked_times.append({
                                'id': schedule.id,
                                'title': schedule.title or schedule.get_schedule_type_display(),
                                'startDate': schedule.date.isoformat(),
                                'endDate': schedule.date.isoformat(),
                                'reason': schedule.schedule_type
                            })
                
                except ValueError:
                    pass
            
            response_data = {
                'workingHours': working_hours,
                'breakTime': break_time,
                'availability': availability,
                'blockedTimes': blocked_times
            }
            
            return Response(response_data)
        
        elif request.method == 'PUT':
            # Update working hours and break time
            working_hours = request.data.get('workingHours', {})
            break_time = request.data.get('breakTime', {})
            
            # Update provider availability
            for day_name, hours in working_hours.items():
                # Convert day name to weekday number
                day_mapping = {
                    'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
                    'friday': 4, 'saturday': 5, 'sunday': 6
                }
                
                if day_name in day_mapping:
                    weekday = day_mapping[day_name]
                    
                    # Update or create availability
                    ProviderAvailability.objects.update_or_create(
                        provider=provider,
                        weekday=weekday,
                        defaults={
                            'start_time': hours['start'],
                            'end_time': hours['end'],
                            'is_available': hours['enabled'],
                            'break_start': break_time.get('start'),
                            'break_end': break_time.get('end')
                        }
                    )
            
            return Response({'success': True, 'message': 'Schedule updated successfully'})
    
    # ===== DASHBOARD STATISTICS ENDPOINTS =====
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get comprehensive dashboard statistics for provider
        
        GET /api/bookings/provider-dashboard/statistics/
        
        Returns:
        - Total bookings (all time, this month, this week)
        - Total earnings (all time, this month, this week)
        - Average rating and total reviews
        - Active services count
        - Pending bookings count
        - Recent booking trends
        """
        provider = self.get_provider()
        now = timezone.now()
        
        # Date ranges for statistics
        today = now.date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        
        # Base queryset for provider's bookings
        provider_bookings = Booking.objects.filter(service__provider=provider)
        
        # Total bookings statistics
        total_bookings = provider_bookings.count()
        bookings_this_month = provider_bookings.filter(
            created_at__date__gte=month_start
        ).count()
        bookings_this_week = provider_bookings.filter(
            created_at__date__gte=week_start
        ).count()
        
        # Earnings statistics (from completed bookings)
        completed_bookings = provider_bookings.filter(status='completed')
        total_earnings = completed_bookings.aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0.00')
        
        earnings_this_month = completed_bookings.filter(
            updated_at__date__gte=month_start
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0.00')
        
        earnings_this_week = completed_bookings.filter(
            updated_at__date__gte=week_start
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0.00')
        
        # Rating statistics
        from apps.services.models import Service
        provider_services = Service.objects.filter(provider=provider)
        
        rating_stats = provider_services.aggregate(
            avg_rating=Avg('average_rating'),
            total_reviews=Sum('reviews_count')
        )
        
        average_rating = rating_stats['avg_rating'] or 0.0
        total_reviews = rating_stats['total_reviews'] or 0
        
        # Service statistics
        active_services = provider_services.filter(status='active').count()
        total_services = provider_services.count()
        
        # Pending bookings
        pending_bookings = provider_bookings.filter(
            status__in=['pending', 'confirmed']
        ).count()
        
        # Monthly trend data (last 6 months)
        monthly_trends = []
        for i in range(6):
            trend_month = (month_start - timedelta(days=30 * i)).replace(day=1)
            next_month = (trend_month + timedelta(days=32)).replace(day=1)
            
            month_bookings = provider_bookings.filter(
                created_at__date__gte=trend_month,
                created_at__date__lt=next_month
            ).count()
            
            month_earnings = completed_bookings.filter(
                updated_at__date__gte=trend_month,
                updated_at__date__lt=next_month
            ).aggregate(
                total=Sum('total_amount')
            )['total'] or Decimal('0.00')
            
            monthly_trends.append({
                'month': trend_month.strftime('%Y-%m'),
                'bookings': month_bookings,
                'earnings': float(month_earnings)
            })
        
        # Reverse to show oldest to newest
        monthly_trends.reverse()
        
        return Response({
            'bookings': {
                'total': total_bookings,
                'this_month': bookings_this_month,
                'this_week': bookings_this_week,
                'pending': pending_bookings
            },
            'earnings': {
                'total': float(total_earnings),
                'this_month': float(earnings_this_month),
                'this_week': float(earnings_this_week)
            },
            'ratings': {
                'average_rating': round(average_rating, 2),
                'total_reviews': total_reviews
            },
            'services': {
                'active': active_services,
                'total': total_services
            },
            'trends': {
                'monthly': monthly_trends
            }
        })
    
    @action(detail=False, methods=['get'])
    def recent_bookings(self, request):
        """
        Get recent bookings for provider dashboard
        
        GET /api/bookings/provider_dashboard/recent_bookings/?limit=10
        
        Returns recent bookings with customer and service details
        """
        provider = self.get_provider()
        limit = int(request.query_params.get('limit', 10))
        
        recent_bookings = Booking.objects.filter(
            service__provider=provider
        ).select_related(
            'customer', 'service'
        ).order_by('-created_at')[:limit]
        
        bookings_data = []
        for booking in recent_bookings:
            bookings_data.append({
                'id': booking.id,
                'customer_name': f"{booking.customer.first_name} {booking.customer.last_name}",
                'service_title': booking.service.title,
                'status': booking.status,
                'total_amount': float(booking.total_amount),
                'booking_date': booking.booking_date.isoformat() if booking.booking_date else None,
                'created_at': booking.created_at.isoformat(),
                'booking_step': booking.booking_step
            })
        
        return Response({
            'recent_bookings': bookings_data
        })
    
    @action(detail=False, methods=['get'])
    def earnings_analytics(self, request):
        """
        Get detailed earnings analytics for provider
        
        GET /api/bookings/provider_dashboard/earnings_analytics/?period=month
        
        Query params:
        - period: week|month|year (default: month)
        
        Returns detailed earnings breakdown and analytics
        """
        provider = self.get_provider()
        period = request.query_params.get('period', 'month')
        now = timezone.now()
        
        # Calculate date range based on period using calendar-accurate buckets
        if period == 'week':
            # 8 weekly buckets, oldest to newest
            this_monday = now.date() - timedelta(days=now.date().weekday())
            buckets = []
            for i in range(8):
                start = this_monday - timedelta(weeks=(7 - i))
                end = start + timedelta(weeks=1)
                buckets.append((start, end))
        elif period == 'month':
            # 12 monthly buckets, calendar-accurate, oldest to newest
            def month_start(d):
                return d.replace(day=1)
            def prev_month_start(d):
                return (d.replace(day=1) - timedelta(days=1)).replace(day=1)
            def next_month_start(d):
                return (d.replace(day=28) + timedelta(days=4)).replace(day=1)
            starts = []
            cur = month_start(now.date())
            for _ in range(12):
                starts.append(cur)
                cur = prev_month_start(cur)
            starts.reverse()
            buckets = [(ms, next_month_start(ms)) for ms in starts]
        else:  # year
            # 5 yearly buckets, calendar-accurate, oldest to newest
            current_year_start = now.date().replace(month=1, day=1)
            starts = []
            for i in range(5):
                starts.append(current_year_start.replace(year=current_year_start.year - (4 - i)))
            buckets = []
            for ms in starts:
                buckets.append((ms, ms.replace(year=ms.year + 1)))
        
        # Get completed bookings for the provider (respect paid-only setting)
        completed_bookings = Booking.objects.filter(
            service__provider=provider,
            status='completed'
        )
        try:
            from django.conf import settings as dj_settings
            require_paid = getattr(dj_settings, 'EARNINGS_REQUIRE_PAID', True)
        except Exception:
            require_paid = True
        if require_paid:
            completed_bookings = completed_bookings.filter(payment__status='completed')
        
        # Calculate earnings data for each period
        earnings_data = []
        total_earnings = 0
        
        for period_start, period_end in buckets:
            
            period_bookings = completed_bookings.filter(
                updated_at__date__gte=period_start,
                updated_at__date__lt=period_end
            )
            
            period_earnings = period_bookings.aggregate(
                total=Sum('total_amount'),
                count=Count('id')
            )
            
            earnings_amount = float(period_earnings['total'] or 0)
            bookings_count = period_earnings['count'] or 0
            
            total_earnings += earnings_amount
            
            earnings_data.append({
                'period': period_start.strftime('%Y-%m-%d'),
                'earnings': earnings_amount,
                'bookings_count': bookings_count
            })
        
        # Reverse to show oldest to newest
        earnings_data.reverse()
        
        # Calculate average per booking
        total_bookings = sum(item['bookings_count'] for item in earnings_data)
        average_per_booking = total_earnings / total_bookings if total_bookings > 0 else 0
        
        return Response({
            'period': period,
            'total_earnings': total_earnings,
            'average_per_booking': round(average_per_booking, 2),
            'earnings_data': earnings_data
        })

    @action(detail=False, methods=['get'], url_path='export_earnings')
    def export_earnings(self, request):
        """
        Export earnings analytics as CSV (period buckets with earnings and bookings_count)

        GET /api/bookings/provider_dashboard/export_earnings/?format=csv&period=month
        """
        import csv
        from django.http import HttpResponse

        provider = self.get_provider()
        export_format = request.query_params.get('format', 'csv')
        period = request.query_params.get('period', 'month')
        now = timezone.now()

        # Build buckets similar to earnings_analytics
        if period == 'week':
            this_monday = now.date() - timedelta(days=now.date().weekday())
            buckets = []
            for i in range(8):
                start = this_monday - timedelta(weeks=(7 - i))
                end = start + timedelta(weeks=1)
                buckets.append((start, end))
        elif period == 'month':
            def month_start(d):
                return d.replace(day=1)
            def prev_month_start(d):
                return (d.replace(day=1) - timedelta(days=1)).replace(day=1)
            def next_month_start(d):
                return (d.replace(day=28) + timedelta(days=4)).replace(day=1)
            starts = []
            cur = month_start(now.date())
            for _ in range(12):
                starts.append(cur)
                cur = prev_month_start(cur)
            starts.reverse()
            buckets = [(ms, next_month_start(ms)) for ms in starts]
        else:  # year
            current_year_start = now.date().replace(month=1, day=1)
            starts = []
            for i in range(5):
                starts.append(current_year_start.replace(year=current_year_start.year - (4 - i)))
            buckets = []
            for ms in starts:
                buckets.append((ms, ms.replace(year=ms.year + 1)))

        completed_bookings = Booking.objects.filter(
            service__provider=provider,
            status='completed'
        )
        try:
            from django.conf import settings as dj_settings
            require_paid = getattr(dj_settings, 'EARNINGS_REQUIRE_PAID', True)
        except Exception:
            require_paid = True
        if require_paid:
            completed_bookings = completed_bookings.filter(payment__status='completed')

        rows = []
        total_earnings = 0.0
        total_bookings = 0
        for start, end in buckets:
            period_bookings = completed_bookings.filter(
                updated_at__date__gte=start,
                updated_at__date__lt=end
            )
            data = period_bookings.aggregate(total=Sum('total_amount'), count=Count('id'))
            amount = float(data['total'] or 0)
            count = int(data['count'] or 0)
            total_earnings += amount
            total_bookings += count
            rows.append({
                'period_start': start.strftime('%Y-%m-%d'),
                'period_end': (end - timedelta(days=1)).strftime('%Y-%m-%d'),
                'earnings': amount,
                'bookings_count': count
            })

        # Only CSV implemented
        if export_format != 'csv':
            export_format = 'csv'

        response = HttpResponse(content_type='text/csv')
        filename = f"earnings_{period}_{now.strftime('%Y%m%d_%H%M%S')}.csv"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        writer = csv.writer(response)
        writer.writerow(['Period Start', 'Period End', 'Earnings', 'Bookings Count'])
        for r in rows:
            writer.writerow([r['period_start'], r['period_end'], f"{r['earnings']:.2f}", r['bookings_count']])
        writer.writerow([])
        avg = (total_earnings / total_bookings) if total_bookings > 0 else 0
        writer.writerow(['TOTAL', '', f"{total_earnings:.2f}", total_bookings])
        writer.writerow(['AVERAGE PER BOOKING', '', f"{avg:.2f}", ''])
        return response
    
    @action(detail=False, methods=['get'])
    def service_performance(self, request):
        """
        Get service performance analytics for provider
        
        GET /api/bookings/provider_dashboard/service_performance/
        
        Returns performance metrics for each service
        """
        provider = self.get_provider()
        
        from apps.services.models import Service
        services = Service.objects.filter(provider=provider).annotate(
            bookings_count=Count('bookings'),
            completed_bookings=Count('bookings', filter=models.Q(bookings__status='completed')),
            total_revenue=Sum('bookings__total_amount', filter=models.Q(bookings__status='completed'))
        )
        
        services_data = []
        for service in services:
            completion_rate = (service.completed_bookings / service.bookings_count * 100) if service.bookings_count > 0 else 0
            
            services_data.append({
                'id': service.id,
                'title': service.title,
                'category': service.category.title if service.category else None,
                'price': float(service.price),
                'is_active': service.status == 'active',
                'average_rating': float(service.average_rating or 0),
                'total_reviews': service.reviews_count or 0,
                'bookings_count': service.bookings_count or 0,
                'completed_bookings': service.completed_bookings or 0,
                'total_revenue': float(service.total_revenue or 0),
                'conversion_rate': round(
                    (service.completed_bookings / service.bookings_count * 100) 
                    if service.bookings_count > 0 else 0, 2
                )
            })
        
        # Sort by total revenue descending
        services_data.sort(key=lambda x: x['total_revenue'], reverse=True)
        
        return Response({
            'services': services_data
        })
    
    # ===== PROVIDER BOOKINGS ENDPOINT (for frontend compatibility) =====
    
    @action(detail=False, methods=['get'])
    def activity_timeline(self, request):
        """
        Get provider activity timeline
        
        GET /api/bookings/provider_dashboard/activity_timeline/
        
        Returns a timeline of activities including bookings, payments, reviews, and service updates
        """
        provider = self.get_provider()
        now = timezone.now()
        
        # Get recent bookings (last 30 days)
        recent_bookings = Booking.objects.filter(
            service__provider=provider,
            created_at__gte=now - timedelta(days=30)
        ).select_related('customer', 'service').order_by('-created_at')
        
        # Get recent payments (last 30 days)
        recent_payments = Payment.objects.filter(
            booking__service__provider=provider,
            created_at__gte=now - timedelta(days=30),
            status='completed'
        ).select_related('booking', 'booking__customer').order_by('-created_at')
        
        # Get recent reviews (last 30 days)
        from apps.reviews.models import Review
        recent_reviews = Review.objects.filter(
            booking__service__provider=provider,
            created_at__gte=now - timedelta(days=30)
        ).select_related('customer', 'booking__service').order_by('-created_at')
        
        # Get recent service updates (last 30 days)
        from apps.services.models import Service
        recent_service_updates = Service.objects.filter(
            provider=provider,
            updated_at__gte=now - timedelta(days=30)
        ).order_by('-updated_at')
        
        # Build timeline items
        timeline_items = []
        
        # Add booking activities
        for booking in recent_bookings:
            timeline_items.append({
                'id': f'booking_{booking.id}',
                'type': 'booking',
                'title': f'New Booking Request',
                'description': f'{booking.customer.get_full_name()} booked {booking.service.title}',
                'timestamp': booking.created_at.isoformat(),
                'status': booking.status,
                'metadata': {
                    'amount': float(booking.total_amount),
                    'service': booking.service.title,
                    'customer': booking.customer.get_full_name()
                }
            })
        
        # Add payment activities
        for payment in recent_payments:
            timeline_items.append({
                'id': f'payment_{payment.id}',
                'type': 'payment',
                'title': f'Payment Received',
                'description': f'Payment received for {payment.booking.service.title}',
                'timestamp': payment.created_at.isoformat(),
                'status': payment.status,
                'metadata': {
                    'amount': float(payment.amount),
                    'service': payment.booking.service.title,
                    'customer': payment.booking.customer.get_full_name()
                }
            })
        
        # Add review activities
        for review in recent_reviews:
            timeline_items.append({
                'id': f'review_{review.id}',
                'type': 'review',
                'title': f'New Review',
                'description': f'{review.customer.get_full_name()} left a {review.rating}-star review',
                'timestamp': review.created_at.isoformat(),
                'status': 'completed',
                'metadata': {
                    'rating': review.rating,
                    'service': review.booking.service.title,
                    'customer': review.customer.get_full_name()
                }
            })
        
        # Add service update activities
        for service in recent_service_updates:
            timeline_items.append({
                'id': f'service_{service.id}',
                'type': 'service',
                'title': f'Service Updated',
                'description': f'{service.title} was updated',
                'timestamp': service.updated_at.isoformat(),
                'status': 'completed',
                'metadata': {
                    'service': service.title
                }
            })
        
        # Sort timeline items by timestamp (newest first)
        timeline_items.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return Response({
            'timeline': timeline_items
        })
    
    @action(detail=False, methods=['get'], url_path='provider_bookings')
    def provider_bookings(self, request):
        """
        Get provider bookings in grouped format (for frontend compatibility)
        
        GET /api/bookings/provider-dashboard/provider_bookings/?format=grouped
        
        This endpoint provides the same functionality as the bookings endpoint
        but with a URL path that matches frontend expectations
        """
        return self.bookings(request)


class ProviderScheduleViewSet(viewsets.ModelViewSet):
    """
    Provider Schedule Management ViewSet
    
    Handles CRUD operations for provider custom schedules and blocked times
    """
    serializer_class = None  # Will be defined when we create the serializer
    permission_classes = [permissions.IsAuthenticated, IsProvider]
    
    def get_queryset(self):
        return ProviderSchedule.objects.filter(provider=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(provider=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """
        Create a new provider schedule entry (blocked time, vacation, etc.)
        
        POST /api/bookings/provider-schedule/
        {
            "title": "Vacation",
            "date": "2024-03-15",
            "end_date": "2024-03-20",
            "start_time": "09:00",
            "end_time": "17:00",
            "is_all_day": true,
            "schedule_type": "vacation",
            "notes": "Family vacation",
            "is_recurring": false,
            "recurring_pattern": "weekly",
            "recurring_until": "2024-12-31"
        }
        """
        data = request.data.copy()
        
        # Handle end_date - if not provided, use the same as date
        if 'end_date' not in data or not data['end_date']:
            data['end_date'] = data.get('date')
        
        # Create the schedule entry
        schedule_entry = ProviderSchedule.objects.create(
            provider=request.user,
            title=data.get('title', ''),
            date=data['date'],
            start_time=data.get('start_time') if not data.get('is_all_day', True) else None,
            end_time=data.get('end_time') if not data.get('is_all_day', True) else None,
            is_all_day=data.get('is_all_day', True),
            schedule_type=data.get('schedule_type', 'blocked'),
            notes=data.get('notes', ''),
            is_recurring=data.get('is_recurring', False),
            recurring_pattern=data.get('recurring_pattern') if data.get('is_recurring') else None,
            recurring_until=data.get('recurring_until') if data.get('is_recurring') else None
        )
        
        # If recurring, create additional entries
        if data.get('is_recurring') and data.get('recurring_until'):
            from datetime import datetime, timedelta
            
            start_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            end_date = datetime.strptime(data['recurring_until'], '%Y-%m-%d').date()
            current_date = start_date
            
            pattern = data.get('recurring_pattern', 'weekly')
            delta_days = 7 if pattern == 'weekly' else 30 if pattern == 'monthly' else 1
            
            while current_date <= end_date:
                current_date += timedelta(days=delta_days)
                if current_date <= end_date:
                    ProviderSchedule.objects.create(
                        provider=request.user,
                        title=data.get('title', ''),
                        date=current_date,
                        start_time=data.get('start_time') if not data.get('is_all_day', True) else None,
                        end_time=data.get('end_time') if not data.get('is_all_day', True) else None,
                        is_all_day=data.get('is_all_day', True),
                        schedule_type=data.get('schedule_type', 'blocked'),
                        notes=data.get('notes', ''),
                        is_recurring=False,  # Individual entries are not recurring
                        recurring_pattern=None,
                        recurring_until=None
                    )
        
        return Response({
            'id': schedule_entry.id,
            'title': schedule_entry.title,
            'date': schedule_entry.date.isoformat(),
            'schedule_type': schedule_entry.schedule_type,
            'message': 'Schedule entry created successfully'
        }, status=status.HTTP_201_CREATED)


class ProviderBookingUpdateViewSet(viewsets.ViewSet):
    """
    NEW VIEWSET: Provider booking status updates
    
    Purpose: Allow providers to update booking statuses
    Impact: New viewset - enables provider booking management
    """
    permission_classes = [permissions.IsAuthenticated, CanManageProviderBookings]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'provider_bookings'
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """
        Update booking status
        
        PATCH /api/bookings/provider_booking_update/{id}/update_status/
        {
            "status": "confirmed",
            "provider_notes": "Confirmed for tomorrow morning"
        }
        """
        try:
            booking = Booking.objects.get(id=pk)
        except Booking.DoesNotExist:
            return Response(
                {"detail": "Booking not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions
        if request.user != booking.service.provider and request.user.role != 'admin':
            return Response(
                {"detail": "You can only update bookings for your services"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get new status and notes
        new_status = request.data.get('status')
        provider_notes = request.data.get('provider_notes', '')
        
        # Validate status transition
        valid_transitions = {
            'pending': ['confirmed', 'rejected'],
            'confirmed': ['service_delivered', 'cancelled'],
            'service_delivered': ['completed'],  # Only through customer confirmation
        }
        
        if booking.status not in valid_transitions:
            return Response(
                {"detail": f"Cannot update booking with status '{booking.status}'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_status not in valid_transitions[booking.status]:
            return Response(
                {"detail": f"Invalid status transition from '{booking.status}' to '{new_status}'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update booking
        booking.status = new_status
        if provider_notes:
            booking.provider_notes = provider_notes
        
        # Set rejection reason if rejecting
        if new_status == 'rejected' and not booking.rejection_reason:
            booking.rejection_reason = provider_notes or "Rejected by provider"
        
        booking.save()
        
        return Response({
            'success': True,
            'booking_id': booking.id,
            'status': booking.status,
            'provider_notes': booking.provider_notes,
            'updated_at': booking.updated_at.isoformat()
        })

# === PROVIDER ANALYTICS CACHING ===

from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

class ProviderAnalyticsViewSet(viewsets.ViewSet):
    """
    Cached Provider Analytics API
    
    Provides cached analytics data for better performance
    """
    permission_classes = [permissions.IsAuthenticated, IsProvider]
    
    def get_provider(self):
        """Get the current provider from request user"""
        return self.request.user
    
    def get_cache_key(self, provider_id, endpoint, params=None):
        """Generate cache key for provider analytics"""
        key = f"provider_analytics:{provider_id}:{endpoint}"
        if params:
            key += f":{hash(str(sorted(params.items())))}"
        return key
    
    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    @action(detail=False, methods=['get'])
    def cached_statistics(self, request):
        """
        Get cached dashboard statistics
        
        GET /api/bookings/provider_analytics/cached_statistics/
        """
        provider = request.user
        cache_key = self.get_cache_key(provider.id, 'statistics')
        
        # Try to get from cache first
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)
        
        # If not in cache, calculate and cache
        dashboard_viewset = ProviderDashboardViewSet()
        dashboard_viewset.request = request
        response = dashboard_viewset.statistics(request)
        
        # Cache the data for 15 minutes
        cache.set(cache_key, response.data, 60 * 15)
        
        return response
    
    @action(detail=False, methods=['post'])
    def refresh_cache(self, request):
        """
        Refresh provider analytics cache
        
        POST /api/bookings/provider_analytics/refresh_cache/
        """
        provider = request.user
        
        # Clear all cache keys for this provider
        cache_keys = [
            self.get_cache_key(provider.id, 'statistics'),
            self.get_cache_key(provider.id, 'earnings_analytics'),
            self.get_cache_key(provider.id, 'service_performance')
        ]
        
        cache.delete_many(cache_keys)
        
        return Response({
            'success': True,
            'message': 'Provider analytics cache refreshed'
        })
# === PROVIDER BOOKINGS MANAGEMENT API ===

class ProviderBookingManagementViewSet(viewsets.ViewSet):
    """
    Provider Bookings Management API
    
    Provides comprehensive booking management functionality for providers
    including grouped bookings, status updates, and filtering capabilities.
    """
    permission_classes = [permissions.IsAuthenticated, IsProvider]
    
    def get_provider(self):
        """Get the current provider from request user"""
        return self.request.user
    
    def list(self, request):
        """
        Get provider bookings in grouped format (root action)
        
        GET /api/bookings/provider_bookings/
        
        This is the root action that handles the main provider bookings endpoint
        and delegates to grouped_bookings for the actual implementation.
        """
        return self.grouped_bookings(request)
    
    @action(detail=False, methods=['get'])
    def grouped_bookings(self, request):
        """
        Get bookings grouped by status for provider
        
        GET /api/bookings/provider_bookings/grouped_bookings/
        
        Query params:
        - limit: Number of bookings per group (default: 10)
        - date_from: Filter bookings from date (YYYY-MM-DD)
        - date_to: Filter bookings to date (YYYY-MM-DD)
        - customer_search: Search by customer name
        
        Returns bookings grouped by: pending, upcoming, completed, cancelled, rejected
        """
        provider = self.get_provider()
        limit = int(request.query_params.get('limit', 10))
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        customer_search = request.query_params.get('customer_search')
        
        # Base queryset for provider's bookings
        base_queryset = Booking.objects.filter(
            service__provider=provider
        ).select_related(
            'customer', 'service', 'service__category'
        ).order_by('-created_at')
        
        # Apply date filters
        if date_from:
            try:
                from datetime import datetime
                date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
                base_queryset = base_queryset.filter(booking_date__gte=date_from_obj)
            except ValueError:
                pass
        
        if date_to:
            try:
                from datetime import datetime
                date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
                base_queryset = base_queryset.filter(booking_date__lte=date_to_obj)
            except ValueError:
                pass
        
        # Apply customer search
        if customer_search:
            base_queryset = base_queryset.filter(
                models.Q(customer__first_name__icontains=customer_search) |
                models.Q(customer__last_name__icontains=customer_search) |
                models.Q(customer__email__icontains=customer_search)
            )
        
        # Group bookings by status
        pending_bookings = base_queryset.filter(
            status__in=['pending', 'payment_pending']
        )[:limit]
        
        upcoming_bookings = base_queryset.filter(
            status__in=['confirmed', 'service_delivered', 'awaiting_confirmation']
        )[:limit]
        
        completed_bookings = base_queryset.filter(
            status='completed'
        )[:limit]
        
        # Add cancelled and rejected bookings separately
        cancelled_bookings = base_queryset.filter(
            status__in=['cancelled', 'canceled']
        )[:limit]
        
        rejected_bookings = base_queryset.filter(
            status='rejected'
        )[:limit]
        
        # Serialize booking data
        def serialize_booking(booking):
            return {
                'id': booking.id,
                'customer': {
                    'id': booking.customer.id,
                    'name': f"{booking.customer.first_name} {booking.customer.last_name}",
                    'email': booking.customer.email,
                    'phone': booking.phone
                },
                'service': {
                    'id': booking.service.id,
                    'title': booking.service.title,
                    'category': booking.service.category.title if booking.service.category else None,
                    'price': float(booking.service.price)
                },
                'booking_date': booking.booking_date.isoformat() if booking.booking_date else None,
                'booking_time': booking.booking_time.strftime('%H:%M') if booking.booking_time else None,
                'address': booking.address,
                'city': booking.city,
                'status': booking.status,
                'booking_step': booking.booking_step,
                'total_amount': float(booking.total_amount),
                'special_instructions': booking.special_instructions,
                'cancellation_reason': booking.cancellation_reason,
                'rejection_reason': booking.rejection_reason,
                'created_at': booking.created_at.isoformat(),
                'updated_at': booking.updated_at.isoformat(),
                'can_update_status': self._can_update_booking_status(booking),
                'available_actions': self._get_available_actions(booking)
            }
        
        return Response({
            'pending': [serialize_booking(b) for b in pending_bookings],
            'upcoming': [serialize_booking(b) for b in upcoming_bookings],
            'completed': [serialize_booking(b) for b in completed_bookings],
            'cancelled': [serialize_booking(b) for b in cancelled_bookings],  # Add cancelled bookings
            'rejected': [serialize_booking(b) for b in rejected_bookings],  # Add rejected bookings
            'total_counts': {
                'pending': base_queryset.filter(status__in=['pending', 'payment_pending']).count(),
                'upcoming': base_queryset.filter(status__in=['confirmed', 'service_delivered', 'awaiting_confirmation']).count(),
                'completed': base_queryset.filter(status='completed').count(),
                'cancelled': base_queryset.filter(status__in=['cancelled', 'canceled']).count(),  # Add cancelled count
                'rejected': base_queryset.filter(status='rejected').count()  # Add rejected count
            }
        })
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Update booking status by provider
        
        POST /api/bookings/provider_bookings/{id}/update_status/
        {
            "status": "confirmed|rejected|service_delivered",
            "notes": "Optional provider notes",
            "rejection_reason": "Required if status is rejected"
        }
        """
        provider = self.get_provider()
        
        try:
            booking = Booking.objects.get(
                id=pk,
                service__provider=provider
            )
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')
        rejection_reason = request.data.get('rejection_reason', '')
        
        # Validate status transition
        if not self._can_update_booking_status(booking):
            return Response(
                {'error': 'Cannot update booking status in current state'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate status value
        valid_statuses = ['confirmed', 'rejected', 'service_delivered']
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Handle rejection
        if new_status == 'rejected':
            if not rejection_reason:
                return Response(
                    {'error': 'Rejection reason is required when rejecting a booking'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            booking.rejection_reason = rejection_reason
        
        # Update booking
        old_status = booking.status
        booking.status = new_status
        
        # Add provider notes if provided
        if notes:
            if not hasattr(booking, 'provider_notes') or not booking.provider_notes:
                booking.provider_notes = notes
            else:
                booking.provider_notes += f"\n[{timezone.now().strftime('%Y-%m-%d %H:%M')}] {notes}"
        
        # Update booking step based on new status
        if new_status == 'confirmed':
            booking.booking_step = 'confirmed'
        elif new_status == 'rejected':
            booking.booking_step = 'rejected'
        elif new_status == 'service_delivered':
            booking.booking_step = 'service_delivered'
        
        booking.save()
        
        # Log the status change
        logger.info(f"Booking {booking.id} status updated from {old_status} to {new_status} by provider {provider.id}")
        
        return Response({
            'success': True,
            'message': f'Booking status updated to {new_status}',
            'booking': {
                'id': booking.id,
                'status': booking.status,
                'booking_step': booking.booking_step,
                'provider_notes': getattr(booking, 'provider_notes', ''),
                'updated_at': booking.updated_at.isoformat()
            }
        })
    
    @action(detail=True, methods=['post'])
    def mark_delivered(self, request, pk=None):
        """
        Mark service as delivered
        
        POST /api/bookings/provider_bookings/{id}/mark_delivered/
        {
            "delivery_notes": "Optional delivery notes",
            "completion_photos": ["photo1_url", "photo2_url"]  // Optional
        }
        """
        provider = self.get_provider()
        
        try:
            booking = Booking.objects.get(
                id=pk,
                service__provider=provider
            )
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if booking can be marked as delivered
        if booking.status != 'confirmed':
            return Response(
                {'error': 'Only confirmed bookings can be marked as delivered'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        delivery_notes = request.data.get('delivery_notes', '')
        completion_photos = request.data.get('completion_photos', [])
        
        # If completion_photos is provided but empty, don't update delivery_photos
        if completion_photos is None:
            completion_photos = []
        
        # Update booking status
        booking.status = 'service_delivered'
        booking.booking_step = 'service_delivered'
        
        # Add delivery notes
        if delivery_notes:
            delivery_timestamp = timezone.now().strftime('%Y-%m-%d %H:%M')
            delivery_note = f"[{delivery_timestamp}] Service Delivered: {delivery_notes}"
            
            if not hasattr(booking, 'provider_notes') or not booking.provider_notes:
                booking.provider_notes = delivery_note
            else:
                booking.provider_notes += f"\n{delivery_note}"
        
        booking.save()
        
        # Create or update service delivery record
        from .models import ServiceDelivery
        service_delivery, created = ServiceDelivery.objects.get_or_create(
            booking=booking,
            defaults={
                'delivered_by': provider,
                'delivery_notes': delivery_notes,
                'delivered_at': timezone.now(),
                'delivery_photos': completion_photos if completion_photos else []
            }
        )
        
        if not created:
            service_delivery.delivery_notes = delivery_notes
            service_delivery.delivered_at = timezone.now()
            service_delivery.delivered_by = provider
            # Only update delivery_photos if completion_photos is provided and not empty
            if completion_photos:
                service_delivery.delivery_photos = completion_photos
            service_delivery.save()
        
        logger.info(f"Service marked as delivered for booking {booking.id} by provider {provider.id}")
        
        return Response({
            'success': True,
            'message': 'Service marked as delivered successfully',
            'booking': {
                'id': booking.id,
                'status': booking.status,
                'booking_step': booking.booking_step,
                'updated_at': booking.updated_at.isoformat()
            },
            'service_delivery': {
                'id': service_delivery.id,
                'delivered_at': service_delivery.delivered_at.isoformat() if service_delivery.delivered_at else None,
                'delivery_notes': service_delivery.delivery_notes,
                'delivery_photos': service_delivery.delivery_photos
            }
        })
    
    @action(detail=True, methods=['post'])
    def upload_delivery_photos(self, request, pk=None):
        """
        Upload delivery photos for a booking
        
        POST /api/bookings/provider_bookings/{id}/upload_delivery_photos/
        Form data with 'photos' field containing multiple image files
        """
        provider = self.get_provider()
        
        try:
            booking = Booking.objects.get(
                id=pk,
                service__provider=provider
            )
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get uploaded files
        photos = request.FILES.getlist('photos')
        if not photos:
            return Response(
                {'error': 'No photos provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file types and sizes
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        max_size = 5 * 1024 * 1024  # 5MB
        
        uploaded_urls = []
        for photo in photos:
            if photo.content_type not in allowed_types:
                return Response(
                    {'error': f'Invalid file type: {photo.content_type}. Only JPEG, PNG, and WebP are allowed.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if photo.size > max_size:
                return Response(
                    {'error': f'File too large: {photo.name}. Maximum size is 5MB.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Save the file with proper naming convention
            from django.core.files.storage import default_storage
            import uuid
            import os
            
            # Get provider name (sanitized for filename)
            provider_name = provider.get_full_name() or provider.username
            provider_name = "".join(c for c in provider_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
            provider_name = provider_name.replace(' ', '_')
            
            # Create filename: providername_bookingID_uuid.extension
            file_extension = os.path.splitext(photo.name)[1]
            unique_filename = f"{provider_name}_{booking.id}_{uuid.uuid4()}{file_extension}"
            
            # Save to service_delivery_photos/{booking_id}/
            file_path = f'service_delivery_photos/{booking.id}/{unique_filename}'
            saved_path = default_storage.save(file_path, photo)
            # Return full URL instead of relative URL
            relative_url = default_storage.url(saved_path)
            full_url = f"{settings.BACKEND_URL}{relative_url}"
            uploaded_urls.append(full_url)
        
        # Update or create service delivery record
        service_delivery, created = ServiceDelivery.objects.get_or_create(
            booking=booking,
            defaults={
                'delivered_by': provider,
                'delivery_photos': uploaded_urls
            }
        )
        
        if not created:
            # Append to existing photos
            existing_photos = service_delivery.delivery_photos or []
            service_delivery.delivery_photos = existing_photos + uploaded_urls
            service_delivery.save()
        
        return Response({
            'success': True,
            'message': f'{len(uploaded_urls)} photos uploaded successfully',
            'uploaded_photos': uploaded_urls,
            'total_photos': len(service_delivery.delivery_photos)
        })
    
    @action(detail=False, methods=['get'])
    def booking_filters(self, request):
        """
        Get available filter options for provider bookings
        
        GET /api/bookings/provider_bookings/booking_filters/
        
        Returns available statuses, date ranges, and customer list for filtering
        """
        provider = self.get_provider()
        
        # Get unique statuses
        statuses = Booking.objects.filter(
            service__provider=provider
        ).values_list('status', flat=True).distinct()
        
        # Get date range
        date_range = Booking.objects.filter(
            service__provider=provider
        ).aggregate(
            earliest=models.Min('booking_date'),
            latest=models.Max('booking_date')
        )
        
        # Get recent customers
        recent_customers = Booking.objects.filter(
            service__provider=provider
        ).select_related('customer').order_by('-created_at')[:20]
        
        customers = []
        seen_customers = set()
        for booking in recent_customers:
            customer_id = booking.customer.id
            if customer_id not in seen_customers:
                customers.append({
                    'id': customer_id,
                    'name': f"{booking.customer.first_name} {booking.customer.last_name}",
                    'email': booking.customer.email
                })
                seen_customers.add(customer_id)
        
        return Response({
            'statuses': list(statuses),
            'date_range': {
                'earliest': date_range['earliest'].isoformat() if date_range['earliest'] else None,
                'latest': date_range['latest'].isoformat() if date_range['latest'] else None
            },
            'recent_customers': customers
        })
    
    def _can_update_booking_status(self, booking):
        """Check if provider can update booking status"""
        # Providers can update status for pending and confirmed bookings
        return booking.status in ['pending', 'payment_pending', 'confirmed']
    
    def _get_available_actions(self, booking):
        """Get available actions for a booking based on its current status"""
        actions = []
        
        if booking.status == 'pending':
            actions.extend(['confirm', 'reject'])
        elif booking.status == 'confirmed':
            actions.extend(['mark_delivered', 'add_notes'])
        elif booking.status == 'service_delivered':
            actions.extend(['view_delivery_status', 'add_notes'])
        elif booking.status == 'completed':
            actions.extend(['view_details', 'add_notes'])
        
        return actions

# === PROVIDER SERVICES MANAGEMENT API ===

class ProviderServicesManagementViewSet(viewsets.ViewSet):
    """
    Provider Services Management API
    
    Provides comprehensive service management functionality for providers
    including CRUD operations, activation/deactivation, and performance metrics.
    """
    permission_classes = [permissions.IsAuthenticated, IsProvider]
    
    def get_provider(self):
        """Get the current provider from request user"""
        return self.request.user
    
    @action(detail=False, methods=['get'])
    def my_services(self, request):
        """
        Get all services for the current provider
        
        GET /api/bookings/provider_services/my_services/
        
        Query params:
        - status: active|inactive|draft|pending (filter by status)
        - category: category_id (filter by category)
        - search: search term for title/description
        - ordering: title|-title|price|-price|created_at|-created_at
        - limit: number of services to return (default: 20)
        """
        provider = self.get_provider()
        
        # Base queryset
        from apps.services.models import Service
        queryset = Service.objects.filter(provider=provider).select_related('category')
        
        # Apply filters
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        category_filter = request.query_params.get('category')
        if category_filter:
            try:
                category_id = int(category_filter)
                queryset = queryset.filter(category_id=category_id)
            except ValueError:
                pass
        
        search_term = request.query_params.get('search')
        if search_term:
            queryset = queryset.filter(
                models.Q(title__icontains=search_term) |
                models.Q(description__icontains=search_term) |
                models.Q(short_description__icontains=search_term)
            )
        
        # Apply ordering
        ordering = request.query_params.get('ordering', '-created_at')
        valid_orderings = ['title', '-title', 'price', '-price', 'created_at', '-created_at', 'average_rating', '-average_rating']
        if ordering in valid_orderings:
            queryset = queryset.order_by(ordering)
        
        # Apply limit
        limit = int(request.query_params.get('limit', 20))
        queryset = queryset[:limit]
        
        # Annotate with performance metrics
        queryset = queryset.annotate(
            total_bookings=Count('bookings'),
            completed_bookings=Count('bookings', filter=models.Q(bookings__status='completed')),
            total_revenue=Sum('bookings__total_amount', filter=models.Q(bookings__status='completed')),
            pending_bookings=Count('bookings', filter=models.Q(bookings__status__in=['pending', 'confirmed']))
        )
        
        # Serialize services
        services_data = []
        for service in queryset:
            services_data.append({
                'id': service.id,
                'title': service.title,
                'slug': service.slug,
                'description': service.description,
                'short_description': service.short_description,
                'price': float(service.price),
                'discount_price': float(service.discount_price) if service.discount_price else None,
                'duration': service.duration,
                'status': service.status,
                'is_featured': service.is_featured,
                'average_rating': float(service.average_rating),
                'reviews_count': service.reviews_count,
                'category': {
                    'id': service.category.id,
                    'title': service.category.title,
                    'slug': service.category.slug
                } if service.category else None,
                'cities': [city.name for city in service.cities.all()],
                'includes': service.includes,
                'excludes': service.excludes,
                'tags': service.tags,
                'is_verified_provider': service.is_verified_provider,
                'response_time': service.response_time,
                'cancellation_policy': service.cancellation_policy,
                'view_count': service.view_count,
                'inquiry_count': service.inquiry_count,
                'created_at': service.created_at.isoformat(),
                'updated_at': service.updated_at.isoformat(),
                'performance_metrics': {
                    'total_bookings': service.total_bookings or 0,
                    'completed_bookings': service.completed_bookings or 0,
                    'pending_bookings': service.pending_bookings or 0,
                    'total_revenue': float(service.total_revenue or 0),
                    'conversion_rate': round(
                        (service.completed_bookings / service.total_bookings * 100) 
                        if service.total_bookings > 0 else 0, 2
                    ),
                    'average_booking_value': round(
                        float(service.total_revenue or 0) / (service.completed_bookings or 1), 2
                    ) if service.completed_bookings > 0 else 0
                }
            })
        
        return Response({
            'services': services_data,
            'total_count': Service.objects.filter(provider=provider).count()
        })
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """
        Toggle service status (activate/deactivate)
        
        POST /api/bookings/provider_services/{id}/toggle_status/
        {
            "status": "active|inactive|draft"
        }
        """
        provider = self.get_provider()
        
        try:
            from apps.services.models import Service
            service = Service.objects.get(id=pk, provider=provider)
        except Service.DoesNotExist:
            return Response(
                {'error': 'Service not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        new_status = request.data.get('status')
        valid_statuses = ['active', 'inactive', 'draft']
        
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = service.status
        service.status = new_status
        service.save()
        
        logger.info(f"Service {service.id} status changed from {old_status} to {new_status} by provider {provider.id}")
        
        return Response({
            'success': True,
            'message': f'Service status updated to {new_status}',
            'service': {
                'id': service.id,
                'title': service.title,
                'status': service.status,
                'updated_at': service.updated_at.isoformat()
            }
        })
    
    @action(detail=True, methods=['get'])
    def performance_details(self, request, pk=None):
        """
        Get detailed performance metrics for a specific service
        
        GET /api/bookings/provider_services/{id}/performance_details/
        
        Query params:
        - period: week|month|quarter|year (default: month)
        """
        provider = self.get_provider()
        
        try:
            from apps.services.models import Service
            service = Service.objects.get(id=pk, provider=provider)
        except Service.DoesNotExist:
            return Response(
                {'error': 'Service not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        period = request.query_params.get('period', 'month')
        now = timezone.now()
        
        # Calculate date range based on period
        if period == 'week':
            start_date = now.date() - timedelta(days=now.date().weekday())
            periods_back = 8  # Last 8 weeks
            delta = timedelta(weeks=1)
        elif period == 'quarter':
            start_date = now.date().replace(month=((now.month-1)//3)*3+1, day=1)
            periods_back = 4  # Last 4 quarters
            delta = timedelta(days=90)
        elif period == 'year':
            start_date = now.date().replace(month=1, day=1)
            periods_back = 3  # Last 3 years
            delta = timedelta(days=365)
        else:  # month
            start_date = now.date().replace(day=1)
            periods_back = 12  # Last 12 months
            delta = timedelta(days=30)
        
        # Get bookings for this service
        service_bookings = Booking.objects.filter(service=service)
        
        # Calculate performance data by period
        performance_data = []
        current_date = start_date
        
        for i in range(periods_back):
            period_start = current_date - (delta * i)
            period_end = current_date - (delta * (i - 1)) if i > 0 else now.date()
            
            period_bookings = service_bookings.filter(
                created_at__date__gte=period_start,
                created_at__date__lt=period_end
            )
            
            completed_bookings = period_bookings.filter(status='completed')
            
            period_stats = {
                'period': period_start.strftime('%Y-%m-%d'),
                'total_bookings': period_bookings.count(),
                'completed_bookings': completed_bookings.count(),
                'revenue': float(completed_bookings.aggregate(
                    total=Sum('total_amount')
                )['total'] or 0),
                'average_rating': float(completed_bookings.aggregate(
                    avg=Avg('review__rating')
                )['avg'] or 0)
            }
            
            performance_data.append(period_stats)
        
        # Reverse to show oldest to newest
        performance_data.reverse()
        
        # Calculate overall metrics
        total_bookings = service_bookings.count()
        completed_bookings = service_bookings.filter(status='completed').count()
        total_revenue = float(service_bookings.filter(status='completed').aggregate(
            total=Sum('total_amount')
        )['total'] or 0)
        
        return Response({
            'service': {
                'id': service.id,
                'title': service.title,
                'status': service.status
            },
            'period': period,
            'overall_metrics': {
                'total_bookings': total_bookings,
                'completed_bookings': completed_bookings,
                'total_revenue': total_revenue,
                'conversion_rate': round(
                    (completed_bookings / total_bookings * 100) if total_bookings > 0 else 0, 2
                ),
                'average_booking_value': round(
                    total_revenue / completed_bookings, 2
                ) if completed_bookings > 0 else 0,
                'average_rating': float(service.average_rating),
                'total_reviews': service.reviews_count
            },
            'performance_data': performance_data
        })
    
    @action(detail=False, methods=['get'])
    def service_categories(self, request):
        """
        Get available service categories for provider
        
        GET /api/bookings/provider_services/service_categories/
        """
        from apps.services.models import ServiceCategory
        
        categories = ServiceCategory.objects.filter(is_active=True).order_by('title')
        
        categories_data = []
        for category in categories:
            categories_data.append({
                'id': category.id,
                'title': category.title,
                'slug': category.slug,
                'description': category.description,
                'icon': category.icon
            })
        
        return Response({
            'categories': categories_data
        })
    
    @action(detail=False, methods=['get'])
    def service_analytics_summary(self, request):
        """
        Get analytics summary for all provider services
        
        GET /api/bookings/provider_services/service_analytics_summary/
        """
        provider = self.get_provider()
        
        from apps.services.models import Service
        
        # Get all provider services with metrics
        services = Service.objects.filter(provider=provider).annotate(
            total_bookings=Count('bookings'),
            completed_bookings=Count('bookings', filter=models.Q(bookings__status='completed')),
            total_revenue=Sum('bookings__total_amount', filter=models.Q(bookings__status='completed')),
            pending_bookings=Count('bookings', filter=models.Q(bookings__status__in=['pending', 'confirmed']))
        )
        
        # Calculate summary metrics
        total_services = services.count()
        active_services = services.filter(status='active').count()
        inactive_services = services.filter(status='inactive').count()
        draft_services = services.filter(status='draft').count()
        
        total_bookings = services.aggregate(Sum('total_bookings'))['total_bookings__sum'] or 0
        total_revenue = services.aggregate(Sum('total_revenue'))['total_revenue__sum'] or 0
        
        # Top performing services
        top_services = services.filter(total_bookings__gt=0).order_by('-total_revenue')[:5]
        
        top_services_data = []
        for service in top_services:
            top_services_data.append({
                'id': service.id,
                'title': service.title,
                'total_bookings': service.total_bookings or 0,
                'total_revenue': float(service.total_revenue or 0),
                'average_rating': float(service.average_rating),
                'status': service.status
            })
        
        return Response({
            'summary': {
                'total_services': total_services,
                'active_services': active_services,
                'inactive_services': inactive_services,
                'draft_services': draft_services,
                'total_bookings': total_bookings,
                'total_revenue': float(total_revenue),
                'average_revenue_per_service': round(
                    float(total_revenue) / active_services, 2
                ) if active_services > 0 else 0
            },
            'top_performing_services': top_services_data
        })
    
    @action(detail=True, methods=['post'])
    def update_pricing(self, request, pk=None):
        """
        Update service pricing
        
        POST /api/bookings/provider_services/{id}/update_pricing/
        {
            "price": 150.00,
            "discount_price": 120.00  // optional
        }
        """
        provider = self.get_provider()
        
        try:
            from apps.services.models import Service
            service = Service.objects.get(id=pk, provider=provider)
        except Service.DoesNotExist:
            return Response(
                {'error': 'Service not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        new_price = request.data.get('price')
        new_discount_price = request.data.get('discount_price')
        
        if not new_price:
            return Response(
                {'error': 'Price is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            new_price = float(new_price)
            if new_price <= 0:
                raise ValueError("Price must be positive")
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid price format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_discount_price:
            try:
                new_discount_price = float(new_discount_price)
                if new_discount_price <= 0 or new_discount_price >= new_price:
                    raise ValueError("Discount price must be positive and less than regular price")
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid discount price format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        old_price = service.price
        old_discount_price = service.discount_price
        
        service.price = new_price
        service.discount_price = new_discount_price
        service.save()
        
        logger.info(f"Service {service.id} pricing updated by provider {provider.id}: {old_price} -> {new_price}")
        
        return Response({
            'success': True,
            'message': 'Service pricing updated successfully',
            'service': {
                'id': service.id,
                'title': service.title,
                'old_price': float(old_price),
                'new_price': float(service.price),
                'old_discount_price': float(old_discount_price) if old_discount_price else None,
                'new_discount_price': float(service.discount_price) if service.discount_price else None,
                'updated_at': service.updated_at.isoformat()
            }
        })


# === PROVIDER EARNINGS AND FINANCIAL API ===

class ProviderEarningsManagementViewSet(viewsets.ViewSet):
    """
    Provider Earnings and Financial Management API
    
    Provides comprehensive earnings tracking, payout management, and financial analytics
    for providers including earnings calculation, payout history, and financial reports.
    """
    permission_classes = [permissions.IsAuthenticated, IsProvider]
    
    def get_provider(self):
        """Get the current provider from request user"""
        return self.request.user
    
    @action(detail=False, methods=['get'])
    def earnings_overview(self, request):
        """
        Get comprehensive earnings overview for provider
        
        GET /api/bookings/provider_earnings/earnings_overview/
        
        Query params:
        - period: week|month|quarter|year (default: month)
        """
        provider = self.get_provider()
        period = request.query_params.get('period', 'month')
        now = timezone.now()
        
        # Calculate date ranges
        today = now.date()
        
        if period == 'week':
            start_date = today - timedelta(days=today.weekday())
            previous_start = start_date - timedelta(weeks=1)
        elif period == 'quarter':
            start_date = today.replace(month=((today.month-1)//3)*3+1, day=1)
            previous_start = (start_date - timedelta(days=90)).replace(day=1)
        elif period == 'year':
            start_date = today.replace(month=1, day=1)
            previous_start = start_date.replace(year=start_date.year-1)
        else:  # month
            start_date = today.replace(day=1)
            previous_start = (start_date - timedelta(days=1)).replace(day=1)
        
        # Get completed bookings for earnings calculation (respect paid-only)
        completed_bookings = Booking.objects.filter(
            service__provider=provider,
            status='completed'
        )
        try:
            from django.conf import settings as dj_settings
            require_paid = getattr(dj_settings, 'EARNINGS_REQUIRE_PAID', True)
        except Exception:
            require_paid = True
        if require_paid:
            completed_bookings = completed_bookings.filter(payment__status='completed')
        
        # Current period earnings
        current_earnings = completed_bookings.filter(
            updated_at__date__gte=start_date
        ).aggregate(
            total=Sum('total_amount'),
            count=Count('id')
        )
        
        # Previous period earnings for comparison
        previous_earnings = completed_bookings.filter(
            updated_at__date__gte=previous_start,
            updated_at__date__lt=start_date
        ).aggregate(
            total=Sum('total_amount'),
            count=Count('id')
        )
        
        # All-time earnings
        total_earnings = completed_bookings.aggregate(
            total=Sum('total_amount'),
            count=Count('id')
        )
        
        # Platform fee calculation (configurable)
        try:
            from django.conf import settings as dj_settings
            platform_fee_rate = float(getattr(dj_settings, 'PLATFORM_FEE_RATE', 0.10))
        except Exception:
            platform_fee_rate = 0.10
        current_gross = float(current_earnings['total'] or 0)
        current_platform_fee = current_gross * platform_fee_rate
        current_net = current_gross - current_platform_fee
        
        total_gross = float(total_earnings['total'] or 0)
        total_platform_fee = total_gross * platform_fee_rate
        total_net = total_gross - total_platform_fee
        
        # Calculate growth percentage
        previous_total = float(previous_earnings['total'] or 0)
        growth_percentage = 0
        if previous_total > 0:
            growth_percentage = ((current_gross - previous_total) / previous_total) * 100
        
        # Get earnings by service
        service_earnings = completed_bookings.values(
            'service__title', 'service__id'
        ).annotate(
            total_earnings=Sum('total_amount'),
            booking_count=Count('id')
        ).order_by('-total_earnings')[:10]
        
        service_earnings_data = []
        for item in service_earnings:
            gross_earnings = float(item['total_earnings'])
            net_earnings = gross_earnings * (1 - platform_fee_rate)
            service_earnings_data.append({
                'service_id': item['service__id'],
                'service_title': item['service__title'],
                'gross_earnings': gross_earnings,
                'net_earnings': round(net_earnings, 2),
                'booking_count': item['booking_count']
            })
        
        return Response({
            'period': period,
            'current_period': {
                'gross_earnings': current_gross,
                'platform_fee': round(current_platform_fee, 2),
                'net_earnings': round(current_net, 2),
                'booking_count': current_earnings['count'] or 0,
                'average_per_booking': round(
                    current_gross / (current_earnings['count'] or 1), 2
                ) if current_earnings['count'] > 0 else 0
            },
            'previous_period': {
                'gross_earnings': previous_total,
                'net_earnings': round(previous_total * (1 - platform_fee_rate), 2),
                'booking_count': previous_earnings['count'] or 0
            },
            'growth': {
                'percentage': round(growth_percentage, 2),
                'amount': round(current_gross - previous_total, 2)
            },
            'all_time': {
                'gross_earnings': total_gross,
                'platform_fee': round(total_platform_fee, 2),
                'net_earnings': round(total_net, 2),
                'booking_count': total_earnings['count'] or 0
            },
            'top_earning_services': service_earnings_data
        })
    
    @action(detail=False, methods=['get'])
    def earnings_history(self, request):
        """
        Get detailed earnings history with pagination
        
        GET /api/bookings/provider_earnings/earnings_history/
        
        Query params:
        - page: page number (default: 1)
        - page_size: items per page (default: 20)
        - date_from: filter from date (YYYY-MM-DD)
        - date_to: filter to date (YYYY-MM-DD)
        - service_id: filter by specific service
        """
        provider = self.get_provider()
        
        # Get query parameters
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        service_id = request.query_params.get('service_id')
        
        # Base queryset
        earnings_queryset = Booking.objects.filter(
            service__provider=provider,
            status='completed'
        ).select_related('service', 'customer').order_by('-updated_at')
        
        # Apply filters
        if date_from:
            try:
                from datetime import datetime
                date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
                earnings_queryset = earnings_queryset.filter(updated_at__date__gte=date_from_obj)
            except ValueError:
                pass
        
        if date_to:
            try:
                from datetime import datetime
                date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
                earnings_queryset = earnings_queryset.filter(updated_at__date__lte=date_to_obj)
            except ValueError:
                pass
        
        if service_id:
            try:
                service_id_int = int(service_id)
                earnings_queryset = earnings_queryset.filter(service_id=service_id_int)
            except ValueError:
                pass
        
        # Pagination
        total_count = earnings_queryset.count()
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        
        earnings_page = earnings_queryset[start_index:end_index]
        
        # Serialize earnings data
        platform_fee_rate = 0.10
        earnings_data = []
        
        for booking in earnings_page:
            gross_amount = float(booking.total_amount)
            platform_fee = gross_amount * platform_fee_rate
            net_amount = gross_amount - platform_fee
            
            earnings_data.append({
                'id': booking.id,
                'booking_date': booking.booking_date.isoformat() if booking.booking_date else None,
                'completed_date': booking.updated_at.isoformat(),
                'service': {
                    'id': booking.service.id,
                    'title': booking.service.title
                },
                'customer': {
                    'name': f"{booking.customer.first_name} {booking.customer.last_name}",
                    'email': booking.customer.email
                },
                'earnings': {
                    'gross_amount': gross_amount,
                    'platform_fee': round(platform_fee, 2),
                    'net_amount': round(net_amount, 2)
                },
                'payment_status': 'completed'  # Since booking is completed
            })
        
        return Response({
            'earnings': earnings_data,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_count': total_count,
                'total_pages': (total_count + page_size - 1) // page_size,
                'has_next': end_index < total_count,
                'has_previous': page > 1
            }
        })
    
    @action(detail=False, methods=['get'])
    def payout_summary(self, request):
        """
        Get payout summary and pending earnings
        
        GET /api/bookings/provider_earnings/payout_summary/
        """
        provider = self.get_provider()
        
        # Get all completed bookings
        completed_bookings = Booking.objects.filter(
            service__provider=provider,
            status='completed'
        )
        
        # Calculate total earnings (completed, respect paid-only)
        total_earnings = completed_bookings.aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        try:
            from django.conf import settings as dj_settings
            platform_fee_rate = float(getattr(dj_settings, 'PLATFORM_FEE_RATE', 0.10))
        except Exception:
            platform_fee_rate = 0.10
        total_gross = float(total_earnings)
        total_platform_fee = total_gross * platform_fee_rate
        total_net = total_gross - total_platform_fee
        
        # Get provider earnings records if they exist
        try:
            provider_earnings = ProviderEarnings.objects.filter(provider=provider)
            
            total_paid_out = provider_earnings.filter(
                payout_status='paid'
            ).aggregate(
                total=Sum('net_amount')
            )['total'] or 0
            
            pending_payout = provider_earnings.filter(
                payout_status='pending'
            ).aggregate(
                total=Sum('net_amount')
            )['total'] or 0
            
        except:
            # If ProviderEarnings model doesn't exist or has issues
            total_paid_out = 0
            pending_payout = total_net
        
        available_for_payout = total_net - float(total_paid_out)
        
        # Get recent payout history
        recent_payouts = []
        try:
            recent_earnings = ProviderEarnings.objects.filter(
                provider=provider,
                payout_status='completed'
            ).order_by('-payout_date')[:5]
            
            for earning in recent_earnings:
                recent_payouts.append({
                    'id': earning.id,
                    'amount': float(earning.net_amount),
                    'payout_date': earning.payout_date.isoformat() if earning.payout_date else None,
                    'payout_method': earning.payout_method,
                    'transaction_id': earning.transaction_id
                })
        except:
            pass
        
        return Response({
            'total_earnings': {
                'gross_amount': total_gross,
                'platform_fee': round(total_platform_fee, 2),
                'net_amount': round(total_net, 2)
            },
            'payout_summary': {
                'total_paid_out': float(total_paid_out),
                'pending_payout': float(pending_payout),
                'available_for_payout': round(available_for_payout, 2),
                'minimum_payout_amount': 100.00  # Configurable minimum
            },
            'recent_payouts': recent_payouts
        })

    @action(detail=False, methods=['get'], url_path='export')
    def export(self, request):
        """
        Export provider earnings analytics as CSV using calendar-accurate buckets.
        GET /api/bookings/provider_earnings/export/?format=csv&period=week|month|year
        """
        import csv
        from django.http import HttpResponse

        provider = self.get_provider()
        export_format = request.query_params.get('format', 'csv')
        period = request.query_params.get('period', 'month')
        now = timezone.now()

        # Build buckets
        if period == 'week':
            this_monday = now.date() - timedelta(days=now.date().weekday())
            buckets = []
            for i in range(8):
                start = this_monday - timedelta(weeks=(7 - i))
                end = start + timedelta(weeks=1)
                buckets.append((start, end))
        elif period == 'month':
            def month_start(d):
                return d.replace(day=1)
            def prev_month_start(d):
                return (d.replace(day=1) - timedelta(days=1)).replace(day=1)
            def next_month_start(d):
                return (d.replace(day=28) + timedelta(days=4)).replace(day=1)
            starts = []
            cur = month_start(now.date())
            for _ in range(12):
                starts.append(cur)
                cur = prev_month_start(cur)
            starts.reverse()
            buckets = [(ms, next_month_start(ms)) for ms in starts]
        else:  # year
            current_year_start = now.date().replace(month=1, day=1)
            starts = []
            for i in range(5):
                starts.append(current_year_start.replace(year=current_year_start.year - (4 - i)))
            buckets = []
            for ms in starts:
                buckets.append((ms, ms.replace(year=ms.year + 1)))

        completed_bookings = Booking.objects.filter(
            service__provider=provider,
            status='completed'
        )
        try:
            from django.conf import settings as dj_settings
            require_paid = getattr(dj_settings, 'EARNINGS_REQUIRE_PAID', True)
        except Exception:
            require_paid = True
        if require_paid:
            completed_bookings = completed_bookings.filter(payment__status='completed')

        rows = []
        total_earnings = 0.0
        total_bookings = 0
        for start, end in buckets:
            period_bookings = completed_bookings.filter(
                updated_at__date__gte=start,
                updated_at__date__lt=end
            )
            data = period_bookings.aggregate(total=Sum('total_amount'), count=Count('id'))
            amount = float(data['total'] or 0)
            count = int(data['count'] or 0)
            total_earnings += amount
            total_bookings += count
            rows.append({
                'period_start': start.strftime('%Y-%m-%d'),
                'period_end': (end - timedelta(days=1)).strftime('%Y-%m-%d'),
                'earnings': amount,
                'bookings_count': count
            })

        if export_format == 'pdf':
            # Build a simple PDF report
            from reportlab.lib.pagesizes import A4
            from reportlab.pdfgen import canvas
            from io import BytesIO

            buffer = BytesIO()
            c = canvas.Canvas(buffer, pagesize=A4)
            width, height = A4
            y = height - 40
            c.setFont("Helvetica-Bold", 14)
            c.drawString(40, y, f"Earnings Report ({period.title()})")
            y -= 20
            c.setFont("Helvetica", 10)
            c.drawString(40, y, f"Generated: {now.strftime('%Y-%m-%d %H:%M:%S')} | Provider: {provider.get_full_name()}")
            y -= 30

            # Table header
            c.setFont("Helvetica-Bold", 10)
            c.drawString(40, y, "Period Start")
            c.drawString(150, y, "Period End")
            c.drawString(280, y, "Earnings")
            c.drawString(360, y, "Bookings")
            y -= 15
            c.setFont("Helvetica", 10)

            for r in rows:
                if y < 60:
                    c.showPage()
                    y = height - 40
                    c.setFont("Helvetica-Bold", 10)
                    c.drawString(40, y, "Period Start")
                    c.drawString(150, y, "Period End")
                    c.drawString(280, y, "Earnings")
                    c.drawString(360, y, "Bookings")
                    y -= 15
                    c.setFont("Helvetica", 10)
                c.drawString(40, y, r['period_start'])
                c.drawString(150, y, r['period_end'])
                c.drawRightString(340, y, f"{r['earnings']:.2f}")
                c.drawRightString(420, y, str(r['bookings_count']))
                y -= 14

            # Summary
            y -= 10
            if y < 80:
                c.showPage()
                y = height - 40
            avg = (total_earnings / total_bookings) if total_bookings > 0 else 0
            c.setFont("Helvetica-Bold", 11)
            c.drawString(40, y, "Summary")
            y -= 16
            c.setFont("Helvetica", 10)
            c.drawString(40, y, f"Total Earnings: {total_earnings:.2f}")
            y -= 14
            c.drawString(40, y, f"Total Bookings: {total_bookings}")
            y -= 14
            c.drawString(40, y, f"Average per Booking: {avg:.2f}")
            c.showPage()
            c.save()

            pdf_bytes = buffer.getvalue()
            buffer.close()
            pdf_response = HttpResponse(pdf_bytes, content_type='application/pdf')
            pdf_response['Content-Disposition'] = f'attachment; filename="earnings_{period}_{now.strftime('%Y%m%d_%H%M%S')}.pdf"'
            return pdf_response
        else:
            # CSV default
            response = HttpResponse(content_type='text/csv')
            filename = f"earnings_{period}_{now.strftime('%Y%m%d_%H%M%S')}.csv"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            writer = csv.writer(response)
            writer.writerow(['Period Start', 'Period End', 'Earnings', 'Bookings Count'])
            for r in rows:
                writer.writerow([r['period_start'], r['period_end'], f"{r['earnings']:.2f}", r['bookings_count']])
            writer.writerow([])
            avg = (total_earnings / total_bookings) if total_bookings > 0 else 0
            writer.writerow(['TOTAL', '', f"{total_earnings:.2f}", total_bookings])
            writer.writerow(['AVERAGE PER BOOKING', '', f"{avg:.2f}", ''])
            return response
    
    @action(detail=False, methods=['post'])
    def request_payout(self, request):
        """
        Request a payout for available earnings
        
        POST /api/bookings/provider_earnings/request_payout/
        {
            "amount": 500.00,
            "payout_method": "bank_transfer|mobile_wallet",
            "account_details": {
                "account_number": "1234567890",
                "bank_name": "Example Bank"
            }
        }
        """
        provider = self.get_provider()
        
        amount = request.data.get('amount')
        payout_method = request.data.get('payout_method')
        account_details = request.data.get('account_details', {})
        
        if not amount or not payout_method:
            return Response(
                {'error': 'Amount and payout method are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount = float(amount)
            if amount <= 0:
                raise ValueError("Amount must be positive")
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid amount format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check minimum payout amount
        minimum_payout = 100.00
        if amount < minimum_payout:
            return Response(
                {'error': f'Minimum payout amount is NPR {minimum_payout}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate available earnings
        completed_bookings = Booking.objects.filter(
            service__provider=provider,
            status='completed'
        )
        
        total_earnings = completed_bookings.aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        platform_fee_rate = 0.10
        total_net = float(total_earnings) * (1 - platform_fee_rate)
        
        # Check if provider has enough available earnings
        try:
            total_paid_out = ProviderEarnings.objects.filter(
                provider=provider,
                payout_status__in=['completed', 'pending']
            ).aggregate(
                total=Sum('net_amount')
            )['total'] or 0
            
            available_amount = total_net - float(total_paid_out)
        except:
            available_amount = total_net
        
        if amount > available_amount:
            return Response(
                {'error': f'Insufficient available earnings. Available: NPR {available_amount:.2f}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create payout request
        try:
            payout_request = ProviderEarnings.objects.create(
                provider=provider,
                gross_amount=amount / (1 - platform_fee_rate),  # Calculate gross from net
                platform_fee=amount / (1 - platform_fee_rate) * platform_fee_rate,
                net_amount=amount,
                payout_method=payout_method,
                payout_status='pending',
                account_details=account_details,
                period_start=timezone.now().date().replace(day=1),
                period_end=timezone.now().date()
            )
            
            logger.info(f"Payout request created: {payout_request.id} for provider {provider.id}, amount: {amount}")
            
            return Response({
                'success': True,
                'message': 'Payout request submitted successfully',
                'payout_request': {
                    'id': payout_request.id,
                    'amount': float(payout_request.net_amount),
                    'payout_method': payout_request.payout_method,
                    'status': payout_request.payout_status,
                    'created_at': payout_request.created_at.isoformat()
                }
            })
            
        except Exception as e:
            logger.error(f"Error creating payout request for provider {provider.id}: {str(e)}")
            return Response(
                {'error': 'Failed to create payout request. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def financial_analytics(self, request):
        """
        Get comprehensive financial analytics
        
        GET /api/bookings/provider_earnings/financial_analytics/
        
        Query params:
        - period: week|month|quarter|year (default: month)
        - months_back: number of periods to include (default: 12)
        """
        provider = self.get_provider()
        period = request.query_params.get('period', 'month')
        months_back = int(request.query_params.get('months_back', 12))
        
        now = timezone.now()
        
        # Calculate date range based on period
        if period == 'week':
            start_date = now.date() - timedelta(days=now.date().weekday())
            delta = timedelta(weeks=1)
        elif period == 'quarter':
            start_date = now.date().replace(month=((now.month-1)//3)*3+1, day=1)
            delta = timedelta(days=90)
        elif period == 'year':
            start_date = now.date().replace(month=1, day=1)
            delta = timedelta(days=365)
        else:  # month
            start_date = now.date().replace(day=1)
            delta = timedelta(days=30)
        
        # Get completed bookings
        completed_bookings = Booking.objects.filter(
            service__provider=provider,
            status='completed'
        )
        
        # Calculate analytics data by period
        analytics_data = []
        platform_fee_rate = 0.10
        
        for i in range(months_back):
            period_start = start_date - (delta * i)
            period_end = start_date - (delta * (i - 1)) if i > 0 else now.date()
            
            period_bookings = completed_bookings.filter(
                updated_at__date__gte=period_start,
                updated_at__date__lt=period_end
            )
            
            period_earnings = period_bookings.aggregate(
                total=Sum('total_amount'),
                count=Count('id')
            )
            
            gross_earnings = float(period_earnings['total'] or 0)
            platform_fee = gross_earnings * platform_fee_rate
            net_earnings = gross_earnings - platform_fee
            
            analytics_data.append({
                'period': period_start.strftime('%Y-%m-%d'),
                'gross_earnings': gross_earnings,
                'platform_fee': round(platform_fee, 2),
                'net_earnings': round(net_earnings, 2),
                'booking_count': period_earnings['count'] or 0,
                'average_per_booking': round(
                    gross_earnings / (period_earnings['count'] or 1), 2
                ) if period_earnings['count'] > 0 else 0
            })
        
        # Reverse to show oldest to newest
        analytics_data.reverse()
        
        # Calculate trends
        if len(analytics_data) >= 2:
            current_earnings = analytics_data[-1]['net_earnings']
            previous_earnings = analytics_data[-2]['net_earnings']
            earnings_trend = ((current_earnings - previous_earnings) / (previous_earnings or 1)) * 100
        else:
            earnings_trend = 0
        
        return Response({
            'period': period,
            'analytics_data': analytics_data,
            'trends': {
                'earnings_growth': round(earnings_trend, 2),
                'total_periods': len(analytics_data)
            }
        })