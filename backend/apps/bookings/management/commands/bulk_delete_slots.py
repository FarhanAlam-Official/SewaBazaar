"""
BULK DELETE SLOTS COMMAND

Purpose: Bulk delete booking slots from the database
This command removes booking slots based on various criteria.

Usage:
    python manage.py bulk_delete_slots
    python manage.py bulk_delete_slots --days 30
    python manage.py bulk_delete_slots --provider-id 123
    python manage.py bulk_delete_slots --service-id 456
    python manage.py bulk_delete_slots --before-date 2023-12-31

Features:
- Bulk deletes slots based on provider, service, or date range
- Option to delete expired slots only
- Detailed logging and reporting
- Safe deletion (preserves booked slots by default)
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from apps.bookings.models import BookingSlot
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Bulk delete booking slots from the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            help='Delete slots older than this many days',
        )
        parser.add_argument(
            '--before-date',
            type=str,
            help='Delete slots before this date (YYYY-MM-DD)',
        )
        parser.add_argument(
            '--provider-id',
            type=int,
            help='Delete slots for specific provider only',
        )
        parser.add_argument(
            '--service-id',
            type=int,
            help='Delete slots for specific service only',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force deletion of booked slots (DANGEROUS)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without making changes',
        )

    def handle(self, *args, **options):
        self.days = options.get('days')
        self.before_date = options.get('before_date')
        self.specific_provider_id = options.get('provider_id')
        self.specific_service_id = options.get('service_id')
        self.force = options['force']
        self.dry_run = options['dry_run']
        
        if self.dry_run:
            self.stdout.write(self.style.WARNING("🔍 DRY RUN MODE - No changes will be made"))
        
        self.stdout.write(f"🕐 Starting bulk slot deletion ({timezone.now()})")
        
        try:
            # Delete slots
            deleted_count = self.bulk_delete_slots()
            
            if self.dry_run:
                self.stdout.write(self.style.WARNING(f"🔍 Would delete {deleted_count} slots"))
            else:
                self.stdout.write(self.style.SUCCESS(f"✅ Deleted {deleted_count} slots"))
                    
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error during bulk slot deletion: {str(e)}"))
            logger.error(f"Bulk slot deletion error: {str(e)}")

    def bulk_delete_slots(self):
        """Bulk delete slots based on criteria"""
        self.stdout.write("\n🗑️  Bulk deleting slots...")
        
        # Start with all slots
        slots_query = BookingSlot.objects.all()
        
        # Apply date filters
        if self.days:
            # Delete slots older than X days
            cutoff_date = date.today() - timedelta(days=self.days)
            slots_query = slots_query.filter(date__lt=cutoff_date)
        elif self.before_date:
            # Delete slots before specific date
            try:
                target_date = date.fromisoformat(self.before_date)
                slots_query = slots_query.filter(date__lt=target_date)
            except ValueError:
                self.stdout.write(self.style.ERROR(f"❌ Invalid date format: {self.before_date}. Use YYYY-MM-DD"))
                return 0
        
        # Apply provider/service filters
        if self.specific_provider_id:
            slots_query = slots_query.filter(provider_id=self.specific_provider_id)
        if self.specific_service_id:
            slots_query = slots_query.filter(service_id=self.specific_service_id)
        
        # Apply booking status filter (unless forced)
        if not self.force:
            # Only delete unbooked slots
            slots_query = slots_query.filter(current_bookings=0)
            self.stdout.write("  🔐 Safe mode: Only deleting unbooked slots (use --force to override)")
        else:
            self.stdout.write(self.style.WARNING("  ⚠️  FORCE MODE: Deleting ALL matching slots including booked ones"))
        
        slots_to_delete = slots_query.all()
        deleted_count = slots_to_delete.count()
        
        if deleted_count > 0:
            self.stdout.write(f"  📊 Found {deleted_count} slots to delete")
            
            # Show sample of what will be deleted
            sample_slots = slots_to_delete[:5]
            for slot in sample_slots:
                booked_indicator = f" ({slot.current_bookings} bookings)" if slot.current_bookings > 0 else ""
                category = slot.slot_type or 'normal'
                self.stdout.write(f"    - {slot.service.title}: {slot.date} {slot.start_time}-{slot.end_time} [{category}]{booked_indicator}")
            
            if deleted_count > 5:
                self.stdout.write(f"    ... and {deleted_count - 5} more")
            
            if not self.dry_run:
                slots_to_delete.delete()
        else:
            self.stdout.write("  ✨ No slots to delete")
        
        return deleted_count