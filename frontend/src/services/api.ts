import axios from "axios"
import Cookies from "js-cookie"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

// Cookie configuration
const COOKIE_CONFIG = {
  // 30 days in days for persistent cookies
  PERSISTENT_EXPIRY: 30,
  // Session cookie has no expiry set
  SESSION_EXPIRY: undefined
}

// Helper function to get cookie options based on remember me preference
const getCookieOptions = () => {
  const rememberMe = Cookies.get("remember_me")
  return rememberMe === "true" ? { expires: COOKIE_CONFIG.PERSISTENT_EXPIRY } : {}
}

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("access_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = Cookies.get("refresh_token")
        if (!refreshToken) {
          throw new Error("No refresh token available")
        }

        const response = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken,
        })

        const { access } = response.data
        // Preserve remember me preference when setting new access token
        const cookieOptions = getCookieOptions()
        Cookies.set("access_token", access, cookieOptions)

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)
      } catch (refreshError) {
        // If refresh fails, just clear cookies and reject
        Cookies.remove("access_token")
        Cookies.remove("refresh_token")
        Cookies.remove("user_role")
        Cookies.remove("remember_me")
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

// Auth services
export const authService = {
  /**
   * Authenticate user and store tokens
   * @param email - User's email
   * @param password - User's password
   * @param rememberMe - Whether to persist authentication
   * @returns Object containing user data
   */
  login: async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await api.post("/auth/login/", { email, password })
      const { access, refresh } = response.data

      // Configure cookie options based on remember me preference
      const cookieOptions = {
        expires: rememberMe ? COOKIE_CONFIG.PERSISTENT_EXPIRY : COOKIE_CONFIG.SESSION_EXPIRY
      }

      // Store remember me preference first (needed by getCookieOptions helper)
      Cookies.set("remember_me", rememberMe.toString(), cookieOptions)

      // Store tokens in cookies with appropriate expiry
      Cookies.set("access_token", access, cookieOptions)
      Cookies.set("refresh_token", refresh, cookieOptions)
      
      // Get user details
      const userResponse = await api.get("/auth/users/me/")
      const userData = userResponse.data
      
      // Store user role with same expiry
      Cookies.set("user_role", userData.role || 'customer', cookieOptions)
      
      return { user: userData }
    } catch (error: any) {
      // Clear any existing tokens on login failure
      Cookies.remove("access_token")
      Cookies.remove("refresh_token")
      Cookies.remove("user_role")
      Cookies.remove("remember_me")
      
      if (error.response?.status === 401) {
        throw new Error("Invalid email or password")
      }
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail)
      }
      throw new Error("Login failed. Please try again.")
    }
  },

  register: async (userData: any) => {
    const response = await api.post("/auth/register/", userData)
    const { access, refresh, user } = response.data
    Cookies.set("access_token", access)
    Cookies.set("refresh_token", refresh)
    Cookies.set("user_role", user.role)
    return { access, refresh, user }
  },

  logout: async () => {
    const refreshToken = Cookies.get("refresh_token")
    if (!refreshToken) {
      // If no refresh token exists, just clear cookies and return
      Cookies.remove("access_token")
      Cookies.remove("refresh_token")
      Cookies.remove("user_role")
      Cookies.remove("remember_me")
      return
    }
    
    try {
      await api.post("/auth/logout/", { refresh: refreshToken })
    } catch (error) {
      console.error("Logout error:", error)
      // Even if the API call fails, we should still clear cookies
      // This ensures the user can still logout locally
    } finally {
      // Always clear cookies
      Cookies.remove("access_token")
      Cookies.remove("refresh_token")
      Cookies.remove("user_role")
      Cookies.remove("remember_me")
    }
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/users/me/")
    return response.data
  },

  /**
   * Refresh access token using refresh token
   * @returns Object containing new access token and user data
   */
  refreshToken: async () => {
    try {
      const refreshToken = Cookies.get("refresh_token")
      if (!refreshToken) {
        throw new Error("No refresh token available")
      }

      const response = await axios.post(`${API_URL}/auth/refresh/`, {
        refresh: refreshToken,
      })

      const { access } = response.data
      
      // Preserve remember me preference when setting new access token
      const cookieOptions = getCookieOptions()
      Cookies.set("access_token", access, cookieOptions)

      // Get user details with new token
      const userResponse = await api.get("/auth/users/me/")
      return { user: userResponse.data }
    } catch (error: any) {
      // Clear all cookies if refresh fails
      Cookies.remove("access_token")
      Cookies.remove("refresh_token")
      Cookies.remove("user_role")
      Cookies.remove("remember_me")
      throw error
    }
  },
}

// Services API
export const servicesApi = {
  getServices: async (params = {}) => {
    const response = await api.get("/services/", { params })
    return response.data
  },

  getServiceById: async (slug: string) => {
    const response = await api.get(`/services/${slug}/`)
    return response.data
  },

  getCategories: async () => {
    const response = await api.get("/services/categories/")
    return response.data
  },

  getCities: async () => {
    const response = await api.get("/services/cities/")
    return response.data
  },
}

// Bookings API
export const bookingsApi = {
  getBookings: async () => {
    const response = await api.get("/bookings/")
    return response.data
  },

  createBooking: async (bookingData: any) => {
    const response = await api.post("/bookings/", bookingData)
    return response.data
  },

  updateBookingStatus: async (id: number, statusData: any) => {
    const response = await api.patch(`/bookings/${id}/update_status/`, statusData)
    return response.data
  },
}

// Reviews API
export const reviewsApi = {
  getServiceReviews: async (serviceId: number) => {
    const response = await api.get("/reviews/", { params: { service: serviceId } })
    return response.data
  },

  createReview: async (reviewData: any) => {
    const response = await api.post("/reviews/", reviewData)
    return response.data
  },
}

// Customer API
export const customerApi = {
  getDashboardData: async () => {
    // Get user profile and aggregate data
    const [userResponse, bookingsResponse] = await Promise.all([
      api.get("/auth/users/me/"),
      api.get("/bookings/customer_bookings/")
    ])

    const bookings = bookingsResponse.data
    const user = userResponse.data

    return {
      totalBookings: bookings.length,
      upcomingBookings: bookings.filter((b: any) => b.status === "confirmed").length,
      memberSince: new Date(user.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
  },

  getBookings: async (status?: string) => {
    const response = await api.get("/bookings/customer_bookings/")
    const bookings = response.data

    if (status) {
      return bookings.filter((booking: any) => {
        switch (status) {
          case "upcoming":
            return ["pending", "confirmed"].includes(booking.status)
          case "completed":
            return booking.status === "completed"
          case "cancelled":
            return booking.status === "cancelled"
          default:
            return true
        }
      })
    }

    return bookings
  },

  getRecommendedServices: async () => {
    // Get all active services for now
    // TODO: Implement actual recommendation logic on the backend
    const response = await api.get("/services/", {
      params: {
        status: "active",
        limit: 3,
        is_featured: true
      }
    })
    return response.data.results || [] // Handle paginated response
  },

  cancelBooking: async (bookingId: number) => {
    const response = await api.patch(`/bookings/${bookingId}/update_status/`, {
      status: "cancelled"
    })
    return response.data
  },

  rescheduleBooking: async (bookingId: number, newDateTime: string) => {
    const [date, time] = newDateTime.split("T")
    const response = await api.patch(`/bookings/${bookingId}/`, {
      booking_date: date,
      booking_time: time
    })
    return response.data
  }
}
export default api

