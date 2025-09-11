import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"

interface DisputeResolutionFormProps {
  onDisputeSubmit: (reason: string) => void
  onDisputeCancel: () => void
}

export function DisputeResolutionForm({ 
  onDisputeSubmit, 
  onDisputeCancel 
}: DisputeResolutionFormProps) {
  const [disputeReason, setDisputeReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!disputeReason.trim()) {
      setError("Please provide a reason for your dispute")
      return
    }

    if (disputeReason.length < 20) {
      setError("Please provide more details about your dispute (minimum 20 characters)")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      
      // In a real implementation, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onDisputeSubmit(disputeReason)
      setSubmitSuccess(true)
      
      // Reset form after successful submission
      setTimeout(() => {
        setDisputeReason("")
        setSubmitSuccess(false)
      }, 2000)
    } catch (err) {
      setError("Failed to submit dispute. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-6 md:py-8"
      >
        <CheckCircle className="h-8 w-8 md:h-12 md:w-12 text-green-500 mx-auto mb-3 md:mb-4" />
        <h3 className="text-base md:text-lg font-semibold mb-2">Dispute Submitted</h3>
        <p className="text-muted-foreground text-sm md:text-base">
          Your dispute has been submitted successfully. Our team will review it and get back to you soon.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-destructive">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-destructive text-base md:text-lg">
            <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
            Raise a Dispute
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 md:p-6">
          <Alert variant="destructive">
            <AlertDescription className="text-xs md:text-sm">
              If you're not satisfied with the service, you can raise a dispute. 
              Please provide detailed information about the issue.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label htmlFor="disputeReason" className="text-sm">Dispute Reason *</Label>
            <Textarea
              id="disputeReason"
              placeholder="Please describe in detail why you're raising this dispute..."
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              rows={4}
              className="resize-none text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {disputeReason.length}/500 characters
            </p>
          </div>
          
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onDisputeCancel}
              disabled={isSubmitting}
              className="flex-1 text-sm"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !disputeReason.trim()}
              size="sm"
              className="flex-1 bg-destructive hover:bg-destructive/90 text-sm"
            >
              {isSubmitting ? "Submitting..." : "Submit Dispute"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}