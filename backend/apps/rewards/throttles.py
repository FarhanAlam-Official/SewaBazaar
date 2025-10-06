"""
Custom throttling classes for the rewards app.

This module defines custom rate limiting classes to prevent abuse
of the rewards system APIs, particularly voucher validation and redemption.
"""

from rest_framework.throttling import ScopedRateThrottle


class VoucherValidationThrottle(ScopedRateThrottle):
    """
    Throttle voucher validation requests.
    
    This throttle limits how frequently users can validate voucher codes
    to prevent abuse and brute force attacks.
    
    Scope: voucher_validation
    Default rate: 10/minute (can be configured in settings)
    """
    scope = 'voucher_validation'


class VoucherRedemptionThrottle(ScopedRateThrottle):
    """
    Throttle voucher redemption requests.
    
    This throttle limits how frequently users can redeem vouchers
    to prevent system abuse.
    
    Scope: voucher_redemption
    Default rate: 5/minute (can be configured in settings)
    """
    scope = 'voucher_redemption'