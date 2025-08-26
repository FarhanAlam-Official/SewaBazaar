#!/usr/bin/env python
"""
Phase 1 Setup Script - Creates default payment methods and verifies setup

Run this script after applying migrations to set up Phase 1 features.
"""

import os
import sys
import django

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewabazaar.settings')
django.setup()

from apps.bookings.models import PaymentMethod
from decimal import Decimal


def create_default_payment_methods():
    """Create default payment methods for SewaBazaar"""
    
    print("Creating default payment methods...")
    
    default_methods = [
        {
            'name': 'Khalti',
            'payment_type': 'digital_wallet',
            'is_active': True,
            'processing_fee_percentage': Decimal('0.00'),
            'icon': 'khalti-icon',
            'gateway_config': {
                'gateway': 'khalti',
                'supports_verification': True,
                'currency': 'NPR'
            }
        },
        {
            'name': 'Cash on Service',
            'payment_type': 'cash',
            'is_active': True,
            'processing_fee_percentage': Decimal('0.00'),
            'icon': 'cash-icon',
            'gateway_config': {
                'gateway': 'cash',
                'supports_verification': False,
                'currency': 'NPR'
            }
        },
        {
            'name': 'eSewa',
            'payment_type': 'digital_wallet',
            'is_active': False,  # Not implemented yet
            'processing_fee_percentage': Decimal('2.00'),
            'icon': 'esewa-icon',
            'gateway_config': {
                'gateway': 'esewa',
                'supports_verification': True,
                'currency': 'NPR'
            }
        },
        {
            'name': 'Bank Transfer',
            'payment_type': 'bank_transfer',
            'is_active': False,  # Not implemented yet
            'processing_fee_percentage': Decimal('0.00'),
            'icon': 'bank-icon',
            'gateway_config': {
                'gateway': 'bank_transfer',
                'supports_verification': False,
                'currency': 'NPR'
            }
        }
    ]
    
    created_count = 0
    updated_count = 0
    
    for method_data in default_methods:
        payment_method, created = PaymentMethod.objects.get_or_create(
            name=method_data['name'],
            defaults=method_data
        )
        
        if created:
            created_count += 1
            print(f'✓ Created payment method: {payment_method.name}')
        else:
            # Update existing method if needed
            updated = False
            for field, value in method_data.items():
                if field != 'name' and getattr(payment_method, field) != value:
                    setattr(payment_method, field, value)
                    updated = True
            
            if updated:
                payment_method.save()
                updated_count += 1
                print(f'⚠ Updated payment method: {payment_method.name}')
            else:
                print(f'✓ Payment method already exists: {payment_method.name}')
    
    print(f'\nSummary: {created_count} created, {updated_count} updated')
    
    # Display active payment methods
    active_methods = PaymentMethod.objects.filter(is_active=True)
    print('\nActive payment methods:')
    for method in active_methods:
        print(f'  - {method.name} ({method.get_payment_type_display()})')


def verify_setup():
    """Verify Phase 1 setup is complete"""
    
    print("\nVerifying Phase 1 setup...")
    
    # Check if payment methods exist
    payment_methods_count = PaymentMethod.objects.count()
    if payment_methods_count > 0:
        print(f'✓ Payment methods: {payment_methods_count} found')
    else:
        print('✗ No payment methods found')
        return False
    
    # Check if Khalti is active
    khalti_method = PaymentMethod.objects.filter(name='Khalti', is_active=True).first()
    if khalti_method:
        print('✓ Khalti payment method is active')
    else:
        print('✗ Khalti payment method not found or inactive')
        return False
    
    print('\n✅ Phase 1 setup verification complete!')
    return True


if __name__ == '__main__':
    print("🚀 Phase 1 Setup Script")
    print("=" * 50)
    
    try:
        create_default_payment_methods()
        verify_setup()
        
        print("\n🎉 Phase 1 setup completed successfully!")
        print("\nNext steps:")
        print("1. Start the Django server: cd backend && python manage.py runserver")
        print("2. Start the Next.js frontend: cd frontend && npm run dev")
        print("3. Test the new booking wizard on the services page")
        print("4. API endpoints now available:")
        print("   - /api/bookings/payment-methods/")
        print("   - /api/bookings/booking-slots/available_slots/")
        print("   - /api/bookings/booking-wizard/create_step/")
        print("   - /api/bookings/payments/process_khalti_payment/")
        
    except Exception as e:
        print(f"\n❌ Setup failed: {str(e)}")
        sys.exit(1)