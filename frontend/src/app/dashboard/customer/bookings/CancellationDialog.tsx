"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./custom-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { customerApi } from "@/services/customer.api"
import { showToast } from "@/components/ui/enhanced-toast"

interface CancellationDialogProps {
  isOpen: boolean
  bookingId: number | null
  onClose: () => void
  onSuccess: () => void
}

// Common cancellation reasons - static to prevent recreation
const CANCELLATION_REASONS = [
  "Changed my mind",
  "Found a better service", 
  "No longer need the service",
  "Schedule conflict",
  "Budget constraints",
  "Other"
] as const

export default function CancellationDialog({ isOpen, bookingId, onClose, onSuccess }: CancellationDialogProps) {
  // Local state for dialog - completely isolated from parent
  const [reason, setReason] = useState("")
  const [showCustom, setShowCustom] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Reset state when dialog opens/closes
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open && !isProcessing) {
      setReason("")
      setShowCustom(false)
      setIsProcessing(false)
      onClose()
    }
  }, [isProcessing, onClose])

  // Handle reason selection
  const handleReasonSelect = useCallback((selectedReason: string) => {
    if (isProcessing) return
    
    if (selectedReason === "Other") {
      setShowCustom(true)
      setReason("")
    } else {
      setReason(selectedReason)
      setShowCustom(false)
    }
  }, [isProcessing])

  // Handle custom reason input
  const handleCustomReasonChange = useCallback((value: string) => {
    if (isProcessing) return
    setReason(value)
  }, [isProcessing])

  // Handle cancellation
  const handleCancelBooking = useCallback(async () => {
    if (!bookingId || !reason.trim() || isProcessing) return

    try {
      setIsProcessing(true)
      await customerApi.cancelBooking(bookingId, reason.trim())
      
      showToast.success({
        title: "✅ Booking Cancelled!",
        description: "Your booking has been successfully cancelled! We've updated your records 📝",
        duration: 3000
      })
      
      onSuccess()
      handleOpenChange(false)
    } catch (error: any) {
      showToast.error({
        title: "🚫 Cancellation Failed!",
        description: error.message || "Couldn't cancel your booking. Please try again or contact support! 🆘",
        duration: 5000
      })
    } finally {
      setIsProcessing(false)
    }
  }, [bookingId, reason, isProcessing, onSuccess, handleOpenChange])

  // Compact reason option component with improved theme compatibility
  const ReasonOption = useCallback(({ reasonOption, isSelected }: { reasonOption: string; isSelected: boolean }) => (
    <motion.label 
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer group transition-all duration-200 ${
        isSelected 
          ? 'bg-primary/10 border-primary/40 shadow-sm dark:bg-primary/15 dark:border-primary/50' 
          : 'border-border/50 hover:border-primary/40 hover:bg-primary/5 dark:border-border/30 dark:hover:border-primary/40 dark:hover:bg-primary/10'
      }`}
      onClick={() => handleReasonSelect(reasonOption)}
    >
      <div className="flex items-center justify-center">
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
          isSelected 
            ? 'border-primary bg-primary dark:border-primary dark:bg-primary' 
            : 'border-muted-foreground/40 group-hover:border-primary/60 dark:border-muted-foreground/50 dark:group-hover:border-primary/70'
        }`}>
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <CheckCircle2 className="w-2.5 h-2.5 text-primary-foreground dark:text-primary-foreground" />
            </motion.div>
          )}
        </div>
      </div>
      
      <span className={`text-sm font-medium select-none transition-colors duration-200 ${
        isSelected 
          ? 'text-foreground dark:text-foreground' 
          : 'text-muted-foreground group-hover:text-foreground dark:text-muted-foreground dark:group-hover:text-foreground'
      }`}>
        {reasonOption}
      </span>
    </motion.label>
  ), [handleReasonSelect])

  if (!isOpen || !bookingId) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden bg-background dark:bg-background border-border/50 dark:border-border/30">
        {/* Compact Header with improved theme support */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative p-6 pb-4 bg-gradient-to-br from-destructive/8 via-background/80 to-background dark:from-red-500/15 dark:via-background/60 dark:to-background"
        >
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold text-foreground dark:text-foreground flex items-center gap-3">
              <motion.div 
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                className="flex-shrink-0 p-2 rounded-xl bg-destructive/15 border border-destructive/30 dark:bg-red-500/20 dark:border-red-400/40"
              >
                <AlertCircle className="h-5 w-5 text-destructive dark:text-red-400" />
              </motion.div>
              Cancel Booking #{bookingId}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground dark:text-muted-foreground pl-10">
              This action cannot be undone. Please select a cancellation reason.
            </DialogDescription>
          </DialogHeader>
        </motion.div>
        
        {/* Compact Content with improved theme support */}
        <div className="px-6 pb-2 space-y-4">
          <Label className="text-sm font-medium text-foreground dark:text-foreground">
            Reason for cancellation
          </Label>
          
          <div className="grid gap-2">
            <AnimatePresence>
              {CANCELLATION_REASONS.map((reasonOption, index) => {
                const isSelected = reasonOption === "Other" ? showCustom : reason === reasonOption
                
                return (
                  <motion.div
                    key={reasonOption}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                  >
                    <ReasonOption
                      reasonOption={reasonOption}
                      isSelected={isSelected}
                    />
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
          
          {/* Compact Custom reason input with theme support */}
          <AnimatePresence>
            {showCustom && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="pt-2"
              >
                <Input
                  placeholder="Please specify your reason..."
                  value={reason}
                  onChange={(e) => handleCustomReasonChange(e.target.value)}
                  className="h-10 text-sm rounded-lg border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-background dark:bg-background dark:border-border/30 dark:focus:border-primary/60 dark:focus:ring-primary/25"
                  autoFocus
                  disabled={isProcessing}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Compact Footer with improved theme support */}
        <div className="p-6 pt-4 bg-muted/30 dark:bg-muted/15 border-t border-border/30 dark:border-border/20">
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-3">
            <Button 
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isProcessing}
              className="h-10 px-6 text-sm rounded-lg border border-border hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all duration-200 dark:border-border/50 dark:hover:bg-primary/20 dark:hover:border-primary/70 dark:hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Keep Booking
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelBooking}
              disabled={(!reason || reason.trim() === "") || isProcessing}
              className="h-10 px-6 text-sm rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-600 dark:hover:bg-red-500 dark:text-white hover:shadow-lg hover:shadow-destructive/25 dark:hover:shadow-red-500/30 active:scale-95"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cancelling...
                </div>
              ) : (reason && reason.trim() !== "") ? (
                "Cancel Booking"
              ) : (
                "Select Reason First"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
