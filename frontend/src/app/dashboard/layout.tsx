"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import DashboardSidebar from "@/components/layout/dashboard-sidebar"
import { redirect } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      // Redirect to role-specific dashboard if on /dashboard
      if (window.location.pathname === "/dashboard") {
        switch (user.role) {
          case "customer":
            redirect("/dashboard/customer")
            break
          case "provider":
            redirect("/dashboard/provider")
            break
          case "admin":
            redirect("/dashboard/admin")
            break
          default:
            redirect("/login")
        }
      }
    }
  }, [user, loading])

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

  if (!user) {
    redirect("/login")
  }

  // Check if user has access to the current dashboard section
  const currentPath = window.location.pathname
  const hasAccess = currentPath.includes(`/dashboard/${user.role}`)
  
  if (!hasAccess) {
    redirect(`/dashboard/${user.role}`)
  }

  return (
    <div className="flex min-h-screen bg-pearlWhite dark:bg-black">
      <DashboardSidebar userType={user.role} />
      <div className="flex-1 p-8">
        {children}
      </div>
    </div>
  )
} 