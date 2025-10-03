"""
Serializers for SewaBazaar Rewards System API

This module contains DRF serializers for converting between
model instances and JSON representations for the rewards API.

- RewardAccountSerializer: User's reward account information
- PointsTransactionSerializer: Transaction history data
- RewardsConfigSerializer: Configuration data (admin only)
- RewardVoucherSerializer: Voucher information
- VoucherRedemptionSerializer: Voucher redemption requests
- VoucherValidationSerializer: Voucher validation requests
- AvailableVouchersSerializer: Available voucher denominations
- RewardsStatisticsSerializer: System statistics data

Features:
- Comprehensive field validation
- Custom field calculations
- Nested relationship handling
- Permission-based field inclusion
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import RewardAccount, PointsTransaction, RewardsConfig, RewardVoucher

User = get_user_model()


class RewardAccountSerializer(serializers.ModelSerializer):
    """
    Serializer for user reward account information.
    
    Provides complete reward account data including:
    - Current points balance
    - Lifetime statistics
    - Tier information and progress
    - Recent activity timestamps
    
    Read-only serializer - accounts are managed through business logic, not direct API calls.
    
    Fields:
        current_balance (int): Current available points balance
        total_points_earned (int): Total points earned throughout account lifetime
        total_points_redeemed (int): Total points redeemed throughout account lifetime
        lifetime_value (Decimal): Total amount spent by user across all bookings
        user_name (str): User's full name
        user_email (str): User's email address
        tier_level (str): Current customer tier
        tier_display (str): Human-readable tier name
        tier_progress (dict): Progress towards next tier
        tier_multiplier (float): Current tier's points earning multiplier
        tier_updated_at (DateTime): When the tier was last updated
        balance_in_rupees (float): Current balance value in rupees
        next_voucher_points (dict): Points needed for next available voucher
        total_referrals (int): Number of successful referrals made by this user
        last_points_earned (DateTime): When user last earned points
        last_points_redeemed (DateTime): When user last redeemed points
        days_since_last_activity (int): Days since last points activity
        is_active_user (bool): Whether user is considered active
        created_at (DateTime): When this account was created
        updated_at (DateTime): When this account was last updated
    """
    
    # Computed fields for enhanced user experience
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    # Tier information with progress calculation
    tier_display = serializers.CharField(source='get_tier_level_display', read_only=True)
    tier_progress = serializers.SerializerMethodField()
    tier_multiplier = serializers.SerializerMethodField()
    
    # Balance ratios and conversion info
    balance_in_rupees = serializers.SerializerMethodField()
    next_voucher_points = serializers.SerializerMethodField()
    
    # Activity indicators
    days_since_last_activity = serializers.SerializerMethodField()
    is_active_user = serializers.SerializerMethodField()
    
    class Meta:
        model = RewardAccount
        fields = [
            # Core account data
            'current_balance',
            'total_points_earned', 
            'total_points_redeemed',
            'lifetime_value',
            
            # User information
            'user_name',
            'user_email',
            
            # Tier system
            'tier_level',
            'tier_display',
            'tier_progress',
            'tier_multiplier',
            'tier_updated_at',
            
            # Conversion information
            'balance_in_rupees',
            'next_voucher_points',
            
            # Engagement metrics
            'total_referrals',
            'last_points_earned',
            'last_points_redeemed',
            'days_since_last_activity',
            'is_active_user',
            
            # Timestamps
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'current_balance',
            'total_points_earned', 
            'total_points_redeemed',
            'lifetime_value',
            'user_name',
            'user_email',
            'tier_level',
            'tier_display',
            'tier_progress',
            'tier_multiplier',
            'tier_updated_at',
            'balance_in_rupees',
            'next_voucher_points',
            'total_referrals',
            'last_points_earned',
            'last_points_redeemed',
            'days_since_last_activity',
            'is_active_user',
            'created_at',
            'updated_at'
        ]  # Changed from string to list
    
    def get_tier_progress(self, obj):
        """
        Get detailed tier progression information.
        
        Args:
            obj (RewardAccount): The reward account instance
            
        Returns:
            dict: Tier progression information
        """
        return obj.get_tier_progress()
    
    def get_tier_multiplier(self, obj):
        """
        Get current tier's points earning multiplier.
        
        Args:
            obj (RewardAccount): The reward account instance
            
        Returns:
            float: Multiplier value
        """
        return obj.calculate_tier_multiplier()
    
    def get_balance_in_rupees(self, obj):
        """
        Calculate current balance value in rupees.
        
        Args:
            obj (RewardAccount): The reward account instance
            
        Returns:
            float: Balance value in rupees
        """
        try:
            config = RewardsConfig.get_active_config()
            return float(obj.current_balance * config.rupees_per_point)
        except:
            return 0.0
    
    def get_next_voucher_points(self, obj):
        """
        Calculate points needed for next available voucher.
        
        Args:
            obj (RewardAccount): The reward account instance
            
        Returns:
            dict: Information about next voucher or None if user can afford all
        """
        try:
            config = RewardsConfig.get_active_config()
            voucher_denoms = sorted(config.voucher_denominations)
            
            for denom in voucher_denoms:
                points_needed = int(denom / config.rupees_per_point)
                if points_needed > obj.current_balance:
                    return {
                        'voucher_value': denom,
                        'points_needed': points_needed,
                        'points_short': points_needed - obj.current_balance
                    }
            
            # User can afford all vouchers
            return None
        except:
            return None
    
    def get_days_since_last_activity(self, obj):
        """
        Calculate days since last points activity.
        
        Args:
            obj (RewardAccount): The reward account instance
            
        Returns:
            int: Days since last activity or None if no activity
        """
        from django.utils import timezone
        
        last_activity = None
        if obj.last_points_earned and obj.last_points_redeemed:
            last_activity = max(obj.last_points_earned, obj.last_points_redeemed)
        elif obj.last_points_earned:
            last_activity = obj.last_points_earned
        elif obj.last_points_redeemed:
            last_activity = obj.last_points_redeemed
        
        if last_activity:
            delta = timezone.now() - last_activity
            return delta.days
        
        return None
    
    def get_is_active_user(self, obj):
        """
        Determine if user is considered active (activity within 30 days).
        
        Args:
            obj (RewardAccount): The reward account instance
            
        Returns:
            bool: True if user is active, False otherwise
        """
        days_since = self.get_days_since_last_activity(obj)
        return days_since is not None and days_since <= 30


class PointsTransactionSerializer(serializers.ModelSerializer):
    """
    Serializer for points transaction history.
    
    Provides detailed transaction information including:
    - Transaction type and description
    - Points amount (positive/negative)
    - Balance after transaction
    - Related objects (bookings, vouchers)
    - Transaction metadata
    
    Read-only serializer for audit trail purposes.
    
    Fields:
        transaction_id (UUID): Unique identifier for this transaction
        transaction_type (str): Type of points transaction
        transaction_type_display (str): Human-readable transaction type
        points (int): Points amount (positive for earning, negative for redemption)
        absolute_points (int): Absolute value of points for display
        balance_after (int): User's points balance after this transaction
        description (str): Human-readable description of the transaction
        is_earning (bool): Whether this is a points earning transaction
        is_redemption (bool): Whether this is a points redemption transaction
        booking_details (dict): Related booking information if available
        voucher_details (dict): Related voucher information if available
        processed_by_name (str): Name of admin who processed this transaction
        user_name (str): User's full name
        user_email (str): User's email address
        metadata (dict): Additional transaction data
        created_at (DateTime): When this transaction was created
    """
    
    # Enhanced display fields
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    is_earning = serializers.BooleanField(source='is_earning_transaction', read_only=True)
    is_redemption = serializers.BooleanField(source='is_redemption_transaction', read_only=True)
    absolute_points = serializers.IntegerField(read_only=True)
    
    # Related object information
    booking_details = serializers.SerializerMethodField()
    voucher_details = serializers.SerializerMethodField()
    processed_by_name = serializers.CharField(source='processed_by.get_full_name', read_only=True)
    
    # User information (for admin views)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = PointsTransaction
        fields = [
            # Core transaction data
            'transaction_id',
            'transaction_type',
            'transaction_type_display',
            'points',
            'absolute_points',
            'balance_after',
            'description',
            
            # Transaction categorization
            'is_earning',
            'is_redemption',
            
            # User information
            'user_name',
            'user_email',
            
            # Related objects
            'booking_details',
            'voucher_details',
            'processed_by_name',
            
            # Additional data
            'metadata',
            
            # Timestamps
            'created_at'
        ]
        read_only_fields = [
            'transaction_id',
            'transaction_type',
            'transaction_type_display',
            'points',
            'absolute_points',
            'balance_after',
            'description',
            'is_earning',
            'is_redemption',
            'user_name',
            'user_email',
            'booking_details',
            'voucher_details',
            'processed_by_name',
            'metadata',
            'created_at'
        ]  # Changed from string to list
    
    def get_booking_details(self, obj):
        """
        Get related booking information if available.
        
        Args:
            obj (PointsTransaction): The points transaction instance
            
        Returns:
            dict: Booking details or None if no booking
        """
        if obj.booking:
            return {
                'id': obj.booking.id,
                'service_name': obj.booking.service.title,
                'booking_date': obj.booking.booking_date,
                'total_amount': float(obj.booking.total_amount),
                'status': obj.booking.status
            }
        return None
    
    def get_voucher_details(self, obj):
        """
        Get related voucher information if available.
        
        Args:
            obj (PointsTransaction): The points transaction instance
            
        Returns:
            dict: Voucher details or None if no voucher
        """
        if obj.voucher:
            return {
                'id': obj.voucher.id,
                'value': float(obj.voucher.value),
                'voucher_code': getattr(obj.voucher, 'voucher_code', None),
                'status': getattr(obj.voucher, 'status', None)
            }
        return None


class RewardsConfigSerializer(serializers.ModelSerializer):
    """
    Serializer for rewards system configuration.
    
    Used by admin APIs to manage system-wide rewards settings.
    Includes validation for configuration parameters and
    automatic calculation of derived values.
    
    Write access restricted to admin users only.
    
    Fields:
        id (int): Configuration ID
        is_active (bool): Whether the rewards system is currently active
        maintenance_mode (bool): Whether rewards system is in maintenance mode
        points_per_rupee (Decimal): Points earned per rupee spent
        earning_rate_display (str): Human-readable earning rate
        points_per_review (int): Points earned for writing a review
        points_per_referral (int): Points earned for referring a new customer
        first_booking_bonus (int): Bonus points for first booking
        weekend_booking_bonus (int): Bonus points for weekend bookings
        rupees_per_point (Decimal): Rupees earned per point redeemed
        conversion_ratio_display (str): Human-readable conversion ratio
        min_redemption_points (int): Minimum points required for redemption
        voucher_denominations (list): Available voucher amounts in rupees
        tier_thresholds (dict): Points required for each tier
        tier_multipliers (dict): Point earning multipliers for each tier
        points_expiry_months (int): Number of months after which unused points expire
        voucher_validity_days (int): Number of days a voucher remains valid
        updated_by_name (str): Name of admin who last updated this configuration
        created_at (DateTime): When this configuration was created
        updated_at (DateTime): When this configuration was last updated
    """
    
    # Computed fields for better understanding
    conversion_ratio_display = serializers.SerializerMethodField()
    earning_rate_display = serializers.SerializerMethodField()
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)
    
    class Meta:
        model = RewardsConfig
        fields = [
            # System status
            'id',
            'is_active',
            'maintenance_mode',
            
            # Point earning configuration
            'points_per_rupee',
            'earning_rate_display',
            'points_per_review',
            'points_per_referral', 
            'first_booking_bonus',
            'weekend_booking_bonus',
            
            # Redemption configuration
            'rupees_per_point',
            'conversion_ratio_display',
            'min_redemption_points',
            'voucher_denominations',
            
            # Tier system
            'tier_thresholds',
            'tier_multipliers',
            
            # Expiry rules
            'points_expiry_months',
            'voucher_validity_days',
            
            # Audit information
            'updated_by_name',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id',
            'updated_by_name',
            'created_at',
            'updated_at'
        ]
    
    def get_conversion_ratio_display(self, obj):
        """
        Get human-readable conversion ratio.
        
        Args:
            obj (RewardsConfig): The rewards configuration instance
            
        Returns:
            str: Human-readable conversion ratio
        """
        if obj.rupees_per_point > 0:
            points_per_rupee = 1 / obj.rupees_per_point
            return f"{points_per_rupee:.0f} points = Rs. 1"
        return "Invalid ratio"
    
    def get_earning_rate_display(self, obj):
        """
        Get human-readable earning rate.
        
        Args:
            obj (RewardsConfig): The rewards configuration instance
            
        Returns:
            str: Human-readable earning rate
        """
        if obj.points_per_rupee > 0:
            rupees_per_point = 1 / obj.points_per_rupee
            return f"1 point per Rs. {rupees_per_point:.0f} spent"
        return "Invalid rate"
    
    def validate_points_per_rupee(self, value):
        """
        Validate points earning rate.
        
        Args:
            value (Decimal): Points per rupee value
            
        Returns:
            Decimal: Validated value
            
        Raises:
            serializers.ValidationError: If value is invalid
        """
        if value <= 0:
            raise serializers.ValidationError("Points per rupee must be positive")
        if value > 1:
            raise serializers.ValidationError("Points per rupee should not exceed 1 (would be too generous)")
        return value
    
    def validate_rupees_per_point(self, value):
        """
        Validate points redemption rate.
        
        Args:
            value (Decimal): Rupees per point value
            
        Returns:
            Decimal: Validated value
            
        Raises:
            serializers.ValidationError: If value is invalid
        """
        if value <= 0:
            raise serializers.ValidationError("Rupees per point must be positive")
        if value > 1:
            raise serializers.ValidationError("Rupees per point should not exceed 1 (would be too generous)")
        return value
    
    def validate_voucher_denominations(self, value):
        """
        Validate voucher denomination list.
        
        Args:
            value (list): List of voucher denominations
            
        Returns:
            list: Validated and sorted list
            
        Raises:
            serializers.ValidationError: If value is invalid
        """
        if not isinstance(value, list) or len(value) == 0:
            raise serializers.ValidationError("Must provide at least one voucher denomination")
        
        for denom in value:
            if not isinstance(denom, (int, float)) or denom <= 0:
                raise serializers.ValidationError("All denominations must be positive numbers")
        
        return sorted(value)  # Return sorted list
    
    def validate_tier_thresholds(self, value):
        """
        Validate tier threshold configuration.
        
        Args:
            value (dict): Tier thresholds dictionary
            
        Returns:
            dict: Validated value
            
        Raises:
            serializers.ValidationError: If value is invalid
        """
        if not isinstance(value, dict):
            raise serializers.ValidationError("Tier thresholds must be a dictionary")
        
        required_tiers = ['silver', 'gold', 'platinum']
        for tier in required_tiers:
            if tier not in value:
                raise serializers.ValidationError(f"Missing threshold for {tier} tier")
            if not isinstance(value[tier], (int, float)) or value[tier] <= 0:
                raise serializers.ValidationError(f"Threshold for {tier} must be positive")
        
        # Validate ascending order
        if not (value['silver'] < value['gold'] < value['platinum']):
            raise serializers.ValidationError("Tier thresholds must be in ascending order")
        
        return value
    
    def validate_tier_multipliers(self, value):
        """
        Validate tier multiplier configuration.
        
        Args:
            value (dict): Tier multipliers dictionary
            
        Returns:
            dict: Validated value
            
        Raises:
            serializers.ValidationError: If value is invalid
        """
        if not isinstance(value, dict):
            raise serializers.ValidationError("Tier multipliers must be a dictionary")
        
        required_tiers = ['bronze', 'silver', 'gold', 'platinum']
        for tier in required_tiers:
            if tier not in value:
                raise serializers.ValidationError(f"Missing multiplier for {tier} tier")
            if not isinstance(value[tier], (int, float)) or value[tier] <= 0:
                raise serializers.ValidationError(f"Multiplier for {tier} must be positive")
        
        # Validate ascending order
        multipliers = [value[tier] for tier in required_tiers]
        if multipliers != sorted(multipliers):
            raise serializers.ValidationError("Tier multipliers should be in ascending order")
        
        return value


class RewardsStatisticsSerializer(serializers.Serializer):
    """
    Serializer for rewards system statistics and analytics.
    
    Used for dashboard displays and admin reporting.
    Not tied to a specific model - aggregates data from multiple sources.
    
    Fields:
        total_users (int): Total number of users in the system
        active_users_30_days (int): Users with activity in the last 30 days
        users_by_tier (dict): User count by tier level
        total_points_issued (int): Total points issued across all accounts
        total_points_redeemed (int): Total points redeemed across all accounts
        points_outstanding (int): Total points currently available for redemption
        transactions_today (int): Points transactions today
        transactions_this_month (int): Points transactions this month
        top_earning_categories (list): Top earning transaction categories
        config_last_updated (DateTime): When configuration was last updated
        is_system_healthy (bool): Whether rewards system is healthy
    """
    
    # User statistics
    total_users = serializers.IntegerField()
    active_users_30_days = serializers.IntegerField()
    users_by_tier = serializers.DictField()
    
    # Points statistics
    total_points_issued = serializers.IntegerField()
    total_points_redeemed = serializers.IntegerField()
    points_outstanding = serializers.IntegerField()
    
    # Transaction statistics
    transactions_today = serializers.IntegerField()
    transactions_this_month = serializers.IntegerField()
    top_earning_categories = serializers.ListField()
    
    # System health
    config_last_updated = serializers.DateTimeField()
    is_system_healthy = serializers.BooleanField()
    
    class Meta:
        # This is a data-only serializer, no model backing
        pass


# ===== VOUCHER SERIALIZERS =====

class RewardVoucherSerializer(serializers.ModelSerializer):
    """
    Serializer for reward vouchers with complete voucher information.
    
    Provides:
    - Voucher details (code, value, status)
    - Expiry and usage information
    - QR code data for mobile redemption
    - User validation and security
    
    Used for voucher listing and detail views.
    
    Fields:
        id (int): Voucher ID
        voucher_code (str): Unique voucher code for redemption
        value (Decimal): Voucher value in rupees
        points_redeemed (int): Number of points redeemed to create this voucher
        status (str): Current voucher status
        status_display (str): Human-readable voucher status
        created_at (DateTime): When the voucher was created
        expires_at (DateTime): When the voucher expires
        used_at (DateTime): When the voucher was used (if applicable)
        used_amount (Decimal): Amount of voucher that has been used
        remaining_value (Decimal): Remaining voucher value
        is_valid (bool): Whether voucher is valid for use
        is_expired (bool): Whether voucher has expired
        is_fully_used (bool): Whether voucher has been fully used
        days_until_expiry (int): Number of days until voucher expires
        user_name (str): User's full name
        user_email (str): User's email address
        booking_details (dict): Booking information if voucher was used
        qr_code_data (str): QR code data for mobile redemption
        qr_code_image (str): Base64 encoded QR code image
        metadata (dict): Additional voucher metadata
        updated_at (DateTime): When this voucher was last updated
    """
    
    # Enhanced display fields
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_valid = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    remaining_value = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_fully_used = serializers.BooleanField(read_only=True)
    days_until_expiry = serializers.IntegerField(read_only=True)
    
    # User information
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    # Booking information
    booking_details = serializers.SerializerMethodField()
    
    # QR code data (base64 encoded)
    qr_code_image = serializers.SerializerMethodField()
    
    class Meta:
        model = RewardVoucher
        fields = [
            'id', 'voucher_code', 'value', 'points_redeemed', 'status', 'status_display',
            'created_at', 'expires_at', 'used_at', 'used_amount', 'remaining_value',
            'is_valid', 'is_expired', 'is_fully_used', 'days_until_expiry',
            'user_name', 'user_email', 'booking_details', 'qr_code_data', 'qr_code_image',
            'metadata', 'updated_at'
        ]
        read_only_fields = [
            'id', 'voucher_code', 'created_at', 'updated_at', 'used_at',
            'status_display', 'is_valid', 'is_expired', 'remaining_value',
            'is_fully_used', 'days_until_expiry', 'user_name', 'user_email',
            'booking_details', 'qr_code_image'
        ]
    
    def get_booking_details(self, obj):
        """
        Get booking information if voucher was used.
        
        Args:
            obj (RewardVoucher): The reward voucher instance
            
        Returns:
            dict: Booking details or None if voucher not used
        """
        if obj.booking:
            return {
                'id': obj.booking.id,
                'booking_number': getattr(obj.booking, 'booking_number', ''),
                'service_name': getattr(obj.booking.service, 'name', '') if hasattr(obj.booking, 'service') else '',
                'total_cost': str(getattr(obj.booking, 'total_cost', 0))
            }
        return None
    
    def get_qr_code_image(self, obj):
        """
        Generate base64 encoded QR code image.
        
        Args:
            obj (RewardVoucher): The reward voucher instance
            
        Returns:
            str: Base64 encoded QR code image or None if error
        """
        try:
            import qrcode
            import io
            import base64
            from PIL import Image
            
            # Create QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(obj.qr_code_data)
            qr.make(fit=True)
            
            # Create image
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_str = base64.b64encode(buffer.getvalue()).decode()
            
            return f"data:image/png;base64,{img_str}"
        except ImportError:
            # QR code library not available
            return None
        except Exception:
            # Error generating QR code
            return None


class VoucherRedemptionSerializer(serializers.Serializer):
    """
    Serializer for voucher redemption requests.
    
    Validates:
    - Denomination selection from available options
    - User point balance sufficiency
    - System configuration compliance
    
    Returns created voucher information.
    
    Fields:
        denomination (Decimal): Voucher denomination in rupees
    """
    
    denomination = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Voucher denomination in rupees"
    )
    
    def validate_denomination(self, value):
        """
        Validate that denomination is available.
        
        Args:
            value (Decimal): Voucher denomination
            
        Returns:
            Decimal: Validated denomination
            
        Raises:
            serializers.ValidationError: If denomination is invalid
        """
        from .models import RewardsConfig
        
        config = RewardsConfig.get_active_config()
        if value not in config.voucher_denominations:
            available = ', '.join([f"Rs.{d}" for d in sorted(config.voucher_denominations)])
            raise serializers.ValidationError(
                f"Invalid denomination. Available options: {available}"
            )
        return value
    
    def validate(self, attrs):
        """
        Validate user has sufficient points for redemption.
        
        Args:
            attrs (dict): Serializer attributes
            
        Returns:
            dict: Validated attributes
            
        Raises:
            serializers.ValidationError: If validation fails
        """
        from .models import RewardAccount, RewardsConfig
        
        user = self.context['request'].user
        denomination = attrs['denomination']
        
        # Calculate required points
        config = RewardsConfig.get_active_config()
        required_points = int(denomination / config.rupees_per_point)
        
        # Check minimum redemption threshold
        if required_points < config.min_redemption_points:
            raise serializers.ValidationError(
                f"Minimum redemption is {config.min_redemption_points} points "
                f"(Rs.{config.min_redemption_points * config.rupees_per_point})"
            )
        
        # Check user balance
        try:
            account = RewardAccount.objects.get(user=user)
            if account.current_balance < required_points:
                raise serializers.ValidationError(
                    f"Insufficient points. Required: {required_points}, "
                    f"Available: {account.current_balance}"
                )
        except RewardAccount.DoesNotExist:
            raise serializers.ValidationError("Reward account not found")
        
        attrs['required_points'] = required_points
        attrs['account'] = account
        return attrs
    
    def create(self, validated_data):
        """
        Create voucher by redeeming points.
        
        Args:
            validated_data (dict): Validated serializer data
            
        Returns:
            RewardVoucher: Created voucher instance
        """
        from .models import RewardVoucher
        
        user = self.context['request'].user
        denomination = validated_data['denomination']
        required_points = validated_data['required_points']
        
        # Create voucher using class method
        voucher = RewardVoucher.create_voucher(
            user=user,
            denomination=denomination,
            points_cost=required_points
        )
        
        return voucher


class VoucherValidationSerializer(serializers.Serializer):
    """
    Serializer for voucher validation requests.
    
    Used to validate voucher codes for redemption at checkout.
    Returns voucher details and validity status.
    
    Fields:
        voucher_code (str): Voucher code to validate
    """
    
    voucher_code = serializers.CharField(
        max_length=20,
        help_text="Voucher code to validate"
    )
    
    def validate_voucher_code(self, value):
        """
        Validate voucher code exists and belongs to user.
        
        Args:
            value (str): Voucher code
            
        Returns:
            RewardVoucher: Validated voucher instance
            
        Raises:
            serializers.ValidationError: If voucher code is invalid
        """
        from .models import RewardVoucher
        
        user = self.context['request'].user
        
        try:
            voucher = RewardVoucher.objects.get(
                voucher_code=value.upper(),
                user=user
            )
        except RewardVoucher.DoesNotExist:
            raise serializers.ValidationError("Invalid voucher code")
        
        return voucher
    
    def to_representation(self, instance):
        """
        Return voucher validation details.
        
        Args:
            instance: The validated instance
            
        Returns:
            dict: Voucher validation details
        """
        voucher = self.validated_data['voucher_code']
        
        return {
            'voucher_code': voucher.voucher_code,
            'value': voucher.value,
            'remaining_value': voucher.remaining_value,
            'is_valid': voucher.is_valid,
            'is_expired': voucher.is_expired,
            'expires_at': voucher.expires_at,
            'status': voucher.status,
            'error_message': None if voucher.is_valid else self._get_error_message(voucher)
        }
    
    def _get_error_message(self, voucher):
        """
        Get appropriate error message for invalid voucher.
        
        Args:
            voucher (RewardVoucher): The voucher instance
            
        Returns:
            str: Error message
        """
        if voucher.is_expired:
            return f"Voucher expired on {voucher.expires_at.strftime('%B %d, %Y')}"
        elif voucher.status == 'used':
            return "Voucher has already been used"
        elif voucher.status == 'cancelled':
            return "Voucher has been cancelled"
        elif voucher.remaining_value <= 0:
            return "Voucher has no remaining value"
        else:
            return "Voucher is not valid for use"


class AvailableVouchersSerializer(serializers.Serializer):
    """
    Serializer for available voucher denominations.
    
    Returns current voucher options with pricing information.
    
    Fields:
        denomination (Decimal): Voucher denomination in rupees
        points_required (int): Points required to redeem this voucher
        user_can_afford (bool): Whether user has enough points for this voucher
        savings_percentage (float): Percentage savings (if any promotional bonus)
    """
    
    denomination = serializers.DecimalField(max_digits=10, decimal_places=2)
    points_required = serializers.IntegerField()
    user_can_afford = serializers.BooleanField()
    savings_percentage = serializers.FloatField()
    
    @classmethod
    def get_available_vouchers(cls, user):
        """
        Get list of available voucher denominations for user.
        
        Args:
            user (User): User to check voucher availability for
            
        Returns:
            list: List of available voucher information
        """
        from .models import RewardsConfig, RewardAccount
        
        config = RewardsConfig.get_active_config()
        
        try:
            account = RewardAccount.objects.get(user=user)
            user_balance = account.current_balance
        except RewardAccount.DoesNotExist:
            user_balance = 0
        
        vouchers = []
        for denomination in sorted(config.voucher_denominations):
            points_required = int(denomination / config.rupees_per_point)
            
            # Calculate savings (if any promotional bonus)
            actual_value = points_required * config.rupees_per_point
            savings_percentage = ((denomination - actual_value) / denomination * 100) if denomination > actual_value else 0
            
            vouchers.append({
                'denomination': denomination,
                'points_required': points_required,
                'user_can_afford': user_balance >= points_required,
                'savings_percentage': savings_percentage
            })
        
        return [cls(voucher).data for voucher in vouchers]