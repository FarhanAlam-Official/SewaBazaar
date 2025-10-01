"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { ModernProviderProfile } from "@/components/features/ModernProviderProfile"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

interface PublicProviderProfilePageProps {
  params: Promise<{ id: string }>
}

export default function PublicProviderProfilePage({ params }: PublicProviderProfilePageProps) {
  const resolvedParams = React.use(params)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const providerId = resolvedParams.id

  useEffect(() => {
    if (!providerId || isNaN(Number(providerId))) {
      setError("Invalid provider ID")
      setLoading(false)
      return
    }
    setLoading(false)
  }, [providerId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading provider profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/services">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Services
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Modern Provider Profile Component */}
      <ModernProviderProfile
        providerId={Number(providerId)}
        user={user}
        isAuthenticated={isAuthenticated}
      />
    </div>
  )
}
