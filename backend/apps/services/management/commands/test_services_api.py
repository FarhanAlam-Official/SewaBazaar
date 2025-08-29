from django.core.management.base import BaseCommand
from django.test import RequestFactory
from apps.services.views import ServiceViewSet
from apps.services.models import Service
from apps.services.serializers import ServiceSerializer

class Command(BaseCommand):
    help = 'Test the services API to check for any issues'

    def handle(self, *args, **options):
        self.stdout.write('Testing Services API...')
        
        # Check if we have any services
        services_count = Service.objects.count()
        self.stdout.write(f'Total services in database: {services_count}')
        
        if services_count == 0:
            self.stdout.write(self.style.WARNING('No services found in database!'))
            return
        
        # Get first service to test serializer
        service = Service.objects.first()
        self.stdout.write(f'Testing with service: {service.title}')
        
        # Test serializer
        try:
            serializer = ServiceSerializer(service)
            data = serializer.data
            self.stdout.write(f'Serializer fields: {list(data.keys())}')
            self.stdout.write(self.style.SUCCESS('Serializer working correctly!'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Serializer error: {str(e)}'))
        
        # Test viewset
        try:
            factory = RequestFactory()
            request = factory.get('/api/services/')
            viewset = ServiceViewSet()
            viewset.request = request
            
            # Test get_queryset
            queryset = viewset.get_queryset()
            self.stdout.write(f'Queryset count: {queryset.count()}')
            self.stdout.write(self.style.SUCCESS('ViewSet get_queryset working!'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'ViewSet error: {str(e)}'))
        
        self.stdout.write('API test completed!')
