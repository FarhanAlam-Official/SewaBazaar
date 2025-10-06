# Voucher Usage Strategies - Analysis & Recommendations

## Current System Issues

### Problem: Partial Usage Complexity

- **Current**: Rs. 200 voucher can be used for Rs. 150, leaving Rs. 50 remainder
- **Issues**: User confusion, technical complexity, business complications

## Recommended Strategies

### 1. **Fixed-Value Vouchers (Recommended)**

```bash
Strategy: All-or-nothing usage
- Rs. 200 voucher must be used for bookings ≥ Rs. 200
- If booking is Rs. 150, voucher cannot be used
- Simple, clear, industry standard
```

**Benefits:**

- ✅ No partial tracking needed
- ✅ Clear user expectations
- ✅ Simple business logic
- ✅ No remainder complications

**Implementation:**

```python
def can_use_voucher(self, booking_amount):
    return booking_amount >= self.value and self.is_valid

def use_voucher(self, booking_amount):
    if not self.can_use_voucher(booking_amount):
        raise ValueError(f"Booking amount must be at least Rs. {self.value}")
    
    self.status = 'used'
    self.used_at = timezone.now()
    self.save()
    return self.value
```

### 2. **Smaller Denomination Strategy**

```bash
Instead of: One Rs. 200 voucher
Offer: Two Rs. 100 vouchers OR Four Rs. 50 vouchers
```

**Benefits:**

- ✅ More flexible usage
- ✅ No partial tracking
- ✅ Better user control
- ✅ Simple redemption

### 3. **Tiered Voucher System**

```bash
Redemption Options:
- 100 points → Rs. 50 voucher
- 200 points → Rs. 100 voucher  
- 500 points → Rs. 250 voucher
- 1000 points → Rs. 500 voucher (bonus value)
```

### 4. **Credit Balance System (Alternative)**

```bash
Instead of vouchers, maintain a "SewaBazaar Credit" balance:
- Redeem points → Add to credit balance
- Use credits → Deduct from balance
- Like a digital wallet
```

## Industry Examples

### Successful Models

1. **Amazon Gift Cards**: Fixed value, no partial usage
2. **Starbucks**: Digital wallet with balance (credits)
3. **Uber Credits**: Wallet-based system
4. **McDonald's**: Fixed vouchers only

### Failed Models

- Complex partial systems usually get simplified later

## Recommended Implementation

### Phase 1: Simplify Current System

```python
# Add voucher usage policy
class VoucherUsagePolicy:
    FIXED_VALUE = 'fixed'      # Must use full amount
    PARTIAL_ALLOWED = 'partial' # Current system
    MINIMUM_THRESHOLD = 'minimum' # Min 80% usage required

# Update voucher model
class RewardVoucher(models.Model):
    usage_policy = models.CharField(
        max_length=20,
        choices=[
            ('fixed', 'Fixed Value - Full Amount Only'),
            ('partial', 'Partial Usage Allowed'),
            ('minimum', 'Minimum Threshold Required'),
        ],
        default='fixed'
    )
```

### Phase 2: Offer Multiple Denominations

```python
# In RewardsConfig
voucher_denominations = [50, 100, 200, 500, 1000, 2000]

# Points required for each denomination
denomination_points = {
    50: 100,
    100: 200,
    200: 400,
    500: 950,    # Slight discount for larger amounts
    1000: 1900,
    2000: 3700
}
```

## User Experience Improvements

### Clear Communication

```bash
❌ "You have Rs. 37.50 remaining on your voucher"
✅ "Your Rs. 100 voucher is ready to use!"

❌ "Enter amount to use from voucher"
✅ "Apply Rs. 100 voucher to this booking"
```

### Frontend Changes

```typescript
// Simplified voucher selection
interface VoucherOption {
  id: string
  value: number
  canUse: boolean
  reason?: string // "Booking amount too low"
}

// Clear usage rules
const VoucherRules = () => (
  <div className="text-sm text-gray-600">
    <h4>How Vouchers Work:</h4>
    <ul>
      <li>• Each voucher has a fixed value (Rs. 50, 100, 200, etc.)</li>
      <li>• Use vouchers on bookings of equal or higher value</li>
      <li>• Vouchers expire 6 months after redemption</li>
      <li>• One voucher per booking</li>
    </ul>
  </div>
)
```

## Migration Strategy

### Option A: Keep Current System for Existing Vouchers

```python
# Grandfather existing partial vouchers
if voucher.created_at < datetime(2025, 10, 1):
    # Allow partial usage
    return voucher.use_partial(amount)
else:
    # New fixed-value system
    return voucher.use_fixed(booking_amount)
```

### Option B: Convert Existing Vouchers

```python
def migrate_partial_vouchers():
    """Convert existing partial vouchers to fixed-value vouchers"""
    for voucher in RewardVoucher.objects.filter(status='active', used_amount__gt=0):
        remaining = voucher.remaining_value
        
        # Create new voucher for remaining amount
        if remaining >= 50:  # Minimum denomination
            new_voucher = RewardVoucher.objects.create(
                account=voucher.account,
                value=remaining,
                points_redeemed=0,  # No additional points charged
                source='migration'
            )
        
        # Mark old voucher as migrated
        voucher.status = 'migrated'
        voucher.save()
```

## Conclusion

**Recommendation**: Move to fixed-value vouchers with multiple denominations.

**Why**:

- Simpler for users to understand
- Easier to implement and maintain
- Industry standard approach
- Better business control
- Cleaner user experience

**Timeline**:

1. **Immediate**: Add usage policy field to vouchers
2. **Week 1**: Implement fixed-value option for new vouchers
3. **Week 2**: Add multiple denomination options
4. **Week 3**: Migrate existing vouchers
5. **Week 4**: Deprecate partial usage system
