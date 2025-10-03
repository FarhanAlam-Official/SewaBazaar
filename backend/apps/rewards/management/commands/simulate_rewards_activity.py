"""
Management command to simulate reward transactions for testing and demonstration.

This command creates sample transactions to demonstrate:
1. Points earning from bookings
2. Tier progression
3. Bonus point awards
4. Points redemption

Usage: python manage.py simulate_rewards_activity [--users COUNT] [--days DAYS]
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random
from decimal import Decimal

from apps.rewards.models import RewardAccount, PointsTransaction, RewardsConfig

User = get_user_model()


class Command(BaseCommand):
    """
    Django management command to simulate rewards activity.
    
    This command generates sample reward transactions for testing and demonstration
    purposes, helping to showcase the rewards system functionality.
    """
    
    help = 'Simulate rewards activity for testing and demonstration'
    
    def add_arguments(self, parser):
        """
        Add command-line arguments for the simulation command.
        
        Args:
            parser (ArgumentParser): The argument parser instance
        """
        parser.add_argument(
            '--users',
            type=int,
            default=10,
            help='Number of users to simulate activity for (default: 10)',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Number of days to simulate activity over (default: 7)',
        )
        parser.add_argument(
            '--transactions',
            type=int,
            default=50,
            help='Number of transactions to create (default: 50)',
        )
    
    def handle(self, *args, **options):
        """
        Main handler for the simulate rewards activity command.
        
        Args:
            *args: Variable length argument list
            **options: Command options dictionary
        """
        self.stdout.write(
            self.style.SUCCESS('🎯 Simulating SewaBazaar Rewards Activity...\n')
        )
        
        self.users_count = options['users']
        self.days = options['days']
        self.transactions_count = options['transactions']
        
        # Get active configuration
        self.config = RewardsConfig.objects.filter(is_active=True).first()
        if not self.config:
            self.stdout.write(
                self.style.ERROR('❌ No active rewards configuration found!')
            )
            return
        
        # Get random users
        self.users = list(User.objects.all()[:self.users_count])
        if len(self.users) < self.users_count:
            self.stdout.write(
                self.style.WARNING(f'⚠️  Only {len(self.users)} users available (requested {self.users_count})')
            )
        
        # Generate sample activity
        self.create_sample_transactions()
        self.display_results()
        
        self.stdout.write(
            self.style.SUCCESS('\n✅ Simulation completed!')
        )
    
    def create_sample_transactions(self):
        """
        Create sample reward transactions.
        """
        self.stdout.write('🎲 Generating sample transactions...')
        
        transaction_types = [
            ('earned_booking', 'Booking Completion', 50, 200),
            ('earned_review', 'Service Review', 30, 100),
            ('bonus_weekend', 'Weekend Booking Bonus', 25, 75),
            ('bonus_first_booking', 'First Booking Bonus', 150, 250),
            ('earned_referral', 'Friend Referral', 200, 500),
            ('redeemed_voucher', 'Voucher Redemption', -100, -1000),
        ]
        
        created_count = 0
        
        for i in range(self.transactions_count):
            # Random user
            user = random.choice(self.users)
            account, _ = RewardAccount.objects.get_or_create(
                user=user,
                defaults={
                    'current_balance': 0,
                    'total_points_earned': 0,
                    'total_points_redeemed': 0,
                    'tier_level': 'bronze'
                }
            )
            
            # Random transaction type
            trans_type, description, min_points, max_points = random.choice(transaction_types)
            
            # Skip redemptions if user doesn't have enough points
            if trans_type.startswith('redeemed') and account.current_balance < abs(min_points):
                continue
            
            # Random points amount
            if trans_type.startswith('redeemed'):
                # For redemptions, use negative values and respect balance
                max_redeem = min(abs(min_points), account.current_balance)
                if max_redeem < abs(min_points):
                    continue
                points = -random.randint(abs(min_points), int(max_redeem))
            else:
                points = random.randint(min_points, max_points)
            
            # Random date within the specified days
            days_ago = random.randint(0, self.days - 1)
            created_at = timezone.now() - timedelta(days=days_ago)
            
            # Update account balance
            if points > 0:
                account.current_balance += points
                account.total_points_earned += points
            else:
                account.current_balance += points  # points is negative
                account.total_points_redeemed += abs(points)
            
            # Update tier
            account._update_tier()
            account.save()
            
            # Create transaction
            transaction = PointsTransaction.objects.create(
                user=user,
                transaction_type=trans_type,
                points=points,
                balance_after=account.current_balance,
                description=description,
                created_at=created_at
            )
            
            created_count += 1
            
            # Show progress
            if created_count % 10 == 0:
                self.stdout.write(f'   Created {created_count} transactions...')
        
        self.stdout.write(f'   ✅ Created {created_count} sample transactions')
    
    def display_results(self):
        """
        Display simulation results.
        """
        self.stdout.write('\n📊 Simulation Results:')
        
        # Transaction statistics
        total_transactions = PointsTransaction.objects.count()
        earning_transactions = PointsTransaction.objects.filter(
            transaction_type__in=['earned_booking', 'earned_review', 'earned_referral', 'bonus_first_booking', 'bonus_weekend', 'bonus_tier_upgrade']
        ).count()
        redemption_transactions = PointsTransaction.objects.filter(
            transaction_type__in=['redeemed_voucher', 'redeemed_discount']
        ).count()
        
        self.stdout.write(f'   Total Transactions: {total_transactions}')
        self.stdout.write(f'   Earning Transactions: {earning_transactions}')
        self.stdout.write(f'   Redemption Transactions: {redemption_transactions}')
        
        # Points statistics
        from django.db.models import Sum
        total_earned = PointsTransaction.objects.filter(
            transaction_type__in=['earned_booking', 'earned_review', 'earned_referral', 'bonus_first_booking', 'bonus_weekend', 'bonus_tier_upgrade']
        ).aggregate(total=Sum('points'))['total'] or 0
        
        total_redeemed = PointsTransaction.objects.filter(
            transaction_type__in=['redeemed_voucher', 'redeemed_discount']
        ).aggregate(total=Sum('points'))['total'] or 0
        
        self.stdout.write(f'   Total Points Earned: {total_earned:,}')
        self.stdout.write(f'   Total Points Redeemed: {abs(total_redeemed):,}')
        self.stdout.write(f'   Net Points Outstanding: {total_earned + total_redeemed:,}')
        
        # Tier distribution
        from django.db.models import Count
        tier_stats = RewardAccount.objects.values('tier_level').annotate(count=Count('id')).order_by('tier_level')
        
        self.stdout.write('\n🏆 Updated Tier Distribution:')
        for tier in tier_stats:
            tier_name = tier['tier_level'].title()
            count = tier['count']
            self.stdout.write(f'   {tier_name}: {count} users')
        
        # Top users
        top_users = RewardAccount.objects.order_by('-current_balance')[:5]
        
        self.stdout.write('\n🥇 Top Users by Points Balance:')
        for i, account in enumerate(top_users, 1):
            self.stdout.write(f'   {i}. {account.user.username}: {account.current_balance:,} points ({account.tier_level.title()})')
        
        # Financial impact
        if self.config:
            total_outstanding = RewardAccount.objects.aggregate(total=Sum('current_balance'))['total'] or 0
            liability = total_outstanding * self.config.rupees_per_point
            
            self.stdout.write(f'\n💰 Financial Impact:')
            self.stdout.write(f'   Outstanding Points: {total_outstanding:,}')
            self.stdout.write(f'   Estimated Liability: ₹{liability:,.2f}')