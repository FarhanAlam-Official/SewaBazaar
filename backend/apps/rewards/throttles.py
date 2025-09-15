"""
Custom throttling classes for the rewards app.
"""
from rest_framework.throttling import ScopedRateThrottle


class VoucherValidationThrottle(ScopedRateThrottle):
    """
    Throttle voucher validation requests.
    
    This throttle limits how frequently users can validate voucher codes
    to prevent abuse and brute force attacks.
    """
    scope = 'voucher_validation'


class VoucherRedemptionThrottle(ScopedRateThrottle):
    """
    Throttle voucher redemption requests.
    
    This throttle limits how frequently users can redeem vouchers
    to prevent system abuse.
    """
    scope = 'voucher_redemption'