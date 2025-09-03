from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
import random
from datetime import date, timedelta, time

from apps.services.models import City, ServiceCategory, Service, ServiceAvailability, Favorite
from apps.accounts.models import Profile
from apps.bookings.models import Booking
from apps.reviews.models import Review

User = get_user_model()

class Command(BaseCommand):
    help = 'Populate database with sample data for SewaBazaar'

    def handle(self, *args, **options):
        self.stdout.write('Starting to populate sample data...')
        
        # Create cities
        cities = self.create_cities()
        
        # Create service categories
        categories = self.create_service_categories()
        
        # Create users (customers and providers)
        customers, providers = self.create_users(cities)
        
        # Create services
        services = self.create_services(categories, providers, cities)
        
        # Create bookings
        bookings = self.create_bookings(customers, services)
        
        # Create reviews
        reviews = self.create_reviews(customers, services)
        
        # Create favorites
        self.create_favorites(customers, services)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created:\n'
                f'- {len(cities)} cities\n'
                f'- {len(categories)} service categories\n'
                f'- {len(customers)} customers\n'
                f'- {len(providers)} service providers\n'
                f'- {len(services)} services\n'
                f'- {len(bookings)} bookings\n'
                f'- {len(reviews)} reviews\n'
                f'- Sample favorites'
            )
        )

    def create_cities(self):
        cities_data = [
            {'name': 'Kathmandu', 'region': 'Bagmati'},
            {'name': 'Pokhara', 'region': 'Gandaki'},
            {'name': 'Lalitpur', 'region': 'Bagmati'},
            {'name': 'Bhaktapur', 'region': 'Bagmati'},
            {'name': 'Biratnagar', 'region': 'Koshi'},
            {'name': 'Birgunj', 'region': 'Madhesh'},
            {'name': 'Dharan', 'region': 'Koshi'},
            {'name': 'Nepalgunj', 'region': 'Lumbini'},
            {'name': 'Butwal', 'region': 'Lumbini'},
            {'name': 'Hetauda', 'region': 'Bagmati'},
        ]
        
        cities = []
        for city_data in cities_data:
            city, created = City.objects.get_or_create(
                name=city_data['name'],
                defaults={'region': city_data['region']}
            )
            cities.append(city)
            if created:
                self.stdout.write(f'Created city: {city.name}')
        
        return cities

    def create_service_categories(self):
        categories_data = [
            {
                'title': 'Plumbing',
                'description': 'Professional plumbing services for homes and businesses',
                'icon': '🔧'
            },
            {
                'title': 'Cleaning',
                'description': 'House cleaning, office cleaning, and deep cleaning services',
                'icon': '🧹'
            },
            {
                'title': 'Beauty & Wellness',
                'description': 'Hair styling, makeup, spa, and wellness services',
                'icon': '💇‍♀️'
            },
            {
                'title': 'Electrical',
                'description': 'Electrical installation, repair, and maintenance services',
                'icon': '⚡'
            },
            {
                'title': 'Carpentry',
                'description': 'Woodwork, furniture repair, and carpentry services',
                'icon': '🪚'
            },
            {
                'title': 'Painting',
                'description': 'Interior and exterior painting services',
                'icon': '🎨'
            },
            {
                'title': 'Gardening',
                'description': 'Landscaping, gardening, and plant care services',
                'icon': '🌱'
            },
            {
                'title': 'Tutoring',
                'description': 'Academic tutoring and educational services',
                'icon': '📚'
            },
            {
                'title': 'Photography',
                'description': 'Professional photography and videography services',
                'icon': '📸'
            },
            {
                'title': 'Catering',
                'description': 'Event catering and food services',
                'icon': '🍽️'
            },
        ]
        
        categories = []
        for cat_data in categories_data:
            category, created = ServiceCategory.objects.get_or_create(
                title=cat_data['title'],
                defaults={
                    'description': cat_data['description'],
                    'icon': cat_data['icon']
                }
            )
            categories.append(category)
            if created:
                self.stdout.write(f'Created category: {category.title}')
        
        return categories

    def create_users(self, cities):
        # Create customers
        customers_data = [
            {'first_name': 'Aarav', 'last_name': 'Sharma', 'email': 'aarav.sharma@email.com', 'phone': '9841234567'},
            {'first_name': 'Priya', 'last_name': 'Thapa', 'email': 'priya.thapa@email.com', 'phone': '9842345678'},
            {'first_name': 'Rohan', 'last_name': 'Gurung', 'email': 'rohan.gurung@email.com', 'phone': '9843456789'},
            {'first_name': 'Anjali', 'last_name': 'Tamang', 'email': 'anjali.tamang@email.com', 'phone': '9844567890'},
            {'first_name': 'Suresh', 'last_name': 'Rai', 'email': 'suresh.rai@email.com', 'phone': '9845678901'},
            {'first_name': 'Maya', 'last_name': 'Lama', 'email': 'maya.lama@email.com', 'phone': '9846789012'},
            {'first_name': 'Bikash', 'last_name': 'Magar', 'email': 'bikash.magar@email.com', 'phone': '9847890123'},
            {'first_name': 'Sita', 'last_name': 'Karki', 'email': 'sita.karki@email.com', 'phone': '9848901234'},
        ]
        
        customers = []
        for user_data in customers_data:
            try:
                user = User.objects.get(email=user_data['email'])
                self.stdout.write(f'Customer already exists: {user.email}')
            except User.DoesNotExist:
                user = User.objects.create_user(
                    username=user_data['email'],
                    email=user_data['email'],
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name'],
                    phone=user_data['phone'],
                    role='customer',
                    is_verified=True,
                    password='password123'
                )
                
                # Create profile
                Profile.objects.get_or_create(
                    user=user,
                    defaults={
                        'bio': f"I'm {user.first_name}, a customer looking for quality services.",
                        'address': f"Sample address in {random.choice(cities).name}",
                        'city': random.choice(cities).name,
                    }
                )
                
                self.stdout.write(f'Created customer: {user.email}')
            customers.append(user)
        
        # Create service providers
        providers_data = [
            {
                'first_name': 'Rajesh', 'last_name': 'Kumar', 'email': 'rajesh.kumar@provider.com',
                'phone': '9851234567', 'company': 'Kumar Plumbing Services'
            },
            {
                'first_name': 'Sunita', 'last_name': 'Devi', 'email': 'sunita.devi@provider.com',
                'phone': '9852345678', 'company': 'Sunita Cleaning Solutions'
            },
            {
                'first_name': 'Mohan', 'last_name': 'Singh', 'email': 'mohan.singh@provider.com',
                'phone': '9853456789', 'company': 'Singh Electrical Works'
            },
            {
                'first_name': 'Lakshmi', 'last_name': 'Pandey', 'email': 'lakshmi.pandey@provider.com',
                'phone': '9854567890', 'company': 'Pandey Beauty Salon'
            },
            {
                'first_name': 'Hari', 'last_name': 'Bhattarai', 'email': 'hari.bhattarai@provider.com',
                'phone': '9855678901', 'company': 'Bhattarai Carpentry'
            },
            {
                'first_name': 'Gita', 'last_name': 'Shrestha', 'email': 'gita.shrestha@provider.com',
                'phone': '9856789012', 'company': 'Shrestha Painting Services'
            },
            {
                'first_name': 'Ram', 'last_name': 'Yadav', 'email': 'ram.yadav@provider.com',
                'phone': '9857890123', 'company': 'Yadav Garden Care'
            },
            {
                'first_name': 'Sita', 'last_name': 'Khadka', 'email': 'sita.khadka@provider.com',
                'phone': '9858901234', 'company': 'Khadka Tutoring Center'
            },
        ]
        
        providers = []
        for user_data in providers_data:
            try:
                user = User.objects.get(email=user_data['email'])
                self.stdout.write(f'Provider already exists: {user.email}')
            except User.DoesNotExist:
                user = User.objects.create_user(
                    username=user_data['email'],
                    email=user_data['email'],
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name'],
                    phone=user_data['phone'],
                    role='provider',
                    is_verified=True,
                    password='password123'
                )
                
                # Create profile
                profile, created = Profile.objects.get_or_create(
                    user=user,
                    defaults={
                        'bio': f"I'm {user.first_name}, a professional service provider with years of experience.",
                        'address': f"Professional address in {random.choice(cities).name}",
                        'city': random.choice(cities).name,
                        'company_name': user_data['company'],
                        'is_approved': True,
                    }
                )
                # Add service areas if profile was just created
                if created:
                    profile.service_areas.add(*random.sample(cities, min(3, len(cities))))
                
                self.stdout.write(f'Created provider: {user.email}')
            providers.append(user)
        
        return customers, providers

    def create_services(self, categories, providers, cities):
        services_data = [
            {
                'title': 'Professional Home Plumbing Repair',
                'description': 'Expert plumbing services including pipe repair, faucet installation, and drain cleaning. Licensed and insured professionals.',
                'short_description': 'Reliable plumbing repair and installation services',
                'price': Decimal('2500.00'),
                'duration': '2-3 hours',
                'category': 'Plumbing',
                'includes': 'Pipe repair, faucet installation, drain cleaning, leak detection',
                'excludes': 'Major plumbing system replacement, septic tank work'
            },
            {
                'title': 'Deep House Cleaning Service',
                'description': 'Comprehensive house cleaning including kitchen, bathroom, living areas, and bedrooms. Eco-friendly cleaning products used.',
                'short_description': 'Thorough house cleaning with eco-friendly products',
                'price': Decimal('3500.00'),
                'duration': '4-5 hours',
                'category': 'Cleaning',
                'includes': 'Kitchen cleaning, bathroom sanitization, dusting, vacuuming, mopping',
                'excludes': 'Window cleaning, carpet deep cleaning, outdoor cleaning'
            },
            {
                'title': 'Professional Hair Styling & Makeup',
                'description': 'Professional hair styling and makeup services for special occasions. Experienced stylists with premium products.',
                'short_description': 'Professional hair and makeup for special events',
                'price': Decimal('4500.00'),
                'duration': '2-3 hours',
                'category': 'Beauty & Wellness',
                'includes': 'Hair styling, makeup application, consultation, touch-ups',
                'excludes': 'Hair coloring, extensions, nail services'
            },
            {
                'title': 'Electrical Installation & Repair',
                'description': 'Complete electrical services including wiring, fixture installation, and electrical repairs. Certified electricians.',
                'short_description': 'Professional electrical installation and repair',
                'price': Decimal('3000.00'),
                'duration': '3-4 hours',
                'category': 'Electrical',
                'includes': 'Wiring installation, fixture installation, electrical repairs, safety inspection',
                'excludes': 'Major electrical panel upgrades, commercial installations'
            },
            {
                'title': 'Custom Furniture Repair & Restoration',
                'description': 'Expert carpentry services for furniture repair, restoration, and custom woodwork. Quality craftsmanship guaranteed.',
                'short_description': 'Professional furniture repair and woodwork',
                'price': Decimal('4000.00'),
                'duration': '4-6 hours',
                'category': 'Carpentry',
                'includes': 'Furniture repair, wood restoration, custom woodwork, finishing',
                'excludes': 'Large furniture construction, outdoor structures'
            },
            {
                'title': 'Interior & Exterior Painting',
                'description': 'Professional painting services for both interior and exterior surfaces. Quality paints and expert application.',
                'short_description': 'Professional interior and exterior painting',
                'price': Decimal('8000.00'),
                'duration': '6-8 hours',
                'category': 'Painting',
                'includes': 'Surface preparation, painting, cleanup, touch-ups',
                'excludes': 'Wallpaper installation, decorative painting, commercial spaces'
            },
            {
                'title': 'Garden Design & Maintenance',
                'description': 'Complete garden design, landscaping, and maintenance services. Create and maintain beautiful outdoor spaces.',
                'short_description': 'Professional garden design and maintenance',
                'price': Decimal('5000.00'),
                'duration': '4-5 hours',
                'category': 'Gardening',
                'includes': 'Garden design, planting, pruning, maintenance, irrigation',
                'excludes': 'Tree removal, large landscaping projects, commercial gardens'
            },
            {
                'title': 'Academic Tutoring - All Subjects',
                'description': 'Comprehensive academic tutoring for all subjects and grade levels. Experienced educators with personalized approach.',
                'short_description': 'Professional academic tutoring services',
                'price': Decimal('1500.00'),
                'duration': '1-2 hours',
                'category': 'Tutoring',
                'includes': 'Subject tutoring, homework help, exam preparation, progress tracking',
                'excludes': 'Online classes, group sessions, specialized test prep'
            },
            {
                'title': 'Professional Photography Session',
                'description': 'Professional photography services for events, portraits, and special occasions. High-quality equipment and editing.',
                'short_description': 'Professional photography for events and portraits',
                'price': Decimal('12000.00'),
                'duration': '3-4 hours',
                'category': 'Photography',
                'includes': 'Photography session, photo editing, digital delivery, prints',
                'excludes': 'Video recording, drone photography, commercial shoots'
            },
            {
                'title': 'Event Catering Service',
                'description': 'Professional catering services for events, parties, and special occasions. Delicious food with professional service.',
                'short_description': 'Professional catering for events and parties',
                'price': Decimal('15000.00'),
                'duration': '6-8 hours',
                'category': 'Catering',
                'includes': 'Menu planning, food preparation, serving, cleanup',
                'excludes': 'Alcohol service, large commercial events, outdoor catering'
            },
        ]
        
        services = []
        for service_data in services_data:
            category = next(cat for cat in categories if cat.title == service_data['category'])
            provider = random.choice(providers)
            
            service, created = Service.objects.get_or_create(
                title=service_data['title'],
                defaults={
                    'description': service_data['description'],
                    'short_description': service_data['short_description'],
                    'price': service_data['price'],
                    'duration': service_data['duration'],
                    'category': category,
                    'provider': provider,
                    'includes': service_data['includes'],
                    'excludes': service_data['excludes'],
                    'status': 'active',
                    'is_featured': random.choice([True, False]),
                }
            )
            
            if created:
                # Add cities
                service.cities.add(*random.sample(cities, min(3, len(cities))))
                
                # Create availability
                self.create_service_availability(service)
                
                self.stdout.write(f'Created service: {service.title}')
            services.append(service)
        
        return services

    def create_service_availability(self, service):
        days = [0, 1, 2, 3, 4, 5, 6]  # Monday to Sunday
        for day in random.sample(days, 5):  # Available 5 days a week
            ServiceAvailability.objects.create(
                service=service,
                day_of_week=day,
                start_time=time(9, 0),  # 9:00 AM
                end_time=time(18, 0),   # 6:00 PM
                is_available=True
            )

    def create_bookings(self, customers, services):
        bookings = []
        statuses = ['pending', 'confirmed', 'completed', 'cancelled']
        
        for _ in range(20):  # Create 20 sample bookings
            customer = random.choice(customers)
            service = random.choice(services)
            status = random.choice(statuses)
            
            # Generate random booking date (within last 30 days and next 30 days)
            days_ago = random.randint(-30, 30)
            booking_date = date.today() + timedelta(days=days_ago)
            
            # Generate random booking time
            hour = random.randint(9, 17)  # 9 AM to 5 PM
            minute = random.choice([0, 15, 30, 45])
            booking_time = time(hour, minute)
            
            # Calculate price with potential discount
            price = service.price
            discount = Decimal('0.00')
            if random.random() < 0.3:  # 30% chance of discount
                discount = price * Decimal('0.1')  # 10% discount
            
            booking = Booking.objects.create(
                customer=customer,
                service=service,
                booking_date=booking_date,
                booking_time=booking_time,
                address=f"Sample address in {random.choice(service.cities.all()).name}",
                city=random.choice(service.cities.all()).name,
                phone=customer.phone,
                note=random.choice([
                    "Please call before arrival",
                    "Gate code: 1234",
                    "Parking available in front",
                    "Ring doorbell twice",
                    "Enter through back door",
                    None, None, None  # 50% chance of no note
                ]),
                status=status,
                price=price,
                discount=discount,
                total_amount=price - discount,
            )
            
            if status == 'cancelled':
                booking.cancellation_reason = random.choice([
                    "Customer requested cancellation",
                    "Provider unavailable",
                    "Weather conditions",
                    "Emergency situation"
                ])
                booking.save()
            
            bookings.append(booking)
        
        return bookings

    def create_reviews(self, customers, services):
        reviews = []
        
        for service in services:
            # Create 1-4 reviews per service
            num_reviews = random.randint(1, 4)
            service_customers = random.sample(customers, min(num_reviews, len(customers)))
            
            for customer in service_customers:
                rating = random.randint(3, 5)  # Mostly positive reviews
                comments = [
                    "Excellent service! Very professional and punctual.",
                    "Great work quality. Highly recommended!",
                    "Very satisfied with the service. Will book again.",
                    "Professional and reliable service provider.",
                    "Good communication and quality work.",
                    "Punctual and professional. Good value for money.",
                    "Satisfied with the work done. Thank you!",
                    "Very helpful and skilled professional.",
                    "Great experience overall. Recommended!",
                    "Quality service at reasonable price."
                ]
                
                review = Review.objects.create(
                    customer=customer,
                    service=service,
                    rating=rating,
                    comment=random.choice(comments)
                )
                reviews.append(review)
        
        return reviews

    def create_favorites(self, customers, services):
        for customer in customers:
            # Each customer favorites 2-4 services
            favorite_services = random.sample(services, min(random.randint(2, 4), len(services)))
            for service in favorite_services:
                Favorite.objects.get_or_create(
                    user=customer,
                    service=service
                )
