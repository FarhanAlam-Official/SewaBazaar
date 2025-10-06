"""
API Views for SewaBazaar Rewards System

This module contains DRF API views for the rewards system endpoints.
Provides secure, well-documented APIs for:

- User reward account information
- Points transaction history  
- Basic rewards statistics
- Admin configuration management
- Voucher management

Features:
- Permission-based access control
- Comprehensive filtering and pagination
- Error handling and validation
- API documentation with examples
"""

from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from datetime import timedelta
import logging
import traceback

logger = logging.getLogger(__name__)

from .models import RewardAccount, PointsTransaction, RewardsConfig, RewardVoucher
from .serializers import (
    RewardAccountSerializer, 
    PointsTransactionSerializer, 
    RewardsConfigSerializer,
    RewardsStatisticsSerializer,
    RewardVoucherSerializer,
    VoucherRedemptionSerializer, 
    VoucherValidationSerializer,
    AvailableVouchersSerializer
)
from .throttles import VoucherValidationThrottle


class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard pagination configuration for rewards API endpoints.
    
    Attributes:
        page_size (int): Default number of items per page
        page_size_query_param (str): Query parameter to override page size
        max_page_size (int): Maximum allowed page size
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class RewardAccountDetailView(generics.RetrieveAPIView):
    """
    Get user's reward account information.
    
    Returns comprehensive reward account data including:
    - Current points balance
    - Tier status and progression  
    - Lifetime statistics
    - Balance conversion information
    - Activity metrics
    
    **Authentication Required:** Yes
    **Permissions:** User can only access their own account
    
    **Example Response:**
    ```json
    {
        "current_balance": 1250,
        "total_points_earned": 2000,
        "total_points_redeemed": 750,
        "lifetime_value": "15000.00",
        "tier_level": "silver",
        "tier_display": "Silver",
        "tier_progress": {
            "current_tier": "silver",
            "next_tier": "gold", 
            "points_needed": 3000,
            "progress_percentage": 66.7
        },
        "balance_in_rupees": 125.0
    }
    ```
    """
    
    serializer_class = RewardAccountSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """
        Get the reward account for the authenticated user.
        Creates one if it doesn't exist (shouldn't happen with signals).
        
        Returns:
            RewardAccount: The user's reward account
        """
        user = self.request.user
        account, created = RewardAccount.objects.get_or_create(user=user)
        return account


class PointsTransactionListView(generics.ListAPIView):
    """
    Get user's points transaction history.
    
    Returns paginated list of all points transactions for the authenticated user.
    Supports filtering by transaction type and date ranges.
    
    **Authentication Required:** Yes
    **Permissions:** User can only see their own transactions
    
    **Query Parameters:**
    - `transaction_type`: Filter by transaction type
    - `date_from`: Show transactions from this date (YYYY-MM-DD)
    - `date_to`: Show transactions up to this date (YYYY-MM-DD)
    - `search`: Search in description
    - `ordering`: Sort by field (default: -created_at)
    
    **Example Response:**
    ```json
    {
        "count": 15,
        "next": null,
        "previous": null,
        "results": [
            {
                "transaction_id": "abc123...",
                "transaction_type": "earned_booking",
                "transaction_type_display": "Earned from Booking",
                "points": 150,
                "balance_after": 1250,
                "description": "Points earned from booking #123",
                "is_earning": true,
                "booking_details": {
                    "id": 123,
                    "service_name": "House Cleaning",
                    "total_amount": 1500.0
                },
                "created_at": "2024-01-15T10:30:00Z"
            }
        ]
    }
    ```
    """
    
    serializer_class = PointsTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    
    # Filtering options
    filterset_fields = ['transaction_type']
    search_fields = ['description']
    ordering_fields = ['created_at', 'points', 'balance_after']
    ordering = ['-created_at']  # Default newest first
    
    def get_queryset(self):
        """
        Filter transactions to only show the authenticated user's records.
        Includes related objects for efficient querying.
        
        Returns:
            QuerySet: Filtered points transactions
        """
        queryset = PointsTransaction.objects.filter(
            user=self.request.user
        ).select_related(
            'booking', 
            'booking__service',
            'voucher',
            'processed_by'
        )
        
        # Date range filtering
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            try:
                from datetime import datetime
                date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__gte=date_from)
            except ValueError:
                pass  # Ignore invalid date format
        
        if date_to:
            try:
                from datetime import datetime
                date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__lte=date_to)
            except ValueError:
                pass  # Ignore invalid date format
        
        return queryset


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_rewards_summary(request):
    """
    Get a quick summary of user's rewards status.
    
    Provides condensed information perfect for dashboard widgets
    or navigation displays.
    
    **Authentication Required:** Yes
    
    **Example Response:**
    ```json
    {
        "current_balance": 1250,
        "tier": "silver",
        "points_to_next_tier": 3000,
        "balance_in_rupees": 125.0,
        "recent_activity": {
            "last_earned": "2024-01-15T10:30:00Z",
            "last_redeemed": "2024-01-10T15:45:00Z"
        },
        "quick_stats": {
            "total_earned": 2000,
            "total_redeemed": 750,
            "transactions_this_month": 5
        }
    }
    ```
    
    Args:
        request (Request): The HTTP request object
        
    Returns:
        Response: JSON response with user rewards summary
    """
    try:
        account = request.user.reward_account
        tier_progress = account.get_tier_progress()
        
        # Count transactions this month
        start_of_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_transactions = PointsTransaction.objects.filter(
            user=request.user,
            created_at__gte=start_of_month
        ).count()
        
        summary_data = {
            'current_balance': account.current_balance,
            'tier': account.tier_level,
            'tier_display': account.get_tier_level_display(),
            'points_to_next_tier': tier_progress.get('points_needed', 0),
            'balance_in_rupees': float(account.current_balance * RewardsConfig.get_active_config().rupees_per_point),
            'recent_activity': {
                'last_earned': account.last_points_earned,
                'last_redeemed': account.last_points_redeemed
            },
            'quick_stats': {
                'total_earned': account.total_points_earned,
                'total_redeemed': account.total_points_redeemed,
                'transactions_this_month': monthly_transactions
            }
        }
        
        return Response(summary_data)
        
    except RewardAccount.DoesNotExist:
        # Create account if it doesn't exist
        account = RewardAccount.objects.create(user=request.user)
        return Response({
            'current_balance': 0,
            'tier': 'bronze',
            'tier_display': 'Bronze',
            'points_to_next_tier': 1000,
            'balance_in_rupees': 0.0,
            'recent_activity': {
                'last_earned': None,
                'last_redeemed': None
            },
            'quick_stats': {
                'total_earned': 0,
                'total_redeemed': 0,
                'transactions_this_month': 0
            }
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def available_vouchers(request):
    """
    Get available voucher denominations and redemption info.
    
    Shows what vouchers the user can redeem with their current points,
    along with the points cost for each denomination.
    
    **Authentication Required:** Yes
    
    **Example Response:**
    ```json
    {
        "current_balance": 1250,
        "conversion_rate": "10 points = Rs. 1",
        "available_vouchers": [
            {
                "value": 100,
                "points_cost": 1000,
                "can_afford": true,
                "points_short": 0
            },
            {
                "value": 200,
                "points_cost": 2000,
                "can_afford": false,
                "points_short": 750
            }
        ]
    }
    ```
    
    Args:
        request (Request): The HTTP request object
        
    Returns:
        Response: JSON response with available vouchers information
    """
    try:
        account = request.user.reward_account
        config = RewardsConfig.get_active_config()
        
        # Calculate voucher information
        vouchers = []
        for denomination in sorted(config.voucher_denominations):
            points_cost = int(denomination / config.rupees_per_point)
            can_afford = account.current_balance >= points_cost
            points_short = max(0, points_cost - account.current_balance)
            
            vouchers.append({
                'value': denomination,
                'points_cost': points_cost,
                'can_afford': can_afford,
                'points_short': points_short
            })
        
        response_data = {
            'current_balance': account.current_balance,
            'conversion_rate': f"{int(1/config.rupees_per_point)} points = Rs. 1",
            'min_redemption_points': config.min_redemption_points,
            'available_vouchers': vouchers
        }
        
        return Response(response_data)
        
    except RewardAccount.DoesNotExist:
        return Response({
            'current_balance': 0,
            'conversion_rate': "10 points = Rs. 1",
            'min_redemption_points': 100,
            'available_vouchers': []
        })


# === ADMIN-ONLY ENDPOINTS ===

class RewardsConfigListCreateView(generics.ListCreateAPIView):
    """
    Admin endpoint for managing rewards configuration.
    
    **GET:** List all configurations (active and inactive)
    **POST:** Create new configuration (automatically deactivates others)
    
    **Authentication Required:** Yes
    **Permissions:** Admin users only
    """
    
    queryset = RewardsConfig.objects.all()
    serializer_class = RewardsConfigSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    def perform_create(self, serializer):
        """
        Set the creating user when saving configuration.
        
        Args:
            serializer (RewardsConfigSerializer): The serializer instance
        """
        serializer.save(updated_by=self.request.user)


class RewardsConfigDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin endpoint for detailed configuration management.
    
    **GET:** Get specific configuration details
    **PUT/PATCH:** Update configuration
    **DELETE:** Delete configuration (only if not active)
    
    **Authentication Required:** Yes  
    **Permissions:** Admin users only
    """
    
    queryset = RewardsConfig.objects.all()
    serializer_class = RewardsConfigSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    def perform_update(self, serializer):
        """
        Set the updating user when saving configuration.
        
        Args:
            serializer (RewardsConfigSerializer): The serializer instance
        """
        serializer.save(updated_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """
        Prevent deletion of active configurations.
        
        Args:
            request (Request): The HTTP request object
            *args: Variable length argument list
            **kwargs: Arbitrary keyword arguments
            
        Returns:
            Response: JSON response with result
        """
        instance = self.get_object()
        if instance.is_active:
            return Response(
                {'error': 'Cannot delete active configuration'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, permissions.IsAdminUser])
def rewards_statistics(request):
    """
    Get comprehensive rewards system statistics.
    
    Provides analytics data for admin dashboard and reporting.
    
    **Authentication Required:** Yes
    **Permissions:** Admin users only
    
    **Example Response:**
    ```json
    {
        "total_users": 1250,
        "active_users_30_days": 890,
        "users_by_tier": {
            "bronze": 800,
            "silver": 300,
            "gold": 130,
            "platinum": 20
        },
        "total_points_issued": 125000,
        "total_points_redeemed": 45000,
        "points_outstanding": 80000,
        "transactions_today": 45,
        "transactions_this_month": 1200,
        "is_system_healthy": true
    }
    ```
    
    Args:
        request (Request): The HTTP request object
        
    Returns:
        Response: JSON response with rewards statistics
    """
    # Calculate date ranges
    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # User statistics
    total_users = RewardAccount.objects.count()
    active_users = RewardAccount.objects.filter(
        Q(last_points_earned__gte=thirty_days_ago) |
        Q(last_points_redeemed__gte=thirty_days_ago)
    ).count()
    
    # Users by tier
    users_by_tier = {}
    tier_counts = RewardAccount.objects.values('tier_level').annotate(count=Count('id'))
    for tier_data in tier_counts:
        users_by_tier[tier_data['tier_level']] = tier_data['count']
    
    # Points statistics
    points_totals = RewardAccount.objects.aggregate(
        total_earned=Sum('total_points_earned'),
        total_redeemed=Sum('total_points_redeemed'),
        total_outstanding=Sum('current_balance')
    )
    
    # Transaction statistics
    transactions_today = PointsTransaction.objects.filter(
        created_at__gte=start_of_day
    ).count()
    
    transactions_this_month = PointsTransaction.objects.filter(
        created_at__gte=start_of_month
    ).count()
    
    # System health check
    try:
        config = RewardsConfig.get_active_config()
        is_healthy = not config.maintenance_mode and config.is_active
        config_last_updated = config.updated_at
    except:
        is_healthy = False
        config_last_updated = None
    
    statistics = {
        'total_users': total_users,
        'active_users_30_days': active_users,
        'users_by_tier': users_by_tier,
        'total_points_issued': points_totals['total_earned'] or 0,
        'total_points_redeemed': points_totals['total_redeemed'] or 0,
        'points_outstanding': points_totals['total_outstanding'] or 0,
        'transactions_today': transactions_today,
        'transactions_this_month': transactions_this_month,
        'config_last_updated': config_last_updated,
        'is_system_healthy': is_healthy
    }
    
    serializer = RewardsStatisticsSerializer(data=statistics)
    serializer.is_valid(raise_exception=True)
    
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, permissions.IsAdminUser])
def admin_transaction_list(request):
    """
    Admin endpoint for viewing all user transactions.
    
    Provides comprehensive transaction history across all users
    with advanced filtering and search capabilities.
    
    **Authentication Required:** Yes
    **Permissions:** Admin users only
    
    **Query Parameters:**
    - `user_id`: Filter by specific user
    - `transaction_type`: Filter by transaction type
    - `date_from`: From date (YYYY-MM-DD)
    - `date_to`: To date (YYYY-MM-DD)
    - `search`: Search in description or user name
    
    Args:
        request (Request): The HTTP request object
        
    Returns:
        Response: JSON response with paginated transaction list
    """
    # Get all transactions with related data
    queryset = PointsTransaction.objects.select_related(
        'user',
        'booking',
        'booking__service',
        'voucher',
        'processed_by'
    ).order_by('-created_at')
    
    # Apply filters
    user_id = request.query_params.get('user_id')
    if user_id:
        queryset = queryset.filter(user_id=user_id)
    
    transaction_type = request.query_params.get('transaction_type')
    if transaction_type:
        queryset = queryset.filter(transaction_type=transaction_type)
    
    # Date filtering
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    
    if date_from:
        try:
            from datetime import datetime
            date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
            queryset = queryset.filter(created_at__date__gte=date_from)
        except ValueError:
            pass
    
    if date_to:
        try:
            from datetime import datetime
            date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
            queryset = queryset.filter(created_at__date__lte=date_to)
        except ValueError:
            pass
    
    # Search filtering
    search = request.query_params.get('search')
    if search:
        queryset = queryset.filter(
            Q(description__icontains=search) |
            Q(user__first_name__icontains=search) |
            Q(user__last_name__icontains=search) |
            Q(user__email__icontains=search)
        )
    
    # Paginate results
    paginator = StandardResultsSetPagination()
    page = paginator.paginate_queryset(queryset, request)
    
    if page is not None:
        serializer = PointsTransactionSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    serializer = PointsTransactionSerializer(queryset, many=True)
    return Response(serializer.data)


# ===== VOUCHER API VIEWS =====

from .models import RewardVoucher
from .serializers import (
    RewardVoucherSerializer,
    VoucherRedemptionSerializer, 
    VoucherValidationSerializer,
    AvailableVouchersSerializer
)


class UserVoucherListView(generics.ListAPIView):
    """
    Get user's vouchers with filtering and pagination.
    
    Provides:
    - List of user's vouchers
    - Status filtering (active, used, expired)
    - Ordering by creation date, expiry, value
    - Search by voucher code
    
    Supports query parameters:
    - status: Filter by voucher status
    - ordering: Sort by field (created_at, expires_at, value)
    - search: Search by voucher code
    """
    
    serializer_class = RewardVoucherSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    
    # Filtering options
    filterset_fields = ['status']
    search_fields = ['voucher_code']
    ordering_fields = ['created_at', 'expires_at', 'value', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return vouchers for authenticated user with automatic expiry updates.
        
        Returns:
            QuerySet: Filtered reward vouchers
        """
        return RewardVoucher.objects.get_user_vouchers(self.request.user)


class VoucherDetailView(generics.RetrieveAPIView):
    """
    Get detailed information for a specific voucher.
    
    Returns:
    - Complete voucher information
    - QR code data for mobile use
    - Usage history and booking details
    - Validity status and remaining value
    """
    
    serializer_class = RewardVoucherSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'voucher_code'
    lookup_url_kwarg = 'voucher_code'
    
    def get_queryset(self):
        """Return vouchers for authenticated user with automatic expiry updates.
        
        Returns:
            QuerySet: Filtered reward vouchers
        """
        return RewardVoucher.objects.get_user_vouchers(self.request.user)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def available_vouchers(request):
    """
    Get available voucher denominations and user's ability to redeem them.
    
    Returns:
    - Available voucher denominations
    - Points required for each
    - User's current balance status
    - Savings information
    
    Example response:
    {
        "vouchers": [
            {
                "denomination": "100.00",
                "points_required": 1000,
                "user_can_afford": true,
                "savings_percentage": 0.0
            },
            ...
        ],
        "user_balance": 1500,
        "redemption_rate": "10 points = Rs.1"
    }
    """
    
    try:
        account = RewardAccount.objects.get(user=request.user)
        user_balance = account.current_balance
    except RewardAccount.DoesNotExist:
        return Response(
            {"error": "Reward account not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get available vouchers
    vouchers = AvailableVouchersSerializer.get_available_vouchers(request.user)
    
    # Get system configuration
    config = RewardsConfig.get_active_config()
    
    return Response({
        "vouchers": vouchers,
        "user_balance": user_balance,
        "redemption_rate": f"{int(1/config.rupees_per_point)} points = Rs.1",
        "minimum_redemption": config.min_redemption_points
    })


@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def redeem_voucher(request):
    """
    Redeem points for a voucher.
    
    Request body:
    {
        "denomination": "500.00"
    }
    
    Returns:
    - Created voucher information
    - Updated account balance
    - Transaction details
    
    Errors:
    - 400: Invalid denomination or insufficient points
    - 404: User account not found
    - 503: Rewards system in maintenance mode
    
    Args:
        request (Request): The HTTP request object
        
    Returns:
        Response: JSON response with voucher creation result
    """
    
    # Check if rewards system is active
    config = RewardsConfig.get_active_config()
    if config.maintenance_mode:
        return Response(
            {"error": "Rewards system is currently under maintenance"}, 
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    serializer = VoucherRedemptionSerializer(
        data=request.data, 
        context={'request': request}
    )
    
    if serializer.is_valid():
        try:
            voucher = serializer.save()
            
            # Return created voucher details
            voucher_serializer = RewardVoucherSerializer(voucher)
            
            # Get updated account information
            account = RewardAccount.objects.get(user=request.user)
            
            return Response({
                "voucher": voucher_serializer.data,
                "account_balance": account.current_balance,
                "transaction_id": voucher.points_transactions.first().transaction_id if voucher.points_transactions.exists() else None,
                "message": f"Successfully redeemed Rs.{voucher.value} voucher"
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {"error": f"Voucher creation failed: {str(e)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@throttle_classes([VoucherValidationThrottle])
def validate_voucher(request):
    """
    Validate a voucher code and return its details.
    
    Request body:
    {
        "voucher_code": "SB-20250911-ABC123"
    }
    
    Returns:
    - Voucher details if valid
    - Error message if invalid
    
    Args:
        request (Request): The HTTP request object
        
    Returns:
        Response: JSON response with voucher validation result
    """
    try:
        # Add input sanitization
        voucher_code = request.data.get('voucher_code', '').strip().upper()
        
        # Validate input
        if not voucher_code:
            return Response(
                {"error": "voucher_code is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Additional input validation to prevent injection attacks
        import re
        if not re.match(r'^[A-Z0-9\-]+$', voucher_code):
            return Response(
                {"error": "Invalid voucher code format"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(voucher_code) > 20:
            return Response(
                {"error": "Voucher code too long"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            voucher = RewardVoucher.objects.get(
                voucher_code=voucher_code,
                user=request.user
            )
            
            # Check and update expiry status automatically
            voucher.check_and_update_expiry()
            
            # Check if voucher is in a valid state (after potential expiry update)
            current_status = voucher.get_current_status()
            if current_status != 'active':
                return Response(
                    {
                        "error": f"Voucher is {current_status} and cannot be used"
                    }, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Return voucher details
            serializer = RewardVoucherSerializer(voucher)
            response_data = serializer.data
            # Only add error_message for backward compatibility in error cases
            response_data['error_message'] = None
            return Response(response_data)
            
        except RewardVoucher.DoesNotExist:
            # Log failed attempts for security monitoring
            import logging
            logger = logging.getLogger('security')
            logger.warning(f"Invalid voucher code attempt: {voucher_code} by user {request.user.id}")
            
            return Response(
                {
                    "error": "Invalid voucher code",
                    "error_message": "Invalid voucher code"
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        # Log unexpected errors
        import logging
        logger = logging.getLogger('security')
        logger.error(f"Unexpected error in validate_voucher: {str(e)} by user {request.user.id}")
        
        return Response(
            {
                "error": "An unexpected error occurred",
                "error_message": "An unexpected error occurred"
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@throttle_classes([VoucherValidationThrottle])
def validate_voucher_for_booking(request):
    """
    Validate a voucher code for a specific booking amount.
    
    Request body:
    {
        "voucher_code": "SB-20250911-ABC123",
        "booking_amount": "300.00"
    }
    
    Returns:
    - Voucher validity status
    - Discount amount that will be applied
    - Final amount after discount
    - Warning if voucher value will be wasted
    
    Used during checkout to show user exact discount preview.
    
    Args:
        request (Request): The HTTP request object
        
    Returns:
        Response: JSON response with voucher validation for booking
    """
    
    try:
        # Add input sanitization
        voucher_code = request.data.get('voucher_code', '').strip().upper()
        booking_amount = request.data.get('booking_amount')
        
        if not voucher_code:
            return Response(
                {"error": "Voucher code is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Additional input validation to prevent injection attacks
        import re
        if not re.match(r'^[A-Z0-9\-]+$', voucher_code):
            return Response(
                {"error": "Invalid voucher code format"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(voucher_code) > 20:
            return Response(
                {"error": "Voucher code too long"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not booking_amount:
            return Response(
                {"error": "Booking amount is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from decimal import Decimal
            booking_amount = Decimal(str(booking_amount))
            if booking_amount <= 0:
                raise ValueError("Booking amount must be positive")
            if booking_amount > Decimal('999999.99'):  # Reasonable upper limit
                raise ValueError("Booking amount too large")
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid booking amount"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            voucher = RewardVoucher.objects.get(
                voucher_code=voucher_code,
                user=request.user
            )
        except RewardVoucher.DoesNotExist:
            # Log failed attempts for security monitoring
            import logging
            logger = logging.getLogger('security')
            logger.warning(f"Invalid voucher code attempt for booking: {voucher_code} by user {request.user.id}")
            
            return Response(
                {"error": "Voucher not found or not owned by you"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate voucher for this booking
        can_use, reason = voucher.can_use_for_booking(booking_amount)
        
        if not can_use:
            return Response({
                "can_use": False,
                "reason": reason,
                "voucher_code": voucher_code,
                "voucher_value": float(voucher.value),
                "booking_amount": float(booking_amount)
            })
        
        # Calculate discount preview
        discount_amount = min(voucher.value, booking_amount)
        final_amount = max(Decimal('0'), booking_amount - discount_amount)
        wasted_amount = max(Decimal('0'), voucher.value - discount_amount)
        
        response_data = {
            "can_use": True,
            "voucher_code": voucher_code,
            "voucher_value": float(voucher.value),
            "booking_amount": float(booking_amount),
            "discount_amount": float(discount_amount),
            "final_amount": float(final_amount),
            "wasted_amount": float(wasted_amount),
            "message": "Voucher can be applied to this booking"
        }
        
        # Add warning if value will be wasted
        if wasted_amount > 0:
            response_data["warning"] = f"Rs. {wasted_amount} of voucher value will be unused"
        
        return Response(response_data)
        
    except Exception as e:
        # Log unexpected errors
        import logging
        logger = logging.getLogger('security')
        logger.error(f"Unexpected error in validate_voucher_for_booking: {str(e)} by user {request.user.id}")
        
        return Response(
            {"error": "An unexpected error occurred"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def use_voucher(request, voucher_code):
    """
    Use a voucher for payment (called during checkout).
    
    Request body:
    {
        "booking_amount": "300.00",
        "booking_id": 123
    }
    
    Returns:
    - Amount actually deducted (discount applied)
    - Final amount to pay
    - Message about usage (including any wasted value)
    - Updated voucher status
    
    This endpoint applies voucher discount to booking payments.
    Voucher can be used on any booking amount > 0.
    
    Args:
        request (Request): The HTTP request object
        voucher_code (str): The voucher code to use
        
    Returns:
        Response: JSON response with voucher usage result
    """
    
    try:
        voucher = RewardVoucher.objects.get(
            voucher_code=voucher_code.upper(),
            user=request.user
        )
    except RewardVoucher.DoesNotExist:
        return Response(
            {"error": "Voucher not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Validate request data
    booking_amount = request.data.get('booking_amount')
    booking_id = request.data.get('booking_id')
    
    if not booking_amount:
        return Response(
            {"error": "Booking amount is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        from decimal import Decimal
        booking_amount = Decimal(str(booking_amount))
        if booking_amount <= 0:
            raise ValueError("Booking amount must be positive")
    except (ValueError, TypeError):
        return Response(
            {"error": "Invalid booking amount"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get booking if provided
    booking = None
    if booking_id:
        try:
            from apps.bookings.models import Booking
            booking = Booking.objects.get(id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    # Apply voucher to booking
    try:
        result = voucher.apply_to_booking(booking_amount, booking)
        
        # Return usage results
        voucher_serializer = RewardVoucherSerializer(voucher)
        
        return Response({
            "discount_amount": result['discount_amount'],
            "final_amount": result['final_amount'],
            "message": result['message'],
            "voucher": voucher_serializer.data,
            "success": True
        })
        
    except ValueError as e:
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_voucher(request, voucher_code):
    """
    Cancel a voucher and refund points to user.
    
    Request body:
    {
        "reason": "Changed my mind"
    }
    
    Returns:
    - Refund transaction details
    - Updated account balance
    - Cancelled voucher status
    
    Only active vouchers can be cancelled.
    Used vouchers cannot be cancelled.
    
    Args:
        request (Request): The HTTP request object
        voucher_code (str): The voucher code to cancel
        
    Returns:
        Response: JSON response with cancellation result
    """
    
    try:
        voucher = RewardVoucher.objects.get(
            voucher_code=voucher_code.upper(),
            user=request.user
        )
    except RewardVoucher.DoesNotExist:
        return Response(
            {"error": "Voucher not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    reason = request.data.get('reason', 'User requested cancellation')
    
    try:
        transaction = voucher.cancel_voucher(reason)
        
        # Get updated account information
        account = RewardAccount.objects.get(user=request.user)
        
        response_data = {
            "voucher_code": voucher.voucher_code,
            "status": voucher.status,
            "account_balance": account.current_balance,
            "message": "Voucher cancelled successfully"
        }
        
        if transaction:
            response_data["refund_points"] = transaction.points
            response_data["transaction_id"] = transaction.transaction_id
        
        return Response(response_data)
        
    except ValueError as e:
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )


# ===== ADMIN VOUCHER VIEWS =====

class AdminVoucherListView(generics.ListAPIView):
    """
    Admin view for all vouchers in the system.
    
    Provides:
    - Complete voucher listing across all users
    - Advanced filtering and search
    - Bulk operations support
    - Export capabilities
    
    Requires admin permissions.
    """
    
    serializer_class = RewardVoucherSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    
    # Enhanced filtering for admin
    filterset_fields = ['status', 'user__email']
    search_fields = ['voucher_code', 'user__email', 'user__first_name', 'user__last_name']
    ordering_fields = ['created_at', 'expires_at', 'value', 'status', 'user__email']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return all vouchers for admin users.
        
        Returns:
            QuerySet: All reward vouchers with related data
        """
        return RewardVoucher.objects.select_related('user', 'booking').all()


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def voucher_statistics(request):
    """
    Get comprehensive voucher system statistics for admin dashboard.
    
    Returns:
    - Voucher creation and usage statistics
    - Revenue impact analysis
    - Status distribution
    - Expiry tracking
    - Popular denominations
    
    Args:
        request (Request): The HTTP request object
        
    Returns:
        Response: JSON response with voucher statistics
    """
    
    from django.db.models import Sum, Count, Avg
    
    # Basic statistics
    total_vouchers = RewardVoucher.objects.count()
    active_vouchers = RewardVoucher.objects.filter(status='active').count()
    used_vouchers = RewardVoucher.objects.filter(status='used').count()
    expired_vouchers = RewardVoucher.objects.filter(status='expired').count()
    
    # Financial statistics
    total_value_issued = RewardVoucher.objects.aggregate(
        total=Sum('value')
    )['total'] or 0
    
    total_value_used = RewardVoucher.objects.aggregate(
        total=Sum('used_amount')
    )['total'] or 0
    
    # Points statistics
    total_points_redeemed = RewardVoucher.objects.aggregate(
        total=Sum('points_redeemed')
    )['total'] or 0
    
    # Popular denominations
    popular_denominations = RewardVoucher.objects.values('value').annotate(
        count=Count('id'),
        total_value=Sum('value')
    ).order_by('-count')[:5]
    
    # Recent activity (last 30 days)
    last_30_days = timezone.now() - timedelta(days=30)
    recent_vouchers = RewardVoucher.objects.filter(created_at__gte=last_30_days).count()
    recent_usage = RewardVoucher.objects.filter(used_at__gte=last_30_days).count()
    
    # Expiring soon (next 7 days)
    next_week = timezone.now() + timedelta(days=7)
    expiring_soon = RewardVoucher.objects.filter(
        status='active',
        expires_at__lte=next_week
    ).count()
    
    return Response({
        "total_statistics": {
            "total_vouchers": total_vouchers,
            "active_vouchers": active_vouchers,
            "used_vouchers": used_vouchers,
            "expired_vouchers": expired_vouchers
        },
        "financial_impact": {
            "total_value_issued": str(total_value_issued),
            "total_value_used": str(total_value_used),
            "outstanding_liability": str(total_value_issued - total_value_used),
            "total_points_redeemed": total_points_redeemed
        },
        "popular_denominations": list(popular_denominations),
        "recent_activity": {
            "vouchers_created_30d": recent_vouchers,
            "vouchers_used_30d": recent_usage,
            "expiring_next_7d": expiring_soon
        }
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([JSONParser, FormParser, MultiPartParser])
def claim_reward(request):
    """
    Allow users to claim special rewards and earn points.
    
    This endpoint is used for manual reward claiming such as:
    - Review completion rewards
    - Service confirmation rewards
    - Special promotional rewards
    
    Request body:
    {
        "points": 10,
        "type": "review",
        "description": "Claimed review completion reward"
    }
    
    Response:
    {
        "success": true,
        "message": "Reward claimed successfully",
        "points_earned": 10,
        "new_balance": 150,
        "transaction_id": "txn_12345"
    }
    
    Args:
        request (Request): The HTTP request object
        
    Returns:
        Response: JSON response with reward claim result
    """
    try:
        # Extract and validate request data
        points = request.data.get('points')
        reward_type = request.data.get('type', 'special')
        description = request.data.get('description', 'Special reward claimed')
        
        # Validate input
        if not points or not isinstance(points, (int, float)) or points <= 0:
            return Response(
                {'error': 'Valid points amount is required (must be positive number)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if points > 1000:  # Safety limit to prevent abuse
            return Response(
                {'error': 'Points amount too large (maximum 1000 points per claim)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Special handling for review rewards to prevent duplicate claims
        if reward_type == 'review':
            # For review rewards, we need to verify that the user has an unclaimed review
            # and mark it as claimed after awarding points
            from apps.reviews.models import Review
            
            # Get the user's unclaimed reviews that are not deleted
            unclaimed_reviews = Review.objects.filter(
                customer=request.user,
                is_reward_claimed=False
            )
            
            # If no unclaimed reviews, return error
            if not unclaimed_reviews.exists():
                return Response(
                    {'error': 'No unclaimed review rewards found. You may have already claimed rewards for all your reviews or deleted your review.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the points per review from config
            config = RewardsConfig.get_active_config()
            expected_points = getattr(config, 'points_per_review', 50)
            
            # Validate that points match expected value
            if points != expected_points:
                return Response(
                    {'error': f'Review reward points must be {expected_points}, but you sent {points} points.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Get or create reward account for user
        # This ensures every user has a reward account when claiming points
        reward_account, created = RewardAccount.objects.get_or_create(
            user=request.user,
            defaults={
                'current_balance': 0,
                'total_points_earned': 0,
                'total_points_redeemed': 0,
                'tier_level': 'bronze'
            }
        )
        
        # Map frontend reward types to internal transaction types
        # This provides consistent categorization for different reward sources
        transaction_type_map = {
            'review': 'earned_review',           # Points for writing reviews
            'confirmation': 'earned_special',    # Points for confirming service completion
            'booking': 'earned_booking',         # Points from completed bookings
            'special': 'earned_special',         # Special promotions or bonuses
            'bonus': 'earned_admin_bonus'        # Admin-granted bonus points
        }
        
        transaction_type = transaction_type_map.get(reward_type, 'earned_special')
        
        # Add points to user's account and create transaction record
        # This handles balance updates, tier progression, and audit trail
        transaction = reward_account.add_points(
            points=int(points),
            transaction_type=transaction_type,
            description=description
        )
        
        # Special handling for review rewards - mark review as claimed
        if reward_type == 'review':
            # Mark one unclaimed review as claimed
            from apps.reviews.models import Review
            unclaimed_review = Review.objects.filter(
                customer=request.user,
                is_reward_claimed=False
            ).first()
            
            if unclaimed_review:
                unclaimed_review.is_reward_claimed = True
                unclaimed_review.save(update_fields=['is_reward_claimed'])
            else:
                # If no unclaimed review found, return an error
                return Response(
                    {'error': 'No unclaimed review found to mark as claimed.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Return success response with updated account information
        return Response({
            'success': True,
            'message': 'Reward claimed successfully',
            'points_earned': points,
            'new_balance': reward_account.current_balance,
            'transaction_id': str(transaction.id),
            'tier': reward_account.tier_level
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        # Log detailed error information for debugging while returning user-friendly message
        logger.error(f"Error claiming reward for user {request.user.id}: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return Response(
            {'error': f'Failed to claim reward: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )