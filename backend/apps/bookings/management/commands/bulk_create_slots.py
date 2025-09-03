"""
BULK CREATE SLOTS COMMAND

Purpose: Bulk create booking slots for services in the database
This command creates booking slots in bulk for services based on provider availability.

Usage:
    python manage.py bulk_create_slots
    python manage.py bulk_create_slots --days 14
    python manage.py bulk_create_slots --provider-id 123
    python manage.py bulk_create_slots --service-id 456

Features:
- Bulk creates slots with different categories for all services
- Configurable time window
- Service and provider-specific creation
- Detailed logging and reporting
- Performance optimized for large datasets
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from datetime import datetime, timedelta, date
from apps.services.models import Service
from apps.bookings.models import ProviderAvailability, BookingSlot
from apps.bookings.services import TimeSlotService
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Bulk create booking slots for services in the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days to create slots for (default: 30)',
        )
        parser.add_argument(
            '--provider-id',
            type=int,
            help='Create slots for specific provider only',
        )
        parser.add_argument(
            '--service-id',
            type=int,
            help='Create slots for specific service only',
        )
        parser.add_argument(
            '--clear-existing',
            action='store_true',
            help='Clear existing slots before creating new ones',
        )

    def handle(self, *args, **options):
        self.days = options['days']
        self.specific_provider_id = options.get('provider_id')
        self.specific_service_id = options.get('service_id')
        self.clear_existing = options['clear_existing']
        
        self.stdout.write(f"🕐 Starting bulk slot creation ({timezone.now()})")
        self.stdout.write(f"📅 Creating slots for {self.days} days ahead")
        
        try:
            with transaction.atomic():
                # Clear existing slots if requested
                if self.clear_existing:
                    deleted_count = self.clear_existing_slots()
                    self.stdout.write(f"🗑️  Cleared {deleted_count} existing slots")
                
                # Create slots
                created_count = self.bulk_create_slots()
                self.stdout.write(self.style.SUCCESS(f"✅ Created {created_count} slots"))
                    
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error during bulk slot creation: {str(e)}"))
            logger.error(f"Bulk slot creation error: {str(e)}")

    def clear_existing_slots(self):
        """Clear existing slots within the target date range"""
        self.stdout.write("\n🗑️  Clearing existing slots...")
        
        # Define date range
        start_date = date.today()
        end_date = start_date + timedelta(days=self.days)
        
        # Find slots within date range
        slots_to_delete = BookingSlot.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        )
        
        # Apply filters if specified
        if self.specific_provider_id:
            slots_to_delete = slots_to_delete.filter(provider_id=self.specific_provider_id)
        if self.specific_service_id:
            slots_to_delete = slots_to_delete.filter(service_id=self.specific_service_id)
        
        deleted_count = slots_to_delete.count()
        slots_to_delete.delete()
        
        return deleted_count

    def bulk_create_slots(self):
        """Bulk create slots for services"""
        self.stdout.write("\n🔄 Bulk creating slots...")
        
        # Define date range for slot creation
        start_date = date.today()
        end_date = start_date + timedelta(days=self.days)
        
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
        
        total_created = 0
        
        for service in services:
            self.stdout.write(f"    📋 Processing: {service.title}")
            
            try:
                # Generate slots for the entire date range
                created_slots = TimeSlotService.generate_slots_from_availability(
                    provider=service.provider,
                    service=service,
                    start_date=start_date,
                    end_date=end_date
                )
                
                slots_count = len(created_slots)
                total_created += slots_count
                
                if slots_count > 0:
                    # Count slots by category
                    category_counts = {}
                    for slot in created_slots:
                        category = slot.slot_type or 'normal'
                        category_counts[category] = category_counts.get(category, 0) + 1
                    
                    category_summary = ", ".join([f"{cat}: {count}" for cat, count in category_counts.items()])
                    self.stdout.write(f"      ✅ Generated {slots_count} slots [{category_summary}]")
                else:
                    self.stdout.write(f"      ⚠️  No slots generated (provider may not have availability)")
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"      ❌ Failed to generate slots: {str(e)}")
                )
        
        return total_created