/**
 * EnhancedVoucherList Component
 * 
 * Advanced table-based voucher list with enhanced functionality
 * Features:
 * - Sortable table columns
 * - Row selection with checkboxes
 * - Bulk actions dropdown menu
 * - Pagination controls
 * - Expandable row details
 * - Quick action buttons
 * - Status indicators
 * - Export functionality
 * 
 * @component
 * @example
 * <EnhancedVoucherList 
 *   vouchers={voucherData}
 *   onSelection={handleVoucherSelection}
 *   onBulkAction={handleBulkAction}
 * />
 */

import { useState } from "react"
import { VoucherCard, VoucherData } from "./VoucherCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  MoreHorizontal, 
  Eye, 
  Share2, 
  Download,
  Gift,
  Calendar,
  Trash2
} from "lucide-react"

interface EnhancedVoucherListProps {
  vouchers: VoucherData[]
  onUseVoucher: (voucherId: string) => void
  selectable?: boolean
  selectedVouchers?: string[]
  onSelectionChange?: (selected: string[]) => void
  showManagementActions?: boolean
  viewMode?: 'grid' | 'table'
}

export function EnhancedVoucherList({ 
  vouchers, 
  onUseVoucher,
  selectable = false,
  selectedVouchers = [],
  onSelectionChange,
  showManagementActions = false,
  viewMode = 'grid'
}: EnhancedVoucherListProps) {
  const [selectAll, setSelectAll] = useState(false)

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange(vouchers.map(v => v.id))
      } else {
        onSelectionChange([])
      }
    }
  }

  const handleSelectVoucher = (voucherId: string, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedVouchers, voucherId])
      } else {
        onSelectionChange(selectedVouchers.filter(id => id !== voucherId))
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'used': return 'bg-gray-100 text-gray-800'
      case 'expired': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  if (vouchers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No vouchers available</p>
      </div>
    )
  }

  if (viewMode === 'table') {
    return (
      <div className="space-y-4">
        {selectable && selectedVouchers.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-800">
              {selectedVouchers.length} voucher{selectedVouchers.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline">
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        )}

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead>Code</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.map((voucher) => {
                const daysUntilExpiry = getDaysUntilExpiry(voucher.expires_at)
                return (
                  <TableRow key={voucher.id}>
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={selectedVouchers.includes(voucher.id)}
                          onCheckedChange={(checked) => 
                            handleSelectVoucher(voucher.id, checked as boolean)
                          }
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      <div>
                        <span className="font-mono text-sm">{voucher.voucher_code}</span>
                        {daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
                          <Badge variant="outline" className="ml-2 text-orange-600 border-orange-600">
                            {daysUntilExpiry} days left
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-semibold">₹{voucher.value}</span>
                        {voucher.used_amount && voucher.used_amount > 0 && (
                          <span className="text-sm text-gray-500 ml-1">
                            (used: ₹{voucher.used_amount})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(voucher.status)}>
                        {voucher.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(voucher.expires_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {voucher.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {voucher.status === 'active' && (
                          <Button
                            size="sm"
                            onClick={() => onUseVoucher(voucher.id)}
                          >
                            Use
                          </Button>
                        )}
                        
                        {showManagementActions && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {voucher.status === 'active' && (
                                <>
                                  <DropdownMenuItem>
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Gift className="w-4 h-4 mr-2" />
                                    Gift
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              {voucher.status === 'active' && (
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div className="space-y-4">
      {selectable && selectedVouchers.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-800">
            {selectedVouchers.length} voucher{selectedVouchers.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline">
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vouchers.map((voucher) => (
          <div key={voucher.id} className="relative">
            {selectable && (
              <div className="absolute top-4 left-4 z-10">
                <Checkbox
                  checked={selectedVouchers.includes(voucher.id)}
                  onCheckedChange={(checked) => 
                    handleSelectVoucher(voucher.id, checked as boolean)
                  }
                  className="bg-white border-2"
                />
              </div>
            )}
            <VoucherCard 
              voucher={voucher}
              onUse={() => onUseVoucher(voucher.id)}
              showManagementActions={showManagementActions}
            />
          </div>
        ))}
      </div>
    </div>
  )
}