import Cookies from "js-cookie"

// Rate limiting for voucher validation
const voucherValidationAttempts: { [key: string]: number } = {};
const voucherValidationWindow = 60000; // 1 minute window
const maxValidationAttempts = 5; // Max 5 attempts per minute

/**
 * VoucherService - Handles all voucher-related API operations
 * 
 * Provides methods for:
 * - Fetching user vouchers with automatic data transformation
 * - Redeeming points for new vouchers
 * - Validating voucher codes
 * - Managing reward account data
 */
export class VoucherService {
  static baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  /**
   * Fetch all vouchers for the authenticated user
   * @returns Promise<any[]> Array of transformed voucher data
   */
  static async getUserVouchers(): Promise<any[]> {
    try {
      const token = Cookies.get('access_token')
      
      // Return empty array if no authentication token
      if (!token) {
        return []
      }

      const response = await fetch(`${this.baseUrl}/rewards/vouchers/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // Disable cache for fresh data
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch vouchers: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Handle different API response structures (paginated, nested, or direct array)
      let vouchers = data
      if (data && data.results) {
        vouchers = data.results // Paginated response
      } else if (data && data.vouchers) {
        vouchers = data.vouchers // Nested response
      } else if (!Array.isArray(data)) {
        return []
      }
      
      if (!Array.isArray(vouchers)) {
        return []
      }
      
      // Transform backend voucher data to frontend format
      return vouchers.map((voucher: any) => ({
        id: voucher.id.toString(),
        voucher_code: voucher.voucher_code,
        value: parseFloat(voucher.value),
        status: voucher.status,
        created_at: voucher.created_at,
        expires_at: voucher.expires_at,
        used_at: voucher.used_at,
        used_amount: voucher.status === 'used' ? parseFloat(voucher.used_amount) || parseFloat(voucher.value) : undefined,
        points_redeemed: voucher.points_redeemed,
        usage_policy: 'fixed', // Simplified fixed-value voucher system
        qr_code_data: voucher.qr_code_data,
        metadata: voucher.metadata || {}
      }))
    } catch (error) {
      console.error('Error fetching vouchers:', error)
      throw error
    }
  }

  /**
   * Get available voucher denominations for redemption
   * @returns Promise<any[]> Array of available voucher options with pricing
   */
  static async getAvailableVouchers() {
    try {
      const token = Cookies.get('access_token')
      
      if (!token) {
        return []
      }

      const response = await fetch(`${this.baseUrl}/rewards/vouchers/available/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch available vouchers: ${response.status}`)
      }
      
      const data = await response.json()
      return data.vouchers || []
    } catch (error) {
      console.error('Error fetching available vouchers:', error)
      return []
    }
  }

  /**
   * Redeem user points for a new voucher
   * @param denomination - Voucher value in rupees
   * @returns Promise<any> The newly created voucher
   */
  static async redeemVoucher(denomination: number): Promise<any> {
    try {
      const token = Cookies.get('access_token')
      const response = await fetch(`${this.baseUrl}/rewards/vouchers/redeem/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ denomination: denomination.toString() }),
        cache: 'no-store'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.detail || 'Failed to redeem voucher')
      }
      
      const responseData = await response.json()
      
      // Backend returns nested response: { voucher: {...}, account_balance: ..., message: ... }
      const voucher = responseData.voucher
      
      if (!voucher) {
        throw new Error('Invalid response format from server')
      }
      
      return VoucherService.transformVoucherData(voucher)
    } catch (error) {
      console.error('Error redeeming voucher:', error)
      throw error
    }
  }

  /**
   * Transform backend voucher data to frontend format
   * @param voucher - Raw voucher data from backend
   * @returns any - Transformed voucher object
   */
  static transformVoucherData(voucher: any): any {
    return {
      id: voucher.id.toString(),
      voucher_code: voucher.voucher_code,
      value: parseFloat(voucher.value),
      status: voucher.status,
      created_at: voucher.created_at,
      expires_at: voucher.expires_at,
      used_at: voucher.used_at,
      used_amount: voucher.status === 'used' ? parseFloat(voucher.value) : undefined,
      points_redeemed: voucher.points_redeemed,
      usage_policy: 'fixed',
      qr_code_data: voucher.qr_code_data,
      metadata: voucher.metadata || {}
    }
  }

  /**
   * Get user's reward account information including points balance and tier status
   * @returns Promise<any> Transformed reward account data or null if not authenticated
   */
  static async getRewardAccount() {
    try {
      const token = Cookies.get('access_token')
      
      if (!token) {
        return null
      }

      const response = await fetch(`${this.baseUrl}/rewards/account/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reward account: ${response.status}`)
      }
      
      const account = await response.json()
      
      // Transform backend account data to frontend format
      return {
        points_balance: account.current_balance,
        total_points_earned: account.total_points_earned,
        current_tier: account.tier_display || account.tier_level || 'Bronze',
        tier_name: account.tier_display || account.tier_level || 'Bronze Member',
        points_to_next_tier: account.tier_progress?.points_needed || 0
      }
    } catch (error) {
      console.error('Error fetching reward account:', error)
      throw error
    }
  }

  /**
   * Validate a voucher code and return its details
   * @param voucherCode - The voucher code to validate
   * @returns Promise<any> Validated voucher data
   */
  static async validateVoucherCode(voucherCode: string) {
    // Input sanitization
    const sanitizedCode = voucherCode.trim().toUpperCase();
    
    // Basic validation
    if (!sanitizedCode) {
      throw new Error('Voucher code is required');
    }
    
    // Format validation
    if (!/^[A-Z0-9\-]+$/.test(sanitizedCode)) {
      throw new Error('Invalid voucher code format');
    }
    
    if (sanitizedCode.length > 20) {
      throw new Error('Voucher code too long');
    }
    
    // Client-side rate limiting
    const now = Date.now();
    const user = Cookies.get('user_id') || 'anonymous';
    
    // Clean up old attempts
    Object.keys(voucherValidationAttempts).forEach(key => {
      if (now - parseInt(key.split(':')[1]) > voucherValidationWindow) {
        delete voucherValidationAttempts[key];
      }
    });
    
    // Check rate limit
    const attemptKey = `${user}:${now}`;
    const recentAttempts = Object.keys(voucherValidationAttempts)
      .filter(key => now - parseInt(key.split(':')[1]) < voucherValidationWindow)
      .length;
      
    if (recentAttempts >= maxValidationAttempts) {
      throw new Error('Too many validation attempts. Please try again later.');
    }
    
    // Record this attempt
    voucherValidationAttempts[attemptKey] = now;
    
    try {
      const token = Cookies.get('access_token');
      const response = await fetch(`${this.baseUrl}/rewards/vouchers/validate/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ voucher_code: sanitizedCode }),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.detail || 'Invalid voucher code';
        
        // Handle specific error cases
        switch (response.status) {
          case 400:
            throw new Error(errorMessage);
          case 401:
            throw new Error('Authentication required. Please log in again.');
          case 403:
            throw new Error('Access denied. This voucher may not belong to you.');
          case 404:
            throw new Error('Voucher not found.');
          case 429:
            throw new Error('Too many requests. Please try again later.');
          case 500:
            throw new Error('Server error. Please try again later.');
          default:
            throw new Error(errorMessage || 'An unexpected error occurred');
        }
      }
      
      const voucher = await response.json();
      
      return VoucherService.transformVoucherData(voucher);
    } catch (error: any) {
      console.error('Error validating voucher code:', error);
      
      // Handle network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      throw error;
    }
  }
}