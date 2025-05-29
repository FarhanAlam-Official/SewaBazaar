"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, MapPin, Star } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/services/api"
import Image from "next/image"
import Link from "next/link"

interface Service {
  id: number
  title: string
  description: string
  price: number
  discount_price: number | null
  image: string
  provider_name: string
  provider_image: string
  average_rating: number
  reviews_count: number
  category_details: {
    title: string
  }
}

interface Favorite {
  id: number
  service: number
  service_details: Service
  created_at: string
}

export default function CustomerFavoritesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Favorite[]>([])

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    try {
      setLoading(true)
      const response = await api.get("/services/favorites/")
      setFavorites(response.data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load favorites",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (serviceId: number) => {
    try {
      await api.post("/services/favorites/toggle/", { service: serviceId })
      setFavorites(favorites.filter(fav => fav.service !== serviceId))
      toast({
        title: "Success",
        description: "Service removed from favorites"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove from favorites",
        variant: "destructive"
      })
    }
  }

  const ServiceCard = ({ service }: { service: Service }) => (
    <Card className="mb-4">
      <div className="flex flex-col md:flex-row">
        <div className="relative w-full md:w-48 h-48">
          <Image
            src={service.image || "/placeholder.svg"}
            alt={service.title}
            fill
            className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
          />
        </div>
        <div className="flex-1">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
                <CardDescription>
                  by {service.provider_name} • {service.category_details.title}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => removeFavorite(service.id)}
              >
                <Heart className="h-5 w-5 fill-current" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground line-clamp-2 mb-4">
              {service.description}
            </p>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span>
                  {service.average_rating.toFixed(1)} ({service.reviews_count} reviews)
                </span>
              </div>
              <div>
                <span className="font-semibold text-lg">
                  Rs. {service.discount_price || service.price}
                </span>
                {service.discount_price && (
                  <span className="text-sm text-muted-foreground line-through ml-2">
                    Rs. {service.price}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4">
              <Link href={`/services/${service.id}`}>
                <Button className="w-full">View Service</Button>
              </Link>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  )

  const LoadingServiceCard = () => (
    <Card className="mb-4">
      <div className="flex flex-col md:flex-row">
        <Skeleton className="w-full md:w-48 h-48" />
        <div className="flex-1 p-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <div className="flex justify-between items-center pt-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Favorites</h1>
        <p className="text-muted-foreground">Services you've saved for later</p>
      </div>

      <div>
        {loading ? (
          Array(3).fill(0).map((_, i) => <LoadingServiceCard key={i} />)
        ) : favorites.length > 0 ? (
          favorites.map((favorite) => (
            <ServiceCard key={favorite.id} service={favorite.service_details} />
          ))
        ) : (
          <Card>
            <CardHeader>
              <CardDescription>
                You haven't added any services to your favorites yet.
                Browse our services and click the heart icon to add them here.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  )
} 