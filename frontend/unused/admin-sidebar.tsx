"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Calendar,
  BarChart2,
  Settings,
  Palette,
  Wrench,
  UserCircle,
  LogOut,
  Menu,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

const menuItems = [
  {
    title: "Overview",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/dashboard/admin/users",
    icon: Users,
  },
  {
    title: "Services",
    href: "/dashboard/admin/services",
    icon: ShoppingBag,
  },
  {
    title: "Bookings",
    href: "/dashboard/admin/bookings",
    icon: Calendar,
  },
  {
    title: "Reports",
    href: "/dashboard/admin/reports",
    icon: BarChart2,
  },
  {
    title: "Profile",
    href: "/dashboard/admin/profile",
    icon: UserCircle,
  },
  {
    title: "Settings",
    href: "/dashboard/admin/settings",
    icon: Settings,
  },
  {
    title: "Theme",
    href: "/dashboard/admin/theme",
    icon: Palette,
  },
  {
    title: "Tools",
    href: "/dashboard/admin/tools",
    icon: Wrench,
  },
]

export function AdminSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex h-14 items-center px-4 font-semibold">
        <Link href="/dashboard/admin">Admin Dashboard</Link>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <nav className="grid gap-1 px-2 py-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <Button
                key={index}
                asChild
                variant={pathname === item.href ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  pathname === item.href
                    ? "bg-gradient-to-r from-saffron-glow via-fresh-aqua to-fresh-aqua text-white hover:opacity-90 transition-all"
                    : "hover:bg-muted hover:text-foreground"
                )}
              >
                <Link href={item.href}>
                  <Icon className={cn("mr-2 h-4 w-4", pathname === item.href ? "text-white" : "")} />
                  {item.title}
                </Link>
              </Button>
            )
          })}
        </nav>
      </ScrollArea>
      <div className="mt-auto p-4">
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
      <div className="hidden border-r bg-background lg:block lg:w-64">
        <SidebarContent />
      </div>
    </>
  )
} 