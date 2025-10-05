"""
BOOKING SERVICES MODULE

This module contains service classes that encapsulate business logic for the bookings app.
Services handle complex operations that span multiple models and provide a clean interface
for views and other parts of the application.

Key services include:
- TimeSlotService: Manages time slot generation and availability logic
- KhaltiPaymentService: Handles Khalti payment integration using e-Payment API v2
- BookingSlotService: Provides booking slot management functionality
- BookingWizardService: Manages the multi-step booking creation process

The service layer promotes separation of concerns, testability, and reusability of business logic.
"""

import requests
import logging
from django.conf import settings
from django.utils import timezone
from django.db import models
from .models import Payment, PaymentMethod, Booking
from decimal import Decimal
from datetime import datetime, timedelta, time

logger = logging.getLogger(__name__)


class TimeSlotService:
    """
    Service class for managing time slots and availability logic.
    
    This service handles the complex logic of generating, categorizing, and managing
    booking time slots based on provider availability, service requirements, and
    business rules for different time categories (normal, express, urgent, emergency).
    
    The service bridges provider availability settings, service-specific requirements,
    and customer booking needs to create an intelligent scheduling system.
    """
    
    @staticmethod
    def get_available_slots(service, date, exclude_booked=True):
        """
        Get available booking slots for a service on a specific date.
        
        This method retrieves all available booking slots for a given service and date,
        with optional filtering to exclude fully booked slots and automatically filtering
        out past time slots for the current date.
        
        Args:
            service (Service): Service instance to get slots for
            date (date): Date to check availability for
            exclude_booked (bool): Whether to exclude fully booked slots (default: True)
            
        Returns:
            QuerySet: Available booking slots filtered by date and availability
            
        Example:
            >>> slots = TimeSlotService.get_available_slots(service, date(2024, 2, 1))
            >>> for slot in slots:
            ...     print(f"{slot.start_time} - {slot.end_time}")
        """
        from .models import BookingSlot
        from django.utils import timezone
        
        # Get all available slots for the date
        available_slots = BookingSlot.objects.filter(
            service=service,
            date=date,
            is_available=True
        )
        
        # Exclude booked slots if requested
        if exclude_booked:
            available_slots = available_slots.filter(
                current_bookings__lt=models.F('max_bookings')
            )
        
        # For today's date, filter out past time slots
        today = timezone.now().date()
        if date == today:
            # Get current time
            current_time = timezone.now().time()
            # Filter out slots that end before current time
            available_slots = available_slots.filter(end_time__gt=current_time)
        
        return available_slots
    
    @staticmethod
    def generate_slots_from_availability(provider, service, start_date, end_date):
        """
        Generate booking slots based on provider availability and service requirements.
        
        This method creates booking slots for a date range by analyzing provider availability
        settings and service-specific time slot configurations. It handles both general
        provider availability and service-specific scheduling requirements.
        
        Args:
            provider (User): Provider user instance
            service (Service): Service instance
            start_date (date): Start date for slot generation
            end_date (date): End date for slot generation
            
        Returns:
            list: Created booking slots
            
        Example:
            >>> slots = TimeSlotService.generate_slots_from_availability(
            ...     provider, service, date(2024, 2, 1), date(2024, 2, 7))
            >>> print(f"Generated {len(slots)} slots")
        """
        from .models import ProviderAvailability, ServiceTimeSlot, BookingSlot
        
        created_slots = []
        current_date = start_date
        
        while current_date <= end_date:
            weekday = current_date.weekday()
            
            # Check provider availability for this weekday
            provider_availability = ProviderAvailability.objects.filter(
                provider=provider,
                weekday=weekday,
                is_available=True
            )
            
            # Check service-specific time slots
            service_slots = ServiceTimeSlot.objects.filter(
                service=service,
                day_of_week=weekday,
                is_active=True
            )
            
            if service_slots.exists():
                # Use service-specific slots
                for service_slot in service_slots:
                    slot = TimeSlotService._create_booking_slot(
                        service=service,
                        provider=provider,
                        date=current_date,
                        start_time=service_slot.start_time,
                        end_time=service_slot.end_time,
                        slot_data={
                            'is_peak_time': service_slot.is_peak_time,
                            'max_bookings': service_slot.max_bookings_per_slot,
                            'base_price_override': service_slot.calculated_price if service_slot.is_peak_time else None
                        }
                    )
                    if slot:
                        created_slots.append(slot)
                        
            elif provider_availability.exists():
                # Use provider general availability
                for availability in provider_availability:
                    # Generate hourly slots within availability window
                    current_time = availability.start_time
                    end_time = availability.end_time
                    
                    while current_time < end_time:
                        # Calculate slot end time (default 1 hour)
                        next_hour = datetime.combine(current_date, current_time) + timedelta(hours=1)
                        slot_end_time = min(next_hour.time(), end_time)
                        
                        # Skip if during break time
                        if availability.break_start and availability.break_end:
                            if availability.break_start <= current_time < availability.break_end:
                                current_time = availability.break_end
                                continue
                        
                        # NEW: Skip past slots for today
                        today = timezone.now().date()
                        current_time_obj = timezone.now().time()
                        if current_date == today and slot_end_time <= current_time_obj:
                            # Skip past slots for today
                            current_time = (datetime.combine(current_date, current_time) + timedelta(hours=1)).time()
                            continue
                        
                        slot = TimeSlotService._create_booking_slot(
                            service=service,
                            provider=provider,
                            date=current_date,
                            start_time=current_time,
                            end_time=slot_end_time,
                            slot_data={'created_from_availability': True}
                        )
                        if slot:
                            created_slots.append(slot)
                        
                        # Move to next hour
                        current_time = (datetime.combine(current_date, current_time) + timedelta(hours=1)).time()
            
            current_date += timedelta(days=1)
        
        return created_slots
    
    @staticmethod
    def _create_booking_slot(service, provider, date, start_time, end_time, slot_data=None):
        """
        Create a booking slot with intelligent defaults based on the improved Express Service plan.
        
        This internal method creates individual booking slots with appropriate categorization,
        pricing, and metadata based on business rules and time-based categorization.
        
        Args:
            service (Service): Service instance
            provider (User): Provider user instance
            date (date): Slot date
            start_time (time): Slot start time
            end_time (time): Slot end time
            slot_data (dict): Additional slot configuration data (optional)
            
        Returns:
            BookingSlot: Created or existing booking slot, or None if creation failed
        """
        from .models import BookingSlot
        from django.utils import timezone
        
        slot_data = slot_data or {}
        
        # Determine slot category based on improved plan
        slot_info = TimeSlotService._categorize_slot_improved(date, start_time)
        slot_category = slot_info['category']
        is_rush = slot_category != 'normal'
        
        # Calculate rush fee percentage based on category
        rush_percentage = TimeSlotService._calculate_rush_percentage_by_category(slot_category)
        
        try:
            slot, created = BookingSlot.objects.get_or_create(
                service=service,
                provider=provider,
                date=date,
                start_time=start_time,
                defaults={
                    'end_time': end_time,
                    'is_available': True,
                    'max_bookings': slot_data.get('max_bookings', 1),
                    'current_bookings': 0,
                    'is_rush': is_rush,
                    'rush_fee_percentage': rush_percentage,
                    'slot_type': slot_category,
                    'base_price_override': slot_data.get('base_price_override'),
                    'created_from_availability': slot_data.get('created_from_availability', True),
                    'provider_note': TimeSlotService._generate_slot_note_by_category(slot_category, start_time)
                }
            )
            return slot if created else None
        except Exception as e:
            print(f"Error creating slot: {e}")
            return None
    
    @staticmethod
    def _categorize_slot_improved(date, start_time):
        """
        Categorize a slot based on the improved plan.
        
        This method determines the appropriate slot category (normal, express, urgent, emergency)
        based on the day of week and time, following the improved Express Service plan.
        
        Args:
            date (date): Slot date
            start_time (time): Slot start time
            
        Returns:
            dict: Dictionary with 'category' and 'is_express_only' keys
        """
        hour = start_time.hour
        weekday = date.weekday()  # 0=Monday, 6=Sunday
        
        # Sunday special handling
        if weekday == 6:  # Sunday
            if (6 <= hour < 9) or (18 <= hour < 22):
                return {'category': 'emergency', 'is_express_only': False}  # Emergency times
            elif 9 <= hour < 18:
                return {'category': 'express', 'is_express_only': False}  # Express slots
            elif (hour >= 22) or (hour < 6):
                return {'category': 'emergency', 'is_express_only': False}  # Night hours - Emergency
            else:
                return {'category': 'normal', 'is_express_only': False}
        
        # Weekdays (Mon-Fri)
        elif weekday < 5:
            if 9 <= hour < 18:
                return {'category': 'normal', 'is_express_only': False}  # Normal business hours
            elif (7 <= hour < 9) or (18 <= hour < 21):
                return {'category': 'express', 'is_express_only': False}  # Express slots
            elif 21 <= hour < 23:
                return {'category': 'urgent', 'is_express_only': False}  # Urgent slots
            elif (hour >= 23) or (hour < 7):
                return {'category': 'emergency', 'is_express_only': False}  # Emergency slots
            else:
                return {'category': 'normal', 'is_express_only': False}
        
        # Saturday
        else:  # Saturday (weekday == 5)
            if 9 <= hour < 18:
                return {'category': 'normal', 'is_express_only': False}  # Normal business hours
            elif 18 <= hour < 21:
                return {'category': 'express', 'is_express_only': False}  # Express slots
            elif 21 <= hour < 22:
                return {'category': 'urgent', 'is_express_only': False}  # Urgent slots
            elif (hour >= 22) or (hour < 9):
                return {'category': 'emergency', 'is_express_only': False}  # Emergency slots
            else:
                return {'category': 'normal', 'is_express_only': False}
    
    @staticmethod
    def _calculate_rush_percentage_by_category(category):
        """
        Calculate rush fee percentage based on slot category.
        
        Returns the appropriate rush fee percentage for different slot categories
        according to the Express Service pricing model.
        
        Args:
            category (str): Slot category (normal, express, urgent, emergency)
            
        Returns:
            float: Rush fee percentage
        """
        fee_map = {
            'normal': 0.0,
            'express': 50.0,
            'urgent': 75.0,
            'emergency': 100.0
        }
        return fee_map.get(category, 0.0)
    
    @staticmethod
    def _generate_slot_note_by_category(category, start_time):
        """
        Generate helpful notes for time slots based on category.
        
        Creates descriptive notes for booking slots to help users understand
        the service level and pricing implications of different time categories.
        
        Args:
            category (str): Slot category
            start_time (time): Slot start time
            
        Returns:
            str: Descriptive note for the slot
        """
        notes = {
            'normal': "Standard service hours",
            'express': "Express service - Priority scheduling (+50% fee)",
            'urgent': "Urgent service - High priority (+75% fee)",
            'emergency': "Emergency service - Immediate response (+100% fee)"
        }
        return notes.get(category, "Service slot")


class KhaltiPaymentService:
    """
    Service class for handling Khalti payment integration.
    
    This service centralizes all Khalti payment processing logic using the new
    e-Payment API v2, providing a clean interface for payment initiation,
    verification, and callback processing with voucher support.
    
    The service handles payment flow from initiation through completion,
    including tax calculations, voucher processing, and booking status updates.
    """
    
    def __init__(self):
        """
        Initialize Khalti service with correct API endpoints.
        
        Sets up the Khalti payment service with API credentials and endpoints
        from Django settings, using the new e-Payment API v2 endpoints as per
        latest documentation.
        """
        self.secret_key = getattr(settings, 'KHALTI_SECRET_KEY', '2d71118e5d26404fb3b1fe1fd386d33a')
        self.public_key = getattr(settings, 'KHALTI_PUBLIC_KEY', '8b58c9047e584751beaddea7cc632b2c')
        # Use correct sandbox URL for development
        self.base_url = getattr(settings, 'KHALTI_BASE_URL', 'https://dev.khalti.com/api/v2')
        self.initiate_url = f"{self.base_url}/epayment/initiate/"
        self.lookup_url = f"{self.base_url}/epayment/lookup/"
        
    def initiate_payment(self, booking, return_url, website_url, applied_voucher=None):
        """
        Initiate payment with Khalti e-Payment API v2.
        
        Starts a new payment flow using Khalti's e-Payment API v2, including
        support for voucher discounts and tax calculations. Returns a payment
        URL for redirecting the customer to complete their payment.
        
        Args:
            booking (Booking): Booking instance to process payment for
            return_url (str): URL to redirect customer after payment
            website_url (str): Website base URL
            applied_voucher (RewardVoucher): Optional voucher to apply discount
            
        Returns:
            dict: Khalti API response with payment URL and status information
            
        Example:
            >>> result = khalti_service.initiate_payment(booking, return_url, website_url)
            >>> if result['success']:
            ...     redirect_url = result['data']['payment_url']
        """
        headers = {
            'Authorization': f'Key {self.secret_key}',
            'Content-Type': 'application/json',
        }
        
        # Ensure return_url doesn't have trailing slash which can cause issues with Khalti
        if return_url.endswith('/'):
            return_url = return_url.rstrip('/')
            
        # Calculate final amount considering vouchers
        final_amount = booking.total_amount
        voucher_discount = 0
        
        if applied_voucher:
            # Validate voucher can be used for this booking amount
            can_use, reason = applied_voucher.can_use_for_booking(final_amount)
            if can_use:
                voucher_discount = min(applied_voucher.value, final_amount)
                final_amount = final_amount - voucher_discount
            else:
                logger.warning(f"Cannot use voucher {applied_voucher.voucher_code}: {reason}")
        
        # Add tax calculation (13% VAT) to match frontend calculation
        from decimal import Decimal
        import math
        # Use standard rounding to match frontend Math.round() behavior (not banker's rounding)
        tax_amount = math.floor(float(final_amount) * 0.13 + 0.5)  # Equivalent to Math.round()
        final_amount_with_tax = final_amount + tax_amount
        
        # Convert amount to paisa (multiply by 100)
        amount_paisa = int(final_amount_with_tax * 100)
        
        # Ensure customer has required information
        customer_name = booking.customer.get_full_name() or booking.customer.username or 'Customer'
        customer_email = booking.customer.email or 'customer@sewabazaar.com'
        customer_phone = getattr(booking.customer, 'phone', None) or getattr(booking, 'customer_phone', None) or '9800000000'
        
        # Clean phone number (remove any non-numeric characters)
        import re
        customer_phone = re.sub(r'[^0-9]', '', str(customer_phone))
        if len(customer_phone) < 10:
            customer_phone = '9800000000'  # Default fallback
        
        payload = {
            'return_url': return_url,
            'website_url': website_url,
            'amount': amount_paisa,
            'purchase_order_id': f'booking_{booking.id}_{int(timezone.now().timestamp())}',
            'purchase_order_name': booking.service.title[:100],  # Ensure it's not too long
            'customer_info': {
                'name': customer_name[:100],  # Limit length
                'email': customer_email,
                'phone': customer_phone
            },
            'amount_breakdown': [
                {
                    'label': booking.service.title[:50],  # Limit length
                    'amount': amount_paisa
                }
            ],
            'product_details': [
                {
                    'identity': str(booking.service.id),
                    'name': booking.service.title[:100],  # Limit length
                    'total_price': amount_paisa,
                    'quantity': 1,
                    'unit_price': amount_paisa
                }
            ]
        }
        
        try:
            logger.info(f"Initiating Khalti payment - Booking: {booking.id}, Amount: {amount_paisa}")
            logger.info(f"Khalti request payload: {payload}")
            logger.info(f"Khalti request URL: {self.initiate_url}")
            
            response = requests.post(
                self.initiate_url,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            logger.info(f"Khalti response status: {response.status_code}")
            logger.info(f"Khalti response headers: {dict(response.headers)}")
            
            try:
                response_data = response.json()
                logger.info(f"Khalti response data: {response_data}")
            except ValueError as json_error:
                logger.error(f"Failed to parse Khalti response as JSON: {json_error}")
                logger.error(f"Raw response content: {response.text}")
                return {
                    'success': False,
                    'error': f'Invalid response from Khalti API: {response.text[:200]}',
                    'status_code': response.status_code
                }
            
            if response.status_code == 200:
                logger.info(f"Khalti payment initiated successfully - pidx: {response_data.get('pidx')}")
                return {
                    'success': True,
                    'data': response_data
                }
            else:
                logger.error(f"Khalti payment initiation failed - Status: {response.status_code}, Response: {response_data}")
                return {
                    'success': False,
                    'error': response_data.get('detail', response_data.get('message', 'Payment initiation failed')),
                    'status_code': response.status_code,
                    'full_response': response_data
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Khalti API request failed: {str(e)}")
            return {
                'success': False,
                'error': 'Payment service unavailable',
                'exception': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error during Khalti initiation: {str(e)}")
            return {
                'success': False,
                'error': 'Payment initiation failed',
                'exception': str(e)
            }
    
    def lookup_payment(self, pidx):
        """
        Lookup payment status with Khalti e-Payment API v2.
        
        Verifies the status of a payment using Khalti's lookup API with the
        payment identifier (pidx) returned during initiation.
        
        Args:
            pidx (str): Payment identifier from initiation
            
        Returns:
            dict: Khalti API response with payment status and verification details
            
        Example:
            >>> result = khalti_service.lookup_payment('bZB7K5D6QrqbALbKHaYtDL')
            >>> if result['success'] and result['data']['status'] == 'Completed':
            ...     # Process successful payment
        """
        headers = {
            'Authorization': f'Key {self.secret_key}',
            'Content-Type': 'application/json',
        }
        
        payload = {
            'pidx': pidx
        }
        
        try:
            logger.info(f"Looking up Khalti payment - pidx: {pidx}")
            
            response = requests.post(
                self.lookup_url,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            response_data = response.json()
            
            if response.status_code == 200:
                logger.info(f"Khalti payment lookup successful - Transaction ID: {response_data.get('transaction_id')}")
                return {
                    'success': True,
                    'data': response_data
                }
            else:
                logger.error(f"Khalti payment lookup failed - Status: {response.status_code}, Response: {response_data}")
                return {
                    'success': False,
                    'error': response_data.get('detail', 'Payment lookup failed'),
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
            logger.error(f"Unexpected error during Khalti lookup: {str(e)}")
            return {
                'success': False,
                'error': 'Payment verification failed',
                'exception': str(e)
            }
    
    def process_booking_payment_with_callback(self, booking_id, pidx, transaction_id, purchase_order_id, user, voucher_code=None):
        """
        Process payment callback from Khalti e-Payment API v2.
        
        Handles the payment callback from Khalti after customer payment completion,
        verifying the payment with Khalti's lookup API and creating payment records.
        Supports voucher application and proper booking status updates.
        
        Args:
            booking_id (int): Booking ID
            pidx (str): Payment identifier from Khalti
            transaction_id (str): Transaction ID from callback
            purchase_order_id (str): Purchase order ID from callback
            user (User): Current user making the payment
            voucher_code (str): Optional voucher code to apply
            
        Returns:
            dict: Payment processing result with status and booking information
            
        Example:
            >>> result = khalti_service.process_booking_payment_with_callback(
            ...     123, 'pidx123', 'txn456', 'po789', user, 'VOUCHER123')
            >>> if result['success']:
            ...     print(f"Payment completed for booking {result['booking_status']}")
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
            
            # Lookup payment status with Khalti
            lookup_result = self.lookup_payment(pidx)
            
            if not lookup_result['success']:
                return {
                    'success': False,
                    'error': lookup_result.get('error', 'Payment verification failed')
                }
            
            khalti_data = lookup_result['data']
            
            # Validate payment data
            if khalti_data.get('status') != 'Completed':
                return {
                    'success': False,
                    'error': f"Payment not completed. Status: {khalti_data.get('status')}"
                }
            
            # Convert amount from paisa to NPR and validate
            amount_paisa = khalti_data.get('total_amount', 0)
            amount_npr = Decimal(amount_paisa) / 100
            
            # Handle voucher validation if provided
            applied_voucher = None
            original_amount = booking.total_amount
            expected_amount = original_amount
            voucher_discount = Decimal('0.00')
            
            if voucher_code:
                try:
                    from apps.rewards.models import RewardVoucher
                    applied_voucher = RewardVoucher.objects.get(
                        voucher_code=voucher_code,
                        user=user,
                        status='active'
                    )
                    # Calculate expected discount
                    voucher_discount = min(applied_voucher.value, original_amount)
                    expected_amount = original_amount - voucher_discount
                except Exception as e:
                    logger.error(f"Error processing voucher {voucher_code}: {str(e)}")
                    # Continue without voucher if there's an error
            
            # Add tax calculation to match payment flow (13% VAT)
            import math
            # Use standard rounding to match frontend Math.round() behavior (not banker's rounding)
            tax_amount = math.floor(float(expected_amount) * 0.13 + 0.5)  # Equivalent to Math.round()
            expected_amount_with_tax = expected_amount + tax_amount
            
            # Validate payment amount against expected amount with tax
            if abs(amount_npr - expected_amount_with_tax) > Decimal('0.01'):  # Allow 1 paisa difference for rounding
                return {
                    'success': False,
                    'error': f'Payment amount mismatch. Expected: ₹{expected_amount_with_tax} (₹{expected_amount} + ₹{tax_amount} tax), Received: ₹{amount_npr}'
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
            
            # Create payment record with voucher support
            payment = Payment.objects.create(
                booking=booking,
                payment_method=khalti_method,
                original_amount=original_amount + round(original_amount * Decimal('0.13'), 2),  # Original amount with tax
                amount=expected_amount_with_tax,  # Final amount with tax
                voucher_discount=voucher_discount,
                processing_fee=Decimal('0.00'),
                total_amount=expected_amount_with_tax,  # Total with tax
                applied_voucher=applied_voucher,
                khalti_token=pidx,
                khalti_transaction_id=transaction_id,
                khalti_response=khalti_data,
                status='completed',
                paid_at=timezone.now()
            )
            
            # Mark voucher as used if applied
            if applied_voucher and voucher_discount > 0:
                try:
                    applied_voucher.use_voucher(amount=voucher_discount, booking=booking)
                    logger.info(f"Voucher {voucher_code} marked as used with amount ₹{voucher_discount}")
                except Exception as e:
                    logger.error(f"Error marking voucher as used: {str(e)}")
            
            # Update booking status - FIXED: Use correct status flow
            booking.status = 'confirmed'  # Payment completed, service scheduled
            booking.booking_step = 'payment_completed'  # FIXED: Correct step for payment completion
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
    
    # Legacy method for backward compatibility
    def process_booking_payment(self, booking_id, token, amount, user):
        """
        Legacy method for old Khalti integration - deprecated.
        
        This method is deprecated and should not be used. Use 
        process_booking_payment_with_callback for new e-Payment API integration.
        
        Args:
            booking_id (int): Booking ID
            token (str): Khalti token
            amount (Decimal): Payment amount
            user (User): Current user
            
        Returns:
            dict: Error response indicating deprecation
        """
        logger.warning("Using deprecated process_booking_payment method. Please use process_booking_payment_with_callback")
        return {
            'success': False,
            'error': 'This payment method is deprecated. Please use the new payment flow.'
        }


class BookingSlotService:
    """
    Service class for managing booking slots.
    
    This service handles booking slot availability, creation, and reservation operations.
    It provides a higher-level interface for working with booking slots that builds
    on the TimeSlotService for more complex slot management scenarios.
    
    The service enhances the booking system with time slot management capabilities,
    including express booking support and slot reservation logic.
    """
    
    @staticmethod
    def get_available_slots(service, date, duration_hours=1):
        """
        Get available time slots for a service on a specific date.
        
        This method enhances the TimeSlotService by first trying to get existing
        slots and generating new ones from provider availability if none exist.
        
        Args:
            service (Service): Service instance
            date (date): Date to check availability for
            duration_hours (int): Booking duration in hours (default: 1)
            
        Returns:
            QuerySet: Available booking slots
            
        Example:
            >>> slots = BookingSlotService.get_available_slots(service, date(2024, 2, 1))
            >>> available_count = slots.count()
        """
        # First try to get existing slots
        available_slots = TimeSlotService.get_available_slots(service, date)
        
        # If no slots exist, generate them from provider availability
        if not available_slots.exists():
            provider = service.provider
            
            # Generate slots for this date
            created_slots = TimeSlotService.generate_slots_from_availability(
                provider=provider,
                service=service,
                start_date=date,
                end_date=date
            )
            
            # Return the newly created slots
            available_slots = TimeSlotService.get_available_slots(service, date)
        
        return available_slots
    
    @staticmethod
    def create_default_slots(service, date, start_hour=9, end_hour=17, slot_duration=1):
        """
        Create default time slots using the new TimeSlotService.
        
        Simplified method to create default time slots for a service on a specific
        date using the provider availability system.
        
        Args:
            service (Service): Service instance
            date (date): Date to create slots for
            start_hour (int): Starting hour (default: 9)
            end_hour (int): Ending hour (default: 17)
            slot_duration (int): Slot duration in hours (default: 1)
            
        Returns:
            list: Created booking slots
            
        Example:
            >>> slots = BookingSlotService.create_default_slots(service, date(2024, 2, 1))
            >>> print(f"Created {len(slots)} default slots")
        """
        provider = service.provider
        
        # Use the new TimeSlotService to generate slots
        created_slots = TimeSlotService.generate_slots_from_availability(
            provider=provider,
            service=service,
            start_date=date,
            end_date=date
        )
        
        return created_slots
    
    @staticmethod
    def book_slot(slot, booking):
        """
        Book a time slot for a booking.
        
        Reserves a time slot for a specific booking by updating the slot's
        booking count and associating it with the booking instance.
        
        Args:
            slot (BookingSlot): Booking slot instance to reserve
            booking (Booking): Booking instance to associate with the slot
            
        Returns:
            bool: Success status - True if slot was successfully booked, False if fully booked
            
        Example:
            >>> success = BookingSlotService.book_slot(slot, booking)
            >>> if success:
            ...     print("Slot booked successfully")
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
    
    @staticmethod
    def create_express_booking(service, customer, booking_data, express_type='standard'):
        """
        Create an express booking with rush pricing.
        
        Creates a booking with express service options and appropriate rush pricing
        based on the selected express type (standard, urgent, emergency).
        
        Args:
            service (Service): Service instance
            customer (User): Customer user instance
            booking_data (dict): Booking form data
            express_type (str): Type of express service ('standard', 'urgent', 'emergency')
            
        Returns:
            tuple: (booking, slot) or (None, None) if failed
            
        Example:
            >>> booking_data = {
            ...     'booking_date': '2024-02-01',
            ...     'booking_time': '10:00',
            ...     'address': 'Customer Address'
            ... }
            >>> booking, slot = BookingSlotService.create_express_booking(
            ...     service, customer, booking_data, 'urgent')
        """
        from .models import Booking, BookingSlot
        from datetime import datetime, time
        
        # Get or create express slot for the requested time
        booking_date = datetime.strptime(booking_data['booking_date'], '%Y-%m-%d').date()
        
        # Handle both time formats: 'HH:MM' and 'HH:MM:SS'
        time_str = booking_data['booking_time']
        try:
            # Try parsing with seconds first (HH:MM:SS)
            booking_time = datetime.strptime(time_str, '%H:%M:%S').time()
        except ValueError:
            # Fallback to parsing without seconds (HH:MM)
            booking_time = datetime.strptime(time_str, '%H:%M').time()
        
        # Calculate end time (assume 1 hour duration)
        end_hour = booking_time.hour + 1
        end_time = time(end_hour, booking_time.minute)
        
        # Express fee percentages
        express_fees = {
            'standard': 50.0,
            'urgent': 75.0,
            'emergency': 100.0
        }
        
        # Create or get express slot
        slot, created = BookingSlot.objects.get_or_create(
            service=service,
            provider=service.provider,  # Include provider field
            date=booking_date,
            start_time=booking_time,
            end_time=end_time,
            defaults={
                'is_available': True,
                'max_bookings': 1,
                'current_bookings': 0,
                'is_rush': True,
                'slot_type': express_type,
                'rush_fee_percentage': express_fees.get(express_type, 50.0),
                'provider_note': f'Express {express_type} service'
            }
        )
        
        if not slot.is_available or slot.is_fully_booked:
            return None, None
        
        # Calculate express pricing
        base_price = service.price
        express_fee = base_price * (slot.rush_fee_percentage / 100)
        total_amount = base_price + express_fee
        
        # Create booking
        booking = Booking.objects.create(
            customer=customer,
            service=service,
            booking_date=booking_date,
            booking_time=booking_time,
            address=booking_data.get('address', ''),
            city=booking_data.get('city', ''),
            phone=booking_data.get('phone', ''),
            note=booking_data.get('note', ''),
            special_instructions=booking_data.get('special_instructions', ''),
            price=base_price,
            express_fee=express_fee,
            total_amount=total_amount,
            is_express_booking=True,
            booking_slot=slot
        )
        
        # Update slot
        slot.current_bookings += 1
        slot.save()
        
        return booking, slot


class BookingWizardService:
    """
    Service class for managing booking wizard flow.
    
    This service handles the multi-step booking creation process, providing
    step-by-step validation and data management for complex booking scenarios.
    It enhances booking creation with structured validation and progressive
    data collection.
    """
    
    @staticmethod
    def create_booking_step(user, step_data):
        """
        Create or update booking at a specific step.
        
        Handles step-by-step booking creation with appropriate validation for
        each step in the booking wizard process.
        
        Args:
            user (User): Current user
            step_data (dict): Data for current step including booking_step and booking_id
            
        Returns:
            dict: Step processing result with success status and booking information
            
        Example:
            >>> step_data = {
            ...     'booking_step': 'service_selection',
            ...     'service': 1,
            ...     'booking_date': '2024-02-01'
            ... }
            >>> result = BookingWizardService.create_booking_step(user, step_data)
            >>> if result['success']:
            ...     print(f"Booking step completed: {result['current_step']}")
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
        Calculate dynamic pricing for booking.
        
        Provides dynamic pricing calculations based on service settings and
        potential future pricing factors like peak hours or seasonal adjustments.
        
        Args:
            service (Service): Service instance
            date (date): Booking date (optional)
            time (time): Booking time (optional)
            add_ons (list): Additional services (optional)
            
        Returns:
            dict: Price calculation result with breakdown and total amount
            
        Example:
            >>> result = BookingWizardService.calculate_booking_price(service)
            >>> if result['success']:
            ...     print(f"Total amount: ₹{result['total_amount']}")
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