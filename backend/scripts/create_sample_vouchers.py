#!/usr/bin/env python
"""
Data Reset and Sample Creation Script for Simplified Voucher System

This script:
1. Removes all existing vouchers
2. Creates sample vouchers for testing
3. Ensures proper test user accounts exist
4. Creates vouchers with different denominations and statuses

Usage:
    python manage.py shell < create_sample_vouchers.py
    
Or run from Django shell:
    exec(open('create_sample_vouchers.py').read())
"""

import os
import sys
import django
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewabazaar.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.rewards.models import RewardVoucher, RewardAccount, RewardsConfig
from apps.accounts.models import User

def create_sample_data():
    """Create sample vouchers for testing simplified voucher system."""
    
    print("🧹 Starting data reset and sample creation...")
    
    # 1. Clear existing vouchers
    print("📝 Removing existing vouchers...")
    existing_count = RewardVoucher.objects.count()
    RewardVoucher.objects.all().delete()
    print(f"✅ Removed {existing_count} existing vouchers")
    
    # 2. Ensure test user exists
    print("👤 Setting up test user...")
    try:
        user = User.objects.get(email='thefarhanalam01@gmail.com')
        print(f"✅ Found existing test user: {user.email}")
    except User.DoesNotExist:
        user = User.objects.create_user(
            email='thefarhanalam01@gmail.com',
            password='testpass123',
            first_name='Farhan',
            last_name='Alam',
            phone_number='+923001234567'
        )
        print(f"✅ Created test user: {user.email}")
    
    # 3. Ensure reward account exists
    print("🎁 Setting up reward account...")
    account, created = RewardAccount.objects.get_or_create(
        user=user,
        defaults={
            'current_balance': 5000,  # Give user 5000 points for testing
            'total_points_earned': 10000,
            'total_points_redeemed': 5000,
            'tier_level': 'silver'
        }
    )
    if created:
        print(f"✅ Created reward account with {account.current_balance} points")
    else:
        # Update existing account
        account.current_balance = 5000
        account.total_points_earned = 10000
        account.total_points_redeemed = 5000
        account.tier_level = 'silver'
        account.save()
        print(f"✅ Updated reward account with {account.current_balance} points")
    
    # 4. Create sample vouchers with different denominations and statuses
    print("🎫 Creating sample vouchers...")
    
    vouchers_to_create = [
        # Active vouchers (can be used)
        {
            'value': Decimal('50.00'),
            'points_redeemed': 100,
            'status': 'active',
            'code_suffix': '50-001',
            'expires_days': 180,  # 6 months
            'description': 'Rs. 50 Active Voucher'
        },
        {
            'value': Decimal('100.00'),
            'points_redeemed': 200,
            'status': 'active',
            'code_suffix': '100-001',
            'expires_days': 180,
            'description': 'Rs. 100 Active Voucher'
        },
        {
            'value': Decimal('200.00'),
            'points_redeemed': 400,
            'status': 'active',
            'code_suffix': '200-001',
            'expires_days': 180,
            'description': 'Rs. 200 Active Voucher'
        },
        {
            'value': Decimal('500.00'),
            'points_redeemed': 1000,
            'status': 'active',
            'code_suffix': '500-001',
            'expires_days': 180,
            'description': 'Rs. 500 Active Voucher'
        },
        {
            'value': Decimal('1000.00'),
            'points_redeemed': 2000,
            'status': 'active',
            'code_suffix': '1000-001',
            'expires_days': 180,
            'description': 'Rs. 1000 Active Voucher'
        },
        
        # Used voucher (for testing display)
        {
            'value': Decimal('100.00'),
            'points_redeemed': 200,
            'status': 'used',
            'code_suffix': '100-USED',
            'expires_days': 180,
            'description': 'Rs. 100 Used Voucher',
            'used_amount': Decimal('100.00'),
            'used_at': timezone.now() - timedelta(days=5)
        },
        
        # Expired voucher (for testing display)
        {
            'value': Decimal('200.00'),
            'points_redeemed': 400,
            'status': 'expired',
            'code_suffix': '200-EXP',
            'expires_days': -30,  # Expired 30 days ago
            'description': 'Rs. 200 Expired Voucher'
        },
        
        # Near-expiry voucher (for testing urgency)
        {
            'value': Decimal('150.00'),
            'points_redeemed': 300,
            'status': 'active',
            'code_suffix': '150-SOON',
            'expires_days': 7,  # Expires in 7 days
            'description': 'Rs. 150 Near-Expiry Voucher'
        }
    ]
    
    created_vouchers = []
    for voucher_data in vouchers_to_create:
        # Generate voucher code
        today = timezone.now().strftime('%Y%m%d')
        voucher_code = f"SB-{today}-{voucher_data['code_suffix']}"
        
        # Calculate expiry date
        expires_at = timezone.now() + timedelta(days=voucher_data['expires_days'])
        
        # Create voucher
        voucher = RewardVoucher.objects.create(
            user=user,
            voucher_code=voucher_code,
            value=voucher_data['value'],
            points_redeemed=voucher_data['points_redeemed'],
            status=voucher_data['status'],
            expires_at=expires_at,
            used_amount=voucher_data.get('used_amount', Decimal('0')),
            used_at=voucher_data.get('used_at'),
            usage_policy='fixed',
            metadata={
                'created_for': 'testing',
                'description': voucher_data['description'],
                'sample_data': True
            }
        )
        
        created_vouchers.append(voucher)
        print(f"✅ Created {voucher.voucher_code}: {voucher_data['description']} ({voucher.status})")
    
    # 5. Summary
    print(f"\n📊 Summary:")
    print(f"   🎫 Total vouchers created: {len(created_vouchers)}")
    print(f"   💰 Test user balance: {account.current_balance} points")
    print(f"   📧 Test user email: {user.email}")
    print(f"   🔐 Test user password: testpass123")
    
    # Voucher breakdown
    active_vouchers = [v for v in created_vouchers if v.status == 'active']
    used_vouchers = [v for v in created_vouchers if v.status == 'used']
    expired_vouchers = [v for v in created_vouchers if v.status == 'expired']
    
    print(f"\n📈 Voucher Breakdown:")
    print(f"   ✅ Active vouchers: {len(active_vouchers)}")
    print(f"   ✔️  Used vouchers: {len(used_vouchers)}")
    print(f"   ❌ Expired vouchers: {len(expired_vouchers)}")
    
    total_active_value = sum(v.value for v in active_vouchers)
    print(f"   💵 Total active value: Rs. {total_active_value}")
    
    print(f"\n🎯 Ready for testing simplified voucher system!")
    print(f"   📱 Frontend should now show {len(active_vouchers)} usable vouchers")
    print(f"   🔍 Test different booking amounts to see usage behavior")
    
    return created_vouchers, account

def test_voucher_usage():
    """Test the simplified voucher usage logic."""
    
    print("\n🧪 Testing voucher usage logic...")
    
    # Get a test voucher
    voucher = RewardVoucher.objects.filter(status='active', value=100).first()
    if not voucher:
        print("❌ No test voucher found")
        return
    
    print(f"📋 Testing voucher: {voucher.voucher_code} (Rs. {voucher.value})")
    
    # Test scenarios
    test_scenarios = [
        {'booking_amount': Decimal('50'), 'description': 'Booking less than voucher value'},
        {'booking_amount': Decimal('100'), 'description': 'Booking equal to voucher value'},
        {'booking_amount': Decimal('150'), 'description': 'Booking more than voucher value'},
    ]
    
    for scenario in test_scenarios:
        booking_amount = scenario['booking_amount']
        description = scenario['description']
        
        can_use, reason = voucher.can_use_for_booking(booking_amount)
        
        if can_use:
            # Calculate what would happen
            discount = min(voucher.value, booking_amount)
            final_amount = max(Decimal('0'), booking_amount - discount)
            wasted = max(Decimal('0'), voucher.value - discount)
            
            print(f"   ✅ {description}")
            print(f"      💰 Booking: Rs. {booking_amount}")
            print(f"      💸 Discount: Rs. {discount}")
            print(f"      💳 Final: Rs. {final_amount}")
            if wasted > 0:
                print(f"      ⚠️  Wasted: Rs. {wasted}")
        else:
            print(f"   ❌ {description}: {reason}")
        
        print()

if __name__ == "__main__":
    try:
        # Create sample data
        vouchers, account = create_sample_data()
        
        # Test voucher logic
        test_voucher_usage()
        
        print("🎉 Sample data creation completed successfully!")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {str(e)}")
        import traceback
        traceback.print_exc()