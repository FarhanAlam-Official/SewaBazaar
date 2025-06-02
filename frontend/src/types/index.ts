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
}

export interface Booking {
  id: string
  user: User
  service: Service
  provider: Provider
  status: "pending" | "confirmed" | "completed" | "cancelled"
  date: string
  time: string
  price: number
  paymentStatus: "pending" | "paid" | "refunded"
  createdAt: string
  updatedAt: string
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