import { useState, useEffect, useCallback } from 'react'
import api from '@/services/api'
import type { User } from '@/types/index'

interface ProviderProfile {
  bio?: string
  address?: string
  city?: string
  date_of_birth?: string
  company_name?: string
  is_approved: boolean
  display_name?: string
  years_of_experience: number
  certifications: string[]
  location_city?: string
  avg_rating: number
  reviews_count: number
  service_areas: Array<{
    id: number
    name: string
    region?: string
  }>
}

// ProviderProfileData now inherits first_name, last_name, phone from User interface
interface ProviderProfileData extends User {
  profile: ProviderProfile
}

interface PortfolioMedia {
  id: number
  media_type: 'image' | 'video'
  file: string
  title?: string
  description?: string
  order: number
  created_at: string
}

interface UpdateProfileData {
  first_name?: string
  last_name?: string
  phone?: string
  profile?: Partial<ProviderProfile>
}

interface UseProviderProfileReturn {
  profileData: ProviderProfileData | null
  portfolioMedia: PortfolioMedia[]
  loading: boolean
  error: string | null
  updateProfile: (data: UpdateProfileData) => Promise<void>
  uploadProfilePicture: (file: File) => Promise<void>
  uploadPortfolioMedia: (file: File, title?: string, description?: string) => Promise<void>
  deletePortfolioMedia: (mediaId: number) => Promise<void>
  reorderPortfolioMedia: (mediaId: number, newOrder: number) => Promise<void>
  refreshProfile: () => Promise<void>
}

export const useProviderProfile = (): UseProviderProfileReturn => {
  const [profileData, setProfileData] = useState<ProviderProfileData | null>(null)
  const [portfolioMedia, setPortfolioMedia] = useState<PortfolioMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch provider profile data
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/auth/users/me/')
      setProfileData(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch profile data')
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch portfolio media
  const fetchPortfolioMedia = useCallback(async () => {
    try {
      const response = await api.get('/auth/users/portfolio-media/')
      setPortfolioMedia(response.data)
    } catch (err: any) {
      console.error('Error fetching portfolio media:', err)
    }
  }, [])

  // Update profile information
  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    try {
      setError(null)
      const response = await api.put('/auth/users/update_profile/', data)
      setProfileData(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile')
      throw err
    }
  }, [])

  // Upload profile picture
  const uploadProfilePicture = useCallback(async (file: File) => {
    try {
      setError(null)
      const formData = new FormData()
      formData.append('profile_picture', file)
      
      const response = await api.patch('/auth/users/update_profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      setProfileData(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload profile picture')
      throw err
    }
  }, [])

  // Upload portfolio media
  const uploadPortfolioMedia = useCallback(async (file: File, title?: string, description?: string) => {
    try {
      setError(null)
      const formData = new FormData()
      formData.append('file', file)
      if (title) formData.append('title', title)
      if (description) formData.append('description', description)
      
      const response = await api.post('/auth/users/portfolio-media/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      setPortfolioMedia(prev => [...prev, response.data])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload portfolio media')
      throw err
    }
  }, [])

  // Delete portfolio media
  const deletePortfolioMedia = useCallback(async (mediaId: number) => {
    try {
      setError(null)
      await api.delete(`/auth/users/portfolio-media/${mediaId}/`)
      setPortfolioMedia(prev => prev.filter(media => media.id !== mediaId))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete portfolio media')
      throw err
    }
  }, [])

  // Reorder portfolio media
  const reorderPortfolioMedia = useCallback(async (mediaId: number, newOrder: number) => {
    try {
      setError(null)
      await api.patch(`/auth/users/portfolio-media/${mediaId}/`, { order: newOrder })
      await fetchPortfolioMedia() // Refresh to get updated order
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reorder portfolio media')
      throw err
    }
  }, [fetchPortfolioMedia])

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    await Promise.all([fetchProfile(), fetchPortfolioMedia()])
  }, [fetchProfile, fetchPortfolioMedia])

  // Initial data loading
  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  return {
    profileData,
    portfolioMedia,
    loading,
    error,
    updateProfile,
    uploadProfilePicture,
    uploadPortfolioMedia,
    deletePortfolioMedia,
    reorderPortfolioMedia,
    refreshProfile
  }
}

export default useProviderProfile