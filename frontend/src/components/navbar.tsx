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
import Image from "next/image"
import { toast } from "sonner"
import api from "@/services/api"

export default function Navbar() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      loadUnreadNotifications()
    }
  }, [user])

  const loadUnreadNotifications = async () => {
    try {
      const response = await api.get("/notifications/unread/")
      setUnreadCount(response.data.length)
    } catch (error) {
      console.error("Failed to load unread notifications:", error)
    }
  }

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

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "How It Works", path: "/how-it-works" },
    { name: "About Us", path: "/about" },
    { name: "Contact", path: "/contact" },
  ]

  const handleNotificationClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (user) {
      router.push(`/dashboard/${user.role}/notifications`)
    }
  }

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              SewaBazaar
            </span>
          </Link>
          <nav className="ml-10 hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.path) ? "text-primary" : "text-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {!user ? (
            <>
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/login">
                  <Button variant="ghost" className="hover:text-primary hover:bg-primary/10">
                    Log In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative hover:text-primary hover:bg-primary/10"
                onClick={handleNotificationClick}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hover:text-primary hover:bg-primary/10">
                    <Image
                      src={user.profile_picture || "/placeholder.svg"}
                      alt={user.first_name}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full mr-2 object-cover"
                    />
                    <span>{user.first_name} {user.last_name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/${user.role}`} className="w-full">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/${user.role}/profile`} className="w-full">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/${user.role}/settings`} className="w-full">
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <ThemeToggle />

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden hover:text-primary hover:bg-primary/10">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
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
                {!user ? (
                  <>
                    <Link 
                      href="/login" 
                      className="text-sm font-medium transition-colors hover:text-primary"
                      onClick={() => setIsOpen(false)}
                    >
                      Log In
                    </Link>
                    <Link 
                      href="/register" 
                      className="text-sm font-medium transition-colors hover:text-primary"
                      onClick={() => setIsOpen(false)}
                    >
                      Register
                    </Link>
                  </>
                ) : (
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
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        handleLogout()
                        setIsOpen(false)
                      }} 
                      className="mt-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
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