/**
 * Dashboard Sidebar Component
 * 
 * A responsive sidebar navigation component for the SewaBazaar dashboard that provides:
 * - Role-based navigation (customer, provider, admin)
 * - Collapsible/expandable functionality
 * - Mobile-responsive design with slide-out menu
 * - Active state highlighting with proper route matching
 * - Scroll position persistence across navigation
 * - Tooltips for collapsed state
 * - Logout functionality with confirmation
 * 
 * Features:
 * - Handles Next.js trailing slash inconsistencies in routing
 * - Persists sidebar state in localStorage
 * - Smooth animations and transitions
 * - Dark/light theme support
 * - Accessibility features with proper ARIA labels
 */

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {  
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
  Sparkles,
  CreditCard,
  Gift,
  LifeBuoy,
  CheckCircle,
  Ban,
  Activity
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/contexts/AuthContext"
import { showToast } from "@/components/ui/enhanced-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { LucideIcon } from "lucide-react"

/**
 * Interface for individual navigation items
 * @interface NavItem
 * @property {string} name - Display name of the navigation item
 * @property {string} path - URL path for the navigation item
 * @property {LucideIcon} icon - Icon component to display for the item
 */
interface NavItem {
  name: string
  path: string
  icon: LucideIcon
}

/**
 * Interface for grouped navigation items
 * @interface NavGroup
 * @property {string} group - Group title/label
 * @property {NavItem[]} items - Array of navigation items in this group
 */
interface NavGroup {
  group: string
  items: NavItem[]
}

/**
 * Props interface for the DashboardSidebar component
 * @interface SidebarProps
 * @property {("customer"|"provider"|"admin")} userType - Type of user to determine navigation structure
 */
interface SidebarProps {
  userType: "customer" | "provider" | "admin"
}

/**
 * Main Dashboard Sidebar Component
 * Provides navigation for different user types with responsive design
 */
export default function DashboardSidebar({ userType }: SidebarProps) {
  // Mobile sidebar open/close state
  const [open, setOpen] = useState(false)
  
  // Sidebar collapsed state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Initialize sidebar state from localStorage if available, default to expanded (false)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })
  
  // Next.js hooks for navigation and routing
  const pathname = usePathname()
  const { logout } = useAuth()

  /**
   * Persist sidebar collapse state to localStorage
   * This ensures user preference is maintained across sessions
   */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed))
      
      // Show toast notification for better UX
      if (isCollapsed) {
        showToast.info({
          title: "Sidebar Collapsed",
          description: "Hover over icons to see labels",
          duration: 2000
        })
      }
    }
  }, [isCollapsed])

  /**
   * Close mobile sidebar when route changes
   * This improves mobile UX by auto-closing the overlay
   */
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  /**
   * Load and sync collapse state from localStorage
   * Handles multi-tab synchronization and initial state loading
   */
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('sidebarCollapsed')
      if (saved !== null) {
        setIsCollapsed(JSON.parse(saved))
      }
    }

    // Load initial state on component mount
    handleStorageChange()

    // Sync state when localStorage changes (e.g., from another tab)
    window.addEventListener('storage', handleStorageChange)
    // Update state when window gains focus (for cross-tab sync)
    window.addEventListener('focus', handleStorageChange)

    // Cleanup event listeners
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleStorageChange)
    }
  }, [])

  /**
   * Auto-scroll to active menu item for better UX
   * Centers the active item in the viewport when navigating
   */
  useEffect(() => {
    // Small delay to ensure the DOM is ready after navigation
    setTimeout(() => {
      const scrollViewport = document.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
      const activeButton = scrollViewport?.querySelector('button[data-state="active"]') as HTMLButtonElement;
      
      if (scrollViewport && activeButton) {
        // Calculate the relative position of the active button within the viewport
        const viewportRect = scrollViewport.getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();
        const relativeTop = buttonRect.top - viewportRect.top + scrollViewport.scrollTop;
        
        // Calculate position to center the active button in the viewport
        const centerPosition = relativeTop - (viewportRect.height / 2) + (buttonRect.height / 2);
        
        // Smooth scroll the viewport to center the active item
        scrollViewport.scrollTo({
          top: centerPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  }, [pathname]);

  /**
   * Handle user logout with proper error handling and toast notifications
   * Provides user feedback for both success and failure scenarios
   */
  const handleLogout = async () => {
    try {
      await logout()
      showToast.success({
        title: "Success",
        description: "Logged out successfully",
        duration: 3000
      })
    } catch (error) {
      console.error("Logout failed:", error)
      showToast.error({
        title: "Logout Failed",
        description: "Failed to logout. Please try again.",
        duration: 4000
      })
    }
  }

  /**
   * Generate navigation structure based on user type
   * Returns different navigation items and groupings for each user role
   * @returns {(NavGroup | NavItem)[]} Array of navigation groups or individual items
   */
  const getNavLinks = (): (NavGroup | NavItem)[] => {
    if (userType === "customer") {
      // Customer navigation structure with grouped items for better organization
      return [
        {
          group: "Overview",
          items: [
            { name: "Dashboard", path: "/dashboard/customer", icon: LayoutDashboard },
            { name: "Notifications", path: "/dashboard/customer/notifications", icon: Bell },
            { name: "Activity Timeline", path: "/dashboard/customer/activity", icon: Activity },
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
      // Provider navigation structure focused on business management
      return [
        {
          group: "Overview",
          items: [
            { name: "Dashboard", path: "/dashboard/provider", icon: LayoutDashboard },
            { name: "Notifications", path: "/dashboard/provider/notifications", icon: Bell },
            { name: "Activity Timeline", path: "/dashboard/provider/activity", icon: Activity },
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
      // Admin navigation structure with comprehensive system management
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
            { name: "Monitoring", path: "/dashboard/admin/system", icon: Activity },
          ]
        },
      ] as NavGroup[]
    }
    
    // Fallback for unknown user types - show basic navigation
    showToast.error({
      title: "Navigation Error",
      description: "Unknown user type. Please contact support.",
      duration: 5000
    })
    return [] as NavItem[]
  }

  // Get the navigation structure for the current user type
  const navLinks = getNavLinks()

  /**
   * Sidebar Content Component
   * Renders the main navigation content for both desktop and mobile views
   * @param {boolean} isMobile - Whether this is rendering for mobile view
   */
  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex h-screen flex-col gap-4">
      {/* Sidebar Header with Logo and Collapse Button */}
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
        {/* Collapse/Expand button - only show on desktop */}
        {!isMobile && (
          <Button
            variant={isCollapsed ? "default" : "ghost"}
            size="icon"
            onClick={() => {
              setIsCollapsed(!isCollapsed)
              // Show helpful toast when expanding
              if (isCollapsed) {
                showToast.info({
                  title: "Sidebar Expanded",
                  description: "Navigation labels are now visible",
                  duration: 2000
                })
              }
            }}
            className={cn(
              "h-8 w-8 transition-all duration-300 ease-in-out",
              isCollapsed 
                ? "bg-gradient-to-r from-saffron-glow via-fresh-aqua to-fresh-aqua text-white hover:opacity-90"
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

      {/* Main Navigation Content with Scroll Area */}
      <ScrollArea 
        className="sidebar-scroll-area flex-1 overflow-hidden"
      >
        <div className={cn(
          "flex flex-col gap-4",
          isCollapsed ? "px-2" : "px-4"
        )}>
          {/* Render Navigation Items */}
          {navLinks.map((item, index) => {
            if ('group' in item) {
              // This is a grouped navigation item (NavGroup)
              return (
                <div key={index} className={cn(
                  "space-y-1",
                  isCollapsed && "space-y-2"
                )}>
                  {/* Group Title - only show when sidebar is expanded */}
                  {!isCollapsed && (
                    <h4 className="mb-2 px-2 text-[15px] font-semibold bg-gradient-to-r from-indigo-500 to-primary bg-clip-text text-transparent dark:from-indigo-400 dark:to-primary">
                      {item.group}
                    </h4>
                  )}
                  {/* Group Items */}
                  {item.items.map((link, linkIndex) => {
                    const Icon = link.icon
                    // Normalize pathname by removing trailing slash for accurate route matching
                    // Next.js sometimes adds trailing slashes that don't match our defined routes
                    const normalizedPathname = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname
                    const isActive = normalizedPathname === link.path
                    return (
                      <TooltipProvider key={linkIndex}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={link.path}>
                              <Button
                                variant={isActive ? "default" : "ghost"}
                                size={isCollapsed ? "icon" : "default"}
                                className={cn(
                                  "w-full transition-all duration-300 ease-in-out text-sm group",
                                  isCollapsed ? "h-9 w-9 p-0" : "justify-start",
                                  isActive 
                                    // Force active state styling with !important to override any conflicting CSS
                                    ? "!bg-primary !text-primary-foreground hover:!bg-primary/90 !border-primary shadow-md" 
                                    : "hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary text-foreground"
                                )}
                                data-state={isActive ? "active" : "inactive"}
                              >
                                <Icon className={cn(
                                  "h-4 w-4 flex-shrink-0",
                                  isActive 
                                    // Ensure icon is white when menu item is active
                                    ? "!text-primary-foreground" 
                                    : "text-foreground group-hover:text-primary",
                                  !isCollapsed && "mr-2"
                                )} />
                                {!isCollapsed && <span>{link.name}</span>}
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          {/* Tooltip shows on hover when sidebar is collapsed or for additional context */}
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
              // This is a single navigation item (used for simple navigation structures)
              const Icon = item.icon
              // Normalize pathname by removing trailing slash for accurate route matching
              // Next.js sometimes adds trailing slashes that don't match our defined routes
              const normalizedPathname = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname
              const isActive = normalizedPathname === item.path
              return (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={item.path}>
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          size={isCollapsed ? "icon" : "default"}
                          className={cn(
                            "w-full transition-all duration-300 ease-in-out text-sm group",
                            isCollapsed ? "h-9 w-9 p-0" : "justify-start",
                            isActive 
                              // Force active state styling with !important to override any conflicting CSS
                              ? "!bg-primary !text-primary-foreground hover:!bg-primary/90 !border-primary shadow-md"
                              : "hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary text-foreground"
                          )}
                          data-state={isActive ? "active" : "inactive"}
                        >
                          <Icon className={cn(
                            "h-4 w-4 flex-shrink-0",
                            isActive 
                              // Ensure icon is white when menu item is active
                              ? "!text-primary-foreground" 
                              : "text-foreground group-hover:text-primary",
                            !isCollapsed && "mr-2"
                          )} />
                          {!isCollapsed && <span>{item.name}</span>}
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    {/* Tooltip for single navigation items */}
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

      {/* Sidebar Footer with Logout Button */}
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
            {/* Show tooltip only when sidebar is collapsed on desktop */}
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

  // Main component render
  return (
    <>
      {/* Mobile Sidebar - Only show trigger button on mobile */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          {/* Mobile slide-out sidebar content */}
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent isMobile={true} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar - Only show on desktop */}
      <div className={cn(
        "hidden lg:block border-r bg-background transition-all duration-300 ease-in-out will-change-[width] overflow-hidden sticky top-0 h-screen",
        isCollapsed ? "lg:w-16" : "lg:w-64"
      )}>
        <SidebarContent isMobile={false} />
      </div>
    </>
  )
}