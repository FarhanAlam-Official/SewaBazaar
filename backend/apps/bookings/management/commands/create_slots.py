"""
CREATE SLOTS COMMAND

Purpose: Create time slots for the next 30 days based on the improved Express Service plan

Usage:
    python manage.py create_slots
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
    help = 'Create time slots for the next 30 days based on the improved Express Service plan'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days to create slots for (default: 30)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
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

    def handle(self, *args, **options):
        self.days = options['days']
        self.dry_run = options['dry_run']
        self.specific_provider_id = options.get('provider_id')
        self.specific_service_id = options.get('service_id')
        
        if self.dry_run:
            self.stdout.write(self.style.WARNING("🔍 DRY RUN MODE - No changes will be made"))
        
        self.stdout.write(f"🕐 Starting slot creation process ({timezone.now()})")
        self.stdout.write(f"📅 Creating slots for {self.days} days ahead")
        
        try:
            with transaction.atomic():
                # Create slots for the specified period
                created_count = self.create_slots()
                
                if self.dry_run:
                    self.stdout.write(self.style.WARNING("🔄 Rolling back transaction (dry run)"))
                    raise Exception("Dry run - rolling back")
                else:
                    self.stdout.write(self.style.SUCCESS(f"✅ Created {created_count} slots"))
                    
        except Exception as e:
            if "Dry run" in str(e):
                self.stdout.write(self.style.SUCCESS("✅ Dry run completed successfully"))
            else:
                self.stdout.write(self.style.ERROR(f"❌ Error during slot creation: {str(e)}"))
                logger.error(f"Slot creation error: {str(e)}")

    def create_slots(self):
        """Create slots for the specified period with proper categorization"""
        self.stdout.write("\n🔄 Creating slots with proper categorization...")
        
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
            
            # Create slots for each day in the range
            created_for_service = 0
            for i in range(self.days + 1):
                target_date = start_date + timedelta(days=i)
                
                try:
                    # Generate slots for this specific date
                    created_slots = self.generate_slots_for_date(service, target_date)
                    created_for_service += len(created_slots)
                    
                    if len(created_slots) > 0 and created_for_service <= 10:  # Show first 10 generated dates
                        category_counts = {}
                        for slot in created_slots:
                            category = slot.slot_type or 'normal'
                            category_counts[category] = category_counts.get(category, 0) + 1
                        
                        category_summary = ", ".join([f"{cat}: {count}" for cat, count in category_counts.items()])
                        self.stdout.write(f"        📅 {target_date}: {len(created_slots)} slots ({category_summary})")
                        
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"        ❌ Failed to create slots for {target_date}: {str(e)}")
                    )
            
            total_created += created_for_service
            self.stdout.write(f"      ✅ Created {created_for_service} slots")
        
        self.stdout.write(f"  🎉 Created {total_created} slots across all services")
        return total_created

    def generate_slots_for_date(self, service, target_date):
        """
        Generate slots for a specific date with proper categorization based on requirements
        """
        created_slots = []
        weekday = target_date.weekday()  # 0=Monday, 6=Sunday
        provider = service.provider
        
        # Check provider availability for this weekday
        provider_availability = ProviderAvailability.objects.filter(
            provider=provider,
            weekday=weekday,
            is_available=True
        )
        
        if not provider_availability.exists():
            return created_slots  # No availability, no slots
            
        # For each availability period, generate appropriate slots
        for availability in provider_availability:
            # Generate slots based on the improved plan requirements
            slots = self._generate_slots_by_requirements(
                service=service,
                provider=provider,
                date=target_date,
                availability=availability
            )
            created_slots.extend(slots)
            
        return created_slots

    def _generate_slots_by_requirements(self, service, provider, date, availability):
        """
        Generate slots based on the specific requirements provided
        """
        slots = []
        current_time = availability.start_time
        end_time = availability.end_time
        
        while current_time < end_time:
            # Calculate slot end time (default 1 hour)
            next_hour = datetime.combine(date, current_time) + timedelta(hours=1)
            slot_end_time = min(next_hour.time(), end_time)
            
            # Skip if during break time
            if availability.break_start and availability.break_end:
                if availability.break_start <= current_time < availability.break_end:
                    current_time = availability.break_end
                    continue
            
            # Categorize this slot based on requirements
            slot_info = self._categorize_slot_by_requirements(date, current_time)
            slot_category = slot_info['category']
            is_express_only = slot_info['is_express_only']
            
            # Calculate rush fee percentage based on category
            rush_percentage = self._calculate_rush_percentage_by_category(slot_category)
            
            # Create the booking slot
            try:
                slot = BookingSlot.objects.create(
                    service=service,
                    provider=provider,
                    date=date,
                    start_time=current_time,
                    end_time=slot_end_time,
                    is_available=True,
                    max_bookings=1,
                    current_bookings=0,
                    is_rush=slot_category != 'normal',
                    rush_fee_percentage=rush_percentage,
                    is_express_only=is_express_only,
                    slot_type=slot_category,
                    created_from_availability=True,
                    provider_note=self._generate_slot_note_by_category(slot_category, current_time)
                )
                slots.append(slot)
            except Exception as e:
                print(f"Error creating slot: {e}")
            
            # Move to next hour
            current_time = (datetime.combine(date, current_time) + timedelta(hours=1)).time()
            
        return slots

    def _categorize_slot_by_requirements(self, date, start_time):
        """
        Categorize a slot based on the specific requirements provided in the task
        Returns a dictionary with category and is_express_only flag (always False now).
        """
        hour = start_time.hour
        weekday = date.weekday()  # 0=Monday, 6=Sunday
        
        # Sunday special handling
        if weekday == 6:  # Sunday
            # Emergency-only: 06:00–09:00, 18:00–22:00
            if (6 <= hour < 9) or (18 <= hour < 22):
                return {'category': 'emergency', 'is_express_only': False}
            # Express-only: 09:00–18:00 (if provider opts in)
            elif 9 <= hour < 18:
                return {'category': 'express', 'is_express_only': False}
            # Night Hours: 23:00 – 06:00 (Emergency by default)
            elif (hour >= 23) or (hour < 6):
                return {'category': 'emergency', 'is_express_only': False}
            else:
                return {'category': 'normal', 'is_express_only': False}
        
        # Weekdays (Mon-Fri)
        elif weekday < 5:
            # Normal Slots: 09:00 – 18:00
            if 9 <= hour < 18:
                return {'category': 'normal', 'is_express_only': False}
            # Express Slots: Early Morning (07:00 – 09:00) and Evening Peak (18:00 – 21:00)
            elif (7 <= hour < 9) or (18 <= hour < 21):
                return {'category': 'express', 'is_express_only': False}
            # Urgent Express Slots: Late Night (22:00 – 23:00)
            elif 22 <= hour < 23:
                return {'category': 'urgent_express', 'is_express_only': False}
            # Emergency Slots: Night Hours (23:00 – 06:00) and Early Morning (06:00–07:00)
            elif (hour >= 23) or (hour < 7):
                return {'category': 'emergency', 'is_express_only': False}
            else:
                return {'category': 'normal', 'is_express_only': False}
        
        # Saturday
        else:  # Saturday (weekday == 5)
            # Normal Slots: 09:00 – 18:00
            if 9 <= hour < 18:
                return {'category': 'normal', 'is_express_only': False}
            # Express Slots: Late Evening (18:00 – 21:00)
            elif 18 <= hour < 21:
                return {'category': 'express', 'is_express_only': False}
            # Urgent Express Slots: Late Evening (21:00 – 22:00)
            elif 21 <= hour < 22:
                return {'category': 'urgent_express', 'is_express_only': False}
            # Emergency Slots: Night Hours (23:00 – 06:00) and Early Morning (06:00–07:00)
            elif (hour >= 23) or (hour < 7):
                return {'category': 'emergency', 'is_express_only': False}
            # Early Morning: 07:00 – 09:00 (Normal)
            elif 7 <= hour < 9:
                return {'category': 'normal', 'is_express_only': False}
            else:
                return {'category': 'normal', 'is_express_only': False}

    def _calculate_rush_percentage_by_category(self, category):
        """Calculate rush fee percentage based on slot category"""
        fee_map = {
            'normal': 0.0,
            'express': 60.0,      # Average of 50-75%
            'urgent_express': 75.0,
            'emergency': 100.0
        }
        return fee_map.get(category, 0.0)

    def _generate_slot_note_by_category(self, category, start_time):
        """Generate helpful notes for time slots based on category"""
        notes = {
            'normal': "Standard service hours",
            'express': "Express service - Priority scheduling (+60% fee)",
            'urgent_express': "Urgent express service - High priority (+75% fee)",
            'emergency': "Emergency service - Immediate response (+100% fee)"
        }
        return notes.get(category, "Service slot")