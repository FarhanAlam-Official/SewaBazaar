'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardSidebar from '@/components/layout/dashboard-sidebar'
import { usePathname, useRouter } from 'next/navigation'
import { usePermissionGuard } from '@/utils/permissionGuard'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const { checkPermission } = usePermissionGuard()

  useEffect(() => {
    // Only run routing logic if we have user data and not loading
    if (!loading && user) {
      // If we're at the root dashboard path, redirect to role-specific dashboard
      if (pathname === '/dashboard') {
        const validRoles = ['customer', 'provider', 'admin']
        if (validRoles.includes(user.role)) {
          router.push(`/dashboard/${user.role}`)
        } else {
          router.push('/login')
        }
        return
      }

      // If user tries to access a different role's dashboard, trigger unauthorized error page
      const segments = pathname.split('/')
      const requestedRole = segments[2] // e.g., /dashboard/admin -> admin
      if (
        requestedRole &&
        ['customer', 'provider', 'admin'].includes(requestedRole) &&
        requestedRole !== user.role
      ) {
        checkPermission(user.role as any, {
          allowedRoles: [requestedRole as any],
          requestedPath: pathname,
        })
      }
    } else if (!loading && !user) {
      // If not loading and no user, redirect to login
      router.push('/login')
    }
  }, [user, loading, pathname, checkPermission, router])

  // Don't render anything if still loading authentication state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex">
          {/* Sidebar (collapsed by default) */}
          <aside className="hidden lg:block w-16 border-r">
            <div className="p-3 space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-8 rounded-md mx-auto" />
              ))}
            </div>
          </aside>

          {/* Main content skeleton closely mirroring dashboards */}
          <main className="flex-1 w-full py-8 px-4 lg:px-6 xl:px-8">
            <div className="space-y-8 w-full">
                            {/* Page Title Header (common to all pages) */}
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                  {/* Page title */}
                  <Skeleton className="h-8 w-64" />
                  {/* Breadcrumbs */}
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                {/* Page header actions */}
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-24 rounded" />
                  <Skeleton className="h-9 w-24 rounded" />
                </div>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[0, 1, 2, 3].map((i) => (
                  <Card key={i} className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-10 w-10 rounded-xl" />
                    </div>
                    <Skeleton className="h-2.5 w-full rounded" />
                  </Card>
                ))}
              </div>

              {/* Analytics: Bookings pie + Monthly trends */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <div className="h-64 rounded-lg border">
                    <Skeleton className="h-full w-full rounded-lg" />
                  </div>
                </Card>
                <Card className="p-6 space-y-4">
                  <Skeleton className="h-6 w-56" />
                  <div className="h-64 rounded-lg border">
                    <Skeleton className="h-full w-full rounded-lg" />
                  </div>
                </Card>
              </div>

              {/* Category donut + Spending/Earnings bar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 space-y-4">
                  <Skeleton className="h-6 w-44" />
                  <div className="h-64 rounded-lg border">
                    <Skeleton className="h-full w-full rounded-lg" />
                  </div>
                </Card>
                <Card className="p-6 space-y-4">
                  <Skeleton className="h-6 w-44" />
                  <div className="h-64 rounded-lg border">
                    <Skeleton className="h-full w-full rounded-lg" />
                  </div>
                </Card>
              </div>

              {/* Upcoming services timeline */}
              <Card className="p-6 space-y-4">
                <Skeleton className="h-6 w-64" />
                <div className="space-y-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3 flex-1">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <div className="space-y-2 w-full">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right space-y-2">
                          <Skeleton className="h-5 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <div className="w-24">
                          <Skeleton className="h-2.5 w-full rounded-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="bg-pearlWhite relative flex h-screen overflow-hidden dark:bg-black">
      {user && (
        <DashboardSidebar
          userType={user.role as 'customer' | 'provider' | 'admin'}
        />
      )}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
