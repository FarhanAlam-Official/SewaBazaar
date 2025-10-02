/**
 * Portfolio Types
 * 
 * TypeScript interfaces for portfolio functionality
 */

export interface PortfolioMedia {
  id: number
  media_type: 'image' | 'video'
  file: string
  file_url: string
  order: number
  caption?: string
  is_featured?: boolean
  created_at: string
}

export interface PortfolioProject {
  id: number
  title: string
  description?: string
  order: number
  created_at: string
  updated_at: string
  media_files: PortfolioMedia[]
  primary_image_url?: string
  media_count: number
  images_count: number
  videos_count: number
}

export interface PortfolioStats {
  total_projects: number
  average_rating: number
  total_reviews: number
  achievements_count: number
  total_services: number
  featured_projects: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  earned_date: string
  category: 'rating' | 'volume' | 'milestone' | 'special'
}

export interface PortfolioReview {
  id: number
  customer: {
    id: number
    first_name: string
    last_name: string
    profile_picture?: string
  }
  service_title: string
  rating: number
  comment: string
  created_at: string
  provider_response?: string
  provider_response_created_at?: string
  images?: {
    id: number
    image: string
    caption?: string
  }[]
}

export interface CreatePortfolioProjectData {
  title: string
  description?: string
  files: File[]
}

export interface UpdatePortfolioProjectData {
  title?: string
  description?: string
  order?: number
  files?: File[]
  remove_media_ids?: number[]
  media_orders?: Record<number, number>
  featured_media_id?: number
}

export interface PortfolioFilters {
  search?: string
  ordering?: 'created_at' | '-created_at' | 'order' | '-order' | 'title'
}