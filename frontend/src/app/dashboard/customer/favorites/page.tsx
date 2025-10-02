"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, MapPin, Star, Filter, Search, SortDesc, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, BadgeCheck, Eye, User, ShoppingCart } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import axiosInstance from "@/services/api"
import Image from "next/image"
import Link from "next/link"
import { Favorite } from "@/types"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"

interface PaginatedFavorites {
  count: number
  next: string | null
  previous: string | null
  results: Favorite[]
}

// Cache key constants
const CACHE_KEY = 'customer_favorites';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function CustomerFavoritesPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState("added") // added, rating, price
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filterCategory, setFilterCategory] = useState("all")
  const [sortBy, setSortBy] = useState("added") // added, rating, price

  // Function to get unique categories from favorites
  const getUniqueCategories = (): string[] => {
    const categories = favorites.map(fav => fav.service_details.category.title);
    return Array.from(new Set(categories));
  }

  useEffect(() => {
    fetchFavorites(currentPage);
  }, [currentPage, searchTerm, sortOrder]);

  const fetchFavorites = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if we have valid cached data
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setFavorites(data.results || []);
          setTotalPages(data.total_pages || 1);
          setTotalCount(data.count || 0);
          setIsLoading(false);
          return;
        }
      }
      
      const response = await axiosInstance.get(`/services/favorites/`, {
        params: { 
          page,
          page_size: 6, // Ensure only 6 items per page
          ordering: sortOrder,
          search: searchTerm
        }
      });
      
      // Cache the response data
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: response.data,
        timestamp: Date.now()
      }));
      
      setFavorites(response.data.results || []);
      setTotalPages(Math.ceil((response.data.count || 0) / 6));
      setTotalCount(response.data.count || 0);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Failed to load favorites. Please try again later.');
      
      // If we have cached data, use it as fallback
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { data } = JSON.parse(cachedData);
        setFavorites(data.results || []);
        setTotalPages(data.total_pages || 1);
        setTotalCount(data.count || 0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId: number) => {
    try {
      await axiosInstance.delete(`/services/favorites/${favoriteId}/`);
      
      // Update the UI immediately
      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
      
      // Update total count
      setTotalCount(prev => prev - 1);
      setTotalPages(Math.ceil((totalCount - 1) / 6));
      
      // Clear the cache since we've made a change
      localStorage.removeItem(CACHE_KEY);
      
      toast({
        title: "Removed from favorites",
        description: "Service has been removed from your favorites.",
      });
    } catch (err) {
      console.error('Error removing favorite:', err);
      toast({
        title: "Error",
        description: "Failed to remove from favorites. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  const ServiceCard = ({ favorite }: { favorite: Favorite }) => {
    const service = favorite.service_details
    const price = service.discount_price || service.price
    const originalPrice = service.discount_price ? service.price : null
    
    // Extract provider information
    const providerName = service.provider?.name || 'Unknown Provider'
    
    // Extract category title
    const categoryTitle = service.category?.title || 'General Service'
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="group"
      >
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
          <div className="relative">
            <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
              <Image
                src={service.image || "/placeholder.svg"}
                alt={service.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                unoptimized={service.image?.startsWith('http') || false}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder.svg";
                }}
              />
              <div className="absolute top-3 right-3">
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm border border-slate-200 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-600 transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg relative"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFavorite(favorite.id);
                  }}
                  aria-label={`Remove ${service.title} from favorites`}
                >
                  <Heart className="h-4 w-4 fill-current text-destructive dark:text-red-400 group-hover:animate-pulse" />
                  <div className="absolute -inset-1 rounded-full bg-destructive/20 dark:bg-red-500/20 blur-sm group-hover:animate-pulse"></div>
                </Button>
              </div>
              {service.is_verified_provider && (
                <div className="absolute bottom-3 left-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-3 py-1.5 rounded-full flex items-center shadow-md">
                  <BadgeCheck className="h-3 w-3 mr-1" />
                  <span className="font-medium">Verified</span>
                </div>
              )}
              {service.discount_price && (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-md">
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
                <span className="text-blue-600 dark:text-blue-400 no-underline font-medium">
                  {providerName}
                </span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* Category badge */}
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
                <Link 
                  href={`/services/${service.id}`} 
                  className="flex-1"
                  aria-label={`View details for ${service.title}`}
                >
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-full hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:border-gray-600 dark:hover:text-gray-100 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    <span className="font-medium">View Details</span>
                  </Button>
                </Link>
                <Link 
                  href={`/services/${service.id}/book`}
                  className="flex-1"
                  aria-label={`Book ${service.title}`}
                >
                  <Button 
                    size="sm"
                    className="w-full bg-gradient-to-r from-[#8E54E9] to-[#4776E6] hover:opacity-90"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Book Now
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const LoadingServiceCard = () => (
    <Card className="mb-4 overflow-hidden" aria-busy="true">
      <div className="flex flex-col md:flex-row">
        <Skeleton className="w-full md:w-48 h-48 flex-shrink-0" />
        <div className="flex-1 p-4 md:p-6">
          <div className="space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <div className="flex flex-wrap items-center justify-between pt-2 gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )

  if (error && !isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            My Favorites
          </h1>
          <p className="text-muted-foreground mt-1">
            Services you've saved for later
          </p>
        </div>
        
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto bg-destructive/10 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
            </div>
            <CardTitle>Error Loading Favorites</CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => fetchFavorites(currentPage)} 
              className="flex items-center gap-2"
              aria-label="Retry loading favorites"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          My Favorites
        </h1>
        <p className="text-muted-foreground mt-1">
          Services you've saved for later
        </p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" aria-hidden="true" />
          <label htmlFor="search-favorites" className="sr-only">Search favorites</label>
          <input
            type="text"
            id="search-favorites"
            placeholder="Search favorites..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading}
            aria-describedby="search-help"
          />
          <div id="search-help" className="sr-only">
            Enter text to search through your favorite services by title, provider, or category
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" aria-hidden="true" />
            <label htmlFor="filter-category" className="sr-only">Filter by category</label>
            <select
              id="filter-category"
              className="pl-10 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none bg-background"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              disabled={isLoading}
              aria-describedby="filter-help"
            >
              <option value="all">All Categories</option>
              {getUniqueCategories().map((category: string) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <div id="filter-help" className="sr-only">
              Select a category to filter your favorite services
            </div>
          </div>
          
          <div className="relative">
            <SortDesc className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" aria-hidden="true" />
            <label htmlFor="sort-by" className="sr-only">Sort by</label>
            <select
              id="sort-by"
              className="pl-10 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none bg-background"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              disabled={isLoading}
              aria-describedby="sort-help"
            >
              <option value="added">Recently Added</option>
              <option value="rating">Highest Rated</option>
              <option value="price">Price: Low to High</option>
            </select>
            <div id="sort-help" className="sr-only">
              Select how to sort your favorite services
            </div>
          </div>
        </div>
      </div>

      {/* Favorites list */}
      <div>
        {isLoading ? (
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
        ) : favorites.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {favorites.map((favorite) => (
                <ServiceCard key={favorite.id} favorite={favorite} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <Card className="text-center py-12">
            <CardHeader>
              <div className="mx-auto bg-muted rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
                <Heart className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              </div>
              <CardTitle>No Favorites Found</CardTitle>
              <CardDescription>
                {searchTerm || filterCategory !== "all" 
                  ? "No favorites match your search or filter criteria."
                  : "You haven't added any services to your favorites yet."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/services">
                <Button aria-label="Browse services to add to favorites">
                  Browse Services
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Go to previous page"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    aria-current={pageNum === currentPage ? "page" : undefined}
                    aria-label={`Go to page ${pageNum}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Go to next page"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Additional info at bottom */}
      {!isLoading && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>
            Showing {favorites.length > 0 ? (currentPage - 1) * 6 + 1 : 0} - {Math.min(currentPage * 6, totalCount)} of {totalCount} favorites
          </p>
        </div>
      )}
    </div>
  )
}