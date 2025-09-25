/**
 * MobileVoucherRedemption Component
 * 
 * Mobile-optimized voucher redemption interface
 * Features:
 * - QR code scanning with camera
 * - Manual voucher code entry
 * - Touch-friendly interface
 * - Offline capability
 * - Quick redemption flow
 * - Gesture support
 * - Bottom sheet UI patterns
 * - Native mobile feel
 * 
 * @component
 * @example
 * <MobileVoucherRedemption 
 *   onRedeem={handleVoucherRedeem}
 *   currentCart={cartData}
 *   isOpen={showRedemptionModal}
 * />
 */

import { useState, useEffect } from "react"
import { VoucherData } from "./VoucherCard"
import { VoucherQRScanner } from "./VoucherQRScanner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
// Removed Quick Redeem: Input and Label no longer needed
import { Progress } from "@/components/ui/progress"
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { 
  Smartphone, 
  QrCode, 
  Camera,
  Wallet,
  CheckCircle,
  Gift,
  ArrowRight,
  Star,
  Clock,
  AlertCircle,
  // Removed Quick Redeem icon
  CreditCard,
  Percent,
  X
} from "lucide-react"

interface MobileVoucherRedemptionProps {
  vouchers: VoucherData[]
  currentCart?: {
    total: number
    items: any[]
    serviceCategory?: string
  }
  onApplyVoucher: (voucherId: string) => void
  onRemoveVoucher: (voucherId: string) => void
  appliedVouchers?: string[]
  className?: string
}

interface RedemptionStep {
  id: string
  title: string
  description: string
  completed: boolean
  current: boolean
}

export function MobileVoucherRedemption({
  vouchers,
  currentCart,
  onApplyVoucher,
  onRemoveVoucher,
  appliedVouchers = [],
  className
}: MobileVoucherRedemptionProps) {
  const [showScanner, setShowScanner] = useState(false)
  const [showVoucherSheet, setShowVoucherSheet] = useState(false)
  // Removed Quick Redeem input state
  const [redemptionProgress, setRedemptionProgress] = useState(0)
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const activeVouchers = vouchers.filter(v => v.status === 'active')
  const applicableVouchers = activeVouchers.filter(v => 
    currentCart ? v.value <= currentCart.total : true
  )
  
  const totalSavings = appliedVouchers.reduce((sum, voucherId) => {
    const voucher = vouchers.find(v => v.id === voucherId)
    return sum + (voucher?.value || 0)
  }, 0)

  const redemptionSteps: RedemptionStep[] = [
    {
      id: 'select',
      title: 'Select',
      description: 'Choose voucher',
      completed: appliedVouchers.length > 0,
      current: appliedVouchers.length === 0
    },
    {
      id: 'apply',
      title: 'Apply',
      description: 'Voucher applied',
      completed: appliedVouchers.length > 0 && currentCart !== undefined,
      current: appliedVouchers.length > 0 && !currentCart
    },
    {
      id: 'checkout',
      title: 'Checkout',
      description: 'Complete purchase',
      completed: false,
      current: appliedVouchers.length > 0 && currentCart !== undefined
    }
  ]

  useEffect(() => {
    const totalSteps = 3
    const completedSteps = (appliedVouchers.length > 0 ? 1 : 0) + (appliedVouchers.length > 0 && currentCart !== undefined ? 1 : 0)
    setRedemptionProgress((completedSteps / totalSteps) * 100)
  }, [appliedVouchers, currentCart])

  const handleVoucherScanned = (voucherCode: string) => {
    // Find voucher by code and apply it
    const voucher = vouchers.find(v => v.voucher_code === voucherCode)
    if (voucher) {
      handleApplyVoucher(voucher.id)
    }
  }

  const handleApplyVoucher = async (voucherId: string) => {
    setIsProcessing(true)
    setSelectedVoucherId(voucherId)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      onApplyVoucher(voucherId)
    } catch (err) {
      console.error('Failed to apply voucher:', err)
    } finally {
      setIsProcessing(false)
      setSelectedVoucherId(null)
      setShowVoucherSheet(false)
    }
  }

  // Removed Quick Redeem handler

  const getBestVoucherRecommendation = () => {
    if (!currentCart || applicableVouchers.length === 0) return null
    
    return applicableVouchers
      .filter(v => !appliedVouchers.includes(v.id))
      .sort((a, b) => b.value - a.value)[0]
  }

  const bestVoucher = getBestVoucherRecommendation()

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Progress Indicator */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Redemption Progress</h3>
            <Badge variant="secondary" className="text-xs">{Math.round(redemptionProgress)}%</Badge>
          </div>
          <Progress value={redemptionProgress} className="mb-2 h-1.5" />
          <div className="grid grid-cols-3 gap-1 text-xs">
            {redemptionSteps.map((step) => (
              <div
                key={step.id}
                className={`text-center p-1 rounded ${
                  step.completed 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                    : step.current
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                <div className="font-medium truncate">{step.title}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={() => setShowScanner(true)}
          className="relative overflow-hidden group h-14 flex-col space-y-1 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-primary/30 dark:hover:border-primary/40 hover:shadow-md text-gray-900 dark:text-gray-100 hover:text-gray-900 dark:hover:text-gray-100 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/40 dark:focus-visible:ring-primary/50 focus-visible:outline-none"
        >
          <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-tr from-primary/10 to-transparent" />
          <QrCode className="w-5 h-5 text-current" />
          <span className="text-xs">Scan QR</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowVoucherSheet(true)}
          className="relative overflow-hidden group h-14 flex-col space-y-1 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-primary/30 dark:hover:border-primary/40 hover:shadow-md text-gray-900 dark:text-gray-100 hover:text-gray-900 dark:hover:text-gray-100 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/40 dark:focus-visible:ring-primary/50 focus-visible:outline-none"
        >
          <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-tr from-primary/10 to-transparent" />
          <Wallet className="w-5 h-5 text-current" />
          <span className="text-xs">My Vouchers</span>
          {activeVouchers.length > 0 && (
            <Badge variant="secondary" className="text-xs h-4">
              {activeVouchers.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Quick Redeem removed */}

      {/* Best Voucher Recommendation */}
      {bestVoucher && currentCart && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800/50 dark:bg-green-900/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-green-800 dark:text-green-200 text-sm">
                    Best Match: ₹{bestVoucher.value} Off
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    Code: {bestVoucher.voucher_code}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleApplyVoucher(bestVoucher.id)}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 h-9 text-xs px-3 transition-all duration-300 hover:scale-105"
              >
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applied Vouchers */}
      {appliedVouchers.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800/50 dark:bg-blue-900/20">
          <CardHeader className="pb-2 p-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-gray-900 dark:text-gray-100">Applied Vouchers</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3">
            {appliedVouchers.map((voucherId) => {
              const voucher = vouchers.find(v => v.id === voucherId)
              if (!voucher) return null
              
              return (
                <div key={voucherId} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{voucher.voucher_code}</div>
                    <div className="text-xs text-green-600 dark:text-green-400">-₹{voucher.value}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemoveVoucher(voucherId)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 dark:border-gray-600 h-8 px-3 transition-all duration-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    Remove
                  </Button>
                </div>
              )
            })}
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <div className="flex items-center justify-between font-semibold text-sm">
                <span className="text-gray-900 dark:text-gray-100">Total Savings:</span>
                <span className="text-green-600 dark:text-green-400">₹{totalSavings}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cart Summary */}
      {currentCart && (
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">Subtotal:</span>
                <span className="text-gray-900 dark:text-gray-100">₹{currentCart.total}</span>
              </div>
              {totalSavings > 0 && (
                <div className="flex items-center justify-between text-green-600 dark:text-green-400 text-sm">
                  <span>Voucher Discount:</span>
                  <span>-₹{totalSavings}</span>
                </div>
              )}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex items-center justify-between font-semibold text-sm">
                <span className="text-gray-900 dark:text-gray-100">Total:</span>
                <span className="text-gray-900 dark:text-gray-100">₹{currentCart.total - totalSavings}</span>
              </div>
              
              {totalSavings > 0 && (
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 p-2 mt-2">
                  <Percent className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200 text-xs">
                    You're saving ₹{totalSavings} ({Math.round((totalSavings / currentCart.total) * 100)}%)!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voucher Scanner Modal */}
      <VoucherQRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onVoucherScanned={handleVoucherScanned}
      />

      {/* Vouchers Dialog */}
      <Dialog open={showVoucherSheet} onOpenChange={setShowVoucherSheet}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden p-0 gap-0 bg-white dark:bg-gray-900">
          <DialogHeader className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2 text-lg text-gray-900 dark:text-gray-100">
              <Wallet className="w-5 h-5" />
              <span>My Vouchers</span>
              <Badge variant="secondary" className="dark:bg-gray-700">{activeVouchers.length}</Badge>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVoucherSheet(false)}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </Button>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-4">
            {activeVouchers.length === 0 ? (
              <div className="text-center py-8">
                <Gift className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Active Vouchers</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Earn points or purchase services to get vouchers
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeVouchers.map((voucher) => {
                  const isApplied = appliedVouchers.includes(voucher.id)
                  const isApplicable = currentCart ? voucher.value <= currentCart.total : true
                  const daysUntilExpiry = Math.ceil((new Date(voucher.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  
                  return (
                    <Card 
                      key={voucher.id} 
                      className={`${
                        isApplied 
                          ? 'border-blue-200 bg-blue-50 dark:border-blue-800/50 dark:bg-blue-900/20' 
                          : !isApplicable
                          ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 opacity-60'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600 dark:bg-gray-800'
                      } transition-all duration-300 hover:shadow-md`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{voucher.voucher_code}</div>
                            <div className="text-sm text-muted-foreground dark:text-gray-400">
                              Value: ₹{voucher.value}
                            </div>
                            <div className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                              Expires: {new Date(voucher.expires_at).toLocaleDateString()}
                            </div>
                            {daysUntilExpiry < 7 && (
                              <Badge variant="destructive" className="mt-2">
                                <Clock className="w-3 h-3 mr-1" />
                                Expires in {daysUntilExpiry} days
                              </Badge>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleApplyVoucher(voucher.id)}
                            disabled={isApplied || !isApplicable || isProcessing}
                            className={`h-9 px-4 text-sm transition-all duration-300 hover:scale-105 ${
                              isApplied 
                                ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-200" 
                                : "bg-primary hover:bg-primary/90"
                            }`}
                          >
                            {isApplied ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Applied
                              </>
                            ) : !isApplicable ? (
                              "Not Applicable"
                            ) : (
                              "Apply"
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}