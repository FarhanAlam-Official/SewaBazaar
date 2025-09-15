"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Star, MapPin, History, ThumbsUp, Clock, Search, ChevronRight, Sparkles, ShoppingCart, Eye, User } from "lucide-react"
import { customerApi} from "@/services/customer.api"
import { servicesApi } from "@/services/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"

interface RecommendedService {
  id: number
  title: string
  description: string
  price: number
  discount_price?: number
  image?: string
  provider?: {
    id?: number
    business_name?: string
    first_name?: string
    last_name?: string
    name?: string
  }
  provider_name?: string
  category?: {
    title: string
  } | string | number
  category_name?: string
  average_rating: number
  reviews_count: number
  is_featured?: boolean
  reason?: string
}

export default function RecommendationsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("personalized")
  const [personalizedServices, setPersonalizedServices] = useState<RecommendedService[]>([])
  const [nearbyServices, setNearbyServices] = useState<RecommendedService[]>([])
  const [popularServices, setPopularServices] = useState<RecommendedService[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [filteredServices, setFilteredServices] = useState<RecommendedService[]>([])

  useEffect(() => {
    loadRecommendations()
  }, [])

  // Filter services by category
  useEffect(() => {
    let servicesToFilter: RecommendedService[] = []
    
    switch (activeTab) {
      case "personalized":
        servicesToFilter = personalizedServices
        break
      case "nearby":
        servicesToFilter = nearbyServices
        break
      case "popular":
        servicesToFilter = popularServices
        break
      default:
        servicesToFilter = personalizedServices
    }
    
    if (categoryFilter === "all") {
      setFilteredServices(servicesToFilter)
    } else {
      setFilteredServices(servicesToFilter.filter(service => {
        // Extract category title - handle both string and object formats
        // Also handle numeric category IDs by using category_name if available
        const categoryTitle = typeof service.category === 'string' 
          ? service.category 
          : typeof service.category === 'object' && service.category && 'title' in service.category
            ? service.category.title
            : service.category_name || (typeof service.category === 'number' ? `Category ${service.category}` : undefined)
        
        return categoryTitle?.toLowerCase() === categoryFilter.toLowerCase()
      }))
    }
  }, [categoryFilter, activeTab, personalizedServices, nearbyServices, popularServices])

  const loadRecommendations = async () => {
    try {
      setLoading(true)
      
      // Load different types of recommendations in parallel
      const [recommended, featured, recent] = await Promise.all([
        customerApi.getRecommendedServices(),
        servicesApi.getServices({ is_featured: true, page_size: 6 }),
        servicesApi.getServices({ ordering: '-created_at', page_size: 6 })
      ])
      
      // Debug logging
      console.log('Recommended services:', recommended);
      console.log('Featured services:', featured);
      console.log('Recent services:', recent);
      
      // Set personalized recommendations (from customer API)
      setPersonalizedServices(recommended.map((service: any) => {
        console.log('Processing recommended service:', service);
        const processedService = {
          ...service,
          provider_name: service.provider?.business_name || 
            `${service.provider?.first_name || ''} ${service.provider?.last_name || ''}`.trim() || 
            service.provider?.name ||
            'Unknown Provider',
          reason: "Based on your activity"
        };
        console.log('Processed recommended service:', processedService);
        return processedService;
      }))
      
      // Set popular services (featured services)
      setPopularServices(featured.results?.map((service: any) => {
        console.log('Processing featured service:', service);
        const processedService = {
          ...service,
          provider_name: service.provider?.business_name || 
            `${service.provider?.first_name || ''} ${service.provider?.last_name || ''}`.trim() || 
            service.provider?.name ||
            'Unknown Provider',
          reason: "Featured service"
        };
        console.log('Processed featured service:', processedService);
        return processedService;
      }) || [])
      
      // Set nearby services (recent services as placeholder)
      setNearbyServices(recent.results?.map((service: any) => {
        console.log('Processing recent service:', service);
        const processedService = {
          ...service,
          provider_name: service.provider?.business_name || 
            `${service.provider?.first_name || ''} ${service.provider?.last_name || ''}`.trim() || 
            service.provider?.name ||
            'Unknown Provider',
          reason: "Recently added"
        };
        console.log('Processed recent service:', processedService);
        return processedService;
      }) || [])
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load recommendations",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBook = (service: RecommendedService) => {
    window.location.href = `/services/${service.id}`
  }

  const handleViewService = (service: RecommendedService) => {
    window.location.href = `/services/${service.id}`
  }

  const ServiceCard = ({ service }: { service: RecommendedService }) => {
    // Fix provider name extraction
    const providerName = service.provider_name || 
      service.provider?.business_name || 
      `${service.provider?.first_name || ''} ${service.provider?.last_name || ''}`.trim() || 
      service.provider?.name ||
      'Unknown Provider'
    
    // Get provider ID if available
    const providerId = service.provider?.id
    
    // Extract category title - handle both string and object formats
    // Also handle numeric category IDs by using category_name if available
    const categoryTitle = typeof service.category === 'string' 
      ? service.category 
      : typeof service.category === 'object' && service.category && 'title' in service.category
        ? service.category.title
        : service.category_name || (typeof service.category === 'number' ? `Category ${service.category}` : undefined)
    
    // Debug logging
    console.log('Service data:', service);
    console.log('Category field:', service.category);
    console.log('Category title:', categoryTitle);
    
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
        <div className="relative">
          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
            <Image
              src={service.image || "/placeholder.svg"}
              alt={service.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              unoptimized={service.image?.startsWith('http') || false}
            />
            {service.reason && (
              <div className="absolute top-3 left-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                {service.reason}
              </div>
            )}
            {service.discount_price && (
              <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                Save Rs. {service.price - service.discount_price}
              </div>
            )}
          </div>
        </div>
        
        <CardHeader className="pb-3">
          <div className="space-y-2">
            <CardTitle className="text-lg line-clamp-1">{service.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <User className="w-4 h-4" />
              {providerId ? (
                <span 
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer transition-colors duration-200 no-underline font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/providers/${providerId}`;
                  }}
                >
                  {providerName}
                </span>
              ) : (
                <span className="text-blue-600 dark:text-blue-400 no-underline font-medium">
                  {providerName}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Category badge - now handles both string and object formats */}
            {categoryTitle && (
              <Badge 
                variant="outline" 
                className="w-fit bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-800/50 dark:hover:to-purple-800/50 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-800 dark:hover:text-indigo-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
              >
                {categoryTitle}
              </Badge>
            )}
            <p className="text-sm text-muted-foreground line-clamp-3">
              {service.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium">{typeof service.average_rating === 'number' ? service.average_rating.toFixed(1) : '0.0'}</span>
                <span className="text-sm text-muted-foreground">({service.reviews_count})</span>
              </div>
              <div className="text-right">
                {service.discount_price ? (
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-green-600">Rs. {service.discount_price}</div>
                    <div className="text-sm text-muted-foreground line-through">Rs. {service.price}</div>
                  </div>
                ) : (
                  <div className="text-lg font-bold">Rs. {service.price}</div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewService(service);
                }}
                className="flex-1 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:border-gray-600 dark:hover:text-gray-100 transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                <span className="font-medium">View Details</span>
              </Button>
              <Button 
                size="sm"
                className="flex-1 bg-gradient-to-r from-[#8E54E9] to-[#4776E6] hover:opacity-90"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBook(service);
                }}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Book Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const LoadingGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(6).fill(0).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-48 w-full rounded-t-lg" />
          <CardHeader>
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // Get all unique categories from all services
  const getAllCategories = () => {
    const allServices = [...personalizedServices, ...nearbyServices, ...popularServices]
    const categories = new Set<string>()
    allServices.forEach(service => {
      // Extract category title - handle both string and object formats
      // Also handle numeric category IDs by using category_name if available
      const categoryTitle = typeof service.category === 'string' 
        ? service.category 
        : typeof service.category === 'object' && service.category && 'title' in service.category
          ? service.category.title
          : service.category_name || (typeof service.category === 'number' ? `Category ${service.category}` : undefined)
      
      if (categoryTitle) {
        categories.add(categoryTitle)
      }
    })
    return Array.from(categories).sort()
  }

  return (
    <div className="container py-6">
      {/* Header without background */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500">
              Recommended Services
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-2xl">
              Personalized recommendations based on your preferences and activity
            </p>
          </div>
          <Button 
            variant="outline" 
            asChild 
            className="border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-800 dark:bg-gray-900 dark:text-indigo-300 dark:hover:bg-indigo-900/50 dark:hover:text-indigo-300"
          >
            <Link href="/services">
              <Search className="h-4 w-4 mr-2" />
              Browse All Services
            </Link>
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle>Recommended For You</CardTitle>
            </div>
            
            <div className="flex overflow-x-auto pb-2 space-x-2">
              <Button 
                variant={categoryFilter === "all" ? "default" : "outline"} 
                size="sm"
                onClick={() => setCategoryFilter("all")}
              >
                All
              </Button>
              {getAllCategories().map(cat => (
                <Button 
                  key={cat} 
                  variant={categoryFilter === cat ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="personalized">
                <History className="h-4 w-4 mr-2" />
                Based on History
              </TabsTrigger>
              <TabsTrigger value="nearby">
                <MapPin className="h-4 w-4 mr-2" />
                Nearby Services
              </TabsTrigger>
              <TabsTrigger value="popular">
                <ThumbsUp className="h-4 w-4 mr-2" />
                Popular Services
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personalized">
              {loading ? (
                <LoadingGrid />
              ) : filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No Personalized Recommendations Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Book a few services to get personalized recommendations based on your preferences.
                    </p>
                    <Link href="/services">
                      <Button>Browse All Services</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="nearby">
              {loading ? (
                <LoadingGrid />
              ) : filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No Nearby Services Found</h3>
                    <p className="text-muted-foreground mb-4">
                      We couldn't find services in your area. Try browsing all available services.
                    </p>
                    <Link href="/services">
                      <Button>Browse All Services</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="popular">
              {loading ? (
                <LoadingGrid />
              ) : filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <ThumbsUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No Popular Services Available</h3>
                    <p className="text-muted-foreground mb-4">
                      Popular services will appear here as they become available.
                    </p>
                    <Link href="/services">
                      <Button>Browse All Services</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Why these recommendations?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <History className="h-5 w-5 mt-1" />
                <div>
                  <h3 className="font-medium">Based on Your History</h3>
                  <p className="text-sm text-muted-foreground">
                    We analyze your booking history and preferences to suggest services you might like
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="h-5 w-5 mt-1" />
                <div>
                  <h3 className="font-medium">Location-Based</h3>
                  <p className="text-sm text-muted-foreground">
                    Find top-rated service providers in your area for quick and convenient booking
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Star className="h-5 w-5 mt-1" />
                <div>
                  <h3 className="font-medium">Highly Rated</h3>
                  <p className="text-sm text-muted-foreground">
                    All recommended services maintain high customer satisfaction ratings
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seasonal Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Pre-Monsoon Services</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get your home ready for the monsoon season with these essential services
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Roof Inspection</Button>
                  <Button variant="outline" size="sm">Drainage Check</Button>
                  <Button variant="outline" size="sm">Waterproofing</Button>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Summer Specials</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Beat the heat with our summer maintenance services
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">AC Service</Button>
                  <Button variant="outline" size="sm">Fan Installation</Button>
                  <Button variant="outline" size="sm">Cool Roof Coating</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}