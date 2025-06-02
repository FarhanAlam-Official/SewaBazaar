import axios from "axios"
import Cookies from "js-cookie"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

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
    if (error.response.status === 401 && !originalRequest._retry) {
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
        Cookies.set("access_token", access)

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)
      } catch (refreshError) {
        // If refresh fails, logout user
        Cookies.remove("access_token")
        Cookies.remove("refresh_token")
        window.location.href = "/login"
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

// Auth services
export const authService = {
  login: async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login/", { email, password })
      const { access, refresh, user } = response.data

      // Store tokens in cookies
      Cookies.set("access_token", access)
      Cookies.set("refresh_token", refresh)
      
      // Get user details
      const userResponse = await api.get("/auth/users/me/")
      const userData = userResponse.data
      
      // Store user role
      Cookies.set("user_role", userData.role || 'customer')
      
      return { user: userData }
    } catch (error: any) {
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
    }
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/users/me/")
    return response.data
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

export default api
