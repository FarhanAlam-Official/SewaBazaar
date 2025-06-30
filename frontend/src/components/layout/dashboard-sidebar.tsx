"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  Home, 
  Calendar, 
  Settings, 
  Users, 
  ShoppingBag, 
  BarChart2, 
  FileText, 
  Bell, 
  LogOut, 
  Menu,
  Palette,
  Wrench,
  UserCircle,
  Heart,
  DollarSign,
  PanelLeftClose,
  PanelLeft
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SidebarProps {
  userType: "customer" | "provider" | "admin"
}

export default function DashboardSidebar({ userType }: SidebarProps) {
  const [open, setOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Initialize from localStorage if available, default to false
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  // Update localStorage when collapse state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed))
    }
  }, [isCollapsed])

  // Close mobile sidebar when route changes
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Load collapse state from localStorage on mount and window focus
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('sidebarCollapsed')
      if (saved !== null) {
        setIsCollapsed(JSON.parse(saved))
      }
    }

    // Load initial state
    handleStorageChange()

    // Update state when localStorage changes (e.g. from another tab)
    window.addEventListener('storage', handleStorageChange)
    // Update state when window gains focus
    window.addEventListener('focus', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleStorageChange)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      toast.success("Logged out successfully")
    } catch (error) {
      console.error("Logout failed:", error)
      toast.error("Failed to logout. Please try again.")
    }
  }

  // Define navigation links based on user type
  const getNavLinks = () => {
    if (userType === "customer") {
      return [
        { name: "Dashboard", path: "/dashboard/customer", icon: Home },
        { name: "Profile", path: "/dashboard/customer/profile", icon: UserCircle },
        { name: "My Bookings", path: "/dashboard/customer/bookings", icon: Calendar },
        { name: "Favorites", path: "/dashboard/customer/favorites", icon: Heart },
        { name: "Notifications", path: "/dashboard/customer/notifications", icon: Bell },
        { name: "Settings", path: "/dashboard/customer/settings", icon: Settings },
      ]
    } else if (userType === "provider") {
      return [
        { name: "Dashboard", path: "/dashboard/provider", icon: Home },
        { name: "Profile", path: "/dashboard/provider/profile", icon: UserCircle },
        { name: "My Services", path: "/dashboard/provider/services", icon: ShoppingBag },
        { name: "Bookings", path: "/dashboard/provider/bookings", icon: Calendar },
        { name: "Earnings", path: "/dashboard/provider/earnings", icon: DollarSign },
        { name: "Notifications", path: "/dashboard/provider/notifications", icon: Bell },
        { name: "Settings", path: "/dashboard/provider/settings", icon: Settings },
      ]
    } else {
      return [
        { name: "Dashboard", path: "/dashboard/admin", icon: Home },
        { name: "Users", path: "/dashboard/admin/users", icon: Users },
        { name: "Services", path: "/dashboard/admin/services", icon: ShoppingBag },
        { name: "Bookings", path: "/dashboard/admin/bookings", icon: Calendar },
        { name: "Reports", path: "/dashboard/admin/reports", icon: BarChart2 },
        { name: "Profile", path: "/dashboard/admin/profile", icon: UserCircle },
        { name: "Settings", path: "/dashboard/admin/settings", icon: Settings },
        { name: "Theme", path: "/dashboard/admin/theme", icon: Palette },
        { name: "Tools", path: "/dashboard/admin/tools", icon: Wrench },
      ]
    }
  }

  const navLinks = getNavLinks()

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">
      <div className={cn(
        "flex h-14 items-center border-b transition-all duration-300 ease-in-out",
        isCollapsed && !isMobile ? "px-2 justify-center" : "px-4 justify-between"
      )}>
        {(!isCollapsed || isMobile) && (
          <Link href={`/dashboard/${userType}`} className="font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out">
            {userType === "customer"
              ? "Customer Dashboard"
              : userType === "provider"
                ? "Provider Dashboard"
                : "Admin Dashboard"}
          </Link>
        )}
        {!isMobile && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={isCollapsed ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-8 w-8 transition-all duration-300 ease-in-out",
                    isCollapsed && "bg-gradient-to-r from-saffronGlow via-freshAqua to-freshAqua text-white hover:opacity-90",
                    !isCollapsed && "hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20"
                  )}
                  onClick={() => setIsCollapsed(!isCollapsed)}
                >
                  {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <nav className={cn(
            "grid gap-1 py-2 transition-all duration-300 ease-in-out", 
            isCollapsed && !isMobile ? "px-2" : "px-4"
          )}>
            {navLinks.map((link, index) => {
              const Icon = link.icon
              const isActive = pathname === link.path
              return (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={link.path}>
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          className={cn(
                            "flex items-center transition-all duration-300 ease-in-out overflow-hidden w-full",
                            isActive
                              ? "bg-gradient-to-r from-saffronGlow via-freshAqua to-freshAqua text-white hover:opacity-90"
                              : "hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20",
                            isCollapsed && !isMobile ? "justify-center w-10 px-0" : "justify-start w-full"
                          )}
                        >
                          <Icon className={cn("h-4 w-4 flex-shrink-0", 
                            isActive ? "text-white" : "text-gray-500 group-hover:text-[#170ff0]",
                            (!isCollapsed || isMobile) && "mr-2"
                          )} />
                          {(!isCollapsed || isMobile) && (
                            <span className="transition-all duration-300 ease-in-out">{link.name}</span>
                          )}
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && !isMobile && (
                      <TooltipContent side="right">
                        {link.name}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </nav>
        </ScrollArea>
      </div>
      <div className={cn(
        "mt-auto transition-all duration-300 ease-in-out",
        isCollapsed && !isMobile ? "p-2" : "p-4"
      )}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                className={cn(
                  "text-red-500 hover:text-red-600 hover:bg-red-100/50 dark:hover:bg-red-900/20 transition-all duration-300 ease-in-out",
                  isCollapsed && !isMobile ? "justify-center w-10 px-0" : "justify-start w-full"
                )}
                onClick={handleLogout}
              >
                <LogOut className={cn("h-4 w-4 flex-shrink-0", (!isCollapsed || isMobile) && "mr-2")} />
                {(!isCollapsed || isMobile) && (
                  <span className="transition-all duration-300 ease-in-out">Logout</span>
                )}
              </Button>
            </TooltipTrigger>
            {isCollapsed && !isMobile && (
              <TooltipContent side="right">
                Logout
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
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
            <SidebarContent isMobile={true} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden border-r bg-background lg:block transition-all duration-300 ease-in-out will-change-[width] overflow-hidden",
        isCollapsed ? "lg:w-16" : "lg:w-64"
      )}>
        <SidebarContent isMobile={false} />
      </div>
    </>
  )
}
