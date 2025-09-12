/**
 * VoucherList Component
 * 
 * Displays a list of vouchers with filtering, sorting, and pagination
 * Features:
 * - Multiple view modes (grid, list)
 * - Status filtering
 * - Search functionality
 * - Sort by value, expiry, created date
 * - Responsive design
 * - Loading states
 * - Empty states
 */

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VoucherCard, VoucherData } from "./VoucherCard"
import { VoucherSkeleton } from "./VoucherSkeleton"
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  SortAsc, 
  SortDesc,
  Gift,
  Clock,
  DollarSign,
  Calendar,
  Wallet,
  AlertCircle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface VoucherListProps {
  vouchers: VoucherData[]
  loading?: boolean
  error?: string
  onUseVoucher?: (voucherId: string) => void
  onShareVoucher?: (voucher: VoucherData) => void
  onViewQR?: (voucher: VoucherData) => void
  className?: string
}

type ViewMode = 'grid' | 'list'
type SortField = 'created_at' | 'expires_at' | 'value'
type SortDirection = 'asc' | 'desc'
type StatusFilter = 'all' | 'active' | 'used' | 'expired' | 'cancelled'

export function VoucherList({
  vouchers,
  loading = false,
  error,
  onUseVoucher,
  onShareVoucher,
  onViewQR,
  className
}: VoucherListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Filter and sort vouchers
  const filteredAndSortedVouchers = useMemo(() => {
    let filtered = vouchers

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(voucher =>
        voucher.voucher_code.toLowerCase().includes(query) ||
        voucher.value.toString().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(voucher => voucher.status === statusFilter)
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aValue, bValue

      switch (sortField) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'expires_at':
          aValue = new Date(a.expires_at).getTime()
          bValue = new Date(b.expires_at).getTime()
          break
        case 'value':
          aValue = a.value
          bValue = b.value
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })

    return filtered
  }, [vouchers, searchQuery, statusFilter, sortField, sortDirection])

  // Get status counts for tabs
  const statusCounts = useMemo(() => {
    const counts = {
      all: vouchers.length,
      active: 0,
      used: 0,
      expired: 0,
      cancelled: 0
    }

    vouchers.forEach(voucher => {
      counts[voucher.status]++
    })

    return counts
  }, [vouchers])

  // Toggle sort direction for the same field
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }, [sortField])

  // Calculate total values
  const totalValue = vouchers.reduce((sum, voucher) => sum + voucher.value, 0)
  const availableValue = vouchers
    .filter(v => v.status === 'active')
    .reduce((sum, voucher) => sum + voucher.value, 0)

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Card className={cn("w-full bg-white dark:bg-gray-800/80", className)}>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Error Loading Vouchers</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center text-sm">{error}</p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Summary Cards - More compact version */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.2 }}
        >
          <Card className="hover:shadow-sm transition-all duration-200 bg-white dark:bg-gray-800/80 hover:scale-[1.02] border-gray-200 dark:border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <Gift className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Vouchers</p>
                  <motion.p 
                    className="text-base font-bold text-gray-900 dark:text-gray-100"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1, duration: 0.2 }}
                  >
                    {vouchers.length}
                  </motion.p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.2 }}
        >
          <Card className="hover:shadow-sm transition-all duration-200 bg-white dark:bg-gray-800/80 hover:scale-[1.02] border-gray-200 dark:border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Value</p>
                  <motion.p 
                    className="text-base font-bold text-gray-900 dark:text-gray-100"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.15, duration: 0.2 }}
                  >
                    Rs. {totalValue.toLocaleString()}
                  </motion.p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.2 }}
        >
          <Card className="hover:shadow-sm transition-all duration-200 bg-white dark:bg-gray-800/80 hover:scale-[1.02] border-gray-200 dark:border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Available</p>
                  <motion.p 
                    className="text-base font-bold text-gray-900 dark:text-gray-100"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2, duration: 0.2 }}
                  >
                    Rs. {availableValue.toLocaleString()}
                  </motion.p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.2 }}
        >
          <Card className="hover:shadow-sm transition-all duration-200 bg-white dark:bg-gray-800/80 hover:scale-[1.02] border-gray-200 dark:border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Active</p>
                  <motion.p 
                    className="text-base font-bold text-gray-900 dark:text-gray-100"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.25, duration: 0.2 }}
                  >
                    {statusCounts.active}
                  </motion.p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters and Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.2 }}
      >
        <Card className="bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3 pt-3">
            <CardTitle className="flex items-center justify-between text-gray-900 dark:text-gray-100 text-base">
              <span>My Vouchers</span>
              <div className="flex items-center space-x-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-7 px-2 bg-primary dark:bg-primary text-white hover:bg-primary/90 dark:hover:bg-primary/90"
                >
                  <Grid3X3 className="w-3 h-3" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-7 px-2 bg-primary dark:bg-primary text-white hover:bg-primary/90 dark:hover:bg-primary/90"
                >
                  <List className="w-3 h-3" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 pt-0">
            <div className="flex flex-col md:flex-row gap-2 mb-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search vouchers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 h-8 text-sm"
                />
              </div>

              {/* Sort */}
              <Select value={`${sortField}-${sortDirection}`} onValueChange={(value) => {
                const [field, direction] = value.split('-') as [SortField, SortDirection]
                setSortField(field)
                setSortDirection(direction)
              }}>
                <SelectTrigger className="w-[140px] bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 h-8 text-sm">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  <SelectItem value="created_at-desc" className="text-gray-900 dark:text-gray-100 text-sm">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-2" />
                      Newest
                    </div>
                  </SelectItem>
                  <SelectItem value="created_at-asc" className="text-gray-900 dark:text-gray-100 text-sm">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-2" />
                      Oldest
                    </div>
                  </SelectItem>
                  <SelectItem value="expires_at-asc" className="text-gray-900 dark:text-gray-100 text-sm">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-2" />
                      Expiring Soon
                    </div>
                  </SelectItem>
                  <SelectItem value="value-desc" className="text-gray-900 dark:text-gray-100 text-sm">
                    <div className="flex items-center">
                      <DollarSign className="w-3 h-3 mr-2" />
                      Highest Value
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Tabs */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.2 }}
            >
              <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <TabsList className="grid w-full grid-cols-5 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg h-8">
                  <TabsTrigger value="all" className="text-[10px] py-0 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-primary dark:data-[state=active]:text-white">
                    All
                    <Badge variant="secondary" className="ml-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-[8px] px-1 py-0">
                      {statusCounts.all}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="active" className="text-[10px] py-0 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-primary dark:data-[state=active]:text-white">
                    Active
                    <Badge variant="secondary" className="ml-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-[8px] px-1 py-0">
                      {statusCounts.active}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="used" className="text-[10px] py-0 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-primary dark:data-[state=active]:text-white">
                    Used
                    <Badge variant="secondary" className="ml-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-[8px] px-1 py-0">
                      {statusCounts.used}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="expired" className="text-[10px] py-0 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-primary dark:data-[state=active]:text-white">
                    Expired
                    <Badge variant="secondary" className="ml-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-[8px] px-1 py-0">
                      {statusCounts.expired}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="cancelled" className="text-[10px] py-0 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-primary dark:data-[state=active]:text-white">
                    Cancelled
                    <Badge variant="secondary" className="ml-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-[8px] px-1 py-0">
                      {statusCounts.cancelled}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Vouchers Grid/List */}
      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.2 }}
      >
        {loading ? (
          <motion.div 
            className={cn(
              "grid gap-3",
              viewMode === 'grid' 
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                : "grid-cols-1"
            )}
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <VoucherSkeleton />
              </motion.div>
            ))}
          </motion.div>
        ) : filteredAndSortedVouchers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700">
              <CardContent className="flex flex-col items-center justify-center py-6">
                <Gift className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {vouchers.length === 0 ? 'No Vouchers Found' : 'No Matching Vouchers'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center text-sm max-w-md">
                  {vouchers.length === 0 
                    ? 'You haven\'t redeemed any vouchers yet. Start earning points to get your first voucher!'
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div 
            className={cn(
              "grid gap-3",
              viewMode === 'grid' 
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                : "grid-cols-1"
            )}
            layout
          >
            <AnimatePresence>
              {filteredAndSortedVouchers.map((voucher) => (
                <motion.div
                  key={voucher.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  layout
                >
                  <VoucherCard
                    voucher={voucher}
                    variant={viewMode === 'list' ? 'detailed' : 'default'}
                    onUse={onUseVoucher}
                    onShare={onShareVoucher}
                    onViewQR={onViewQR}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}