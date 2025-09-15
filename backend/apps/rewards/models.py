"""
SewaBazaar Rewards System Models

This module contains the core models for the unified rewards and offers system.
The system includes:
- Reward points earning and redemption
- Voucher management
- Configuration management
- Transaction tracking

Phase 1: Core Rewards Models
- RewardAccount: User's reward points balance and tier status
- PointsTransaction: Complete history of points earning/spending
- RewardsConfig: System-wide configuration for rewards rules

Author: SewaBazaar Development Team
Created: September 2025
"""

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import uuid
import logging

logger = logging.getLogger(__name__)


class RewardsConfig(models.Model):
    """
    System-wide configuration for the rewards program.
    
    This model stores all configurable parameters that control how the rewards
    system operates. Only one active config should exist at any time.
    
    Key Features:
    - Point earning rates (points per rupee spent)
    - Redemption rates (points to rupee conversion)
    - Tier thresholds for customer loyalty levels
    - Expiry rules for points and vouchers
    - Bonus point values for different actions
    """

    # === POINT EARNING RATES ===
    points_per_rupee = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.10'),  # 10 points per 100 rupees spent
        validators=[MinValueValidator(Decimal('0.01')), MaxValueValidator(Decimal('1.00'))],
        help_text="Points earned per rupee spent (e.g., 0.10 = 10 points per 100 rupees)"
    )
    
    points_per_review = models.PositiveIntegerField(
        default=50,  # 50 points per review
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text="Points earned for writing a review"
    )
    
    points_per_referral = models.PositiveIntegerField(
        default=500,  # 500 points per successful referral
        validators=[MinValueValidator(1), MaxValueValidator(1000)],
        help_text="Points earned for referring a new customer"
    )
    
    first_booking_bonus = models.PositiveIntegerField(
        default=250,  # 250 bonus points
        validators=[MinValueValidator(0), MaxValueValidator(1000)],
        help_text="Bonus points for first booking"
    )
    
    weekend_booking_bonus = models.PositiveIntegerField(
        default=100,  # 100 bonus points
        validators=[MinValueValidator(0), MaxValueValidator(1000)],
        help_text="Bonus points for weekend bookings"
    )
    
    # === REDEMPTION RATES ===
    rupees_per_point = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.10'),  # 10 rupees per 100 points
        validators=[MinValueValidator(Decimal('0.01')), MaxValueValidator(Decimal('1.00'))],
        help_text="Rupees earned per point redeemed (e.g., 0.10 = 10 rupees per 100 points)"
    )
    
    min_redemption_points = models.PositiveIntegerField(
        default=100,
        validators=[MinValueValidator(10), MaxValueValidator(10000)],
        help_text="Minimum points required for redemption"
    )
    
    # Available voucher denominations (in rupees)
    voucher_denominations = models.JSONField(
        default=list,
        help_text="Available voucher amounts in rupees [100, 200, 500, 1000, 5000, 10000]"
    )
    
    # === TIER SYSTEM ===
    tier_thresholds = models.JSONField(
        default=dict,
        help_text="Points required for each tier {\"silver\": 1000, \"gold\": 5000, \"platinum\": 15000}"
    )
    
    tier_multipliers = models.JSONField(
        default=dict,
        help_text="Point earning multipliers for each tier {\"bronze\": 1.0, \"silver\": 1.2, \"gold\": 1.5, \"platinum\": 2.0}"
    )
    
    # === EXPIRY RULES ===
    points_expiry_months = models.PositiveIntegerField(
        default=12,
        validators=[MinValueValidator(1), MaxValueValidator(60)],
        help_text="Number of months after which unused points expire"
    )
    
    voucher_validity_days = models.PositiveIntegerField(
        default=365,
        validators=[MinValueValidator(30), MaxValueValidator(1095)],  # 30 days to 3 years
        help_text="Number of days a voucher remains valid after generation"
    )
    
    # === SYSTEM STATUS ===
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the rewards system is currently active"
    )
    
    maintenance_mode = models.BooleanField(
        default=False,
        help_text="Put rewards system in maintenance mode (no new transactions)"
    )
    
    # === AUDIT FIELDS ===
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': 'admin'},
        help_text="Admin who last updated this configuration"
    )
    
    class Meta:
        verbose_name = "Rewards Configuration"
        verbose_name_plural = "Rewards Configurations"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Rewards Config - {self.created_at.strftime('%Y-%m-%d')} ({'Active' if self.is_active else 'Inactive'})"
    
    def save(self, *args, **kwargs):
        """
        Ensure only one active configuration exists at a time.
        When saving a new active config, deactivate all others.
        """
        if self.is_active:
            # Deactivate all other configurations
            RewardsConfig.objects.filter(is_active=True).update(is_active=False)
        
        # Set default voucher denominations if empty
        if not self.voucher_denominations:
            self.voucher_denominations = [100, 200, 500, 1000, 5000, 10000]
        
        # Set default tier thresholds if empty
        if not self.tier_thresholds:
            self.tier_thresholds = {
                "silver": 1000,
                "gold": 5000, 
                "platinum": 15000
            }
        
        # Set default tier multipliers if empty
        if not self.tier_multipliers:
            self.tier_multipliers = {
                "bronze": 1.0,
                "silver": 1.2,
                "gold": 1.5,
                "platinum": 2.0
            }
        
        super().save(*args, **kwargs)
    
    @classmethod
    def get_active_config(cls):
        """
        Get the currently active rewards configuration.
        Creates a default one if none exists.
        """
        try:
            return cls.objects.get(is_active=True)
        except cls.DoesNotExist:
            # Create default configuration
            return cls.objects.create(
                is_active=True,
                voucher_denominations=[100, 200, 500, 1000, 5000, 10000],
                tier_thresholds={"silver": 1000, "gold": 5000, "platinum": 15000},
                tier_multipliers={"bronze": 1.0, "silver": 1.2, "gold": 1.5, "platinum": 2.0}
            )


class RewardAccount(models.Model):
    """
    User's reward account containing points balance and tier information.
    
    This model tracks:
    - Current points balance
    - Total points earned (lifetime)
    - Total points redeemed (lifetime)
    - Customer tier status
    - Lifetime value calculation
    
    Each user has exactly one reward account (OneToOne relationship).
    Account is automatically created when user makes their first booking.
    """
    
    # Available customer tiers
    TIER_CHOICES = (
        ('bronze', 'Bronze'),      # Default tier (0-999 points)
        ('silver', 'Silver'),      # 1000-4999 points
        ('gold', 'Gold'),          # 5000-14999 points 
        ('platinum', 'Platinum'),  # 15000+ points
    )
    
    # === CORE RELATIONSHIP ===
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reward_account',
        help_text="User who owns this reward account"
    )
    
    # === POINTS TRACKING ===
    current_balance = models.PositiveIntegerField(
        default=0,
        help_text="Current available points balance"
    )
    
    total_points_earned = models.PositiveIntegerField(
        default=0,
        help_text="Total points earned throughout account lifetime"
    )
    
    total_points_redeemed = models.PositiveIntegerField(
        default=0,
        help_text="Total points redeemed throughout account lifetime"
    )
    
    # === TIER MANAGEMENT ===
    tier_level = models.CharField(
        max_length=20,
        choices=TIER_CHOICES,
        default='bronze',
        help_text="Current customer tier based on total points earned"
    )
    
    tier_updated_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the tier was last updated"
    )
    
    # === LIFETIME VALUE ===
    lifetime_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Total amount spent by user across all bookings"
    )
    
    # === ENGAGEMENT METRICS ===
    last_points_earned = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When user last earned points"
    )
    
    last_points_redeemed = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When user last redeemed points"
    )
    
    total_referrals = models.PositiveIntegerField(
        default=0,
        help_text="Number of successful referrals made by this user"
    )
    
    # === AUDIT FIELDS ===
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Reward Account"
        verbose_name_plural = "Reward Accounts"
        ordering = ['-total_points_earned']
        indexes = [
            models.Index(fields=['tier_level']),
            models.Index(fields=['current_balance']),
            models.Index(fields=['total_points_earned']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.current_balance} points ({self.get_tier_level_display()})"
    
    def add_points(self, points, transaction_type, description, related_booking=None, related_voucher=None):
        """
        Add points to the account and create a transaction record.
        
        Args:
            points (int): Number of points to add
            transaction_type (str): Type of transaction (from PointsTransaction.TRANSACTION_TYPE_CHOICES)
            description (str): Description of the transaction
            related_booking: Optional related booking object
            related_voucher: Optional related voucher object
        
        Returns:
            PointsTransaction: The created transaction record
        """
        if points <= 0:
            raise ValueError("Points to add must be positive")
        
        # Update balances
        self.current_balance += points
        self.total_points_earned += points
        self.last_points_earned = timezone.now()
        
        # Check for tier upgrade
        self._update_tier()
        
        # Save the account
        self.save()
        
        # Create transaction record
        transaction = PointsTransaction.objects.create(
            user=self.user,
            transaction_type=transaction_type,
            points=points,  # Positive for earning
            balance_after=self.current_balance,
            description=description,
            booking=related_booking,
            voucher=related_voucher
        )
        
        return transaction
    
    def redeem_points(self, points, transaction_type, description, related_voucher=None):
        """
        Redeem points from the account and create a transaction record.
        
        Args:
            points (int): Number of points to redeem
            transaction_type (str): Type of transaction
            description (str): Description of the transaction
            related_voucher: Optional related voucher object
        
        Returns:
            PointsTransaction: The created transaction record
        
        Raises:
            ValueError: If insufficient points or invalid amount
        """
        if points <= 0:
            raise ValueError("Points to redeem must be positive")
        
        if self.current_balance < points:
            raise ValueError(f"Insufficient points. Available: {self.current_balance}, Required: {points}")
        
        # Update balances
        self.current_balance -= points
        self.total_points_redeemed += points
        self.last_points_redeemed = timezone.now()
        
        # Save the account
        self.save()
        
        # Create transaction record
        transaction = PointsTransaction.objects.create(
            user=self.user,
            transaction_type=transaction_type,
            points=-points,  # Negative for redemption
            balance_after=self.current_balance,
            description=description,
            voucher=related_voucher
        )
        
        return transaction
    
    def _update_tier(self):
        """
        Update user's tier based on total points earned.
        Uses the current rewards configuration for thresholds.
        """
        config = RewardsConfig.get_active_config()
        thresholds = config.tier_thresholds
        
        old_tier = self.tier_level
        new_tier = 'bronze'  # Default tier
        
        # Determine new tier based on total points earned
        if self.total_points_earned >= thresholds.get('platinum', 15000):
            new_tier = 'platinum'
        elif self.total_points_earned >= thresholds.get('gold', 5000):
            new_tier = 'gold'
        elif self.total_points_earned >= thresholds.get('silver', 1000):
            new_tier = 'silver'
        
        # Update tier if changed
        if new_tier != old_tier:
            self.tier_level = new_tier
            self.tier_updated_at = timezone.now()
            
            # TODO: Send tier upgrade notification
            # This will be implemented in Phase 3 with notifications
    
    def get_tier_progress(self):
        """
        Get progress towards the next tier.
        
        Returns:
            dict: Contains current tier, next tier, points needed, and progress percentage
        """
        config = RewardsConfig.get_active_config()
        thresholds = config.tier_thresholds
        
        current_points = self.total_points_earned
        current_tier = self.tier_level
        
        tier_order = ['bronze', 'silver', 'gold', 'platinum']
        current_index = tier_order.index(current_tier)
        
        if current_index == len(tier_order) - 1:
            # Already at highest tier
            return {
                'current_tier': current_tier,
                'next_tier': None,
                'points_needed': 0,
                'progress_percentage': 100,
                'is_max_tier': True
            }
        
        next_tier = tier_order[current_index + 1]
        next_threshold = thresholds.get(next_tier, 0)
        
        if current_index == 0:  # Bronze tier
            current_threshold = 0
        else:
            current_tier_name = tier_order[current_index]
            current_threshold = thresholds.get(current_tier_name, 0)
        
        points_needed = max(0, next_threshold - current_points)
        progress = min(100, ((current_points - current_threshold) / (next_threshold - current_threshold)) * 100)
        
        return {
            'current_tier': current_tier,
            'next_tier': next_tier,
            'points_needed': points_needed,
            'progress_percentage': round(progress, 1),
            'is_max_tier': False
        }
    
    def calculate_tier_multiplier(self):
        """
        Get the point earning multiplier for the user's current tier.
        
        Returns:
            float: Multiplier value (e.g., 1.0 for bronze, 1.2 for silver)
        """
        config = RewardsConfig.get_active_config()
        multipliers = config.tier_multipliers
        return multipliers.get(self.tier_level, 1.0)


class PointsTransaction(models.Model):
    """
    Complete history of all points transactions (earning and redemption).
    
    This model provides:
    - Audit trail for all points activity
    - Transaction categorization by type
    - Links to related objects (bookings, vouchers)
    - Balance tracking after each transaction
    - Metadata storage for additional context
    
    All points changes must go through this model for proper tracking.
    """
    
    # Types of points transactions
    TRANSACTION_TYPE_CHOICES = (
        # === EARNING TRANSACTIONS ===
        ('earned_booking', 'Earned from Booking'),
        ('earned_review', 'Earned from Review'),
        ('earned_referral', 'Earned from Referral'),
        ('earned_first_booking', 'First Booking Bonus'),
        ('earned_weekend_booking', 'Weekend Booking Bonus'),
        ('earned_tier_bonus', 'Tier Upgrade Bonus'),
        ('earned_special', 'Special Promotion'),
        ('earned_admin_bonus', 'Admin Bonus'),
        
        # === REDEMPTION TRANSACTIONS ===
        ('redeemed_voucher', 'Redeemed for Voucher'),
        ('redeemed_discount', 'Applied as Discount'),
        
        # === SYSTEM TRANSACTIONS ===
        ('expired', 'Points Expired'),
        ('adjustment_positive', 'Admin Adjustment (Credit)'),
        ('adjustment_negative', 'Admin Adjustment (Debit)'),
        ('refund', 'Booking Cancellation Refund'),
    )
    
    # === CORE FIELDS ===
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='points_transactions',
        help_text="User who performed this transaction"
    )
    
    transaction_type = models.CharField(
        max_length=30,
        choices=TRANSACTION_TYPE_CHOICES,
        help_text="Type of points transaction"
    )
    
    points = models.IntegerField(
        help_text="Points amount (positive for earning, negative for redemption)"
    )
    
    balance_after = models.PositiveIntegerField(
        help_text="User's points balance after this transaction"
    )
    
    # === DESCRIPTIVE FIELDS ===
    description = models.CharField(
        max_length=255,
        help_text="Human-readable description of the transaction"
    )
    
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional transaction data (tier info, multipliers, etc.)"
    )
    
    # === RELATED OBJECTS ===
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='points_transactions',
        help_text="Related booking if applicable"
    )
    
    voucher = models.ForeignKey(
        'rewards.RewardVoucher',  # Forward reference since RewardVoucher is defined later
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='points_transactions',
        help_text="Related voucher if applicable"
    )
    
    # === ADMIN FIELDS ===
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_transactions',
        help_text="Admin who processed this transaction (for manual adjustments)"
    )
    
    # === AUDIT FIELDS ===
    created_at = models.DateTimeField(auto_now_add=True)
    
    # === TECHNICAL FIELDS ===
    transaction_id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        help_text="Unique identifier for this transaction"
    )
    
    class Meta:
        verbose_name = "Points Transaction"
        verbose_name_plural = "Points Transactions"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['transaction_type']),
            models.Index(fields=['booking']),
            models.Index(fields=['voucher']),
            models.Index(fields=['transaction_id']),
        ]
    
    def __str__(self):
        sign = '+' if self.points > 0 else ''
        return f"{self.user.get_full_name()} - {sign}{self.points} points ({self.get_transaction_type_display()})"
    
    def save(self, *args, **kwargs):
        """
        Validate transaction data before saving.
        """
        # Ensure points is not zero
        if self.points == 0:
            raise ValueError("Transaction points cannot be zero")
        
        # Validate balance_after is not negative
        if self.balance_after < 0:
            raise ValueError("Balance after transaction cannot be negative")
        
        super().save(*args, **kwargs)
    
    @property
    def is_earning_transaction(self):
        """Check if this is a points earning transaction."""
        return self.points > 0
    
    @property
    def is_redemption_transaction(self):
        """Check if this is a points redemption transaction."""
        return self.points < 0
    
    @property
    def absolute_points(self):
        """Get absolute value of points for display purposes."""
        return abs(self.points)


class RewardVoucherManager(models.Manager):
    """Custom manager for RewardVoucher with automatic expiry checking."""
    
    def get_queryset(self):
        """Return standard queryset without automatic expiry updates to avoid recursion."""
        return super().get_queryset()
    
    def update_expired_vouchers(self):
        """Update status of expired vouchers that haven't been marked as expired yet."""
        from django.utils import timezone
        
        # Use super().get_queryset() to avoid recursion
        # Find vouchers that are expired but not marked as such
        expired_vouchers = super().get_queryset().filter(
            expires_at__lt=timezone.now(),
            status__in=['active']  # Only update active vouchers
        )
        
        # Bulk update their status
        count = expired_vouchers.update(status='expired')
        
        if count > 0:
            logger.info(f"Automatically marked {count} vouchers as expired")
        
        return count
    
    def get_user_vouchers(self, user):
        """Get user's vouchers with automatic expiry checking."""
        # First update any expired vouchers
        self.update_expired_vouchers()
        # Then return user's vouchers
        return self.filter(user=user).order_by('-created_at')


class RewardVoucher(models.Model):
    """
    Fixed-value vouchers that users can redeem using their points.
    
    Key Features:
    - Users redeem points to create vouchers
    - Simple voucher usage (can be used on any booking amount)
    - If booking < voucher value, remaining value is simply lost (user's choice)
    - QR code support for mobile usage
    - Expiry dates and status tracking
    - Integration with booking system
    
    Usage Rules:
    - Voucher can be used on any booking amount > 0
    - If booking amount < voucher value, user "wastes" the difference
    - If booking amount >= voucher value, full voucher is applied
    - Voucher is marked as "used" after any usage
    - No complex validations or restrictions
    
    Examples:
    - Rs. 500 voucher on Rs. 300 booking → Rs. 300 discount, Rs. 200 wasted
    - Rs. 500 voucher on Rs. 700 booking → Rs. 500 discount, Rs. 200 to pay
    - User's choice whether to "waste" voucher value
    
    Lifecycle:
    1. User redeems points → voucher created (status='active')
    2. User applies voucher to any booking → voucher used (status='used')
    3. Voucher expires → status='expired'
    4. Admin can cancel → status='cancelled' + full refund
    """
    
    # === VOUCHER STATUS CHOICES ===
    VOUCHER_STATUS_CHOICES = [
        ('active', 'Active'),
        ('used', 'Used'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]
    
    # === VOUCHER USAGE POLICY ===
    # Fixed-value vouchers only - no partial usage complexity
    USAGE_POLICY_FIXED = 'fixed'
    
    # === CORE FIELDS ===
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reward_vouchers',
        help_text="User who redeemed points for this voucher"
    )
    
    voucher_code = models.CharField(
        max_length=20,
        unique=True,
        help_text="Unique voucher code for redemption"
    )
    
    value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Voucher value in rupees"
    )
    
    points_redeemed = models.PositiveIntegerField(
        help_text="Number of points redeemed to create this voucher"
    )
    
    # === STATUS TRACKING ===
    status = models.CharField(
        max_length=10,
        choices=VOUCHER_STATUS_CHOICES,
        default='active',
        help_text="Current voucher status"
    )
    
    # === DATES ===
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the voucher was created"
    )
    
    expires_at = models.DateTimeField(
        help_text="When the voucher expires"
    )
    
    used_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the voucher was used (if applicable)"
    )
    
    # === USAGE TRACKING ===
    used_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Amount of voucher that has been used"
    )
    
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reward_vouchers_used',
        help_text="Booking where this voucher was used"
    )
    
    # === QR CODE SUPPORT ===
    qr_code_data = models.TextField(
        blank=True,
        help_text="QR code data for mobile redemption"
    )
    
    # === METADATA ===
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional voucher metadata"
    )
    
    # === VOUCHER POLICY ===
    usage_policy = models.CharField(
        max_length=20,
        default='fixed',
        editable=False,  # Always fixed-value, not editable
        help_text="Voucher usage policy - always fixed-value"
    )
    
    # === AUDIT FIELDS ===
    updated_at = models.DateTimeField(auto_now=True)
    
    # === CUSTOM MANAGER ===
    objects = RewardVoucherManager()
    
    class Meta:
        verbose_name = "Reward Voucher"
        verbose_name_plural = "Reward Vouchers"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['voucher_code']),
            models.Index(fields=['status']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['booking']),
        ]
    
    def __str__(self):
        return f"Voucher {self.voucher_code} - Rs.{self.value} ({self.status})"
    
    def save(self, *args, **kwargs):
        """
        Generate voucher code and QR data on creation.
        """
        if not self.voucher_code:
            self.voucher_code = self.generate_voucher_code()
        
        if not self.qr_code_data:
            self.qr_code_data = self.generate_qr_data()
        
        # Auto-set expiry date if not provided
        if not self.expires_at:
            config = RewardsConfig.get_active_config()
            self.expires_at = timezone.now() + timedelta(days=config.voucher_validity_days)
        
        super().save(*args, **kwargs)
    
    def generate_voucher_code(self):
        """
        Generate a unique voucher code.
        
        Format: SB-YYYYMMDD-XXXXXX
        Where XXXXXX is a random 6-character alphanumeric string
        """
        import secrets
        import string
        from datetime import datetime
        
        date_str = datetime.now().strftime('%Y%m%d')
        random_str = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
        
        base_code = f"SB-{date_str}-{random_str}"
        
        # Ensure uniqueness
        counter = 1
        voucher_code = base_code
        while RewardVoucher.objects.filter(voucher_code=voucher_code).exists():
            voucher_code = f"{base_code}-{counter}"
            counter += 1
        
        return voucher_code
    
    def generate_qr_data(self):
        """
        Generate QR code data for mobile redemption.
        
        Returns JSON string with voucher information for QR code.
        """
        import json
        
        qr_data = {
            'type': 'sewabazaar_voucher',
            'code': self.voucher_code,
            'value': str(self.value),
            'user_id': self.user.id,
            'created': self.created_at.isoformat() if self.created_at else timezone.now().isoformat(),
            'expires': self.expires_at.isoformat() if self.expires_at else None
        }
        
        return json.dumps(qr_data)
    
    @property
    def is_valid(self):
        """
        Check if voucher is valid for use (fixed-value vouchers).
        
        Returns:
            bool: True if voucher can be used, False otherwise
        """
        return (
            self.status == 'active' and
            self.expires_at > timezone.now()
        )
    
    @property
    def is_expired(self):
        """Check if voucher has expired."""
        return timezone.now() > self.expires_at
    
    def check_and_update_expiry(self):
        """
        Check if voucher has expired and automatically update status if needed.
        Returns True if voucher was expired and status was updated.
        """
        if self.status not in ['expired', 'used'] and self.is_expired:
            # Voucher has expired but status not yet updated
            self.status = 'expired'
            self.save(update_fields=['status'])
            return True
        return False
    
    def get_current_status(self):
        """
        Get current voucher status, automatically updating expiry if needed.
        Use this method instead of directly accessing .status to ensure accuracy.
        """
        self.check_and_update_expiry()
        return self.status
    
    @property
    def remaining_value(self):
        """Get remaining voucher value (for fixed-value vouchers, it's either full value or 0)."""
        if self.status == 'used':
            return Decimal('0')
        else:
            return self.value
    
    @property
    def is_fully_used(self):
        """Check if voucher has been fully used (for fixed-value, same as status == 'used')."""
        return self.status == 'used'
    
    @property
    def days_until_expiry(self):
        """Get number of days until voucher expires."""
        if self.is_expired:
            return 0
        return (self.expires_at - timezone.now()).days
    
    def use_voucher(self, amount, booking=None):
        """
        Use voucher for a specific amount (Legacy method - redirects to fixed-value logic).
        
        Args:
            amount (Decimal): Amount to use from voucher (should equal voucher value)
            booking (Booking, optional): Booking where voucher is used
            
        Returns:
            Decimal: Actual amount deducted from voucher (always full voucher value)
            
        Raises:
            ValueError: If voucher cannot be used or amount is invalid
        """
        from decimal import Decimal
        
        # For fixed-value vouchers, amount should equal voucher value
        if not isinstance(amount, Decimal):
            amount = Decimal(str(amount))
        
        # Apply fixed-value logic
        result = self.apply_to_booking(amount, booking)
        return result['discount_amount']
    
    def cancel_voucher(self, reason=""):
        """
        Cancel the voucher and refund full points to user.
        
        Args:
            reason (str): Reason for cancellation
            
        Returns:
            PointsTransaction: Transaction record for the refund
        """
        if self.status != 'active':
            raise ValueError(f"Cannot cancel voucher with status: {self.status}")
        
        # Mark voucher as cancelled
        self.status = 'cancelled'
        self.metadata['cancellation_reason'] = reason
        self.metadata['cancelled_at'] = timezone.now().isoformat()
        self.save()
        
        # Refund full points to user account (since voucher is unused)
        account = RewardAccount.objects.get(user=self.user)
        
        transaction = account.add_points(
            points=self.points_redeemed,
            transaction_type='refund_voucher_cancelled',
            description=f"Refund for cancelled voucher {self.voucher_code}",
            related_voucher=self
        )
        return transaction
    
    def extend_expiry(self, days):
        """
        Extend voucher expiry date.
        
        Args:
            days (int): Number of days to extend
        """
        if days <= 0:
            raise ValueError("Extension days must be positive")
        
        self.expires_at += timedelta(days=days)
        self.metadata['expiry_extended'] = self.metadata.get('expiry_extended', 0) + days
        self.metadata['last_extension'] = timezone.now().isoformat()
        self.save()
    
    @classmethod
    def create_voucher(cls, user, denomination, points_cost):
        """
        Create a new voucher by redeeming points.
        
        Args:
            user (User): User redeeming points
            denomination (Decimal): Voucher value in rupees
            points_cost (int): Points required for redemption
            
        Returns:
            RewardVoucher: Created voucher instance
            
        Raises:
            ValueError: If user doesn't have enough points or invalid denomination
        """
        # Validate denomination
        config = RewardsConfig.get_active_config()
        if denomination not in config.voucher_denominations:
            raise ValueError(f"Invalid denomination: Rs.{denomination}")
        
        # Check user has enough points
        account = RewardAccount.objects.get(user=user)
        if account.current_balance < points_cost:
            raise ValueError(f"Insufficient points. Required: {points_cost}, Available: {account.current_balance}")
        
        # Deduct points from account
        transaction = account.redeem_points(
            points=points_cost,
            transaction_type='redeemed_voucher',
            description=f"Redeemed Rs.{denomination} voucher",
            related_voucher=None  # Will be set after voucher creation
        )
        
        # Create voucher
        voucher = cls.objects.create(
            user=user,
            value=denomination,
            points_redeemed=points_cost
        )
        
        # Link transaction to voucher
        transaction.voucher = voucher
        transaction.save()
        
        return voucher
    
    # === FIXED-VALUE VOUCHER METHODS ===
    
    def can_use_for_booking(self, booking_amount):
        """
        Check if this voucher can be used for a booking.
        Simple check - no minimum amount restrictions.
        
        Args:
            booking_amount (Decimal): Total booking amount
            
        Returns:
            tuple: (can_use: bool, reason: str)
        """
        from decimal import Decimal
        
        # Ensure booking_amount is Decimal
        if not isinstance(booking_amount, Decimal):
            booking_amount = Decimal(str(booking_amount))
        
        # Check basic validity only
        if not self.is_valid:
            if self.status == 'used':
                return False, "Voucher has already been used"
            elif self.status == 'expired' or self.is_expired:
                return False, "Voucher has expired"
            elif self.status == 'cancelled':
                return False, "Voucher has been cancelled"
            else:
                return False, f"Voucher is not valid (status: {self.status})"
        
        # No minimum booking amount check - user can use voucher on any amount
        if booking_amount <= 0:
            return False, "Booking amount must be greater than zero"
        
        return True, "Voucher can be applied to this booking"
    
    def apply_to_booking(self, booking_amount, booking=None):
        """
        Apply this voucher to a booking - simple approach.
        User can use voucher on any booking amount, even if less than voucher value.
        
        Args:
            booking_amount (Decimal): Total booking amount
            booking (Booking, optional): Booking instance
            
        Returns:
            dict: {
                'discount_amount': Decimal,
                'final_amount': Decimal, 
                'voucher_code': str,
                'message': str
            }
            
        Raises:
            ValueError: If voucher cannot be used for this booking
        """
        from decimal import Decimal
        
        # Validate usage
        can_use, reason = self.can_use_for_booking(booking_amount)
        if not can_use:
            raise ValueError(reason)
        
        # Ensure booking_amount is Decimal
        if not isinstance(booking_amount, Decimal):
            booking_amount = Decimal(str(booking_amount))
        
        # Apply voucher - either full voucher value or booking amount, whichever is smaller
        discount_amount = min(self.value, booking_amount)
        final_amount = max(Decimal('0'), booking_amount - discount_amount)
        
        # Mark voucher as used (full voucher is consumed regardless)
        self.status = 'used'
        self.used_at = timezone.now()
        self.used_amount = self.value  # Full amount is marked as used
        
        # Link to booking if provided
        if booking:
            self.booking = booking
        
        self.save()
        
        # Create appropriate message
        if discount_amount < self.value:
            wasted_amount = self.value - discount_amount
            message = f"Rs. {discount_amount} discount applied. Rs. {wasted_amount} voucher value unused."
        else:
            message = f"Rs. {discount_amount} voucher applied successfully"
        
        return {
            'discount_amount': discount_amount,
            'final_amount': final_amount,
            'voucher_code': self.voucher_code,
            'message': message
        }
    
    def get_usage_summary(self):
        """
        Get a summary of voucher usage for display.
        
        Returns:
            dict: Usage summary information
        """
        return {
            'voucher_code': self.voucher_code,
            'value': float(self.value),
            'status': self.status,
            'usage_policy': 'simple',
            'can_use_on_any_amount': True,
            'is_used': self.status == 'used',
            'is_expired': self.is_expired,
            'days_until_expiry': self.days_until_expiry,
            'can_be_used': self.is_valid,
        }
