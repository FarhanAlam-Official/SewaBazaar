import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Star, BadgeCheck, User, Eye, ShoppingCart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { showToast } from "@/components/ui/enhanced-toast"
import { memo, useCallback } from "react"

interface ServiceCardProps {
  service: {
    id: string
    name: string
    provider: string
    image: string
    rating: number
    price: number
    date?: string
    time?: string
    location?: string
    status?: 'completed' | 'upcoming' | 'cancelled'
    // PHASE 1 NEW FIELDS
    discount_price?: number
    is_verified?: boolean
    response_time?: string
    completed_jobs?: number
    // PHASE 2 NEW FIELDS
    provider_id?: number
    provider_rating?: number
    provider_reviews_count?: number
  }
  variant?: 'history' | 'wishlist' | 'default'
  onAction?: (id: string) => void
  actionLabel?: string
  // PHASE 1 NEW PROPS
  enableNewBookingFlow?: boolean
  // PHASE 2 NEW PROPS
  showProviderLink?: boolean
}

export const ServiceCard = memo(({ 
  service, 
  variant = 'default', 
  onAction, 
  actionLabel,
  enableNewBookingFlow = true, // PHASE 1: Enable new booking flow by default
  showProviderLink = true // PHASE 2: Show provider profile links by default
}: ServiceCardProps) => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Handle booking with authentication check
  const handleBookService = useCallback(() => {
    if (!isAuthenticated) {
      // Show login prompt for unauthenticated users
      showToast.warning({
        title: "Login Required",
        description: "Please login to book this service",
        duration: 4000,
        action: {
          label: "Login Now",
          onClick: () => router.push("/login")
        }
      });
      return;
    }

    // Check if user is a customer (only customers can book services)
    if (user?.role !== 'customer') {
      showToast.error({
        title: "Access Denied",
        description: "Only customers can book services. Providers cannot book their own services.",
        duration: 5000
      });
      return;
    }

    // Redirect to booking page
    router.push(`/services/${service.id}/book`);
  }, [isAuthenticated, router, service.id, user?.role]);

  // Handle service detail navigation
  const handleViewService = useCallback(() => {
    // Ensure we have a valid service ID before navigating
    if (service.id && service.id !== 'undefined' && service.id !== 'null') {
      router.push(`/services/${service.id}`)
    } else {
      showToast.error({
        title: "Invalid Service",
        description: "This service is not available. Please try another service.",
        duration: 3000
      })
    }
  }, [router, service.id]);

  // Handle provider profile navigation
  const handleViewProvider = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (service.provider_id) {
      router.push(`/providers/${service.provider_id}`);
    }
  }, [router, service.provider_id]);

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      onClick={handleViewService}
    >
      <CardHeader className="p-0">
        <div className="relative h-48">
          <Image
            src={service.image}
            alt={service.name}
            fill
            className="object-cover"
            priority={false} // Disable priority loading for better performance
            loading="lazy" // Lazy load images
          />
          {service.is_verified && (
            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <BadgeCheck className="w-3 h-3" />
              Verified
            </div>
          )}
          {variant === 'history' && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
              {service.status}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1 line-clamp-1">{service.name}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <User className="w-4 h-4" />
              {showProviderLink && service.provider_id ? (
                <button 
                  onClick={handleViewProvider}
                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors text-left"
                >
                  {service.provider}
                </button>
              ) : (
                <span>{service.provider}</span>
              )}
            </div>
            {service.location && (
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500">
                <MapPin className="w-3 h-3" />
                <span className="line-clamp-1">{service.location}</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ₹{service.price}
            </div>
            {service.discount_price && service.discount_price < service.price && (
              <div className="text-sm text-gray-500 line-through">
                ₹{service.discount_price}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium">{service.rating.toFixed(1)}</span>
          </div>
          {service.date && (
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{service.date}</span>
            </div>
          )}
          {service.time && (
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{service.time}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {variant === 'default' && (
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // Navigate to service detail page
                handleViewService();
              }}
              className="flex-1 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:border-gray-600 dark:hover:text-gray-100 transition-colors"
            >
              <Eye className="w-4 h-4 mr-2" />
              <span className="font-medium">View Details</span>
            </Button>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                handleBookService();
              }}
              data-testid="book-now-button"
              className="flex-1 bg-gradient-to-r from-[#8E54E9] to-[#4776E6] hover:opacity-90"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Book Now
            </Button>
          </div>
        )}
        
        {/* EXISTING: Custom action button */}
        {onAction && actionLabel && variant !== 'default' && (
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onAction(service.id);
            }}
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
});

ServiceCard.displayName = 'ServiceCard';