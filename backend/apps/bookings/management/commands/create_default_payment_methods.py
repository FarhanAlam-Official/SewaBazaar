from django.core.management.base import BaseCommand
from decimal import Decimal

from apps.bookings.models import PaymentMethod


class Command(BaseCommand):
    help = 'Create default payment methods for Phase 1 (Khalti, eSewa, Cash)'

    def handle(self, *args, **options):
        defaults = [
            {
                'name': 'Khalti',
                'payment_type': 'digital_wallet',
                'processing_fee_percentage': Decimal('0.00'),
                'icon': 'khalti-icon',
                'gateway_config': {'gateway': 'khalti'},
            },
            {
                'name': 'eSewa',
                'payment_type': 'digital_wallet',
                'processing_fee_percentage': Decimal('0.00'),
                'icon': 'esewa-icon',
                'gateway_config': {'gateway': 'esewa'},
            },
            {
                'name': 'Cash on Service',
                'payment_type': 'cash',
                'processing_fee_percentage': Decimal('0.00'),
                'icon': 'cash-icon',
                'gateway_config': {},
            },
        ]

        created_count = 0
        for item in defaults:
            obj, created = PaymentMethod.objects.get_or_create(
                name=item['name'],
                defaults={
                    'payment_type': item['payment_type'],
                    'is_active': True,
                    'processing_fee_percentage': item['processing_fee_percentage'],
                    'icon': item['icon'],
                    'gateway_config': item['gateway_config'],
                },
            )
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Default payment methods ensured. Created: {created_count}"))


