/**
 * BatchOperations Component
 * 
 * Provides bulk operations for managing multiple vouchers simultaneously
 * Features:
 * - Select multiple vouchers with checkboxes
 * - Bulk sharing via email
 * - Bulk download functionality
 * - Gift vouchers to multiple recipients
 * - Delete multiple vouchers
 * - Export voucher data
 * - Responsive design with confirmation dialogs
 * 
 * @component
 * @example
 * <BatchOperations 
 *   vouchers={selectedVouchers}
 *   onOperationComplete={handleRefresh}
 * />
 */

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { showToast } from "@/components/ui/enhanced-toast"
import { VoucherData } from "./VoucherCard"
import { 
  CheckSquare, 
  Square, 
  Share2, 
  Download, 
  Mail, 
  Gift, 
  Trash2, 
  Clock, 
  Users,
  FileText,
  Send
} from "lucide-react"

interface BatchOperationsProps {
  vouchers: VoucherData[]
  selectedVouchers: string[]
  onSelectionChange: (selected: string[]) => void
  onBatchOperation: (operation: string, voucherIds: string[], params?: any) => Promise<void>
}

export function BatchOperations({
  vouchers,
  selectedVouchers,
  onSelectionChange,
  onBatchOperation
}: BatchOperationsProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false)
  const [shareEmail, setShareEmail] = useState("")
  const [shareMessage, setShareMessage] = useState("")
  const [giftEmails, setGiftEmails] = useState("")
  const [giftMessage, setGiftMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const selectedVoucherData = useMemo(() => {
    return vouchers.filter(v => selectedVouchers.includes(v.id))
  }, [vouchers, selectedVouchers])

  const batchStats = useMemo(() => {
    const selected = selectedVoucherData
    return {
      count: selected.length,
      totalValue: selected.reduce((sum, v) => sum + v.value, 0),
      activeCount: selected.filter(v => v.status === 'active').length,
      usedCount: selected.filter(v => v.status === 'used').length,
      expiredCount: selected.filter(v => v.status === 'expired').length
    }
  }, [selectedVoucherData])

  const selectAll = () => {
    const activeVouchers = vouchers.filter(v => v.status === 'active').map(v => v.id)
    onSelectionChange(activeVouchers)
  }

  const selectNone = () => {
    onSelectionChange([])
  }

  const handleBatchShare = async () => {
    if (!shareEmail || selectedVouchers.length === 0) {
      showToast.error({ title: 'Please enter an email and select vouchers to share' })
      return
    }

    try {
      setIsProcessing(true)
      await onBatchOperation('share', selectedVouchers, { 
        email: shareEmail, 
        message: shareMessage 
      })
      showToast.success({ 
        title: 'Vouchers shared successfully!',
        description: `${selectedVouchers.length} vouchers sent to ${shareEmail}` 
      })
      setIsShareModalOpen(false)
      setShareEmail("")
      setShareMessage("")
    } catch (error) {
      showToast.error({ 
        title: 'Failed to share vouchers', 
        description: 'Please try again' 
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBatchGift = async () => {
    if (!giftEmails || selectedVouchers.length === 0) {
      showToast.error({ title: 'Please enter email addresses and select vouchers to gift' })
      return
    }

    const emails = giftEmails.split(',').map(e => e.trim()).filter(e => e)
    if (emails.length === 0) {
      showToast.error({ title: 'Please enter valid email addresses' })
      return
    }

    try {
      setIsProcessing(true)
      await onBatchOperation('gift', selectedVouchers, { 
        emails, 
        message: giftMessage 
      })
      showToast.success({ 
        title: 'Vouchers gifted successfully!',
        description: `${selectedVouchers.length} vouchers sent to ${emails.length} recipients` 
      })
      setIsGiftModalOpen(false)
      setGiftEmails("")
      setGiftMessage("")
    } catch (error) {
      showToast.error({ 
        title: 'Failed to gift vouchers', 
        description: 'Please try again' 
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (selectedVouchers.length === 0) {
      showToast.error({ title: 'Please select vouchers to export' })
      return
    }

    try {
      setIsProcessing(true)
      await onBatchOperation('export', selectedVouchers, { format })
      showToast.success({ 
        title: `Export completed!`,
        description: `${selectedVouchers.length} vouchers exported as ${format.toUpperCase()}` 
      })
    } catch (error) {
      showToast.error({ 
        title: 'Export failed', 
        description: 'Please try again' 
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMarkAsUsed = async () => {
    if (selectedVouchers.length === 0) {
      showToast.error({ title: 'Please select vouchers to mark as used' })
      return
    }

    try {
      setIsProcessing(true)
      await onBatchOperation('mark_used', selectedVouchers)
      showToast.success({ 
        title: 'Vouchers marked as used',
        description: `${selectedVouchers.length} vouchers updated` 
      })
      onSelectionChange([]) // Clear selection
    } catch (error) {
      showToast.error({ 
        title: 'Failed to update vouchers', 
        description: 'Please try again' 
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (vouchers.length === 0) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5" />
            <span>Batch Operations</span>
            {selectedVouchers.length > 0 && (
              <Badge variant="default" className="ml-2">
                {selectedVouchers.length} selected
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All Active
            </Button>
            <Button variant="ghost" size="sm" onClick={selectNone}>
              Clear Selection
            </Button>
          </div>
        </div>
      </CardHeader>

      {selectedVouchers.length > 0 && (
        <CardContent className="space-y-4">
          {/* Selection Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{batchStats.count}</p>
              <p className="text-sm text-gray-600">Selected</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">₹{batchStats.totalValue}</p>
              <p className="text-sm text-gray-600">Total Value</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{batchStats.activeCount}</p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{batchStats.usedCount}</p>
              <p className="text-sm text-gray-600">Used</p>
            </div>
          </div>

          {/* Batch Actions */}
          <div className="flex flex-wrap gap-2">
            {/* Share Button */}
            <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={batchStats.activeCount === 0}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share ({batchStats.activeCount})
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Share Vouchers</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="share-email">Recipient Email</Label>
                    <Input
                      id="share-email"
                      type="email"
                      placeholder="Enter email address"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="share-message">Personal Message (Optional)</Label>
                    <Textarea
                      id="share-message"
                      placeholder="Add a personal message..."
                      value={shareMessage}
                      onChange={(e) => setShareMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsShareModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleBatchShare} disabled={isProcessing}>
                      <Send className="w-4 h-4 mr-2" />
                      {isProcessing ? 'Sharing...' : 'Share Vouchers'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Gift Button */}
            <Dialog open={isGiftModalOpen} onOpenChange={setIsGiftModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={batchStats.activeCount === 0}>
                  <Gift className="w-4 h-4 mr-2" />
                  Gift ({batchStats.activeCount})
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Gift Vouchers</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="gift-emails">Recipient Emails</Label>
                    <Textarea
                      id="gift-emails"
                      placeholder="Enter email addresses separated by commas"
                      value={giftEmails}
                      onChange={(e) => setGiftEmails(e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate multiple emails with commas
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="gift-message">Gift Message</Label>
                    <Textarea
                      id="gift-message"
                      placeholder="Add a gift message..."
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsGiftModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleBatchGift} disabled={isProcessing}>
                      <Gift className="w-4 h-4 mr-2" />
                      {isProcessing ? 'Sending...' : 'Send Gifts'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Export Options */}
            <Select onValueChange={handleExport}>
              <SelectTrigger className="w-auto">
                <Download className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Export" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">Export as CSV</SelectItem>
                <SelectItem value="pdf">Export as PDF</SelectItem>
              </SelectContent>
            </Select>

            {/* Mark as Used */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMarkAsUsed}
              disabled={batchStats.activeCount === 0 || isProcessing}
            >
              <Clock className="w-4 h-4 mr-2" />
              Mark Used ({batchStats.activeCount})
            </Button>

            {/* Quick Stats */}
            <div className="flex items-center space-x-4 ml-auto text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{batchStats.count} vouchers</span>
              </span>
              <span className="flex items-center space-x-1">
                <FileText className="w-4 h-4" />
                <span>₹{batchStats.totalValue} total</span>
              </span>
            </div>
          </div>

          {/* Selected Voucher Preview */}
          {selectedVouchers.length > 0 && selectedVouchers.length <= 5 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Selected Vouchers Preview:</Label>
              <div className="flex flex-wrap gap-2">
                {selectedVoucherData.slice(0, 5).map((voucher) => (
                  <Badge key={voucher.id} variant="outline" className="flex items-center space-x-1">
                    <span>{voucher.voucher_code}</span>
                    <span className="text-green-600">₹{voucher.value}</span>
                  </Badge>
                ))}
                {selectedVouchers.length > 5 && (
                  <Badge variant="secondary">
                    +{selectedVouchers.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}