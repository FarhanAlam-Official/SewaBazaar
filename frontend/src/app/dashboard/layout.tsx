"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import DashboardSidebar from "@/components/layout/dashboard-sidebar"
import { usePathname, useRouter } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Only run routing logic if we have user data and not loading
    if (!loading && user) {
      // If we're at the root dashboard path, redirect to role-specific dashboard
      if (pathname === "/dashboard") {
        const validRoles = ["customer", "provider", "admin"]
        if (validRoles.includes(user.role)) {
          router.push(`/dashboard/${user.role}`)
        } else {
          router.push("/login")
        }
        return
      }

      // Check if user is trying to access a dashboard they don't have access to
      const rolePatterns = {
        customer: /^\/dashboard\/customer/,
        provider: /^\/dashboard\/provider/,
        admin: /^\/dashboard\/admin/
      }

      // Only redirect if user is trying to access wrong dashboard section
      const isAccessingWrongSection = Object.entries(rolePatterns).some(([role, pattern]) => {
        return pattern.test(pathname) && role !== user.role
      })

      if (isAccessingWrongSection) {
        router.push(`/dashboard/${user.role}`)
      }
    } else if (!loading && !user) {
      // If not loading and no user, redirect to login
      router.push("/login")
    }
  }, [user, loading, pathname])

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated
  if (!user) {
    return null
  }

  // Don't render the sidebar for admin routes since they have their own layout
  const isAdminRoute = pathname.startsWith('/dashboard/admin/')

  return (
    <div className="flex min-h-screen bg-pearlWhite dark:bg-black">
      {!isAdminRoute && user && <DashboardSidebar userType={user.role} />}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
} 