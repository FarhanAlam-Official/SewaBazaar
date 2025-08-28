"""
PHASE 1 NEW FILE: Payment services for Khalti integration

Purpose: Handle Khalti payment processing and verification
Impact: New service layer - adds payment functionality without affecting existing code
"""

import requests
import logging
from django.conf import settings
from django.utils import timezone
from .models import Payment, PaymentMethod, Booking
from decimal import Decimal

logger = logging.getLogger(__name__)


class KhaltiPaymentService:
    """
    Service class for handling Khalti payment integration
    
    Purpose: Centralize Khalti payment processing logic
    Impact: New service - adds secure payment processing capability
    """
    
    def __init__(self):
        """
        Initialize Khalti service with sandbox credentials
        
        For production, these should be moved to environment variables
        """
        self.secret_key = getattr(settings, 'KHALTI_SECRET_KEY', 'test_secret_key_f59e8b7d18b4499ca40f68195a846e9b')
        self.public_key = getattr(settings, 'KHALTI_PUBLIC_KEY', 'test_public_key_dc74e0fd57cb46cd93832aee0a507256')
        self.base_url = getattr(settings, 'KHALTI_BASE_URL', 'https://khalti.com/api/v2')
        self.verify_url = f"{self.base_url}/epayment/verify/"
        
    def verify_payment(self, token, amount):
        """
        Verify payment with Khalti API
        
        Args:
            token (str): Khalti payment token
            amount (int): Payment amount in paisa
            
        Returns:
            dict: Khalti API response
            
        Purpose: Verify payment authenticity with Khalti servers
        Expected: Returns payment verification details or error
        """
        headers = {
            'Authorization': f'Key {self.secret_key}',
            'Content-Type': 'application/json',
        }
        
        payload = {
            'token': token,
            'amount': amount
        }
        
        try:
            logger.info(f"Verifying Khalti payment - Token: {token[:10]}..., Amount: {amount}")
            
            response = requests.post(
                self.verify_url,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            response_data = response.json()
            
            if response.status_code == 200:
                logger.info(f"Khalti payment verification successful - Transaction ID: {response_data.get('idx')}")
                return {
                    'success': True,
                    'data': response_data
                }
            else:
                logger.error(f"Khalti payment verification failed - Status: {response.status_code}, Response: {response_data}")
                return {
                    'success': False,
                    'error': response_data.get('detail', 'Payment verification failed'),
                    'status_code': response.status_code
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Khalti API request failed: {str(e)}")
            return {
                'success': False,
                'error': 'Payment verification service unavailable',
                'exception': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error during Khalti verification: {str(e)}")
            return {
                'success': False,
                'error': 'Payment verification failed',
                'exception': str(e)
            }
    
    def process_booking_payment(self, booking_id, token, amount, user):
        """
        Process payment for a booking
        
        Args:
            booking_id (int): Booking ID
            token (str): Khalti payment token
            amount (int): Payment amount in paisa
            user: Current user making the payment
            
        Returns:
            dict: Payment processing result
            
        Purpose: Complete payment flow for booking
        Expected: Creates payment record and updates booking status
        """
        try:
            # Get booking and validate ownership
            booking = Booking.objects.get(id=booking_id, customer=user)
            
            # Check if payment already exists
            if hasattr(booking, 'payment'):
                return {
                    'success': False,
                    'error': 'Payment already exists for this booking'
                }
            
            # Convert amount from paisa to NPR
            amount_npr = Decimal(amount) / 100
            
            # Validate amount matches booking total
            if abs(amount_npr - booking.total_amount) > Decimal('0.01'):  # Allow 1 paisa difference for rounding
                return {
                    'success': False,
                    'error': f'Payment amount mismatch. Expected: {booking.total_amount}, Received: {amount_npr}'
                }
            
            # Get Khalti payment method
            khalti_method, created = PaymentMethod.objects.get_or_create(
                name='Khalti',
                defaults={
                    'payment_type': 'digital_wallet',
                    'is_active': True,
                    'processing_fee_percentage': Decimal('0.00'),
                    'icon': 'khalti-icon',
                    'gateway_config': {
                        'public_key': self.public_key,
                        'gateway': 'khalti'
                    }
                }
            )
            
            # Create payment record
            payment = Payment.objects.create(
                booking=booking,
                payment_method=khalti_method,
                amount=booking.total_amount,
                processing_fee=Decimal('0.00'),
                total_amount=booking.total_amount,
                khalti_token=token,
                status='processing'
            )
            
            # Verify payment with Khalti
            verification_result = self.verify_payment(token, amount)
            
            if verification_result['success']:
                # Payment verified successfully
                khalti_data = verification_result['data']
                
                payment.khalti_transaction_id = khalti_data.get('idx')
                payment.khalti_response = khalti_data
                payment.status = 'completed'
                payment.paid_at = timezone.now()
                payment.save()
                
                # Update booking status
                booking.status = 'confirmed'
                booking.booking_step = 'completed'
                booking.save()
                
                logger.info(f"Payment completed successfully - Booking: {booking_id}, Payment: {payment.transaction_id}")
                
                return {
                    'success': True,
                    'payment_id': payment.payment_id,
                    'transaction_id': payment.transaction_id,
                    'khalti_transaction_id': payment.khalti_transaction_id,
                    'booking_status': booking.status,
                    'message': 'Payment completed successfully'
                }
            else:
                # Payment verification failed
                payment.status = 'failed'
                payment.khalti_response = verification_result
                payment.save()
                
                logger.error(f"Payment verification failed - Booking: {booking_id}, Error: {verification_result.get('error')}")
                
                return {
                    'success': False,
                    'error': verification_result.get('error', 'Payment verification failed'),
                    'payment_id': payment.payment_id
                }
                
        except Booking.DoesNotExist:
            return {
                'success': False,
                'error': 'Booking not found or access denied'
            }
        except Exception as e:
            logger.error(f"Payment processing failed - Booking: {booking_id}, Error: {str(e)}")
            return {
                'success': False,
                'error': 'Payment processing failed',
                'exception': str(e)
            }


class BookingSlotService:
    """
    PHASE 1 NEW SERVICE: Service class for managing booking slots
    
    Purpose: Handle booking slot availability and management
    Impact: New service - enhances booking system with time slot management
    """
    
    @staticmethod
    def get_available_slots(service, date, duration_hours=1):
        """
        Get available time slots for a service on a specific date
        
        Args:
            service: Service instance
            date: Date for availability check
            duration_hours: Duration of service in hours
            
        Returns:
            QuerySet: Available booking slots
            
        Purpose: Provide available time slots for booking
        Expected: Returns slots that are not fully booked
        """
        from .models import BookingSlot
        from django.db.models import F
        
        # Get existing slots that are not fully booked
        available_slots = BookingSlot.objects.filter(
            service=service,
            date=date,
            is_available=True
        ).exclude(
            current_bookings__gte=F('max_bookings')
        ).order_by('start_time')
        
        return available_slots
    
    @staticmethod
    def create_default_slots(service, date, start_hour=9, end_hour=17, slot_duration=1):
        """
        Create default time slots for a service on a specific date
        
        Args:
            service: Service instance
            date: Date to create slots for
            start_hour: Starting hour (24-hour format)
            end_hour: Ending hour (24-hour format)
            slot_duration: Duration of each slot in hours
            
        Returns:
            list: Created booking slots
            
        Purpose: Generate default time slots for services
        Expected: Creates hourly slots during business hours
        """
        from .models import BookingSlot
        from datetime import time
        
        created_slots = []
        
        for hour in range(start_hour, end_hour, slot_duration):
            start_time = time(hour, 0)
            end_time = time(hour + slot_duration, 0)
            
            slot, created = BookingSlot.objects.get_or_create(
                service=service,
                date=date,
                start_time=start_time,
                end_time=end_time,
                defaults={
                    'is_available': True,
                    'max_bookings': 1,
                    'current_bookings': 0
                }
            )
            
            if created:
                created_slots.append(slot)
        
        return created_slots
    
    @staticmethod
    def book_slot(slot, booking):
        """
        Book a time slot for a booking
        
        Args:
            slot: BookingSlot instance
            booking: Booking instance
            
        Returns:
            bool: Success status
            
        Purpose: Reserve a time slot for a booking
        Expected: Updates slot availability and associates with booking
        """
        if slot.is_fully_booked:
            return False
        
        # Update booking with slot
        booking.booking_slot = slot
        booking.save()
        
        # Update slot booking count
        slot.current_bookings += 1
        slot.save()
        
        return True


class BookingWizardService:
    """
    PHASE 1 NEW SERVICE: Service class for managing booking wizard flow
    
    Purpose: Handle multi-step booking process
    Impact: New service - enhances booking creation with step-by-step validation
    """
    
    @staticmethod
    def create_booking_step(user, step_data):
        """
        Create or update booking at a specific step
        
        Args:
            user: Current user
            step_data: Data for current step
            
        Returns:
            dict: Step processing result
            
        Purpose: Handle step-by-step booking creation
        Expected: Creates/updates booking with step validation
        """
        from .serializers import BookingWizardSerializer
        
        booking_step = step_data.get('booking_step', 'service_selection')
        booking_id = step_data.get('booking_id')
        
        try:
            if booking_id:
                # Update existing booking
                booking = Booking.objects.get(id=booking_id, customer=user)
                serializer = BookingWizardSerializer(booking, data=step_data, partial=True)
            else:
                # Create new booking
                step_data['customer'] = user.id
                step_data['booking_step'] = booking_step
                serializer = BookingWizardSerializer(data=step_data)
            
            if serializer.is_valid():
                booking = serializer.save()
                
                return {
                    'success': True,
                    'booking_id': booking.id,
                    'current_step': booking.booking_step,
                    'data': serializer.data
                }
            else:
                return {
                    'success': False,
                    'errors': serializer.errors
                }
                
        except Booking.DoesNotExist:
            return {
                'success': False,
                'error': 'Booking not found or access denied'
            }
        except Exception as e:
            logger.error(f"Booking wizard step failed: {str(e)}")
            return {
                'success': False,
                'error': 'Step processing failed',
                'exception': str(e)
            }
    
    @staticmethod
    def calculate_booking_price(service, date=None, time=None, add_ons=None):
        """
        Calculate dynamic pricing for booking
        
        Args:
            service: Service instance
            date: Booking date
            time: Booking time
            add_ons: Additional services
            
        Returns:
            dict: Price calculation result
            
        Purpose: Provide dynamic pricing based on various factors
        Expected: Returns calculated price with breakdown
        """
        base_price = service.discount_price if service.discount_price else service.price
        total_price = base_price
        price_breakdown = {
            'base_price': float(base_price),
            'add_ons': 0,
            'discounts': 0,
            'total': float(total_price)
        }
        
        # Add future pricing logic here (peak hours, seasonal pricing, etc.)
        
        return {
            'success': True,
            'price_breakdown': price_breakdown,
            'total_amount': float(total_price)
        }