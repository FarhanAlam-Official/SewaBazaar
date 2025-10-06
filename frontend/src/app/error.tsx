"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { showToast } from "@/components/ui/enhanced-toast"
import { AlertTriangle, RefreshCw, Home, Copy, Bug, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react"
import { useError } from "@/contexts/ErrorContext"
import NetworkErrorPage from "@/components/error-pages/NetworkErrorPage"
import ServerErrorPage from "@/components/error-pages/ServerErrorPage"
import GenericErrorPage from "@/components/error-pages/GenericErrorPage"
import UnauthorizedErrorPage from "@/components/error-pages/UnauthorizedErrorPage"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [detailsOpen, setDetailsOpen] = useState(true)
  const { error: contextError, clearError } = useError()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  // Determine error type from context or error object
  const getErrorType = () => {
    // If we have context error, use its type
    if (contextError) {
      return contextError.type
    }
    
    // Check if error has errorInfo from context (thrown by ErrorBoundaryTrigger)
    const errorInfo = (error as any)?.errorInfo
    if (errorInfo) {
      return errorInfo.type
    }
    
    // Otherwise, try to detect from the error object
    if (!error) return 'generic'
    
    // Check if it's a network error (no response)
    const axiosError = error as any
    if (!axiosError.response && axiosError.code !== 'ECONNABORTED') {
      return 'network'
    }
    
    // Check if it's a server error (5xx status)
    const status = axiosError.response?.status
    if (status && status >= 500 && status < 600) {
      return 'server'
    }
    
    // Check if it's an unauthorized error (403 status)
    if (status === 403) {
      return 'unauthorized'
    }
    
    return 'generic'
  }

  const errorType = getErrorType()

  // Enhanced reset function that clears context error
  const handleReset = () => {
    clearError()
    reset()
  }

  const errorTitle = useMemo(() => {
    if (contextError?.message) {
      return contextError.message
    }
    return error?.name || "Something went wrong"
  }, [error, contextError])

  const errorMessage = useMemo(() => {
    if (contextError?.message) {
      return contextError.message
    }
    return error?.message || "An unexpected error occurred. Please try again."
  }, [error, contextError])

  const digest = error?.digest

  const handleCopy = async () => {
    try {
      const payload = JSON.stringify({
        title: errorTitle,
        message: errorMessage,
        digest,
        time: new Date().toISOString(),
      }, null, 2)
      await navigator.clipboard.writeText(payload)
      showToast.success({ title: "Error details copied" })
    } catch {
      showToast.error({ title: "Copy failed", description: "Please try again." })
    }
  }

  const handleReport = async () => {
    try {
      const subject = encodeURIComponent("SewaBazaar Error Report")
      const body = encodeURIComponent(
        `Please describe what you were doing when this happened.\n\n`+
        `Error Title: ${errorTitle}\n`+
        `Message: ${errorMessage}\n`+
        `Digest: ${digest || "N/A"}\n`+
        `Time: ${new Date().toISOString()}\n`
      )
      window.location.href = `mailto:support@sewabazaar.com?subject=${subject}&body=${body}`
      showToast.info({ title: "Opening mail client" })
    } catch {
      showToast.error({ title: "Could not open mail client" })
    }
  }

  // Render custom error pages based on error type
  if (errorType === 'network') {
    return <NetworkErrorPage />
  }
  
  if (errorType === 'server') {
    return <ServerErrorPage />
  }
  
  if (errorType === 'unauthorized') {
    return <UnauthorizedErrorPage />
  }

  // Default generic error page (uses GenericErrorPage component)
  return (
    <GenericErrorPage 
      error={error}
      reset={handleReset}
      errorTitle={errorTitle}
      errorMessage={errorMessage}
    />
  )
} 