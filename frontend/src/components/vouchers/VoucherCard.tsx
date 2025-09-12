/**
 * VoucherCard Component
 * 
 * Displays individual voucher information with modern design
 * Features:
 * - Responsive design following SewaBazaar design system
 * - Status indicators with color coding
 * - QR code display with modal
 * - Copy voucher code functionality
 * - Simple usage status (fixed-value system)
 * - Expiry countdown
 * - Simplified fixed-value voucher display (no partial usage)
 */

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
  Wallet
} from "lucide-react"
import { memo, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  used_amount?: number  // Only used for display when status is 'used'
  points_redeemed: number
  qr_code_data?: string
  usage_policy: 'fixed'  // Always fixed for new simplified system
  source?: 'purchase' | 'reward' | 'gift' | 'promotion'  // How the voucher was obtained
  metadata?: Record<string, any>
}

interface VoucherCardProps {
  voucher: VoucherData
  variant?: 'default' | 'compact' | 'detailed'
  showActions?: boolean
  showManagementActions?: boolean
  onUse?: (voucherId: string) => void
  onShare?: (voucher: VoucherData) => void
  onViewQR?: (voucher: VoucherData) => void
  className?: string
}

export const VoucherCard = memo(({
  voucher,
  variant = 'default',
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

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn("w-full h-full", className)}
      >
        <Card className={cn(
          "border transition-all duration-200 cursor-pointer h-full relative overflow-hidden group",
          config.borderColor,
          config.bgColor,
          "hover:shadow-md hover:border-primary/30 dark:hover:border-primary/50"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 dark:via-white/2 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
          <CardContent className="p-4 h-full flex items-center relative z-10">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <motion.div 
                  className={cn("w-3 h-3 rounded-full", config.color)}
                  animate={{ scale: isHovered ? 1.2 : 1 }}
                  transition={{ duration: 0.2 }}
                />
                <div className="min-w-0">
                  <p className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[120px]">{voucher.voucher_code}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Rs. {remainingValue} {voucher.status === 'used' ? 'used' : 'available'}
                  </p>
                </div>
              </div>
              <Badge 
                variant="secondary" 
                className={cn(
                  "transition-all duration-200 px-2 py-0.5 text-xs",
                  config.textColor
                )}
              >
                {config.label}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Improved default variant with better proportions and subtle animations
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("w-full h-full", className)}
    >
      <Card className={cn(
        "border transition-all duration-200 overflow-hidden h-full flex flex-col relative group",
        config.borderColor,
        "hover:shadow-md hover:border-primary/30 dark:hover:border-primary/50 bg-white dark:bg-gray-800/80"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      >
        {/* Subtle background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 dark:via-white/2 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        
        {/* Header with gradient background */}
        <CardHeader className={cn(
          "pb-4 pt-4 px-4 relative overflow-hidden",
          config.bgColor
        )}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-blue-500/2 to-purple-500/5 dark:from-primary/10 dark:via-blue-500/5 dark:to-purple-500/10" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <motion.div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center relative",
                  config.color
                )}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <Gift className="w-5 h-5 text-white" />
              </motion.div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1 truncate">
                  {voucher.voucher_code}
                </h3>
                <div className="flex items-center space-x-2">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCopyCode}
                      disabled={isCopying}
                      className="h-6 w-6 p-0 hover:bg-white/50 dark:hover:bg-gray-700/50"
                    >
                      <Copy className={cn(
                        "w-3 h-3 transition-colors",
                        isCopying ? "text-green-600" : "text-gray-600 dark:text-gray-400"
                      )} />
                    </Button>
                  </motion.div>
                  <Badge variant="secondary" className={cn(
                    "px-2 py-0.5 text-xs",
                    config.textColor
                  )}>
                    Rs. {voucher.value}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <Badge variant="secondary" className={cn(
                "mb-1 px-2 py-0.5 text-xs",
                config.textColor
              )}>
                <StatusIcon className="w-2.5 h-2.5 mr-1" />
                {config.label}
              </Badge>
              <p className={cn("text-xs", expiryStatus.color)}>
                <Clock className="w-2.5 h-2.5 inline mr-1" />
                {expiryStatus.text}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-3 pb-4 px-4 flex-1 flex flex-col">
          {/* Value Information */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-md border border-gray-200 dark:border-gray-700">
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">Rs. {voucher.value}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Value</p>
            </div>
            <div className="text-center p-3 bg-primary/5 dark:bg-primary/10 rounded-md border border-primary/20 dark:border-primary/30">
              <p className="text-lg font-bold text-primary">Rs. {remainingValue}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {voucher.status === 'used' ? 'Used' : 'Available'}
              </p>
            </div>
          </div>

          {/* Usage Status */}
          <div className="mb-4 min-h-[50px] flex flex-col justify-center bg-gray-50/50 dark:bg-gray-800/30 rounded-md p-2 text-center">
            {voucher.status === 'used' ? (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p className="font-medium text-gray-700 dark:text-gray-300">Voucher Used</p>
                <p className="text-[10px] mt-0.5">
                  Used on {voucher.used_at ? new Date(voucher.used_at).toLocaleDateString() : 'Unknown date'}
                </p>
              </div>
            ) : voucher.status === 'active' ? (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p className="font-medium text-green-700 dark:text-green-400">Ready to use</p>
                <p className="text-[10px] mt-0.5">Full value available</p>
              </div>
            ) : voucher.status === 'expired' ? (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p className="font-medium text-red-700 dark:text-red-400">Voucher Expired</p>
                <p className="text-[10px] mt-0.5">Cannot be used</p>
              </div>
            ) : (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p className="font-medium text-orange-700 dark:text-orange-400">Voucher {voucher.status}</p>
                <p className="text-[10px] mt-0.5">Cannot be used</p>
              </div>
            )}
          </div>

          {/* Actions - Show only on hover for a cleaner look */}
          <AnimatePresence>
            {showActions && isHovered && (
              <motion.div 
                className="flex flex-wrap gap-2 mt-auto pt-2 border-t border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {voucher.status === 'active' && (
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 min-w-[80px]"
                  >
                    <Button
                      onClick={handleUse}
                      size="sm"
                      className="w-full py-1.5 text-xs"
                    >
                      <Wallet className="w-3 h-3 mr-1" />
                      Use
                    </Button>
                  </motion.div>
                )}
                
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 min-w-[80px]"
                >
                  <Button
                    variant="outline"
                    onClick={handleViewQR}
                    size="sm"
                    className="w-full py-1.5 text-xs"
                  >
                    <QrCode className="w-3 h-3 mr-1" />
                    QR
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 min-w-[80px]"
                >
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    size="sm"
                    className="w-full py-1.5 text-xs"
                  >
                    <Share2 className="w-3 h-3 mr-1" />
                    Share
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Show a simpler view when not hovered */}
          {showActions && !isHovered && (
            <div className="flex gap-1 mt-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewQR}
                className="flex-1 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                <QrCode className="w-3 h-3 mr-1" />
                QR Code
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="flex-1 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                <Share2 className="w-3 h-3 mr-1" />
                Share
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
})

VoucherCard.displayName = 'VoucherCard'