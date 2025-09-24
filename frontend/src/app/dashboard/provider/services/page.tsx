"use client"

import { useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"

// Reusable Service Image Component with error handling
const ServiceImage = ({ 
  src, 
  alt, 
  className = "", 
  fill = false, 
  width, 
  height 
}: { 
  src: string | null, 
  alt: string, 
  className?: string, 
  fill?: boolean, 
  width?: number, 
  height?: number 
}) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  if (!src || imageError) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className}`}>
        <ImageIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        className={`${fill ? 'object-cover' : ''} ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        unoptimized={true}
      />
    </div>
  )
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { showToast } from "@/components/ui/enhanced-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { EnhancedStatsCard } from "@/components/provider/EnhancedStatsCard"

import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Star,
  DollarSign,
  Users,
  RefreshCw,
  AlertTriangle,
  Image as ImageIcon,
  X,
  MoreHorizontal,
  Grid3X3,
  List,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Copy,
  BarChart3
} from "lucide-react"

import { useProviderServices } from "@/hooks/useProviderServices"
import type { ProviderService, CreateServiceData } from "@/types/provider"
import ServiceCreateForm from "@/components/services/ServiceCreateForm"
import ServiceEditForm from "@/components/services/ServiceEditForm"
import ServiceViewDialog from "@/components/services/ServiceViewDialog"
import ServiceAnalytics from "@/components/services/ServiceAnalytics"
import ServiceAvailabilityManager from "@/components/services/ServiceAvailabilityManager"
import ServiceTemplatesManager from "@/components/services/ServiceTemplatesManager"
import { safeToFixed, safeArrayLength, safeArraySlice } from "@/utils/safeUtils"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
      duration: 0.4
    }
  }
}

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      type: "spring" as const,
      damping: 20,
      stiffness: 100
    }
  }
}

// Helper function to get service image (main image or first featured image)
const getServiceImage = (service: ProviderService): string | null => {
  // First try the main image field (this is the virtual field from backend)
  if (service.image) {
    return service.image
  }
  
  // Then try to get featured image from images array
  if (service.images && Array.isArray(service.images) && service.images.length > 0) {
    const featuredImage = service.images.find(img => img.is_featured)
    if (featuredImage && featuredImage.image) {
      return featuredImage.image
    }
    
    // If no featured image, use the first image
    const firstImage = service.images[0]
    if (firstImage && firstImage.image) {
      return firstImage.image
    }
  }
  
  return null
}

// Service Card Component
const ServiceCard = ({ 
  service, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onView,
  onDuplicate,
  onViewAnalytics,
  onManageAvailability,
  onSubmitForReview
}: {
  service: ProviderService
  onEdit: (service: ProviderService) => void
  onDelete: (service: ProviderService) => void
  onToggleStatus: (service: ProviderService) => void
  onView: (service: ProviderService) => void
  onDuplicate: (service: ProviderService) => void
  onViewAnalytics: (service: ProviderService) => void
  onManageAvailability: (service: ProviderService) => void
  onSubmitForReview: (service: ProviderService) => void
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700'
      case 'draft': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700'
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />
      case 'inactive': return <XCircle className="h-3 w-3" />
      case 'pending': return <Clock className="h-3 w-3" />
      case 'draft': return <Edit className="h-3 w-3" />
      default: return <AlertTriangle className="h-3 w-3" />
    }
  }

  // Function to handle image loading errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
  };

  return (
    <motion.div
      variants={cardVariants}
      className="group relative"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <Card 
        className="h-full hover:shadow-xl transition-all duration-300 border-l-4 border-l-transparent hover:border-l-blue-500 flex flex-col cursor-pointer dark:bg-gray-800 dark:border-gray-700 dark:hover:border-l-blue-500 dark:hover:shadow-xl dark:hover:shadow-blue-500/10"
        onClick={() => onView(service)}
      >
        {/* Service Image at Top */}
        <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-700">
          <ServiceImage
            src={getServiceImage(service)}
            alt={service.title}
            fill={true}
            className="w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-full bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 backdrop-blur-sm shadow-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dark:bg-gray-800">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(service); }} className="dark:hover:bg-gray-700">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(service); }} className="dark:hover:bg-gray-700">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Service
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(service); }} className="dark:hover:bg-gray-700">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewAnalytics(service); }} className="dark:hover:bg-gray-700">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onManageAvailability(service); }} className="dark:hover:bg-gray-700">
                  <Clock className="h-4 w-4 mr-2" />
                  Availability
                </DropdownMenuItem>
                {(service.status === 'active' || service.status === 'inactive') && (
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); onToggleStatus(service); }}
                    className={`${service.status === 'active' ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'} dark:hover:bg-gray-700`}
                  >
                    {service.status === 'active' ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDelete(service); }}
                  className="text-red-600 dark:text-red-400 dark:hover:bg-gray-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="flex flex-col flex-grow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getStatusColor(service.status)}`}
                  >
                    {getStatusIcon(service.status)}
                    <span className="ml-1 capitalize">{service.status}</span>
                  </Badge>
                  {service.is_featured && (
                    <Badge variant="secondary" className="text-xs dark:bg-purple-900/30 dark:text-purple-200">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors dark:text-white dark:group-hover:text-blue-400">
                  {service.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1 dark:text-gray-300">
                  {service.short_description || service.description}
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0 flex-grow flex flex-col">
            <div className="space-y-3 flex-grow flex flex-col justify-between">
              {/* Service Stats */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/30">
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <span className="font-medium dark:text-white">Rs. {service.price}</span>
                    {service.discount_price && (
                      <span className="text-xs text-muted-foreground line-through ml-1 dark:text-gray-400">
                        Rs. {service.discount_price}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="dark:text-gray-200">{service.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="p-1.5 rounded-md bg-yellow-100 dark:bg-yellow-900/30">
                    <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <span className="dark:text-gray-200">{safeToFixed(service.average_rating, 1)}</span>
                  <span className="text-muted-foreground dark:text-gray-400">({service.reviews_count || 0})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30">
                    <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="dark:text-gray-200">{service.inquiry_count || 0} inquiries</span>
                </div>
              </div>
              
              {/* Service Category & Cities */}
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">
                  {service.category}
                </Badge>
                {safeArraySlice(service.cities, 0, 2).map((city, index) => (
                  <Badge key={index} variant="secondary" className="text-xs dark:bg-gray-700 dark:text-gray-300">
                    <MapPin className="h-3 w-3 mr-1" />
                    {city.name}
                  </Badge>
                ))}
                {safeArrayLength(service.cities) > 2 && (
                  <Badge variant="secondary" className="text-xs dark:bg-gray-700 dark:text-gray-300">
                    +{safeArrayLength(service.cities) - 2} more
                  </Badge>
                )}
              </div>
              
              {/* Action Buttons at Bottom */}
              <div className="flex gap-2 pt-2 mt-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:border-blue-700 dark:border-gray-700 dark:text-gray-300 transition-all duration-200"
                  onClick={(e) => { e.stopPropagation(); onView(service); }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 hover:bg-green-50 hover:border-green-300 hover:text-green-700 dark:hover:bg-green-900/30 dark:hover:border-green-700 dark:border-gray-700 dark:text-gray-300 transition-all duration-200"
                  onClick={(e) => { e.stopPropagation(); onEdit(service); }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                {service.status === 'draft' && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
                    onClick={(e) => { e.stopPropagation(); onSubmitForReview(service); }}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Submit for Review
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  )
}

// Service List Component
const ServiceList = ({ 
  services, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onView,
  onDuplicate,
  onViewAnalytics,
  onManageAvailability,
  onSubmitForReview
}: {
  services: ProviderService[]
  onEdit: (service: ProviderService) => void
  onDelete: (service: ProviderService) => void
  onToggleStatus: (service: ProviderService) => void
  onView: (service: ProviderService) => void
  onDuplicate: (service: ProviderService) => void
  onViewAnalytics: (service: ProviderService) => void
  onManageAvailability: (service: ProviderService) => void
  onSubmitForReview: (service: ProviderService) => void
}) => {
  // Function to handle image loading errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
  };

  return (
    <div className="space-y-4">
      {services.map((service) => (
        <motion.div
          key={service.id}
          variants={cardVariants}
          className="group"
          whileHover={{ x: 5 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <Card 
            className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-transparent hover:border-l-blue-500 cursor-pointer dark:hover:border-l-blue-500 dark:bg-gray-800 dark:border-gray-700 hover:-translate-x-1 dark:hover:shadow-xl dark:hover:shadow-blue-500/10 backdrop-blur-sm"
            onClick={() => onView(service)}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  {/* Service Image */}
                  <ServiceImage
                    src={getServiceImage(service)}
                    alt={service.title}
                    fill={true}
                    className="h-20 w-20 rounded-xl overflow-hidden flex-shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Service Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-lg truncate dark:text-white">{service.title}</h3>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          service.status === 'active' 
                            ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700'
                            : service.status === 'inactive'
                            ? 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700'
                        }`}
                      >
                        {service.status}
                      </Badge>
                      {service.is_featured && (
                        <Badge variant="secondary" className="text-xs dark:bg-purple-900/30 dark:text-purple-200">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3 dark:text-gray-300">
                      {service.short_description || service.description}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-green-100 rounded-md dark:bg-green-900/30">
                          <DollarSign className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <span className="font-medium dark:text-white">Rs. {service.price}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-md dark:bg-blue-900/30">
                          <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="dark:text-gray-200">{service.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-yellow-100 rounded-md dark:bg-yellow-900/30">
                          <Star className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <span className="dark:text-gray-200">{safeToFixed(service.average_rating, 1)} ({service.reviews_count || 0})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-purple-100 rounded-md dark:bg-purple-900/30">
                          <Users className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="dark:text-gray-200">{service.inquiry_count || 0} inquiries</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {/* Submit for Review button for draft services */}
                  {service.status === 'draft' && (
                    <Button 
                      variant="default" 
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
                      onClick={(e) => { e.stopPropagation(); onSubmitForReview(service); }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Submit
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onView(service); }}
                    className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:border-blue-700 dark:border-gray-700 dark:text-gray-300 transition-all duration-200 ease-in-out shadow-sm hover:shadow-md"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onEdit(service); }}
                    className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 dark:hover:bg-green-900/30 dark:hover:border-green-700 dark:border-gray-700 dark:text-gray-300 transition-all duration-200 ease-in-out shadow-sm hover:shadow-md"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="hover:bg-gray-100 hover:border-gray-300 dark:hover:bg-gray-700 dark:border-gray-700 dark:text-gray-300 transition-all duration-200 ease-in-out shadow-sm hover:shadow-md"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4 text-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="dark:bg-gray-800">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(service); }} className="dark:hover:bg-gray-700">
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewAnalytics(service); }} className="dark:hover:bg-gray-700">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onManageAvailability(service); }} className="dark:hover:bg-gray-700">
                        <Clock className="h-4 w-4 mr-2" />
                        Availability
                      </DropdownMenuItem>
                      {(service.status === 'active' || service.status === 'inactive') && (
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); onToggleStatus(service); }}
                          className={`${service.status === 'active' ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'} dark:hover:bg-gray-700`}
                        >
                          {service.status === 'active' ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); onDelete(service); }}
                        className="text-red-600 dark:text-red-400 dark:hover:bg-gray-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

export default function ProviderServicesPage() {
  // State management
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("created_at")
  const [selectedServices, setSelectedServices] = useState<number[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false)
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false)
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<ProviderService | null>(null)
  const [serviceToEdit, setServiceToEdit] = useState<ProviderService | null>(null)
  const [serviceToView, setServiceToView] = useState<ProviderService | null>(null)
  const [serviceForAnalytics, setServiceForAnalytics] = useState<ProviderService | null>(null)
  const [serviceForAvailability, setServiceForAvailability] = useState<ProviderService | null>(null)

  // Use provider services hook
  const {
    services,
    categories,
    loading,
    deleting,
    refreshServices,
    deleteService,
    toggleServiceStatus,
    submitServiceForReview,
    getServicesByStatus,
    getActiveServicesCount,
    createService
  } = useProviderServices({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000
  })

  // Ensure categories is always an array
  const safeCategories = Array.isArray(categories) ? categories : []

  // Filter and sort services
  const filteredServices = useMemo(() => {
    let filtered = services

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(service =>
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(service => service.status === statusFilter)
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(service => service.category === categoryFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title)
        case "price":
          return a.price - b.price
        case "rating":
          return b.average_rating - a.average_rating
        case "bookings":
          return ((b as ProviderService & { bookings_count?: number }).bookings_count || 0) - 
                 ((a as ProviderService & { bookings_count?: number }).bookings_count || 0)
        case "created_at":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    return filtered
  }, [services, searchQuery, statusFilter, categoryFilter, sortBy])

  // Service actions
  const handleEditService = useCallback((service: ProviderService) => {
    setServiceToEdit(service)
    setShowEditDialog(true)
  }, [])

  const handleServiceUpdated = useCallback((service: ProviderService) => {
    setShowEditDialog(false)
    setServiceToEdit(null)
    showToast.success({
      title: "Service Updated",
      description: `${service.title} has been updated successfully!`,
      duration: 3000
    })
  }, [])

  const handleDeleteService = useCallback((service: ProviderService) => {
    setServiceToDelete(service)
    setShowDeleteDialog(true)
  }, [])

  const confirmDeleteService = useCallback(async () => {
    if (!serviceToDelete) return

    try {
      await deleteService(serviceToDelete.id)
      setShowDeleteDialog(false)
      setServiceToDelete(null)
    } catch {
      // Error handling is done in the hook
    }
  }, [serviceToDelete, deleteService])

  const handleToggleStatus = useCallback(async (service: ProviderService) => {
    try {
      // Disallow toggling when service is pending or draft
      if (service.status === 'pending' || service.status === 'draft') {
        showToast.info({
          title: 'Action Restricted',
          description: 'This service is not yet approved. You cannot change its activation state.',
          duration: 3000
        })
        return
      }
      const newStatus = service.status === 'active' ? 'inactive' : 'active'
      await toggleServiceStatus(service.id, newStatus)
    } catch {
      // Error handling is done in the hook
    }
  }, [toggleServiceStatus])

  const handleViewService = useCallback((service: ProviderService) => {
    setServiceToView(service)
    setShowViewDialog(true)
  }, [])

  const handleViewServiceEdit = useCallback((service: ProviderService) => {
    setShowViewDialog(false)
    setServiceToView(null)
    setServiceToEdit(service)
    setShowEditDialog(true)
  }, [])

  const handleDuplicateService = useCallback(async (service: ProviderService) => {
    try {
      // Create a duplicate service with modified title
      const duplicateData: CreateServiceData = {
        title: `${service.title} Copy`,
        description: service.description,
        short_description: service.short_description || "",
        price: service.price,
        discount_price: service.discount_price,
        duration: service.duration,
        category: service.category_id,
        city_ids: service.cities?.map(city => city.id) || [],
        includes: service.includes || "",
        excludes: service.excludes || "",
        tags: service.tags || [],
        response_time: service.response_time || "",
        cancellation_policy: service.cancellation_policy || "",
        status: 'draft' // Explicitly set to draft status
      }
      
      const newService = await createService(duplicateData)
      
      showToast.success({
        title: "Service Duplicated",
        description: `${service.title} has been duplicated successfully! It is currently in draft status and will be reviewed by admin before activation.`,
        duration: 3000
      })
    } catch (error) {
      console.error("Error duplicating service:", error)
      showToast.error({
        title: "Duplication Failed",
        description: "Failed to duplicate the service. Please try again.",
        duration: 5000
      })
    }
  }, [createService])

  const handleSubmitForReview = useCallback(async (service: ProviderService) => {
    try {
      // Change service status from draft to pending for review
      await submitServiceForReview(service.id)
      
      showToast.success({
        title: "Service Submitted for Review",
        description: `${service.title} has been submitted for admin review. You will be notified once it's approved.`,
        duration: 3000
      })
    } catch (error) {
      console.error("Error submitting service for review:", error)
      showToast.error({
        title: "Submission Failed",
        description: "Failed to submit service for review. Please try again.",
        duration: 5000
      })
    }
  }, [submitServiceForReview])

  const handleViewAnalytics = useCallback((service: ProviderService) => {
    setServiceForAnalytics(service)
    setShowAnalyticsDialog(true)
  }, [])

  const handleManageAvailability = useCallback((service: ProviderService) => {
    setServiceForAvailability(service)
    setShowAvailabilityDialog(true)
  }, [])

  const handleManageTemplates = useCallback(() => {
    setShowTemplatesDialog(true)
  }, [])

  const handleCreateService = useCallback(() => {
    setShowCreateDialog(true)
  }, [])

  const handleServiceCreated = useCallback((service: ProviderService) => {
    setShowCreateDialog(false)
    showToast.success({
      title: "Service Created",
      description: `${service.title} has been created successfully!`,
      duration: 3000
    })
  }, [])

  // Bulk actions

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedServices(filteredServices.map(service => service.id))
    } else {
      setSelectedServices([])
    }
  }, [filteredServices])

  const handleBulkAction = useCallback(async (action: string) => {
    if (selectedServices.length === 0) return

    try {
      switch (action) {
        case 'activate':
          // Only activate services that are currently inactive (skip pending/draft)
          await Promise.all(
            selectedServices
              .map(id => services.find(s => s.id === id))
              .filter((s): s is ProviderService => !!s && s.status === 'inactive')
              .map(s => toggleServiceStatus(s.id, 'active'))
          )
          break
        case 'deactivate':
          // Only deactivate services that are currently active
          await Promise.all(
            selectedServices
              .map(id => services.find(s => s.id === id))
              .filter((s): s is ProviderService => !!s && s.status === 'active')
              .map(s => toggleServiceStatus(s.id, 'inactive'))
          )
          break
        case 'delete':
          // TODO: Implement bulk delete
          showToast.info({
            title: "Bulk Delete",
            description: "Bulk delete functionality coming soon!",
            duration: 3000
          })
          break
      }
      setSelectedServices([])
    } catch {
      // Error handling is done in the hook
    }
  }, [selectedServices, services, toggleServiceStatus])

  // Stats
  const totalServices = services.length
  const activeServices = getActiveServicesCount()
  const pendingServices = getServicesByStatus('pending').length
  const draftServices = getServicesByStatus('draft').length

  if (loading && services.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Services Management</h1>
            <p className="text-muted-foreground">Manage your service offerings</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-4 md:p-6 lg:p-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Services Management</h1>
          <p className="text-muted-foreground dark:text-gray-400">Manage your service offerings</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManageTemplates}
            className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-sm transition-all duration-200"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button
            onClick={handleCreateService}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Service
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshServices}
            disabled={loading}
            title="Refresh services"
            className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-md transition-all duration-200"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <EnhancedStatsCard
          title="Total Services"
          value={totalServices}
          subtitle="All your services"
          icon={BarChart3}
          tone="primary"
        />
        
        <EnhancedStatsCard
          title="Active Services"
          value={activeServices}
          subtitle="Currently available"
          icon={CheckCircle}
          tone="success"
        />
        
        <EnhancedStatsCard
          title="Pending Review"
          value={pendingServices}
          subtitle="Awaiting approval"
          icon={Clock}
          tone="warning"
        />
        
        <EnhancedStatsCard
          title="Draft Services"
          value={draftServices}
          subtitle="In draft status"
          icon={Edit}
          tone="info"
        />
      </div>

      {/* Filters and Search */}
      <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
                <Input
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="all" className="dark:hover:bg-gray-700">All Status</SelectItem>
                  <SelectItem value="active" className="dark:hover:bg-gray-700">Active</SelectItem>
                  <SelectItem value="inactive" className="dark:hover:bg-gray-700">Inactive</SelectItem>
                  <SelectItem value="pending" className="dark:hover:bg-gray-700">Pending</SelectItem>
                  <SelectItem value="draft" className="dark:hover:bg-gray-700">Draft</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="all" className="dark:hover:bg-gray-700">All Categories</SelectItem>
                  {safeCategories
                    .filter(category => category.title && category.title.trim() !== '')
                    .map((category) => (
                      <SelectItem key={category.id} value={category.title} className="dark:hover:bg-gray-700">
                        {category.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="created_at" className="dark:hover:bg-gray-700">Date Created</SelectItem>
                  <SelectItem value="title" className="dark:hover:bg-gray-700">Title</SelectItem>
                  <SelectItem value="price" className="dark:hover:bg-gray-700">Price</SelectItem>
                  <SelectItem value="rating" className="dark:hover:bg-gray-700">Rating</SelectItem>
                  <SelectItem value="bookings" className="dark:hover:bg-gray-700">Bookings</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-1 border rounded-md p-1 dark:border-gray-700">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="dark:hover:bg-gray-700"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="dark:hover:bg-gray-700"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedServices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/20">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedServices.length === filteredServices.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium dark:text-gray-300">
                    {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('activate')}
                    className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-sm transition-all duration-200"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Activate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('deactivate')}
                    className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-sm transition-all duration-200"
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Deactivate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                    className="text-red-600 hover:text-red-700 dark:border-gray-700 dark:text-red-400 dark:hover:bg-gray-800 hover:shadow-sm transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedServices([])}
                    className="dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <Card className="p-8 text-center dark:bg-gray-800 dark:border-gray-700">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 dark:bg-gray-700">
              <BarChart3 className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2 dark:text-white">
              {searchQuery || statusFilter !== "all" || categoryFilter !== "all" 
                ? "No services match your filters" 
                : "No services yet"
              }
            </h3>
            <p className="text-muted-foreground mb-4 dark:text-gray-400">
              {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Create your first service to get started"
              }
            </p>
            {!searchQuery && statusFilter === "all" && categoryFilter === "all" && (
              <Button 
                onClick={handleCreateService}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Service
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            : "space-y-4"
          }
        >
          <AnimatePresence>
            {viewMode === "grid" ? (
              filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onEdit={handleEditService}
                  onDelete={handleDeleteService}
                  onToggleStatus={handleToggleStatus}
                  onView={handleViewService}
                  onDuplicate={handleDuplicateService}
                  onViewAnalytics={handleViewAnalytics}
                  onManageAvailability={handleManageAvailability}
                  onSubmitForReview={handleSubmitForReview}
                />
              ))
            ) : (
              <ServiceList
                services={filteredServices}
                onEdit={handleEditService}
                onDelete={handleDeleteService}
                onToggleStatus={handleToggleStatus}
                onView={handleViewService}
                onDuplicate={handleDuplicateService}
                onViewAnalytics={handleViewAnalytics}
                onManageAvailability={handleManageAvailability}
                onSubmitForReview={handleSubmitForReview}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Delete Service</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              Are you sure you want to delete &quot;{serviceToDelete?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteService}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Service Form */}
      <ServiceCreateForm
        isOpen={showCreateDialog}
        onSuccess={handleServiceCreated}
        onCancel={() => setShowCreateDialog(false)}
      />

      {/* Edit Service Form */}
      {serviceToEdit && (
        <ServiceEditForm
          service={serviceToEdit}
          isOpen={showEditDialog}
          onSuccess={handleServiceUpdated}
          onCancel={() => {
            setShowEditDialog(false)
            setServiceToEdit(null)
          }}
        />
      )}

      {/* View Service Dialog */}
      {serviceToView && (
        <ServiceViewDialog
          service={serviceToView}
          isOpen={showViewDialog}
          onEdit={handleViewServiceEdit}
          onClose={() => {
            setShowViewDialog(false)
            setServiceToView(null)
          }}
        />
      )}

      {/* Analytics Dialog */}
      {serviceForAnalytics && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowAnalyticsDialog(false)
            setServiceForAnalytics(null)
          }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold dark:text-white">Service Analytics</h2>
                <Button variant="ghost" size="sm" onClick={() => {
                  setShowAnalyticsDialog(false)
                  setServiceForAnalytics(null)
                }} className="dark:text-gray-300 dark:hover:bg-gray-700">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ServiceAnalytics
                service={serviceForAnalytics}
                onRefresh={refreshServices}
              />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Availability Dialog */}
      {serviceForAvailability && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowAvailabilityDialog(false)
            setServiceForAvailability(null)
          }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold dark:text-white">Service Availability</h2>
                <Button variant="ghost" size="sm" onClick={() => {
                  setShowAvailabilityDialog(false)
                  setServiceForAvailability(null)
                }} className="dark:text-gray-300 dark:hover:bg-gray-700">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ServiceAvailabilityManager
                serviceId={serviceForAvailability.id}
                availability={serviceForAvailability.availability || []}
                onAvailabilityUpdate={(availability) => {
                  // Update service availability
                  setServiceForAvailability(prev => prev ? { ...prev, availability } : null)
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Templates Dialog */}
      {showTemplatesDialog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowTemplatesDialog(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold dark:text-white">Service Templates</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowTemplatesDialog(false)} className="dark:text-gray-300 dark:hover:bg-gray-700">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ServiceTemplatesManager
                services={services}
                categories={safeCategories}
                cities={[]} // Add cities if available
                onServiceCreate={async (serviceData) => {
                  // Handle service creation from template
                  showToast.success({
                    title: "Service Created",
                    description: "Service has been created from template",
                    duration: 3000
                  })
                  return serviceData as ProviderService
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
