"""
INITIALIZE PAYMENT METHODS COMMAND

Purpose: Initialize default payment methods in the database
This command creates the default payment methods required for the booking system
to function properly, including Khalti, eSewa, and Cash on Service.

Usage:
    python manage.py initialize_payment_methods
    python manage.py initialize_payment_methods --dry-run

Features:
- Creates default payment methods if they don't exist
- Updates existing payment methods with correct configuration
- Dry-run mode for testing
- Detailed logging and reporting
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.bookings.models import PaymentMethod
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Initialize default payment methods'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING("🔍 DRY RUN MODE - No changes will be made"))
        
        self.stdout.write(f"🕐 Starting payment method initialization ({timezone.now()})")
        
        try:
            # Initialize default payment methods
            created_count, updated_count = self.initialize_payment_methods(dry_run)
            
            if dry_run:
                self.stdout.write(self.style.WARNING("🔍 This was a DRY RUN - no actual changes made"))
            else:
                self.stdout.write(self.style.SUCCESS(f"✅ Created {created_count} payment methods, updated {updated_count} payment methods"))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error during payment method initialization: {str(e)}"))
            logger.error(f"Payment method initialization error: {str(e)}")

    def initialize_payment_methods(self, dry_run=False):
        """Initialize default payment methods"""
        self.stdout.write("\n💳 Initializing default payment methods...")
        
        # Define default payment methods with enhanced icon support
        default_payment_methods = [
            {
                'name': 'Khalti',
                'payment_type': 'digital_wallet',
                'is_active': True,
                'processing_fee_percentage': 0.0,
                'icon_emoji': '💳',
                'icon_url': 'https://web.khalti.com/static/img/logo1.png',
                'is_featured': True,
                'priority_order': 1,
                'description': 'Fast and secure digital payment with Khalti wallet. Pay with your mobile number.',
                'min_amount': 10.00,
                'max_amount': 100000.00,
                'supported_currencies': ['NPR'],
                'gateway_config': {
                    'gateway': 'khalti',
                    'public_key': '8b58c9047e584751beaddea7cc632b2c'
                }
            },
            {
                'name': 'eSewa',
                'payment_type': 'digital_wallet',
                'is_active': True,
                'processing_fee_percentage': 2.5,
                'icon_emoji': '📱',
                'icon_url': 'https://esewa.com.np/images/esewa_logo.png',
                'is_featured': False,
                'priority_order': 2,
                'description': 'Popular mobile payment solution in Nepal. Widely accepted and trusted.',
                'min_amount': 10.00,
                'max_amount': 50000.00,
                'supported_currencies': ['NPR'],
                'gateway_config': {
                    'gateway': 'esewa'
                }
            },
            {
                'name': 'Cash on Service',
                'payment_type': 'cash',
                'is_active': True,
                'processing_fee_percentage': 0.0,
                'icon_emoji': '💰',
                'is_featured': False,
                'priority_order': 3,
                'description': 'Pay in cash when the service is completed. No advance payment required.',
                'min_amount': 50.00,
                'max_amount': 10000.00,
                'supported_currencies': ['NPR'],
                'gateway_config': {
                    'gateway': 'cash'
                }
            },
            {
                'name': 'Bank Transfer',
                'payment_type': 'bank_transfer',
                'is_active': False,  # Disabled by default
                'processing_fee_percentage': 1.0,
                'icon_emoji': '🏦',
                'is_featured': False,
                'priority_order': 4,
                'description': 'Direct bank transfer payment. Available for larger amounts.',
                'min_amount': 1000.00,
                'max_amount': 500000.00,
                'supported_currencies': ['NPR'],
                'gateway_config': {
                    'gateway': 'bank_transfer'
                }
            }
        ]
        
        created_count = 0
        updated_count = 0
        
        for pm_data in default_payment_methods:
            name = pm_data['name']
            
            if dry_run:
                # Check if payment method exists
                try:
                    pm = PaymentMethod.objects.get(name=name)
                    self.stdout.write(f"  🔄 Would update: {name}")
                    updated_count += 1
                except PaymentMethod.DoesNotExist:
                    self.stdout.write(f"  ➕ Would create: {name}")
                    created_count += 1
            else:
                # Create or update payment method
                pm, created = PaymentMethod.objects.get_or_create(
                    name=name,
                    defaults=pm_data
                )
                
                if created:
                    self.stdout.write(f"  ✅ Created: {name}")
                    created_count += 1
                else:
                    # Update existing payment method
                    updated = False
                    for key, value in pm_data.items():
                        if getattr(pm, key) != value:
                            setattr(pm, key, value)
                            updated = True
                    
                    if updated:
                        pm.save()
                        self.stdout.write(f"  🔄 Updated: {name}")
                        updated_count += 1
                    else:
                        self.stdout.write(f"  ✅ Already up-to-date: {name}")
        
        return created_count, updated_count