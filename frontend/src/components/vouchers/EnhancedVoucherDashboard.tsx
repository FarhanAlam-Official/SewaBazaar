/**
 * Enhanced Voucher Dashboard Component
 * 
 * A comprehensive voucher management interface that provides:
 * - Grid and list view modes for voucher display
 * - Advanced search and filtering capabilities
 * - Batch operations for multiple voucher management
 * - Voucher recommendations based on user activity
 * - Points redemption for new vouchers
 * - Interactive dashboard with statistics and insights
 * 
 * @component
 * @example
 * <EnhancedVoucherDashboard 
 *   user={currentUser} 
 *   rewardAccount={rewardData}
 *   onNavigate={handleNavigation}
 * />
 */

import { useState, useEffect } from "react"
import Cookies from 'js-cookie'
import { VoucherCard, VoucherData } from "./VoucherCard"
import { VoucherList } from "./VoucherList"
import { EnhancedVoucherList } from "./EnhancedVoucherList"
import { VoucherRecommendations } from "./VoucherRecommendations"
import { VoucherSearchAndFilter } from "./VoucherSearchAndFilter"
import { BatchOperations } from "./BatchOperations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Wallet, 
  Plus, 
  Settings, 
  TrendingUp,
  Grid3X3,
  List,
  Filter,
  Lightbulb,
  Zap,
  Star,
  Gift
} from "lucide-react"

interface EnhancedVoucherDashboardProps {
  user: any
  rewardAccount: any
  onNavigate?: (path: string) => void
}

export function EnhancedVoucherDashboard({ 
  user, 
  rewardAccount, 
  onNavigate 
}: EnhancedVoucherDashboardProps) {
  const [vouchers, setVouchers] = useState<VoucherData[]>([])
  const [filteredVouchers, setFilteredVouchers] = useState<VoucherData[]>([])
  const [selectedVouchers, setSelectedVouchers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<'grid' | 'list'>('grid')
  const [activeTab, setActiveTab] = useState('overview')
  const [currentCart, setCurrentCart] = useState<any>(null)

  useEffect(() => {
    fetchVouchers()
  }, [])

  /**
   * Fetch vouchers from the API
   * Uses the same VoucherService as the main offers page for consistency
   */
  const fetchVouchers = async () => {
    try {
      setLoading(true)
      const token = Cookies.get('access_token')
      
      if (!token) {
        setError('Authentication required')
        return
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${baseUrl}/api/rewards/vouchers/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch vouchers: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Handle different API response structures
      let vouchers = data
      if (data && data.results) {
        vouchers = data.results // Paginated response
      } else if (data && data.vouchers) {
        vouchers = data.vouchers // Nested response
      }
      
      // Ensure vouchers is an array
      if (!Array.isArray(vouchers)) {
        vouchers = []
      }
      
      setVouchers(vouchers)
      setFilteredVouchers(vouchers)
    } catch (err) {
      setError('Failed to load vouchers')
      console.error('Error fetching vouchers:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle voucher usage in checkout process
   * @param voucherId - ID of the voucher to use
   */
  const handleUseVoucher = (voucherId: string) => {
    // Apply voucher to current booking/service session
    // You could show a toast notification here
  }

  const [filters, setFilters] = useState({
    search: '',
    status: [],
    valueRange: [0, 5000] as [number, number],
    expiryDate: {},
    sortBy: 'created_at' as const,
    sortOrder: 'desc' as const,
    showExpired: false
  })

  /**
   * Handle points redemption for new vouchers
   * @param pointsAmount - Number of points to redeem
   */
  const handleRedeemPoints = (pointsAmount: number) => {
    // Initiate points redemption flow for voucher creation
  }

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters)
  }

  const handleFilteredVouchersChange = (filtered: VoucherData[]) => {
    setFilteredVouchers(filtered)
  }

  const handleSelectionChange = (selected: string[]) => {
    setSelectedVouchers(selected)
  }

  /**
   * Handle batch operations on selected vouchers
   * @param operation - Type of batch operation (share, export, etc.)
   * @param voucherIds - Array of selected voucher IDs
   */
  const handleBatchOperation = async (operation: string, voucherIds: string[]) => {
    // Execute batch operations like bulk sharing, exporting, or archiving
  }

  const activeVouchers = vouchers.filter(v => v.status === 'active')
  const totalValue = activeVouchers.reduce((sum, v) => sum + v.value, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your vouchers...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="max-w-md mx-auto">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Voucher Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage your vouchers and maximize your savings
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Wallet className="w-4 h-4 mr-1" />
            ₹{totalValue.toLocaleString()} available
          </Badge>
          <Button onClick={() => onNavigate?.('/services')}>
            <Plus className="w-4 h-4 mr-2" />
            Redeem Points
          </Button>
        </div>
      </div>

      {/* Smart Recommendations */}
      <VoucherRecommendations
        vouchers={vouchers}
        rewardAccount={rewardAccount}
        currentCart={currentCart}
        onUseVoucher={handleUseVoucher}
        onRedeemPoints={handleRedeemPoints}
      />

      {/* Statistics - Simple inline stats instead of separate component */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Vouchers</p>
                <p className="text-2xl font-bold text-green-600">{activeVouchers.length}</p>
              </div>
              <Wallet className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-blue-600">₹{totalValue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month Saved</p>
                <p className="text-2xl font-bold text-purple-600">₹{vouchers.filter(v => v.status === 'used').reduce((sum, v) => sum + v.value, 0).toLocaleString()}</p>
              </div>
              <Star className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Points Balance</p>
                <p className="text-2xl font-bold text-orange-600">{rewardAccount?.points_balance || 0}</p>
              </div>
              <Gift className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Manage</span>
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Batch Actions</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center space-x-2">
            <Lightbulb className="w-4 h-4" />
            <span>Insights</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Search and Filter */}
          <VoucherSearchAndFilter
            vouchers={vouchers}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onFilteredVouchersChange={handleFilteredVouchersChange}
          />

          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Vouchers ({filteredVouchers.length})
            </h2>
            <div className="flex items-center space-x-2">
              <Button
                variant={currentView === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={currentView === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Vouchers Display */}
          {currentView === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVouchers.map((voucher) => (
                <VoucherCard 
                  key={voucher.id} 
                  voucher={voucher}
                  onUse={() => handleUseVoucher(voucher.id)}
                />
              ))}
            </div>
          ) : (
            <EnhancedVoucherList 
              vouchers={filteredVouchers}
              selectable={true}
              selectedVouchers={selectedVouchers}
              onSelectionChange={handleSelectionChange}
              onUseVoucher={handleUseVoucher}
              viewMode="table"
            />
          )}

          {filteredVouchers.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No vouchers found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your filters or redeem points for new vouchers
                  </p>
                  <Button onClick={() => onNavigate?.('/services')}>
                    <Star className="w-4 h-4 mr-2" />
                    Redeem Points
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manage" className="space-y-6 mt-6">
          <VoucherSearchAndFilter
            vouchers={vouchers}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onFilteredVouchersChange={handleFilteredVouchersChange}
          />
          
          <EnhancedVoucherList 
            vouchers={filteredVouchers}
            selectable={true}
            selectedVouchers={selectedVouchers}
            onSelectionChange={handleSelectionChange}
            onUseVoucher={handleUseVoucher}
            showManagementActions={true}
            viewMode="table"
          />
        </TabsContent>

        <TabsContent value="batch" className="space-y-6 mt-6">
          <BatchOperations
            vouchers={filteredVouchers}
            selectedVouchers={selectedVouchers}
            onSelectionChange={handleSelectionChange}
            onBatchOperation={handleBatchOperation}
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-semibold">₹{vouchers.filter(v => v.status === 'used').reduce((sum, v) => sum + (v.used_amount || v.value), 0).toLocaleString()} saved</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Vouchers</span>
                    <span className="font-semibold">{activeVouchers.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Value</span>
                    <span className="font-semibold">₹{activeVouchers.length > 0 ? Math.round(totalValue / activeVouchers.length).toLocaleString() : 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Savings Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Potential Savings</span>
                    <span className="font-semibold text-green-600">₹{totalValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Points Available</span>
                    <span className="font-semibold text-purple-600">{rewardAccount?.points_balance || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Next Tier Progress</span>
                    <span className="font-semibold text-blue-600">
                      {rewardAccount ? Math.round(((rewardAccount.total_points_earned || 0) / 1000) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}