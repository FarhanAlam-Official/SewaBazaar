import { useState, useEffect } from "react"
import { VoucherData } from "./VoucherCard"
import { MobileVoucherRedemption } from "./MobileVoucherRedemption"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { 
  CreditCard, 
  Wallet, 
  Gift,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Star,
  Percent,
  Plus,
  Trash2,
  Calculator,
  Receipt,
  Clock,
  Target
} from "lucide-react"

interface CheckoutService {
  id: string
  name: string
  category: string
  basePrice: number
  duration: number
  provider: {
    name: string
    rating: number
  }
  options?: {
    id: string
    name: string
    price: number
    selected?: boolean
  }[]
}

interface CheckoutVoucherIntegrationProps {
  services: CheckoutService[]
  vouchers: VoucherData[]
  onPaymentComplete: (paymentData: any) => void
  className?: string
}

interface PricingBreakdown {
  subtotal: number
  voucherDiscounts: { voucherId: string; amount: number }[]
  pointsDiscount: number
  taxes: number
  total: number
  finalAmount: number
}

export function CheckoutVoucherIntegration({
  services,
  vouchers,
  onPaymentComplete,
  className
}: CheckoutVoucherIntegrationProps) {
  const [appliedVouchers, setAppliedVouchers] = useState<string[]>([])
  const [pointsToRedeem, setPointsToRedeem] = useState(0)
  const [showVoucherSection, setShowVoucherSection] = useState(false)
  const [showOptimalSuggestion, setShowOptimalSuggestion] = useState(true)
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(true)
  const [pricing, setPricing] = useState<PricingBreakdown>({
    subtotal: 0,
    voucherDiscounts: [],
    pointsDiscount: 0,
    taxes: 0,
    total: 0,
    finalAmount: 0
  })

  // Mock reward account - in real app this would come from props or context
  const rewardAccount = {
    points_balance: 1500,
    current_tier: 'Silver',
    total_points_earned: 3200
  }

  // Calculate pricing breakdown
  useEffect(() => {
    const subtotal = services.reduce((sum, service) => {
      const serviceTotal = service.basePrice + (service.options?.reduce((optSum, opt) => 
        optSum + (opt.selected ? opt.price : 0), 0) || 0)
      return sum + serviceTotal
    }, 0)

    const voucherDiscounts = appliedVouchers.map(voucherId => {
      const voucher = vouchers.find(v => v.id === voucherId)
      return {
        voucherId,
        amount: voucher ? Math.min(voucher.remaining_value, subtotal) : 0
      }
    })

    const totalVoucherDiscount = voucherDiscounts.reduce((sum, discount) => sum + discount.amount, 0)
    const pointsDiscount = Math.min(pointsToRedeem * 0.5, subtotal - totalVoucherDiscount) // 2 points = ₹1
    const afterDiscounts = subtotal - totalVoucherDiscount - pointsDiscount
    const taxes = Math.round(afterDiscounts * 0.18) // 18% GST
    const finalAmount = afterDiscounts + taxes

    setPricing({
      subtotal,
      voucherDiscounts,
      pointsDiscount,
      taxes,
      total: subtotal + Math.round(subtotal * 0.18),
      finalAmount
    })
  }, [services, appliedVouchers, pointsToRedeem, vouchers])

  // Auto-apply best vouchers when enabled
  useEffect(() => {
    if (autoApplyEnabled && appliedVouchers.length === 0) {
      const applicableVouchers = vouchers
        .filter(v => v.status === 'active' && v.remaining_value <= pricing.subtotal)
        .sort((a, b) => b.remaining_value - a.remaining_value)
        .slice(0, 2) // Apply top 2 vouchers

      if (applicableVouchers.length > 0) {
        setAppliedVouchers(applicableVouchers.map(v => v.id))
      }
    }
  }, [pricing.subtotal, autoApplyEnabled, vouchers])

  const handleApplyVoucher = (voucherId: string) => {
    if (!appliedVouchers.includes(voucherId)) {
      setAppliedVouchers([...appliedVouchers, voucherId])
    }
  }

  const handleRemoveVoucher = (voucherId: string) => {
    setAppliedVouchers(appliedVouchers.filter(id => id !== voucherId))
  }

  const getOptimalVoucherCombination = () => {
    const activeVouchers = vouchers.filter(v => v.status === 'active')
    
    // Simple greedy algorithm to find best combination
    const sortedVouchers = [...activeVouchers]
      .filter(v => !appliedVouchers.includes(v.id))
      .sort((a, b) => b.remaining_value - a.remaining_value)
    
    const selected: VoucherData[] = []
    let totalValue = 0
    const remainingAmount = pricing.subtotal - pricing.voucherDiscounts.reduce((sum, d) => sum + d.amount, 0)

    for (const voucher of sortedVouchers) {
      if (totalValue + voucher.remaining_value <= remainingAmount) {
        selected.push(voucher)
        totalValue += voucher.remaining_value
      }
    }

    return { vouchers: selected, totalSavings: totalValue }
  }

  const handleApplyOptimalCombination = () => {
    const optimal = getOptimalVoucherCombination()
    const newVoucherIds = optimal.vouchers.map(v => v.id)
    setAppliedVouchers([...appliedVouchers, ...newVoucherIds])
    setShowOptimalSuggestion(false)
  }

  const handlePayment = () => {
    const paymentData = {
      services: services.map(service => ({
        ...service,
        finalPrice: service.basePrice + (service.options?.reduce((sum, opt) => 
          sum + (opt.selected ? opt.price : 0), 0) || 0)
      })),
      appliedVouchers,
      pointsRedeemed: pointsToRedeem,
      pricing,
      timestamp: new Date().toISOString()
    }
    
    onPaymentComplete(paymentData)
  }

  const maxPointsRedeemable = Math.floor(Math.min(
    rewardAccount.points_balance,
    (pricing.subtotal - pricing.voucherDiscounts.reduce((sum, d) => sum + d.amount, 0)) * 2
  ))

  const optimalCombination = getOptimalVoucherCombination()
  const totalSavings = pricing.voucherDiscounts.reduce((sum, d) => sum + d.amount, 0) + pricing.pointsDiscount
  const savingsPercentage = pricing.subtotal > 0 ? (totalSavings / pricing.subtotal) * 100 : 0

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="w-5 h-5" />
            <span>Order Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {services.map((service) => (
            <div key={service.id} className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium">{service.name}</h4>
                <p className="text-sm text-gray-600">{service.category}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline">{service.provider.name}</Badge>
                  <div className="flex items-center text-sm">
                    <Star className="w-3 h-3 text-yellow-500 mr-1" />
                    {service.provider.rating}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {service.duration}h
                  </div>
                </div>
                {service.options?.some(opt => opt.selected) && (
                  <div className="mt-2 text-sm text-gray-600">
                    Add-ons: {service.options.filter(opt => opt.selected).map(opt => opt.name).join(', ')}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="font-semibold">₹{service.basePrice}</div>
                {service.options?.some(opt => opt.selected) && (
                  <div className="text-sm text-gray-600">
                    +₹{service.options.reduce((sum, opt) => sum + (opt.selected ? opt.price : 0), 0)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Savings Opportunity Alert */}
      {showOptimalSuggestion && optimalCombination.totalSavings > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <Target className="w-4 h-4 text-green-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <div className="font-medium text-green-800">
                Save ₹{optimalCombination.totalSavings} more!
              </div>
              <div className="text-green-600">
                Apply {optimalCombination.vouchers.length} additional voucher{optimalCombination.vouchers.length > 1 ? 's' : ''}
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleApplyOptimalCombination}
              className="ml-4 bg-green-600 hover:bg-green-700"
            >
              Apply All
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Voucher & Points Section */}
      <Card>
        <Collapsible open={showVoucherSection} onOpenChange={setShowVoucherSection}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5" />
                  <span>Vouchers & Points</span>
                  {(appliedVouchers.length > 0 || pointsToRedeem > 0) && (
                    <Badge variant="secondary">
                      {appliedVouchers.length + (pointsToRedeem > 0 ? 1 : 0)} applied
                    </Badge>
                  )}
                </div>
                {showVoucherSection ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* Auto-apply setting */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-apply"
                  checked={autoApplyEnabled}
                  onCheckedChange={(checked) => setAutoApplyEnabled(checked === true)}
                />
                <Label htmlFor="auto-apply" className="text-sm">
                  Automatically apply best vouchers
                </Label>
              </div>

              {/* Mobile voucher component */}
              <MobileVoucherRedemption
                vouchers={vouchers}
                currentCart={{
                  total: pricing.subtotal,
                  items: services,
                  serviceCategory: services[0]?.category
                }}
                onApplyVoucher={handleApplyVoucher}
                onRemoveVoucher={handleRemoveVoucher}
                appliedVouchers={appliedVouchers}
              />

              {/* Points Redemption */}
              <div className="pt-4 border-t">
                <Label className="text-sm font-medium">Redeem Points</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    type="number"
                    placeholder="0"
                    value={pointsToRedeem || ''}
                    onChange={(e) => setPointsToRedeem(Math.min(Number(e.target.value) || 0, maxPointsRedeemable))}
                    className="flex-1"
                    max={maxPointsRedeemable}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPointsToRedeem(maxPointsRedeemable)}
                    disabled={maxPointsRedeemable === 0}
                  >
                    Max
                  </Button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Available: {rewardAccount.points_balance} points • Max: {maxPointsRedeemable} points (₹{maxPointsRedeemable / 2})
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Price Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="w-5 h-5" />
            <span>Payment Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{pricing.subtotal}</span>
          </div>

          {pricing.voucherDiscounts.length > 0 && (
            <>
              {pricing.voucherDiscounts.map((discount) => {
                const voucher = vouchers.find(v => v.id === discount.voucherId)
                return (
                  <div key={discount.voucherId} className="flex justify-between text-green-600">
                    <span className="flex items-center">
                      <Gift className="w-4 h-4 mr-1" />
                      {voucher?.voucher_code}
                    </span>
                    <span>-₹{discount.amount}</span>
                  </div>
                )
              })}
            </>
          )}

          {pricing.pointsDiscount > 0 && (
            <div className="flex justify-between text-purple-600">
              <span className="flex items-center">
                <Star className="w-4 h-4 mr-1" />
                Points ({pointsToRedeem} pts)
              </span>
              <span>-₹{pricing.pointsDiscount}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>GST (18%)</span>
            <span>₹{pricing.taxes}</span>
          </div>

          <Separator />

          <div className="flex justify-between font-semibold text-lg">
            <span>Total Amount</span>
            <span>₹{pricing.finalAmount}</span>
          </div>

          {totalSavings > 0 && (
            <Alert className="bg-green-50 border-green-200">
              <Percent className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                You're saving ₹{totalSavings} ({savingsPercentage.toFixed(1)}%) on this order!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Payment Actions */}
      <div className="flex space-x-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setShowVoucherSection(!showVoucherSection)}
        >
          <Wallet className="w-4 h-4 mr-2" />
          {appliedVouchers.length > 0 || pointsToRedeem > 0 ? 'Modify' : 'Add'} Savings
        </Button>
        <Button
          className="flex-1"
          onClick={handlePayment}
          disabled={pricing.finalAmount <= 0}
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Pay ₹{pricing.finalAmount}
        </Button>
      </div>

      {/* Payment Methods Info */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Secure payment • Cards, UPI, Wallets accepted</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}