/**
 * Provider Dashboard Types
 * 
 * TypeScript interfaces for provider dashboard data structures
 */

export interface ProviderBooking {
  id: number
  service: {
    title: string
    image_url?: string
  }
  customer: {
    name: string
    phone?: string
    email?: string
  }
  date: string
  time: string
  location: string
  status: string
  price: number
  total_amount: number
  rating?: number
  payment_type?: string
  service_delivery?: any
  booking_date?: string
  booking_time?: string
  address?: string
  city?: string
  phone?: string
  special_instructions?: string
  provider_name?: string
  provider_id?: number
  service_category?: string
  booking_slot_details?: {
    id: number
    start_time: string
    end_time: string
    slot_type: string
  }
}

export interface ProviderBookingGroups {
  upcoming: ProviderBooking[]
  pending: ProviderBooking[]
  completed: ProviderBooking[]
  count: number
  next: string | null
  previous: string | null
}

export interface ProviderDashboardStats {
  bookings: {
    total: number
    this_month: number
    this_week: number
    pending: number
  }
  earnings: {
    total: number
    this_month: number
    this_week: number
  }
  ratings: {
    average_rating: number
    total_reviews: number
  }
  services: {
    active: number
    total: number
  }
  trends: {
    monthly: Array<{
      month: string
      bookings: number
      earnings: number
    }>
  }
}

export interface ProviderRecentBooking {
  id: number
  customer_name: string
  service_title: string
  status: string
  total_amount: number
  booking_date: string | null
  created_at: string
  booking_step: string
}

export interface ProviderRecentBookings {
  recent_bookings: ProviderRecentBooking[]
  recent_reviews?: ProviderReview[]
}

export interface ProviderReview {
  id: number
  rating: number
  comment: string
  customer_name: string
  service_title: string
  created_at: string
}

export interface ProviderEarningsData {
  period: string
  earnings: number
  bookings_count: number
}

export interface ProviderEarningsAnalytics {
  period: string
  total_earnings: number
  total_bookings: number
  average_per_booking: number
  earnings_data: ProviderEarningsData[]
}

export interface ProviderService {
  id: number
  title: string
  slug: string
  description: string
  short_description?: string
  price: number
  discount_price?: number
  duration: string
  category: string
  category_id: number
  cities: City[]
  image?: string
  images: ServiceImage[]
  includes?: string
  excludes?: string
  status: 'draft' | 'pending' | 'active' | 'inactive'
  is_featured: boolean
  average_rating: number
  reviews_count: number
  tags: string[]
  is_verified_provider: boolean
  response_time?: string
  cancellation_policy?: string
  view_count: number
  inquiry_count: number
  last_activity?: string
  availability: ServiceAvailability[]
  created_at: string
  updated_at: string
}

export interface ServiceImage {
  id: number
  image: string
  caption?: string
  order: number
  is_featured: boolean
  alt_text?: string
}

export interface ServiceAvailability {
  id: number
  day_of_week: number
  day_name: string
  start_time: string
  end_time: string
  is_available: boolean
}

export interface ServiceCategory {
  id: number
  title: string
  description?: string
  icon?: string
  slug: string
  is_active: boolean
}

export interface City {
  id: number
  name: string
  region?: string
  is_active: boolean
}

export interface CreateServiceData {
  title: string
  description: string
  short_description?: string
  price: number
  discount_price?: number
  duration: string
  category: number
  city_ids: number[]
  includes?: string
  excludes?: string
  tags?: string[]
  response_time?: string
  cancellation_policy?: string
}

export interface ProviderServicePerformance {
  services: Array<ProviderService & {
    bookings_count: number
    completed_bookings: number
    total_revenue: number
    conversion_rate: number
    total_reviews: number
    is_active: boolean
  }>
}

// Legacy interface for backward compatibility
export interface LegacyProviderStats {
  totalBookings: number
  upcomingBookings: number
  memberSince: string
  totalEarnings: number
  servicesCount: number
  lastBooking: string
  rating: number
  earnings: {
    total: number
    thisMonth: number
    pending: number
  }
}

// Utility type for transforming new API response to legacy format
export type ProviderStatsTransformer = (newStats: ProviderDashboardStats) => LegacyProviderStats