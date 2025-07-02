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

export function Navbar() {
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
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

        <div className="flex items-center space-x-4">
          {!user ? (
            <>
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
                  <div className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative">
                      <div className="relative overflow-hidden rounded-full transition-all duration-300 group-hover:scale-110 p-[2.5px] bg-gradient-to-r from-blue-500/50 to-purple-500/50 group-hover:from-blue-500 group-hover:to-purple-500 dark:from-blue-400/50 dark:to-purple-400/50 dark:group-hover:from-blue-400 dark:group-hover:to-purple-400 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                        <div className="rounded-full overflow-hidden bg-background">
                          <Image
                            src={user.profile_picture_url || "/placeholder.svg"}
                            alt={user.first_name}
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
                    <span className="text-[15px] font-medium transition-colors group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-purple-500 dark:group-hover:from-blue-400 dark:group-hover:to-purple-400">
                      {user.first_name} {user.last_name}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center space-x-3 p-2 border-b">
                    <div className="relative overflow-hidden rounded-full p-[2.5px] bg-gradient-to-r from-blue-500/50 to-purple-500/50 hover:from-blue-500 hover:to-purple-500 dark:from-blue-400/50 dark:to-purple-400/50 dark:hover:from-blue-400 dark:hover:to-purple-400 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                      <div className="rounded-full overflow-hidden bg-background">
                        <Image
                          src={user.profile_picture_url || "/placeholder.svg"}
                          alt={user.first_name}
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
                  <DropdownMenuItem asChild className="text-[15px]">
                    <Link href={`/dashboard/${user.role}`} className="w-full">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-[15px]">
                    <Link href={`/dashboard/${user.role}/profile`} className="w-full">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-[15px]">
                    <Link href={`/dashboard/${user.role}/settings`} className="w-full">
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-[15px] text-red-500 hover:text-red-600 hover:bg-red-50">
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
                    <Link href="/login" className="text-sm font-medium transition-colors hover:text-primary">
                      Log In
                    </Link>
                    <Link href="/register" className="text-sm font-medium transition-colors hover:text-primary">
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
                    <Button variant="outline" onClick={handleLogout} className="mt-2 text-red-500 hover:text-red-600 hover:bg-red-50">
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