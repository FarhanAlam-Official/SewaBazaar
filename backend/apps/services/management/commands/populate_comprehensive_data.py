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
from apps.notifications.models import Notification

User = get_user_model()

class Command(BaseCommand):
    help = 'Populate database with comprehensive sample data for SewaBazaar (50+ records each)'

    def handle(self, *args, **options):
        self.stdout.write('Starting comprehensive data population...')
        
        # Create cities
        cities = self.create_cities()
        
        # Create service categories
        categories = self.create_service_categories()
        
        # Create users (customers, providers, admins)
        customers, providers, admins = self.create_users(cities)
        
        # Create services
        services = self.create_services(categories, providers, cities)
        
        # Create bookings
        bookings = self.create_bookings(customers, services)
        
        # Create reviews
        reviews = self.create_reviews(customers, services)
        
        # Create favorites
        self.create_favorites(customers, services)
        
        # Create notifications
        notifications = self.create_notifications(customers, providers, admins, bookings, reviews)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created:\n'
                f'- {len(cities)} cities\n'
                f'- {len(categories)} service categories\n'
                f'- {len(customers)} customers\n'
                f'- {len(providers)} service providers\n'
                f'- {len(admins)} admins\n'
                f'- {len(services)} services\n'
                f'- {len(bookings)} bookings\n'
                f'- {len(reviews)} reviews\n'
                f'- {len(notifications)} notifications\n'
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
            {'name': 'Janakpur', 'region': 'Madhesh'},
            {'name': 'Dhangadhi', 'region': 'Sudurpaschim'},
            {'name': 'Bharatpur', 'region': 'Bagmati'},
            {'name': 'Itahari', 'region': 'Koshi'},
            {'name': 'Damak', 'region': 'Koshi'},
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
            {'title': 'Plumbing', 'description': 'Professional plumbing services', 'icon': '🔧'},
            {'title': 'Cleaning', 'description': 'House and office cleaning services', 'icon': '🧹'},
            {'title': 'Beauty & Wellness', 'description': 'Hair, makeup, and wellness services', 'icon': '💇‍♀️'},
            {'title': 'Electrical', 'description': 'Electrical installation and repair', 'icon': '⚡'},
            {'title': 'Carpentry', 'description': 'Woodwork and furniture services', 'icon': '🪚'},
            {'title': 'Painting', 'description': 'Interior and exterior painting', 'icon': '🎨'},
            {'title': 'Gardening', 'description': 'Landscaping and garden maintenance', 'icon': '🌱'},
            {'title': 'Tutoring', 'description': 'Academic tutoring services', 'icon': '📚'},
            {'title': 'Photography', 'description': 'Professional photography services', 'icon': '📸'},
            {'title': 'Catering', 'description': 'Event catering services', 'icon': '🍽️'},
            {'title': 'Moving', 'description': 'Home and office moving services', 'icon': '📦'},
            {'title': 'Pet Care', 'description': 'Pet grooming and care services', 'icon': '🐕'},
            {'title': 'Technology', 'description': 'IT and computer services', 'icon': '💻'},
            {'title': 'Fitness', 'description': 'Personal training and fitness', 'icon': '💪'},
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
        # Create 50 customers
        customers_data = []
        for i in range(50):
            first_names = ['Aarav', 'Priya', 'Rohan', 'Anjali', 'Suresh', 'Maya', 'Bikash', 'Sita', 'Raj', 'Neha', 
                          'Amit', 'Pooja', 'Vikram', 'Kavita', 'Deepak', 'Sunita', 'Mohan', 'Rekha', 'Sanjay', 'Meera']
            last_names = ['Sharma', 'Thapa', 'Gurung', 'Tamang', 'Rai', 'Lama', 'Magar', 'Karki', 'Kumar', 'Devi',
                         'Singh', 'Pandey', 'Bhattarai', 'Shrestha', 'Yadav', 'Khadka', 'Gautam', 'Joshi', 'Adhikari', 'Bista']
            
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            email = f"{first_name.lower()}.{last_name.lower()}{i+1}@email.com"
            phone = f"984{random.randint(1000000, 9999999)}"
            
            customers_data.append({
                'first_name': first_name,
                'last_name': last_name,
                'email': email,
                'phone': phone
            })
        
        customers = []
        for user_data in customers_data:
            try:
                user = User.objects.get(email=user_data['email'])
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
                
                Profile.objects.get_or_create(
                    user=user,
                    defaults={
                        'bio': f"I'm {user.first_name}, a customer looking for quality services.",
                        'address': f"Sample address in {random.choice(cities).name}",
                        'city': random.choice(cities).name,
                    }
                )
            customers.append(user)
        
        # Create 50 service providers
        providers_data = []
        for i in range(50):
            first_names = ['Rajesh', 'Sunita', 'Mohan', 'Lakshmi', 'Hari', 'Gita', 'Ram', 'Sita', 'Krishna', 'Radha',
                          'Vishnu', 'Durga', 'Shiva', 'Parvati', 'Ganesh', 'Saraswati', 'Brahma', 'Lakshmi', 'Kartik', 'Gauri']
            last_names = ['Kumar', 'Devi', 'Singh', 'Pandey', 'Bhattarai', 'Shrestha', 'Yadav', 'Khadka', 'Gautam', 'Joshi',
                         'Adhikari', 'Bista', 'Rana', 'Chhetri', 'Thapa', 'Gurung', 'Magar', 'Tamang', 'Rai', 'Lama']
            companies = ['Services', 'Solutions', 'Works', 'Care', 'Pro', 'Expert', 'Professional', 'Quality', 'Best', 'Premium']
            
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            company_suffix = random.choice(companies)
            email = f"{first_name.lower()}.{last_name.lower()}{i+1}@provider.com"
            phone = f"985{random.randint(1000000, 9999999)}"
            company = f"{first_name} {last_name} {company_suffix}"
            
            providers_data.append({
                'first_name': first_name,
                'last_name': last_name,
                'email': email,
                'phone': phone,
                'company': company
            })
        
        providers = []
        for user_data in providers_data:
            try:
                user = User.objects.get(email=user_data['email'])
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
                if created:
                    profile.service_areas.add(*random.sample(cities, min(3, len(cities))))
            providers.append(user)
        
        # Create 5 admins
        admins_data = [
            {'first_name': 'Admin', 'last_name': 'User', 'email': 'admin@sewabazaar.com', 'phone': '9800000001'},
            {'first_name': 'Super', 'last_name': 'Admin', 'email': 'superadmin@sewabazaar.com', 'phone': '9800000002'},
            {'first_name': 'System', 'last_name': 'Manager', 'email': 'manager@sewabazaar.com', 'phone': '9800000003'},
            {'first_name': 'Support', 'last_name': 'Team', 'email': 'support@sewabazaar.com', 'phone': '9800000004'},
            {'first_name': 'Moderator', 'last_name': 'User', 'email': 'moderator@sewabazaar.com', 'phone': '9800000005'},
        ]
        
        admins = []
        for user_data in admins_data:
            try:
                user = User.objects.get(email=user_data['email'])
            except User.DoesNotExist:
                user = User.objects.create_user(
                    username=user_data['email'],
                    email=user_data['email'],
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name'],
                    phone=user_data['phone'],
                    role='admin',
                    is_verified=True,
                    is_staff=True,
                    is_superuser=True,
                    password='admin123'
                )
            admins.append(user)
        
        return customers, providers, admins

    def create_services(self, categories, providers, cities):
        services_data = [
            # Plumbing Services
            {'title': 'Professional Home Plumbing Repair', 'price': 2500, 'duration': '2-3 hours', 'category': 'Plumbing'},
            {'title': 'Emergency Plumbing Services', 'price': 3500, 'duration': '1-2 hours', 'category': 'Plumbing'},
            {'title': 'Pipe Installation & Repair', 'price': 4000, 'duration': '3-4 hours', 'category': 'Plumbing'},
            {'title': 'Drain Cleaning Service', 'price': 1500, 'duration': '1-2 hours', 'category': 'Plumbing'},
            {'title': 'Water Heater Installation', 'price': 6000, 'duration': '4-5 hours', 'category': 'Plumbing'},
            
            # Cleaning Services
            {'title': 'Deep House Cleaning Service', 'price': 3500, 'duration': '4-5 hours', 'category': 'Cleaning'},
            {'title': 'Office Cleaning Service', 'price': 4500, 'duration': '6-8 hours', 'category': 'Cleaning'},
            {'title': 'Carpet Cleaning Service', 'price': 2000, 'duration': '2-3 hours', 'category': 'Cleaning'},
            {'title': 'Window Cleaning Service', 'price': 1800, 'duration': '2-3 hours', 'category': 'Cleaning'},
            {'title': 'Kitchen Deep Cleaning', 'price': 2500, 'duration': '3-4 hours', 'category': 'Cleaning'},
            
            # Beauty & Wellness
            {'title': 'Professional Hair Styling & Makeup', 'price': 4500, 'duration': '2-3 hours', 'category': 'Beauty & Wellness'},
            {'title': 'Bridal Makeup Service', 'price': 8000, 'duration': '4-5 hours', 'category': 'Beauty & Wellness'},
            {'title': 'Spa & Massage Therapy', 'price': 3000, 'duration': '1-2 hours', 'category': 'Beauty & Wellness'},
            {'title': 'Facial Treatment', 'price': 2000, 'duration': '1-2 hours', 'category': 'Beauty & Wellness'},
            {'title': 'Manicure & Pedicure', 'price': 1500, 'duration': '1-2 hours', 'category': 'Beauty & Wellness'},
            
            # Electrical Services
            {'title': 'Electrical Installation & Repair', 'price': 3000, 'duration': '3-4 hours', 'category': 'Electrical'},
            {'title': 'Emergency Electrical Repair', 'price': 4000, 'duration': '2-3 hours', 'category': 'Electrical'},
            {'title': 'LED Light Installation', 'price': 2500, 'duration': '2-3 hours', 'category': 'Electrical'},
            {'title': 'Electrical Safety Inspection', 'price': 2000, 'duration': '2-3 hours', 'category': 'Electrical'},
            {'title': 'Generator Installation', 'price': 12000, 'duration': '6-8 hours', 'category': 'Electrical'},
            
            # Carpentry Services
            {'title': 'Custom Furniture Repair & Restoration', 'price': 4000, 'duration': '4-6 hours', 'category': 'Carpentry'},
            {'title': 'Cabinet Installation', 'price': 6000, 'duration': '5-7 hours', 'category': 'Carpentry'},
            {'title': 'Door & Window Repair', 'price': 3000, 'duration': '3-4 hours', 'category': 'Carpentry'},
            {'title': 'Custom Woodwork', 'price': 8000, 'duration': '8-10 hours', 'category': 'Carpentry'},
            {'title': 'Furniture Assembly', 'price': 2000, 'duration': '2-3 hours', 'category': 'Carpentry'},
            
            # Painting Services
            {'title': 'Interior & Exterior Painting', 'price': 8000, 'duration': '6-8 hours', 'category': 'Painting'},
            {'title': 'Room Painting Service', 'price': 5000, 'duration': '4-5 hours', 'category': 'Painting'},
            {'title': 'Wall Texture & Design', 'price': 7000, 'duration': '5-6 hours', 'category': 'Painting'},
            {'title': 'Commercial Painting', 'price': 15000, 'duration': '8-10 hours', 'category': 'Painting'},
            {'title': 'Paint Consultation', 'price': 1000, 'duration': '1 hour', 'category': 'Painting'},
            
            # Gardening Services
            {'title': 'Garden Design & Maintenance', 'price': 5000, 'duration': '4-5 hours', 'category': 'Gardening'},
            {'title': 'Lawn Care Service', 'price': 3000, 'duration': '3-4 hours', 'category': 'Gardening'},
            {'title': 'Tree Pruning & Care', 'price': 4000, 'duration': '3-4 hours', 'category': 'Gardening'},
            {'title': 'Landscape Design', 'price': 10000, 'duration': '8-10 hours', 'category': 'Gardening'},
            {'title': 'Irrigation System Installation', 'price': 8000, 'duration': '6-8 hours', 'category': 'Gardening'},
            
            # Tutoring Services
            {'title': 'Academic Tutoring - All Subjects', 'price': 1500, 'duration': '1-2 hours', 'category': 'Tutoring'},
            {'title': 'Math & Science Tutoring', 'price': 1800, 'duration': '1-2 hours', 'category': 'Tutoring'},
            {'title': 'English Language Tutoring', 'price': 1200, 'duration': '1-2 hours', 'category': 'Tutoring'},
            {'title': 'Computer Programming Tutoring', 'price': 2500, 'duration': '2-3 hours', 'category': 'Tutoring'},
            {'title': 'Music & Arts Tutoring', 'price': 2000, 'duration': '1-2 hours', 'category': 'Tutoring'},
            
            # Photography Services
            {'title': 'Professional Photography Session', 'price': 12000, 'duration': '3-4 hours', 'category': 'Photography'},
            {'title': 'Wedding Photography', 'price': 25000, 'duration': '8-10 hours', 'category': 'Photography'},
            {'title': 'Event Photography', 'price': 8000, 'duration': '4-5 hours', 'category': 'Photography'},
            {'title': 'Portrait Photography', 'price': 5000, 'duration': '2-3 hours', 'category': 'Photography'},
            {'title': 'Product Photography', 'price': 6000, 'duration': '3-4 hours', 'category': 'Photography'},
            
            # Catering Services
            {'title': 'Event Catering Service', 'price': 15000, 'duration': '6-8 hours', 'category': 'Catering'},
            {'title': 'Wedding Catering', 'price': 30000, 'duration': '10-12 hours', 'category': 'Catering'},
            {'title': 'Corporate Event Catering', 'price': 20000, 'duration': '8-10 hours', 'category': 'Catering'},
            {'title': 'Home Party Catering', 'price': 12000, 'duration': '5-6 hours', 'category': 'Catering'},
            {'title': 'Custom Menu Planning', 'price': 5000, 'duration': '2-3 hours', 'category': 'Catering'},
            
            # Moving Services
            {'title': 'Home Moving Service', 'price': 15000, 'duration': '6-8 hours', 'category': 'Moving'},
            {'title': 'Office Relocation', 'price': 25000, 'duration': '8-10 hours', 'category': 'Moving'},
            {'title': 'Furniture Moving', 'price': 8000, 'duration': '4-5 hours', 'category': 'Moving'},
            {'title': 'Packing & Unpacking', 'price': 6000, 'duration': '4-6 hours', 'category': 'Moving'},
            {'title': 'Storage Solutions', 'price': 4000, 'duration': '2-3 hours', 'category': 'Moving'},
            
            # Pet Care Services
            {'title': 'Pet Grooming Service', 'price': 2000, 'duration': '2-3 hours', 'category': 'Pet Care'},
            {'title': 'Dog Walking Service', 'price': 800, 'duration': '1 hour', 'category': 'Pet Care'},
            {'title': 'Pet Sitting Service', 'price': 1500, 'duration': '2-3 hours', 'category': 'Pet Care'},
            {'title': 'Pet Training', 'price': 3000, 'duration': '2-3 hours', 'category': 'Pet Care'},
            {'title': 'Veterinary Care', 'price': 2500, 'duration': '1-2 hours', 'category': 'Pet Care'},
            
            # Technology Services
            {'title': 'Computer Repair Service', 'price': 2000, 'duration': '2-3 hours', 'category': 'Technology'},
            {'title': 'Network Setup & Configuration', 'price': 4000, 'duration': '3-4 hours', 'category': 'Technology'},
            {'title': 'Software Installation', 'price': 1500, 'duration': '1-2 hours', 'category': 'Technology'},
            {'title': 'Data Recovery Service', 'price': 3000, 'duration': '2-4 hours', 'category': 'Technology'},
            {'title': 'IT Consultation', 'price': 2500, 'duration': '2-3 hours', 'category': 'Technology'},
            
            # Fitness Services
            {'title': 'Personal Training Session', 'price': 2000, 'duration': '1-2 hours', 'category': 'Fitness'},
            {'title': 'Yoga Classes', 'price': 1500, 'duration': '1-2 hours', 'category': 'Fitness'},
            {'title': 'Gym Equipment Setup', 'price': 5000, 'duration': '3-4 hours', 'category': 'Fitness'},
            {'title': 'Nutrition Consultation', 'price': 1800, 'duration': '1-2 hours', 'category': 'Fitness'},
            {'title': 'Group Fitness Classes', 'price': 1200, 'duration': '1-2 hours', 'category': 'Fitness'},
        ]
        
        services = []
        for service_data in services_data:
            category = next(cat for cat in categories if cat.title == service_data['category'])
            provider = random.choice(providers)
            
            service, created = Service.objects.get_or_create(
                title=service_data['title'],
                defaults={
                    'description': f"Professional {service_data['title'].lower()} with experienced providers.",
                    'short_description': f"Quality {service_data['title'].lower()}",
                    'price': Decimal(str(service_data['price'])),
                    'duration': service_data['duration'],
                    'category': category,
                    'provider': provider,
                    'includes': 'Professional service, quality work, satisfaction guaranteed',
                    'excludes': 'Additional materials, travel outside service area',
                    'status': 'active',
                    'is_featured': random.choice([True, False]),
                }
            )
            
            if created:
                service.cities.add(*random.sample(cities, min(3, len(cities))))
                self.create_service_availability(service)
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
        
        for _ in range(100):  # Create 100 sample bookings
            customer = random.choice(customers)
            service = random.choice(services)
            status = random.choice(statuses)
            
            # Generate random booking date (within last 90 days and next 90 days)
            days_ago = random.randint(-90, 90)
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
                    "Please bring your own materials",
                    "Pet friendly home",
                    "Accessible entrance available",
                    None, None, None, None  # 60% chance of no note
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
                    "Emergency situation",
                    "Schedule conflict",
                    "Service not available in area"
                ])
                booking.save()
            
            bookings.append(booking)
        
        return bookings

    def create_reviews(self, customers, services):
        reviews = []
        
        for service in services:
            # Create 2-8 reviews per service
            num_reviews = random.randint(2, 8)
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
                    "Quality service at reasonable price.",
                    "Excellent attention to detail.",
                    "Very clean and organized work.",
                    "Friendly and professional service.",
                    "Exceeded my expectations.",
                    "Will definitely recommend to others.",
                    "Quick and efficient service.",
                    "Very knowledgeable and skilled.",
                    "Great customer service.",
                    "Work was completed on time.",
                    "Very reasonable pricing for the quality."
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
            # Each customer favorites 3-8 services
            favorite_services = random.sample(services, min(random.randint(3, 8), len(services)))
            for service in favorite_services:
                Favorite.objects.get_or_create(
                    user=customer,
                    service=service
                )

    def create_notifications(self, customers, providers, admins, bookings, reviews):
        notifications = []
        
        # Booking notifications
        for booking in bookings:
            # Customer notification
            customer_notification = Notification.objects.create(
                user=booking.customer,
                title=f"Booking {booking.status.title()}",
                message=f"Your booking for {booking.service.title} has been {booking.status}.",
                notification_type='booking',
                is_read=random.choice([True, False]),
                related_id=booking.id
            )
            notifications.append(customer_notification)
            
            # Provider notification
            provider_notification = Notification.objects.create(
                user=booking.service.provider,
                title=f"New Booking {booking.status.title()}",
                message=f"You have a {booking.status} booking for {booking.service.title}.",
                notification_type='booking',
                is_read=random.choice([True, False]),
                related_id=booking.id
            )
            notifications.append(provider_notification)
        
        # Review notifications
        for review in reviews:
            provider_notification = Notification.objects.create(
                user=review.service.provider,
                title="New Review Received",
                message=f"You received a {review.rating}-star review for {review.service.title}.",
                notification_type='review',
                is_read=random.choice([True, False]),
                related_id=review.id
            )
            notifications.append(provider_notification)
        
        # System notifications for all users
        all_users = list(customers) + list(providers) + list(admins)
        system_messages = [
            "Welcome to SewaBazaar! Explore our services.",
            "New features available on SewaBazaar platform.",
            "Maintenance scheduled for tomorrow at 2 AM.",
            "Thank you for using SewaBazaar services.",
            "Holiday schedule update for upcoming festivals.",
            "New service categories added to our platform.",
            "Security update completed successfully.",
            "Mobile app update available for download.",
            "Customer support hours updated.",
            "Payment gateway maintenance completed."
        ]
        
        for user in all_users:
            for _ in range(random.randint(1, 3)):  # 1-3 system notifications per user
                notification = Notification.objects.create(
                    user=user,
                    title="System Update",
                    message=random.choice(system_messages),
                    notification_type='system',
                    is_read=random.choice([True, False])
                )
                notifications.append(notification)
        
        # Payment notifications for some bookings
        for booking in random.sample(bookings, min(20, len(bookings))):
            if booking.status in ['confirmed', 'completed']:
                payment_notification = Notification.objects.create(
                    user=booking.customer,
                    title="Payment Successful",
                    message=f"Payment of ₹{booking.total_amount} for {booking.service.title} has been processed.",
                    notification_type='payment',
                    is_read=random.choice([True, False]),
                    related_id=booking.id
                )
                notifications.append(payment_notification)
        
        return notifications
