"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
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

import type { ProviderService } from "@/types/provider"
import { safeToFixed, safeArrayLength, safeArrayMap, safeArrayHasItems } from "@/utils/safeUtils"

interface ServiceViewDialogProps {
  service: ProviderService
  onEdit?: (service: ProviderService) => void
  onClose?: () => void
  isOpen: boolean
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
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'draft': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            {service.image && (
              <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">{service.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(service.status)}`}
                >
                  {getStatusIcon(service.status)}
                  <span className="ml-1 capitalize">{service.status}</span>
                </Badge>
                {service.is_featured && (
                  <Badge variant="secondary">
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
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Service Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Price</p>
                          <p className="text-2xl font-bold">NPR {service.price}</p>
                          {service.discount_price && (
                            <p className="text-sm text-green-600">
                              Discount: NPR {service.discount_price}
                            </p>
                          )}
                        </div>
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Duration</p>
                          <p className="text-2xl font-bold">{service.duration}</p>
                        </div>
                        <Clock className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Rating</p>
                          <p className="text-2xl font-bold">{safeToFixed(service.average_rating, 1)}</p>
                          <p className="text-sm text-muted-foreground">{service.reviews_count} reviews</p>
                        </div>
                        <Star className="h-8 w-8 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Inquiries</p>
                          <p className="text-2xl font-bold">{service.inquiry_count || 0}</p>
                        </div>
                        <Users className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {service.short_description && (
                        <div>
                          <h4 className="font-medium mb-2">Short Description</h4>
                          <p className="text-muted-foreground">{service.short_description}</p>
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium mb-2">Full Description</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">{service.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Service Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Service Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Category:</span>
                        <Badge variant="outline">{service.category}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Response Time:</span>
                        <span>{service.response_time || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Created:</span>
                        <span>{new Date(service.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Views:</span>
                        <span>{service.view_count || 0}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Service Areas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {safeArrayMap(service.cities, (city, index) => (
                          <Badge key={index} variant="secondary">
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
                  <Card>
                    <CardHeader>
                      <CardTitle>Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {safeArrayMap(service.tags, (tag, index) => (
                          <Badge key={index} variant="outline">
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
                className="space-y-6"
              >
                {/* Includes & Excludes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {service.includes && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-green-600">What's Included</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="whitespace-pre-wrap text-sm">{service.includes}</div>
                      </CardContent>
                    </Card>
                  )}

                  {service.excludes && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-red-600">What's Not Included</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="whitespace-pre-wrap text-sm">{service.excludes}</div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Cancellation Policy */}
                {service.cancellation_policy && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Cancellation Policy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap text-sm">{service.cancellation_policy}</div>
                    </CardContent>
                  </Card>
                )}

                {/* Service Availability */}
                {safeArrayHasItems(service.availability) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Availability</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {safeArrayMap(service.availability, (slot, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="font-medium">{slot.day_name}</span>
                            <span className="text-sm text-muted-foreground">
                              {slot.start_time} - {slot.end_time}
                            </span>
                            <Badge variant={slot.is_available ? "default" : "secondary"}>
                              {slot.is_available ? "Available" : "Unavailable"}
                            </Badge>
                          </div>
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
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                          <p className="text-2xl font-bold">{service.view_count || 0}</p>
                        </div>
                        <Eye className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Inquiries</p>
                          <p className="text-2xl font-bold">{service.inquiry_count || 0}</p>
                        </div>
                        <MessageSquare className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Reviews</p>
                          <p className="text-2xl font-bold">{service.reviews_count}</p>
                        </div>
                        <Star className="h-8 w-8 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                      <p className="text-muted-foreground">
                        Detailed analytics and performance metrics will be available here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="images" className="space-y-6 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {safeArrayHasItems(service.images) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {safeArrayMap(service.images, (image, index) => (
                      <Card key={index} className="overflow-hidden">
                        <div className="relative h-48 w-full">
                          <Image
                            src={image.image}
                            alt={image.caption || `Service image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          {image.is_featured && (
                            <Badge className="absolute top-2 right-2">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        {image.caption && (
                          <CardContent className="p-3">
                            <p className="text-sm text-muted-foreground">{image.caption}</p>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Images</h3>
                      <p className="text-muted-foreground mb-4">
                        This service doesn't have any images yet
                      </p>
                      <Button variant="outline" disabled>
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

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Created {new Date(service.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>Updated {new Date(service.updated_at).toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {onEdit && (
              <Button onClick={() => onEdit(service)}>
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
