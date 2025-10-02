"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { showToast } from "@/components/ui/enhanced-toast"
import { DollarSign, CheckCircle, AlertCircle } from "lucide-react"
import { providerApi } from "@/services/provider.api"
import { Booking } from "@/types"

// Define a partial booking interface for the form
interface PartialBooking {
  id: number | string
  service?: {
    title?: string
  }
  user?: {
    name?: string
  }
  booking_date?: string
  total_amount?: number
  // Add other properties as needed
}

interface CashPaymentFormProps {
  booking: PartialBooking
  onSuccess: () => void
  onCancel: () => void
}

export default function CashPaymentForm({ booking, onSuccess, onCancel }: CashPaymentFormProps) {
  const [amountCollected, setAmountCollected] = useState(booking.total_amount?.toString() || "")
  const [collectionNotes, setCollectionNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleProcessPayment = async () => {
    const amount = parseFloat(amountCollected)
    
    if (!amount || amount <= 0) {
      showToast.error({
        title: "Invalid Amount",
        description: "Please enter a valid amount collected",
        duration: 3000
      })
      return
    }

    if (amount > (booking.total_amount || 0) * 1.1) { // Allow 10% variance
      showToast.error({
        title: "Amount Too High",
        description: "Amount collected seems too high. Please verify the amount.",
        duration: 3000
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      await providerApi.processCashPayment(
        Number(booking.id),
        amount,
        collectionNotes
      )
      
      showToast.success({
        title: "Cash Payment Processed",
        description: `Payment of Rs. ${amount} has been recorded successfully`,
        duration: 3000
      })
      
      onSuccess()
    } catch (error: any) {
      console.error('Error processing cash payment:', error)
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          "Failed to process cash payment"
      
      showToast.error({
        title: "Error",
        description: errorMessage,
        duration: 5000
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, '')
    setAmountCollected(numericValue)
  }

  const isAmountValid = () => {
    const amount = parseFloat(amountCollected)
    return amount > 0 && amount <= (booking.total_amount || 0) * 1.1
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <CardTitle>Process Cash Payment</CardTitle>
        </div>
        <CardDescription>
          Record the cash payment collected from the customer for this completed service.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Booking Details */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Booking Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Service:</span>
              <span className="ml-2 font-medium">{booking.service?.title || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Customer:</span>
              <span className="ml-2 font-medium">{booking.user?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Date:</span>
              <span className="ml-2 font-medium">{booking.booking_date}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Expected Amount:</span>
              <span className="ml-2 font-medium">Rs. {booking.total_amount}</span>
            </div>
          </div>
        </div>

        {/* Amount Collected */}
        <div className="space-y-2">
          <Label htmlFor="amount-collected" className="text-sm font-medium">
            Amount Collected <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rs.</span>
            <Input
              id="amount-collected"
              type="text"
              value={amountCollected}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Enter amount collected"
              className="pl-10"
              disabled={isSubmitting}
            />
          </div>
          {amountCollected && !isAmountValid() && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Amount should be between Rs. 0 and Rs. {Math.round((booking.total_amount || 0) * 1.1)}
            </p>
          )}
        </div>

        {/* Collection Notes */}
        <div className="space-y-2">
          <Label htmlFor="collection-notes" className="text-sm font-medium">
            Collection Notes (Optional)
          </Label>
          <Textarea
            id="collection-notes"
            placeholder="Any notes about the payment collection (e.g., customer paid in installments, gave exact change, etc.)"
            value={collectionNotes}
            onChange={(e) => setCollectionNotes(e.target.value)}
            rows={3}
            className="resize-none"
            disabled={isSubmitting}
          />
        </div>

        {/* Payment Summary */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Payment Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700 dark:text-blue-300">Expected Amount:</span>
              <span className="font-medium">Rs. {booking.total_amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700 dark:text-blue-300">Amount Collected:</span>
              <span className="font-medium">
                {amountCollected ? `Rs. ${amountCollected}` : 'Not entered'}
              </span>
            </div>
            {amountCollected && isAmountValid() && (
              <div className="flex justify-between border-t border-blue-200 dark:border-blue-700 pt-1 mt-2">
                <span className="text-blue-700 dark:text-blue-300">Difference:</span>
                <span className={`font-medium ${
                  parseFloat(amountCollected) === booking.total_amount ? 'text-green-600' :
                  parseFloat(amountCollected) > (booking.total_amount || 0) ? 'text-blue-600' : 'text-orange-600'
                }`}>
                  Rs. {(parseFloat(amountCollected) - (booking.total_amount || 0)).toFixed(2)}
                  {parseFloat(amountCollected) === booking.total_amount && ' (Exact)'}
                  {parseFloat(amountCollected) > (booking.total_amount || 0) && ' (Overpaid)'}
                  {parseFloat(amountCollected) < (booking.total_amount || 0) && ' (Underpaid)'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleProcessPayment}
            disabled={isSubmitting || !isAmountValid()}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing Payment...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Process Cash Payment
              </>
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>

        {/* Important Note */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>Important:</strong> This will create a payment record for the cash transaction. 
            The booking will be marked as completed and the customer will be notified.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
