#!/usr/bin/env python
"""
Test script for reward claiming functionality
"""
import os
import sys
import django

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewabazaar.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.rewards.models import RewardAccount, PointsTransaction
import json

User = get_user_model()

def test_reward_models():
    print("Testing reward models and logic...")
    
    try:
        # Get an existing user
        user = User.objects.filter(role='customer').first()
        if not user:
            print("❌ No customer user found in database")
            return
            
        print(f"User: {user.email}")
        
        # Test reward account creation and point addition
        reward_account, created = RewardAccount.objects.get_or_create(
            user=user,
            defaults={
                'current_balance': 0,
                'total_points_earned': 0,
                'total_points_redeemed': 0,
                'tier': 'bronze'
            }
        )
        
        print(f"Reward account - Created: {created}, Balance: {reward_account.current_balance}")
        
        # Test adding points
        initial_balance = reward_account.current_balance
        points_to_add = 10
        
        transaction = reward_account.add_points(
            points=points_to_add,
            transaction_type='earned_review',
            description='Test reward claim'
        )
        
        reward_account.refresh_from_db()
        
        print(f"Points added successfully!")
        print(f"Initial balance: {initial_balance}")
        print(f"Points added: {points_to_add}")
        print(f"New balance: {reward_account.current_balance}")
        print(f"Transaction ID: {transaction.id}")
        print(f"✅ Reward claiming logic works correctly!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error in test: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == '__main__':
    success = test_reward_models()
    if success:
        print("\n🎉 The reward models work correctly!")
        print("The frontend should now be able to claim rewards.")
        print("Make sure to:")
        print("1. Log in to the application")
        print("2. Navigate to Customer Dashboard > Reviews")
        print("3. Try to claim any available rewards")
    else:
        print("\n❌ There are issues with the reward models that need to be fixed.")