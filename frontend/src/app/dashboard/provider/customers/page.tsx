"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { showToast } from "@/components/ui/enhanced-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Search,
  Filter,
  Star,
  Calendar,
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  Download,
  Users,
  MessageSquare,
  RefreshCw,
  UserCheck,
  UserX,
  Heart,
  Eye,
  Edit,
  Trash2,
  Plus,
  TrendingUp,
  Activity,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react"

import { providerApi } from "@/services/provider.api"
import { useAuth } from "@/contexts/AuthContext"
import { EnhancedStatsCard } from "@/components/provider/EnhancedStatsCard"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
      duration: 0.4
    }
  }
}

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      type: "spring" as const,
      damping: 20,
      stiffness: 100
    }
  }
}

// Types
interface CustomerRelation {
  id: number
  customer: {
    id: number
    first_name: string
    last_name: string
    email: string
    phone?: string
    profile_picture?: string
    city?: string
    date_joined: string
  }
  total_bookings: number
  total_spent: number
  average_rating: number
  is_favorite_customer: boolean
  is_blocked: boolean
  first_booking_date?: string
  last_booking_date?: string
  notes?: string
  customer_status: 'new' | 'returning' | 'regular' | 'favorite' | 'blocked'
  days_since_last_booking?: number
  created_at: string
  updated_at: string
}

interface CustomerStats {
  total_customers: number
  regular_customers: number
  new_customers_this_month: number
  active_chats: number
  average_rating: number
  retention_rate: number
}

interface RecentActivity {
  id: string
  type: 'booking' | 'message' | 'review' | 'payment'
  customer_name: string
  customer_id: number
  title: string
  description: string
  timestamp: string
  status?: string
  amount?: number
  rating?: number
}



// Customer Status Badge Component
const CustomerStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className = "" }) => {
  const statusConfig = {
    new: { label: 'New', variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/40' },
    returning: { label: 'Returning', variant: 'outline' as const, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800/40' },
    regular: { label: 'Regular', variant: 'default' as const, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/40' },
    favorite: { label: 'Favorite', variant: 'default' as const, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800/40' },
    blocked: { label: 'Blocked', variant: 'destructive' as const, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/40' }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new

  return (
    <Badge className={`transition-colors duration-200 ${config.color} ${className}`}>
      {config.label}
    </Badge>
  )
}

export default function CustomerManagement() {
  const { user } = useAuth()
  
  // State management
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Data state
  const [customers, setCustomers] = useState<CustomerRelation[]>([])
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  
  // UI state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("last_booking_date")
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRelation | null>(null)
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false)
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)
  const [customerNotes, setCustomerNotes] = useState("")

  // Load customer data
  const loadCustomerData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      // Load customer relations and stats
      const [customersResponse, statsResponse, activityResponse] = await Promise.allSettled([
        providerApi.getProviderCustomers(),
        providerApi.getCustomerStats(),
        providerApi.getRecentCustomerActivity()
      ])

      // Handle customers data
      if (customersResponse.status === 'fulfilled') {
        const customerData = customersResponse.value.results || customersResponse.value || []
        console.log('🔍 Customer data received:', customerData)
        console.log('🔍 First customer profile_picture:', customerData[0]?.customer?.profile_picture)
        console.log('🔍 First customer full data:', customerData[0]?.customer)
        setCustomers(customerData)
      } else {
        console.warn('Failed to load customers:', customersResponse.reason)
      }

      // Handle stats data
      if (statsResponse.status === 'fulfilled') {
        setStats(statsResponse.value)
      } else {
        console.warn('Failed to load customer stats:', statsResponse.reason)
        // Set fallback stats
        setStats({
          total_customers: customers.length,
          regular_customers: customers.filter(c => c.customer_status === 'regular').length,
          new_customers_this_month: customers.filter(c => {
            const joinDate = new Date(c.customer.date_joined)
            const now = new Date()
            return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear()
          }).length,
          active_chats: 0,
          average_rating: customers.reduce((sum, c) => sum + c.average_rating, 0) / Math.max(customers.length, 1),
          retention_rate: 0
        })
      }

      // Handle activity data
      if (activityResponse.status === 'fulfilled') {
        setRecentActivity(activityResponse.value || [])
      } else {
        console.warn('Failed to load recent activity:', activityResponse.reason)
        setRecentActivity([])
      }

    } catch (error: any) {
      console.error('Error loading customer data:', error)
      setError('Failed to load customer data. Please try again.')
      showToast.error({
        title: "Error Loading Data",
        description: "Failed to load customer information. Please try again.",
        duration: 5000
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [customers])

  // Initial load
  useEffect(() => {
    loadCustomerData()
  }, [loadCustomerData])

  // Filter and sort customers
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(customer => 
        customer.customer.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.customer.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.customer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(customer => customer.customer_status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.customer.first_name} ${a.customer.last_name}`.localeCompare(`${b.customer.first_name} ${b.customer.last_name}`)
        case 'total_bookings':
          return b.total_bookings - a.total_bookings
        case 'total_spent':
          return b.total_spent - a.total_spent
        case 'last_booking_date':
          return new Date(b.last_booking_date || 0).getTime() - new Date(a.last_booking_date || 0).getTime()
        case 'average_rating':
          return b.average_rating - a.average_rating
        default:
          return 0
      }
    })

    return filtered
  }, [customers, searchQuery, statusFilter, sortBy])

  // Customer actions
  const handleToggleFavorite = useCallback(async (customerId: number, isFavorite: boolean) => {
    try {
      await providerApi.toggleCustomerFavorite(customerId, !isFavorite)
      
      setCustomers(prev => prev.map(customer => {
        if (customer.id === customerId) {
          const updatedCustomer = { 
            ...customer, 
            is_favorite_customer: !isFavorite 
          }
          
          // Update customer_status based on the new state
          if (updatedCustomer.is_blocked) {
            updatedCustomer.customer_status = 'blocked'
          } else if (updatedCustomer.is_favorite_customer) {
            updatedCustomer.customer_status = 'favorite'
          } else {
            // Reset to original status based on booking history
            if (updatedCustomer.total_bookings === 0) {
              updatedCustomer.customer_status = 'new'
            } else if (updatedCustomer.total_bookings === 1) {
              updatedCustomer.customer_status = 'returning'
            } else {
              updatedCustomer.customer_status = 'regular'
            }
          }
          
          return updatedCustomer
        }
        return customer
      }))

      showToast.success({
        title: "Success",
        description: `Customer ${!isFavorite ? 'added to' : 'removed from'} favorites`,
        duration: 3000
      })
    } catch (error: any) {
      showToast.error({
        title: "Error",
        description: error.message || "Failed to update customer status",
        duration: 5000
      })
    }
  }, [])

  const handleToggleBlock = useCallback(async (customerId: number, isBlocked: boolean) => {
    try {
      await providerApi.toggleCustomerBlock(customerId, !isBlocked)
      
      setCustomers(prev => prev.map(customer => {
        if (customer.id === customerId) {
          const updatedCustomer = { 
            ...customer, 
            is_blocked: !isBlocked 
          }
          
          // Update customer_status based on the new state
          if (updatedCustomer.is_blocked) {
            updatedCustomer.customer_status = 'blocked'
          } else if (updatedCustomer.is_favorite_customer) {
            updatedCustomer.customer_status = 'favorite'
          } else {
            // Reset to original status based on booking history
            if (updatedCustomer.total_bookings === 0) {
              updatedCustomer.customer_status = 'new'
            } else if (updatedCustomer.total_bookings === 1) {
              updatedCustomer.customer_status = 'returning'
            } else {
              updatedCustomer.customer_status = 'regular'
            }
          }
          
          return updatedCustomer
        }
        return customer
      }))

      showToast.success({
        title: "Success",
        description: `Customer ${!isBlocked ? 'blocked' : 'unblocked'} successfully`,
        duration: 3000
      })
    } catch (error: any) {
      showToast.error({
        title: "Error",
        description: error.message || "Failed to update customer status",
        duration: 5000
      })
    }
  }, [])

  const handleSaveNotes = useCallback(async () => {
    if (!selectedCustomer) return

    try {
      await providerApi.updateCustomerRelation(selectedCustomer.id, { notes: customerNotes })
      
      setCustomers(prev => prev.map(customer => 
        customer.id === selectedCustomer.id 
          ? { ...customer, notes: customerNotes }
          : customer
      ))

      setNotesDialogOpen(false)
      showToast.success({
        title: "Success",
        description: "Customer notes updated successfully",
        duration: 3000
      })
    } catch (error: any) {
      showToast.error({
        title: "Error",
        description: error.message || "Failed to update customer notes",
        duration: 5000
      })
    }
  }, [selectedCustomer, customerNotes])

  const openCustomerDetails = useCallback((customer: CustomerRelation) => {
    setSelectedCustomer(customer)
    setCustomerDetailsOpen(true)
  }, [])

  const openNotesDialog = useCallback((customer: CustomerRelation) => {
    setSelectedCustomer(customer)
    setCustomerNotes(customer.notes || "")
    setNotesDialogOpen(true)
  }, [])

  // Export functionality
  const handleExportCustomers = useCallback(async () => {
    try {
      const blob = await providerApi.exportCustomerData('csv')
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `customers-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      
      showToast.success({
        title: "Export Complete",
        description: "Customer data exported successfully",
        duration: 3000
      })
    } catch (error: any) {
      showToast.error({
        title: "Export Failed",
        description: error.message || "Failed to export customer data",
        duration: 5000
      })
    }
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* Header skeleton */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-xl" />
                </div>
              </Card>
            ))}
          </div>

          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <Skeleton className="h-6 w-32" />
                <div className="flex gap-4 w-full lg:w-auto">
                  <Skeleton className="h-10 w-40" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="hidden lg:grid grid-cols-4 gap-4 px-4 py-2 border-b border-border text-sm font-medium text-muted-foreground">
                  <div>Customer</div>
                  <div>Contact</div>
                  <div>Bookings</div>
                  <div>Status/Actions</div>
                </div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex flex-col lg:grid lg:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <div className="flex items-center justify-end lg:justify-start gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-3/4" />
                    <div className="flex items-center gap-2 mt-3">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          
          <div className="text-center py-4 text-muted-foreground text-sm">
            <p>Loading customer data...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div 
      className="container mx-auto p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        variants={cardVariants}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your customer relationships and track engagement
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => loadCustomerData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 transition-all duration-200 hover:shadow-md"
          >
            <RefreshCw className={`h-4 w-4 transition-transform duration-300 ${refreshing ? 'animate-spin' : 'hover:rotate-180'}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportCustomers}
            className="transition-all duration-200 hover:shadow-md"
          >
            <Download className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:translate-y-[-2px]" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="mx-auto mb-4 p-3 bg-red-100 dark:bg-red-950/30 rounded-full w-16 h-16 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-red-800 dark:text-red-200">Unable to Load Customer Data</h3>
                <p className="text-red-700 dark:text-red-300 mb-6 max-w-md mx-auto">
                  {error}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button 
                    variant="default" 
                    onClick={() => loadCustomerData(true)}
                    disabled={refreshing}
                    className="bg-red-600 hover:bg-red-700 text-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 transition-transform duration-300 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                    {refreshing ? 'Retrying...' : 'Try Again'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setError(null);
                      loadCustomerData();
                    }}
                    className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <XCircle className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                    Dismiss
                  </Button>
                </div>
                <div className="mt-6 pt-4 border-t border-red-100 dark:border-red-900/50 text-left max-w-md mx-auto">
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Troubleshooting Tips:</h4>
                  <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                    <li>• Check your internet connection</li>
                    <li>• Refresh the page</li>
                    <li>• Try again in a few minutes</li>
                    <li>• Contact support if the issue persists</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Cards */}
      <motion.div 
        variants={cardVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <EnhancedStatsCard
          title="Total Customers"
          value={stats?.total_customers || customers.length}
          subtitle="All time customers"
          icon={Users}
          tone="primary"
        />
        <EnhancedStatsCard
          title="Regular Customers"
          value={stats?.regular_customers || customers.filter(c => c.customer_status === 'regular').length}
          subtitle="Repeat customers"
          icon={Star}
          tone="success"
        />
        <EnhancedStatsCard
          title="This Month"
          value={stats?.new_customers_this_month || 0}
          subtitle="New customers"
          icon={Calendar}
          tone="info"
        />
        <EnhancedStatsCard
          title="Avg Rating"
          value={stats?.average_rating ? stats.average_rating.toFixed(1) : '0.0'}
          subtitle="Customer satisfaction"
          icon={MessageSquare}
          tone="warning"
        />
      </motion.div>

      {/* Blocked and Favorite Customers Summary */}
      <motion.div variants={cardVariants} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Favorite Customers */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-semibold">Favorite Customers</h3>
              </div>
              <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                {customers.filter(c => c.is_favorite_customer).length}
              </Badge>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {customers.filter(c => c.is_favorite_customer).length > 0 ? (
                customers.filter(c => c.is_favorite_customer).slice(0, 5).map((customer) => (
                  <div key={customer.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                       onClick={() => openCustomerDetails(customer)}>
                    <div className="relative">
                      {customer.customer.profile_picture ? (
                        <Image
                          src={(() => {
                            let finalUrl;
                            if (customer.customer.profile_picture.startsWith('http')) {
                              finalUrl = customer.customer.profile_picture;
                            } else if (customer.customer.profile_picture.startsWith('/media/')) {
                              finalUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}${customer.customer.profile_picture}`;
                            } else if (customer.customer.profile_picture.startsWith('/')) {
                              finalUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}${customer.customer.profile_picture}`;
                            } else {
                              finalUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/${customer.customer.profile_picture}`;
                            }
                            return finalUrl;
                          })()}
                          alt={`${customer.customer.first_name} ${customer.customer.last_name}`}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white text-xs font-semibold ${customer.customer.profile_picture ? 'hidden' : ''}`}>
                        {customer.customer.first_name.charAt(0)}{customer.customer.last_name.charAt(0)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {customer.customer.first_name} {customer.customer.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {customer.total_bookings} bookings • NPR {customer.total_spent.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <span className="text-xs">{customer.average_rating.toFixed(1)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Heart className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm">No favorite customers yet</p>
                  <p className="text-xs">Mark customers as favorites to see them here</p>
                </div>
              )}
              {customers.filter(c => c.is_favorite_customer).length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setStatusFilter("favorite")}>
                    View all {customers.filter(c => c.is_favorite_customer).length} favorites
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Blocked Customers */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-semibold">Blocked Customers</h3>
              </div>
              <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                {customers.filter(c => c.is_blocked).length}
              </Badge>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {customers.filter(c => c.is_blocked).length > 0 ? (
                customers.filter(c => c.is_blocked).slice(0, 5).map((customer) => (
                  <div key={customer.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                       onClick={() => openCustomerDetails(customer)}>
                    <div className="relative">
                      {customer.customer.profile_picture ? (
                        <Image
                          src={(() => {
                            let finalUrl;
                            if (customer.customer.profile_picture.startsWith('http')) {
                              finalUrl = customer.customer.profile_picture;
                            } else if (customer.customer.profile_picture.startsWith('/media/')) {
                              finalUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}${customer.customer.profile_picture}`;
                            } else if (customer.customer.profile_picture.startsWith('/')) {
                              finalUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}${customer.customer.profile_picture}`;
                            } else {
                              finalUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/${customer.customer.profile_picture}`;
                            }
                            return finalUrl;
                          })()}
                          alt={`${customer.customer.first_name} ${customer.customer.last_name}`}
                          width={32}
                          height={32}
                          className="rounded-full object-cover grayscale"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white text-xs font-semibold ${customer.customer.profile_picture ? 'hidden' : ''}`}>
                        {customer.customer.first_name.charAt(0)}{customer.customer.last_name.charAt(0)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate text-muted-foreground">
                        {customer.customer.first_name} {customer.customer.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {customer.total_bookings} bookings • NPR {customer.total_spent.toLocaleString()}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBlock(customer.id, customer.is_blocked);
                      }}
                      className="text-xs"
                    >
                      Unblock
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <UserX className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm">No blocked customers</p>
                  <p className="text-xs">Blocked customers will appear here</p>
                </div>
              )}
              {customers.filter(c => c.is_blocked).length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setStatusFilter("blocked")}>
                    View all {customers.filter(c => c.is_blocked).length} blocked
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <motion.div variants={cardVariants} className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <h2 className="text-xl font-semibold">All Customers</h2>
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <div className="relative transition-all duration-200 focus-within:scale-[1.02]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" />
                  <Input
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full sm:w-[300px] transition-all duration-200 focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] transition-all duration-200 hover:shadow-sm focus:ring-2 focus:ring-primary/30">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="returning">Returning</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="favorite">Favorite</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[150px] transition-all duration-200 hover:shadow-sm focus:ring-2 focus:ring-primary/30">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last_booking_date">Last Booking</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="total_bookings">Total Bookings</SelectItem>
                    <SelectItem value="total_spent">Total Spent</SelectItem>
                    <SelectItem value="average_rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Status/Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredAndSortedCustomers.map((customer, index) => (
                      <motion.tr
                        key={customer.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-muted/50 transition-all duration-200 cursor-pointer transform hover:scale-[1.01] hover:shadow-sm"
                        onClick={() => openCustomerDetails(customer)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {customer.customer.profile_picture ? (
                                <Image
                                  src={(() => {
                                    let finalUrl;
                                    if (customer.customer.profile_picture.startsWith('http')) {
                                      // Already absolute URL
                                      finalUrl = customer.customer.profile_picture;
                                    } else if (customer.customer.profile_picture.startsWith('/media/')) {
                                      // Django media URL - use backend URL
                                      finalUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}${customer.customer.profile_picture}`;
                                    } else if (customer.customer.profile_picture.startsWith('/')) {
                                      // Other absolute path - use backend URL
                                      finalUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}${customer.customer.profile_picture}`;
                                    } else {
                                      // Relative path - use API URL
                                      finalUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/${customer.customer.profile_picture}`;
                                    }
                                    console.log('🖼️ Image URL for', customer.customer.first_name, ':', finalUrl);
                                    console.log('🖼️ Original profile_picture:', customer.customer.profile_picture);
                                    console.log('🖼️ Backend URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
                                    console.log('🖼️ API URL:', process.env.NEXT_PUBLIC_API_URL);
                                    return finalUrl;
                                  })()}
                                  alt={`${customer.customer.first_name} ${customer.customer.last_name}`}
                                  width={40}
                                  height={40}
                                  className="rounded-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    console.log('❌ Image failed to load:', target.src);
                                    target.style.display = 'none';
                                    const fallback = target.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                  onLoad={() => {
                                    console.log('✅ Image loaded successfully for', customer.customer.first_name);
                                  }}
                                />
                              ) : (
                                console.log('❌ No profile_picture for', customer.customer.first_name),
                                null
                              )}
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold ${customer.customer.profile_picture ? 'hidden' : ''}`}>
                                {customer.customer.first_name.charAt(0)}{customer.customer.last_name.charAt(0)}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">
                                {customer.customer.first_name} {customer.customer.last_name}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[200px]">{customer.customer.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {customer.total_bookings} bookings
                            </div>
                            <div className="text-sm text-muted-foreground">
                              NPR {customer.total_spent.toLocaleString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CustomerStatusBadge status={customer.customer_status} />
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(customer.id, customer.is_favorite_customer);
                              }}
                              className={`transition-all duration-200 ${customer.is_favorite_customer ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50" : "text-gray-400 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/30"}`}
                              title={customer.is_favorite_customer ? "Remove from favorites" : "Add to favorites"}
                            >
                              <Heart className={`h-4 w-4 transition-colors duration-200 ${customer.is_favorite_customer ? 'fill-current' : ''}`} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleBlock(customer.id, customer.is_blocked);
                              }}
                              className={`transition-all duration-200 ${customer.is_blocked ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50" : "text-gray-400 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/30"}`}
                              title={customer.is_blocked ? "Unblock customer" : "Block customer"}
                            >
                              {customer.is_blocked ? <UserX className="h-4 w-4 transition-colors duration-200" /> : <UserCheck className="h-4 w-4 transition-colors duration-200" />}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={(e) => e.stopPropagation()}
                                  className="transition-all duration-200 hover:bg-accent hover:rotate-90"
                                >
                                  <MoreVertical className="h-4 w-4 transition-transform duration-200" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  openCustomerDetails(customer)
                                }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  openNotesDialog(customer)
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Notes
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleToggleFavorite(customer.id, customer.is_favorite_customer)
                                  }}
                                  className="transition-colors duration-200 hover:bg-accent"
                                >
                                  <Heart className={`h-4 w-4 mr-2 transition-colors duration-200 ${customer.is_favorite_customer ? 'fill-current text-red-500' : 'text-gray-500'}`} />
                                  {customer.is_favorite_customer ? 'Remove from Favorites' : 'Add to Favorites'}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleToggleBlock(customer.id, customer.is_blocked)
                                  }}
                                  className={`transition-colors duration-200 hover:bg-accent ${customer.is_blocked ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'}`}
                                >
                                  {customer.is_blocked ? (
                                    <>
                                      <UserCheck className="h-4 w-4 mr-2 transition-colors duration-200" />
                                      Unblock Customer
                                    </>
                                  ) : (
                                    <>
                                      <UserX className="h-4 w-4 mr-2 transition-colors duration-200" />
                                      Block Customer
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>

              {filteredAndSortedCustomers.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <div className="mx-auto mb-6 p-4 bg-muted rounded-full w-24 h-24 flex items-center justify-center">
                    <Users className="h-12 w-12 text-muted-foreground" />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">
                    {searchQuery || statusFilter !== "all" 
                      ? "No matching customers found" 
                      : "No customers yet"}
                  </h3>
                  
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {searchQuery || statusFilter !== "all" 
                      ? "Try adjusting your search or filter criteria to find what you're looking for."
                      : "You don't have any customers yet. Start providing services to build your customer base."}
                  </p>
                  
                  {searchQuery || statusFilter !== "all" ? (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSearchQuery("")
                          setStatusFilter("all")
                        }}
                        className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                      >
                        <Filter className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:rotate-180" />
                        Clear Filters
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => loadCustomerData(true)}
                        className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                      >
                        <RefreshCw className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:rotate-180" />
                        Refresh Data
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Button 
                        asChild
                        className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                      >
                        <Link href="/dashboard/provider/services">
                          <Plus className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                          Add Services
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => loadCustomerData(true)}
                        className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                      >
                        <RefreshCw className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:rotate-180" />
                        Refresh Data
                      </Button>
                    </div>
                  )}
                  
                  <div className="mt-8 pt-6 border-t border-border max-w-lg mx-auto text-left">
                    <h4 className="font-medium mb-3">Tips to attract customers:</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Complete your service listings with detailed descriptions and clear pricing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Respond quickly to customer inquiries and booking requests</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Encourage satisfied customers to leave reviews</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={cardVariants}>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                    >
                      <div className={`p-2 rounded-full ${
                        activity.type === 'booking' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'message' ? 'bg-green-100 text-green-600' :
                        activity.type === 'review' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {activity.type === 'booking' && <Calendar className="h-4 w-4" />}
                        {activity.type === 'message' && <MessageSquare className="h-4 w-4" />}
                        {activity.type === 'review' && <Star className="h-4 w-4" />}
                        {activity.type === 'payment' && <DollarSign className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(activity.timestamp), 'MMM dd, HH:mm')}
                          </p>
                          {activity.amount && (
                            <Badge variant="outline" className="text-xs">
                              NPR {activity.amount.toLocaleString()}
                            </Badge>
                          )}
                          {activity.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs">{activity.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-16 h-16 flex items-center justify-center">
                      <Activity className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-1">No recent activity</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                      Customer interactions and activities will appear here once you start providing services.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild
                      className="mt-2"
                    >
                      <Link href="/dashboard/provider/services">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Services
                      </Link>
                    </Button>
                  </motion.div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </motion.div>
      </div>

      {/* Customer Details Dialog */}
      <Dialog open={customerDetailsOpen} onOpenChange={setCustomerDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {selectedCustomer.customer.profile_picture ? (
                    <Image
                      src={(() => {
                        let finalUrl;
                        if (selectedCustomer.customer.profile_picture.startsWith('http')) {
                          finalUrl = selectedCustomer.customer.profile_picture;
                        } else if (selectedCustomer.customer.profile_picture.startsWith('/media/')) {
                          finalUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}${selectedCustomer.customer.profile_picture}`;
                        } else if (selectedCustomer.customer.profile_picture.startsWith('/')) {
                          finalUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}${selectedCustomer.customer.profile_picture}`;
                        } else {
                          finalUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/${selectedCustomer.customer.profile_picture}`;
                        }
                        return finalUrl;
                      })()}
                      alt={`${selectedCustomer.customer.first_name} ${selectedCustomer.customer.last_name}`}
                      width={80}
                      height={80}
                      className="rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-semibold ${selectedCustomer.customer.profile_picture ? 'hidden' : ''}`}>
                    {selectedCustomer.customer.first_name.charAt(0)}{selectedCustomer.customer.last_name.charAt(0)}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedCustomer.customer.first_name} {selectedCustomer.customer.last_name}
                  </h3>
                  <CustomerStatusBadge status={selectedCustomer.customer_status} className="mb-2" />
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm">{selectedCustomer.average_rating.toFixed(1)} average rating</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedCustomer.customer.email}</span>
                    </div>
                    {selectedCustomer.customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedCustomer.customer.phone}</span>
                      </div>
                    )}
                    {selectedCustomer.customer.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedCustomer.customer.city}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Service History</h4>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Total Bookings:</span> {selectedCustomer.total_bookings}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Total Spent:</span> NPR {selectedCustomer.total_spent.toLocaleString()}
                    </div>
                    {selectedCustomer.last_booking_date && (
                      <div className="text-sm">
                        <span className="font-medium">Last Service:</span> {format(new Date(selectedCustomer.last_booking_date), 'MMM dd, yyyy')}
                      </div>
                    )}
                    {selectedCustomer.days_since_last_booking !== undefined && (
                      <div className="text-sm">
                        <span className="font-medium">Days Since Last Booking:</span> {selectedCustomer.days_since_last_booking}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedCustomer.notes && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Notes</h4>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{selectedCustomer.notes}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={() => openNotesDialog(selectedCustomer)}
                  className="transition-all duration-200 hover:shadow-md"
                >
                  <Edit className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                  Edit Notes
                </Button>
                <Button 
                  variant="outline" 
                  asChild
                  className="transition-all duration-200 hover:shadow-md"
                >
                  <Link href={`/dashboard/provider/bookings?customer=${selectedCustomer.customer.id}`}>
                    <Calendar className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:rotate-12" />
                    View Bookings
                  </Link>
                </Button>
                <Button 
                  variant={selectedCustomer.is_favorite_customer ? "outline" : "default"}
                  onClick={() => handleToggleFavorite(selectedCustomer.id, selectedCustomer.is_favorite_customer)}
                  className={`transition-all duration-200 hover:shadow-md ${selectedCustomer.is_favorite_customer ? 'hover:bg-red-50 dark:hover:bg-red-950/50' : ''}`}
                >
                  <Heart className={`h-4 w-4 mr-2 transition-colors duration-200 ${selectedCustomer.is_favorite_customer ? 'fill-current text-red-500' : ''}`} />
                  {selectedCustomer.is_favorite_customer ? 'Remove Favorite' : 'Add Favorite'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer Notes</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {selectedCustomer.customer.profile_picture ? (
                    <Image
                      src={(() => {
                        let finalUrl;
                        if (selectedCustomer.customer.profile_picture.startsWith('http')) {
                          finalUrl = selectedCustomer.customer.profile_picture;
                        } else if (selectedCustomer.customer.profile_picture.startsWith('/media/')) {
                          finalUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}${selectedCustomer.customer.profile_picture}`;
                        } else if (selectedCustomer.customer.profile_picture.startsWith('/')) {
                          finalUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}${selectedCustomer.customer.profile_picture}`;
                        } else {
                          finalUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/${selectedCustomer.customer.profile_picture}`;
                        }
                        return finalUrl;
                      })()}
                      alt={`${selectedCustomer.customer.first_name} ${selectedCustomer.customer.last_name}`}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold ${selectedCustomer.customer.profile_picture ? 'hidden' : ''}`}>
                    {selectedCustomer.customer.first_name.charAt(0)}{selectedCustomer.customer.last_name.charAt(0)}
                  </div>
                </div>
                <div>
                  <p className="font-medium">
                    {selectedCustomer.customer.first_name} {selectedCustomer.customer.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.customer.email}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Notes</label>
                <Textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Add notes about this customer..."
                  className="min-h-[120px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setNotesDialogOpen(false)}
              className="transition-all duration-200 hover:shadow-md"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveNotes}
              className="transition-all duration-200 hover:shadow-md hover:scale-105"
            >
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}