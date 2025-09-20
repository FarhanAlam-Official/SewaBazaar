import { useState, useEffect, useCallback } from 'react'
import { providerApi } from '@/services/provider.api'
import type { 
  ProviderService, 
  CreateServiceData, 
  ServiceCategory, 
  City,
  ProviderServicePerformance 
} from '@/types/provider'

interface UseProviderServicesReturn {
  services: ProviderService[]
  categories: ServiceCategory[]
  cities: City[]
  servicePerformance: ProviderServicePerformance | null
  loading: boolean
  error: string | null
  createService: (data: CreateServiceData) => Promise<ProviderService>
  updateService: (id: number, data: Partial<CreateServiceData>) => Promise<ProviderService>
  deleteService: (id: number) => Promise<void>
  toggleServiceStatus: (id: number, status: 'active' | 'inactive') => Promise<ProviderService>
  uploadServiceImage: (serviceId: number, file: File, isFeatured?: boolean) => Promise<void>
  refreshServices: () => Promise<void>
  refreshCategories: () => Promise<void>
  refreshCities: () => Promise<void>
  refreshPerformance: () => Promise<void>
}

export const useProviderServices = (): UseProviderServicesReturn => {
  const [services, setServices] = useState<ProviderService[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [servicePerformance, setServicePerformance] = useState<ProviderServicePerformance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch provider services
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await providerApi.getProviderServices()
      setServices(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch services')
      console.error('Error fetching provider services:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch service categories
  const fetchCategories = useCallback(async () => {
    try {
      const data = await providerApi.getServiceCategories()
      setCategories(data)
    } catch (err: any) {
      console.error('Error fetching categories:', err)
    }
  }, [])

  // Fetch available cities
  const fetchCities = useCallback(async () => {
    try {
      const data = await providerApi.getAvailableCities()
      setCities(data)
    } catch (err: any) {
      console.error('Error fetching cities:', err)
    }
  }, [])

  // Fetch service performance metrics
  const fetchServicePerformance = useCallback(async () => {
    try {
      const data = await providerApi.getServicePerformance()
      setServicePerformance(data)
    } catch (err: any) {
      console.error('Error fetching service performance:', err)
    }
  }, [])

  // Create new service
  const createService = useCallback(async (data: CreateServiceData): Promise<ProviderService> => {
    try {
      setError(null)
      const newService = await providerApi.createService(data)
      setServices(prev => [newService, ...prev])
      return newService
    } catch (err: any) {
      setError(err.message || 'Failed to create service')
      throw err
    }
  }, [])

  // Update existing service
  const updateService = useCallback(async (id: number, data: Partial<CreateServiceData>): Promise<ProviderService> => {
    try {
      setError(null)
      const updatedService = await providerApi.updateService(id, data)
      setServices(prev => prev.map(service => 
        service.id === id ? updatedService : service
      ))
      return updatedService
    } catch (err: any) {
      setError(err.message || 'Failed to update service')
      throw err
    }
  }, [])

  // Delete service
  const deleteService = useCallback(async (id: number): Promise<void> => {
    try {
      setError(null)
      await providerApi.deleteService(id)
      setServices(prev => prev.filter(service => service.id !== id))
    } catch (err: any) {
      setError(err.message || 'Failed to delete service')
      throw err
    }
  }, [])

  // Toggle service status
  const toggleServiceStatus = useCallback(async (id: number, status: 'active' | 'inactive'): Promise<ProviderService> => {
    try {
      setError(null)
      const updatedService = await providerApi.toggleServiceStatus(id, status)
      setServices(prev => prev.map(service => 
        service.id === id ? updatedService : service
      ))
      return updatedService
    } catch (err: any) {
      setError(err.message || 'Failed to update service status')
      throw err
    }
  }, [])

  // Upload service image
  const uploadServiceImage = useCallback(async (serviceId: number, file: File, isFeatured: boolean = false): Promise<void> => {
    try {
      setError(null)
      await providerApi.uploadServiceImage(serviceId, file, isFeatured)
      // Refresh services to get updated image data
      await fetchServices()
    } catch (err: any) {
      setError(err.message || 'Failed to upload image')
      throw err
    }
  }, [fetchServices])

  // Refresh functions
  const refreshServices = useCallback(async () => {
    await fetchServices()
  }, [fetchServices])

  const refreshCategories = useCallback(async () => {
    await fetchCategories()
  }, [fetchCategories])

  const refreshCities = useCallback(async () => {
    await fetchCities()
  }, [fetchCities])

  const refreshPerformance = useCallback(async () => {
    await fetchServicePerformance()
  }, [fetchServicePerformance])

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchServices(),
        fetchCategories(),
        fetchCities(),
        fetchServicePerformance()
      ])
    }

    loadInitialData()
  }, [fetchServices, fetchCategories, fetchCities, fetchServicePerformance])

  return {
    services,
    categories,
    cities,
    servicePerformance,
    loading,
    error,
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,
    uploadServiceImage,
    refreshServices,
    refreshCategories,
    refreshCities,
    refreshPerformance
  }
}

export default useProviderServices