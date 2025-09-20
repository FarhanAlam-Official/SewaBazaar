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

"use client"

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
// Removed framer-motion for better performance
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
      // Simplified error display without animations
      <div className={cn("w-full", className)}>
        <Card className="w-full bg-white dark:bg-card">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Error Loading Vouchers</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("w-full space-y-5", className)}>
      {/* Summary Cards - Improved spacing and sizing */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <Card className="hover:shadow-sm transition-all duration-200 bg-white dark:bg-card hover:scale-[1.02] border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Gift className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Vouchers</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {vouchers.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="hover:shadow-sm transition-all duration-200 bg-white dark:bg-card hover:scale-[1.02] border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Rs. {totalValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="hover:shadow-sm transition-all duration-200 bg-white dark:bg-card hover:scale-[1.02] border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Wallet className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Rs. {availableValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="hover:shadow-sm transition-all duration-200 bg-white dark:bg-card hover:scale-[1.02] border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {statusCounts.active}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters and Controls - Improved design */}
      <div>
        <Card className="bg-white dark:bg-card border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-4 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-4">
                <CardTitle className="text-gray-900 dark:text-gray-100 text-lg">
                  My Vouchers
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
                    <Gift className="w-3 h-3 mr-1" />
                    Reward Account
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
                    <Wallet className="w-3 h-3 mr-1" />
                    Redeem Code
                  </Button>
                </div>
              </div>
              {/* Removed view mode toggle buttons */}
            </div>
          </CardHeader>
          <CardContent className="pb-4 pt-0">
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search vouchers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 h-9"
                />
              </div>

              {/* Sort */}
              <Select value={`${sortField}-${sortDirection}`} onValueChange={(value) => {
                const [field, direction] = value.split('-') as [SortField, SortDirection]
                setSortField(field)
                setSortDirection(direction)
              }}>
                <SelectTrigger className="w-[160px] bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 h-9">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  <SelectItem value="created_at-desc" className="text-gray-900 dark:text-gray-100">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Newest
                    </div>
                  </SelectItem>
                  <SelectItem value="created_at-asc" className="text-gray-900 dark:text-gray-100">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Oldest
                    </div>
                  </SelectItem>
                  <SelectItem value="expires_at-asc" className="text-gray-900 dark:text-gray-100">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Expiring Soon
                    </div>
                  </SelectItem>
                  <SelectItem value="value-desc" className="text-gray-900 dark:text-gray-100">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Highest Value
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Tabs */}
            <div>
              <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <TabsList className="flex w-full bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg h-10">
                  <TabsTrigger value="all" className="text-xs flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-primary dark:data-[state=active]:text-white rounded-md">
                    All
                    <Badge variant="secondary" className="ml-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-[10px] px-1.5 py-0.5 min-w-[18px] border border-gray-200 dark:border-gray-600 shadow-sm">
                      {statusCounts.all}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="active" className="text-xs flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-primary dark:data-[state=active]:text-white rounded-md">
                    Active
                    <Badge variant="success" className="ml-1 text-[10px] px-1.5 py-0.5 min-w-[18px] shadow-sm">
                      {statusCounts.active}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="used" className="text-xs flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-primary dark:data-[state=active]:text-white rounded-md">
                    Used
                    <Badge variant="secondary" className="ml-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-[10px] px-1.5 py-0.5 min-w-[18px] shadow-sm">
                      {statusCounts.used}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="expired" className="text-xs flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-primary dark:data-[state=active]:text-white rounded-md">
                    Expired
                    <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0.5 min-w-[18px] shadow-sm">
                      {statusCounts.expired}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="cancelled" className="text-xs flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-primary dark:data-[state=active]:text-white rounded-md">
                    Cancelled
                    <Badge variant="warning" className="ml-1 text-[10px] px-1.5 py-0.5 min-w-[18px] shadow-sm">
                      {statusCounts.cancelled}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vouchers Grid - Simplified to only grid view */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index}>
                <VoucherSkeleton />
              </div>
            ))}
          </div>
        ) : filteredAndSortedVouchers.length === 0 ? (
          <div>
            <Card className="bg-white dark:bg-card border-gray-200 dark:border-gray-700">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Gift className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {vouchers.length === 0 ? 'No Vouchers Found' : 'No Matching Vouchers'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                  {vouchers.length === 0 
                    ? 'You haven\'t redeemed any vouchers yet. Start earning points to get your first voucher!'
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedVouchers.map((voucher) => (
              <div key={voucher.id}>
                <VoucherCard
                  voucher={voucher}
                  onUse={onUseVoucher}
                  onShare={onShareVoucher}
                  onViewQR={onViewQR}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}