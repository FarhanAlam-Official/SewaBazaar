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
  PanelLeft,
  LayoutDashboard,
  Star,
  Target,
  Users2,
  Briefcase,
  Image,
  AlertTriangle,
  CalendarCheck,
  History,
  CalendarDays,
  MessageSquare,
  Bookmark,
  Sparkles,
  CreditCard,
  Gift,
  LifeBuoy,
  CheckCircle,
  Ban
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
import { LucideIcon } from "lucide-react"

interface NavItem {
  name: string
  path: string
  icon: LucideIcon
}

interface NavGroup {
  group: string
  items: NavItem[]
}

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
  const [scrollPosition, setScrollPosition] = useState(0)
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  // Save scroll position before navigation
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('sidebar-scroll-area')) {
        setScrollPosition(target.scrollTop);
        localStorage.setItem('sidebarScrollPosition', target.scrollTop.toString());
      }
    };

    const sidebarElement = document.querySelector('.sidebar-scroll-area');
    if (sidebarElement) {
      sidebarElement.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (sidebarElement) {
        sidebarElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Restore scroll position after navigation
  useEffect(() => {
    const sidebarElement = document.querySelector('.sidebar-scroll-area');
    if (sidebarElement) {
      const savedPosition = localStorage.getItem('sidebarScrollPosition');
      if (savedPosition) {
        sidebarElement.scrollTop = parseInt(savedPosition);
      }
    }
  }, [pathname]);

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

  // Scroll to active menu item whenever pathname changes
  useEffect(() => {
    // Small delay to ensure the DOM is ready
    setTimeout(() => {
      const scrollViewport = document.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
      const activeButton = scrollViewport?.querySelector('button[data-state="active"]') as HTMLButtonElement;
      
      if (scrollViewport && activeButton) {
        // Get the relative position of the button within the viewport
        const viewportRect = scrollViewport.getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();
        const relativeTop = buttonRect.top - viewportRect.top + scrollViewport.scrollTop;
        
        // Calculate position to center the button
        const centerPosition = relativeTop - (viewportRect.height / 2) + (buttonRect.height / 2);
        
        // Smooth scroll the viewport
        scrollViewport.scrollTo({
          top: centerPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  }, [pathname]);

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
  const getNavLinks = (): (NavGroup | NavItem)[] => {
    if (userType === "customer") {
      return [
        {
          group: "Overview",
          items: [
            { name: "Dashboard", path: "/dashboard/customer", icon: LayoutDashboard },
            { name: "Notifications", path: "/dashboard/customer/notifications", icon: Bell },
            { name: "Alerts", path: "/dashboard/customer/alerts", icon: AlertTriangle },
          ]
        },
        {
          group: "Services",
          items: [
            { name: "My Bookings", path: "/dashboard/customer/bookings", icon: CalendarCheck },
            { name: "History", path: "/dashboard/customer/history", icon: History },
            { name: "Schedule", path: "/dashboard/customer/schedule", icon: CalendarDays },
            { name: "Reviews", path: "/dashboard/customer/reviews", icon: MessageSquare },
          ]
        },
        {
          group: "Preferences",
          items: [
            { name: "Favorites", path: "/dashboard/customer/favorites", icon: Star },
            { name: "Wishlist", path: "/dashboard/customer/wishlist", icon: Bookmark },
            { name: "Recommendations", path: "/dashboard/customer/recommendations", icon: Sparkles },
          ]
        },
        {
          group: "Payments",
          items: [
            { name: "Payments", path: "/dashboard/customer/payments", icon: CreditCard },
            { name: "Offers", path: "/dashboard/customer/offers", icon: Gift },
          ]
        },
        {
          group: "Support",
          items: [
            { name: "Support", path: "/dashboard/customer/support", icon: LifeBuoy },
            { name: "Family Access", path: "/dashboard/customer/family", icon: Users2 },
          ]
        },
        {
          group: "Account",
          items: [
            { name: "Profile", path: "/dashboard/customer/profile", icon: UserCircle },
            { name: "Settings", path: "/dashboard/customer/settings", icon: Settings },
          ]
        }
      ] as NavGroup[]
    } else if (userType === "provider") {
      return [
        {
          group: "Overview",
          items: [
            { name: "Dashboard", path: "/dashboard/provider", icon: LayoutDashboard },
            { name: "Notifications", path: "/dashboard/provider/notifications", icon: Bell },
          ]
        },
        {
          group: "Business",
          items: [
            { name: "Services", path: "/dashboard/provider/services", icon: ShoppingBag },
            { name: "Bookings", path: "/dashboard/provider/bookings", icon: Briefcase },
            { name: "Schedule", path: "/dashboard/provider/schedule", icon: Calendar },
          ]
        },
        {
          group: "Performance",
          items: [
            { name: "Analytics", path: "/dashboard/provider/analytics", icon: BarChart2 },
            { name: "Earnings", path: "/dashboard/provider/earnings", icon: DollarSign },
            { name: "Reviews", path: "/dashboard/provider/reviews", icon: Star },
          ]
        },
        {
          group: "Growth",
          items: [
            { name: "Customers", path: "/dashboard/provider/customers", icon: Users2 },
            { name: "Portfolio", path: "/dashboard/provider/portfolio", icon: Image },
            { name: "Marketing", path: "/dashboard/provider/marketing", icon: Target },
          ]
        },
        {
          group: "Account",
          items: [
            { name: "Profile", path: "/dashboard/provider/profile", icon: UserCircle },
            { name: "Documents", path: "/dashboard/provider/documents", icon: FileText },
            { name: "Settings", path: "/dashboard/provider/settings", icon: Settings },
          ]
        }
      ] as NavGroup[]
    } else if (userType === "admin") {
      return [
        {
          group: "Overview",
          items: [
            { name: "Dashboard", path: "/dashboard/admin", icon: LayoutDashboard },
            { name: "Analytics", path: "/dashboard/admin/analytics", icon: BarChart2 },
            { name: "Reports", path: "/dashboard/admin/reports", icon: FileText },
          ]
        },
        {
          group: "User Management",
          items: [
            { name: "Users", path: "/dashboard/admin/users", icon: Users },
            { name: "Roles", path: "/dashboard/admin/users/roles", icon: Users2 },
            { name: "Activity Logs", path: "/dashboard/admin/users/activity", icon: History },
          ]
        },
        {
          group: "Content",
          items: [
            { name: "CMS", path: "/dashboard/admin/cms", icon: FileText },
            { name: "Assets", path: "/dashboard/admin/cms/assets", icon: Image },
            { name: "Blog", path: "/dashboard/admin/cms/blog", icon: FileText },
          ]
        },
        {
          group: "Services",
          items: [
            { name: "Services", path: "/dashboard/admin/services", icon: ShoppingBag },
            { name: "Categories", path: "/dashboard/admin/services/categories", icon: Briefcase },
            { name: "Approvals", path: "/dashboard/admin/services/approvals", icon: CheckCircle },
          ]
        },
        {
          group: "Bookings",
          items: [
            { name: "All Bookings", path: "/dashboard/admin/bookings", icon: Calendar },
            { name: "Calendar", path: "/dashboard/admin/bookings/calendar", icon: CalendarDays },
            { name: "Disputes", path: "/dashboard/admin/bookings/disputes", icon: AlertTriangle },
          ]
        },
        {
          group: "Marketing",
          items: [
            { name: "Notifications", path: "/dashboard/admin/notifications", icon: Bell },
            { name: "Promotions", path: "/dashboard/admin/promotions", icon: Gift },
            { name: "Campaigns", path: "/dashboard/admin/promotions/campaigns", icon: Target },
          ]
        },
        {
          group: "Moderation",
          items: [
            { name: "Reviews", path: "/dashboard/admin/moderation/reviews", icon: Star },
            { name: "Reports", path: "/dashboard/admin/moderation/reports", icon: AlertTriangle },
            { name: "Blacklist", path: "/dashboard/admin/moderation/blacklist", icon: Ban },
          ]
        },
        {
          group: "System",
          items: [
            { name: "Settings", path: "/dashboard/admin/settings", icon: Settings },
            { name: "Theme", path: "/dashboard/admin/theme", icon: Palette },
            { name: "Tools", path: "/dashboard/admin/tools", icon: Wrench },
          ]
        },
      ] as NavGroup[]
    }
    
    // Default return for unknown user types
    return [] as NavItem[]
  }

  const navLinks = getNavLinks()

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex h-screen flex-col gap-4">
      <div className="flex h-14 items-center justify-between px-4 pb-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2"
        >
          {!isCollapsed && (
            <>
              <ShoppingBag className="h-5 w-5 text-foreground" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">Admin</span>
                <span className="text-base font-semibold text-foreground">Dashboard</span>
              </div>
            </>
          )}
        </Link>
        {!isMobile && (
          <Button
            variant={isCollapsed ? "default" : "ghost"}
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "h-8 w-8 transition-all duration-300 ease-in-out",
              isCollapsed 
                ? "bg-gradient-to-r from-saffronGlow via-freshAqua to-freshAqua text-white hover:opacity-90"
                : "hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20"
            )}
          >
            {isCollapsed ? 
              <PanelLeft className="h-4 w-4" /> : 
              <PanelLeftClose className="h-4 w-4" />
            }
          </Button>
        )}
      </div>

      <ScrollArea 
        className="sidebar-scroll-area flex-1 overflow-hidden"
      >
        <div className={cn(
          "flex flex-col gap-4",
          isCollapsed ? "px-2" : "px-4"
        )}>
          {navLinks.map((item, index) => {
            if ('group' in item) {
              return (
                <div key={index} className={cn(
                  "space-y-1",
                  isCollapsed && "space-y-2"
                )}>
                  {!isCollapsed && (
                    <h4 className="mb-2 px-2 text-[15px] font-semibold bg-gradient-to-r from-indigo-500 to-primary bg-clip-text text-transparent dark:from-indigo-400 dark:to-primary">
                      {item.group}
                    </h4>
                  )}
                  {item.items.map((link, linkIndex) => {
                    const Icon = link.icon
                    const isActive = pathname === link.path
                    return (
                      <TooltipProvider key={linkIndex}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={link.path}>
                              <Button
                                variant={isActive ? "default" : "ghost"}
                                size={isCollapsed ? "icon" : "default"}
                                className={cn(
                                  "w-full transition-all duration-300 ease-in-out text-sm",
                                  isCollapsed ? "h-9 w-9 p-0" : "justify-start",
                                  isActive 
                                    ? "bg-gradient-to-r from-saffronGlow via-freshAqua to-freshAqua text-white hover:opacity-90"
                                    : "hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20"
                                )}
                                data-state={isActive ? "active" : "inactive"}
                              >
                                <Icon className={cn(
                                  "h-4 w-4 flex-shrink-0",
                                  isActive 
                                    ? "text-white" 
                                    : "text-foreground",
                                  !isCollapsed && "mr-2"
                                )} />
                                {!isCollapsed && <span>{link.name}</span>}
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="text-xs font-medium">
                            {isCollapsed ? link.name : `${item.group} - ${link.name}`}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })}
                </div>
              )
            } else {
              // This is a single item (for customer and admin views)
              const Icon = item.icon
              const isActive = pathname === item.path
              return (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={item.path}>
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          size={isCollapsed ? "icon" : "default"}
                          className={cn(
                            "w-full transition-all duration-300 ease-in-out text-sm",
                            isCollapsed ? "h-9 w-9 p-0" : "justify-start",
                            isActive 
                              ? "bg-gradient-to-r from-saffronGlow via-freshAqua to-freshAqua text-white hover:opacity-90"
                              : "hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20"
                          )}
                          data-state={isActive ? "active" : "inactive"}
                        >
                          <Icon className={cn(
                            "h-4 w-4 flex-shrink-0",
                            isActive 
                              ? "text-white" 
                              : "text-foreground",
                            !isCollapsed && "mr-2"
                          )} />
                          {!isCollapsed && <span>{item.name}</span>}
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs font-medium">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            }
          })}
        </div>
      </ScrollArea>

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
