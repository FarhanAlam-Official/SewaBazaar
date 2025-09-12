/**
 * VoucherRecommendations Component
 * 
 * Provides intelligent voucher recommendations and optimization suggestions
 * Features:
 * - Smart recommendations based on expiry dates
 * - Usage pattern analysis
 * - Optimization tips for maximum savings
 * - Priority alerts for expiring vouchers
 * - Value-based recommendations
 * - Personalized suggestions based on user activity
 * 
 * @component
 * @example
 * <VoucherRecommendations 
 *   vouchers={userVouchers}
 *   rewardAccount={accountData}
 *   onAction={handleRecommendationAction}
 * />
 */

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { VoucherData } from "./VoucherCard"
import { 
  Lightbulb, 
  TrendingUp, 
  Clock, 
  Target, 
  Zap, 
  Star,
  Gift,
  AlertCircle,
  CheckCircle
} from "lucide-react"

interface VoucherRecommendationsProps {
  vouchers: VoucherData[]
  rewardAccount: any
  currentCart?: {
    total: number
    items: any[]
  }
  onUseVoucher: (voucherId: string) => void
  onRedeemPoints: (pointsAmount: number) => void
}

interface Recommendation {
  id: string
  type: 'use' | 'redeem' | 'combine' | 'save' | 'alert'
  title: string
  description: string
  action?: string
  priority: 'high' | 'medium' | 'low'
  savings?: number
  voucherIds?: string[]
  pointsRequired?: number
  icon: React.ReactNode
}

export function VoucherRecommendations({
  vouchers,
  rewardAccount,
  currentCart,
  onUseVoucher,
  onRedeemPoints
}: VoucherRecommendationsProps) {
  const recommendations = useMemo(() => {
    const recs: Recommendation[] = []
    const activeVouchers = vouchers.filter(v => v.status === 'active')
    const currentTime = new Date()

    // 1. Expiring Soon Alert
    const expiringSoon = activeVouchers.filter(v => {
      const expiryDate = new Date(v.expires_at)
      const daysUntilExpiry = (expiryDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24)
      return daysUntilExpiry <= 7 && daysUntilExpiry > 0
    })

    if (expiringSoon.length > 0) {
      recs.push({
        id: 'expiring-soon',
        type: 'alert',
        title: `${expiringSoon.length} voucher${expiringSoon.length > 1 ? 's' : ''} expiring soon!`,
        description: `Use your vouchers before they expire. Total value: ₹${expiringSoon.reduce((sum, v) => sum + v.value, 0)}`,
        priority: 'high',
        savings: expiringSoon.reduce((sum, v) => sum + v.value, 0),
        voucherIds: expiringSoon.map(v => v.id),
        icon: <AlertCircle className="w-5 h-5 text-orange-500" />
      })
    }

    // 2. Best Voucher for Current Cart
    if (currentCart && currentCart.total > 0) {
      const bestVoucher = activeVouchers
        .filter(v => v.value <= currentCart.total)
        .sort((a, b) => b.value - a.value)[0]

      if (bestVoucher) {
        recs.push({
          id: 'best-for-cart',
          type: 'use',
          title: `Save ₹${bestVoucher.value} on your current order!`,
          description: `Use voucher ${bestVoucher.voucher_code} to get maximum savings`,
          action: 'Apply Voucher',
          priority: 'high',
          savings: bestVoucher.value,
          voucherIds: [bestVoucher.id],
          icon: <Target className="w-5 h-5 text-green-500" />
        })
      }
    }

    // 3. Optimal Voucher Combination
    if (currentCart && activeVouchers.length > 1) {
      const combinations = findOptimalCombination(activeVouchers, currentCart.total)
      if (combinations.vouchers.length > 1 && combinations.totalSavings > 0) {
        recs.push({
          id: 'optimal-combination',
          type: 'combine',
          title: `Combine vouchers for ₹${combinations.totalSavings} savings!`,
          description: `Use ${combinations.vouchers.length} vouchers together for maximum benefit`,
          action: 'Apply Combination',
          priority: 'medium',
          savings: combinations.totalSavings,
          voucherIds: combinations.vouchers.map(v => v.id),
          icon: <Zap className="w-5 h-5 text-blue-500" />
        })
      }
    }

    // 4. Points Redemption Suggestion
    if (rewardAccount && rewardAccount.points_balance >= 100) {
      const canRedeemFor = Math.floor(rewardAccount.points_balance / 200) * 100 // 200 points = ₹100
      if (canRedeemFor > 0) {
        recs.push({
          id: 'redeem-points',
          type: 'redeem',
          title: `Redeem ${Math.floor(rewardAccount.points_balance / 200) * 200} points for ₹${canRedeemFor}!`,
          description: `Convert your points to vouchers and start saving`,
          action: 'Redeem Points',
          priority: 'medium',
          savings: canRedeemFor,
          pointsRequired: Math.floor(rewardAccount.points_balance / 200) * 200,
          icon: <Star className="w-5 h-5 text-purple-500" />
        })
      }
    }

    // 5. Tier Progress Motivation
    if (rewardAccount) {
      const tierThresholds = { Bronze: 0, Silver: 1000, Gold: 2500, Platinum: 5000, Diamond: 10000 }
      const currentTier = rewardAccount.current_tier || 'Bronze'
      const tiers = Object.keys(tierThresholds)
      const currentIndex = tiers.indexOf(currentTier)
      
      if (currentIndex < tiers.length - 1) {
        const nextTier = tiers[currentIndex + 1]
        const pointsNeeded = tierThresholds[nextTier as keyof typeof tierThresholds] - (rewardAccount.total_points_earned || 0)
        
        if (pointsNeeded > 0) {
          recs.push({
            id: 'tier-progress',
            type: 'save',
            title: `${pointsNeeded} points to ${nextTier} tier!`,
            description: `Unlock better rewards and exclusive vouchers`,
            priority: 'low',
            icon: <TrendingUp className="w-5 h-5 text-indigo-500" />
          })
        }
      }
    }

    // 6. Unused High-Value Vouchers
    const highValueVouchers = activeVouchers.filter(v => v.value >= 200)
    if (highValueVouchers.length > 0) {
      recs.push({
        id: 'high-value-unused',
        type: 'use',
        title: `You have ${highValueVouchers.length} high-value vouchers!`,
        description: `Don't let your valuable vouchers go unused. Total value: ₹${highValueVouchers.reduce((sum, v) => sum + v.value, 0)}`,
        action: 'View Vouchers',
        priority: 'medium',
        savings: highValueVouchers.reduce((sum, v) => sum + v.value, 0),
        voucherIds: highValueVouchers.map(v => v.id),
        icon: <Gift className="w-5 h-5 text-pink-500" />
      })
    }

    // Sort by priority
    return recs.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }, [vouchers, rewardAccount, currentCart])

  const findOptimalCombination = (vouchers: VoucherData[], cartTotal: number) => {
    // Simple greedy algorithm to find best combination
    const sortedVouchers = [...vouchers].sort((a, b) => b.value - a.value)
    const selected: VoucherData[] = []
    let totalSavings = 0

    for (const voucher of sortedVouchers) {
      if (totalSavings + voucher.value <= cartTotal) {
        selected.push(voucher)
        totalSavings += voucher.value
      }
    }

    return { vouchers: selected, totalSavings }
  }

  const handleRecommendationAction = (rec: Recommendation) => {
    switch (rec.type) {
      case 'use':
        if (rec.voucherIds && rec.voucherIds.length === 1) {
          onUseVoucher(rec.voucherIds[0])
        }
        break
      case 'redeem':
        if (rec.pointsRequired) {
          onRedeemPoints(rec.pointsRequired)
        }
        break
      case 'combine':
        // Handle multiple voucher application
        if (rec.voucherIds) {
          rec.voucherIds.forEach(id => onUseVoucher(id))
        }
        break
      default:
        break
    }
  }

  if (recommendations.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Optimized!</h3>
            <p className="text-gray-600">
              You're making the most of your vouchers. Keep earning points for more rewards!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <span>Smart Recommendations</span>
          <Badge variant="secondary">{recommendations.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className={`p-4 rounded-lg border ${
              rec.priority === 'high' 
                ? 'border-red-200 bg-red-50' 
                : rec.priority === 'medium'
                ? 'border-yellow-200 bg-yellow-50'
                : 'border-blue-200 bg-blue-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0 mt-1">
                  {rec.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{rec.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                  
                  {rec.savings && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Save ₹{rec.savings}
                      </Badge>
                      {rec.type === 'redeem' && rec.pointsRequired && (
                        <Badge variant="outline" className="text-purple-600 border-purple-600">
                          {rec.pointsRequired} points
                        </Badge>
                      )}
                    </div>
                  )}

                  {rec.type === 'save' && rewardAccount && (
                    <div className="mt-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress to next tier</span>
                        <span>{rewardAccount.total_points_earned || 0} points</span>
                      </div>
                      <Progress 
                        value={((rewardAccount.total_points_earned || 0) / 1000) * 100} 
                        className="h-2" 
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {rec.action && (
                <Button
                  size="sm"
                  variant={rec.priority === 'high' ? 'default' : 'outline'}
                  onClick={() => handleRecommendationAction(rec)}
                  className="ml-4"
                >
                  {rec.action}
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* Quick Action Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-900 mb-2">Quick Actions</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>{vouchers.filter(v => {
                const daysUntilExpiry = (new Date(v.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                return daysUntilExpiry <= 7 && daysUntilExpiry > 0
              }).length} expiring soon</span>
            </div>
            <div className="flex items-center space-x-2">
              <Gift className="w-4 h-4 text-green-500" />
              <span>{vouchers.filter(v => v.status === 'active').length} ready to use</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-purple-500" />
              <span>{rewardAccount ? Math.floor((rewardAccount.points_balance || 0) / 200) : 0} vouchers available</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}