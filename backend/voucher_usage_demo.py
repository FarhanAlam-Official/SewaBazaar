"""
Voucher Usage Policy Update

This script demonstrates how to implement fixed-value vouchers
instead of the complex partial usage system.
"""

from decimal import Decimal
from django.db import models

class VoucherUsagePolicy(models.TextChoices):
    """Define how vouchers can be used"""
    FIXED_VALUE = 'fixed', 'Fixed Value - Must use full amount'
    PARTIAL_ALLOWED = 'partial', 'Partial Usage Allowed'
    MINIMUM_THRESHOLD = 'minimum', 'Minimum 80% usage required'

# Updated RewardVoucher model additions:
"""
Add these fields to the existing RewardVoucher model:

usage_policy = models.CharField(
    max_length=20,
    choices=VoucherUsagePolicy.choices,
    default=VoucherUsagePolicy.FIXED_VALUE,
    help_text="How this voucher can be used"
)

minimum_order_value = models.DecimalField(
    max_digits=10,
    decimal_places=2,
    null=True,
    blank=True,
    help_text="Minimum booking amount to use this voucher"
)
"""

def can_use_voucher_for_booking(voucher, booking_amount):
    """
    Check if voucher can be used for a specific booking amount.
    
    Args:
        voucher: RewardVoucher instance
        booking_amount: Decimal amount of the booking
        
    Returns:
        tuple: (can_use: bool, reason: str)
    """
    if not voucher.is_valid:
        return False, f"Voucher {voucher.voucher_code} has expired or is invalid"
    
    if voucher.usage_policy == VoucherUsagePolicy.FIXED_VALUE:
        if booking_amount < voucher.remaining_value:
            return False, f"Booking amount must be at least Rs. {voucher.remaining_value} to use this voucher"
        return True, "Voucher can be applied"
    
    elif voucher.usage_policy == VoucherUsagePolicy.MINIMUM_THRESHOLD:
        min_required = voucher.remaining_value * Decimal('0.8')  # 80% minimum
        if booking_amount < min_required:
            return False, f"Booking amount must be at least Rs. {min_required} to use this voucher"
        return True, "Voucher can be applied"
    
    else:  # PARTIAL_ALLOWED (current system)
        if booking_amount <= 0:
            return False, "Invalid booking amount"
        return True, "Voucher can be applied"

def apply_voucher_to_booking(voucher, booking_amount):
    """
    Apply voucher to booking based on usage policy.
    
    Args:
        voucher: RewardVoucher instance
        booking_amount: Decimal amount of the booking
        
    Returns:
        dict: {
            'discount_amount': Decimal,
            'final_amount': Decimal,
            'voucher_fully_used': bool,
            'message': str
        }
    """
    can_use, reason = can_use_voucher_for_booking(voucher, booking_amount)
    
    if not can_use:
        raise ValueError(reason)
    
    if voucher.usage_policy == VoucherUsagePolicy.FIXED_VALUE:
        # Use full voucher value or fail
        discount = voucher.remaining_value
        final_amount = max(Decimal('0'), booking_amount - discount)
        
        # Mark voucher as fully used
        voucher.used_amount = voucher.value
        voucher.status = 'used'
        voucher.save()
        
        return {
            'discount_amount': discount,
            'final_amount': final_amount,
            'voucher_fully_used': True,
            'message': f"Rs. {discount} voucher applied successfully"
        }
    
    else:
        # Partial usage (existing system)
        discount = min(voucher.remaining_value, booking_amount)
        final_amount = booking_amount - discount
        
        # Update voucher usage
        voucher.use_voucher(discount)
        
        return {
            'discount_amount': discount,
            'final_amount': final_amount,
            'voucher_fully_used': voucher.is_fully_used,
            'message': f"Rs. {discount} applied. Rs. {voucher.remaining_value} remaining." if not voucher.is_fully_used else f"Rs. {discount} voucher fully used"
        }

# Example usage scenarios:

def example_scenarios():
    """
    Demonstrate different voucher usage scenarios
    """
    print("=== VOUCHER USAGE SCENARIOS ===\n")
    
    # Scenario 1: Fixed-value voucher (Recommended)
    print("1. FIXED-VALUE VOUCHER (Rs. 200)")
    print("   Booking Rs. 150: ❌ Cannot use (amount too low)")
    print("   Booking Rs. 200: ✅ Full voucher applied, pay Rs. 0")
    print("   Booking Rs. 350: ✅ Rs. 200 discount, pay Rs. 150")
    print()
    
    # Scenario 2: Current partial system
    print("2. PARTIAL USAGE VOUCHER (Rs. 200)")
    print("   Booking Rs. 150: ✅ Rs. 150 applied, Rs. 50 remaining")
    print("   Booking Rs. 200: ✅ Rs. 200 applied, voucher fully used")
    print("   Booking Rs. 350: ✅ Rs. 200 applied, pay Rs. 150")
    print()
    
    # Scenario 3: Multiple smaller vouchers (Better approach)
    print("3. MULTIPLE SMALLER VOUCHERS")
    print("   Instead of: 1 x Rs. 200 voucher")
    print("   Offer: 4 x Rs. 50 vouchers")
    print("   Booking Rs. 150: ✅ Use 3 vouchers, 1 remaining")
    print("   Booking Rs. 200: ✅ Use all 4 vouchers")
    print()

if __name__ == "__main__":
    example_scenarios()