"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import DashboardSidebar from "@/components/layout/dashboard-sidebar"
import { redirect, usePathname } from "next/navigation"
import { useRouter } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
        return
      }

      // Handle role-specific redirects
      if (pathname === "/dashboard") {
        switch (user.role) {
          case "customer":
            router.push("/dashboard/customer")
            break
          case "provider":
            router.push("/dashboard/provider")
            break
          case "admin":
            router.push("/dashboard/admin")
            break
          default:
            router.push("/login")
        }
        return
      }

      // Check if user has access to the current dashboard section
      const hasAccess = pathname.includes(`/dashboard/${user.role}`)
      if (!hasAccess) {
        router.push(`/dashboard/${user.role}`)
      }
    }
  }, [user, loading, pathname, router])

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
  const isAdminRoute = pathname.startsWith('/dashboard/admin')

  return (
    <div className="flex min-h-screen bg-pearlWhite dark:bg-black">
      {!isAdminRoute && <DashboardSidebar userType={user.role} />}
      <div className="flex-1 p-8">
        {children}
      </div>
    </div>
  )
} 