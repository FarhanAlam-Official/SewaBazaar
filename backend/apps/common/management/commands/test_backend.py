from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from apps.services.models import Service, ServiceCategory, City
from apps.bookings.models import Booking, BookingSlot, PaymentMethod
from apps.reviews.models import Review
from decimal import Decimal
import requests

User = get_user_model()

class Command(BaseCommand):
    help = 'Test SewaBazaar backend functionality and API endpoints'

    def add_arguments(self, parser):
        parser.add_argument(
            '--api-only',
            action='store_true',
            help='Test only API endpoints (requires server running)',
        )
        parser.add_argument(
            '--create-test-data',
            action='store_true',
            help='Create test data for API testing',
        )

    def handle(self, *args, **options):
        self.stdout.write('🧪 SewaBazaar Backend Test Suite\n')
        
        if options['create_test_data']:
            self.create_test_data()
            
        if options['api_only']:
            self.test_api_endpoints()
        else:
            self.test_database_models()
            self.test_business_logic()
            
        self.stdout.write('\n✅ Testing complete!')

    def create_test_data(self):
        """Create minimal test data for API testing"""
        self.stdout.write('📝 Creating test data...')
        
        try:
            with transaction.atomic():
                # Create test city
                city, created = City.objects.get_or_create(
                    name='Kathmandu',
                    defaults={'region': 'Central', 'is_active': True}
                )
                
                # Create test category
                category, created = ServiceCategory.objects.get_or_create(
                    slug='test-category',
                    defaults={'title': 'Test Category', 'is_active': True}
                )
                
                # Create test provider
                provider, created = User.objects.get_or_create(
                    email='provider@test.com',
                    defaults={
                        'role': 'provider',
                        'first_name': 'Test',
                        'last_name': 'Provider'
                    }
                )
                if created:
                    provider.set_password('testpass123')
                    provider.save()
                
                # Create test customer
                customer, created = User.objects.get_or_create(
                    email='customer@test.com',
                    defaults={
                        'role': 'customer',
                        'first_name': 'Test',
                        'last_name': 'Customer'
                    }
                )
                if created:
                    customer.set_password('testpass123')
                    customer.save()
                
                # Create test service
                service, created = Service.objects.get_or_create(
                    slug='test-service',
                    defaults={
                        'title': 'Test Service',
                        'description': 'A test service for API testing',
                        'price': Decimal('1500.00'),
                        'category': category,
                        'provider': provider,
                        'status': 'active'
                    }
                )
                service.cities.add(city)
                
                # Create payment method
                payment_method, created = PaymentMethod.objects.get_or_create(
                    name='Khalti',
                    defaults={
                        'payment_type': 'digital_wallet',
                        'is_active': True
                    }
                )
                
                self.stdout.write('✅ Test data created successfully')
                
        except Exception as e:
            self.stdout.write(f'❌ Error creating test data: {str(e)}')

    def test_database_models(self):
        """Test database models and relationships"""
        self.stdout.write('🗄️ Testing Database Models...')
        
        # Test data counts
        models_to_test = [
            (User, 'Users'),
            (ServiceCategory, 'Categories'),
            (City, 'Cities'),
            (Service, 'Services'),
            (Booking, 'Bookings'),
            (PaymentMethod, 'Payment Methods'),
        ]
        
        for model, name in models_to_test:
            count = model.objects.count()
            status = '✅' if count > 0 else '⚠️'
            self.stdout.write(f'{status} {name}: {count} records')

    def test_business_logic(self):
        """Test business logic and model methods"""
        self.stdout.write('\n🧠 Testing Business Logic...')
        
        try:
            # Test service creation
            if Service.objects.exists():
                service = Service.objects.first()
                self.stdout.write(f'✅ Service model: {service.title}')
                
                # Test service methods
                if hasattr(service, 'get_absolute_url'):
                    url = service.get_absolute_url()
                    self.stdout.write(f'✅ Service URL: {url}')
                
            # Test user roles
            customers = User.objects.filter(role='customer').count()
            providers = User.objects.filter(role='provider').count()
            admins = User.objects.filter(role='admin').count()
            
            self.stdout.write(f'✅ User roles: {customers} customers, {providers} providers, {admins} admins')
            
            # Test booking logic
            if Booking.objects.exists():
                booking = Booking.objects.first()
                self.stdout.write(f'✅ Booking model: Status {booking.status}')
                
        except Exception as e:
            self.stdout.write(f'❌ Business logic error: {str(e)}')

    def test_api_endpoints(self):
        """Test API endpoints (requires server to be running)"""
        self.stdout.write('\n🌐 Testing API Endpoints...')
        
        base_url = 'http://127.0.0.1:8000/api'
        
        # Test public endpoints
        endpoints = [
            '/services/',
            '/services/categories/',
            '/services/cities/',
            '/bookings/payment-methods/',
        ]
        
        for endpoint in endpoints:
            try:
                response = requests.get(f'{base_url}{endpoint}', timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    count = len(data.get('results', [])) if 'results' in data else len(data) if isinstance(data, list) else 0
                    self.stdout.write(f'✅ {endpoint}: {count} items')
                else:
                    self.stdout.write(f'❌ {endpoint}: HTTP {response.status_code}')
            except requests.exceptions.ConnectionError:
                self.stdout.write(f'❌ {endpoint}: Server not running')
            except Exception as e:
                self.stdout.write(f'❌ {endpoint}: {str(e)}')

        # Test authentication
        try:
            auth_response = requests.post(f'{base_url}/auth/login/', json={
                'email': 'customer@test.com',
                'password': 'testpass123'
            })
            if auth_response.status_code == 200:
                self.stdout.write('✅ Authentication: Login successful')
            else:
                self.stdout.write(f'❌ Authentication: HTTP {auth_response.status_code}')
        except Exception as e:
            self.stdout.write(f'❌ Authentication: {str(e)}')