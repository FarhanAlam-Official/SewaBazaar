from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random
import string
from decimal import Decimal

from apps.rewards.models import RewardAccount, RewardVoucher

User = get_user_model()


class Command(BaseCommand):
    """
    Management command to populate the database with sample voucher data.
    
    This command creates realistic sample voucher data for testing and
    development purposes. It generates vouchers with different statuses,
    values, and metadata to simulate real-world usage scenarios.
    
    Attributes:
        help (str): The help text for the command
    """
    help = 'Populate database with sample voucher data'

    def add_arguments(self, parser):
        """
        Add command line arguments to the parser.
        
        Defines the command line arguments that can be used to customize
        the voucher generation process.
        
        Args:
            parser (ArgumentParser): The argument parser to add arguments to
        """
        parser.add_argument(
            '--users',
            type=int,
            default=5,
            help='Number of users to create vouchers for',
        )
        parser.add_argument(
            '--vouchers-per-user',
            type=int,
            default=8,
            help='Number of vouchers to create per user',
        )

    def handle(self, *args, **options):
        """
        Handle the command execution.
        
        Main entry point for the command. Orchestrates the creation of
        reward accounts and vouchers for the specified users.
        
        Args:
            *args: Variable length argument list
            **options: Command line options
        """
        num_users = options['users']
        vouchers_per_user = options['vouchers_per_user']
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Creating vouchers for {num_users} users ({vouchers_per_user} vouchers each)...'
            )
        )

        # Get existing users instead of creating new ones
        users = list(User.objects.filter(role='customer')[:num_users])
        
        if len(users) < num_users:
            self.stdout.write(
                self.style.WARNING(
                    f'Only {len(users)} customer users found, creating vouchers for available users.'
                )
            )
        
        if not users:
            self.stdout.write(
                self.style.ERROR('No customer users found! Please create some users first.')
            )
            return

        for user in users:
            # Create or update reward account
            reward_account, created = RewardAccount.objects.get_or_create(
                user=user,
                defaults={
                    'points_balance': random.randint(500, 2500),
                    'total_points_earned': random.randint(2000, 10000),
                    'tier_level': random.choice([1, 2, 3, 4]),
                }
            )
            
            if created:
                self.stdout.write(f'Created reward account for {user.email}')

        # Voucher templates with different characteristics
        voucher_templates = [
            {
                'value_range': (50, 100),
                'status_weights': {'active': 60, 'used': 30, 'expired': 10},
                'source': 'reward',
                'metadata': {'tier': 'bronze', 'campaign': 'welcome_bonus'}
            },
            {
                'value_range': (100, 200),
                'status_weights': {'active': 70, 'used': 25, 'expired': 5},
                'source': 'purchase',
                'metadata': {'tier': 'silver', 'campaign': 'cashback'}
            },
            {
                'value_range': (200, 500),
                'status_weights': {'active': 80, 'used': 15, 'expired': 5},
                'source': 'gift',
                'metadata': {'tier': 'gold', 'campaign': 'referral_bonus'}
            },
            {
                'value_range': (25, 75),
                'status_weights': {'active': 50, 'used': 40, 'expired': 10},
                'source': 'reward',
                'metadata': {'tier': 'bronze', 'campaign': 'review_reward'}
            },
            {
                'value_range': (300, 1000),
                'status_weights': {'active': 90, 'used': 8, 'expired': 2},
                'source': 'gift',
                'metadata': {'tier': 'platinum', 'campaign': 'special_promotion'}
            },
        ]

        # Create vouchers for each user
        total_created = 0
        for user in users:
            for i in range(vouchers_per_user):
                template = random.choice(voucher_templates)
                
                # Generate voucher code
                date_part = timezone.now().strftime('%Y%m%d')
                random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
                voucher_code = f'SB-{date_part}-{random_part}'
                
                # Determine value and status
                min_val, max_val = template['value_range']
                original_value = Decimal(random.randint(min_val, max_val))
                
                # Choose status based on weights
                status_choices = list(template['status_weights'].keys())
                status_weights = list(template['status_weights'].values())
                status = random.choices(status_choices, weights=status_weights)[0]
                
                # Calculate used amount and remaining value based on status
                if status == 'used':
                    used_amount = original_value
                elif status == 'active':
                    if random.random() < 0.3:  # 30% chance of partial use
                        max_used = int(original_value * Decimal('0.8'))
                        used_amount = Decimal(random.randint(10, max_used))
                    else:
                        used_amount = Decimal('0.00')
                else:  # expired
                    used_amount = Decimal('0.00')
                
                # Set dates
                created_at = timezone.now() - timedelta(days=random.randint(1, 90))
                
                if status == 'expired':
                    expires_at = timezone.now() - timedelta(days=random.randint(1, 30))
                else:
                    expires_at = timezone.now() + timedelta(days=random.randint(30, 180))
                
                used_at = None
                if status == 'used' or used_amount > 0:
                    used_at = created_at + timedelta(days=random.randint(1, 30))
                
                # Calculate points redeemed (2 points per rupee)
                points_redeemed = int(original_value * 2) if template['source'] == 'reward' else 0
                
                # Create voucher
                voucher = RewardVoucher.objects.create(
                    user=user,
                    voucher_code=voucher_code,
                    value=original_value,
                    used_amount=used_amount,
                    status=status,
                    expires_at=expires_at,
                    used_at=used_at,
                    points_redeemed=points_redeemed,
                    metadata=template['metadata']
                )
                
                # Manually set created_at after creation
                voucher.created_at = created_at
                voucher.save(update_fields=['created_at'])
                
                total_created += 1
                
                # Show progress
                if total_created % 10 == 0:
                    self.stdout.write(f'Created {total_created} vouchers...')

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {total_created} vouchers for {len(users)} users!'
            )
        )
        
        # Display summary
        self.stdout.write('\n' + self.style.WARNING('Summary:'))
        for status in ['active', 'used', 'expired']:
            count = RewardVoucher.objects.filter(status=status).count()
            self.stdout.write(f'  {status.title()} vouchers: {count}')
        
        # Display value distribution
        from django.db.models import Sum
        total_value = RewardVoucher.objects.aggregate(
            total_value=Sum('value'),
            total_used=Sum('used_amount')
        )
        
        self.stdout.write(f'\nValue Distribution:')
        self.stdout.write(f'  Total voucher value: Rs. {total_value["total_value"] or 0}')
        self.stdout.write(f'  Total used value: Rs. {total_value["total_used"] or 0}')