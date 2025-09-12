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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet"
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
  Zap,
  CreditCard,
  Percent
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
  const [quickCodeInput, setQuickCodeInput] = useState('')
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
      title: 'Select Voucher',
      description: 'Choose or scan a voucher to redeem',
      completed: appliedVouchers.length > 0,
      current: appliedVouchers.length === 0
    },
    {
      id: 'apply',
      title: 'Apply to Cart',
      description: 'Voucher discount applied to your order',
      completed: appliedVouchers.length > 0 && currentCart !== undefined,
      current: appliedVouchers.length > 0 && !currentCart
    },
    {
      id: 'checkout',
      title: 'Complete Purchase',
      description: 'Proceed to checkout with savings',
      completed: false,
      current: appliedVouchers.length > 0 && currentCart !== undefined
    }
  ]

  useEffect(() => {
    const completedSteps = redemptionSteps.filter(step => step.completed).length
    setRedemptionProgress((completedSteps / redemptionSteps.length) * 100)
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

  const handleQuickRedeem = () => {
    if (quickCodeInput.trim()) {
      handleVoucherScanned(quickCodeInput.trim().toUpperCase())
      setQuickCodeInput('')
    }
  }

  const getBestVoucherRecommendation = () => {
    if (!currentCart || applicableVouchers.length === 0) return null
    
    return applicableVouchers
      .filter(v => !appliedVouchers.includes(v.id))
      .sort((a, b) => b.value - a.value)[0]
  }

  const bestVoucher = getBestVoucherRecommendation()

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Progress Indicator */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Redemption Progress</h3>
            <Badge variant="secondary">{Math.round(redemptionProgress)}%</Badge>
          </div>
          <Progress value={redemptionProgress} className="mb-3" />
          <div className="grid grid-cols-3 gap-2 text-xs">
            {redemptionSteps.map((step) => (
              <div
                key={step.id}
                className={`text-center p-2 rounded ${
                  step.completed 
                    ? 'bg-green-100 text-green-800'
                    : step.current
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <div className="font-medium">{step.title}</div>
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
          className="h-16 flex-col space-y-1"
        >
          <QrCode className="w-6 h-6" />
          <span className="text-sm">Scan QR</span>
        </Button>
        <Sheet open={showVoucherSheet} onOpenChange={setShowVoucherSheet}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="h-16 flex-col space-y-1"
            >
              <Wallet className="w-6 h-6" />
              <span className="text-sm">My Vouchers</span>
              {activeVouchers.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeVouchers.length}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
        </Sheet>
      </div>

      {/* Quick Code Input */}
      <Card>
        <CardContent className="p-4">
          <Label className="text-sm font-medium">Quick Redeem</Label>
          <div className="flex space-x-2 mt-2">
            <Input
              placeholder="Enter voucher code"
              value={quickCodeInput}
              onChange={(e) => setQuickCodeInput(e.target.value.toUpperCase())}
              className="flex-1 font-mono"
            />
            <Button 
              onClick={handleQuickRedeem}
              disabled={!quickCodeInput.trim()}
              size="sm"
            >
              <Zap className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Best Voucher Recommendation */}
      {bestVoucher && currentCart && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-green-800">
                    Best Match: ₹{bestVoucher.value} Off
                  </div>
                  <div className="text-sm text-green-600">
                    Code: {bestVoucher.voucher_code}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleApplyVoucher(bestVoucher.id)}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applied Vouchers */}
      {appliedVouchers.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span>Applied Vouchers</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {appliedVouchers.map((voucherId) => {
              const voucher = vouchers.find(v => v.id === voucherId)
              if (!voucher) return null
              
              return (
                <div key={voucherId} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <div className="font-medium">{voucher.voucher_code}</div>
                    <div className="text-sm text-green-600">-₹{voucher.value}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveVoucher(voucherId)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              )
            })}
            
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center justify-between font-semibold">
                <span>Total Savings:</span>
                <span className="text-green-600">₹{totalSavings}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cart Summary */}
      {currentCart && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Subtotal:</span>
                <span>₹{currentCart.total}</span>
              </div>
              {totalSavings > 0 && (
                <div className="flex items-center justify-between text-green-600">
                  <span>Voucher Discount:</span>
                  <span>-₹{totalSavings}</span>
                </div>
              )}
              <div className="border-t pt-2 flex items-center justify-between font-semibold">
                <span>Total:</span>
                <span>₹{currentCart.total - totalSavings}</span>
              </div>
              
              {totalSavings > 0 && (
                <Alert className="bg-green-50 border-green-200">
                  <Percent className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    You're saving ₹{totalSavings} ({Math.round((totalSavings / currentCart.total) * 100)}%) on this order!
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

      {/* Vouchers Sheet */}
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <Wallet className="w-5 h-5" />
            <span>My Vouchers</span>
            <Badge variant="secondary">{activeVouchers.length}</Badge>
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4 overflow-y-auto">
          {activeVouchers.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Vouchers</h3>
              <p className="text-gray-600">
                Earn points or purchase services to get vouchers
              </p>
            </div>
          ) : (
            activeVouchers.map((voucher) => {
              const isApplied = appliedVouchers.includes(voucher.id)
              const isApplicable = currentCart ? voucher.value <= currentCart.total : true
              const daysUntilExpiry = Math.ceil((new Date(voucher.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              
              return (
                <Card 
                  key={voucher.id} 
                  className={`${
                    isApplied 
                      ? 'border-blue-200 bg-blue-50' 
                      : !isApplicable
                      ? 'border-gray-200 bg-gray-50 opacity-60'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-mono font-bold text-lg">{voucher.voucher_code}</span>
                          {daysUntilExpiry <= 7 && (
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              <Clock className="w-3 h-3 mr-1" />
                              {daysUntilExpiry}d
                            </Badge>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                          ₹{voucher.value}
                        </div>
                        <div className="text-sm text-gray-600">
                          Expires: {new Date(voucher.expires_at).toLocaleDateString()}
                        </div>
                        
                        {!isApplicable && currentCart && (
                          <div className="text-sm text-red-600 mt-2 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Min order: ₹{voucher.value}
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        {isApplied ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRemoveVoucher(voucher.id)}
                            className="border-blue-600 text-blue-600"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Applied
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleApplyVoucher(voucher.id)}
                            disabled={!isApplicable || isProcessing}
                            className={isProcessing && selectedVoucherId === voucher.id ? 'opacity-50' : ''}
                          >
                            {isProcessing && selectedVoucherId === voucher.id ? (
                              'Applying...'
                            ) : (
                              <>
                                Apply
                                <ArrowRight className="w-4 h-4 ml-1" />
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </SheetContent>
    </div>
  )
}