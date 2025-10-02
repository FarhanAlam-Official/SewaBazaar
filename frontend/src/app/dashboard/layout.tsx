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

  // Don't render anything if still loading authentication state
  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-pearlWhite dark:bg-black">
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-8">
            <div className="animate-pulse space-y-8">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-pearlWhite dark:bg-black relative">
      {user && <DashboardSidebar userType={user.role as "customer" | "provider" | "admin"} />}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}