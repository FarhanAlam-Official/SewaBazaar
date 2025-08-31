from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta, time, date
from apps.accounts.models import User
from apps.services.models import Service
from apps.bookings.models import ProviderAvailability, BookingSlot
from apps.bookings.services import TimeSlotService


class Command(BaseCommand):
    help = 'Create time slots for services by setting up provider availability'

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

    def handle(self, *args, **options):
        days_to_create = options['days']
        specific_provider_id = options.get('provider_id')
        
        self.stdout.write("🔍 Checking existing data...")
        
        # Get providers
        if specific_provider_id:
            providers = User.objects.filter(id=specific_provider_id, role='provider')
            if not providers.exists():
                self.stdout.write(
                    self.style.ERROR(f"Provider with ID {specific_provider_id} not found")
                )
                return
        else:
            providers = User.objects.filter(role='provider')
        
        # Get services
        services = Service.objects.filter(provider__in=providers)
        
        self.stdout.write(f"📊 Found {providers.count()} providers and {services.count()} services")
        
        if providers.count() == 0:
            self.stdout.write(
                self.style.WARNING("No providers found. Creating demo provider...")
            )
            # Create a demo provider if none exist
            provider = User.objects.create_user(
                email='demo.provider@sewabazaar.com',
                password='demo123',
                first_name='Demo',
                last_name='Provider',
                role='provider',
                phone='9800000000'
            )
            self.stdout.write(f"✅ Created demo provider: {provider.email}")
            providers = [provider]
        
        if services.count() == 0:
            self.stdout.write(
                self.style.WARNING("No services found. Please create services first.")
            )
            return
        
        # Create provider availability for each provider
        self.stdout.write("⏰ Setting up provider availability...")
        
        for provider in providers:
            self.stdout.write(f"  Setting availability for {provider.email}")
            
            # Check if provider already has availability
            existing_availability = ProviderAvailability.objects.filter(provider=provider)
            if existing_availability.exists():
                self.stdout.write(f"    ✅ Provider already has {existing_availability.count()} availability slots")
                continue
            
            # Create weekly availability (Monday to Saturday, 9 AM to 6 PM)
            weekdays = [
                (0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'), 
                (3, 'Thursday'), (4, 'Friday'), (5, 'Saturday')
            ]
            
            for weekday, day_name in weekdays:
                availability = ProviderAvailability.objects.create(
                    provider=provider,
                    weekday=weekday,
                    start_time=time(9, 0),  # 9:00 AM
                    end_time=time(18, 0),   # 6:00 PM
                    break_start=time(12, 0),  # 12:00 PM
                    break_end=time(13, 0),    # 1:00 PM
                    is_available=True
                )
                self.stdout.write(f"    ✅ Created {day_name} availability: 9:00 AM - 6:00 PM")
        
        # Generate booking slots for the next N days
        self.stdout.write(f"📅 Generating booking slots for the next {days_to_create} days...")
        
        start_date = date.today()
        end_date = start_date + timedelta(days=days_to_create)
        
        total_slots_created = 0
        
        for service in services:
            self.stdout.write(f"  Creating slots for: {service.title}")
            
            # Check if service already has slots
            existing_slots = BookingSlot.objects.filter(
                service=service,
                date__gte=start_date,
                date__lte=end_date
            )
            
            if existing_slots.exists():
                self.stdout.write(f"    ⚠️  Service already has {existing_slots.count()} slots")
                continue
            
            # Generate slots using TimeSlotService
            try:
                created_slots = TimeSlotService.generate_slots_from_availability(
                    provider=service.provider,
                    service=service,
                    start_date=start_date,
                    end_date=end_date
                )
                
                slots_count = len(created_slots)
                total_slots_created += slots_count
                
                self.stdout.write(f"    ✅ Created {slots_count} booking slots")
                
                # Show sample of created slots
                if created_slots:
                    sample_slot = created_slots[0]
                    self.stdout.write(f"    📍 Sample slot: {sample_slot.date} {sample_slot.start_time}-{sample_slot.end_time}")
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"    ❌ Failed to create slots: {str(e)}")
                )
        
        self.stdout.write(
            self.style.SUCCESS(f"\n🎉 Successfully created {total_slots_created} booking slots!")
        )
        
        # Show summary
        self.stdout.write("\n📊 Summary:")
        self.stdout.write(f"  - Providers with availability: {ProviderAvailability.objects.values('provider').distinct().count()}")
        self.stdout.write(f"  - Services with slots: {BookingSlot.objects.values('service').distinct().count()}")
        self.stdout.write(f"  - Total booking slots: {BookingSlot.objects.count()}")
        
        # Show next available slots for testing
        self.stdout.write("\n🔍 Next available slots (for testing):")
        next_slots = BookingSlot.objects.filter(
            date__gte=date.today(),
            is_available=True
        ).order_by('date', 'start_time')[:5]
        
        for slot in next_slots:
            rush_indicator = " (RUSH)" if slot.is_rush else ""
            self.stdout.write(
                f"  - {slot.service.title}: {slot.date} {slot.start_time}-{slot.end_time}{rush_indicator}"
            )