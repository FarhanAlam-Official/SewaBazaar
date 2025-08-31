"""
AUTOMATED TIME SLOT MAINTENANCE COMMAND

Purpose: Automatically maintain a rolling 30-day window of time slots
- Remove expired slots (yesterday and older)
- Generate new slots for +30 days ahead
- Ensure continuous availability without manual intervention

Usage:
    python manage.py maintain_time_slots
    
Cron Job Setup:
    # Add to crontab to run daily at 2 AM
    0 2 * * * cd /path/to/project && python manage.py maintain_time_slots

Features:
- Safe deletion (only removes unbooked expired slots)
- Rolling window maintenance (always 30 days ahead)
- Provider availability respect
- Non-destructive operation (preserves existing bookings)
- Detailed logging and reporting
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from datetime import datetime, timedelta, date, time
from apps.accounts.models import User
from apps.services.models import Service
from apps.bookings.models import ProviderAvailability, BookingSlot, Booking
from apps.bookings.services import TimeSlotService
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Maintain rolling 30-day window of time slots (auto-expire old, generate new)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days-ahead',
            type=int,
            default=30,
            help='Number of days ahead to maintain slots (default: 30)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )
        parser.add_argument(
            '--force-cleanup',
            action='store_true',
            help='Force cleanup of all expired slots (including booked ones)',
        )
        parser.add_argument(
            '--provider-id',
            type=int,
            help='Maintain slots for specific provider only',
        )
        parser.add_argument(
            '--service-id',
            type=int,
            help='Maintain slots for specific service only',
        )

    def handle(self, *args, **options):
        self.days_ahead = options['days_ahead']
        self.dry_run = options['dry_run']
        self.force_cleanup = options['force_cleanup']
        self.specific_provider_id = options.get('provider_id')
        self.specific_service_id = options.get('service_id')
        
        if self.dry_run:
            self.stdout.write(self.style.WARNING("🔍 DRY RUN MODE - No changes will be made"))
        
        self.stdout.write(f"🕐 Starting time slot maintenance ({timezone.now()})")
        self.stdout.write(f"📅 Maintaining {self.days_ahead} days ahead")
        
        try:
            with transaction.atomic():
                # Step 1: Clean up expired slots
                expired_count = self.cleanup_expired_slots()
                
                # Step 2: Generate missing slots
                generated_count = self.generate_missing_slots()
                
                # Step 3: Validate slot coverage
                coverage_report = self.validate_slot_coverage()
                
                # Summary
                self.show_summary(expired_count, generated_count, coverage_report)
                
                if self.dry_run:
                    self.stdout.write(self.style.WARNING("🔄 Rolling back transaction (dry run)"))
                    raise Exception("Dry run - rolling back")
                    
        except Exception as e:
            if "Dry run" in str(e):
                self.stdout.write(self.style.SUCCESS("✅ Dry run completed successfully"))
            else:
                self.stdout.write(self.style.ERROR(f"❌ Error during maintenance: {str(e)}"))
                logger.error(f"Time slot maintenance error: {str(e)}")

    def cleanup_expired_slots(self):
        """Remove expired slots that are no longer needed"""
        self.stdout.write("\n🧹 Cleaning up expired slots...")
        
        # Define cutoff date (yesterday)
        cutoff_date = date.today() - timedelta(days=1)
        
        # Find expired slots
        expired_query = BookingSlot.objects.filter(date__lt=cutoff_date)
        
        # Apply filters if specified
        if self.specific_provider_id:
            expired_query = expired_query.filter(provider_id=self.specific_provider_id)
        if self.specific_service_id:
            expired_query = expired_query.filter(service_id=self.specific_service_id)
        
        # Separate booked vs unbooked slots
        if self.force_cleanup:
            # Remove all expired slots
            slots_to_delete = expired_query
            self.stdout.write(f"  🔥 Force cleanup mode: removing ALL expired slots")
        else:
            # Only remove unbooked slots (safe mode)
            slots_to_delete = expired_query.filter(current_bookings=0)
            booked_expired = expired_query.filter(current_bookings__gt=0).count()
            if booked_expired > 0:
                self.stdout.write(f"  ⚠️  Preserving {booked_expired} booked expired slots")
        
        expired_count = slots_to_delete.count()
        
        if expired_count > 0:
            self.stdout.write(f"  📊 Found {expired_count} expired slots to remove")
            
            # Show sample of what will be deleted
            sample_slots = slots_to_delete[:3]
            for slot in sample_slots:
                booked_indicator = f" ({slot.current_bookings} bookings)" if slot.current_bookings > 0 else ""
                self.stdout.write(f"    - {slot.service.title}: {slot.date} {slot.start_time}-{slot.end_time}{booked_indicator}")
            
            if expired_count > 3:
                self.stdout.write(f"    ... and {expired_count - 3} more")
            
            if not self.dry_run:
                slots_to_delete.delete()
                self.stdout.write(f"  ✅ Removed {expired_count} expired slots")
        else:
            self.stdout.write("  ✨ No expired slots to remove")
        
        return expired_count

    def generate_missing_slots(self):
        """Generate slots for the rolling 30-day window"""
        self.stdout.write("\n🔄 Generating missing slots...")
        
        # Define date range for slot generation
        start_date = date.today()
        end_date = start_date + timedelta(days=self.days_ahead)
        
        self.stdout.write(f"  📅 Target date range: {start_date} to {end_date}")
        
        # Get active services
        services_query = Service.objects.filter(status='active').select_related('provider')
        
        # Apply filters if specified
        if self.specific_provider_id:
            services_query = services_query.filter(provider_id=self.specific_provider_id)
        if self.specific_service_id:
            services_query = services_query.filter(id=self.specific_service_id)
        
        services = services_query.all()
        
        if not services.exists():
            self.stdout.write("  ⚠️  No active services found")
            return 0
        
        self.stdout.write(f"  🎯 Processing {services.count()} active services")
        
        total_generated = 0
        
        for service in services:
            self.stdout.write(f"    📋 Processing: {service.title}")
            
            # Check which dates need slots
            existing_dates = set(
                BookingSlot.objects.filter(
                    service=service,
                    date__gte=start_date,
                    date__lte=end_date
                ).values_list('date', flat=True)
            )
            
            # Find missing dates
            all_dates = {start_date + timedelta(days=i) for i in range(self.days_ahead + 1)}
            missing_dates = all_dates - existing_dates
            
            if missing_dates:
                self.stdout.write(f"      🔍 Found {len(missing_dates)} missing dates")
                
                # Generate slots for missing dates
                missing_dates_sorted = sorted(missing_dates)
                earliest_missing = missing_dates_sorted[0]
                latest_missing = missing_dates_sorted[-1]
                
                if not self.dry_run:
                    try:
                        created_slots = TimeSlotService.generate_slots_from_availability(
                            provider=service.provider,
                            service=service,
                            start_date=earliest_missing,
                            end_date=latest_missing
                        )
                        
                        # Filter only the slots for actually missing dates
                        actual_created = [
                            slot for slot in created_slots 
                            if slot.date in missing_dates
                        ]
                        
                        slots_count = len(actual_created)
                        total_generated += slots_count
                        
                        if slots_count > 0:
                            sample_slot = actual_created[0]
                            self.stdout.write(f"      ✅ Generated {slots_count} slots (e.g., {sample_slot.date} {sample_slot.start_time})")
                        else:
                            self.stdout.write(f"      ⚠️  No slots generated (provider may not have availability)")
                            
                    except Exception as e:
                        self.stdout.write(f"      ❌ Failed to generate slots: {str(e)}")
                        logger.error(f"Slot generation error for {service.title}: {str(e)}")
                else:
                    # Dry run - just count what would be generated
                    estimated_slots = len(missing_dates) * 8  # Estimate 8 slots per day
                    total_generated += estimated_slots
                    self.stdout.write(f"      📝 Would generate ~{estimated_slots} slots")
            else:
                self.stdout.write(f"      ✅ All dates have slots")
        
        return total_generated

    def validate_slot_coverage(self):
        """Validate that we have good slot coverage"""
        self.stdout.write("\n📊 Validating slot coverage...")
        
        today = date.today()
        future_30_days = today + timedelta(days=30)
        
        # Get coverage statistics
        total_services = Service.objects.filter(status='active').count()
        
        # Services with slots in next 30 days
        services_with_slots = BookingSlot.objects.filter(
            date__gte=today,
            date__lte=future_30_days,
            service__status='active'
        ).values('service').distinct().count()
        
        # Total slots available
        total_slots = BookingSlot.objects.filter(
            date__gte=today,
            date__lte=future_30_days,
            is_available=True
        ).count()
        
        # Slots per day average
        slots_per_day = total_slots / 30 if total_slots > 0 else 0
        
        # Coverage percentage
        coverage_percentage = (services_with_slots / total_services * 100) if total_services > 0 else 0
        
        coverage_report = {
            'total_services': total_services,
            'services_with_slots': services_with_slots,
            'total_slots': total_slots,
            'slots_per_day': round(slots_per_day, 1),
            'coverage_percentage': round(coverage_percentage, 1)
        }
        
        self.stdout.write(f"  📈 Service coverage: {services_with_slots}/{total_services} ({coverage_percentage:.1f}%)")
        self.stdout.write(f"  📊 Total available slots: {total_slots}")
        self.stdout.write(f"  📅 Average slots per day: {slots_per_day:.1f}")
        
        # Warnings
        if coverage_percentage < 50:
            self.stdout.write(self.style.WARNING("  ⚠️  Low service coverage - many services missing slots"))
        
        if slots_per_day < 10:
            self.stdout.write(self.style.WARNING("  ⚠️  Low slot density - consider checking provider availability"))
        
        return coverage_report

    def show_summary(self, expired_count, generated_count, coverage_report):
        """Show maintenance summary"""
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS("📋 TIME SLOT MAINTENANCE SUMMARY"))
        self.stdout.write("="*60)
        
        self.stdout.write(f"🗑️  Expired slots removed: {expired_count}")
        self.stdout.write(f"✨ New slots generated: {generated_count}")
        self.stdout.write(f"📊 Service coverage: {coverage_report['coverage_percentage']:.1f}%")
        self.stdout.write(f"📅 Total future slots: {coverage_report['total_slots']}")
        self.stdout.write(f"⏰ Maintenance completed: {timezone.now()}")
        
        if self.dry_run:
            self.stdout.write(self.style.WARNING("🔍 This was a DRY RUN - no actual changes made"))
        else:
            self.stdout.write(self.style.SUCCESS("✅ Maintenance completed successfully"))
        
        # Recommendations
        if coverage_report['coverage_percentage'] < 80:
            self.stdout.write(f"\n💡 RECOMMENDATION:")
            self.stdout.write(f"   Consider running: python manage.py create_time_slots")
            self.stdout.write(f"   to set up provider availability for missing services")
        
        self.stdout.write("="*60)