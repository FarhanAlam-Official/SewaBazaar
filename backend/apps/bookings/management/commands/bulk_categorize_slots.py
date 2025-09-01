"""
BULK CATEGORIZE SLOTS COMMAND

Purpose: Bulk categorize existing booking slots in the database
This command updates existing slots with proper categories based on time and day.

Usage:
    python manage.py bulk_categorize_slots
    python manage.py bulk_categorize_slots --days 14
    python manage.py bulk_categorize_slots --provider-id 123
    python manage.py bulk_categorize_slots --service-id 456

Features:
- Bulk categorizes existing slots based on time and day rules
- Configurable time window
- Service and provider-specific categorization
- Detailed logging and reporting
- Preserves existing bookings
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from apps.bookings.models import BookingSlot
from apps.bookings.services import TimeSlotService
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Bulk categorize existing booking slots in the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days to categorize slots for (default: 30)',
        )
        parser.add_argument(
            '--provider-id',
            type=int,
            help='Categorize slots for specific provider only',
        )
        parser.add_argument(
            '--service-id',
            type=int,
            help='Categorize slots for specific service only',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without making changes',
        )

    def handle(self, *args, **options):
        self.days = options['days']
        self.specific_provider_id = options.get('provider_id')
        self.specific_service_id = options.get('service_id')
        self.dry_run = options['dry_run']
        
        if self.dry_run:
            self.stdout.write(self.style.WARNING("🔍 DRY RUN MODE - No changes will be made"))
        
        self.stdout.write(f"🕐 Starting bulk slot categorization ({timezone.now()})")
        self.stdout.write(f"📅 Categorizing slots for {self.days} days ahead")
        
        try:
            # Categorize slots
            updated_count = self.bulk_categorize_slots()
            
            if self.dry_run:
                self.stdout.write(self.style.WARNING(f"🔍 Would update {updated_count} slots"))
            else:
                self.stdout.write(self.style.SUCCESS(f"✅ Updated {updated_count} slots"))
                    
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error during bulk slot categorization: {str(e)}"))
            logger.error(f"Bulk slot categorization error: {str(e)}")

    def bulk_categorize_slots(self):
        """Bulk categorize existing slots"""
        self.stdout.write("\n🏷️  Bulk categorizing slots...")
        
        # Define date range for slot categorization
        start_date = date.today()
        end_date = start_date + timedelta(days=self.days)
        
        self.stdout.write(f"  📅 Target date range: {start_date} to {end_date}")
        
        # Get slots to categorize (only unbooked slots)
        slots_query = BookingSlot.objects.filter(
            date__gte=start_date,
            date__lte=end_date,
            current_bookings=0  # Only categorize unbooked slots
        )
        
        # Apply filters if specified
        if self.specific_provider_id:
            slots_query = slots_query.filter(provider_id=self.specific_provider_id)
        if self.specific_service_id:
            slots_query = slots_query.filter(service_id=self.specific_service_id)
        
        slots = list(slots_query.all())
        
        if not slots:
            self.stdout.write("  ⚠️  No unbooked slots found to categorize")
            return 0
        
        self.stdout.write(f"  🎯 Processing {len(slots)} unbooked slots")
        
        updated_count = 0
        
        # Categorize slots
        for slot in slots:
            if self.dry_run:
                # Show what would be changed
                old_category = slot.slot_type or 'normal'
                slot_info = TimeSlotService._categorize_slot_improved(slot.date, slot.start_time)
                new_category = slot_info['category']
                
                if old_category != new_category:
                    self.stdout.write(f"      🏷️  Would re-categorize: {slot.date} {slot.start_time} from {old_category} to {new_category}")
                    updated_count += 1
            else:
                try:
                    # Get proper categorization
                    slot_info = TimeSlotService._categorize_slot_improved(slot.date, slot.start_time)
                    new_category = slot_info['category']
                    is_rush = new_category != 'normal'
                    rush_percentage = TimeSlotService._calculate_rush_percentage_by_category(new_category)
                    
                    # Update slot if category changed
                    if slot.slot_type != new_category:
                        slot.slot_type = new_category
                        slot.is_rush = is_rush
                        slot.rush_fee_percentage = rush_percentage
                        slot.is_express_only = False  # Always False as per updated directive
                        slot.provider_note = TimeSlotService._generate_slot_note_by_category(new_category, slot.start_time)
                        slot.save()
                        
                        self.stdout.write(f"      ✅ Re-categorized: {slot.date} {slot.start_time} to {new_category}")
                        updated_count += 1
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"      ❌ Failed to categorize slot {slot.id}: {str(e)}")
                    )
        
        return updated_count