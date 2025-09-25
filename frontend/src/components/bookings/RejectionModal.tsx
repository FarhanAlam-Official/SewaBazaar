"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { XCircle, AlertTriangle } from "lucide-react"

interface RejectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  bookingId: number
  serviceTitle: string
}

const PREDEFINED_REASONS = [
  "Service not available on requested date/time",
  "Location is outside service area",
  "Service requirements not clear",
  "Emergency/unforeseen circumstances",
  "Customer requested cancellation",
  "Other"
]

export default function RejectionModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  bookingId, 
  serviceTitle 
}: RejectionModalProps) {
  const [selectedReason, setSelectedReason] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (!selectedReason) {
      return
    }

    const finalReason = selectedReason === "Other" ? customReason.trim() : selectedReason
    
    if (!finalReason) {
      return
    }

    try {
      setIsSubmitting(true)
      await onConfirm(finalReason)
      handleClose()
    } catch (error) {
      console.error('Error rejecting booking:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedReason("")
    setCustomReason("")
    setIsSubmitting(false)
    onClose()
  }

  const isCustomReason = selectedReason === "Other"
  const canConfirm = selectedReason && (!isCustomReason || customReason.trim())

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Reject Booking
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Booking Info */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Booking #{bookingId}</p>
            <p className="font-medium">{serviceTitle}</p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Please select a reason for rejection:</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {PREDEFINED_REASONS.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason} id={reason} />
                  <Label htmlFor={reason} className="text-sm cursor-pointer">
                    {reason}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Custom Reason Input */}
          {isCustomReason && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason" className="text-sm font-medium">
                Please specify the reason:
              </Label>
              <Textarea
                id="custom-reason"
                placeholder="Enter your reason for rejecting this booking..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium">Important:</p>
                <p>Once rejected, this booking cannot be undone. The customer will be notified of the rejection.</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={!canConfirm || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Reject Booking
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
