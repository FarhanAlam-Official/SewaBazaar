"""
Management command to populate the database with initial services data.

This command creates sample data for cities, service categories, and services
to help with development and testing. It's particularly useful for setting
up a development environment with realistic sample data.

Features:
- Creates sample cities across different regions
- Sets up common service categories
- Creates a sample provider user
- Generates sample services with realistic data
- Safe to run multiple times (uses get_or_create)

Usage:
- python manage.py populate_services
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.services.models import City, ServiceCategory, Service
from django.utils.text import slugify
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    """
    Django management command to populate the database with sample services data.
    
    This command is useful for development and testing environments to quickly
    set up realistic sample data for the services application.
    """
    
    help = 'Populate database with initial services data'

    def handle(self, *args, **kwargs):
        """
        Main handler for the populate services command.
        
        Creates sample cities, categories, provider user, and services.
        
        Args:
            *args: Variable length argument list
            **kwargs: Command options dictionary
        """
        self.stdout.write('Starting to populate database...')

        # Create cities
        cities_data = [
            {'name': 'Kathmandu', 'region': 'Bagmati'},
            {'name': 'Pokhara', 'region': 'Gandaki'},
            {'name': 'Lalitpur', 'region': 'Bagmati'},
            {'name': 'Bhaktapur', 'region': 'Bagmati'},
            {'name': 'Biratnagar', 'region': 'Province 1'},
            {'name': 'Birgunj', 'region': 'Province 2'},
            {'name': 'Butwal', 'region': 'Lumbini'},
            {'name': 'Dharan', 'region': 'Province 1'},
            {'name': 'Chitwan', 'region': 'Bagmati'},
            {'name': 'Hetauda', 'region': 'Bagmati'},
        ]

        cities = []
        for city_data in cities_data:
            city, created = City.objects.get_or_create(**city_data)
            cities.append(city)
            if created:
                self.stdout.write(f'Created city: {city.name}')

        # Create service categories
        categories_data = [
            {
                'title': 'Home Cleaning',
                'description': 'Professional home cleaning services',
                'icon': 'home',
            },
            {
                'title': 'Plumbing',
                'description': 'Expert plumbing services and repairs',
                'icon': 'tool',
            },
            {
                'title': 'Electrical',
                'description': 'Electrical installation and repair services',
                'icon': 'zap',
            },
            {
                'title': 'Painting',
                'description': 'Professional painting services',
                'icon': 'brush',
            },
            {
                'title': 'Carpentry',
                'description': 'Custom carpentry and woodworking',
                'icon': 'hammer',
            },
            {
                'title': 'Gardening',
                'description': 'Garden maintenance and landscaping',
                'icon': 'flower',
            },
            {
                'title': 'Beauty & Spa',
                'description': 'Professional beauty and spa services',
                'icon': 'scissors',
            },
            {
                'title': 'Appliance Repair',
                'description': 'Repair services for home appliances',
                'icon': 'tool',
            },
            {
                'title': 'Moving & Packing',
                'description': 'Professional moving and packing services',
                'icon': 'truck',
            },
            {
                'title': 'Computer Repair',
                'description': 'Computer and laptop repair services',
                'icon': 'monitor',
            },
        ]

        categories = []
        for cat_data in categories_data:
            cat_data['slug'] = slugify(cat_data['title'])
            category, created = ServiceCategory.objects.get_or_create(**cat_data)
            categories.append(category)
            if created:
                self.stdout.write(f'Created category: {category.title}')

        # Create a provider user if not exists
        provider_data = {
            'email': 'provider@example.com',
            'username': 'provider1',
            'first_name': 'John',
            'last_name': 'Doe',
            'role': 'provider',
            'is_verified': True,
        }
        
        try:
            provider = User.objects.get(email=provider_data['email'])
        except User.DoesNotExist:
            provider = User.objects.create_user(
                **provider_data,
                password='Test@123'  # Set a default password
            )
            self.stdout.write(f'Created provider user: {provider.email}')

        # Create sample services
        services_data = [
            {
                'title': 'Deep House Cleaning',
                'description': 'Professional deep cleaning service for your entire home. Includes dusting, mopping, bathroom cleaning, kitchen cleaning, and more.',
                'short_description': 'Complete house deep cleaning service',
                'price': Decimal('2500.00'),
                'duration': '4 hours',
                'category': categories[0],  # Home Cleaning
                'includes': '- Deep cleaning of all rooms\n- Bathroom sanitization\n- Kitchen deep cleaning\n- Window cleaning\n- Floor mopping and vacuum',
                'excludes': '- Exterior cleaning\n- Carpet washing\n- Wall cleaning',
                'status': 'active',
            },
            {
                'title': 'Emergency Plumbing Service',
                'description': 'Available 24/7 for emergency plumbing issues. Quick response for leaks, blockages, and other plumbing emergencies.',
                'short_description': '24/7 emergency plumbing repairs',
                'price': Decimal('1500.00'),
                'duration': '2 hours',
                'category': categories[1],  # Plumbing
                'includes': '- Emergency response\n- Basic repairs\n- Leak fixing\n- Pipe unclogging',
                'excludes': '- Major pipe replacements\n- New installations\n- Water heater repairs',
                'status': 'active',
            },
            {
                'title': 'Electrical Wiring Installation',
                'description': 'Complete electrical wiring service for homes and offices. Professional installation with safety compliance.',
                'short_description': 'Professional electrical wiring service',
                'price': Decimal('3500.00'),
                'duration': '6 hours',
                'category': categories[2],  # Electrical
                'includes': '- Wiring installation\n- Circuit testing\n- Safety inspection\n- Documentation',
                'excludes': '- Electrical appliance repair\n- High voltage work\n- Generator installation',
                'status': 'active',
            },
        ]

        for service_data in services_data:
            service_data['provider'] = provider
            service_data['slug'] = slugify(service_data['title'])
            
            service, created = Service.objects.get_or_create(
                slug=service_data['slug'],
                defaults=service_data
            )
            
            if created:
                # Add cities to the service
                service.cities.add(*cities[:3])  # Add first 3 cities to each service
                self.stdout.write(f'Created service: {service.title}')

        self.stdout.write(self.style.SUCCESS('Successfully populated database'))