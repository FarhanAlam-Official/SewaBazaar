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
  Gift, 
  Sparkles, 
  TrendingUp,
  Star,
  Award,
  RefreshCw,
  Wallet,
  DollarSign
} from "lucide-react"
import { motion } from "framer-motion"

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
        }
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
        }
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
        body: JSON.stringify({ denomination: denomination.toString() })
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
        }
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
        body: JSON.stringify({ voucher_code: voucherCode })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.detail || 'Invalid voucher code')
      }
      
      const voucher = await response.json()
      
      return VoucherService.transformVoucherData(voucher)
    } catch (error) {
      console.error('Error validating voucher code:', error)
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
        console.warn('Failed to load vouchers:', voucherError)
      }
      
      // Load reward account with error isolation
      try {
        accountData = await VoucherService.getRewardAccount()
      } catch (accountError) {
        console.warn('Failed to load reward account:', accountError)
      }

      // Load available vouchers with error isolation
      try {
        availableVouchersData = await VoucherService.getAvailableVouchers()
      } catch (availableError) {
        console.warn('Failed to load available vouchers:', availableError)
      }
      
      // Update state with loaded data
      setVouchers(vouchersData)
      setRewardAccount(accountData)
      setAvailableVouchers(availableVouchersData)
      
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Unable to load some data. Please check your connection and try again.')
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
        description: 'This voucher will be applied at checkout' 
      })
    }
  }, [vouchers])

  /**
   * Handle voucher sharing via native share API or clipboard
   */
  const handleShareVoucher = useCallback((voucher: VoucherData) => {
    if (navigator.share) {
      navigator.share({
        title: 'SewaBazaar Voucher',
        text: `I'm sharing a SewaBazaar voucher worth Rs. ${getVoucherValue(voucher)}! Code: ${voucher.voucher_code}`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(voucher.voucher_code)
      showToast.success({ title: 'Voucher code copied to clipboard!' })
    }
  }, [])

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
      
      showToast.success({ 
        title: 'Voucher redeemed successfully!', 
        description: `Your new voucher: ${newVoucher.voucher_code}` 
      })
    } catch (err) {
      console.error('Error redeeming voucher:', err)
      showToast.error({ 
        title: 'Failed to redeem voucher', 
        description: err instanceof Error ? err.message : 'Please try again' 
      })
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
      
      showToast.success({ 
        title: 'Valid voucher code!', 
        description: `Value: Rs. ${result.value}` 
      })
      
      // Store for checkout use
      sessionStorage.setItem('selectedVoucher', JSON.stringify({
        id: result.id,
        code: result.voucher_code,
        value: result.value
      }))
      
      setVoucherCode("")
    } catch (err) {
      showToast.error({ 
        title: 'Invalid voucher code', 
        description: 'Please check the code and try again' 
      })
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

  // Show sign-in prompt for unauthenticated users
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gift className="w-16 h-16 text-gray-300 mb-4" />
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center space-x-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 dark:from-primary/30 dark:to-blue-500/30"
              >
                <Gift className="w-8 h-8 text-primary" />
              </motion.div>
              <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Offers & Rewards
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Earn points, redeem vouchers, and enjoy exclusive discounts
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={loadData} 
              variant="outline" 
              size="sm"
              className="transition-all duration-200 hover:shadow-md hover:border-primary/50 dark:hover:border-primary/50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </motion.div>
        </div>
      </motion.div>

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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Revert to using the original VoucherList */}
            <VoucherList
              vouchers={vouchers}
              loading={loading}
              error={error || undefined}
              onUseVoucher={handleUseVoucher}
              onShareVoucher={handleShareVoucher}
              onViewQR={handleViewQR}
            />
          </motion.div>
        </TabsContent>

        {/* Reward Account Tab */}
        <TabsContent value="rewards" className="space-y-6">
          {rewardAccount && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid gap-6"
            >
              {/* Account Summary */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-blue-500/5 to-purple-500/10 dark:from-primary/20 dark:via-blue-500/10 dark:to-purple-500/20 border-primary/20 dark:border-primary/30 hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent dark:via-white/10 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000"></div>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-5 h-5 text-primary" />
                    </motion.div>
                    <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                      Reward Account Summary
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <motion.div 
                      className="text-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:scale-105 hover:shadow-md"
                      whileHover={{ y: -5 }}
                    >
                      <motion.p 
                        className="text-3xl font-bold text-primary"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.1 }}
                      >
                        {rewardAccount.points_balance}
                      </motion.p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Available Points</p>
                    </motion.div>
                    <motion.div 
                      className="text-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:scale-105 hover:shadow-md"
                      whileHover={{ y: -5 }}
                    >
                      <motion.p 
                        className="text-3xl font-bold text-gray-900 dark:text-gray-100"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                      >
                        {rewardAccount.total_points_earned}
                      </motion.p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Earned</p>
                    </motion.div>
                    <motion.div 
                      className="text-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:scale-105 hover:shadow-md"
                      whileHover={{ y: -5 }}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <motion.div
                          animate={{ rotate: [0, 15, -15, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Star className="w-5 h-5 text-yellow-500" />
                        </motion.div>
                        <motion.p 
                          className="text-3xl font-bold text-gray-900 dark:text-gray-100"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", delay: 0.3 }}
                        >
                          {rewardAccount.current_tier}
                        </motion.p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Current Tier</p>
                    </motion.div>
                    <motion.div 
                      className="text-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:scale-105 hover:shadow-md"
                      whileHover={{ y: -5 }}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.4 }}
                      >
                        <Badge 
                          variant="secondary" 
                          className="text-lg px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 dark:from-purple-500/30 dark:to-pink-500/30 border-purple-300 dark:border-purple-500 hover:shadow-lg transition-all duration-300"
                        >
                          <Award className="w-4 h-4 mr-1" />
                          {rewardAccount.tier_name || 'Member'}
                        </Badge>
                      </motion.div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Status</p>
                    </motion.div>
                  </div>

                  {/* Tier Progress */}
                  <div className="mt-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress to {tierProgress.nextTier}</span>
                      <span>{tierProgress.needed} points needed</span>
                    </div>
                    <Progress value={tierProgress.progress} className="h-3" />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Redeem Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wallet className="w-5 h-5" />
                    <span>Redeem Points for Vouchers</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {availableVouchers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Loading available vouchers...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {availableVouchers.map((voucher, index) => (
                        <Card 
                          key={index}
                          className={`border-2 border-dashed transition-colors ${
                            voucher.user_can_afford 
                              ? 'border-primary/30 hover:border-primary/60' 
                              : 'border-gray-200 opacity-60'
                          }`}
                        >
                          <CardContent className="p-6 text-center">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                              <DollarSign className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-2">Rs. {voucher.denomination} Voucher</h3>
                            <p className="text-sm text-gray-600 mb-4">
                              {voucher.points_required} Points Required
                            </p>
                            {voucher.savings_percentage > 0 && (
                              <p className="text-xs text-green-600 mb-2">
                                {voucher.savings_percentage.toFixed(1)}% Bonus Value!
                              </p>
                            )}
                            <Button
                              onClick={() => handleRedeemVoucher(parseFloat(voucher.denomination))}
                              disabled={redeeming || !voucher.user_can_afford}
                              className="w-full"
                              size="sm"
                              variant={voucher.user_can_afford ? "default" : "outline"}
                            >
                              {redeeming ? 'Redeeming...' : voucher.user_can_afford ? 'Redeem' : 'Insufficient Points'}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
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
                      <p><strong>Fixed Value:</strong> Each voucher has a set amount (Rs. 100, 200, 500, etc.)</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <p><strong>Flexible Usage:</strong> Use vouchers on any booking - excess value is forfeited</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <p><strong>One Per Booking:</strong> Use one voucher per service booking</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <p><strong>Expiry:</strong> Valid for 1 month from redemption date</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 text-primary">Example Usage</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-green-700">✅ All Usage is Valid:</p>
                      <p>Rs. 200 voucher + Rs. 250 booking = Pay Rs. 50</p>
                      <p>Rs. 200 voucher + Rs. 100 booking = Pay Rs. 0 (Rs. 100 forfeited)</p>
                      <p>Rs. 500 voucher + Rs. 300 booking = Pay Rs. 0 (Rs. 200 forfeited)</p>
                    </div>
                    <div>
                      <p className="font-medium text-blue-700">💡 Smart Tips:</p>
                      <p>• Use higher value vouchers on expensive services</p>
                      <p>• Redeem smaller denominations for more flexibility</p>
                      <p className="text-xs text-gray-600 mt-1">You control how to use your vouchers - no restrictions!</p>
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
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Complete Bookings</h4>
                    <p className="text-sm text-gray-600">Earn 10 points for every Rs. 100 spent</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Write Reviews</h4>
                    <p className="text-sm text-gray-600">Get 25 points for each service review</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Refer Friends</h4>
                    <p className="text-sm text-gray-600">Earn 100 points for each successful referral</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Special Promotions</h4>
                    <p className="text-sm text-gray-600">Participate in events for bonus points</p>
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
