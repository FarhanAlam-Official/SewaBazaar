/**
 * VoucherManagementPage Component
 * 
 * Main page for voucher management
 * Features:
 * - Voucher list with filtering and sorting
 * - QR code viewing
 * - Voucher sharing
 * - Points redemption for new vouchers
 * - Responsive design
 */

'use client'

import { useState, useEffect, useCallback } from "react"
import Cookies from 'js-cookie'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VoucherList } from "@/components/vouchers/VoucherList"
import { VoucherQRModal } from "@/components/vouchers/VoucherQRModal"
import { VoucherData } from "@/components/vouchers/VoucherCard"
import { showToast } from "@/components/ui/enhanced-toast"
import { useAuth } from "@/contexts/AuthContext"
import { 
  Gift, 
  Plus, 
  Sparkles, 
  TrendingUp,
  Star,
  Award,
  RefreshCw
} from "lucide-react"
import { motion } from "framer-motion"

// API service for voucher operations
class VoucherService {
  private static baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  static async getUserVouchers(): Promise<VoucherData[]> {
    const token = Cookies.get('access_token')
    const response = await fetch(`${this.baseUrl}/api/rewards/vouchers/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch vouchers')
    }
    
    return response.json()
  }

  static async redeemVoucher(pointsAmount: number): Promise<VoucherData> {
    const token = Cookies.get('access_token')
    const response = await fetch(`${this.baseUrl}/api/rewards/vouchers/redeem/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ points_amount: pointsAmount })
    })
    
    if (!response.ok) {
      throw new Error('Failed to redeem voucher')
    }
    
    return response.json()
  }

  static async getRewardAccount() {
    const token = Cookies.get('access_token')
    const response = await fetch(`${this.baseUrl}/api/rewards/account/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch reward account')
    }
    
    return response.json()
  }
}

export default function VoucherManagementPage() {
  const { user } = useAuth()
  const [vouchers, setVouchers] = useState<VoucherData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherData | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [rewardAccount, setRewardAccount] = useState<any>(null)
  const [redeeming, setRedeeming] = useState(false)

  // Load vouchers and reward account
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [vouchersData, accountData] = await Promise.all([
        VoucherService.getUserVouchers(),
        VoucherService.getRewardAccount()
      ])
      
      setVouchers(vouchersData)
      setRewardAccount(accountData)
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, loadData])

  // Handle voucher usage (redirect to checkout)
  const handleUseVoucher = useCallback((voucherId: string) => {
    // In a real app, this would redirect to checkout with the voucher pre-applied
    showToast.info({ title: 'Redirecting to checkout...', description: 'Apply this voucher during payment' })
  }, [])

  // Handle voucher sharing
  const handleShareVoucher = useCallback((voucher: VoucherData) => {
    if (navigator.share) {
      navigator.share({
        title: 'SewaBazaar Voucher',
        text: `I'm sharing a SewaBazaar voucher worth Rs. ${voucher.value}! Code: ${voucher.voucher_code}`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(voucher.voucher_code)
      showToast.success({ title: 'Voucher code copied to clipboard!' })
    }
  }, [])

  // Handle QR code viewing
  const handleViewQR = useCallback((voucher: VoucherData) => {
    setSelectedVoucher(voucher)
    setQrModalOpen(true)
  }, [])

  // Handle new voucher redemption
  const handleRedeemVoucher = useCallback(async (pointsAmount: number) => {
    try {
      setRedeeming(true)
      const newVoucher = await VoucherService.redeemVoucher(pointsAmount)
      
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

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gift className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign In Required</h3>
            <p className="text-gray-600 text-center">
              Please sign in to view and manage your vouchers.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center space-x-3">
          <Gift className="w-10 h-10 text-primary" />
          <span>My Vouchers</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Redeem your points for discount vouchers and use them on your next service booking
        </p>
      </motion.div>

      {/* Reward Account Summary */}
      {rewardAccount && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>Reward Account</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadData}
                  className="ml-auto"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{rewardAccount.points_balance}</p>
                  <p className="text-sm text-gray-600">Available Points</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{rewardAccount.total_points_earned}</p>
                  <p className="text-sm text-gray-600">Total Earned</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <p className="text-3xl font-bold text-gray-900">{rewardAccount.current_tier}</p>
                  </div>
                  <p className="text-sm text-gray-600">Current Tier</p>
                </div>
                <div className="text-center">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    <Award className="w-4 h-4 mr-1" />
                    {rewardAccount.tier_name || 'Member'}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Status</p>
                </div>
              </div>

              {/* Quick Redeem Actions */}
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Button
                  onClick={() => handleRedeemVoucher(100)}
                  disabled={redeeming || rewardAccount.points_balance < 100}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Rs. 50 Voucher (100 pts)</span>
                </Button>
                <Button
                  onClick={() => handleRedeemVoucher(200)}
                  disabled={redeeming || rewardAccount.points_balance < 200}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Rs. 100 Voucher (200 pts)</span>
                </Button>
                <Button
                  onClick={() => handleRedeemVoucher(500)}
                  disabled={redeeming || rewardAccount.points_balance < 500}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Rs. 250 Voucher (500 pts)</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Vouchers List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <VoucherList
          vouchers={vouchers}
          loading={loading}
          error={error || undefined}
          onUseVoucher={handleUseVoucher}
          onShareVoucher={handleShareVoucher}
          onViewQR={handleViewQR}
        />
      </motion.div>

      {/* QR Code Modal */}
      <VoucherQRModal
        voucher={selectedVoucher}
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
      />
    </div>
  )
}
