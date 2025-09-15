/**
 * @fileoverview Comprehensive Navigation Bar Component for SewaBazaar Platform
 * 
 * This file contains the main navigation header component that provides site-wide navigation,
 * user authentication controls, notification management, theme switching, and responsive design.
 * The navbar adapts its content based on user authentication status and screen size.
 * 
 * @component Navbar
 * @version 1.0.0
 * @author SewaBazaar Development Team
 * @created 2025
 * @lastModified 2025
 * 
 * Key Features:
 * - Responsive design with mobile sheet menu
 * - User authentication dropdown with profile management
 * - Real-time notification system with badge indicators
 * - Theme toggle integration for dark/light mode
 * - Role-based navigation menu items
 * - Active route highlighting with pathname detection
 * - Toast notifications for user interactions
 * - Accessibility support with proper ARIA labels
 * 
 * Dependencies:
 * - Next.js: Client-side navigation and image optimization
 * - React: State management and component lifecycle
 * - Tailwind CSS: Responsive styling and theme support
 * - shadcn/ui: Dropdown, Sheet, and Button components
 * - Lucide React: Icon library for consistent iconography
 * - AuthContext: User authentication and session management
 * - NotificationContext: Real-time notification management
 * 
 * @requires React
 * @requires Next.js
 * @requires TailwindCSS
 * @requires shadcn/ui
 * @requires AuthContext
 * @requires NotificationContext
 */

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LogOut, Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { useAuth } from "@/contexts/AuthContext"
import { useNotifications } from "@/contexts/NotificationContext"
import Image from "next/image"
import { showToast } from "@/components/ui/enhanced-toast"

/**
 * Interface defining the structure of navigation links
 * Used for consistent navigation menu rendering across desktop and mobile views
 * 
 * @interface NavLink
 * @property {string} name - Display text for the navigation link
 * @property {string} path - URL path for the navigation destination
 */
interface NavLink {
  name: string
  path: string
}

/**
 * Main Navigation Bar Component
 * 
 * Renders the top navigation header with responsive design, user authentication controls,
 * notification management, and theme switching. Adapts content based on user login status
 * and provides different navigation options for different user roles.
 * 
 * @component
 * @returns {JSX.Element} The rendered navigation bar component
 * 
 * @example
 * ```tsx
 * // Usage in layout component
 * import { Navbar } from '@/components/layout/navbar'
 * 
 * export default function Layout({ children }) {
 *   return (
 *     <div>
 *       <Navbar />
 *       <main>{children}</main>
 *     </div>
 *   )
 * }
 * ```
 * 
 * Features:
 * - Responsive design with mobile-friendly sheet menu
 * - User authentication status detection and management
 * - Real-time notification badge with unread count
 * - Theme toggle for dark/light mode switching
 * - Role-based navigation menu items
 * - Active route highlighting
 * - Smooth hover animations and transitions
 * - Accessibility support with proper ARIA labels
 */

export function Navbar() {
  // Authentication and user context hooks
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications() // Real-time notification count from context
  
  // Local state for mobile menu sheet control
  const [isOpen, setIsOpen] = useState(false)
  
  // Navigation and routing hooks
  const pathname = usePathname()
  const router = useRouter()

  /**
   * Handles user logout process with proper cleanup and navigation
   * Calls the logout function from AuthContext and redirects to home page
   * Shows toast notification to confirm successful logout
   * 
   * @async
   * @function handleLogout
   * @returns {Promise<void>}
   * 
   * @example
   * ```tsx
   * <DropdownMenuItem onClick={handleLogout}>
   *   Log Out
   * </DropdownMenuItem>
   * ```
   */
  const handleLogout = async (): Promise<void> => {
    try {
      await logout()
      showToast.success({
        title: "Success",
        description: "You have been logged out successfully",
        duration: 3000
      })
      // Navigate to home page after successful logout
      router.push("/")
      // Close mobile menu if open during logout
      setIsOpen(false)
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
   * Determines if a given path matches the current pathname
   * Used for highlighting active navigation links
   * 
   * @param {string} path - The path to check against current pathname
   * @returns {boolean} True if the path is currently active
   * 
   * @example
   * ```tsx
   * const isHomePage = isActive("/") // true if on home page exactly
   * const isServicesPage = isActive("/services") // true only for exact match
   * ```
   */
  const isActive = (path: string): boolean => {
    return pathname === path
  }

  /**
   * Predefined navigation links for the main site navigation
   * These links are shown in both desktop and mobile navigation menus
   * 
   * @constant navLinks
   * @type {NavLink[]}
   */
  const navLinks: NavLink[] = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "How It Works", path: "/how-it-works" },
    { name: "About Us", path: "/about" },
    { name: "Contact", path: "/contact" },
  ]

  /**
   * Handles notification bell click events
   * Navigates to user's notification page based on their role
   * Shows appropriate feedback based on authentication status
   * 
   * @param {React.MouseEvent} e - The click event object
   * @returns {void}
   * 
   * @example
   * ```tsx
   * <Button onClick={handleNotificationClick}>
   *   <Bell className="h-4 w-4" />
   * </Button>
   * ```
   */
  const handleNotificationClick = (e: React.MouseEvent): void => {
    e.preventDefault()
    if (user) {
      router.push(`/dashboard/${user.role}/notifications`)
      showToast.info({
        title: "Notifications",
        description: "Navigating to your notifications",
        duration: 2000
      })
    } else {
      showToast.warning({
        title: "Authentication Required",
        description: "Please log in to view notifications",
        duration: 3000
      })
    }
  }

  // Main component render with sticky header and responsive layout
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left side: Logo and brand name */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/favicon.png"
              alt="SewaBazaar Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              SewaBazaar
            </span>
          </Link>
          {/* Desktop navigation menu - hidden on mobile */}
          <nav className="ml-10 hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-[15px] font-medium transition-colors hover:text-primary ${
                  isActive(link.path) ? "text-primary" : "text-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side: Authentication, notifications, theme toggle, and mobile menu */}
        <div className="flex items-center space-x-4">
          {/* Show login/register buttons when user is not authenticated */}
          {!user ? (
            <>
              {/* Desktop authentication buttons - hidden on mobile */}
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/login">
                  <Button variant="ghost" className="text-[15px] hover:text-primary hover:bg-primary/10">
                    Log In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="text-[15px] bg-primary hover:bg-primary-hover text-primary-foreground">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            /* Show user controls when authenticated */
            <div className="hidden md:flex items-center space-x-4">
              {/* Notification bell with unread count badge */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative hover:text-primary hover:bg-primary/10"
                onClick={handleNotificationClick}
                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
              >
                <Bell className="h-5 w-5" />
                {/* Show badge only when there are unread notifications */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
              
              {/* User profile dropdown menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative">
                      {/* Animated gradient border around profile picture */}
                      <div className="relative overflow-hidden rounded-full transition-all duration-300 group-hover:scale-110 p-[2.5px] bg-gradient-to-r from-blue-500/50 to-purple-500/50 group-hover:from-blue-500 group-hover:to-purple-500 dark:from-blue-400/50 dark:to-purple-400/50 dark:group-hover:from-blue-400 dark:group-hover:to-purple-400 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                        <div className="rounded-full overflow-hidden bg-background">
                          <Image
                            src={user.profile_picture_url || "/placeholder.svg"}
                            alt={`${user.first_name}'s profile picture`}
                            width={48}
                            height={48}
                            className="h-10 w-10 object-cover rounded-full"
                            quality={100}
                            priority
                            unoptimized
                          />
                        </div>
                      </div>
                    </div>
                    {/* User name with gradient hover effect */}
                    <span className="text-[15px] font-medium transition-colors group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-purple-500 dark:group-hover:from-blue-400 dark:group-hover:to-purple-400">
                      {user.first_name} {user.last_name}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                
                {/* Dropdown menu content with user information and navigation links */}
                <DropdownMenuContent align="end" className="w-56">
                  {/* User profile header in dropdown */}
                  <div className="flex items-center space-x-3 p-2 border-b">
                    <div className="relative overflow-hidden rounded-full p-[2.5px] bg-gradient-to-r from-blue-500/50 to-purple-500/50 hover:from-blue-500 hover:to-purple-500 dark:from-blue-400/50 dark:to-purple-400/50 dark:hover:from-blue-400 dark:hover:to-purple-400 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                      <div className="rounded-full overflow-hidden bg-background">
                        <Image
                          src={user.profile_picture_url || "/placeholder.svg"}
                          alt={`${user.first_name}'s profile picture`}
                          width={48}
                          height={48}
                          className="h-10 w-10 object-cover rounded-full"
                          quality={100}
                          unoptimized
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[15px] font-medium">{user.first_name} {user.last_name}</span>
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                  
                  {/* Role-based dashboard navigation */}
                  <DropdownMenuItem asChild className="text-[15px]">
                    <Link href={`/dashboard/${user.role}`} className="w-full">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  
                  {/* Profile management link */}
                  <DropdownMenuItem asChild className="text-[15px]">
                    <Link href={`/dashboard/${user.role}/profile`} className="w-full">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  
                  {/* User settings link */}
                  <DropdownMenuItem asChild className="text-[15px]">
                    <Link href={`/dashboard/${user.role}/settings`} className="w-full">
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Logout button with destructive warning styling */}
                  <DropdownMenuItem onClick={handleLogout} className="text-[15px] text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950 dark:hover:text-red-400 focus:bg-red-100 focus:text-red-700 transition-colors">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Theme toggle button - always visible */}
          <ThemeToggle />

          {/* Mobile menu sheet - only visible on mobile devices */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden hover:text-primary hover:bg-primary/10" aria-label="Toggle mobile menu">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              {/* Mobile navigation menu */}
              <nav className="flex flex-col gap-4 mt-8">
                {/* Main navigation links */}
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive(link.path) ? "text-primary" : "text-foreground"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
                
                {/* Conditional authentication/user menu based on login status */}
                {!user ? (
                  /* Show login/register links for unauthenticated users */
                  <>
                    <Link href="/login" className="text-sm font-medium transition-colors hover:text-primary">
                      Log In
                    </Link>
                    <Link href="/register" className="text-sm font-medium transition-colors hover:text-primary">
                      Register
                    </Link>
                  </>
                ) : (
                  /* Show user dashboard links for authenticated users */
                  <>
                    <Link
                      href={`/dashboard/${user.role}`}
                      className="text-sm font-medium transition-colors hover:text-primary"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href={`/dashboard/${user.role}/profile`}
                      className="text-sm font-medium transition-colors hover:text-primary"
                      onClick={() => setIsOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href={`/dashboard/${user.role}/settings`}
                      className="text-sm font-medium transition-colors hover:text-primary"
                      onClick={() => setIsOpen(false)}
                    >
                      Settings
                    </Link>
                    {/* Mobile logout button with destructive warning styling */}
                    <Button variant="outline" onClick={handleLogout} className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950 dark:hover:text-red-400 border-red-300 hover:border-red-400 dark:border-red-800 transition-colors">
                      <LogOut className="h-4 w-4 mr-2" />
                      Log Out
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

/**
 * Export the Navbar component as default export
 * This component should be used in the main layout to provide consistent navigation
 * across the entire application
 * 
 * @example
 * ```tsx
 * import { Navbar } from '@/components/layout/navbar'
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <Navbar />
 *         {children}
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */ 