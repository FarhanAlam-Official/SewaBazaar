"""
AUTO CANCEL EXPIRED BOOKINGS COMMAND

Purpose: Automatically cancel bookings that have passed their scheduled date/time
but were never marked as completed, cancelled, or rejected.

This handles the scenario when both the provider and customer take no action
after a booking date has passed, ensuring a clean booking history.

Usage:
    python manage.py auto_cancel_expired_bookings
    python manage.py auto_cancel_expired_bookings --grace-period 2
    python manage.py auto_cancel_expired_bookings --dry-run

Cron Job Setup:
    # Add to crontab to run daily at 3 AM
    0 3 * * * cd /path/to/project && python manage.py auto_cancel_expired_bookings

Features:
- Configurable grace period (default: 1 day after booking date)
- Dry run mode for testing
- Detailed logging of cancelled bookings
- Preserves booking history with proper cancellation reason
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from datetime import datetime, timedelta, date
from apps.bookings.models import Booking
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Automatically cancel bookings that have passed their scheduled date/time'

    def add_arguments(self, parser):
        parser.add_argument(
            '--grace-period',
            type=int,
            default=1,
            help='Number of days to wait after booking date before auto-cancelling (default: 1)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )

    def handle(self, *args, **options):
        self.grace_period = options['grace_period']
        self.dry_run = options['dry_run']
        
        if self.dry_run:
            self.stdout.write(self.style.WARNING("🔍 DRY RUN MODE - No changes will be made"))
        
        self.stdout.write(f"🕐 Starting expired booking cancellation ({timezone.now()})")
        self.stdout.write(f"📅 Grace period: {self.grace_period} day(s)")
        
        try:
            with transaction.atomic():
                # Find and cancel expired bookings
                cancelled_count = self.cancel_expired_bookings()
                
                # Show summary
                if cancelled_count > 0:
                    self.stdout.write(self.style.SUCCESS(f"✅ Auto-cancelled {cancelled_count} expired booking(s)"))
                else:
                    self.stdout.write("✨ No expired bookings to cancel")
                
                if self.dry_run:
                    self.stdout.write(self.style.WARNING("🔄 Rolling back transaction (dry run)"))
                    raise Exception("Dry run - rolling back")
                    
        except Exception as e:
            if "Dry run" in str(e):
                self.stdout.write(self.style.SUCCESS("✅ Dry run completed successfully"))
            else:
                self.stdout.write(self.style.ERROR(f"❌ Error during cancellation: {str(e)}"))
                logger.error(f"Auto-cancellation error: {str(e)}")

    def cancel_expired_bookings(self):
        """Cancel bookings that have passed their scheduled date/time"""
        self.stdout.write("\n🧹 Finding expired bookings...")
        
        # Define cutoff date (yesterday minus grace period)
        cutoff_date = date.today() - timedelta(days=self.grace_period)
        
        # Find expired bookings that are still pending or confirmed
        expired_bookings = Booking.objects.filter(
            booking_date__lt=cutoff_date,
            status__in=['pending', 'confirmed']
        )
        
        expired_count = expired_bookings.count()
        
        if expired_count > 0:
            self.stdout.write(f"  📊 Found {expired_count} expired bookings to auto-cancel")
            
            # Show sample of what will be cancelled
            sample_bookings = expired_bookings[:5]
            for booking in sample_bookings:
                self.stdout.write(f"    - Booking #{booking.id}: {booking.service.title} on {booking.booking_date} at {booking.booking_time} (Status: {booking.status})")
            
            if expired_count > 5:
                self.stdout.write(f"    ... and {expired_count - 5} more")
            
            if not self.dry_run:
                # Set the cancellation reason
                cancellation_reason = "Auto-cancelled: Booking date passed without completion"
                
                # Update all bookings at once
                expired_bookings.update(
                    status='cancelled',
                    cancellation_reason=cancellation_reason
                )
                
                # Handle any slot-related updates that might be needed
                # This needs to be done one by one since it depends on booking.booking_slot
                for booking in expired_bookings:
                    if booking.booking_slot:
                        booking.booking_slot.current_bookings = max(0, booking.booking_slot.current_bookings - 1)
                        booking.booking_slot.save()
                
                self.stdout.write(f"  ✅ Auto-cancelled {expired_count} expired bookings")
        
        return expired_count
