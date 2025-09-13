"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { VoucherList } from "@/components/vouchers/VoucherList"
import { VoucherQRModal } from "@/components/vouchers/VoucherQRModal"
import { VoucherData } from "@/components/vouchers/VoucherCard"
import { showToast } from "@/components/ui/enhanced-toast"
import { useAuth } from "@/contexts/AuthContext"
import Cookies from "js-cookie"
import { 
  Tag, 
  Gift as GiftIcon,
  Sparkles, 
  TrendingUp,
  Star,
  Award,
  RefreshCw,
  Wallet,
  DollarSign,
  XCircle
} from "lucide-react"
// Removed framer-motion for better performance
import { cn } from "@/lib/utils"

/**
 * VoucherService - Handles all voucher-related API operations
 * 
 * Provides methods for:
 * - Fetching user vouchers with automatic data transformation
 * - Redeeming points for new vouchers
 * - Validating voucher codes
 * - Managing reward account data
 */
class VoucherService {
  private static baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  /**
   * Fetch all vouchers for the authenticated user
   * @returns Promise<VoucherData[]> Array of transformed voucher data
   */
  static async getUserVouchers(): Promise<VoucherData[]> {
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
          // Added cache control headers for better performance
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
    } catch (error: any) {
      // Show user-friendly error toast
      showToast.error({
        title: 'Failed to load vouchers',
        description: 'Unable to retrieve your vouchers. Please check your connection and try again.'
      })
      throw new Error('Failed to load vouchers. Please try again.')
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
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
        const errorMessage = errorData.error || errorData.detail || `Failed to fetch available vouchers: ${response.status}`
        
        // Show specific error toast for available vouchers loading
        showToast.error({
          title: 'Available vouchers unavailable',
          description: errorMessage
        })
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return data.vouchers || []
    } catch (error: any) {
      // Show error toast if no specific error was already shown
      if (!error.message.includes('Failed to fetch available vouchers')) {
        showToast.error({
          title: 'Available vouchers error',
          description: 'Unable to load available vouchers. Using empty list.'
        })
      }
      
      // Return empty array instead of throwing to maintain page functionality
      return []
    }
  }

  /**
   * Redeem user points for a new voucher
   * @param denomination - Voucher value in rupees
   * @returns Promise<VoucherData> The newly created voucher
   */
  static async redeemVoucher(denomination: number): Promise<VoucherData> {
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
        const errorMessage = errorData.error || errorData.detail || 'Failed to redeem voucher'
        
        // Show specific error toast
        showToast.error({
          title: 'Voucher redemption failed',
          description: errorMessage,
          duration:2000
        })
        throw new Error(errorMessage)
      }
      
      const responseData = await response.json()
      
      // Backend returns nested response: { voucher: {...}, account_balance: ..., message: ... }
      const voucher = responseData.voucher
      
      if (!voucher) {
        showToast.error({
          title: 'Invalid response',
          description: 'Received invalid data from server. Please try again.',
          duration:2000
        })
        throw new Error('Invalid response format from server')
      }
      
      // Show success toast for voucher redemption
      const transformedVoucher = VoucherService.transformVoucherData(voucher)
      showToast.success({
        title: 'Voucher redeemed successfully!',
        description: `Your new voucher code: ${transformedVoucher.voucher_code}`
      })
      
      return transformedVoucher
    } catch (error: any) {
      // Only show error toast if we haven't already shown one
      if (!error.message.includes('Failed to redeem voucher') && !error.message.includes('Invalid response')) {
        showToast.error({
          title: 'Redemption failed',
          description: 'Unable to redeem voucher. Please try again.',
          duration:2000
        })
      }
      throw error
    }
  }

  /**
   * Transform backend voucher data to frontend format
   * @param voucher - Raw voucher data from backend
   * @returns VoucherData - Transformed voucher object
   */
  static transformVoucherData(voucher: any): VoucherData {
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
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
        const errorMessage = errorData.error || errorData.detail || `Failed to fetch reward account: ${response.status}`
        
        // Show specific error toast for account loading
        showToast.error({
          title: 'Account data unavailable',
          description: errorMessage,
          duration:2000
        })
        throw new Error(errorMessage)
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
    } catch (error: any) {
      // Show error toast if no specific error was already shown
      if (!error.message.includes('Failed to fetch reward account')) {
        showToast.error({
          title: 'Account error',
          description: 'Unable to load reward account information. Using default values.',
          duration:2000
        })
      }
      
      // Return default account data if fetching fails
      return {
        points_balance: 0,
        total_points_earned: 0,
        current_tier: 'Bronze',
        tier_name: 'Bronze Member',
        points_to_next_tier: 0
      }
    }
  }

  /**
   * Validate a voucher code and return its details
   * @param voucherCode - The voucher code to validate
   * @returns Promise<VoucherData> Validated voucher data
   */
  static async validateVoucherCode(voucherCode: string) {
    try {
      const token = Cookies.get('access_token')
      const response = await fetch(`${this.baseUrl}/rewards/vouchers/validate/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ voucher_code: voucherCode }),
        cache: 'no-store'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || errorData.detail || 'Invalid voucher code'
        
        // Show specific error toast for voucher validation
        showToast.error({
          title: 'Voucher validation failed',
          description: errorMessage
        })
        throw new Error(errorMessage)
      }
      
      const voucher = await response.json()
      
      // Show success toast for valid voucher
      const transformedVoucher = VoucherService.transformVoucherData(voucher)
      showToast.success({
        title: 'Voucher is valid!',
        description: `${transformedVoucher.voucher_code} - Value: ${transformedVoucher.value}`,
        duration:2000
      })
      
      return transformedVoucher
    } catch (error: any) {
      // Only show error toast if we haven't already shown one
      if (!error.message.includes('Invalid voucher code')) {
        showToast.error({
          title: 'Validation error',
          description: 'Unable to validate voucher code. Please try again.',
          duration: 2000
        })
      }
      // Re-throw error with original message for voucher validation
      throw error
    }
  }
}

/**
 * OffersPage Component - Main page for rewards and voucher management
 * 
 * Features:
 * - Display user's vouchers with real-time expiry updates
 * - Redeem points for new vouchers
 * - Validate and apply voucher codes
 * - Show reward account statistics and tier progress
 */
export default function OffersPage() {
  // Helper function to get voucher value for simplified system
  const getVoucherValue = (voucher: VoucherData) => {
    return voucher.status === 'used' ? 0 : voucher.value
  }

  const { user } = useAuth()
  
  // Component state
  const [vouchers, setVouchers] = useState<VoucherData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherData | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [rewardAccount, setRewardAccount] = useState<any>(null)
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([])
  const [redeeming, setRedeeming] = useState(false)
  const [voucherCode, setVoucherCode] = useState("")
  const [validatingCode, setValidatingCode] = useState(false)

  /**
   * Load all required data (vouchers, account info, available options)
   * Uses individual error handling to ensure partial data loading
   */
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Initialize data containers
      let vouchersData: VoucherData[] = []
      let accountData: any = null
      let availableVouchersData: any[] = []
      
      // Load vouchers with error isolation
      try {
        vouchersData = await VoucherService.getUserVouchers()
      } catch (voucherError) {
        // Silently handle voucher loading failure - service already returns user-friendly errors
      }
      
      // Load reward account with error isolation  
      try {
        accountData = await VoucherService.getRewardAccount()
      } catch (accountError) {
        // Silently handle account loading failure - service returns default values
      }

      // Load available vouchers with error isolation
      try {
        availableVouchersData = await VoucherService.getAvailableVouchers()
      } catch (availableError) {
        // Silently handle available vouchers loading failure - service returns empty array
      }
      
      // Update state with loaded data
      setVouchers(vouchersData)
      setRewardAccount(accountData)
      setAvailableVouchers(availableVouchersData)
      
    } catch (err) {
      // Set user-friendly error message for critical failures
      const errorMessage = 'Unable to load offers data. Please check your connection and try again.'
      setError(errorMessage)
      
      // Show error toast for critical data loading failure
      showToast.error({
        title: 'Data loading failed',
        description: errorMessage,
        duration:2000
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Load data when user authentication state changes
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, loadData])

  /**
   * Handle voucher selection for checkout use
   * Stores voucher data in session storage for the booking process
   */
  const handleUseVoucher = useCallback((voucherId: string) => {
    const voucher = vouchers.find(v => v.id === voucherId)
    if (voucher) {
      sessionStorage.setItem('selectedVoucher', JSON.stringify({
        id: voucher.id,
        code: voucher.voucher_code,
        value: getVoucherValue(voucher)
      }))
      
      showToast.success({ 
        title: 'Voucher selected!', 
        description: 'This voucher will be applied at checkout', 
        duration:2000
      })
    }
  }, [vouchers])

  /**
   * Handle voucher sharing via native share API or clipboard
   */
  const handleShareVoucher = useCallback(async (voucher: VoucherData) => {
    try {
      // Create a canvas to generate a comprehensive voucher image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        showToast.error({
          title: 'Canvas error',
          description: 'Could not create image context for voucher sharing',
          duration:2000
        })
        throw new Error('Could not create canvas context');
      }

      // Set canvas dimensions
      canvas.width = 400;
      canvas.height = 600;

      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw border
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
      ctx.setLineDash([]);

      // Draw logo
      ctx.fillStyle = '#333';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SewaBazaar', canvas.width / 2, 60);

      // Draw title
      ctx.fillStyle = '#000';
      ctx.font = '20px Arial';
      ctx.fillText('Discount Voucher', canvas.width / 2, 100);

      // Generate QR code URL
      const qrData = voucher.qr_code_data || JSON.stringify({
        type: 'voucher',
        code: voucher.voucher_code,
        value: voucher.value,
        expires: voucher.expires_at
      });
      
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

      // Draw QR code (if available)
      try {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = qrUrl;
        
        // Wait for image to load
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        // Draw QR code
        const qrSize = 200;
        const qrX = (canvas.width - qrSize) / 2;
        const qrY = 130;
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
      } catch (qrError) {
        // QR code loading failed - continue without it
      }

      // Draw voucher code
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(50, 350, canvas.width - 100, 40);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(voucher.voucher_code, canvas.width / 2, 375);

      // Draw value
      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`Value: Rs. ${voucher.value}`, canvas.width / 2, 420);

      // Draw expiry
      ctx.fillStyle = '#666';
      ctx.font = '14px Arial';
      ctx.fillText(`Expires: ${new Date(voucher.expires_at).toLocaleDateString()}`, canvas.width / 2, 450);

      // Draw status
      const statusConfig = {
        active: { color: '#10b981', label: 'Active' },
        used: { color: '#6b7280', label: 'Used' },
        expired: { color: '#ef4444', label: 'Expired' },
        cancelled: { color: '#f97316', label: 'Cancelled' }
      };
      
      const status = statusConfig[voucher.status] || statusConfig.active;
      ctx.fillStyle = status.color;
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`Status: ${status.label}`, canvas.width / 2, 480);

      // Draw footer
      ctx.fillStyle = '#999';
      ctx.font = '12px Arial';
      ctx.fillText('Scan QR code or enter code during checkout', canvas.width / 2, 530);
      ctx.fillText('Visit sewabazaar.com for terms and conditions', canvas.width / 2, 550);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not create image blob'));
          }
        }, 'image/png');
      });

      const file = new File([blob], `voucher_${voucher.voucher_code}.png`, { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          title: 'SewaBazaar Voucher',
          text: `Check out this voucher! Code: ${voucher.voucher_code} - Value: Rs. ${voucher.value}`,
          files: [file]
        });
      } else {
        // Fallback: copy voucher code
        await navigator.clipboard.writeText(voucher.voucher_code);
        showToast.success({ title: 'Voucher code copied to clipboard!' });
      }
    } catch (error) {
      // Handle sharing error gracefully
      showToast.error({ title: 'Failed to share voucher' });
    }
  }, []);

  /**
   * Handle QR code modal display for mobile voucher usage
   */
  const handleViewQR = useCallback((voucher: VoucherData) => {
    setSelectedVoucher(voucher)
    setQrModalOpen(true)
  }, [])

  /**
   * Handle new voucher redemption using user points
   * Refreshes data after successful redemption
   */
  const handleRedeemVoucher = useCallback(async (denomination: number) => {
    try {
      setRedeeming(true)
      const newVoucher = await VoucherService.redeemVoucher(denomination)
      
      setVouchers(prev => [newVoucher, ...prev])
      await loadData() // Refresh to get updated account balance
      
      // Success toast is already shown by VoucherService.redeemVoucher
    } catch (err) {
      // Error toast is already shown by VoucherService.redeemVoucher for specific errors
      // Only show generic error if no specific error was shown
      if (err instanceof Error && !err.message.includes('Failed to redeem voucher')) {
        showToast.error({ 
          title: 'Failed to redeem voucher', 
          description: 'Please try again', 
          duration:2000
        })
      }
    } finally {
      setRedeeming(false)
    }
  }, [loadData])

  /**
   * Handle manual voucher code validation and application
   * Stores valid voucher for checkout use
   */
  const handleValidateCode = useCallback(async () => {
    if (!voucherCode.trim()) {
      showToast.error({ title: 'Please enter a voucher code' })
      return
    }

    try {
      setValidatingCode(true)
      const result = await VoucherService.validateVoucherCode(voucherCode)
      
      // Success toast is already shown by VoucherService.validateVoucherCode
      
      // Store for checkout use
      sessionStorage.setItem('selectedVoucher', JSON.stringify({
        id: result.id,
        code: result.voucher_code,
        value: result.value
      }))
      
      setVoucherCode("")
    } catch (err) {
      // Error toast is already shown by VoucherService.validateVoucherCode for specific errors
      // Only show generic error if no specific error was shown
      if (err instanceof Error && !err.message.includes('Invalid voucher code')) {
        showToast.error({ 
          title: 'Validation failed', 
          description: 'Please check the code and try again', 
          duration:2000
        })
      }
    } finally {
      setValidatingCode(false)
    }
  }, [voucherCode])

  /**
   * Calculate tier progression data for rewards display
   * @returns Object containing progress percentage, points needed, and next tier name
   */
  const getProgressToNextTier = () => {
    if (!rewardAccount) return { progress: 0, needed: 0, nextTier: '' }
    
    const tierThresholds = {
      'Bronze': 0,
      'Silver': 1000,
      'Gold': 2500,
      'Platinum': 5000,
      'Diamond': 10000
    }
    
    const currentTier = rewardAccount.current_tier || 'Bronze'
    const currentPoints = rewardAccount.total_points_earned || 0
    
    const tiers = Object.keys(tierThresholds)
    const currentTierIndex = tiers.indexOf(currentTier)
    
    if (currentTierIndex === tiers.length - 1) {
      return { progress: 100, needed: 0, nextTier: 'Max Level' }
    }
    
    const nextTier = tiers[currentTierIndex + 1]
    const nextThreshold = tierThresholds[nextTier as keyof typeof tierThresholds]
    const progress = Math.min((currentPoints / nextThreshold) * 100, 100)
    const needed = Math.max(nextThreshold - currentPoints, 0)
    
    return { progress, needed, nextTier }
  }

  const tierProgress = getProgressToNextTier()

  // Function to get tier-specific colors with enhanced design
  const getTierColors = (tier: string) => {
    const tierColors: Record<string, { bg: string; text: string; border: string; badge: string; hover: string }> = {
      'Bronze': {
        bg: 'bg-amber-50 dark:bg-amber-900/30',
        text: 'text-amber-800 dark:text-amber-200',
        border: 'border-amber-200 dark:border-amber-800',
        badge: 'bg-gradient-to-r from-amber-400/20 to-amber-600/20 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-600',
        hover: 'hover:from-amber-100 hover:to-amber-200 dark:hover:from-amber-800/40 dark:hover:to-amber-900/40'
      },
      'Silver': {
        bg: 'bg-gray-50 dark:bg-gray-800/30',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border-gray-300 dark:border-gray-600',
        badge: 'bg-gradient-to-r from-gray-300/20 to-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-500',
        hover: 'hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700/40 dark:hover:to-gray-800/40'
      },
      'Gold': {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-700 dark:text-amber-200',
        border: 'border-amber-300 dark:border-amber-600',
        badge: 'bg-gradient-to-r from-amber-200/40 to-amber-400/40 text-amber-800 dark:text-amber-100 border-amber-400 dark:border-amber-500 shadow-sm',
        hover: 'hover:from-amber-100 hover:to-amber-200 dark:hover:from-amber-800/40 dark:hover:to-amber-900/40'
      },
      'Platinum': {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-300 dark:border-blue-600',
        badge: 'bg-gradient-to-r from-blue-400/20 to-blue-600/20 text-blue-700 dark:text-blue-300 border-blue-400 dark:border-blue-500',
        hover: 'hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/30 dark:hover:to-blue-900/30'
      }
    }
    
    return tierColors[tier] || tierColors['Bronze']
  }

  // Get tier colors for current tier
  const tierColors = rewardAccount ? getTierColors(rewardAccount.current_tier) : getTierColors('Bronze')

  // Show sign-in prompt for unauthenticated users
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GiftIcon className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign In Required</h3>
            <p className="text-gray-600 text-center">
              Please sign in to view your offers and vouchers.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 dark:from-primary/30 dark:to-blue-500/30">
                <GiftIcon className="w-8 h-8 text-primary" />
              </div>
              <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Offers & Rewards
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Earn points, redeem vouchers, and enjoy exclusive discounts
            </p>
          </div>
          <div>
            <Button 
              onClick={loadData} 
              variant="outline" 
              size="sm"
              className="transition-all duration-200 hover:shadow-md hover:border-primary/50 dark:hover:border-primary/50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="vouchers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <TabsTrigger 
            value="vouchers"
            className="transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-md data-[state=active]:scale-105"
          >
            My Vouchers
          </TabsTrigger>
          <TabsTrigger 
            value="rewards"
            className="transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-md data-[state=active]:scale-105"
          >
            Reward Account
          </TabsTrigger>
          <TabsTrigger 
            value="redeem"
            className="transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-md data-[state=active]:scale-105"
          >
            Redeem Code
          </TabsTrigger>
        </TabsList>

        {/* Vouchers Tab */}
        <TabsContent value="vouchers" className="space-y-6">
          <div>
            {/* Revert to using the original VoucherList */}
            <VoucherList
              vouchers={vouchers}
              loading={loading}
              error={error || undefined}
              onUseVoucher={handleUseVoucher}
              onShareVoucher={handleShareVoucher}
              onViewQR={handleViewQR}
            />
          </div>
        </TabsContent>

        {/* Reward Account Tab */}
        <TabsContent value="rewards" className="space-y-6">
          {rewardAccount && (
            <div className="grid gap-6">
              {/* Account Summary with enhanced design */}
              <Card className={cn(
                "relative overflow-hidden bg-gradient-to-br from-primary/5 via-blue-500/3 to-purple-500/5 dark:from-primary/10 dark:via-blue-500/5 dark:to-purple-500/10 border-primary/20 dark:border-primary/30 transition-all duration-300",
                tierColors.border
              )}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div>
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                      Reward Account Summary
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div 
                      className={cn(
                        "text-center p-5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg",
                        tierColors.bg,
                        tierColors.hover
                      )}
                    >
                      <p 
                        className={cn(
                          "text-3xl font-bold",
                          tierColors.text
                        )}
                      >
                        {rewardAccount.points_balance}
                      </p>
                      <p className={cn("text-sm font-medium mt-1", tierColors.text)}>
                        Available Points
                      </p>
                    </div>
                    <div 
                      className={cn(
                        "text-center p-5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg bg-white/50 dark:bg-gray-800/30 hover:bg-white/80 dark:hover:bg-gray-800/50",
                        tierColors.hover
                      )}
                    >
                      <p 
                        className={cn(
                          "text-3xl font-bold text-gray-900 dark:text-gray-100"
                        )}
                      >
                        {rewardAccount.total_points_earned}
                      </p>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
                        Total Earned
                      </p>
                    </div>
                    <div 
                      className={cn(
                        "text-center p-5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg",
                        tierColors.bg,
                        tierColors.hover
                      )}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <div>
                          <Star className="w-5 h-5 text-yellow-500" />
                        </div>
                        <p 
                          className={cn(
                            "text-3xl font-bold",
                            tierColors.text
                          )}
                        >
                          {rewardAccount.current_tier}
                        </p>
                      </div>
                      <p className={cn("text-sm font-medium mt-1", tierColors.text)}>
                        Current Tier
                      </p>
                    </div>
                    <div className="text-center p-5 rounded-xl bg-white/50 dark:bg-gray-800/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-white/80 dark:hover:bg-gray-800/50">
                      <div>
                        <Badge 
                          variant={
                            rewardAccount.current_tier === 'Bronze' ? 'bronze' :
                            rewardAccount.current_tier === 'Silver' ? 'silver' :
                            rewardAccount.current_tier === 'Gold' ? 'gold' :
                            rewardAccount.current_tier === 'Platinum' ? 'platinum' :
                            'secondary'
                          }
                          className="text-lg px-4 py-2 font-bold border-2 shadow-md"
                        >
                          <Award className="w-5 h-5 mr-2" />
                          {rewardAccount.tier_name || 'Member'}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-2">
                        Status
                      </p>
                    </div>
                  </div>

                  {/* Tier Progress */}
                  <div className="mt-8">
                    <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                      <span>Progress to {tierProgress.nextTier}</span>
                      <span>{tierProgress.needed} points needed</span>
                    </div>
                    <Progress value={tierProgress.progress} className="h-3 rounded-full" />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Redeem Options with enhanced design */}
              <Card className="border-primary/20 dark:border-primary/30 transition-all duration-300 hover:shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div>
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                      Redeem Points for Vouchers
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {availableVouchers.length === 0 ? (
                    <div className="text-center py-8">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Loading available vouchers...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {availableVouchers.map((voucher, index) => (
                        <div
                          key={index}
                          className="h-full"
                        >
                          <Card 
                            className={cn(
                              "border-2 transition-all duration-300 overflow-hidden relative h-full flex flex-col",
                              voucher.user_can_afford 
                                ? 'border-primary/40 hover:border-primary/70 hover:shadow-xl bg-gradient-to-br from-white to-primary/5 dark:from-card dark:to-primary/10' 
                                : 'border-gray-200 dark:border-gray-700 opacity-80 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-card dark:to-gray-800/20'
                            )}
                          >
                            {/* Animated background effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 opacity-0 hover:opacity-100"></div>
                            
                            <CardContent className="p-5 flex flex-col flex-grow">
                              <div className="flex justify-between items-start mb-4">
                                <div
                                  className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10"
                                >
                                  <DollarSign className="w-6 h-6 text-primary" />
                                </div>
                                
                                {voucher.savings_percentage > 0 && (
                                  <div>
                                    <Badge 
                                      variant="secondary" 
                                      className="bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-700 dark:text-green-300 border-green-400 dark:border-green-600 font-bold"
                                    >
                                      {voucher.savings_percentage.toFixed(1)}% Bonus
                                    </Badge>
                                  </div>
                                )}
                              </div>
                              
                              <div className="mb-4 flex-grow">
                                <div>
                                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                    Rs. {voucher.denomination}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {voucher.points_required} Points
                                  </p>
                                </div>
                              </div>
                              
                              <div
                                className="mt-auto"
                              >
                                <Button
                                  onClick={() => handleRedeemVoucher(parseFloat(voucher.denomination))}
                                  disabled={redeeming || !voucher.user_can_afford}
                                  className={cn(
                                    "w-full font-bold transition-all duration-300 py-3 text-base",
                                    voucher.user_can_afford 
                                      ? "bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 shadow-md hover:shadow-lg" 
                                      : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                                  )}
                                  size="lg"
                                >
                                  {redeeming ? (
                                    <div
                                      className="animate-spin"
                                    >
                                      <RefreshCw className="w-5 h-5" />
                                    </div>
                                  ) : voucher.user_can_afford ? (
                                    <>
                                      <GiftIcon className="w-5 h-5 mr-2" />
                                      Redeem Now
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-5 h-5 mr-2" />
                                      Insufficient Points
                                    </>
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Redeem Code Tab */}
        <TabsContent value="redeem" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Tag className="w-5 h-5" />
                <span>Redeem Voucher Code</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Enter Voucher Code</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter voucher code (e.g., SB-20250911-ABCD12)"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                  <Button 
                    onClick={handleValidateCode}
                    disabled={validatingCode || !voucherCode.trim()}
                  >
                    {validatingCode ? 'Validating...' : 'Apply'}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Enter a voucher code to validate and apply it to your next booking.
              </p>
            </CardContent>
          </Card>

          {/* How to Earn Points */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>How Vouchers Work</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-primary">Voucher Usage Rules</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <p className="text-gray-700 dark:text-gray-300"><strong>Fixed Value:</strong> Each voucher has a set amount (Rs. 100, 200, 500, etc.)</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <p className="text-gray-700 dark:text-gray-300"><strong>Flexible Usage:</strong> Use vouchers on any booking - excess value is forfeited</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <p className="text-gray-700 dark:text-gray-300"><strong>One Per Booking:</strong> Use one voucher per service booking</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <p className="text-gray-700 dark:text-gray-300"><strong>Expiry:</strong> Valid for 1 month from redemption date</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 text-primary">Example Usage</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">✅ All Usage is Valid:</p>
                      <p className="text-gray-700 dark:text-gray-300">Rs. 200 voucher + Rs. 250 booking = Pay Rs. 50</p>
                      <p className="text-gray-700 dark:text-gray-300">Rs. 200 voucher + Rs. 100 booking = Pay Rs. 0 (Rs. 100 forfeited)</p>
                      <p className="text-gray-700 dark:text-gray-300">Rs. 500 voucher + Rs. 300 booking = Pay Rs. 0 (Rs. 200 forfeited)</p>
                    </div>
                    <div>
                      <p className="font-medium text-blue-700 dark:text-blue-400">💡 Smart Tips:</p>
                      <p className="text-gray-700 dark:text-gray-300">• Use higher value vouchers on expensive services</p>
                      <p className="text-gray-700 dark:text-gray-300">• Redeem smaller denominations for more flexibility</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">You control how to use your vouchers - no restrictions!</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How to Earn Points */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>How to Earn Points</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Complete Bookings</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Earn 10 points for every Rs. 100 spent</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Write Reviews</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Get 25 points for each service review</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Refer Friends</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Earn 100 points for each successful referral</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Special Promotions</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Participate in events for bonus points</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* QR Code Modal */}
      <VoucherQRModal
        voucher={selectedVoucher}
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
      />
    </div>
  )
}