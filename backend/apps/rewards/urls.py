"""
URL Configuration for SewaBazaar Rewards System API

This module defines all API endpoints for the rewards system.
Organizes URLs by functionality and permission level.

Phase 1 URLs:
- User rewards endpoints (/api/rewards/)
- Admin configuration endpoints (/api/admin/rewards/)
- Statistics and reporting endpoints

URL Structure:
- /api/rewards/ - User-facing endpoints
- /api/admin/rewards/ - Admin-only endpoints
"""

from django.urls import path, include
from . import views

# User-facing rewards API endpoints
user_patterns = [
    # User reward account information
    path(
        'account/', 
        views.RewardAccountDetailView.as_view(), 
        name='reward-account-detail'
    ),
    
    # Points transaction history
    path(
        'transactions/', 
        views.PointsTransactionListView.as_view(), 
        name='points-transaction-list'
    ),
    
    # Quick rewards summary for dashboards
    path(
        'summary/', 
        views.user_rewards_summary, 
        name='user-rewards-summary'
    ),
    
    # Claim special rewards
    path(
        'claim/', 
        views.claim_reward, 
        name='claim-reward'
    ),
    
    # === VOUCHER ENDPOINTS ===
    
    # Available voucher denominations
    path(
        'vouchers/available/', 
        views.available_vouchers, 
        name='available-vouchers'
    ),
    
    # Redeem points for voucher
    path(
        'vouchers/redeem/', 
        views.redeem_voucher, 
        name='redeem-voucher'
    ),
    
    # Validate voucher code
    path(
        'vouchers/validate/', 
        views.validate_voucher, 
        name='validate-voucher'
    ),
    
    # Validate voucher for specific booking amount
    path(
        'vouchers/validate-booking/', 
        views.validate_voucher_for_booking, 
        name='validate-voucher-for-booking'
    ),
    
    # User's voucher list
    path(
        'vouchers/', 
        views.UserVoucherListView.as_view(), 
        name='user-voucher-list'
    ),
    
    # Voucher detail by code (this should be last to avoid conflicts)
    path(
        'vouchers/<str:voucher_code>/', 
        views.VoucherDetailView.as_view(), 
        name='voucher-detail'
    ),
    
    # Use voucher during checkout
    path(
        'vouchers/<str:voucher_code>/use/', 
        views.use_voucher, 
        name='use-voucher'
    ),
    
    # Cancel voucher and refund points
    path(
        'vouchers/<str:voucher_code>/cancel/', 
        views.cancel_voucher, 
        name='cancel-voucher'
    ),
]

# Admin-only rewards management endpoints  
admin_patterns = [
    # Rewards configuration management
    path(
        'config/', 
        views.RewardsConfigListCreateView.as_view(), 
        name='rewards-config-list'
    ),
    
    path(
        'config/<int:pk>/', 
        views.RewardsConfigDetailView.as_view(), 
        name='rewards-config-detail'
    ),
    
    # System statistics and analytics
    path(
        'statistics/', 
        views.rewards_statistics, 
        name='rewards-statistics'
    ),
    
    # Admin transaction management
    path(
        'transactions/all/', 
        views.admin_transaction_list, 
        name='admin-transaction-list'
    ),
    
    # === ADMIN VOUCHER ENDPOINTS ===
    
    # All vouchers management
    path(
        'vouchers/', 
        views.AdminVoucherListView.as_view(), 
        name='admin-voucher-list'
    ),
    
    # Voucher system statistics
    path(
        'vouchers/statistics/', 
        views.voucher_statistics, 
        name='voucher-statistics'
    ),
]

# Main URL patterns for rewards app
app_name = 'rewards'

urlpatterns = [
    # User-facing endpoints
    path('', include(user_patterns)),
    
    # Admin endpoints (will be included under /api/admin/rewards/)
    path('admin/', include(admin_patterns)),
]