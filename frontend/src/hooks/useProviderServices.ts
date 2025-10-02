import { useState, useEffect, useCallback } from 'react'
import { providerApi } from '@/services/provider.api'
import { showToast } from '@/components/ui/enhanced-toast'
import type { ProviderService, CreateServiceData, ServiceImage, ServiceCategory, City } from '@/types/provider'

interface UseProviderServicesOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  initialLoad?: boolean
}

interface UseProviderServicesReturn {
  // Data
  services: ProviderService[]
  categories: ServiceCategory[]
  cities: City[]
  
  // Loading states
  loading: boolean
  creating: boolean
  updating: boolean
  deleting: boolean
  
  // Error states
  error: string | null
  
  // Actions
  refreshServices: () => Promise<void>
  refreshCategories: () => Promise<void>
  refreshCities: () => Promise<void>
  createService: (serviceData: CreateServiceData) => Promise<ProviderService>
  createServiceCategory: (categoryData: { title: string; description?: string; icon?: string }) => Promise<ServiceCategory>
  updateService: (serviceId: number, serviceData: Partial<CreateServiceData>) => Promise<ProviderService>
  deleteService: (serviceId: number) => Promise<void>
  toggleServiceStatus: (serviceId: number, status: 'active' | 'inactive') => Promise<ProviderService>
  submitServiceForReview: (serviceId: number) => Promise<ProviderService>
  uploadServiceImage: (serviceId: number, imageFile: File, isFeatured?: boolean) => Promise<ServiceImage>
  
  // Utility functions
  getServiceById: (serviceId: number) => ProviderService | undefined
  getServicesByStatus: (status: string) => ProviderService[]
  getActiveServicesCount: () => number
  getTotalRevenue: () => number
  getAverageRating: () => number
}

export const useProviderServices = (
  options: UseProviderServicesOptions = {}
): UseProviderServicesReturn => {
  const {
    autoRefresh = false,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    initialLoad = true
  } = options

  // State
  const [services, setServices] = useState<ProviderService[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(initialLoad)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refresh services
  const refreshServices = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      
      const data = await providerApi.getProviderServices()
      setServices(data)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch services'
      setError(errorMessage)      
      showToast.error({
        title: 'Error Loading Services',
        description: errorMessage,
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh categories
  const refreshCategories = useCallback(async () => {
    try {
      const data = await providerApi.getServiceCategories()
      setCategories(data)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch categories'
      setError(errorMessage)      
      showToast.error({
        title: 'Error Loading Categories',
        description: errorMessage,
        duration: 5000
      })
      setCategories([]) // Reset to empty array on error
      // Don't show toast for categories as it's not critical
    }
  }, [])

  // Refresh cities
  const refreshCities = useCallback(async () => {
    try {
      const data = await providerApi.getAvailableCities()
      setCities(data)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch cities'
      setError(errorMessage)      
      showToast.error({
        title: 'Error Loading Cities',
        description: errorMessage,
        duration: 5000
      })
      setCities([]) // Reset to empty array on error
      // Don't show toast for cities as it's not critical
    }
  }, [])

  // Create service category
  const createServiceCategory = useCallback(async (categoryData: {
    title: string
    description?: string
    icon?: string
  }): Promise<ServiceCategory> => {
    try {
      setCreating(true)
      setError(null)
      
      const newCategory = await providerApi.createServiceCategory(categoryData)
      
      // Add to local state immediately
      setCategories(prev => [...prev, newCategory])
      
      showToast.success({
        title: 'Category Created',
        description: `${newCategory.title} has been created successfully`,
        duration: 3000
      })
      
      return newCategory
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create category'
      setError(errorMessage)
      showToast.error({
        title: 'Category Creation Failed',
        description: errorMessage,
        duration: 2500
      })
      
      showToast.error({
        title: 'Category Creation Failed',
        description: errorMessage,
        duration: 5000
      })
      throw err
    } finally {
      setCreating(false)
    }
  }, [])

  // Create service
  const createService = useCallback(async (serviceData: CreateServiceData): Promise<ProviderService> => {
    try {
      setCreating(true)
      setError(null)
      
      const newService = await providerApi.createService(serviceData)
      
      // Add to local state immediately
      setServices(prev => [...prev, newService])
      
      showToast.success({
        title: 'Service Created',
        description: `${newService.title} has been created successfully`,
        duration: 3000
      })
      
      return newService
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create service'
      setError(errorMessage)      
      showToast.error({
        title: 'Service Creation Failed',
        description: errorMessage,
        duration: 2500
      })
      throw err
    } finally {
      setCreating(false)
    }
  }, [])

  // Update service
  const updateService = useCallback(async (
    serviceId: number,
    serviceData: Partial<CreateServiceData>
  ): Promise<ProviderService> => {
    try {
      setUpdating(true)
      setError(null)
      
      const updatedService = await providerApi.updateService(serviceId, serviceData)
      
      // Update local state
      setServices(prev => prev.map(service => 
        service.id === serviceId ? updatedService : service
      ))
      
      showToast.success({
        title: 'Service Updated',
        description: `${updatedService.title} has been updated successfully`,
        duration: 3000
      })
      
      return updatedService
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update service'
      setError(errorMessage)      
      showToast.error({
        title: 'Service Update Failed',
        description: errorMessage,
        duration: 2500
      })
      throw err
    } finally {
      setUpdating(false)
    }
  }, [])

  // Delete service
  const deleteService = useCallback(async (serviceId: number): Promise<void> => {
    try {
      setDeleting(true)
      setError(null)
      
      const serviceToDelete = services.find(s => s.id === serviceId)
      
      await providerApi.deleteService(serviceId)
      
      // Remove from local state
      setServices(prev => prev.filter(service => service.id !== serviceId))
      
      showToast.success({
        title: 'Service Deleted',
        description: `${serviceToDelete?.title || 'Service'} has been deleted successfully`,
        duration: 3000
      })
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete service'
      setError(errorMessage)      
      
      showToast.error({
        title: 'Service Deletion Failed',
        description: errorMessage,
        duration: 2500
      })
      throw err
    } finally {
      setDeleting(false)
    }
  }, [services])

  // Toggle service status
  const toggleServiceStatus = useCallback(async (
    serviceId: number,
    status: 'active' | 'inactive'
  ): Promise<ProviderService> => {
    try {
      setUpdating(true)
      setError(null)
      
      const updatedService = await providerApi.toggleServiceStatus(serviceId, status)
      
      // Update local state
      setServices(prev => prev.map(service => 
        service.id === serviceId ? updatedService : service
      ))
      
      showToast.success({
        title: 'Service Status Updated',
        description: `Service is now ${status}`,
        duration: 3000
      })
      
      return updatedService
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update service status'
      setError(errorMessage)      
      
      showToast.error({
        title: 'Status Update Failed',
        description: errorMessage,
        duration: 2500
      })
      throw err
    } finally {
      setUpdating(false)
    }
  }, [])

  // Submit service for review (change status from draft to pending)
  const submitServiceForReview = useCallback(async (
    serviceId: number
  ): Promise<ProviderService> => {
    try {
      setUpdating(true)
      setError(null)
      
      // Update service status to pending
      const updatedService = await providerApi.updateService(serviceId, { status: 'pending' })
      
      // Update local state
      setServices(prev => prev.map(service => 
        service.id === serviceId ? updatedService : service
      ))
      
      showToast.success({
        title: 'Service Submitted for Review',
        description: 'Service has been submitted for admin review',
        duration: 3000
      })
      
      return updatedService
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to submit service for review'
      setError(errorMessage)      
      
      showToast.error({
        title: 'Submission Failed',
        description: errorMessage,
        duration: 2500
      })
      throw err
    } finally {
      setUpdating(false)
    }
  }, [])

  // Upload service image
  const uploadServiceImage = useCallback(async (
    serviceId: number,
    imageFile: File,
    isFeatured: boolean = false
  ): Promise<ServiceImage> => {
    try {
      setUpdating(true)
      setError(null)
      
      const uploadedImage = await providerApi.uploadServiceImage(serviceId, imageFile, isFeatured)
      
      // Update local state with the new image
      setServices(prev => prev.map(service => 
        service.id === serviceId 
          ? { ...service, images: [...(service.images || []), uploadedImage] }
          : service
      ))
      
      showToast.success({
        title: 'Image Uploaded',
        description: 'Service image has been uploaded successfully',
        duration: 3000
      })
      
      return uploadedImage
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload image'
      setError(errorMessage)      
      
      showToast.error({
        title: 'Image Upload Failed',
        description: errorMessage,
        duration: 2500
      })
      throw err
    } finally {
      setUpdating(false)
    }
  }, [])

  // Utility functions
  const getServiceById = useCallback((serviceId: number): ProviderService | undefined => {
    return services.find(service => service.id === serviceId)
  }, [services])

  const getServicesByStatus = useCallback((status: string): ProviderService[] => {
    return services.filter(service => service.status === status)
  }, [services])

  const getActiveServicesCount = useCallback((): number => {
    return services.filter(service => service.status === 'active').length
  }, [services])

  const getTotalRevenue = useCallback((): number => {
    return services.reduce((total, service) => {
      // Calculate revenue based on bookings count and price
      const serviceRevenue = (service as any).bookings_count * service.price || 0
      return total + serviceRevenue
    }, 0)
  }, [services])

  const getAverageRating = useCallback((): number => {
    const servicesWithRatings = services.filter(service => service.reviews_count > 0)
    if (servicesWithRatings.length === 0) return 0
    
    const totalRating = servicesWithRatings.reduce((sum, service) => sum + service.average_rating, 0)
    return totalRating / servicesWithRatings.length
  }, [services])

  // Initial load
  useEffect(() => {
    if (initialLoad) {
      const loadData = async () => {
        try {
          await Promise.all([
            refreshServices(),
            refreshCategories(),
            refreshCities()
          ])
        } catch (error) {
          showToast.error({
            title: 'Error Loading Initial Data',
            description: 'Failed to load initial data. Please try again.',
            duration: 2500
          })
        }
      }
      loadData()
    }
  }, [initialLoad, refreshServices, refreshCategories, refreshCities])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refreshServices()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refreshServices])

  return {
    // Data
    services,
    categories,
    cities,
    
    // Loading states
    loading,
    creating,
    updating,
    deleting,
    
    // Error states
    error,
    
    // Actions
    refreshServices,
    refreshCategories,
    refreshCities,
    createService,
    createServiceCategory,
    updateService,
    deleteService,
    toggleServiceStatus,
    submitServiceForReview,
    uploadServiceImage,
    
    // Utility functions
    getServiceById,
    getServicesByStatus,
    getActiveServicesCount,
    getTotalRevenue,
    getAverageRating
  }
}

export default useProviderServices