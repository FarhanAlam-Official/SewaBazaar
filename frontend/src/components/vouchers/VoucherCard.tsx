"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Calendar, 
  Clock, 
  Copy, 
  QrCode, 
  Gift, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Share2,
  Eye,
  Wallet,
  Sparkles,
  Star
} from "lucide-react"
import { memo, useState, useCallback } from "react"
// Removed framer-motion imports for performance
import { showToast } from "@/components/ui/enhanced-toast"
import { cn } from "@/lib/utils"

export interface VoucherData {
  id: string
  voucher_code: string
  value: number
  status: 'active' | 'used' | 'expired' | 'cancelled'
  created_at: string
  expires_at: string
  used_at?: string
  used_amount?: number
  points_redeemed: number
  qr_code_data?: string
  usage_policy: 'fixed'
  source?: 'purchase' | 'reward' | 'gift' | 'promotion'
  metadata?: Record<string, any>
}

interface VoucherCardProps {
  voucher: VoucherData
  showActions?: boolean
  onUse?: (voucherId: string) => void
  onShare?: (voucher: VoucherData) => void
  onViewQR?: (voucher: VoucherData) => void
  className?: string
}

export const VoucherCard = memo(({
  voucher,
  showActions = true,
  onUse,
  onShare,
  onViewQR,
  className
}: VoucherCardProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isCopying, setIsCopying] = useState(false)

  // Calculate usage percentage for used vouchers
  const usagePercentage = voucher.used_amount && voucher.value > 0 ? (voucher.used_amount / voucher.value) * 100 : 0
  
  // For simplified fixed-value system, remaining value is either full value or 0
  const remainingValue = voucher.status === 'used' ? 0 : voucher.value

  // Calculate days until expiry
  const expiryDate = new Date(voucher.expires_at)
  const today = new Date()
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  // Status configurations with improved dark mode support
  const statusConfig = {
    active: {
      color: 'bg-green-500 dark:bg-green-600',
      textColor: 'text-green-700 dark:text-green-300',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      icon: CheckCircle,
      label: 'Active'
    },
    used: {
      color: 'bg-gray-500 dark:bg-gray-600',
      textColor: 'text-gray-700 dark:text-gray-300',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      borderColor: 'border-gray-200 dark:border-gray-800',
      icon: Wallet,
      label: 'Used'
    },
    expired: {
      color: 'bg-red-500 dark:bg-red-600',
      textColor: 'text-red-700 dark:text-red-300',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      icon: XCircle,
      label: 'Expired'
    },
    cancelled: {
      color: 'bg-orange-500 dark:bg-orange-600',
      textColor: 'text-orange-700 dark:text-orange-300',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      icon: AlertTriangle,
      label: 'Cancelled'
    }
  }

  const config = statusConfig[voucher.status]
  const StatusIcon = config.icon

  // Copy voucher code to clipboard
  const handleCopyCode = useCallback(async () => {
    if (isCopying) return
    
    setIsCopying(true)
    try {
      await navigator.clipboard.writeText(voucher.voucher_code)
      showToast.success({ title: 'Voucher code copied!' })
    } catch (error) {
      showToast.error({ title: 'Failed to copy voucher code' })
    } finally {
      setTimeout(() => setIsCopying(false), 1000)
    }
  }, [voucher.voucher_code, isCopying])

  // Handle voucher usage
  const handleUse = useCallback(() => {
    if (onUse && voucher.status === 'active') {
      onUse(voucher.id)
    }
  }, [onUse, voucher.id, voucher.status])

  // Handle sharing
  const handleShare = useCallback(() => {
    if (onShare) {
      onShare(voucher)
    }
  }, [onShare, voucher])

  // Handle QR view
  const handleViewQR = useCallback(() => {
    if (onViewQR) {
      onViewQR(voucher)
    }
  }, [onViewQR, voucher])

  // Get expiry status and color
  const getExpiryStatus = () => {
    if (voucher.status === 'expired') {
      return { text: 'Expired', color: 'text-red-600 dark:text-red-400' }
    }
    if (daysUntilExpiry <= 0) {
      return { text: 'Expired', color: 'text-red-600 dark:text-red-400' }
    }
    if (daysUntilExpiry <= 7) {
      return { text: `${daysUntilExpiry} days left`, color: 'text-red-600 dark:text-red-400' }
    }
    if (daysUntilExpiry <= 30) {
      return { text: `${daysUntilExpiry} days left`, color: 'text-orange-600 dark:text-orange-400' }
    }
    return { text: `${daysUntilExpiry} days left`, color: 'text-green-600 dark:text-green-400' }
  }

  const expiryStatus = getExpiryStatus()

  // Enhanced default variant with pyramid button layout and improved design
  return (
    // Removed heavy motion animations for better performance
    <div className={cn("w-full h-full", className)}>
      <Card className={cn(
        "border transition-all duration-300 overflow-hidden h-full flex flex-col relative group",
        config.borderColor,
        "hover:shadow-lg hover:border-primary/40 dark:hover:border-primary/60 bg-white dark:bg-card"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      >
        {/* Simplified background effect without heavy animations */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Header with enhanced gradient background and improved spacing */}
        <CardHeader className={cn(
          "pb-4 pt-5 px-5 relative overflow-hidden",
          config.bgColor
        )}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-blue-500/5 to-purple-500/5 dark:from-primary/10 dark:via-blue-500/10 dark:to-purple-500/10" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start space-x-3 min-w-0">
              {/* Simplified hover effect */}
              <div className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center relative shadow-md flex-shrink-0 transition-transform duration-200",
                config.color,
                isHovered ? "scale-105" : ""
              )}>
                <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                {voucher.source === 'reward' && (
                  <Sparkles className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 text-yellow-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100 mb-1 truncate">
                  {voucher.voucher_code}
                </h3>
                <div className="flex items-center space-x-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCopyCode}
                    disabled={isCopying}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <Copy className={cn(
                      "w-4 h-4 transition-colors",
                      isCopying ? "text-green-600" : "text-gray-600 dark:text-gray-400"
                    )} />
                  </Button>
                  <Badge 
                    variant="secondary" 
                    className="px-2.5 py-1 text-sm font-bold bg-white dark:bg-primary border border-gray-200 dark:border-primary text-primary dark:text-white transition-all duration-300 hover:shadow-md hover:bg-primary/10 dark:hover:bg-primary/80 hover:border-primary/30 dark:hover:border-primary/50 hover:text-primary dark:hover:text-white"
                  >
                    Rs. {voucher.value}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col items-end sm:items-end justify-between sm:justify-end gap-2 sm:gap-1 flex-shrink-0">
              <Badge 
                variant={
                  voucher.status === 'active' ? 'success' :
                  voucher.status === 'used' ? 'secondary' :
                  voucher.status === 'expired' ? 'destructive' :
                  'warning'
                }
                className="px-2.5 py-1 text-xs font-bold transition-all duration-300 hover:scale-105 hover:shadow-md"
              >
                <StatusIcon className="w-3 h-3 mr-1 inline" />
                {config.label}
              </Badge>
              <p className={cn("text-xs sm:text-sm font-medium whitespace-nowrap", expiryStatus.color)}>
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                {expiryStatus.text}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5 pb-6 px-5 flex-1 flex flex-col">
          {/* Value Information - improved spacing and typography */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="text-center p-4 bg-gray-50 dark:bg-card/50 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200 hover:shadow-md">
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">Rs. {voucher.value}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">Value</p>
            </div>
            <div className="text-center p-4 bg-primary/5 dark:bg-card/50 rounded-xl border border-primary/20 dark:border-gray-700 shadow-sm transition-all duration-200 hover:shadow-md">
              <p className="text-xl font-bold text-primary">Rs. {remainingValue}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">
                {voucher.status === 'used' ? 'Used' : 'Available'}
              </p>
            </div>
          </div>

          {/* Usage Status - improved text hierarchy and visual design */}
          <div className="mb-6 min-h-[60px] flex flex-col justify-center bg-gray-50/50 dark:bg-card/30 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-sm">
            {voucher.status === 'used' ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p className="font-bold text-gray-700 dark:text-gray-300 flex items-center justify-center">
                  <Wallet className="w-4 h-4 mr-2 text-green-600" />
                  Voucher Used
                </p>
                <p className="text-xs mt-1">
                  Used on {voucher.used_at ? new Date(voucher.used_at).toLocaleDateString() : 'Unknown date'}
                </p>
              </div>
            ) : voucher.status === 'active' ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p className="font-bold text-green-700 dark:text-green-400 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Ready to use
                </p>
                <p className="text-xs mt-1">Full value available</p>
              </div>
            ) : voucher.status === 'expired' ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p className="font-bold text-red-700 dark:text-red-400 flex items-center justify-center">
                  <XCircle className="w-4 h-4 mr-2" />
                  Voucher Expired
                </p>
                <p className="text-xs mt-1">Cannot be used</p>
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p className="font-bold text-orange-700 dark:text-orange-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Voucher {voucher.status}
                </p>
                <p className="text-xs mt-1">Cannot be used</p>
              </div>
            )}
          </div>

          {/* Actions - Pyramid layout: one button on top, two buttons below */}
          {showActions && (
            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
              {voucher.status === 'active' && (
                // Simplified hover effect
                <div className={cn(
                  "mb-4 transition-all duration-200",
                  isHovered ? "scale-[1.02]" : ""
                )}>
                  <Button
                    onClick={handleUse}
                    className="w-full py-3 text-base font-bold shadow-md hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
                  >
                    <Wallet className="w-5 h-5 mr-2" />
                    Use Voucher
                  </Button>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                {/* Simplified hover effects */}
                <div className={cn(
                  "transition-all duration-200",
                  isHovered ? "scale-[1.02]" : ""
                )}>
                  <Button
                    variant="outline"
                    onClick={handleViewQR}
                    className="w-full py-3 text-base font-bold border-2 transition-all duration-300 hover:shadow-md active:scale-[0.98]"
                  >
                    <QrCode className="w-5 h-5 mr-2" />
                    View QR
                  </Button>
                </div>
                
                <div className={cn(
                  "transition-all duration-200",
                  isHovered ? "scale-[1.02]" : ""
                )}>
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="w-full py-3 text-base font-bold border-2 transition-all duration-300 hover:shadow-md active:scale-[0.98]"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
})

VoucherCard.displayName = 'VoucherCard'