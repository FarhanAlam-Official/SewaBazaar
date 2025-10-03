"""
Management command to set up the rewards system with default configuration.

This command:
1. Creates a default rewards configuration if none exists
2. Creates reward accounts for existing users who don't have them
3. Displays current system status

Usage: python manage.py setup_rewards_system
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.rewards.models import RewardsConfig, RewardAccount

User = get_user_model()


class Command(BaseCommand):
    """
    Django management command to set up the rewards system.
    
    This command initializes the rewards system with default configuration
    and ensures all existing users have reward accounts.
    """
    
    help = 'Set up the rewards system with default configuration and accounts'
    
    def add_arguments(self, parser):
        """
        Add command-line arguments for the setup command.
        
        Args:
            parser (ArgumentParser): The argument parser instance
        """
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reset existing configuration and create new default one',
        )
    
    def handle(self, *args, **options):
        """
        Main handler for the setup rewards system command.
        
        Args:
            *args: Variable length argument list
            **options: Command options dictionary
        """
        self.stdout.write(
            self.style.SUCCESS('🎯 Setting up SewaBazaar Rewards System...\n')
        )
        
        # 1. Handle rewards configuration
        self.setup_rewards_config(options['reset'])
        
        # 2. Create missing reward accounts
        self.create_missing_accounts()
        
        # 3. Display system status
        self.display_system_status()
        
        self.stdout.write(
            self.style.SUCCESS('\n✅ Rewards system setup completed!')
        )
    
    def setup_rewards_config(self, reset=False):
        """
        Set up rewards configuration.
        
        Args:
            reset (bool): Whether to reset existing configuration
        """
        self.stdout.write('📋 Checking rewards configuration...')
        
        if reset:
            # Deactivate all existing configs
            RewardsConfig.objects.all().update(is_active=False)
            self.stdout.write('   Reset existing configurations')
        
        # Check if active config exists
        active_config = RewardsConfig.objects.filter(is_active=True).first()
        
        if not active_config:
            # Create default configuration
            config = RewardsConfig.objects.create(
                is_active=True,
                points_per_rupee=0.1,  # 1 point per Rs.10
                rupees_per_point=0.1,  # 10 points = Rs.1
                points_per_review=50,
                points_per_referral=500,
                first_booking_bonus=200,
                weekend_booking_bonus=50,
                min_redemption_points=100,
                voucher_denominations=[100, 200, 500, 1000, 5000, 10000],
                tier_thresholds={
                    'silver': 1000,
                    'gold': 5000,
                    'platinum': 15000
                },
                tier_multipliers={
                    'bronze': 1.0,
                    'silver': 1.2,
                    'gold': 1.5,
                    'platinum': 2.0
                },
                points_expiry_months=12,
                voucher_validity_days=365
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'   ✅ Created default rewards configuration (ID: {config.id})')
            )
            
            # Display key settings
            self.stdout.write(f'   💰 Earning rate: 1 point per Rs.{1/config.points_per_rupee:.0f}')
            self.stdout.write(f'   🎁 Redemption rate: {1/config.rupees_per_point:.0f} points = Rs.1')
            self.stdout.write(f'   🏆 Tiers: Bronze → Silver ({config.tier_thresholds["silver"]} pts) → Gold ({config.tier_thresholds["gold"]} pts) → Platinum ({config.tier_thresholds["platinum"]} pts)')
            
        else:
            self.stdout.write(
                self.style.WARNING(f'   ⚠️  Active configuration already exists (ID: {active_config.id})')
            )
    
    def create_missing_accounts(self):
        """
        Create reward accounts for users who don't have them.
        """
        self.stdout.write('👥 Checking user reward accounts...')
        
        # Find users without reward accounts
        users_without_accounts = User.objects.filter(reward_account__isnull=True)
        count = users_without_accounts.count()
        
        if count > 0:
            self.stdout.write(f'   Found {count} users without reward accounts')
            
            # Create accounts
            created_count = 0
            for user in users_without_accounts:
                account, created = RewardAccount.objects.get_or_create(
                    user=user,
                    defaults={
                        'current_balance': 0,
                        'total_points_earned': 0,
                        'total_points_redeemed': 0,
                        'tier_level': 'bronze',
                        'lifetime_value': 0
                    }
                )
                if created:
                    created_count += 1
            
            self.stdout.write(
                self.style.SUCCESS(f'   ✅ Created {created_count} reward accounts')
            )
        else:
            self.stdout.write('   ✅ All users have reward accounts')
    
    def display_system_status(self):
        """
        Display current system status and statistics.
        """
        self.stdout.write('\n📊 System Status:')
        
        # Configuration status
        config = RewardsConfig.objects.filter(is_active=True).first()
        if config:
            status = "🟢 Active"
            if config.maintenance_mode:
                status = "🟡 Maintenance Mode"
        else:
            status = "🔴 No Active Configuration"
        
        self.stdout.write(f'   Configuration: {status}')
        
        # User statistics
        total_users = User.objects.count()
        users_with_accounts = RewardAccount.objects.count()
        
        self.stdout.write(f'   Total Users: {total_users}')
        self.stdout.write(f'   Users with Reward Accounts: {users_with_accounts}')
        
        # Points statistics
        if users_with_accounts > 0:
            from django.db.models import Sum
            
            stats = RewardAccount.objects.aggregate(
                total_points_issued=Sum('total_points_earned'),
                total_points_redeemed=Sum('total_points_redeemed'),
                total_points_outstanding=Sum('current_balance')
            )
            
            self.stdout.write(f'   Total Points Issued: {stats["total_points_issued"] or 0:,}')
            self.stdout.write(f'   Total Points Redeemed: {stats["total_points_redeemed"] or 0:,}')
            self.stdout.write(f'   Points Outstanding: {stats["total_points_outstanding"] or 0:,}')
            
            # Tier distribution
            from django.db.models import Count
            tier_stats = RewardAccount.objects.values('tier_level').annotate(count=Count('id'))
            
            self.stdout.write('\n🏆 Tier Distribution:')
            for tier in tier_stats:
                tier_name = tier['tier_level'].title()
                count = tier['count']
                percentage = (count / users_with_accounts) * 100
                self.stdout.write(f'   {tier_name}: {count} users ({percentage:.1f}%)')
        
        # Recent activity
        from apps.rewards.models import PointsTransaction
        from django.utils import timezone
        from datetime import timedelta
        
        yesterday = timezone.now() - timedelta(days=1)
        recent_transactions = PointsTransaction.objects.filter(created_at__gte=yesterday).count()
        
        self.stdout.write(f'\n📈 Recent Activity:')
        self.stdout.write(f'   Transactions in last 24h: {recent_transactions}')
        
        if config:
            self.stdout.write(f'\n⚙️  Current Configuration:')
            self.stdout.write(f'   Earning Rate: 1 point per Rs.{1/config.points_per_rupee:.0f}')
            self.stdout.write(f'   Redemption Rate: {1/config.rupees_per_point:.0f} points = Rs.1')
            self.stdout.write(f'   Available Vouchers: Rs.{", Rs.".join(map(str, sorted(config.voucher_denominations)))}')
            self.stdout.write(f'   Points Expiry: {config.points_expiry_months} months')
            self.stdout.write(f'   Voucher Validity: {config.voucher_validity_days} days')