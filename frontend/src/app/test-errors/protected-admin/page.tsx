"use client"

import { useAuth } from "@/contexts/AuthContext"
import { usePermissionGuard } from "@/utils/permissionGuard"
import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, User, Settings, Database } from "lucide-react"

export default function ProtectedAdminPage() {
  const { user } = useAuth()
  const { requireRole } = usePermissionGuard()

  useEffect(() => {
    // This will trigger unauthorized error if user is not admin
    requireRole(user?.role, 'admin')
  }, [user?.role, requireRole])

  // This page will only render if user has admin role
  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-3xl font-bold">Admin Dashboard</CardTitle>
          <CardDescription className="text-lg">
            This page is restricted to administrators only
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <Badge variant="destructive" className="text-lg px-4 py-2">
              Admin Access Required
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader className="text-center">
                <User className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <CardTitle className="text-lg">User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Manage user accounts, roles, and permissions
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader className="text-center">
                <Settings className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <CardTitle className="text-lg">System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Configure system-wide settings and preferences
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader className="text-center">
                <Database className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Database</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Access database management and analytics
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200 font-medium">
              ✅ You have successfully accessed the admin dashboard!
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Current user: {user?.first_name} ({user?.role})
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
