"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, Calendar, Settings, Users, ShoppingBag, BarChart, FileText, Bell, LogOut, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

interface SidebarProps {
  userType: "customer" | "provider" | "admin"
}

export default function DashboardSidebar({ userType }: SidebarProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      toast.success("Logged out successfully")
    } catch (error) {
      console.error("Logout failed:", error)
      toast.error("Failed to logout. Please try again.")
    }
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  // Define navigation links based on user type
  const getNavLinks = () => {
    if (userType === "customer") {
      return [
        { name: "Dashboard", path: "/dashboard/customer", icon: Home },
        { name: "My Bookings", path: "/dashboard/customer/bookings", icon: Calendar },
        { name: "Favorites", path: "/dashboard/customer/favorites", icon: ShoppingBag },
        { name: "Notifications", path: "/dashboard/customer/notifications", icon: Bell },
        { name: "Settings", path: "/dashboard/customer/settings", icon: Settings },
      ]
    } else if (userType === "provider") {
      return [
        { name: "Dashboard", path: "/dashboard/provider", icon: Home },
        { name: "My Services", path: "/dashboard/provider/services", icon: ShoppingBag },
        { name: "Bookings", path: "/dashboard/provider/bookings", icon: Calendar },
        { name: "Earnings", path: "/dashboard/provider/earnings", icon: BarChart },
        { name: "Notifications", path: "/dashboard/provider/notifications", icon: Bell },
        { name: "Settings", path: "/dashboard/provider/settings", icon: Settings },
      ]
    } else {
      return [
        { name: "Dashboard", path: "/dashboard/admin", icon: Home },
        { name: "Users", path: "/dashboard/admin/users", icon: Users },
        { name: "Services", path: "/dashboard/admin/services", icon: ShoppingBag },
        { name: "Bookings", path: "/dashboard/admin/bookings", icon: Calendar },
        { name: "Reports", path: "/dashboard/admin/reports", icon: FileText },
        { name: "Settings", path: "/dashboard/admin/settings", icon: Settings },
      ]
    }
  }

  const navLinks = getNavLinks()

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          {userType === "customer"
            ? "Customer Dashboard"
            : userType === "provider"
              ? "Provider Dashboard"
              : "Admin Dashboard"}
        </h2>
        <div className="space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon
            return (
              <Button
                key={link.path}
                asChild
                variant="ghost"
                className={`w-full justify-start ${
                  isActive(link.path)
                    ? "bg-freshAqua/10 text-freshAqua hover:bg-freshAqua/20 hover:text-freshAqua"
                    : "hover:bg-background hover:text-foreground"
                }`}
              >
                <Link href={link.path}>
                  <Icon className="mr-2 h-4 w-4" />
                  {link.name}
                </Link>
              </Button>
            )
          })}
        </div>
      </div>
      <div className="mt-auto px-3 py-2">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <div className="h-full w-64 border-r bg-background">
          <SidebarContent />
        </div>
      </div>
    </>
  )
}
