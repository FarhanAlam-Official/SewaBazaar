"use client"

import { useState, useEffect, useRef } from "react"
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
  Target,
  Search,
  X
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { VoucherCard } from "./VoucherCard"
import { showToast } from "@/components/ui/enhanced-toast"
import { VoucherService } from "@/services/VoucherService"
import Cookies from "js-cookie"

// Rate limiting for voucher validation attempts
const failedAttempts: { [key: string]: { count: number; timestamp: number } } = {};
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

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
  onVoucherApply?: (voucher: VoucherData | null) => void
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
  className,
  onVoucherApply
}: CheckoutVoucherIntegrationProps) {
  const voucherSectionRef = useRef<HTMLDivElement>(null)
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null) // Single voucher instead of array
  const [pointsToRedeem, setPointsToRedeem] = useState(0)
  const [showVoucherSection, setShowVoucherSection] = useState(false)

  useEffect(() => {
    if (showVoucherSection && voucherSectionRef.current) {
      // Focus the first focusable element in the voucher section when it opens
      const firstFocusable = voucherSectionRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      if (firstFocusable) {
        firstFocusable.focus()
      }
    }
  }, [showVoucherSection])
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
  const [manualVoucherCode, setManualVoucherCode] = useState("")
  const [isManualCodeValidating, setIsManualCodeValidating] = useState(false)
  const [isManualCodeValid, setIsManualCodeValid] = useState<boolean | undefined>(undefined)
  const [manualVoucherData, setManualVoucherData] = useState<VoucherData | null>(null)

  // Notify parent when voucher is applied or removed
  useEffect(() => {
    if (onVoucherApply) {
      if (appliedVoucher) {
        const voucher = vouchers.find(v => v.id === appliedVoucher);
        onVoucherApply(voucher || null);
      } else {
        onVoucherApply(null);
      }
    }
  }, [appliedVoucher, vouchers, onVoucherApply]);

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

    // Calculate single voucher discount
    let voucherDiscounts: { voucherId: string; amount: number }[] = []
    
    if (appliedVoucher) {
      const voucher = vouchers.find(v => v.id === appliedVoucher)
      if (voucher && voucher.status !== 'used') {
        voucherDiscounts = [{
          voucherId: appliedVoucher,
          amount: Math.min(voucher.value, subtotal)
        }]
      }
    }

    // Add manual voucher discount if valid (replaces any applied voucher)
    if (manualVoucherData && isManualCodeValid === true) {
      voucherDiscounts = [{
        voucherId: manualVoucherData.id,
        amount: Math.min(manualVoucherData.value, subtotal)
      }]
    }

    const totalVoucherDiscount = voucherDiscounts.reduce((sum, discount) => sum + discount.amount, 0)
    const pointsDiscount = Math.min(pointsToRedeem * 0.5, subtotal - totalVoucherDiscount) // 2 points = ₹1
    const afterDiscounts = subtotal - totalVoucherDiscount - pointsDiscount
    const taxes = Math.round(afterDiscounts * 0.13) // 13% VAT on discounted amount
    const finalAmount = afterDiscounts + taxes

    setPricing({
      subtotal,
      voucherDiscounts,
      pointsDiscount,
      taxes,
      total: afterDiscounts, // This should be the amount after discounts but before tax
      finalAmount // This is the final amount including tax
    })
  }, [services, appliedVoucher, pointsToRedeem, vouchers, manualVoucherData, isManualCodeValid]);

  // Auto-apply best voucher when enabled
  useEffect(() => {
    if (autoApplyEnabled && !appliedVoucher && !manualVoucherData) {
      const applicableVouchers = vouchers
        .filter(v => v.status === 'active' && v.value <= pricing.subtotal)
        .sort((a, b) => b.value - a.value)

      if (applicableVouchers.length > 0) {
        setAppliedVoucher(applicableVouchers[0].id) // Apply only the best voucher
      }
    }
  }, [pricing.subtotal, autoApplyEnabled, vouchers, appliedVoucher, manualVoucherData]);

  const handleApplyVoucher = (voucherId: string) => {
    // Remove manual voucher if applying a regular voucher
    setManualVoucherData(null)
    setIsManualCodeValid(undefined)
    setManualVoucherCode("")
    
    
    // Apply single voucher (replace any existing)
    setAppliedVoucher(voucherId)
    // Show success feedback
    showToast.success({ 
      title: "Voucher Applied!", 
      description: "Your voucher has been successfully applied to this booking" 
    })
  }

  const handleRemoveVoucher = (voucherId: string) => {
    if (appliedVoucher === voucherId) {
      setAppliedVoucher(null)
      // Show feedback
      showToast.info({ 
        title: "Voucher Removed", 
        description: "Voucher has been removed from this booking" 
      })
    }
  }

  const getOptimalVoucherCombination = () => {
    const activeVouchers = vouchers.filter(v => v.status === 'active')
    
    // Find the best single voucher
    const availableVouchers = activeVouchers
      .filter(v => v.id !== appliedVoucher && v.value <= pricing.subtotal)
      .sort((a, b) => b.value - a.value)
    
    const bestVoucher = availableVouchers[0]
    const totalSavings = bestVoucher ? Math.min(bestVoucher.value, pricing.subtotal) : 0

    return {
      vouchers: bestVoucher ? [bestVoucher] : [],
      totalSavings
    }
  }

  const handleApplyOptimalCombination = () => {
    const optimal = getOptimalVoucherCombination()
    if (optimal.vouchers.length > 0) {
      setAppliedVoucher(optimal.vouchers[0].id) // Apply the best voucher
      setShowOptimalSuggestion(false)
    }
  }

  const handlePayment = () => {
    const paymentData = {
      services: services.map(service => ({
        ...service,
        finalPrice: service.basePrice + (service.options?.reduce((sum, opt) => 
          sum + (opt.selected ? opt.price : 0), 0) || 0)
      })),
      appliedVoucher,
      pointsRedeemed: pointsToRedeem,
      pricing,
      timestamp: new Date().toISOString()
    }
    
    // Store applied voucher in sessionStorage for use in booking/payment flows
    if (appliedVoucher) {
      const voucher = vouchers.find(v => v.id === appliedVoucher);
      if (voucher) {
        sessionStorage.setItem('selectedVoucher', JSON.stringify({
          id: voucher.id,
          code: voucher.voucher_code,
          value: voucher.value,
          discount_amount: voucher.value
        }));
      }
    } else if (manualVoucherData && isManualCodeValid === true) {
      // Store manual voucher if applied
      sessionStorage.setItem('selectedVoucher', JSON.stringify({
        id: manualVoucherData.id,
        code: manualVoucherData.voucher_code,
        value: manualVoucherData.value,
        discount_amount: manualVoucherData.value
      }));
    } else {
      // Remove voucher from sessionStorage if none applied
      sessionStorage.removeItem('selectedVoucher');
    }
    
    // Store the final payment amount for booking/payment flow
    sessionStorage.setItem('finalPaymentAmount', pricing.finalAmount.toString());
    
    onPaymentComplete(paymentData)
  }

  const maxPointsRedeemable = Math.floor(Math.min(
    rewardAccount.points_balance,
    (pricing.subtotal - pricing.voucherDiscounts.reduce((sum, d) => sum + d.amount, 0)) * 2
  ))

  const optimalCombination = getOptimalVoucherCombination()
  const totalSavings = pricing.voucherDiscounts.reduce((sum, d) => sum + d.amount, 0) + pricing.pointsDiscount
  const savingsPercentage = pricing.subtotal > 0 ? (totalSavings / pricing.subtotal) * 100 : 0

  // Handle manual voucher code validation
  const handleValidateManualVoucher = async () => {
    // Check rate limiting
    const userId = Cookies.get('user_id') || 'anonymous';
    const now = Date.now();
    
    // Clean up old failed attempts
    Object.keys(failedAttempts).forEach(key => {
      if (now - failedAttempts[key].timestamp > LOCKOUT_DURATION) {
        delete failedAttempts[key];
      }
    });
    
    // Check if user is locked out
    if (failedAttempts[userId] && failedAttempts[userId].count >= MAX_FAILED_ATTEMPTS) {
      if (now - failedAttempts[userId].timestamp < LOCKOUT_DURATION) {
        const remainingTime = Math.ceil((LOCKOUT_DURATION - (now - failedAttempts[userId].timestamp)) / 1000 / 60);
        showToast.error({ 
          title: "Too many failed attempts", 
          description: `Please try again in ${remainingTime} minutes` 
        });
        return;
      } else {
        // Lockout period expired, reset attempts
        delete failedAttempts[userId];
      }
    }
    
    // Input sanitization
    const sanitizedCode = manualVoucherCode.trim().toUpperCase();
    
    if (!sanitizedCode) {
      showToast.error({ title: "Please enter a voucher code" });
      return;
    }
    
    // Format validation
    if (!/^[A-Z0-9\-]+$/.test(sanitizedCode)) {
      showToast.error({ title: "Invalid voucher code format" });
      return;
    }
    
    if (sanitizedCode.length > 20) {
      showToast.error({ title: "Voucher code too long" });
      return;
    }

    try {
      setIsManualCodeValidating(true);
      const voucher = await VoucherService.validateVoucherCode(sanitizedCode);
      
      // Check if voucher can be used for this booking amount
      const response = await fetch(`${VoucherService.baseUrl}/rewards/vouchers/validate-booking/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Cookies.get('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          voucher_code: voucher.voucher_code,
          booking_amount: pricing.subtotal
        })
      });
      
      // Handle network errors
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.detail || 'Failed to validate voucher for booking';
        
        // Record failed attempt
        if (!failedAttempts[userId]) {
          failedAttempts[userId] = { count: 0, timestamp: now };
        }
        failedAttempts[userId].count += 1;
        failedAttempts[userId].timestamp = now;
        
        switch (response.status) {
          case 400:
            showToast.error({ title: "Validation Error", description: errorMessage });
            break;
          case 401:
            showToast.error({ title: "Authentication Error", description: "Please log in again" });
            break;
          case 403:
            showToast.error({ title: "Access Denied", description: "This voucher may not belong to you" });
            break;
          case 404:
            showToast.error({ title: "Not Found", description: "Voucher not found" });
            break;
          case 429:
            showToast.error({ title: "Too Many Requests", description: "Please try again later" });
            break;
          case 500:
            showToast.error({ title: "Server Error", description: "Please try again later" });
            break;
          default:
            showToast.error({ title: "Error", description: errorMessage });
        }
        
        setIsManualCodeValid(false);
        return;
      }
      
      const validationData = await response.json();
      
      if (!validationData.can_use) {
        // Record failed attempt
        if (!failedAttempts[userId]) {
          failedAttempts[userId] = { count: 0, timestamp: now };
        }
        failedAttempts[userId].count += 1;
        failedAttempts[userId].timestamp = now;
        
        showToast.error({ 
          title: "Voucher cannot be used", 
          description: validationData.reason || "This voucher is not valid for your current booking" 
        });
        setIsManualCodeValid(false);
        return;
      }
      
      // Reset failed attempts on success
      delete failedAttempts[userId];
      
      setManualVoucherData(voucher);
      setIsManualCodeValid(true);
      setAppliedVoucher(null); // Remove any applied voucher
      
      // Show success feedback
      showToast.success({ 
        title: "Voucher Validated!", 
        description: `Voucher ${voucher.voucher_code} worth ₹${voucher.value} has been successfully applied` 
      });
    } catch (error: any) {
      console.error('Error validating voucher:', error);
      
      // Record failed attempt for client-side errors too
      if (!failedAttempts[userId]) {
        failedAttempts[userId] = { count: 0, timestamp: now };
      }
      failedAttempts[userId].count += 1;
      failedAttempts[userId].timestamp = now;
      
      // Handle different types of errors
      if (error.message.includes('Network error')) {
        showToast.error({ 
          title: "Network Error", 
          description: "Please check your connection and try again" 
        });
      } else if (error.message.includes('Too many validation attempts')) {
        showToast.error({ 
          title: "Rate Limit Exceeded", 
          description: "Please try again later" 
        });
      } else if (error.message.includes('Authentication required')) {
        showToast.error({ 
          title: "Authentication Error", 
          description: "Please log in again" 
        });
      } else {
        showToast.error({ 
          title: "Invalid voucher code", 
          description: error.message || "Please check the code and try again" 
        });
      }
      
      setIsManualCodeValid(false);
    } finally {
      setIsManualCodeValidating(false);
    }
  }

  // Handle removing manual voucher
  const handleRemoveManualVoucher = () => {
    setManualVoucherCode("")
    setManualVoucherData(null)
    setIsManualCodeValid(undefined)
  }

  return (
    <div ref={voucherSectionRef} className={`space-y-5 ${className}`}>
      {/* Skip link for accessibility */}
      <a 
        href="#payment-summary" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-blue-600 focus:px-4 focus:py-2 focus:rounded focus:shadow-lg"
      >
        Skip to payment summary
      </a>
      {/* Order Summary */}
      <Card role="region" aria-labelledby="order-summary-title" className="shadow-sm bg-white dark:bg-gray-800">
        <CardHeader className="p-4">
          <CardTitle id="order-summary-title" className="flex items-center space-x-2 text-base text-gray-900 dark:text-gray-100">
            <Receipt className="w-5 h-5" aria-hidden="true" />
            <span>Order Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          {services.map((service) => (
            <div key={service.id} className="flex flex-col sm:flex-row justify-between items-start gap-3">
              <div className="flex-1 w-full">
                <h4 className="font-medium text-base text-gray-900 dark:text-gray-100">{service.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{service.category}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline" className="text-sm dark:border-gray-600">{service.provider.name}</Badge>
                  <div className="flex items-center text-sm">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-gray-900 dark:text-gray-100">{service.provider.rating}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4 mr-1" />
                    {service.duration}h
                  </div>
                </div>
                {service.options?.some(opt => opt.selected) && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Add-ons: {service.options.filter(opt => opt.selected).map(opt => opt.name).join(', ')}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="font-semibold text-base text-gray-900 dark:text-gray-100">₹{service.basePrice}</div>
                {service.options?.some(opt => opt.selected) && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
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
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
        >
          <Alert className="border-green-200 bg-green-50 dark:border-green-800/50 dark:bg-green-900/20 relative overflow-hidden p-4">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-600/10 animate-pulse"></div>
            <Target className="w-5 h-5 text-green-600 dark:text-green-400 relative z-10" />
            <AlertDescription className="flex items-center justify-between relative z-10">
              <div>
                <div className="font-medium text-green-800 dark:text-green-200 text-base">
                  Save ₹{optimalCombination.totalSavings} more!
                </div>
                <div className="text-green-600 dark:text-green-400">
                  Apply {optimalCombination.vouchers.length} additional voucher{optimalCombination.vouchers.length > 1 ? 's' : ''}
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleApplyOptimalCombination}
                className="ml-4 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 transition-all duration-300 hover:scale-105 h-9 px-4"
              >
                Apply All
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Voucher & Points Section */}
      <Card role="region" aria-labelledby="voucher-section-title" className="shadow-sm bg-white dark:bg-gray-800">
        <Collapsible open={showVoucherSection} onOpenChange={setShowVoucherSection}>
          <CollapsibleTrigger asChild>
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-4"
              aria-expanded={showVoucherSection}
              aria-controls="voucher-section-content"
            >
              <CardTitle id="voucher-section-title" className="flex items-center justify-between text-base text-gray-900 dark:text-gray-100">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5" aria-hidden="true" />
                  <span>Vouchers & Points</span>
                  {(appliedVoucher || pointsToRedeem > 0 || (manualVoucherData && isManualCodeValid)) && (
                    <Badge variant="secondary" className="h-5 text-sm dark:bg-gray-700">
                      {(appliedVoucher ? 1 : 0) + (pointsToRedeem > 0 ? 1 : 0) + (manualVoucherData && isManualCodeValid === true ? 1 : 0)} applied
                    </Badge>
                  )}
                </div>
                {showVoucherSection ? (
                  <ChevronUp className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-5 h-5" aria-hidden="true" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent id="voucher-section-content">
            <CardContent className="space-y-5 p-4">
              {/* Manual Voucher Entry */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300" id="voucher-code-description">Enter Voucher Code</Label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Enter voucher code"
                      value={manualVoucherCode}
                      onChange={(e) => setManualVoucherCode(e.target.value.toUpperCase())}
                      className="font-mono pl-10 h-10 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      disabled={isManualCodeValidating || (!!manualVoucherData && isManualCodeValid === true)}
                      aria-label="Enter voucher code"
                      aria-describedby="voucher-code-description"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && manualVoucherCode.trim()) {
                          handleValidateManualVoucher()
                        }
                      }}
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                    {manualVoucherData && isManualCodeValid && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={handleRemoveManualVoucher}
                        aria-label="Remove voucher"
                      >
                        <X className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={handleValidateManualVoucher}
                    disabled={!manualVoucherCode.trim() || isManualCodeValidating}
                    className="h-10 px-4 transition-all duration-300 hover:scale-105 text-base hover:bg-primary/90"
                    aria-label="Apply voucher code"
                  >
                    {isManualCodeValidating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 rounded-full border-2 border-white border-t-transparent mr-2"
                        />
                        <span>Validating...</span>
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4 mr-2" />
                        Apply
                      </>
                    )}
                  </Button>
                </div>
                <AnimatePresence>
                {isManualCodeValid === false && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-red-600 dark:text-red-400 flex items-center"
                  >
                    <AlertCircle className="w-4 h-4 mr-2 animate-pulse" />
                    Invalid voucher code or voucher cannot be used for this booking
                  </motion.p>
                )}
                </AnimatePresence>
                <AnimatePresence>
                {manualVoucherData && isManualCodeValid && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200 text-base">
                          {manualVoucherData.voucher_code}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Value: ₹{manualVoucherData.value}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 h-6 text-sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Applied
                      </Badge>
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>

              {/* Auto-apply setting */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="auto-apply"
                  checked={autoApplyEnabled}
                  onCheckedChange={(checked) => setAutoApplyEnabled(checked === true)}
                  className="h-5 w-5"
                />
                <Label htmlFor="auto-apply" className="text-sm text-gray-700 dark:text-gray-300">
                  Automatically apply best vouchers
                </Label>
              </div>

              {/* Available Vouchers */}
              {vouchers.filter(v => v.status === 'active').length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Available Vouchers</Label>
                  <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto sm:max-h-80">
                    {vouchers
                      .filter(voucher => voucher.status === 'active')
                      .slice(0, 5)
                      .map((voucher) => {
                        const isApplied = appliedVoucher === voucher.id;
                        return (
                          <motion.div 
                            key={voucher.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-3 rounded-lg border transition-all ${
                              isApplied 
                                ? 'border-green-500 bg-green-50 dark:border-green-800/50 dark:bg-green-900/20' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 dark:bg-gray-700'
                            }`}
                            role="region"
                            aria-label={`Voucher ${voucher.voucher_code}, value ₹${voucher.value}`}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                if (isApplied) {
                                  handleRemoveVoucher(voucher.id)
                                } else {
                                  handleApplyVoucher(voucher.id)
                                }
                              }
                            }}
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 dark:text-gray-100">{voucher.voucher_code}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Value: ₹{voucher.value}</p>
                              </div>
                              <Button
                                size="sm"
                                variant={isApplied ? "secondary" : "default"}
                                onClick={() => 
                                  isApplied 
                                    ? handleRemoveVoucher(voucher.id) 
                                    : handleApplyVoucher(voucher.id)
                                }
                                disabled={!!manualVoucherData && isManualCodeValid === true}
                                className={`h-9 px-4 text-sm ${isApplied ? "transition-all duration-300 bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-200" : "hover:bg-primary/90"}`}
                                aria-label={isApplied ? `Remove voucher ${voucher.voucher_code}` : `Apply voucher ${voucher.voucher_code}`}
                              >
                                {isApplied ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-1" aria-hidden="true" />
                                    Applied
                                  </>
                                ) : "Apply"}
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    {vouchers.filter(v => v.status === 'active').length > 5 && (
                      <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                        + {vouchers.filter(v => v.status === 'active').length - 5} more vouchers available
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                appliedVouchers={appliedVoucher ? [appliedVoucher] : []}
              />

              {/* Points Redemption */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Redeem Points</Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-3">
                  <div className="flex items-center w-full">
                    <Input
                      type="number"
                      placeholder="0"
                      value={pointsToRedeem || ''}
                      onChange={(e) => setPointsToRedeem(Math.min(Number(e.target.value) || 0, maxPointsRedeemable))}
                      className="flex-1 h-10 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      max={maxPointsRedeemable}
                      aria-label="Number of points to redeem"
                      aria-describedby="points-info"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur()
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPointsToRedeem(maxPointsRedeemable)}
                      disabled={maxPointsRedeemable === 0}
                      className="h-10 px-4 ml-2 text-sm dark:border-gray-600 dark:text-gray-100 hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-300"
                      aria-label="Redeem maximum points"
                    >
                      Max
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    ₹{maxPointsRedeemable / 2} value
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2" id="points-info">
                  Available: {rewardAccount.points_balance} points • Max: {maxPointsRedeemable} points
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Price Breakdown */}
      <Card id="payment-summary" className="shadow-sm bg-white dark:bg-gray-800">
        <CardHeader className="p-4">
          <CardTitle className="flex items-center space-x-2 text-base text-gray-900 dark:text-gray-100">
            <Calculator className="w-5 h-5" aria-hidden="true" />
            <span>Payment Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-base">
            <span className="text-gray-700 dark:text-gray-300">Subtotal</span>
            <span className="text-gray-900 dark:text-gray-100">₹{pricing.subtotal}</span>
          </div>

          {pricing.voucherDiscounts.length > 0 && (
            <>
              {pricing.voucherDiscounts.map((discount) => {
                const voucher = vouchers.find(v => v.id === discount.voucherId) || manualVoucherData
                return (
                  <div key={discount.voucherId} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-green-600 dark:text-green-400 text-base">
                    <span className="flex items-center">
                      <Gift className="w-4 h-4 mr-2" />
                      {voucher?.voucher_code || "Voucher"}
                    </span>
                    <span>-₹{discount.amount}</span>
                  </div>
                )
              })}
            </>
          )}

          {pricing.pointsDiscount > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-purple-600 dark:text-purple-400 text-base">
              <span className="flex items-center">
                <Star className="w-4 h-4 mr-2" />
                Points ({pointsToRedeem} pts)
              </span>
              <span>-₹{pricing.pointsDiscount}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-base">
            <span className="text-gray-700 dark:text-gray-300">VAT (13%)</span>
            <span className="text-gray-900 dark:text-gray-100">₹{pricing.taxes}</span>
          </div>

          <Separator className="my-3 dark:bg-gray-700" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-semibold text-lg">
            <span className="text-gray-900 dark:text-gray-100">Total Amount</span>
            <span className="text-gray-900 dark:text-gray-100">₹{pricing.finalAmount}</span>
          </div>

          {totalSavings > 0 && (
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 p-3">
              <Percent className="w-5 h-5 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                You're saving ₹{totalSavings} ({savingsPercentage.toFixed(1)}%) on this order!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Payment Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          className="flex-1 h-12 text-base dark:border-gray-600 dark:text-gray-100 hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-300"
          onClick={() => setShowVoucherSection(!showVoucherSection)}
          aria-label={appliedVoucher || pointsToRedeem > 0 || (manualVoucherData && isManualCodeValid) ? 'Modify savings' : 'Add savings'}
        >
          <Wallet className="w-5 h-5 mr-2" aria-hidden="true" />
          {appliedVoucher || pointsToRedeem > 0 || (manualVoucherData && isManualCodeValid) ? 'Modify' : 'Add'} Savings
        </Button>
        <Button
          className="flex-1 h-12 text-base hover:bg-primary/90 transition-all duration-300"
          onClick={handlePayment}
          disabled={pricing.finalAmount <= 0}
          aria-label={`Pay ₹${pricing.finalAmount}`}
        >
          <CreditCard className="w-5 h-5 mr-2" aria-hidden="true" />
          Pay ₹{pricing.finalAmount}
        </Button>
      </div>

      {/* Payment Methods Info */}
      <Card className="bg-gray-50 dark:bg-gray-800/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span>Secure payment • Cards, UPI, Wallets accepted</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}