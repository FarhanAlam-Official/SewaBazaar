"use client"

import { useAuth } from "@/contexts/AuthContext"
import DashboardSidebar from "@/components/layout/dashboard-sidebar"
import { redirect } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()

  console.log("Dashboard Layout - User:", user)
  console.log("Dashboard Layout - Loading:", loading)

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
    console.log("No user found, redirecting to login")
    redirect("/login")
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