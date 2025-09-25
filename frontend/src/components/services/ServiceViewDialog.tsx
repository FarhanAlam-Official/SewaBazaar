"use client"

import { useState } from "react"
import { motion } from "framer-motion"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

import {
  X,
  Edit,
  Star,
  DollarSign,
  Clock,
  MapPin,
  Users,
  Eye,
  Calendar,
  Tag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  MessageSquare,
  Image as ImageIcon,
  ExternalLink
} from "lucide-react"

import type { ProviderService, City, ServiceAvailability, ServiceImage } from "@/types/provider"
import { safeToFixed, safeArrayLength, safeArrayMap, safeArrayHasItems } from "@/utils/safeUtils"

interface ServiceViewDialogProps {
  service: ProviderService
  onEdit?: (service: ProviderService) => void
  onClose?: () => void
  isOpen: boolean
}

// Helper function to get service image (main image or first featured image)
const getServiceImage = (service: ProviderService): string | null => {
  // First try the main image field
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

export default function ServiceViewDialog({ 
  service,
  onEdit,
  onClose, 
  isOpen 
}: ServiceViewDialogProps) {
  const [activeTab, setActiveTab] = useState("overview")

  if (!isOpen) return null

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
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'inactive': return <XCircle className="h-4 w-4" />
      case 'pending': return <AlertTriangle className="h-4 w-4" />
      case 'draft': return <Edit className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  // Function to handle image loading errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.parentElement!.innerHTML = `
      <div class="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    `;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div className="flex items-center gap-4">
            <motion.div 
              className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <ServiceImage
                src={getServiceImage(service)}
                alt={service.title}
                fill={true}
                className="w-full h-full"
              />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold dark:text-white">{service.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(service.status)} dark:bg-gray-800 dark:border-gray-700`}
                >
                  {getStatusIcon(service.status)}
                  <span className="ml-1 capitalize">{service.status}</span>
                </Badge>
                {service.is_featured && (
                  <Badge variant="secondary" className="dark:bg-blue-900/30 dark:text-blue-200">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="outline"
                onClick={() => onEdit(service)}
                className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-md transition-all duration-200"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="dark:text-gray-300 dark:hover:bg-gray-800">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-muted dark:bg-gray-800">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="details" 
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
              >
                Details
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
              >
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="images" 
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
              >
                Images
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Service Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Price</p>
                            <p className="text-2xl font-bold dark:text-white">NPR {service.price}</p>
                            {service.discount_price && (
                              <p className="text-sm text-green-600 dark:text-green-400">
                                Discount: NPR {service.discount_price}
                              </p>
                            )}
                          </div>
                          <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Duration</p>
                            <p className="text-2xl font-bold dark:text-white">{service.duration}</p>
                          </div>
                          <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Rating</p>
                            <p className="text-2xl font-bold dark:text-white">{safeToFixed(service.average_rating, 1)}</p>
                            <p className="text-sm text-muted-foreground dark:text-gray-300">{service.reviews_count} reviews</p>
                          </div>
                          <Star className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Inquiries</p>
                            <p className="text-2xl font-bold dark:text-white">{service.inquiry_count || 0}</p>
                          </div>
                          <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Description */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="dark:text-white">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {service.short_description && (
                        <div>
                          <h4 className="font-medium mb-2 dark:text-gray-200">Short Description</h4>
                          <p className="text-muted-foreground dark:text-gray-300">{service.short_description}</p>
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium mb-2 dark:text-gray-200">Full Description</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap dark:text-gray-300">{service.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Service Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="dark:text-white">Service Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground dark:text-gray-300" />
                        <span className="font-medium dark:text-gray-200">Category:</span>
                        <Badge variant="outline" className="dark:border-gray-700 dark:text-gray-300">{service.category}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground dark:text-gray-300" />
                        <span className="font-medium dark:text-gray-200">Response Time:</span>
                        <span className="dark:text-gray-300">{service.response_time || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground dark:text-gray-300" />
                        <span className="font-medium dark:text-gray-200">Created:</span>
                        <span className="dark:text-gray-300">{new Date(service.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground dark:text-gray-300" />
                        <span className="font-medium dark:text-gray-200">Views:</span>
                        <span className="dark:text-gray-300">{service.view_count || 0}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="dark:text-white">Service Areas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {safeArrayMap(service.cities, (city: City, index) => (
                          <Badge key={index} variant="secondary" className="dark:bg-gray-700 dark:text-gray-200">
                            <MapPin className="h-3 w-3 mr-1" />
                            {city.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tags */}
                {safeArrayHasItems(service.tags) && (
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="dark:text-white">Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {safeArrayMap(service.tags, (tag: string, index) => (
                          <Badge key={index} variant="outline" className="dark:border-gray-700 dark:text-gray-300">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="details" className="space-y-6 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Includes & Excludes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {service.includes && (
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-green-600 dark:text-green-400">What's Included</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="whitespace-pre-wrap text-sm dark:text-gray-300">{service.includes}</div>
                      </CardContent>
                    </Card>
                  )}

                  {service.excludes && (
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-red-600 dark:text-red-400">What's Not Included</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="whitespace-pre-wrap text-sm dark:text-gray-300">{service.excludes}</div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Cancellation Policy */}
                {service.cancellation_policy && (
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="dark:text-white">Cancellation Policy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap text-sm dark:text-gray-300">{service.cancellation_policy}</div>
                    </CardContent>
                  </Card>
                )}

                {/* Service Availability */}
                {safeArrayHasItems(service.availability) && (
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="dark:text-white">Availability</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {safeArrayMap(service.availability, (slot: ServiceAvailability, index) => (
                          <motion.div 
                            key={index} 
                            className="flex items-center justify-between p-3 bg-gray-50 rounded dark:bg-gray-700/50"
                            whileHover={{ x: 5 }}
                            transition={{ duration: 0.2 }}
                          >
                            <span className="font-medium dark:text-gray-200">{slot.day_name}</span>
                            <span className="text-sm text-muted-foreground dark:text-gray-300">
                              {slot.start_time} - {slot.end_time}
                            </span>
                            <Badge variant={slot.is_available ? "default" : "secondary"} className={slot.is_available ? "dark:bg-blue-900/30" : "dark:bg-gray-600"}>
                              {slot.is_available ? "Available" : "Unavailable"}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Total Views</p>
                            <p className="text-2xl font-bold dark:text-white">{service.view_count || 0}</p>
                          </div>
                          <Eye className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Inquiries</p>
                            <p className="text-2xl font-bold dark:text-white">{service.inquiry_count || 0}</p>
                          </div>
                          <MessageSquare className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Reviews</p>
                            <p className="text-2xl font-bold dark:text-white">{service.reviews_count}</p>
                          </div>
                          <Star className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="dark:text-white">Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium dark:text-gray-200">Conversion Rate</span>
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">7.2%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium dark:text-gray-200">Response Rate</span>
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">95.5%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium dark:text-gray-200">Completion Rate</span>
                          <span className="text-lg font-bold text-purple-600 dark:text-purple-400">98.1%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="dark:text-white">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <motion.div className="flex items-center gap-3" whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium dark:text-gray-200">New inquiry received</p>
                            <p className="text-xs text-muted-foreground dark:text-gray-300">2 hours ago</p>
                          </div>
                        </motion.div>
                        <motion.div className="flex items-center gap-3" whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium dark:text-gray-200">Service viewed</p>
                            <p className="text-xs text-muted-foreground dark:text-gray-300">4 hours ago</p>
                          </div>
                        </motion.div>
                        <motion.div className="flex items-center gap-3" whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium dark:text-gray-200">Review received</p>
                            <p className="text-xs text-muted-foreground dark:text-gray-300">1 day ago</p>
                          </div>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="images" className="space-y-6 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {safeArrayHasItems(service.images) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {safeArrayMap(service.images, (image: ServiceImage, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="overflow-hidden dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                          <div className="relative">
                            <ServiceImage
                              src={image.image}
                              alt={image.caption || `Service image ${index + 1}`}
                              fill={true}
                              className="h-48 w-full"
                            />
                            {image.is_featured && (
                              <Badge className="absolute top-2 right-2 dark:bg-blue-900/30 dark:text-blue-200 z-10">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          {image.caption && (
                            <CardContent className="p-3">
                              <p className="text-sm text-muted-foreground dark:text-gray-300">{image.caption}</p>
                            </CardContent>
                          )}
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardContent className="p-8 text-center">
                      <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 dark:text-gray-300" />
                      <h3 className="text-lg font-semibold mb-2 dark:text-white">No Images</h3>
                      <p className="text-muted-foreground mb-4 dark:text-gray-300">
                        This service doesn't have any images yet
                      </p>
                      <Button variant="outline" disabled className="dark:border-gray-700 dark:text-gray-300">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Add Images
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </TabsContent>
            </Tabs>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-gray-300">
            <Calendar className="h-4 w-4" />
            <span>Created {new Date(service.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>Updated {new Date(service.updated_at).toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-md transition-all duration-200">
              Close
            </Button>
            {onEdit && (
              <Button 
                onClick={() => onEdit(service)} 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:shadow-md"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Service
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}