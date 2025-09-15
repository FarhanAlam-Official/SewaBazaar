"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Loader2, ChevronLeft, ChevronRight, Grid, List, SlidersHorizontal, Heart, Share2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { showToast } from "@/components/ui/enhanced-toast"
import { useState, useEffect, useCallback, useMemo } from "react"
import { ServiceCard, ServiceCardSkeleton } from "@/components/services/ServiceCard"
import { EnhancedServiceFilters, FilterState } from "@/components/services/EnhancedServiceFilters"
import { servicesApi } from "@/services/api"
import { debounce } from "lodash"

// Types
interface Service {
  id: string
  title: string
  name: string // Alias for title (used by ServiceCard)
  category: string
  price: number
  discount_price?: number
  rating: number
  reviews_count: number
  provider: {
    id: number
    name: string
    is_verified: boolean
    avg_rating: number
    reviews_count: number
  }
  location: string
  image: string
  is_verified_provider: boolean
  response_time?: string
  completed_jobs?: number
  tags: string[]
  created_at: string
}

interface PaginationInfo {
  count: number
  next: string | null
  previous: string | null
  current_page: number
  total_pages: number
}

// Extended FilterState interface to include missing properties
interface ExtendedFilterState extends FilterState {
  category?: string
  city?: string
}

export default function ServicesPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  
  // State
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  
  // Filters state
  const [filters, setFilters] = useState<ExtendedFilterState>({
    search: '',
    categories: [],
    cities: [],
    priceRange: [0, 10000],
    minRating: 0,
    verifiedOnly: false,
    instantBooking: false,
    availableToday: false,
    sortBy: 'relevance',
    tags: [],
    category: 'all',
    city: 'all'
  })
  
  // Available options
  const [categories, setCategories] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  
  // Memoize transformed services to prevent unnecessary re-renders
  const transformedServices = useMemo(() => {
    console.log('🔍 [SERVICES PAGE] Transforming', services.length, 'services')
    
    return services.map((service: any) => {
      
      // Debug: Log actual service data to understand the structure
      console.log('🔍 [SERVICE DATA]', {
        id: service.id,
        title: service.title,
        average_rating: service.average_rating,
        reviews_count: service.reviews_count,
        category: service.category_name || service.category?.title,
        description: service.description || service.short_description
      })
      
      const transformedService = {
        id: service.id.toString(),
        name: service.title, // ServiceCard expects 'name'
        title: service.title, // Keep for backward compatibility
        description: service.description || service.short_description || 'No description available',
        category: service.category_name || service.category?.title || 'Unknown',
        price: parseFloat(service.price),
        discount_price: service.discount_price ? parseFloat(service.discount_price) : undefined,
        rating: parseFloat(service.average_rating) || 0,
        reviews_count: parseInt(service.reviews_count) || 0, // Ensure it's a proper integer
        provider: {
          id: service.provider?.id || 0,
          name: service.provider?.name || 'Unknown Provider',
          is_verified: service.provider?.profile?.is_verified || false,
          avg_rating: parseFloat(service.provider?.profile?.avg_rating || '0'),
          reviews_count: service.provider?.profile?.reviews_count || 0
        },
        location: service.cities?.[0]?.name || 'Location not specified',
        image: service.image || '/placeholder.jpg',
        is_verified_provider: service.is_verified_provider || false,
        response_time: service.response_time || 'Not specified',
        tags: service.tags || [],
        created_at: service.created_at
      }
      
      return transformedService
    })
  }, [services])
  
  // Debounced search with reasonable delay
  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      setFilters(prev => ({ ...prev, search: searchTerm }))
    }, 300), // Reduced to 300ms for better responsiveness (was 800ms)
    []
  )

  // Fetch services from backend using configured API with enhanced error handling
  const fetchServices = async (page: number = 1, retryCount: number = 0) => {
    try {
      // Don't set loading to true if we have cached data
      if (services.length === 0) {
        setLoading(true)
      }
      setError(null)
      
      const params = {
        page: page,
        page_size: 12,
        ...(filters.search && filters.search.trim() && { search: filters.search.trim() }),
        ...(filters.category && filters.category !== 'all' && { category: filters.category }),
        ...(filters.city && filters.city !== 'all' && { city: filters.city }),
        ...(filters.priceRange[0] > 0 && { min_price: filters.priceRange[0] }),
        ...(filters.priceRange[1] < 5000 && { max_price: filters.priceRange[1] }),
        ...(filters.minRating > 0 && { min_rating: filters.minRating }),
        ...(filters.verifiedOnly && { verified_only: 'true' }),
        ...(filters.sortBy && { sort_by: filters.sortBy })
      }

      console.log('🌐 [API CALL] Fetching services with params:', params)
      const data = await servicesApi.getServices(params)
      console.log('📥 [API RESPONSE] Received', data.results?.length || 0, 'services')
      
      setServices(data.results || [])
      
      setPagination({
        count: data.count || 0,
        next: data.next || null,
        previous: data.previous || null,
        current_page: page,
        total_pages: Math.ceil((data.count || 0) / 12)
      })
    } catch (err: any) {
      console.error('Error fetching services:', err)
      
      let errorMessage = 'Failed to fetch services'
      let shouldRetry = false
      
      if (err.response?.status === 429) {
        errorMessage = 'Loading services... Please wait.'
        shouldRetry = retryCount < 1 // Limit retries to 1 attempt
        
        if (shouldRetry) {
          const delay = 2000 // Fixed 2 second delay
          console.log(`Rate limited, retrying in ${delay/1000} seconds... (attempt ${retryCount + 1}/2)`)
          setTimeout(() => {
            fetchServices(page, retryCount + 1)
          }, delay)
          return // Don't set error state, let retry handle it
        }
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.'
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid search parameters. Please check your filters.'
      } else if (err.message.includes('Too many requests')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      
      // Only show toast for final errors (not during retries)
      if (!shouldRetry) {
        showToast.error({
          title: "Error Loading Services",
          description: errorMessage,
          duration: 5000
        })
      }
    } finally {
      // Only set loading to false if we don't have services
      if (services.length === 0) {
        setLoading(false)
      } else {
        setLoading(false)
      }
    }
  }

  // Fetch categories and cities using configured API with enhanced caching
  const fetchOptions = async () => {
    try {
      // Use Promise.allSettled to prevent one failure from blocking the other
      const [categoriesResult, citiesResult] = await Promise.allSettled([
        servicesApi.getCategories(),
        servicesApi.getCities()
      ])
      
      // Handle categories
      let categoryTitles = ['All Categories']
      if (categoriesResult.status === 'fulfilled') {
        const categoriesData = categoriesResult.value
        if (Array.isArray(categoriesData)) {
          categoryTitles = ['All Categories', ...categoriesData.map((cat: any) => cat.title)]
        } else if (categoriesData && Array.isArray(categoriesData.results)) {
          categoryTitles = ['All Categories', ...categoriesData.results.map((cat: any) => cat.title)]
        } else if (categoriesData && categoriesData.data && Array.isArray(categoriesData.data)) {
          categoryTitles = ['All Categories', ...categoriesData.data.map((cat: any) => cat.title)]
        }
      } else {
        console.warn('Failed to fetch categories:', categoriesResult.reason)
      }
      setCategories(categoryTitles)
      
      // Handle cities
      let cityNames = ['All Cities']
      if (citiesResult.status === 'fulfilled') {
        const citiesData = citiesResult.value
        if (Array.isArray(citiesData)) {
          cityNames = ['All Cities', ...citiesData.map((city: any) => city.name)]
        } else if (citiesData && Array.isArray(citiesData.results)) {
          cityNames = ['All Cities', ...citiesData.results.map((city: any) => city.name)]
        } else if (citiesData && citiesData.data && Array.isArray(citiesData.data)) {
          cityNames = ['All Cities', ...citiesData.data.map((city: any) => city.name)]
        }
      } else {
        console.warn('Failed to fetch cities:', citiesResult.reason)
      }
      setCities(cityNames)
      
    } catch (err) {
      console.error('Failed to fetch options:', err)
      // Set default options on error
      setCategories(['All Categories'])
      setCities(['All Cities'])
      // Reset filters to default values
      setFilters(prev => ({
        ...prev,
        category: 'all',
        city: 'all'
      }))
    }
  }

  // Fetch user's favorites
  const fetchFavorites = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await servicesApi.getFavorites();
      const favoriteIds = new Set<string>(
        response.results?.map((fav: any) => fav.service.toString()) as string[] || []
      );
      setFavorites(favoriteIds);
    } catch (err) {
      console.error("Error fetching favorites:", err);
    }
  };

  // Toggle favorite status
  const handleFavoriteToggle = async (serviceId: string) => {
    if (!isAuthenticated) {
      showToast.warning({
        title: "Login Required",
        description: "Please login to add favorites",
        duration: 3000,
        action: {
          label: "Login Now",
          onClick: () => router.push("/login")
        }
      });
      return;
    }

    try {
      // Toggle in UI immediately for better UX
      const newFavorites = new Set(favorites);
      if (newFavorites.has(serviceId)) {
        newFavorites.delete(serviceId);
      } else {
        newFavorites.add(serviceId);
      }
      setFavorites(newFavorites);

      // Make API call
      await servicesApi.toggleFavorite(parseInt(serviceId));
      
      showToast.success({
        title: newFavorites.has(serviceId) ? "Added to Favorites" : "Removed from Favorites",
        description: newFavorites.has(serviceId) 
          ? "Service added to your favorites" 
          : "Service removed from your favorites",
        duration: 3000
      });
    } catch (err) {
      // Revert UI change on error
      const newFavorites = new Set(favorites);
      if (newFavorites.has(serviceId)) {
        newFavorites.delete(serviceId);
      } else {
        newFavorites.add(serviceId);
      }
      setFavorites(newFavorites);
      
      console.error("Error toggling favorite:", err);
      showToast.error({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        duration: 3000
      });
    }
  };

  // Handle share
  const handleShare = async (service: Service) => {
    const shareData = {
      title: service.title,
      text: `Check out this service: ${service.title}`,
      url: `${window.location.origin}/services/${service.id}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      showToast.success({
        title: "Link Copied",
        description: "Service link copied to clipboard",
        duration: 3000
      });
    }
  };

  // Handle Book Now button click
  const handleBookNow = (service: Service) => {
    if (!isAuthenticated) {
      showToast.warning({
        title: "Login Required",
        description: "Please login to book this service",
        duration: 4000,
        action: {
          label: "Login Now",
          onClick: () => router.push("/login")
        }
      })
      return
    }

    if (user?.role !== 'customer') {
      showToast.error({
        title: "Access Denied",
        description: "Only customers can book services. Providers cannot book their own services.",
        duration: 5000
      })
      return
    }

    router.push(`/services/${service.id}?booking=true`)
  }

  // Handle filter changes
  const handleFilterChange = (key: keyof ExtendedFilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Handle price range change
  const handlePriceRangeChange = (value: [number, number]) => {
    setFilters(prev => ({ ...prev, priceRange: value }))
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    debouncedSearch(value)
    // Also update filters immediately for search
    setFilters(prev => ({ ...prev, search: value }))
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    fetchServices(page, 0) // Reset retry count for new page
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      categories: [],
      cities: [],
      priceRange: [0, 10000],
      minRating: 0,
      verifiedOnly: false,
      instantBooking: false,
      availableToday: false,
      sortBy: 'relevance',
      tags: [],
      category: 'all',
      city: 'all'
    })
  }

  // Apply filters
  const applyFilters = () => {
    fetchServices(1, 0) // Reset to first page when applying filters, reset retry count
  }

  // Memoize functions to prevent unnecessary re-renders
  const memoizedFetchOptions = useCallback(fetchOptions, [])

  // Effects
  useEffect(() => {
    // Initial load of categories and cities (only once)
    // Load options immediately for better UX
    memoizedFetchOptions()
    
    // Fetch favorites if user is authenticated
    if (isAuthenticated) {
      fetchFavorites();
    }
  }, [memoizedFetchOptions, isAuthenticated])

  // Enhanced useEffect to prevent excessive calls
  useEffect(() => {
    // Load services when filters change (with reasonable debouncing)
    const timeoutId = setTimeout(() => {
      fetchServices(1) // Always reset to first page when filters change
    }, 150) // Reduced to 150ms for better responsiveness (was 300ms)

    return () => clearTimeout(timeoutId)
  }, [filters.search, filters.category, filters.city, filters.priceRange[0], filters.priceRange[1], filters.minRating, filters.verifiedOnly, filters.sortBy]) // More specific dependencies

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Services</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <Button onClick={() => fetchServices(1, 0)} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Find the Perfect Service
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover trusted professionals for all your home and business needs
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Enhanced Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="sticky top-24">
              <EnhancedServiceFilters
                filters={filters}
                onFiltersChange={setFilters}
                onApplyFilters={applyFilters}
                onResetFilters={resetFilters}
                loading={loading}
                resultCount={pagination?.count || 0}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Search and Sort Bar */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {loading ? 'Loading...' : `${pagination?.count || 0} services found`}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <Label htmlFor="sort" className="text-sm">Sort by:</Label>
                  <Select 
                    value={filters.sortBy} 
                    onValueChange={(value) => handleFilterChange('sortBy', value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Most Relevant</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="reviews">Most Reviewed</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Services Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <ServiceCardSkeleton key={index} />
                ))}
              </div>
            ) : transformedServices.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <Search className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No services found
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Try adjusting your filters or search terms
                </p>
                <Button onClick={resetFilters} variant="outline">
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {transformedServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={{
                      id: service.id,
                      name: service.name, // Use service.name instead of service.title
                      description: service.description,
                      category: service.category,
                      provider: service.provider.name,
                      image: service.image || '/placeholder.jpg',
                      rating: service.rating,
                      reviews_count: service.reviews_count,
                      price: service.price,
                      discount_price: service.discount_price,
                      is_verified: service.is_verified_provider,
                      response_time: service.response_time,
                      completed_jobs: undefined,
                      provider_id: service.provider.id,
                      provider_rating: service.provider.avg_rating,
                      provider_reviews_count: service.provider.reviews_count,
                      location: service.location,
                      date: undefined,
                      time: undefined,
                      status: undefined
                    }}
                    variant="default"
                    enableNewBookingFlow={true}
                    showProviderLink={true}
                    isFavorited={favorites.has(service.id)}
                    onFavoriteToggle={handleFavoriteToggle}
                    onShare={handleShare}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && !loading && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={!pagination.previous}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                      const page = i + 1
                      return (
                        <Button
                          key={page}
                          variant={page === pagination.current_page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="w-10 h-10 p-0"
                        >
                          {page}
                        </Button>
                      )
                    })}
                    {pagination.total_pages > 5 && (
                      <>
                        <span className="px-2 py-2 text-gray-500">...</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.total_pages)}
                          className="w-10 h-10 p-0"
                        >
                          {pagination.total_pages}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={!pagination.next}
                    className="flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}