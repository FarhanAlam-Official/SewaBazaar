# Fixed-Value Voucher System Specification

## 📋 **System Requirements**

### **Decision Summary:**

- ✅ **Policy**: Fixed-value vouchers only
- ✅ **Denominations**: Keep current strategy (50, 100, 200, 500, 1000)
- ✅ **Migration**: Remove all existing vouchers, create samples
- ✅ **Implementation**: Step-by-step with testing

---

## 🎯 **Voucher Usage Rules**

### **Simplified Voucher Policy**

```bash
Rule: Voucher can be used on ANY booking amount > 0
- Rs. 500 voucher + Rs. 300 booking → Rs. 300 discount, Rs. 200 wasted (user's choice)
- Rs. 500 voucher + Rs. 700 booking → Rs. 500 discount, pay Rs. 200
- No minimum booking requirements
- User decides if they want to "waste" voucher value
```

### **Examples:**

```bash
✅ All Cases Are Valid:
- Rs. 100 voucher + Rs. 50 booking → Pay Rs. 0, Rs. 50 voucher value wasted
- Rs. 100 voucher + Rs. 150 booking → Pay Rs. 50, full voucher used
- Rs. 500 voucher + Rs. 300 booking → Pay Rs. 0, Rs. 200 voucher value wasted
- Rs. 500 voucher + Rs. 800 booking → Pay Rs. 300, full voucher used

❌ Only Invalid Case:
- Using already used/expired voucher
```

---

## 💰 **Denomination Strategy**

### **Available Vouchers:**

| Denomination | Points Required | Ratio | User Benefit |
|-------------|----------------|-------|--------------|
| Rs. 50      | 100 points    | 2:1   | Basic option |
| Rs. 100     | 200 points    | 2:1   | Standard option |
| Rs. 200     | 400 points    | 2:1   | Popular choice |
| Rs. 500     | 1000 points   | 2:1   | Higher value |
| Rs. 1000    | 2000 points   | 2:1   | Premium option |

### **Rationale:**

- **Simple 2:1 ratio**: Easy to understand (100 points = Rs. 50)
- **Multiple options**: Users can choose based on spending patterns
- **No complexity**: No bonus calculations or special rules

---

## 🔧 **Technical Implementation**

### **Model Changes Required:**

```python
class RewardVoucher(models.Model):
    # Existing fields remain the same
    # Add new field:
    usage_policy = models.CharField(
        max_length=20,
        choices=[('fixed', 'Fixed Value')],
        default='fixed'
    )
    
    # New method:
    def can_use_for_booking(self, booking_amount):
        """Check if voucher can be used for booking"""
        return (
            self.is_valid and 
            booking_amount >= self.remaining_value
        )
    
    def apply_to_booking(self, booking_amount):
        """Apply full voucher to booking"""
        if not self.can_use_for_booking(booking_amount):
            raise ValueError(f"Booking must be at least Rs. {self.remaining_value}")
        
        discount = self.remaining_value
        self.status = 'used'
        self.used_at = timezone.now()
        self.used_amount = self.value
        self.save()
        
        return discount
```

### **API Changes Required:**

```python
# New validation endpoint
POST /api/rewards/vouchers/validate-booking/
{
    "voucher_code": "SB-12345",
    "booking_amount": 150.00
}

Response:
{
    "can_use": false,
    "reason": "Booking amount must be at least Rs. 200.00",
    "voucher_value": 200.00,
    "required_amount": 200.00
}
```

### **Frontend Changes Required:**

```typescript
interface VoucherValidation {
  canUse: boolean;
  reason?: string;
  voucherValue: number;
  discountAmount?: number;
  finalAmount?: number;
}

// Usage validation before applying voucher
const validateVoucherUsage = async (
  voucherCode: string, 
  bookingAmount: number
): Promise<VoucherValidation> => {
  // API call to validate
};
```

---

## 📊 **Sample Data Structure**

### **Sample Vouchers to Create:**

```json
[
  {
    "value": 50.00,
    "voucher_code": "SB-SAMPLE-50-001",
    "points_redeemed": 100,
    "status": "active",
    "usage_policy": "fixed",
    "expires_at": "2025-12-31"
  },
  {
    "value": 100.00,
    "voucher_code": "SB-SAMPLE-100-001",
    "points_redeemed": 200,
    "status": "active", 
    "usage_policy": "fixed",
    "expires_at": "2025-12-31"
  },
  {
    "value": 200.00,
    "voucher_code": "SB-SAMPLE-200-001",
    "points_redeemed": 400,
    "status": "active",
    "usage_policy": "fixed", 
    "expires_at": "2025-12-31"
  }
]
```

---

## 🧪 **Test Scenarios**

### **Functional Tests:**

1. **Valid Usage:**
   - Use Rs. 100 voucher on Rs. 150 booking
   - Use Rs. 200 voucher on Rs. 200 booking
   - Use Rs. 500 voucher on Rs. 800 booking

2. **Invalid Usage:**
   - Try Rs. 200 voucher on Rs. 150 booking
   - Try expired voucher
   - Try already used voucher

3. **Edge Cases:**
   - Booking amount exactly equals voucher value
   - Multiple vouchers available, user picks one
   - Voucher validation with different currencies

### **UI Tests:**

1. **Voucher Display:**
   - Show clear usage rules on voucher cards
   - Display minimum booking amount
   - Show appropriate error messages

2. **Redemption Process:**
   - Select denomination during redemption
   - Confirm points deduction
   - Show success message with voucher code

---

## 📋 **Implementation Checklist**

### **Phase 1: Backend Changes**

- [ ] Add `usage_policy` field to RewardVoucher model
- [ ] Create database migration
- [ ] Update `can_use_for_booking()` method
- [ ] Update `apply_to_booking()` method
- [ ] Add voucher validation endpoint
- [ ] Update redemption endpoint to support fixed-value only

### **Phase 2: Data Management**

- [ ] Create script to clear existing vouchers
- [ ] Create script to generate sample vouchers
- [ ] Test data creation and validation

### **Phase 3: Frontend Changes**

- [ ] Update VoucherCard to show usage policy
- [ ] Add booking amount validation
- [ ] Update error messages
- [ ] Add clear usage rules display

### **Phase 4: Testing**

- [ ] Unit tests for model methods
- [ ] API endpoint tests
- [ ] Frontend component tests
- [ ] Integration tests

### **Phase 5: Documentation**

- [ ] Update API documentation
- [ ] Create user guide
- [ ] Update admin documentation

---

## 🎯 **Success Criteria**

### **Functional:**

- ✅ All vouchers are fixed-value only
- ✅ Clear error messages for invalid usage
- ✅ Simple redemption process
- ✅ No partial voucher remainders

### **User Experience:**

- ✅ Users understand voucher rules immediately
- ✅ No confusion about partial usage
- ✅ Clear minimum booking requirements
- ✅ Helpful error messages

### **Technical:**

- ✅ Clean, maintainable code
- ✅ Comprehensive test coverage
- ✅ Proper error handling
- ✅ Good performance

---

**Next Step**: Implement backend model changes with database migration.
