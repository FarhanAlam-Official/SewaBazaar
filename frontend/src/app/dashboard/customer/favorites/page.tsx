"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, MapPin, Star, Filter, Search, SortDesc, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import axiosInstance from "@/services/api"
import Image from "next/image"
import Link from "next/link"
import { Favorite } from "@/types"
import { motion, AnimatePresence } from "framer-motion"

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
  const [filterCategory, setFilterCategory] = useState("all")
  const [sortBy, setSortBy] = useState("added") // added, rating, price

  // Function to get unique categories from favorites
  const getUniqueCategories = (): string[] => {
    const categories = favorites.map(fav => fav.service_details.category.title);
    return Array.from(new Set(categories));
  }

  useEffect(() => {
    fetchFavorites();
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
          setIsLoading(false);
          return;
        }
      }
      
      const response = await axiosInstance.get(`/services/favorites/`, {
        params: { 
          page,
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
      setTotalPages(response.data.total_pages || 1);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Failed to load favorites. Please try again later.');
      
      // If we have cached data, use it as fallback
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { data } = JSON.parse(cachedData);
        setFavorites(data.results || []);
        setTotalPages(data.total_pages || 1);
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
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="group"
      >
        <Card 
          className="mb-4 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/20"
          role="article"
          aria-labelledby={`service-title-${service.id}`}
        >
          <div className="flex flex-col md:flex-row">
            <div className="relative w-full md:w-48 h-48 flex-shrink-0">
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
              <div className="absolute top-2 right-2">
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-background/80 backdrop-blur-sm hover:bg-destructive/90 hover:text-destructive-foreground transition-all duration-300"
                  onClick={() => handleRemoveFavorite(favorite.id)}
                  aria-label={`Remove ${service.title} from favorites`}
                >
                  <Heart className="h-4 w-4 fill-current text-destructive" />
                </Button>
              </div>
              {service.is_verified_provider && (
                <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center" role="status">
                  <span>Verified</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle 
                      id={`service-title-${service.id}`}
                      className="text-lg md:text-xl line-clamp-1"
                    >
                      {service.title}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-1 mt-1">
                      <span className="line-clamp-1">by {service.provider.name}</span>
                      <span aria-hidden="true">•</span>
                      <span className="line-clamp-1">{service.category.title}</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                  {service.description}
                </p>
                
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" aria-hidden="true" />
                    <span className="text-sm font-medium">
                      {typeof service.average_rating === 'number' ? service.average_rating.toFixed(1) : '0.0'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({service.reviews_count} reviews)
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-xs text-muted-foreground">
                      {service.view_count} views
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-lg">
                      Rs. {price}
                    </span>
                    {originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        Rs. {originalPrice}
                      </span>
                    )}
                  </div>
                  
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {service.response_time}
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link 
                    href={`/services/${service.id}`} 
                    className="flex-1"
                    aria-label={`View details for ${service.title}`}
                  >
                    <Button className="w-full transition-all duration-300 hover:scale-[1.02]">
                      View Service
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </div>
          </div>
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
              onClick={() => fetchFavorites()} 
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

      {/* Results count and pagination */}
      {!isLoading && (
        <div className="mb-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground" role="status">
            Showing {Math.min(favorites.length, 6)} of {totalPages * 6} favorites
          </div>
          
          {totalPages > 1 && (
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
              
              <div className="text-sm" aria-live="polite">
                Page {currentPage} of {totalPages}
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
          )}
        </div>
      )}

      {/* Favorites list */}
      <div>
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <LoadingServiceCard key={i} />)
        ) : favorites.length > 0 ? (
          <AnimatePresence>
            {favorites.map((favorite) => (
              <ServiceCard key={favorite.id} favorite={favorite} />
            ))}
          </AnimatePresence>
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
    </div>
  )
}