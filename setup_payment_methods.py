#!/usr/bin/env python
"""
Payment Methods Setup Script

This script helps set up the enhanced payment methods system:
1. Applies the database migration
2. Initializes default payment methods
3. Provides status information

Usage:
    python setup_payment_methods.py
"""

import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewabazaar.settings')
django.setup()

from django.core.management import call_command
from django.db import transaction
from apps.bookings.models import PaymentMethod

def main():
    print("🚀 Setting up enhanced payment methods system...")
    print("=" * 60)
    
    try:
        # Step 1: Apply migrations
        print("\n📦 Applying database migrations...")
        call_command('migrate', 'bookings', verbosity=1)
        print("✅ Migrations applied successfully!")
        
        # Step 2: Initialize payment methods
        print("\n💳 Initializing payment methods...")
        call_command('initialize_payment_methods', verbosity=1)
        print("✅ Payment methods initialized successfully!")
        
        # Step 3: Display current payment methods
        print("\n📋 Current payment methods:")
        payment_methods = PaymentMethod.objects.all().order_by('priority_order', 'name')
        
        if not payment_methods.exists():
            print("❌ No payment methods found!")
            return
            
        for pm in payment_methods:
            icon = pm.icon_display
            status = "✅ Active" if pm.is_active else "❌ Inactive"
            featured = " ⭐ Featured" if pm.is_featured else ""
            
            print(f"  {icon} {pm.name} ({pm.get_payment_type_display()}) - {status}{featured}")
            print(f"     💰 Fee: {pm.processing_fee_percentage}%")
            if pm.description:
                print(f"     📝 {pm.description}")
            print()
        
        print("🎉 Payment methods setup completed successfully!")
        print("\n📋 Next steps:")
        print("1. Start your Django server: python backend/manage.py runserver")
        print("2. Check the admin panel: http://127.0.0.1:8000/admin/bookings/paymentmethod/")
        print("3. Test payment methods in your frontend application")
        
    except Exception as e:
        print(f"❌ Error during setup: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())