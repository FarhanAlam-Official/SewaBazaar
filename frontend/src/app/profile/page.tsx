"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function ProfileRouter() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      // Redirect based on user role
      switch (user.role) {
        case "customer":
          router.push("/dashboard/customer/profile")
          break
        case "provider":
          router.push("/dashboard/provider/profile")
          break
        case "admin":
          router.push("/dashboard/admin/profile")
          break
        default:
          router.push("/login")
      }
    } else if (!loading && !user) {
      // If not logged in, redirect to login
      router.push("/login")
    }
  }, [user, loading, router])

  // Show loading state while checking auth and redirecting
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
} 