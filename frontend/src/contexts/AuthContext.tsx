"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authService } from "@/services/api"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
  phone?: string
  profile_picture?: string
  profile_picture_url?: string
  profile?: {
    bio?: string
    address?: string
    city?: string
    date_of_birth?: string
    company_name?: string
    is_approved?: boolean
    // Provider-specific properties
    service_radius?: string
    primary_service_area?: string
    show_service_area?: boolean
    auto_accept_bookings?: boolean
    min_booking_notice?: string
    max_daily_bookings?: number
    default_service_duration?: string
    // Additional provider profile fields
    display_name?: string
    years_of_experience?: number
    certifications?: any[]
    location_city?: string
  }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  /**
   * Check authentication status on initial load
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const accessToken = Cookies.get("access_token")
        const refreshToken = Cookies.get("refresh_token")
        
        if (accessToken && accessToken.trim()) {
          // If we have an access token, try to get user data
          try {
            const userData = await authService.getCurrentUser()
            setUser(userData)
          } catch (userError: any) {
            console.warn("Failed to get current user, trying token refresh:", userError.message)
            // If getting user fails but we have a refresh token, try to refresh
            if (refreshToken && refreshToken.trim()) {
              try {
                const { user } = await authService.refreshToken()
                setUser(user)
              } catch (refreshError) {
                console.warn("Token refresh also failed, clearing auth:", refreshError)
                // Both failed, clear all cookies
                Cookies.remove("access_token")
                Cookies.remove("refresh_token")
                Cookies.remove("user_role")
                Cookies.remove("remember_me")
              }
            } else {
              // No refresh token, clear access token
              Cookies.remove("access_token")
              Cookies.remove("user_role")
            }
          }
        } else if (refreshToken && refreshToken.trim()) {
          // If no access token but we have a refresh token, try to refresh
          try {
            const { user } = await authService.refreshToken()
            setUser(user)
          } catch (refreshError) {
            console.warn("Token refresh failed:", refreshError)
            // Refresh failed, clear all cookies
            Cookies.remove("access_token")
            Cookies.remove("refresh_token")
            Cookies.remove("user_role")
            Cookies.remove("remember_me")
          }
        }
        // If no tokens exist, that's fine - user is just not logged in
      } catch (err) {
        console.warn("Authentication check error:", err)
        // Don't fail silently but also don't block the app
        // Clear all auth cookies on unexpected error
        Cookies.remove("access_token")
        Cookies.remove("refresh_token")
        Cookies.remove("user_role")
        Cookies.remove("remember_me")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  /**
   * Refresh current user data
   */
  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser()
      setUser(userData)
    } catch (err) {
      console.warn("Failed to refresh user data:", err)
      // Don't throw the error, just log it
    }
  }

  /**
   * Authenticate user with credentials
   * @param email - User's email
   * @param password - User's password
   * @param rememberMe - Whether to persist authentication
   */
  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      setLoading(true)
      setError(null)
      const { user } = await authService.login(email, password, rememberMe)
      
      if (!user) {
        throw new Error("Login failed - No user data received")
      }
      
      setUser(user)
    } catch (err: any) {
      const errorMessage = err.message || "Login failed"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: any) => {
    try {
      setLoading(true)
      setError(null)
      const { user } = await authService.register(userData)
      setUser(user)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await authService.logout()
      // Clear all auth state
      setUser(null)
      setError(null)
      // Use router.replace instead of window.location
      router.replace("/login")
    } catch (err) {
      // Even if the API call fails, we should still clear the state
      setUser(null)
      setError(null)
      router.replace("/login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
