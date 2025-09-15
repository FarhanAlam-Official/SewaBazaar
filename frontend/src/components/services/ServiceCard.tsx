import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Star, BadgeCheck, User, Eye, ShoppingCart, Heart, Share2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { showToast } from "@/components/ui/enhanced-toast"
import { memo, useCallback } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface ServiceCardProps {
  service: {
    id: string
    name: string
    description?: string
    category?: string
    provider: string
    image: string
    rating: number
    reviews_count?: number
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
  loading?: boolean
  // NEW PROPS for favorites and sharing
  isFavorited?: boolean
  onFavoriteToggle?: (id: string) => void
  onShare?: (service: any) => void
}

export const ServiceCard = memo(({ 
  service, 
  variant = 'default', 
  onAction, 
  actionLabel,
  enableNewBookingFlow = true,
  showProviderLink = true,
  loading = false,
  isFavorited = false,
  onFavoriteToggle,
  onShare
}: ServiceCardProps) => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Debug logging for image data (can be removed in production)
  console.log(`🎯 [ServiceCard: ${service.name || 'Unknown'}] - Image: ${service.image}`)

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
  }, [isAuthenticated, router, service?.id, user?.role]);

  // Handle service detail navigation
  const handleViewService = useCallback(() => {
    // Ensure we have a valid service ID before navigating
    if (service?.id && service.id !== 'undefined' && service.id !== 'null') {
      router.push(`/services/${service.id}`)
    } else {
      showToast.error({
        title: "Invalid Service",
        description: "This service is not available. Please try another service.",
        duration: 3000
      })
    }
  }, [router, service?.id]);

  // Handle provider profile navigation
  const handleViewProvider = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (service?.provider_id) {
      router.push(`/providers/${service.provider_id}`);
    }
  }, [router, service?.provider_id]);

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavoriteToggle) {
      onFavoriteToggle(service.id);
    }
  }, [onFavoriteToggle, service?.id]);

  // Handle share
  const handleShare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(service);
    }
  }, [onShare, service]);

  if (loading) {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
        <CardHeader className="p-0">
          <div className="relative h-48">
            <Skeleton className="w-full h-full" />
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <User className="w-4 h-4" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500">
                <MapPin className="w-3 h-3" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="text-right">
              <Skeleton className="h-8 w-16" />
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500">
              <Calendar className="w-3 h-3" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500">
              <Clock className="w-3 h-3" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>

          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </CardContent>
      </Card>
    );
  }

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
            priority={false}
            loading="lazy"
            unoptimized={service.image.startsWith('http')}
            onError={(e) => {
              console.warn('⚠️ [ServiceCard] Image failed:', service.name || 'Unknown Service', service.image)
            }}
            onLoad={() => {
              console.log('✅ [ServiceCard] Image loaded:', service.name || 'Unknown Service')
            }}
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
          {/* Favorite and Share buttons */}
          <div className="absolute top-2 right-2 flex gap-1">
            {onShare && (
              <button
                onClick={handleShare}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white dark:hover:bg-slate-700 transition-all duration-300 hover:scale-110 hover:shadow-lg"
                aria-label="Share service"
              >
                <Share2 className="w-4 h-4 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100" />
              </button>
            )}
            {onFavoriteToggle && (
              <button
                onClick={handleFavoriteToggle}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white dark:hover:bg-slate-700 transition-all duration-300 hover:scale-110 hover:shadow-lg"
                aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-700 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400'}`} />
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1 line-clamp-1">{service.name}</CardTitle>
            {service.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-3 leading-relaxed">
                {service.description}
              </p>
            )}
            {service.category && (
              <div className="mb-2">
                <span className="inline-block bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 text-xs px-3 py-1.5 rounded-full border border-blue-200/50 dark:border-blue-700/30 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/30 dark:hover:to-indigo-800/30 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-800 dark:hover:text-blue-200 transition-all duration-200 hover:shadow-sm hover:scale-105 cursor-default font-medium">
                  {service.category}
                </span>
              </div>
            )}
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
            {/* Fix for toFixed error - ensure rating is a number */}
            <span className="text-sm font-medium">
              {typeof service.rating === 'number' ? service.rating.toFixed(1) : '0.0'}
            </span>
            {(service.reviews_count !== undefined && service.reviews_count > 0) ? (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({service.reviews_count} review{service.reviews_count !== 1 ? 's' : ''})
              </span>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                (No reviews yet)
              </span>
            )}
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

// Skeleton Service Card Component
export function ServiceCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative h-48">
          <Skeleton className="w-full h-full bg-slate-200/80 dark:bg-slate-700/80" />
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <Skeleton className="h-6 w-3/4 mb-2 bg-slate-200/80 dark:bg-slate-700/80" />
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <User className="w-4 h-4" />
              <Skeleton className="h-4 w-24 bg-slate-200/80 dark:bg-slate-700/80" />
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500">
              <MapPin className="w-3 h-3" />
              <Skeleton className="h-4 w-20 bg-slate-200/80 dark:bg-slate-700/80" />
            </div>
          </div>
          <div className="text-right">
            <Skeleton className="h-8 w-16 bg-slate-200/80 dark:bg-slate-700/80" />
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <Skeleton className="h-4 w-8 bg-slate-200/80 dark:bg-slate-700/80" />
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500">
            <Calendar className="w-3 h-3" />
            <Skeleton className="h-4 w-16 bg-slate-200/80 dark:bg-slate-700/80" />
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500">
            <Clock className="w-3 h-3" />
            <Skeleton className="h-4 w-12 bg-slate-200/80 dark:bg-slate-700/80" />
          </div>
        </div>

        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 bg-slate-200/80 dark:bg-slate-700/80" />
          <Skeleton className="h-10 flex-1 bg-slate-200/80 dark:bg-slate-700/80" />
        </div>
      </CardContent>
    </Card>
  );
}
