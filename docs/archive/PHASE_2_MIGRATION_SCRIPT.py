#!/usr/bin/env python3
"""
PHASE 2 MIGRATION SCRIPT: Database Setup and Sample Data

Purpose: Set up Phase 2 database schema and create sample data for testing
Impact: Prepares database for Phase 2 frontend-backend integration testing
"""

import os
import sys
import django
from django.core.management import execute_from_command_line
from django.db import transaction
from decimal import Decimal
from datetime import datetime, timedelta

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewabazaar.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.accounts.models import Profile, PortfolioMedia
from apps.services.models import Service, Category, City
from apps.bookings.models import Booking
from apps.reviews.models import Review

User = get_user_model()

def run_migrations():
    """Run Django migrations"""
    print("🔄 Running Django migrations...")
    
    try:
        execute_from_command_line(['manage.py', 'migrate'])
        print("✅ Migrations completed successfully")
        return True
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

def create_sample_data():
    """Create sample data for testing Phase 2 functionality"""
    print("🔄 Creating sample data...")
    
    try:
        with transaction.atomic():
            # Create cities if they don't exist
            cities_data = [
                'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Biratnagar'
            ]
            cities = {}
            for city_name in cities_data:
                city, created = City.objects.get_or_create(name=city_name)
                cities[city_name] = city
                if created:
                    print(f"  ✅ Created city: {city_name}")
            
            # Create categories if they don't exist
            categories_data = [
                'Cleaning', 'Plumbing', 'Electrical', 'Beauty', 'Tutoring'
            ]
            categories = {}
            for cat_name in categories_data:
                category, created = Category.objects.get_or_create(
                    title=cat_name,
                    defaults={'description': f'{cat_name} services'}
                )
                categories[cat_name] = category
                if created:
                    print(f"  ✅ Created category: {cat_name}")
            
            # Create sample providers
            providers_data = [
                {
                    'email': 'john.cleaner@example.com',
                    'username': 'john_cleaner',
                    'first_name': 'John',
                    'last_name': 'Doe',
                    'role': 'provider',
                    'is_verified': True,
                    'profile': {
                        'display_name': 'John\'s Cleaning Service',
                        'bio': 'Professional house cleaning service with 5+ years of experience. We provide thorough and reliable cleaning services for homes and offices.',
                        'location_city': 'Kathmandu',
                        'years_of_experience': 5,
                        'certifications': ['Certified Professional Cleaner', 'Safety Training Certificate'],
                        'company_name': 'CleanHome Nepal',
                        'is_approved': True
                    }
                },
                {
                    'email': 'jane.plumber@example.com',
                    'username': 'jane_plumber',
                    'first_name': 'Jane',
                    'last_name': 'Smith',
                    'role': 'provider',
                    'is_verified': True,
                    'profile': {
                        'display_name': 'Jane\'s Plumbing Solutions',
                        'bio': 'Expert plumber specializing in residential and commercial plumbing repairs, installations, and maintenance.',
                        'location_city': 'Lalitpur',
                        'years_of_experience': 8,
                        'certifications': ['Licensed Plumber', 'Emergency Response Certified'],
                        'company_name': 'FixIt Plumbers',
                        'is_approved': True
                    }
                },
                {
                    'email': 'mike.electrician@example.com',
                    'username': 'mike_electrician',
                    'first_name': 'Mike',
                    'last_name': 'Johnson',
                    'role': 'provider',
                    'is_verified': True,
                    'profile': {
                        'display_name': 'Mike\'s Electrical Services',
                        'bio': 'Certified electrician providing safe and reliable electrical services for homes and businesses.',
                        'location_city': 'Bhaktapur',
                        'years_of_experience': 6,
                        'certifications': ['Licensed Electrician', 'Safety Compliance Certificate'],
                        'company_name': 'PowerFix Nepal',
                        'is_approved': True
                    }
                }
            ]
            
            providers = {}
            for provider_data in providers_data:
                profile_data = provider_data.pop('profile')
                
                # Create or get user
                user, created = User.objects.get_or_create(
                    email=provider_data['email'],
                    defaults=provider_data
                )
                
                if created:
                    user.set_password('testpass123')
                    user.save()
                    print(f"  ✅ Created provider: {user.email}")
                
                # Create or update profile
                profile, profile_created = Profile.objects.get_or_create(
                    user=user,
                    defaults=profile_data
                )
                
                if not profile_created:
                    # Update existing profile
                    for key, value in profile_data.items():
                        setattr(profile, key, value)
                    profile.save()
                
                providers[user.email] = user
            
            # Create sample customers
            customers_data = [
                {
                    'email': 'customer1@example.com',
                    'username': 'customer1',
                    'first_name': 'Alice',
                    'last_name': 'Wilson',
                    'role': 'customer'
                },
                {
                    'email': 'customer2@example.com',
                    'username': 'customer2',
                    'first_name': 'Bob',
                    'last_name': 'Brown',
                    'role': 'customer'
                },
                {
                    'email': 'customer3@example.com',
                    'username': 'customer3',
                    'first_name': 'Carol',
                    'last_name': 'Davis',
                    'role': 'customer'
                }
            ]
            
            customers = {}
            for customer_data in customers_data:
                user, created = User.objects.get_or_create(
                    email=customer_data['email'],
                    defaults=customer_data
                )
                
                if created:
                    user.set_password('testpass123')
                    user.save()
                    print(f"  ✅ Created customer: {user.email}")
                
                # Create profile for customer
                Profile.objects.get_or_create(user=user)
                customers[user.email] = user
            
            # Create sample services
            services_data = [
                {
                    'title': 'Professional House Cleaning',
                    'description': 'Complete house cleaning service including all rooms, kitchen, and bathrooms.',
                    'price': Decimal('1200.00'),
                    'category': 'Cleaning',
                    'provider': 'john.cleaner@example.com',
                    'city': 'Kathmandu'
                },
                {
                    'title': 'Plumbing Repair & Installation',
                    'description': 'Expert plumbing services for repairs, installations, and maintenance.',
                    'price': Decimal('800.00'),
                    'category': 'Plumbing',
                    'provider': 'jane.plumber@example.com',
                    'city': 'Lalitpur'
                },
                {
                    'title': 'Electrical Wiring & Repair',
                    'description': 'Safe and reliable electrical services for homes and offices.',
                    'price': Decimal('1000.00'),
                    'category': 'Electrical',
                    'provider': 'mike.electrician@example.com',
                    'city': 'Bhaktapur'
                }
            ]
            
            services = {}
            for service_data in services_data:
                provider_email = service_data.pop('provider')
                category_name = service_data.pop('category')
                city_name = service_data.pop('city')
                
                service, created = Service.objects.get_or_create(
                    title=service_data['title'],
                    defaults={
                        **service_data,
                        'provider': providers[provider_email],
                        'category': categories[category_name],
                        'city': cities[city_name],
                        'status': 'active'
                    }
                )
                
                if created:
                    print(f"  ✅ Created service: {service.title}")
                
                services[service.title] = service
            
            # Create sample bookings
            bookings_data = [
                {
                    'service': 'Professional House Cleaning',
                    'customer': 'customer1@example.com',
                    'status': 'completed',
                    'booking_date': datetime.now().date() - timedelta(days=7),
                    'booking_time': '10:00:00',
                    'total_amount': Decimal('1200.00')
                },
                {
                    'service': 'Plumbing Repair & Installation',
                    'customer': 'customer2@example.com',
                    'status': 'completed',
                    'booking_date': datetime.now().date() - timedelta(days=5),
                    'booking_time': '14:00:00',
                    'total_amount': Decimal('800.00')
                },
                {
                    'service': 'Electrical Wiring & Repair',
                    'customer': 'customer3@example.com',
                    'status': 'completed',
                    'booking_date': datetime.now().date() - timedelta(days=3),
                    'booking_time': '09:00:00',
                    'total_amount': Decimal('1000.00')
                },
                {
                    'service': 'Professional House Cleaning',
                    'customer': 'customer2@example.com',
                    'status': 'completed',
                    'booking_date': datetime.now().date() - timedelta(days=2),
                    'booking_time': '11:00:00',
                    'total_amount': Decimal('1200.00')
                }
            ]
            
            bookings = []
            for booking_data in bookings_data:
                service_title = booking_data.pop('service')
                customer_email = booking_data.pop('customer')
                
                booking, created = Booking.objects.get_or_create(
                    service=services[service_title],
                    customer=customers[customer_email],
                    booking_date=booking_data['booking_date'],
                    defaults=booking_data
                )
                
                if created:
                    print(f"  ✅ Created booking: {booking.id}")
                
                bookings.append(booking)
            
            # Create sample reviews
            reviews_data = [
                {
                    'booking_index': 0,  # First booking
                    'rating': 5,
                    'comment': 'Excellent service! Very thorough cleaning and professional staff. Highly recommended!'
                },
                {
                    'booking_index': 1,  # Second booking
                    'rating': 4,
                    'comment': 'Good plumbing work. Fixed the issue quickly and explained what was wrong.'
                },
                {
                    'booking_index': 2,  # Third booking
                    'rating': 5,
                    'comment': 'Outstanding electrical work. Very knowledgeable and safety-conscious.'
                },
                {
                    'booking_index': 3,  # Fourth booking
                    'rating': 4,
                    'comment': 'Great cleaning service again. Consistent quality and reliable timing.'
                }
            ]
            
            for review_data in reviews_data:
                booking_index = review_data.pop('booking_index')
                booking = bookings[booking_index]
                
                review, created = Review.objects.get_or_create(
                    booking=booking,
                    defaults={
                        'customer': booking.customer,
                        'provider': booking.service.provider,
                        'rating': review_data['rating'],
                        'comment': review_data['comment']
                    }
                )
                
                if created:
                    print(f"  ✅ Created review: {review.id}")
            
            print("✅ Sample data created successfully")
            return True
            
    except Exception as e:
        print(f"❌ Failed to create sample data: {e}")
        return False

def main():
    """Main migration script"""
    print("🚀 Starting Phase 2 Migration Script")
    print("=" * 50)
    
    # Step 1: Run migrations
    if not run_migrations():
        print("❌ Migration script failed at migration step")
        return False
    
    # Step 2: Create sample data
    if not create_sample_data():
        print("❌ Migration script failed at sample data creation")
        return False
    
    print("=" * 50)
    print("🎉 Phase 2 Migration Script Completed Successfully!")
    print()
    print("📋 What was created:")
    print("  • Database schema updated with Phase 2 models")
    print("  • 3 sample providers with profiles")
    print("  • 3 sample customers")
    print("  • 3 sample services")
    print("  • 4 sample completed bookings")
    print("  • 4 sample reviews")
    print()
    print("🔑 Test Credentials:")
    print("  Providers:")
    print("    • john.cleaner@example.com / testpass123")
    print("    • jane.plumber@example.com / testpass123")
    print("    • mike.electrician@example.com / testpass123")
    print("  Customers:")
    print("    • customer1@example.com / testpass123")
    print("    • customer2@example.com / testpass123")
    print("    • customer3@example.com / testpass123")
    print()
    print("🌐 Test URLs:")
    print("  • Provider Profile: http://localhost:3000/test-provider-profile")
    print("  • API Test: http://localhost:8000/api/providers/1/profile/")
    print()
    print("▶️  Next Steps:")
    print("  1. Start the Django server: python manage.py runserver")
    print("  2. Start the Next.js server: npm run dev")
    print("  3. Visit the test page to validate integration")
    
    return True

if __name__ == '__main__':
    main()