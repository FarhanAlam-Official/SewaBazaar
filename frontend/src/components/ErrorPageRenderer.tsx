"use client"

import { useError } from "@/contexts/ErrorContext"
import NetworkErrorPage from "@/components/error-pages/NetworkErrorPage"
import ServerErrorPage from "@/components/error-pages/ServerErrorPage"
import GenericErrorPage from "@/components/error-pages/GenericErrorPage"
import UnauthorizedErrorPage from "@/components/error-pages/UnauthorizedErrorPage"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { useEffect } from "react"

/**
 * Component that renders error pages based on error context
 * This should be used in pages where you want to show custom error pages
 * for network and server errors instead of the generic error boundary
 */
export function ErrorPageRenderer() {
  const { error, clearError } = useError()

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      clearError()
    }
  }, [clearError])

  if (!error) {
    return null
  }

  // For error pages, we want to render them with header and footer
  switch (error.type) {
    case 'network':
      return (
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <NetworkErrorPage />
          </main>
          <Footer />
        </div>
      )
    case 'server':
      return (
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <ServerErrorPage />
          </main>
          <Footer />
        </div>
      )
    case 'generic':
      return (
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <GenericErrorPage 
              errorTitle={error.message}
              errorMessage={error.message}
            />
          </main>
          <Footer />
        </div>
      )
    case 'unauthorized':
      return (
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <UnauthorizedErrorPage />
          </main>
          <Footer />
        </div>
      )
    default:
      return null
  }
}
