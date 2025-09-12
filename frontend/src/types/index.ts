// Common Types
export interface User {
  id: string
  name: string
  email: string
  role: "user" | "provider" | "admin"
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface Service {
  id: string
  name: string
  description: string
  category: string
  price: number
  duration: number
  provider: Provider
  rating: number
  reviews: Review[]
  images: string[]
  createdAt: string
  updatedAt: string
}

export interface Provider {
  id: string
  name: string
  description: string
  services: string[]
  rating: number
  reviews: Review[]
  avatar: string
  coverImage: string
  location: {
    city: string
    address: string
    coordinates: {
      lat: number
      lng: number
    }
  }
  contact: {
    phone: string
    email: string
    website?: string
  }
  availability: {
    days: string[]
    hours: {
      start: string
      end: string
    }
  }
  createdAt: string
  updatedAt: string
}

export interface Review {
  id: string
  user: User
  rating: number
  comment: string
  images?: string[]
  createdAt: string
  updatedAt: string
  // Additional fields from API response
  service_title?: string
  provider?: {
    id: string
    display_name: string
    profile_picture?: string
    is_verified?: boolean
  }
  customer?: {
    id: string
    display_name: string
  }
  booking_date?: string
  is_edited?: boolean
  can_edit?: boolean
  can_delete?: boolean
}

export interface Booking {
  id: string
  user: User
  service: Service
  provider: Provider
  // ENHANCED STATUS SYSTEM - Backward compatible with new additions
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rejected" | 
          "payment_pending" | "service_delivered" | "awaiting_confirmation" | "disputed"
  booking_step: "service_selection" | "datetime_selection" | "details_input" | 
                "payment" | "confirmation" | "completed" | "payment_completed" | 
                "service_delivered" | "customer_confirmed"
  date: string
  time: string
  price: number
  total_amount: number
  paymentStatus: "pending" | "paid" | "refunded"
  // ENHANCED BOOKING FIELDS
  booking_date: string
  booking_time: string
  address: string
  city: string
  phone: string
  special_instructions?: string
  booking_slot?: string
  booking_slot_details?: {
    id: number
    start_time: string
    end_time: string
    slot_type: string
  }
  reschedule_reason?: string
  reschedule_history?: Array<{
    reason: string
    timestamp: string
    old_date: string
    old_time: string
    new_date: string
    new_time: string
    price_change: number
  }>
  cancellation_reason?: string
  rejection_reason?: string
  // SERVICE DELIVERY TRACKING
  service_delivery?: ServiceDelivery
  // ENHANCED STATUS INFO
  legacy_status?: string  // For backward compatibility
  status_info?: {
    current_status: string
    booking_step: string
    is_payment_completed: boolean
    is_service_delivered: boolean
    is_fully_completed: boolean
    requires_customer_confirmation: boolean
    can_mark_delivered: boolean
    can_confirm_completion: boolean
  }
  createdAt: string
  updatedAt: string
}

// NEW INTERFACE: Service Delivery Tracking
export interface ServiceDelivery {
  id: number
  booking: number
  delivered_at?: string
  delivered_by?: number
  delivered_by_name?: string
  delivery_notes: string
  delivery_photos: string[]
  customer_confirmed_at?: string
  customer_rating?: number
  customer_notes: string
  would_recommend?: boolean
  dispute_raised: boolean
  dispute_reason: string
  dispute_resolved: boolean
  dispute_resolved_at?: string
  is_fully_confirmed: boolean
  days_since_delivery?: number
  created_at: string
  updated_at: string
}

// ENHANCED INTERFACE: Payment Tracking
export interface Payment {
  id: number
  payment_id: string
  booking: number
  payment_method: number
  payment_method_details?: PaymentMethod
  amount: number
  processing_fee: number
  total_amount: number
  amount_in_paisa: number
  // ENHANCED PAYMENT FIELDS
  payment_type: "digital_wallet" | "bank_transfer" | "cash"
  is_cash_payment: boolean
  cash_collected_at?: string
  cash_collected_by?: number
  cash_collected_by_name?: string
  is_verified: boolean
  verified_at?: string
  verified_by?: number
  verified_by_name?: string
  payment_attempts: number
  last_payment_attempt: string
  failure_reason?: string
  refund_amount: number
  refund_reason?: string
  refunded_at?: string
  refunded_by?: number
  // COMPUTED FIELDS
  is_digital_payment: boolean
  requires_verification: boolean
  can_be_refunded: boolean
  // EXISTING FIELDS
  khalti_token?: string
  khalti_transaction_id?: string
  transaction_id: string
  status: "pending" | "processing" | "completed" | "failed"
  paid_at?: string
  created_at: string
  updated_at: string
}

// NEW INTERFACE: Enhanced Payment Method
export interface PaymentMethod {
  id: number
  name: string
  payment_type: "digital_wallet" | "bank_transfer" | "cash"
  is_active: boolean
  processing_fee_percentage: number
  icon_image?: string
  icon_url?: string
  icon_emoji?: string
  icon_display: string  // Property method for best available icon
  gateway_config: Record<string, any>
  is_featured: boolean
  priority_order: number
  description?: string
  supported_currencies: string[]
  min_amount?: number
  max_amount?: number
  created_at: string
  updated_at: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

// Form Types
export interface LoginForm {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterForm extends LoginForm {
  name: string
  confirmPassword: string
  role: "user" | "provider"
  terms: boolean
} 