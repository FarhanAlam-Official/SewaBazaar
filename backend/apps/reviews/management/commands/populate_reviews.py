from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.reviews.models import Review
from apps.bookings.models import Booking
from apps.services.models import Service
from django.utils import timezone
from datetime import timedelta
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Populate sample reviews for testing purposes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=10,
            help='Number of reviews to create (default: 10)'
        )
        parser.add_argument(
            '--customer-email',
            type=str,
            help='Email of specific customer to create reviews for'
        )
        parser.add_argument(
            '--provider-email',
            type=str,
            help='Email of specific provider to create reviews for'
        )
        parser.add_argument(
            '--service-id',
            type=int,
            help='ID of specific service to create reviews for'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear all existing reviews before populating'
        )

    def handle(self, *args, **options):
        count = options['count']
        customer_email = options['customer_email']
        provider_email = options['provider_email']
        service_id = options['service_id']
        clear = options['clear']
        
        self.stdout.write(f"Populating {count} sample reviews...")
        
        # Clear existing reviews if requested
        if clear:
            self.stdout.write("Clearing existing reviews...")
            Review.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("Cleared all existing reviews"))
        
        # Get or create customer
        if customer_email:
            try:
                customer = User.objects.get(email=customer_email, role='customer')
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f"Customer with email {customer_email} not found")
                )
                return
        else:
            # Try to get an existing customer or create one
            customer = User.objects.filter(role='customer').first()
            if not customer:
                customer = User.objects.create_user(
                    username='test_customer',
                    email='test_customer@example.com',
                    password='testpass123',
                    first_name='Test',
                    last_name='Customer',
                    role='customer'
                )
                self.stdout.write(f"Created test customer: {customer.email}")
            else:
                self.stdout.write(f"Using existing customer: {customer.email}")
        
        # Get or create provider
        if provider_email:
            try:
                provider = User.objects.get(email=provider_email, role='provider')
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f"Provider with email {provider_email} not found")
                )
                return
        else:
            # Try to get an existing provider or create one
            provider = User.objects.filter(role='provider').first()
            if not provider:
                provider = User.objects.create_user(
                    username='test_provider',
                    email='test_provider@example.com',
                    password='testpass123',
                    first_name='Test',
                    last_name='Provider',
                    role='provider'
                )
                self.stdout.write(f"Created test provider: {provider.email}")
            else:
                self.stdout.write(f"Using existing provider: {provider.email}")
        
        # Get or create service
        if service_id:
            try:
                service = Service.objects.get(id=service_id)
            except Service.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f"Service with ID {service_id} not found")
                )
                return
        else:
            # Try to get an existing service or create one
            service = Service.objects.first()
            if not service:
                service = Service.objects.create(
                    title='Test Service',
                    description='A test service for review population',
                    price=100.00,
                    category_id=1,  # Assuming category 1 exists
                    provider=provider
                )
                self.stdout.write(f"Created test service: {service.title}")
            else:
                self.stdout.write(f"Using existing service: {service.title}")
        
        # Ensure the provider is correctly set for the service
        if service.provider != provider:
            service.provider = provider
            service.save()
            self.stdout.write(f"Updated service provider to: {provider.email}")
        
        # Create sample reviews
        sample_comments = [
            "Great service! Highly recommended.",
            "The provider was professional and on time.",
            "Good value for money. Will use again.",
            "Satisfied with the quality of work.",
            "Excellent communication throughout the process.",
            "The service met my expectations.",
            "Professional and efficient service.",
            "Very pleased with the results.",
            "Good experience overall.",
            "Would definitely recommend to others.",
            "Outstanding work and attention to detail.",
            "Prompt service and friendly provider.",
            "Exceeded my expectations. Great job!",
            "Quality work at a reasonable price.",
            "Will definitely hire again for future needs."
        ]
        
        created_count = 0
        for i in range(count):
            # Create a booking first (required for review)
            booking_date = timezone.now().date() - timedelta(days=random.randint(1, 30))
            booking_time = timezone.datetime.strptime(f"{random.randint(9, 17)}:00", "%H:%M").time()
            
            # Check if a booking already exists for this combination
            booking = Booking.objects.filter(
                customer=customer,
                service=service,
                booking_date=booking_date,
                booking_time=booking_time
            ).first()
            
            # If no booking exists, create one
            if not booking:
                booking = Booking.objects.create(
                    customer=customer,
                    service=service,
                    booking_date=booking_date,
                    booking_time=booking_time,
                    address=f"Test Address {i+1}",
                    city="Test City",
                    phone=f"98{random.randint(10000000, 99999999)}",
                    status='completed',
                    price=service.price,
                    total_amount=service.price,
                    booking_step='completed'
                )
            
            # Check if a review already exists for this booking
            existing_review = Review.objects.filter(booking=booking).first()
            if existing_review:
                self.stdout.write(f"Review already exists for booking {booking.id}, skipping...")
                continue
            
            # Create the review
            rating = random.randint(3, 5)  # Most reviews are positive
            comment = random.choice(sample_comments)
            
            Review.objects.create(
                customer=customer,
                provider=provider,
                booking=booking,
                rating=rating,
                comment=comment
            )
            
            created_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f"Successfully created {created_count} sample reviews!")
        )
        self.stdout.write(
            f"Customer: {customer.email}"
        )
        self.stdout.write(
            f"Provider: {provider.email}"
        )
        self.stdout.write(
            f"Service: {service.title}"
        )