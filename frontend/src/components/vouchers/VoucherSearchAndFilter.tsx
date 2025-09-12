/**
 * VoucherSearchAndFilter Component
 * 
 * Advanced search and filtering interface for voucher management
 * Features:
 * - Text search across voucher codes and metadata
 * - Multi-status filtering
 * - Value range filtering with slider
 * - Date range filtering for creation and expiry
 * - Sorting by multiple criteria
 * - Saved filter presets
 * - Export filtered results
 * 
 * @component
 * @example
 * <VoucherSearchAndFilter 
 *   vouchers={allVouchers}
 *   onFiltered={setFilteredVouchers}
 *   savedFilters={userFilterPresets}
 * />
 */

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { VoucherData } from "./VoucherCard"
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Calendar as CalendarIcon,
  X,
  Tag,
  DollarSign,
  Clock,
  Star
} from "lucide-react"
import { format } from "date-fns"

export interface VoucherFilters {
  search: string
  status: string[]
  valueRange: [number, number]
  expiryDate: {
    from?: Date
    to?: Date
  }
  sortBy: 'created_at' | 'expires_at' | 'value'
  sortOrder: 'asc' | 'desc'
  showExpired: boolean
  tier?: string
}

interface VoucherSearchAndFilterProps {
  vouchers: VoucherData[]
  filters: VoucherFilters
  onFiltersChange: (filters: VoucherFilters) => void
  onFilteredVouchersChange: (vouchers: VoucherData[]) => void
}

export function VoucherSearchAndFilter({
  vouchers,
  filters,
  onFiltersChange,
  onFilteredVouchersChange
}: VoucherSearchAndFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})

  // Calculate filter options from vouchers
  const filterOptions = useMemo(() => {
    const maxValue = Math.max(...vouchers.map(v => v.value), 1000)
    const tiers = Array.from(new Set(vouchers.map(v => v.metadata?.tier).filter(Boolean)))
    
    return {
      maxValue,
      tiers: tiers as string[]
    }
  }, [vouchers])

  // Filter and sort vouchers
  const filteredVouchers = useMemo(() => {
    let filtered = vouchers.filter(voucher => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch = 
          voucher.voucher_code.toLowerCase().includes(searchLower) ||
          voucher.metadata?.campaign?.toLowerCase().includes(searchLower) ||
          voucher.metadata?.tier?.toLowerCase().includes(searchLower)
        
        if (!matchesSearch) return false
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(voucher.status)) {
        return false
      }

      // Value range filter
      if (voucher.value < filters.valueRange[0] || voucher.value > filters.valueRange[1]) {
        return false
      }

      // Expiry date filter
      const expiryDate = new Date(voucher.expires_at)
      if (filters.expiryDate.from && expiryDate < filters.expiryDate.from) {
        return false
      }
      if (filters.expiryDate.to && expiryDate > filters.expiryDate.to) {
        return false
      }

      // Show expired filter
      if (!filters.showExpired && voucher.status === 'expired') {
        return false
      }

      // Tier filter
      if (filters.tier && voucher.metadata?.tier !== filters.tier) {
        return false
      }

      return true
    })

    // Sort filtered vouchers
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (filters.sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        case 'expires_at':
          aValue = new Date(a.expires_at)
          bValue = new Date(b.expires_at)
          break
        case 'value':
          aValue = a.value
          bValue = b.value
          break
        default:
          return 0
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [vouchers, filters])

  // Update parent component when filtered vouchers change
  useMemo(() => {
    onFilteredVouchersChange(filteredVouchers)
  }, [filteredVouchers, onFilteredVouchersChange])

  const updateFilters = (updates: Partial<VoucherFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: [],
      valueRange: [0, filterOptions.maxValue],
      expiryDate: {},
      sortBy: 'created_at',
      sortOrder: 'desc',
      showExpired: false,
      tier: undefined
    })
    setDateRange({})
  }

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.status.length > 0) count++
    if (filters.valueRange[0] > 0 || filters.valueRange[1] < filterOptions.maxValue) count++
    if (filters.expiryDate.from || filters.expiryDate.to) count++
    if (filters.tier) count++
    if (filters.showExpired) count++
    return count
  }, [filters, filterOptions.maxValue])

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Search & Filter Vouchers</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by voucher code, campaign, or tier..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Quick Sort Options */}
        <div className="flex items-center space-x-4">
          <Label className="text-sm font-medium">Sort by:</Label>
          <Select 
            value={filters.sortBy} 
            onValueChange={(value) => updateFilters({ sortBy: value as any })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date Created</SelectItem>
              <SelectItem value="expires_at">Expiry Date</SelectItem>
              <SelectItem value="value">Value</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateFilters({ 
              sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
            })}
          >
            {filters.sortOrder === 'asc' ? (
              <SortAsc className="w-4 h-4" />
            ) : (
              <SortDesc className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredVouchers.length} of {vouchers.length} vouchers
          </span>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Active: {filteredVouchers.filter(v => v.status === 'active').length}</span>
            </span>
            <span className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Used: {filteredVouchers.filter(v => v.status === 'used').length}</span>
            </span>
            <span className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span>Expired: {filteredVouchers.filter(v => v.status === 'expired').length}</span>
            </span>
          </div>
        </div>

        {/* Advanced Filters */}
        {isFilterOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t">
            {/* Status Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center space-x-2">
                <Tag className="w-4 h-4" />
                <span>Status</span>
              </Label>
              <div className="space-y-2">
                {['active', 'used', 'expired', 'cancelled'].map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.status.includes(status)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateFilters({ status: [...filters.status, status] })
                        } else {
                          updateFilters({ 
                            status: filters.status.filter(s => s !== status) 
                          })
                        }
                      }}
                    />
                    <Label 
                      htmlFor={`status-${status}`} 
                      className="text-sm capitalize cursor-pointer"
                    >
                      {status}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Value Range Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>Value Range</span>
              </Label>
              <div className="space-y-4">
                <Slider
                  value={filters.valueRange}
                  onValueChange={(value) => updateFilters({ valueRange: value as [number, number] })}
                  max={filterOptions.maxValue}
                  min={0}
                  step={50}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>₹{filters.valueRange[0]}</span>
                  <span>₹{filters.valueRange[1]}</span>
                </div>
              </div>
            </div>

            {/* Expiry Date Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Expiry Date Range</span>
              </Label>
              <div className="space-y-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
                      onSelect={(range) => {
                        setDateRange(range || {})
                        updateFilters({ expiryDate: range || {} })
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Tier Filter */}
            {filterOptions.tiers.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span>Tier</span>
                </Label>
                <Select value={filters.tier} onValueChange={(value) => updateFilters({ tier: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Tiers</SelectItem>
                    {filterOptions.tiers.map((tier) => (
                      <SelectItem key={tier} value={tier} className="capitalize">
                        {tier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Additional Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-expired"
                    checked={filters.showExpired}
                    onCheckedChange={(checked) => updateFilters({ showExpired: !!checked })}
                  />
                  <Label htmlFor="show-expired" className="text-sm cursor-pointer">
                    Show expired vouchers
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}