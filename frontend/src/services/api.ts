import axios from "axios"
import Cookies from "js-cookie"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

// Cookie configuration for authentication persistence
const COOKIE_CONFIG = {
  // 30 days in days for persistent cookies when "remember me" is checked
  PERSISTENT_EXPIRY: 30,
  // Session cookie has no expiry set for temporary sessions
  SESSION_EXPIRY: undefined
}

// Helper function to get cookie options based on remember me preference
const getCookieOptions = () => {
  const rememberMe = Cookies.get("remember_me")
  return rememberMe === "true" ? { expires: COOKIE_CONFIG.PERSISTENT_EXPIRY } : {}
}

// Create a separate axios instance for public endpoints (no auth required)
const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Client-side navigation helper (avoids SSR usage)
const navigateClient = (path: string) => {
  if (typeof window !== 'undefined') {
    // Prevent infinite loops by not redirecting if we're already there
    if (!window.location.pathname.startsWith(path)) {
      window.location.href = path
    }
  }
}

// Add response interceptor for rate limiting to public API
publicApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 1
      
      // Don't retry if we've already tried
      if (!originalRequest._retryAfter) {
        originalRequest._retryAfter = true
        
        // Wait for the retry-after period
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
        
        // Retry the request
        return publicApi(originalRequest)
      }
    }

    // Network error (no response) -> network error page
    if (!error.response && typeof window !== 'undefined') {
      navigateClient('/error-pages/network')
    }

    // 5xx -> server error page (avoid redirect loops)
    const status = error.response?.status
    if (status && status >= 500 && status < 600 && typeof window !== 'undefined') {
      navigateClient('/error-pages/server')
    }

    return Promise.reject(error)
  },
)

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor to add auth token for authenticated requests
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("access_token")
    
    if (token && token.trim()) {
      // Add authorization header for authenticated requests
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Add response interceptor to handle token refresh and rate limiting
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 1
      
      // Don't retry if we've already tried
      if (!originalRequest._retryAfter) {
        originalRequest._retryAfter = true
        
        // Wait for the retry-after period
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
        
        // Retry the request
        return api(originalRequest)
      }
    }

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

    // Network error (no response) -> network error page
    if (!error.response && typeof window !== 'undefined') {
      navigateClient('/error-pages/network')
    }

    // 5xx -> server error page
    const status = error.response?.status
    if (status && status >= 500 && status < 600 && typeof window !== 'undefined') {
      navigateClient('/error-pages/server')
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

  /**
   * Request a password reset email. Always returns success to avoid user enumeration.
   */
  requestPasswordReset: async (email: string) => {
    try {
      await publicApi.post("/auth/reset-password/", { email })
      return { detail: "If an account exists, a reset link has been sent." }
    } catch (error) {
      // Intentionally swallow errors to avoid leaking account existence
      return { detail: "If an account exists, a reset link has been sent." }
    }
  },

  /**
   * Confirm password reset with uid and token contained in the email link
   */
  confirmPasswordReset: async (uid: string, token: string, password: string) => {
    try {
      const response = await publicApi.post("/auth/reset-password/confirm/", {
        token: `${uid}/${token}`,
        password,
      })
      return response.data
    } catch (error: any) {
      const data = error.response?.data
      if (data?.detail) {
        throw new Error(data.detail)
      }
      if (data?.password) {
        // DRF password validation errors often return { password: ["message"] }
        const msg = Array.isArray(data.password) ? data.password[0] : String(data.password)
        throw new Error(msg)
      }
      throw new Error("The reset link is invalid or has expired.")
    }
  },

  // OTP: request code via email
  requestOTP: async (email: string) => {
    await publicApi.post("/auth/otp/request/", { email })
    return { detail: "If the email exists, an OTP has been sent." }
  },

  // OTP: verify and login
  verifyOTPLogin: async (email: string, otp: string, rememberMe: boolean = false) => {
    const response = await publicApi.post("/auth/otp/verify/", { email, otp })
    const { access, refresh, user } = response.data

    const cookieOptions = {
      expires: rememberMe ? COOKIE_CONFIG.PERSISTENT_EXPIRY : COOKIE_CONFIG.SESSION_EXPIRY
    }
    Cookies.set("remember_me", rememberMe.toString(), cookieOptions)
    Cookies.set("access_token", access, cookieOptions)
    Cookies.set("refresh_token", refresh, cookieOptions)
    Cookies.set("user_role", user.role || 'customer', cookieOptions)
    return { user }
  },

  // OTP: reset password with code
  resetPasswordWithOTP: async (email: string, otp: string, password: string) => {
    try {
      const response = await publicApi.post("/auth/otp/reset-password/", { email, otp, password })
      return response.data
    } catch (error: any) {
      const data = error.response?.data
      if (data?.detail) throw new Error(data.detail)
      if (data?.password) {
        const msg = Array.isArray(data.password) ? data.password[0] : String(data.password)
        throw new Error(msg)
      }
      throw new Error("Invalid or expired OTP")
    }
  },

  // Register without storing tokens; used when OTP verification should occur first
  registerOnly: async (userData: any) => {
    const response = await api.post("/auth/register/", userData)
    // Intentionally do NOT set cookies/tokens here
    return response.data
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

// Enhanced request queue to handle rate limiting
const requestQueue: (() => Promise<unknown>)[] = []
let isProcessingQueue = false
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 100 // Reduced to 100ms between requests (was 500ms)
const MAX_CONCURRENT_REQUESTS = 5 // Increased concurrent requests to 5 (was 2)
let activeRequests = 0

const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0 || activeRequests >= MAX_CONCURRENT_REQUESTS) return
  
  isProcessingQueue = true
  
  while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
    const request = requestQueue.shift()
    if (request) {
      try {
        // Ensure minimum interval between requests
        const timeSinceLastRequest = Date.now() - lastRequestTime
        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
          await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
        }
        
        activeRequests++
        await request()
        lastRequestTime = Date.now()
        
        // Reduced delay for rate limiting safety
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error: any) {
        console.error('Queued request failed:', error)
        // If we hit rate limit, wait much longer before next request
        if (error.response?.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
      } finally {
        activeRequests--
      }
    }
  }
  
  isProcessingQueue = false
  
  // Continue processing if there are more requests
  if (requestQueue.length > 0) {
    setTimeout(processQueue, 100) // Wait 100ms before processing more (was 1000ms)
  }
}

const queueRequest = <T>(requestFn: () => Promise<T>): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    // Check request limit before queuing
    if (!canMakeRequest()) {
      const waitTime = requestResetTime - Date.now()
      setTimeout(() => {
        queueRequest(requestFn).then(resolve).catch(reject)
      }, waitTime)
      return
    }
    
    requestQueue.push(async () => {
      try {
        incrementRequestCount()
        const result = await requestFn()
        resolve(result)
      } catch (error) {
        reject(error)
      }
    })
    processQueue()
  })
}

// Enhanced caching system to avoid repeated fetches
let servicesListCache: any = null;
let categoriesCache: any = null;
let citiesCache: any = null;
let cacheTimestamp: number = 0;
let categoriesCacheTimestamp: number = 0;
let citiesCacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // Reduced cache duration to 5 minutes (was 15 minutes)
const CATEGORIES_CACHE_DURATION = 30 * 60 * 1000; // Reduced to 30 minutes (was 1 hour)
const CITIES_CACHE_DURATION = 30 * 60 * 1000; // Reduced to 30 minutes (was 1 hour)

// Global request limiting
let requestCount = 0;
let requestResetTime = Date.now() + 60000; // Reset every minute
const MAX_REQUESTS_PER_MINUTE = 120; // Increase limit to avoid throttling during rapid searches

const canMakeRequest = (): boolean => {
  const now = Date.now()
  if (now > requestResetTime) {
    requestCount = 0
    requestResetTime = now + 60000
  }
  return requestCount < MAX_REQUESTS_PER_MINUTE
}

const incrementRequestCount = () => {
  requestCount++
}

// Type definitions for better TypeScript support
interface ServiceData {
  id: number;
  slug: string;
  title: string;
  description: string;
  short_description?: string;
  price: string;
  discount_price?: string;
  duration?: string;
  category?: any;
  provider?: any;
  cities?: any[];
  image?: string;
  gallery_images?: any[];
  includes?: string[];
  excludes?: string[];
  tags?: string[];
  average_rating?: string;
  reviews_count?: number;
  is_verified_provider?: boolean;
  response_time?: string;
  cancellation_policy?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

interface ServicesResponse {
  results?: any[];
  count?: number;
  next?: string | null;
  previous?: string | null;
  [key: string]: any;
}

// Services API with enhanced rate limiting and caching
export const servicesApi = {
  getServices: async (params = {}): Promise<ServicesResponse> => {
    // Use AbortController to cancel in-flight search requests, avoiding race conditions
    try {
      if (typeof AbortController !== 'undefined') {
                if (servicesAbortController) {
          // Abort previous in-flight request
          servicesAbortController.abort()
        }
                servicesAbortController = new AbortController()
        const response = await publicApi.get("/services/", { params, signal: servicesAbortController.signal as any })
        const data = response.data as ServicesResponse
        servicesListCache = data
        cacheTimestamp = Date.now()
        return data
      }
      // Fallback without AbortController
      const response = await publicApi.get("/services/", { params })
      const data = response.data as ServicesResponse
      servicesListCache = data
      cacheTimestamp = Date.now()
      return data
    } catch (error: any) {
      // Ignore abort errors; surface others
      if (error?.name === 'CanceledError' || error?.name === 'AbortError') {
        return { results: [], count: 0, next: null, previous: null }
      }
      throw error
    }
  },

  getServiceById: async (idOrSlug: string): Promise<ServiceData> => {
    return queueRequest(async () => {
      try {
        // Try direct fetch first
        const response = await publicApi.get(`/services/${idOrSlug}/`)
        return response.data as ServiceData
      } catch (error: any) {
        // If 404 and input is numeric ID, try a more efficient lookup
        if (error.response?.status === 404 && /^\d+$/.test(idOrSlug)) {
          try {
            // Try searching with a direct query instead of fetching all services
            const searchResponse = await publicApi.get(`/services/`, {
              params: { 
                search: idOrSlug,
                page_size: 1 // Only need one result
              }
            })
            
            const foundService = searchResponse.data.results?.find((s: any) => s.id.toString() === idOrSlug)
            
            if (foundService && foundService.slug) {
              // Found by ID, now fetch the full details using the slug
              const detailResponse = await publicApi.get(`/services/${foundService.slug}/`)
              return detailResponse.data as ServiceData
            } else {
              throw new Error(`Service with ID ${idOrSlug} not found.`)
            }
          } catch (fallbackError: any) {
            // If fallback also fails, throw a more specific error
            if (fallbackError.response?.status === 429) {
              throw new Error('Too many requests. Please wait a moment and try again.')
            }
            if (fallbackError.message.includes('not found')) {
              throw fallbackError // Re-throw our custom error messages
            }
            throw new Error(`Service not found. Please try again later.`)
          }
        }
        // Re-throw the original error if all attempts fail
        throw error
      }
    })
  },

  getCategories: async () => {
    // Check cache first
    const now = Date.now();
    if (categoriesCache && (now - categoriesCacheTimestamp) < CATEGORIES_CACHE_DURATION) {
      return categoriesCache;
    }
    
    return queueRequest(async () => {
      const response = await publicApi.get("/services/categories/?page_size=100")
      let data = response.data;
      // Handle paginated response - extract results array
      if (data && data.results) {
        data = data.results;
      }
      // Ensure it's an array
      data = Array.isArray(data) ? data : [];
      
      categoriesCache = data;
      categoriesCacheTimestamp = now;
      return data
    })
  },

  getCities: async () => {
    // Check cache first
    const now = Date.now();
    if (citiesCache && (now - citiesCacheTimestamp) < CITIES_CACHE_DURATION) {
      return citiesCache;
    }
    
    return queueRequest(async () => {
      const response = await publicApi.get("/services/cities/")
      let data = response.data;
      // Handle paginated response - extract results array
      if (data && data.results) {
        data = data.results;
      }
      // Ensure it's an array
      data = Array.isArray(data) ? data : [];
      
      citiesCache = data;
      citiesCacheTimestamp = now;
      return data
    })
  },

  toggleFavorite: async (serviceId: number) => {
    return queueRequest(async () => {
      const response = await api.post("/services/favorites/toggle/", { service: serviceId })
      return response.data
    })
  },

  getFavorites: async () => {
    return queueRequest(async () => {
      const response = await api.get("/services/favorites/")
      return response.data
    })
  },
}

// Keep an abort controller for canceling in-flight services GET requests
let servicesAbortController: AbortController | null = null

// Bookings API
export const bookingsApi = {
  getBookings: async () => {
    const response = await api.get("/bookings/bookings/")
    return response.data
  },

  getBookingById: async (id: number) => {
    const response = await api.get(`/bookings/bookings/${id}/`)
    return response.data
  },

  createBooking: async (bookingData: any) => {
    const response = await api.post("/bookings/bookings/", bookingData)
    return response.data
  },

  updateBookingStatus: async (id: number, statusData: any) => {
    const response = await api.patch(`/bookings/bookings/${id}/update_status/`, statusData)
    return response.data
  },

  // PHASE 1 NEW: Additional booking endpoints
  getCustomerBookings: async (page: number = 1) => {
    const response = await api.get(`/bookings/bookings/customer_bookings/?page=${page}`)
    return response.data
  },

  getProviderBookings: async () => {
    const response = await api.get("/bookings/provider_dashboard/provider_bookings/")
    return response.data
  },

  initiatePayment: async (id: number, paymentMethodId: number) => {
    const response = await api.post(`/bookings/bookings/${id}/initiate_payment/`, {
      payment_method_id: paymentMethodId
    })
    return response.data
  },

  // PHASE 1 NEW: Payment endpoints
  processKhaltiPayment: async (paymentData: any) => {
    const response = await api.post("/bookings/payments/process_khalti_payment/", paymentData)
    return response.data
  },

  // PHASE 1 NEW: Booking wizard endpoints
  createBookingStep: async (stepData: any) => {
    const response = await api.post("/bookings/booking-wizard/create_step/", stepData)
    return response.data
  },

  calculateBookingPrice: async (priceData: any) => {
    const response = await api.post("/bookings/booking-wizard/calculate_price/", priceData)
    return response.data
  },

  // Time slot endpoints with improved filtering
  getAvailableSlots: async (serviceId: number, date: string) => {
    const response = await api.get("/bookings/booking_slots/available_slots/", {
      params: { service_id: serviceId, date, prevent_auto_generation: true }
    })
    return response.data
  },

  // Payment method endpoints
  getPaymentMethods: async () => {
    const response = await api.get("/bookings/payment_methods/")
    return response.data
  },

  // Express booking endpoints
  createExpressBooking: async (bookingData: any) => {
    const response = await api.post("/bookings/bookings/create_express_booking/", bookingData)
    return response.data
  },

  // NEW SERVICE DELIVERY ENDPOINTS
  // Provider marks service as delivered
  markServiceDelivered: async (bookingId: number, deliveryData: {
    delivery_notes?: string
    delivery_photos?: string[]
  }) => {
    const response = await api.post(`/bookings/bookings/${bookingId}/mark_service_delivered/`, deliveryData)
    return response.data
  },

  // Customer confirms service completion with rating and feedback
  confirmServiceCompletion: async (bookingId: number, confirmationData: {
    customer_rating: number
    customer_notes?: string
    would_recommend: boolean
  }) => {
    const url = `/bookings/bookings/${bookingId}/confirm_service_completion/`
    
    try {
      const response = await api.post(url, confirmationData)
      return response.data
    } catch (error: any) {
      // Log error details for debugging while preserving user privacy
      console.error("Service confirmation failed:", {
        status: error.response?.status,
        message: error.response?.data?.detail || error.message
      })
      throw error
    }
  },

  // Process cash payment
  processCashPayment: async (bookingId: number, paymentData: {
    amount_collected: number
    collection_notes?: string
  }) => {
    const response = await api.post(`/bookings/bookings/${bookingId}/process_cash_payment/`, paymentData)
    return response.data
  },

  // Get service delivery status
  getServiceDeliveryStatus: async (bookingId: number) => {
    const response = await api.get(`/bookings/bookings/${bookingId}/service_delivery_status/`)
    return response.data
  }
}

// Reviews API
export const reviewsApi = {
  // Get reviews for a service (via its provider)
  getServiceReviews: async (serviceId: number) => {
    // First get the service to find its provider
    try {
      // Try to get the service by ID first
      let serviceResponse;
      try {
        serviceResponse = await publicApi.get(`/services/${serviceId}/`)
      } catch (error) {
        // If ID lookup fails, try with a slug (in case serviceId is actually a slug)
        // This handles both numeric IDs and slug strings
        serviceResponse = await publicApi.get(`/services/${serviceId}/`)
      }
      
      const providerId = serviceResponse.data.provider?.id
      
      if (providerId) {
        // Get reviews for this provider
        const response = await publicApi.get(`/reviews/providers/${providerId}/reviews/`)
        return response.data
      } else {
        // No provider found, return empty results
        return { results: [], count: 0 }
      }
    } catch (error) {
      console.error('Error fetching service reviews:', error)
      return { results: [], count: 0 }
    }
  },

  // Get current user's reviews
  getMyReviews: async () => {
    try {
      const response = await api.get("/reviews/my_reviews/")
      return response.data
    } catch (error: any) {
      console.error('Error fetching user reviews:', error)
      // Handle different error types
      if (error.response?.status === 404) {
        // Endpoint not found, return empty results
        return { results: [], count: 0 }
      } else if (error.response?.status === 403) {
        // Forbidden, user doesn't have permission
        throw new Error('Access denied. Please make sure you are logged in as a customer.')
      } else {
        // Other errors
        return { results: [], count: 0 }
      }
    }
  },

  // Get user's reviews with reward claim status
  getReviewsWithRewards: async () => {
    const response = await api.get("/reviews/my_reviews_with_rewards/")
    return response.data
  },

  // Get reviews for a provider directly
  getProviderReviews: async (providerId: number) => {
    const response = await publicApi.get(`/reviews/providers/${providerId}/reviews/`)
    return response.data
  },

  // Create a review (requires authentication)
  createReview: async (reviewData: any, images?: File[]) => {
    if (images && images.length > 0) {
      // Create FormData for multipart upload
      const formData = new FormData()
      formData.append('booking_id', reviewData.booking_id.toString())
      formData.append('rating', reviewData.rating.toString())
      formData.append('comment', reviewData.comment)
      
      // Add detailed ratings if provided
      if (reviewData.punctuality_rating) {
        formData.append('punctuality_rating', reviewData.punctuality_rating.toString())
      }
      if (reviewData.quality_rating) {
        formData.append('quality_rating', reviewData.quality_rating.toString())
      }
      if (reviewData.communication_rating) {
        formData.append('communication_rating', reviewData.communication_rating.toString())
      }
      if (reviewData.value_rating) {
        formData.append('value_rating', reviewData.value_rating.toString())
      }
      
      // Add images
      images.forEach((image, index) => {
        formData.append('images', image)
      })
      
      const response = await api.post("/reviews/", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } else {
      // Regular JSON request without images
      const response = await api.post("/reviews/", reviewData)
      return response.data
    }
  },

  // Update an existing review (requires authentication)
  updateReview: async (reviewId: string, reviewData: any, images?: File[]) => {
    if (images && images.length > 0) {
      // Create FormData for multipart upload
      const formData = new FormData()
      formData.append('booking_id', reviewData.booking_id.toString())
      formData.append('rating', reviewData.rating.toString())
      formData.append('comment', reviewData.comment)
      
      // Add detailed ratings if provided
      if (reviewData.punctuality_rating) {
        formData.append('punctuality_rating', reviewData.punctuality_rating.toString())
      }
      if (reviewData.quality_rating) {
        formData.append('quality_rating', reviewData.quality_rating.toString())
      }
      if (reviewData.communication_rating) {
        formData.append('communication_rating', reviewData.communication_rating.toString())
      }
      if (reviewData.value_rating) {
        formData.append('value_rating', reviewData.value_rating.toString())
      }
      
      // Add images
      images.forEach((image, index) => {
        formData.append('images', image)
      })
      
      const response = await api.put(`/reviews/${reviewId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } else {
      // Regular JSON request without images
      const response = await api.put(`/reviews/${reviewId}/`, reviewData)
      return response.data
    }
  },

  // Create a provider review (requires authentication and completed booking)
  createProviderReview: async (providerId: number, reviewData: any, images?: File[]) => {
    if (images && images.length > 0) {
      // Create FormData for multipart upload
      const formData = new FormData()
      formData.append('booking_id', reviewData.booking_id.toString())
      formData.append('rating', reviewData.rating.toString())
      formData.append('comment', reviewData.comment)
      
      // Add images
      images.forEach((image, index) => {
        formData.append('images', image)
      })
      
      const response = await api.post(`/reviews/providers/${providerId}/create-review/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } else {
      // Regular JSON request without images
      const response = await api.post(`/reviews/providers/${providerId}/create-review/`, reviewData)
      return response.data
    }
  },

  // Check if user can review a provider
  checkReviewEligibility: async (providerId: number, bookingId?: number) => {
    const params = bookingId ? { booking_id: bookingId } : {}
    const response = await api.get(`/reviews/providers/${providerId}/review-eligibility/`, { params })
    return response.data
  },

  // Delete a review
  deleteReview: async (reviewId: string) => {
    const response = await api.delete(`/reviews/${reviewId}/`)
    return response.data
  },

  // Provider reply to a review (only the reviewed provider can reply)
  replyToReview: async (reviewId: number, responseText: string) => {
    const response = await api.post(`/reviews/${reviewId}/reply/`, { response: responseText })
    return response.data
  },
}

// Rewards API
export const rewardsApi = {
  // Get user's reward account information
  getRewardAccount: async () => {
    const response = await api.get("/rewards/account/")
    return response.data
  },

  // Get points transaction history
  getTransactionHistory: async () => {
    const response = await api.get("/rewards/transactions/")
    return response.data
  },

  // Get rewards summary
  getRewardsSummary: async () => {
    const response = await api.get("/rewards/summary/")
    return response.data
  },

  // Claim reward points for completed actions (reviews, confirmations, etc.)
  claimReward: async (rewardData: {
    points: number
    type: string
    description?: string
  }) => {
    const url = "/rewards/claim/"
    
    try {
      const response = await api.post(url, rewardData)
      return response.data
    } catch (error: any) {
      // Log error details for debugging while preserving user privacy
      console.error("Reward claim failed:", {
        status: error.response?.status,
        message: error.response?.data?.error || error.message
      })
      throw error
    }
  },

  // Get rewards configuration
  getRewardsConfig: async () => {
    const response = await api.get("/rewards/config/")
    return response.data
  },
}

// Customer API
// Customer API methods have been moved to customer.api.ts
export default api