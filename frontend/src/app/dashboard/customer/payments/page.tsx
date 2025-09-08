"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Eye,
  Calendar,
  Copy,
  Check,
  Loader2,
  MoveHorizontal,
  Timer
} from "lucide-react"
import { customerApi } from "@/services/customer.api"
import { bookingsApi } from "@/services/api"
import { showToast } from "@/components/ui/enhanced-toast"
import { PaymentListSkeleton, PaymentsSkeleton } from "@/components/ui/payments-skeleton"
import type { PaymentMethod } from "@/types"

// NOTE: Enhanced PaymentItem type with booking details for comprehensive modal display

type PaymentItem = {
  id: number
  booking: number
  amount: number
  total_amount: number
  status: string
  payment_type: string
  transaction_id: string
  created_at: string
  paid_at?: string
  payment_method?: number
  payment_method_details?: { id: number; name: string; payment_type: string }
  // Enhanced booking details
  booking_details?: {
    id: number
    service_name: string
    provider_name: string
    scheduled_date: string
    scheduled_time: string
    location: string
    status: string
    notes?: string
  }
}

export default function PaymentsPage() {
  const router = useRouter()
  // Filters and pagination
  // Use 'all' instead of empty string to satisfy Select value requirements
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [search, setSearch] = useState<string>("")
  const [page, setPage] = useState<number>(1)
  const pageSize = 10

  // Data state
  const [loading, setLoading] = useState<boolean>(false)
  const [items, setItems] = useState<PaymentItem[]>([])
  const [allPayments, setAllPayments] = useState<PaymentItem[]>([]) // Store all payments regardless of filters
  const [count, setCount] = useState<number>(0)

  // Pay Now (convert cash→digital) dialog state
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailPayment, setDetailPayment] = useState<PaymentItem | null>(null)
  const [loadingBookingDetails, setLoadingBookingDetails] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [initiating, setInitiating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Copy transaction ID function
  const copyTransactionId = async (transactionId: string) => {
    try {
      await navigator.clipboard.writeText(transactionId)
      setCopiedId(transactionId)
      showToast.success({
        title: "Copied!",
        description: "Transaction ID copied to clipboard",
        duration: 2000
      })
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      showToast.error({
        title: "Copy failed",
        description: "Could not copy transaction ID",
        duration: 2000
      })
    }
  }

  // Fetch booking details for modal
  const fetchBookingDetails = async (payment: PaymentItem) => {
    try {
      setLoadingBookingDetails(true)
      console.log('Fetching booking details for payment:', payment)
      
      // Fetch booking details using the booking ID
      const response = await bookingsApi.getBookingById(payment.booking)
      console.log('Booking API response:', response)
      
      // Enhanced data extraction with multiple fallback strategies
      const serviceTitle = response.service_details?.title || 
                          response.service?.title || 
                          response.service_name || 
                          'Unknown Service'
      
      const providerName = response.service_details?.provider?.get_full_name ||
                          response.service_details?.provider?.first_name ||
                          response.service?.provider?.get_full_name ||
                          response.service?.provider?.first_name ||
                          response.provider_name ||
                          'Unknown Provider'
      
      const location = response.address && response.city ? 
                      `${response.address}, ${response.city}` : 
                      response.address || response.city || 'No location specified'
      
      // Create enhanced payment object with booking details
      const enhancedPayment: PaymentItem = {
        ...payment,
        booking_details: {
          id: response.id,
          service_name: serviceTitle,
          provider_name: providerName,
          scheduled_date: response.booking_date,
          scheduled_time: response.booking_time,
          location: location,
          status: response.status,
          notes: response.special_instructions
        }
      }
      
      console.log('Enhanced payment with booking details:', enhancedPayment)
      setDetailPayment(enhancedPayment)
      setDetailsOpen(true)
    } catch (error) {
      console.error('Error fetching booking details:', error)
      // Fallback: show payment details without booking info
      setDetailPayment(payment)
      setDetailsOpen(true)
      showToast.error({
        title: "Could not load booking details",
        description: "Showing payment information only",
        duration: 3000
      })
    } finally {
      setLoadingBookingDetails(false)
    }
  }

  // Load payment methods on mount for Pay Now drawer (digital methods only)
  useEffect(() => {
    (async () => {
      try {
        const methods = await bookingsApi.getPaymentMethods()
        setPaymentMethods(methods.filter((m: any) => m.payment_type !== 'cash'))
      } catch (e) {
        // non-blocking
      }
    })()
  }, [])

  // Fetch all payments once for summary stats (unfiltered)
  useEffect(() => {
    const fetchAllPayments = async () => {
      try {
        const getHistory = await customerApi.getPaymentHistory()
        const resp = await getHistory({
          page_size: 1000, // Get all payments for accurate totals
        })
        setAllPayments(resp.results || [])
      } catch (err: any) {
        console.error("Failed to load all payments for summary:", err)
      }
    }
    fetchAllPayments()
  }, [])

  // Fetch customer payment history with filters
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        const getHistory = await customerApi.getPaymentHistory()
        const resp = await getHistory({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          payment_type: typeFilter !== 'all' ? typeFilter : undefined,
          q: search || undefined,
          page,
          page_size: pageSize,
        })
        setItems(resp.results || [])
        setCount(resp.count || 0)
      } catch (err: any) {
        showToast.error({ title: "Failed to load payments", description: err.message || "Please try again" })
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [statusFilter, typeFilter, search, page])

  // Calculate summary stats from all payments (not affected by filters)
  const totalPaid = useMemo(() => allPayments.filter(i => i.status === 'completed').reduce((s, x) => s + Number(x.total_amount || x.amount || 0), 0), [allPayments])
  const totalPending = useMemo(() => allPayments.filter(i => i.status === 'pending').reduce((s, x) => s + Number(x.total_amount || x.amount || 0), 0), [allPayments])
  const totalProcessing = useMemo(() => allPayments.filter(i => i.status === 'processing').reduce((s, x) => s + Number(x.total_amount || x.amount || 0), 0), [allPayments])
  const totalFailed = useMemo(() => allPayments.filter(i => i.status === 'failed').reduce((s, x) => s + Number(x.total_amount || x.amount || 0), 0), [allPayments])
  const totalRefunded = useMemo(() => allPayments.filter(i => i.status === 'refunded').reduce((s, x) => s + Number(x.total_amount || x.amount || 0), 0), [allPayments])
  // Total count for display elsewhere
  const totalPayments = useMemo(() => allPayments.length, [allPayments])

  // Handle Pay Now for pending cash payments: initiate payment with selected method and redirect
  const onClickPayNow = (payment: PaymentItem) => {
    setSelectedPayment(payment)
    setPayDialogOpen(true)
  }

  // Row click opens transaction details modal with booking details
  const onClickRow = (payment: PaymentItem) => {
    fetchBookingDetails(payment)
  }

  const startDigitalPayment = async (methodId: number) => {
    if (!selectedPayment) return
    try {
      setInitiating(true)
      
      // First check if we're switching from cash to digital payment
      if (selectedPayment.payment_type === 'cash' && selectedPayment.status === 'pending') {
        // Update existing pending cash payment to the chosen digital method
        await bookingsApi.initiatePayment(selectedPayment.booking, methodId)
        showToast.success({
          title: "Payment Method Updated",
          description: "Payment method switched successfully. Redirecting to payment page...",
          duration: 3000
        })
      } else {
        // For other cases, try to initiate new payment
        try {
          await bookingsApi.initiatePayment(selectedPayment.booking, methodId)
        } catch (initiateError: any) {
          // If payment already exists, handle gracefully
          if (initiateError.response?.status === 400 && 
              (initiateError.response.data?.detail?.includes('already exists') || 
               initiateError.response.data?.error?.includes('already exists'))) {
            console.log('Payment already exists, proceeding to payment page')
            showToast.info({
              title: "Redirecting to Payment",
              description: "Taking you to the payment page...",
              duration: 2000
            })
          } else {
            throw initiateError // Re-throw if it's a different error
          }
        }
      }
      
      // Always redirect to the booking payment page to complete the flow
      setTimeout(() => {
        router.push(`/bookings/${selectedPayment.booking}/payment`)
      }, 1000)
      
    } catch (err: any) {
      console.error('Payment initiation error:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.error || 
                          err.message || 
                          "Could not initiate payment. Please try again."
      showToast.error({ 
        title: "Payment Error", 
        description: errorMessage,
        duration: 5000
      })
    } finally {
      setInitiating(false)
      setPayDialogOpen(false)
      setSelectedPayment(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-gray-900">
      <div className="container max-w-6xl py-6 space-y-6">
        {/* Clean Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                Payment History
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Track and manage your payment transactions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-2.5 py-1">
                <Receipt className="h-3.5 w-3.5 mr-1.5 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium">{totalPayments} Total Payments</span>
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Refined Summary Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6"
        >
          <Card className="border border-emerald-200/50 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50/80 to-green-50/60 dark:from-emerald-950/50 dark:to-green-950/30 hover:shadow-md transition-all duration-200 group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 dark:bg-emerald-400/20 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <TrendingUp className="h-3 w-3 text-emerald-500/60" />
              </div>
              <p className="text-xs font-medium text-emerald-700/80 dark:text-emerald-300/80 mb-1">Total Paid</p>
              <div className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                NPR {totalPaid.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-br from-amber-50/80 to-yellow-50/60 dark:from-amber-950/50 dark:to-yellow-950/30 hover:shadow-md transition-all duration-200 group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 dark:bg-amber-400/20 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <Clock className="h-3 w-3 text-amber-500/60" />
              </div>
              <p className="text-xs font-medium text-amber-700/80 dark:text-amber-300/80 mb-1">Pending</p>
              <div className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                NPR {totalPending.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-red-200/50 dark:border-red-800/50 bg-gradient-to-br from-red-50/80 to-rose-50/60 dark:from-red-950/50 dark:to-rose-950/30 hover:shadow-md transition-all duration-200 group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 dark:bg-red-400/20 flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <TrendingDown className="h-3 w-3 text-red-500/60" />
              </div>
              <p className="text-xs font-medium text-red-700/80 dark:text-red-300/80 mb-1">Failed</p>
              <div className="text-lg font-semibold text-red-700 dark:text-red-300">
                NPR {totalFailed.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-purple-200/50 dark:border-purple-800/50 bg-gradient-to-br from-purple-50/80 to-violet-50/60 dark:from-purple-950/50 dark:to-violet-950/30 hover:shadow-md transition-all duration-200 group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 dark:bg-purple-400/20 flex items-center justify-center">
                  <ArrowDownLeft className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <RefreshCw className="h-3 w-3 text-purple-500/60" />
              </div>
              <p className="text-xs font-medium text-purple-700/80 dark:text-purple-300/80 mb-1">Refunded</p>
              <div className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                NPR {totalRefunded.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-950/50 dark:to-indigo-950/30 hover:shadow-md transition-all duration-200 group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 dark:bg-blue-400/20 flex items-center justify-center">
                  <MoveHorizontal className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <Timer className="h-3 w-3 text-blue-500/60" />
              </div>
              <p className="text-xs font-medium text-blue-700/80 dark:text-blue-300/80 mb-1">Processing</p>
              <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                NPR {totalProcessing.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Compact Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Payment Type</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="digital_wallet">Digital Wallet</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input 
                      value={search} 
                      onChange={e => setSearch(e.target.value)} 
                      placeholder="Search transactions..." 
                      className="h-9 pl-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Refined Payment List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <CardTitle className="text-lg font-semibold">Payment History</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    {count} filtered
                  </Badge>
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    {totalPayments} total
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-2 px-2 py-1">
                <AnimatePresence mode="wait">
                  {!loading && items.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="p-8 text-center"
                    >
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Receipt className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        No payments found
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
                        Your payment history will appear here. Complete your first booking to see transactions.
                      </p>
                      <Button 
                        onClick={() => router.push('/services')}
                        size="sm"
                        className="h-9 px-4"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Browse Services
                      </Button>
                    </motion.div>
                  )}
                  
                  {loading && (
                    <PaymentListSkeleton />
                  )}
                  
                  {!loading && items.map((p, index) => {
                    // First item gets extra styling emphasis with colored border always showing
                    const isFirstItem = index === 0;
                    
                    // Function to get status-based color names for light theme
                    const getLightStatusColor = (status: string) => {
                      switch (status) {
                        case 'completed':
                          return 'emerald-500'
                        case 'pending':
                          return 'amber-500'
                        case 'failed':
                        case 'cancelled':
                          return 'red-500'
                        case 'processing':
                          return 'blue-500'
                        case 'refunded':
                          return 'purple-500'
                        default:
                          return 'blue-500'
                      }
                    };
                    
                    // Function to get status-based color names for dark theme
                    const getDarkStatusColor = (status: string) => {
                      switch (status) {
                        case 'completed':
                          return 'emerald-400'
                        case 'pending':
                          return 'amber-400'
                        case 'failed':
                        case 'cancelled':
                          return 'red-400'
                        case 'processing':
                          return 'blue-400'
                        case 'refunded':
                          return 'purple-400'
                        default:
                          return 'blue-400'
                      }
                    };
                    
                    // Function to get border class with color
                    const getBorderColor = (status: string) => {
                      return `border-${getLightStatusColor(status)}`;
                    };
                    
                    // No need for hover border enhancement
                    
                    const getStatusStyle = (status: string) => {
                      switch (status) {
                        case 'completed':
                          return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        case 'pending':
                          return 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        case 'failed':
                          return 'text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-300 border border-red-200 dark:border-red-800'
                        case 'processing':
                          return 'text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        case 'refunded':
                          return 'text-purple-700 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        default:
                          return 'text-gray-700 bg-gray-50 dark:bg-gray-950/30 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                      }
                    }
                    
                    // Function already defined above
                    
                    // Enhanced function to get status-based hover border colors
                    const getHoverBorderColor = (status: string) => {
                      switch (status) {
                        case 'completed':
                          return 'hover:border-emerald-500 dark:hover:border-emerald-400'
                        case 'pending':
                          return 'hover:border-amber-500 dark:hover:border-amber-400'
                        case 'failed':
                        case 'cancelled':
                          return 'hover:border-red-500 dark:hover:border-red-400'
                        case 'processing':
                          return 'hover:border-blue-500 dark:hover:border-blue-400'
                        case 'refunded':
                          return 'hover:border-purple-500 dark:hover:border-purple-400'
                        default:
                          return 'hover:border-blue-400 dark:hover:border-blue-500'
                      }
                    }
                    
                    // Enhanced function to get status-based hover background colors
                    const getHoverBgColor = (status: string) => {
                      switch (status) {
                        case 'completed':
                          return 'hover:from-emerald-50/80 hover:to-green-50/60 dark:hover:from-emerald-950/30 dark:hover:to-green-950/20'
                        case 'pending':
                          return 'hover:from-amber-50/80 hover:to-yellow-50/60 dark:hover:from-amber-950/30 dark:hover:to-yellow-950/20'
                        case 'failed':
                        case 'cancelled':
                          return 'hover:from-red-50/80 hover:to-rose-50/60 dark:hover:from-red-950/30 dark:hover:to-rose-950/20'
                        case 'processing':
                          return 'hover:from-blue-50/80 hover:to-indigo-50/60 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/20'
                        case 'refunded':
                          return 'hover:from-purple-50/80 hover:to-violet-50/60 dark:hover:from-purple-950/30 dark:hover:to-violet-950/20'
                        default:
                          return 'hover:from-blue-50/80 hover:to-indigo-50/60 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/20'
                      }
                    }
                    
                    // Enhanced function to get status-based hover text colors
                    const getHoverTextColor = (status: string) => {
                      switch (status) {
                        case 'completed':
                          return 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                        case 'pending':
                          return 'group-hover:text-amber-600 dark:group-hover:text-amber-400'
                        case 'failed':
                        case 'cancelled':
                          return 'group-hover:text-red-600 dark:group-hover:text-red-400'
                        case 'processing':
                          return 'group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        case 'refunded':
                          return 'group-hover:text-purple-600 dark:group-hover:text-purple-400'
                        default:
                          return 'group-hover:text-blue-600 dark:group-hover:text-blue-400'
                      }
                    }
                    
                    const getStatusIcon = (status: string) => {
                      switch (status) {
                        case 'completed':
                          return <CheckCircle2 className="h-3 w-3" />
                        case 'pending':
                          return <Clock className="h-3 w-3" />
                        case 'failed':
                          return <XCircle className="h-3 w-3" />
                        case 'processing':
                          return <RefreshCw className="h-3 w-3 animate-spin" />
                        case 'refunded':
                          return <RefreshCw className="h-3 w-3" />
                        default:
                          return <AlertCircle className="h-3 w-3" />
                      }
                    }
                    
                    const getPaymentIcon = (status: string, paymentType: string) => {
                      if (status === 'completed') return CheckCircle2
                      if (status === 'failed') return XCircle
                      if (status === 'refunded') return ArrowDownLeft
                      if (paymentType === 'cash') return Wallet
                      return CreditCard
                    }
                    
                    const PaymentIcon = getPaymentIcon(p.status, p.payment_type)
                    
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
                        whileHover={{ 
                          scale: 1.01, 
                          transition: { duration: 0.2, ease: "easeOut" }
                        }}
                        className={`group p-4 hover:bg-gradient-to-r ${getHoverBgColor(p.status)} transition-all duration-300 cursor-pointer rounded-lg border-l-[6px] 
                          ${isFirstItem 
                            ? `border-${getLightStatusColor(p.status)} dark:border-${getDarkStatusColor(p.status)}` 
                            : 'border-gray-200 dark:border-gray-700'
                          }
                          hover:border-${getLightStatusColor(p.status)}
                          dark:hover:border-${getDarkStatusColor(p.status)}
                          hover:shadow-md relative overflow-visible my-1 ${isFirstItem ? 'shadow-sm' : ''}`}
                        onClick={() => onClickRow(p)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Compact payment icon */}
                          <motion.div 
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${getStatusStyle(p.status)} flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
                            whileHover={{ rotate: 5 }}
                          >
                            <PaymentIcon className="h-4 w-4" />
                          </motion.div>
                          
                          {/* Payment details - responsive layout */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                  Booking #{p.booking}
                                </h3>
                                <Badge className={`text-xs px-2 py-0.5 font-medium ${getStatusStyle(p.status)}`}>
                                  <div className="flex items-center gap-1">
                                    {getStatusIcon(p.status)}
                                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                                  </div>
                                </Badge>
                              </div>
                              
                              {/* Amount - always visible */}
                              <div className="text-right flex-shrink-0">
                                <motion.div 
                                  className={`text-lg font-bold text-gray-900 dark:text-gray-100 ${getHoverTextColor(p.status)} transition-colors duration-200`}
                                  whileHover={{ scale: 1.05 }}
                                >
                                  NPR {(p.total_amount || p.amount).toLocaleString()}
                                </motion.div>
                              </div>
                            </div>
                            
                            {/* Transaction info */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Wallet className="h-3 w-3" />
                                  {p.payment_type.replace('_', ' ').toUpperCase()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(p.created_at).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </span>
                                {p.paid_at && (
                                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Paid
                                  </span>
                                )}
                              </div>
                              
                              {/* Actions */}
                              <div className="flex items-center gap-1">
                                {p.payment_type === 'cash' && p.status === 'pending' && (
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="h-7 px-2 text-xs font-medium hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 dark:hover:border-blue-700 transition-all duration-200"
                                      onClick={(e) => { e.stopPropagation(); onClickPayNow(p); }}
                                    >
                                      <CreditCard className="h-3 w-3 mr-1" />
                                      Pay Now
                                    </Button>
                                  </motion.div>
                                )}
                                
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="relative"
                                >
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-all duration-300 
                                      bg-white dark:bg-gray-800
                                      border-gray-300 hover:border-blue-500 
                                      dark:border-gray-600 dark:hover:border-blue-400
                                      text-gray-700 hover:text-blue-600 
                                      dark:text-gray-300 dark:hover:text-blue-400
                                      hover:bg-blue-50 dark:hover:bg-blue-900/30
                                      hover:shadow-sm relative"
                                    onClick={(e) => { e.stopPropagation(); onClickRow(p); }}
                                  >
                                    <Eye className="h-3 w-3 mr-1 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
                                    View
                                  </Button>
                                </motion.div>
                              </div>
                            </div>
                            
                            {/* Transaction ID - clickable copy */}
                            <div className="mt-1">
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyTransactionId(p.transaction_id)
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`inline-flex items-center gap-1 text-xs font-mono text-gray-400 dark:text-gray-500 ${getHoverTextColor(p.status).replace('group-hover:', 'hover:')} transition-all duration-200 cursor-pointer group/copy`}
                              >
                                <span>{p.transaction_id}</span>
                                {copiedId === p.transaction_id ? (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                  >
                                    <Check className="h-3 w-3 text-green-500" />
                                  </motion.div>
                                ) : (
                                  <Copy className="h-3 w-3 opacity-0 group-hover/copy:opacity-100 transition-opacity duration-200" />
                                )}
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
              
              {/* Compact Pagination */}
              {count > pageSize && (
                <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                      className="h-8 px-3 text-sm"
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>Page {page} of {Math.ceil(count / pageSize)}</span>
                      <span className="text-gray-400">•</span>
                      <span>{count} payments</span>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={(page * pageSize) >= count}
                      onClick={() => setPage(p => p + 1)}
                      className="h-8 px-3 text-sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Enhanced Pay Now Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Select Payment Method
            </DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Choose a digital payment method to complete your transaction
            </p>
          </DialogHeader>
          <div className="space-y-3">
            {paymentMethods.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {paymentMethods.map((m) => (
                  <Button 
                    key={m.id} 
                    variant="outline" 
                    disabled={initiating} 
                    onClick={() => startDigitalPayment(m.id)} 
                    className="h-16 flex items-center justify-start gap-3 p-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{m.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{m.payment_type.replace('_', ' ')}</div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">No digital payment methods available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Transaction Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Transaction Details
            </DialogTitle>
          </DialogHeader>
          
          {loadingBookingDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading booking details...</span>
            </div>
          ) : detailPayment && (
            <div className="space-y-6">
              {/* Booking Information Section */}
              {detailPayment.booking_details ? (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 dark:bg-blue-400/20 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Booking Information</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Service Name */}
                    <div>
                      <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                        {detailPayment.booking_details.service_name}
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        by {detailPayment.booking_details.provider_name}
                      </p>
                    </div>
                    
                    {/* Date and Time */}
                    {detailPayment.booking_details.scheduled_date && detailPayment.booking_details.scheduled_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          {new Date(detailPayment.booking_details.scheduled_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })} at {detailPayment.booking_details.scheduled_time}
                        </span>
                      </div>
                    )}
                    
                    {/* Location */}
                    {detailPayment.booking_details.location && (
                      <div className="flex items-start gap-2">
                        <div className="w-4 h-4 mt-0.5">
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-sm text-blue-800 dark:text-blue-200">
                          {detailPayment.booking_details.location}
                        </span>
                      </div>
                    )}
                    
                    {/* Booking Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Booking Status:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        detailPayment.booking_details.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        detailPayment.booking_details.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        detailPayment.booking_details.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                      }`}>
                        {detailPayment.booking_details.status.charAt(0).toUpperCase() + detailPayment.booking_details.status.slice(1)}
                      </span>
                    </div>
                    
                    {/* Notes if available */}
                    {detailPayment.booking_details.notes && (
                      <div className="bg-blue-100/50 dark:bg-blue-900/20 rounded-md p-3">
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Notes:</p>
                        <p className="text-sm text-blue-800 dark:text-blue-200">{detailPayment.booking_details.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Booking details unavailable</span>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Could not load detailed booking information for this payment.
                  </p>
                </div>
              )}

              {/* Payment Information Section */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-500/15 dark:bg-gray-400/20 flex items-center justify-center">
                    <Receipt className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Payment Information</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Booking ID</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">#{detailPayment.booking}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Status</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      detailPayment.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                      detailPayment.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                      detailPayment.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                      detailPayment.status === 'processing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                    }`}>
                      {detailPayment.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                      {detailPayment.status === 'pending' && <Clock className="h-3 w-3" />}
                      {detailPayment.status === 'failed' && <XCircle className="h-3 w-3" />}
                      {detailPayment.status === 'processing' && <RefreshCw className="h-3 w-3 animate-spin" />}
                      <span className="capitalize">{detailPayment.status}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction ID with copy */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Transaction ID</span>
                <button
                  onClick={() => copyTransactionId(detailPayment.transaction_id)}
                  className="w-full flex items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                >
                  <span className="font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
                    {detailPayment.transaction_id}
                  </span>
                  {copiedId === detailPayment.transaction_id ? (
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                  )}
                </button>
              </div>

              {/* Amount */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="text-center">
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">Total Amount</span>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                    NPR {(detailPayment.total_amount || detailPayment.amount).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Payment details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Type</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                    {detailPayment.payment_type.replace('_',' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(detailPayment.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {detailPayment.paid_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid At</span>
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                      {new Date(detailPayment.paid_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Button 
                  variant="default" 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 ease-out group border-0"
                  onClick={() => {
                    try {
                      router.push(`/bookings/${detailPayment.booking}/payment`)
                    } catch (navigationError) {
                      console.error('Navigation error:', navigationError)
                      showToast.error({
                        title: "Navigation Error",
                        description: "Could not navigate to payment page. Please try again.",
                        duration: 3000
                      })
                    }
                  }}
                >
                  <Eye className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
                  <span className="font-medium">View Payment</span>
                  <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1" />
                </Button>
                {detailPayment.payment_type === 'cash' && detailPayment.status === 'pending' && (
                  <Button 
                    className="flex-1"
                    onClick={() => { 
                      setDetailsOpen(false) 
                      onClickPayNow(detailPayment) 
                    }}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Now
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}