"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Star, MapPin, History, ThumbsUp, Clock } from "lucide-react"
import { customerApi, servicesApi } from "@/services/api"
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
    business_name?: string
    first_name?: string
    last_name?: string
  }
  category?: {
    title: string
  }
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

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    try {
      setLoading(true)
      
      // Load different types of recommendations in parallel
      const [recommended, featured, recent] = await Promise.all([
        customerApi.getRecommendedServices(),
        servicesApi.getServices({ is_featured: true, page_size: 6 }),
        servicesApi.getServices({ ordering: '-created_at', page_size: 6 })
      ])
      
      // Set personalized recommendations (from customer API)
      setPersonalizedServices(recommended.map((service: any) => ({
        ...service,
        reason: "Based on your activity"
      })))
      
      // Set popular services (featured services)
      setPopularServices(featured.results?.map((service: any) => ({
        ...service,
        reason: "Featured service"
      })) || [])
      
      // Set nearby services (recent services as placeholder)
      setNearbyServices(recent.results?.map((service: any) => ({
        ...service,
        reason: "Recently added"
      })) || [])
      
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

  const ServiceCard = ({ service }: { service: RecommendedService }) => {
    const providerName = service.provider?.business_name || 
      `${service.provider?.first_name || ''} ${service.provider?.last_name || ''}`.trim() || 'Service Provider'
    
    return (
      <Card className="group hover:shadow-lg transition-all duration-200">
        <div className="relative">
          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
            <Image
              src={service.image || "/placeholder.svg"}
              alt={service.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
            {service.reason && (
              <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                {service.reason}
              </div>
            )}
            {service.discount_price && (
              <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                Save Rs. {service.price - service.discount_price}
              </div>
            )}
          </div>
        </div>
        
        <CardHeader className="pb-3">
          <div className="space-y-2">
            <CardTitle className="text-lg line-clamp-1">{service.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{providerName}</p>
            {service.category && (
              <Badge variant="outline" className="w-fit">
                {service.category.title}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {service.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium">{service.average_rating.toFixed(1)}</span>
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
            
            <Button 
              className="w-full"
              onClick={() => handleBook(service)}
            >
              Book Now
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const LoadingGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(6).fill(0).map((_, i) => (
        <Card key={i}>
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
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="container py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recommended Services</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="personalized" className="space-y-6">
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
              ) : personalizedServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {personalizedServices.map((service) => (
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
              ) : nearbyServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nearbyServices.map((service) => (
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
              ) : popularServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {popularServices.map((service) => (
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