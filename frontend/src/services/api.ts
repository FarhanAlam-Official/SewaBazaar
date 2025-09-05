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

// Create a separate axios instance for public endpoints (no auth required)
const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add response interceptor for rate limiting to public API
publicApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 1
      console.warn(`Rate limited on public API. Retrying after ${retryAfter} seconds...`)
      
      // Don't retry if we've already tried
      if (!originalRequest._retryAfter) {
        originalRequest._retryAfter = true
        
        // Wait for the retry-after period
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
        
        // Retry the request
        return publicApi(originalRequest)
      }
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

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("access_token")
    if (token && token.trim()) {
      // Only add authorization header if we have a valid token
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
      console.warn(`Rate limited. Retrying after ${retryAfter} seconds...`)
      
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

// Enhanced request queue to handle rate limiting
let requestQueue: (() => Promise<unknown>)[] = []
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
          console.warn('Rate limit hit in queue, waiting 5 seconds...')
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
      console.warn(`Request limit reached. Waiting ${waitTime}ms before next request.`)
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
const MAX_REQUESTS_PER_MINUTE = 20; // Increased limit for better performance

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
    return queueRequest(async () => {
      const response = await publicApi.get("/services/", { params })
      const data = response.data as ServicesResponse
      // Update cache when fetching services
      servicesListCache = data;
      cacheTimestamp = Date.now();
      return data
    })
  },

  getServiceById: async (idOrSlug: string): Promise<ServiceData> => {
    return queueRequest(async () => {
      try {
        // First try with the provided value (could be ID or slug)
        const response = await publicApi.get(`/services/${idOrSlug}/`)
        return response.data as ServiceData
      } catch (error: any) {
        // If it fails and the input looks like a numeric ID, we need to convert it to slug
        if (error.response?.status === 404 && /^\d+$/.test(idOrSlug)) {
          try {
            console.log(`Direct ID lookup failed for ${idOrSlug}, trying to find service by ID in list`)
            
            // Fetch services list to find the service with this ID and get its slug
            const servicesResponse = await publicApi.get("/services/", {
              params: { page_size: 100 } // Get more services to find the right one
            })
            
            let foundService = null
            
            // Search in current page
            foundService = servicesResponse.data.results?.find((s: any) => s.id.toString() === idOrSlug)
            
            // If not found and there are more pages, search through them
            if (!foundService && servicesResponse.data.next) {
              let currentUrl = servicesResponse.data.next
              while (currentUrl && !foundService) {
                const nextPageResponse = await publicApi.get(currentUrl)
                foundService = nextPageResponse.data.results?.find((s: any) => s.id.toString() === idOrSlug)
                currentUrl = nextPageResponse.data.next
                
                // Safety break to avoid infinite loops
                if (nextPageResponse.data.results?.length === 0) break
              }
            }
            
            if (foundService && foundService.slug) {
              console.log(`Found service with slug: ${foundService.slug}, fetching full details`)
              // Found by ID, now fetch the full details using the slug
              const detailResponse = await publicApi.get(`/services/${foundService.slug}/`)
              return detailResponse.data as ServiceData
            } else {
              console.error(`Service with ID ${idOrSlug} not found in services list`)
              throw new Error(`Service with ID ${idOrSlug} not found.`)
            }
          } catch (fallbackError: any) {
            console.error('Fallback service fetch failed:', fallbackError)
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
      console.log('Using cached categories');
      return categoriesCache;
    }
    
    return queueRequest(async () => {
      const response = await publicApi.get("/services/categories/")
      categoriesCache = response.data;
      categoriesCacheTimestamp = now;
      return response.data
    })
  },

  getCities: async () => {
    // Check cache first
    const now = Date.now();
    if (citiesCache && (now - citiesCacheTimestamp) < CITIES_CACHE_DURATION) {
      console.log('Using cached cities');
      return citiesCache;
    }
    
    return queueRequest(async () => {
      const response = await publicApi.get("/services/cities/")
      citiesCache = response.data;
      citiesCacheTimestamp = now;
      return response.data
    })
  },
}

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
    console.log('Making API call to:', "/bookings/bookings/")
    console.log('With data:', bookingData)
    console.log('API base URL:', API_URL)
    const response = await api.post("/bookings/bookings/", bookingData)
    console.log('API response:', response)
    return response.data
  },

  updateBookingStatus: async (id: number, statusData: any) => {
    const response = await api.patch(`/bookings/bookings/${id}/update_status/`, statusData)
    return response.data
  },

  // PHASE 1 NEW: Additional booking endpoints
  getCustomerBookings: async () => {
    const response = await api.get("/bookings/bookings/customer_bookings/")
    return response.data
  },

  getProviderBookings: async () => {
    const response = await api.get("/bookings/bookings/provider_bookings/")
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
    const response = await api.get("/bookings/booking-slots/available_slots/", {
      params: { service_id: serviceId, date, prevent_auto_generation: true }
    })
    return response.data
  },

  // Payment method endpoints
  getPaymentMethods: async () => {
    const response = await api.get("/bookings/payment-methods/")
    return response.data
  },

  // Express booking endpoints
  createExpressBooking: async (bookingData: any) => {
    const response = await api.post("/bookings/bookings/create_express_booking/", bookingData)
    return response.data
  }
}

// Reviews API
export const reviewsApi = {
  // Get reviews for a service (via its provider)
  getServiceReviews: async (serviceId: number) => {
    // First get the service to find its provider
    try {
      const serviceResponse = await publicApi.get(`/services/${serviceId}/`)
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

  // Get reviews for a provider directly
  getProviderReviews: async (providerId: number) => {
    const response = await publicApi.get(`/reviews/providers/${providerId}/reviews/`)
    return response.data
  },

  // Create a review (requires authentication)
  createReview: async (reviewData: any) => {
    const response = await api.post("/reviews/", reviewData)
    return response.data
  },

  // Create a provider review (requires authentication and completed booking)
  createProviderReview: async (providerId: number, reviewData: any) => {
    const response = await api.post(`/reviews/providers/${providerId}/create-review/`, reviewData)
    return response.data
  },

  // Check if user can review a provider
  checkReviewEligibility: async (providerId: number, bookingId?: number) => {
    const params = bookingId ? { booking_id: bookingId } : {}
    const response = await api.get(`/reviews/providers/${providerId}/review-eligibility/`, { params })
    return response.data
  },
}

// Customer API
// Customer API methods have been moved to customer.api.ts
export default api