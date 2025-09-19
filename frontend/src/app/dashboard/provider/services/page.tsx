"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Clock, 
  MapPin, 
  DollarSign,
  Image as ImageIcon,
  ToggleLeft,
  Calendar,
  Target,
  Settings,
  Clock4,
  Star,
  Eye,
  TrendingUp,
  Loader2,
  Upload,
  X
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useProviderServices } from '@/hooks/useProviderServices'
import type { ProviderService, CreateServiceData } from '@/types/provider'

interface ServiceFormData {
  title: string
  description: string
  short_description: string
  price: string
  discount_price: string
  duration: string
  category: string
  city_ids: number[]
  includes: string
  excludes: string
  tags: string[]
  response_time: string
  cancellation_policy: string
}

const initialFormData: ServiceFormData = {
  title: '',
  description: '',
  short_description: '',
  price: '',
  discount_price: '',
  duration: '',
  category: '',
  city_ids: [],
  includes: '',
  excludes: '',
  tags: [],
  response_time: '',
  cancellation_policy: ''
}

export default function ServicesManagement() {
  const { toast } = useToast()
  const {
    services,
    categories,
    cities,
    servicePerformance,
    loading,
    error,
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,
    uploadServiceImage,
    refreshServices
  } = useProviderServices()

  const [formData, setFormData] = useState<ServiceFormData>(initialFormData)
  const [editingService, setEditingService] = useState<ProviderService | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])

  // Filter services based on status and search
  const filteredServices = services.filter(service => {
    const matchesStatus = statusFilter === 'all' || service.status === statusFilter
    const matchesSearch = searchQuery === '' || 
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Handle form input changes
  const handleInputChange = (field: keyof ServiceFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle city selection
  const handleCityToggle = (cityId: number) => {
    setFormData(prev => ({
      ...prev,
      city_ids: prev.city_ids.includes(cityId)
        ? prev.city_ids.filter(id => id !== cityId)
        : [...prev.city_ids, cityId]
    }))
  }

  // Handle tag input
  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    setFormData(prev => ({
      ...prev,
      tags
    }))
  }

  // Open form for new service
  const handleAddService = () => {
    setEditingService(null)
    setFormData(initialFormData)
    setSelectedImages([])
    setIsFormOpen(true)
  }

  // Open form for editing service
  const handleEditService = (service: ProviderService) => {
    setEditingService(service)
    setFormData({
      title: service.title,
      description: service.description,
      short_description: service.short_description || '',
      price: service.price.toString(),
      discount_price: service.discount_price?.toString() || '',
      duration: service.duration,
      category: service.category_id.toString(),
      city_ids: service.cities.map(city => city.id),
      includes: service.includes || '',
      excludes: service.excludes || '',
      tags: service.tags,
      response_time: service.response_time || '',
      cancellation_policy: service.cancellation_policy || ''
    })
    setSelectedImages([])
    setIsFormOpen(true)
  }

  // Submit form
  const handleSubmitForm = async () => {
    try {
      setIsSubmitting(true)

      // Validate required fields
      if (!formData.title || !formData.description || !formData.price || !formData.category) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        })
        return
      }

      const serviceData: CreateServiceData = {
        title: formData.title,
        description: formData.description,
        short_description: formData.short_description || undefined,
        price: parseFloat(formData.price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : undefined,
        duration: formData.duration,
        category: parseInt(formData.category),
        city_ids: formData.city_ids,
        includes: formData.includes || undefined,
        excludes: formData.excludes || undefined,
        tags: formData.tags,
        response_time: formData.response_time || undefined,
        cancellation_policy: formData.cancellation_policy || undefined
      }

      let service: ProviderService
      if (editingService) {
        service = await updateService(editingService.id, serviceData)
        toast({
          title: "Service Updated",
          description: "Your service has been updated successfully"
        })
      } else {
        service = await createService(serviceData)
        toast({
          title: "Service Created",
          description: "Your service has been created successfully"
        })
      }

      // Upload images if any
      if (selectedImages.length > 0) {
        for (let i = 0; i < selectedImages.length; i++) {
          await uploadServiceImage(service.id, selectedImages[i], i === 0)
        }
      }

      setIsFormOpen(false)
      setFormData(initialFormData)
      setSelectedImages([])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save service",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle service deletion
  const handleDeleteService = async (serviceId: number) => {
    try {
      await deleteService(serviceId)
      toast({
        title: "Service Deleted",
        description: "Service has been deleted successfully"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service",
        variant: "destructive"
      })
    }
  }

  // Handle status toggle
  const handleToggleStatus = async (serviceId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      await toggleServiceStatus(serviceId, newStatus)
      toast({
        title: "Status Updated",
        description: `Service ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update service status",
        variant: "destructive"
      })
    }
  }

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedImages(prev => [...prev, ...files])
  }

  // Remove selected image
  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading services...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={refreshServices}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Services Management</h1>
          <p className="text-muted-foreground">Manage your services, schedule, and preferences</p>
        </div>
        <Button onClick={handleAddService}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Service
        </Button>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link href="/dashboard/provider/schedule">
          <Card className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Schedule</h3>
                <p className="text-sm text-muted-foreground">Manage availability & timings</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/provider/marketing">
          <Card className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Marketing</h3>
                <p className="text-sm text-muted-foreground">Promote your services</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/provider/settings">
          <Card className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Preferences</h3>
                <p className="text-sm text-muted-foreground">Service settings & options</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Services Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Services</p>
              <p className="text-2xl font-bold">{services.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Services</p>
              <p className="text-2xl font-bold">{services.filter(s => s.status === 'active').length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Rating</p>
              <p className="text-2xl font-bold">
                {services.length > 0 
                  ? (services.reduce((sum, s) => sum + s.average_rating, 0) / services.length).toFixed(1)
                  : '0.0'
                }
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Eye className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold">
                {services.reduce((sum, s) => sum + s.view_count, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services List */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Services</h2>
            <div className="flex gap-2">
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted">
                          {service.image ? (
                            <Image
                              src={service.image}
                              alt={service.title}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{service.title}</div>
                          <div className="text-sm text-muted-foreground">{service.category}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>NPR {service.price}</TableCell>
                    <TableCell>{service.duration}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span>{service.average_rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({service.reviews_count})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span>{service.view_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={service.status === 'active' ? 'default' : 'secondary'}
                        className={service.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {service.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditService(service)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleToggleStatus(service.id, service.status)}
                        >
                          <ToggleLeft className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Service</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{service.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteService(service.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No services found</p>
              <Button onClick={handleAddService} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Service
              </Button>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/provider/schedule">
                <Clock className="h-4 w-4 mr-2" />
                Set Availability
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handleAddService}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Service
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/provider/analytics">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/provider/marketing">
                <Target className="h-4 w-4 mr-2" />
                Promote Services
              </Link>
            </Button>
          </div>
        </Card>
      </div>

      {/* Service Performance Analytics */}
      {servicePerformance && servicePerformance.services.length > 0 && (
        <Card className="mt-6 p-6">
          <h2 className="text-xl font-semibold mb-4">Service Performance Analytics</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Total Bookings</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Total Revenue</TableHead>
                  <TableHead>Avg Booking Value</TableHead>
                  <TableHead>Completion Rate</TableHead>
                  <TableHead>Performance Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicePerformance.services.map((perfService) => {
                  const service = services.find(s => s.id === perfService.id)
                  return (
                    <TableRow key={perfService.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted">
                            {service?.image ? (
                              <Image
                                src={service.image}
                                alt={perfService.title}
                                width={32}
                                height={32}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-3 w-3 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{perfService.title}</div>
                            <div className="text-xs text-muted-foreground">{perfService.category}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{perfService.bookings_count}</span>
                          {perfService.bookings_count > 0 && (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{perfService.completed_bookings}</TableCell>
                      <TableCell>
                        <span className="font-medium">NPR {perfService.total_revenue.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        NPR {perfService.bookings_count > 0 
                          ? (perfService.total_revenue / perfService.bookings_count).toLocaleString()
                          : '0'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${perfService.conversion_rate}%` }}
                            />
                          </div>
                          <span className="text-sm">{perfService.conversion_rate.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                perfService.conversion_rate >= 80 ? 'bg-green-500' :
                                perfService.conversion_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(perfService.conversion_rate, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {perfService.conversion_rate >= 80 ? 'Excellent' :
                             perfService.conversion_rate >= 60 ? 'Good' : 'Needs Improvement'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          
          {servicePerformance.services.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No performance data available yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Performance metrics will appear once you start receiving bookings
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Service Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Edit Service' : 'Add New Service'}
            </DialogTitle>
            <DialogDescription>
              {editingService 
                ? 'Update your service details below'
                : 'Fill in the details to create a new service'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Service Name *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., House Cleaning"
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (NPR) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="1500"
                  />
                </div>
                <div>
                  <Label htmlFor="discount_price">Discount Price</Label>
                  <Input
                    id="discount_price"
                    type="number"
                    value={formData.discount_price}
                    onChange={(e) => handleInputChange('discount_price', e.target.value)}
                    placeholder="1200"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="duration">Duration *</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="e.g., 2 hours"
                />
              </div>

              <div>
                <Label htmlFor="short_description">Short Description</Label>
                <Input
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) => handleInputChange('short_description', e.target.value)}
                  placeholder="Brief description for listings"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Detailed description of your service..."
                  className="h-32"
                />
              </div>

              <div>
                <Label>Service Areas</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                  {cities.map((city) => (
                    <div key={city.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`city-${city.id}`}
                        checked={formData.city_ids.includes(city.id)}
                        onCheckedChange={() => handleCityToggle(city.id)}
                      />
                      <Label htmlFor={`city-${city.id}`} className="text-sm">
                        {city.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags.join(', ')}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="cleaning, home, professional"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <Label htmlFor="includes">What's Included</Label>
              <Textarea
                id="includes"
                value={formData.includes}
                onChange={(e) => handleInputChange('includes', e.target.value)}
                placeholder="List what's included in your service..."
                className="h-24"
              />
            </div>

            <div>
              <Label htmlFor="excludes">What's Not Included</Label>
              <Textarea
                id="excludes"
                value={formData.excludes}
                onChange={(e) => handleInputChange('excludes', e.target.value)}
                placeholder="List what's not included..."
                className="h-24"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <Label htmlFor="response_time">Response Time</Label>
              <Input
                id="response_time"
                value={formData.response_time}
                onChange={(e) => handleInputChange('response_time', e.target.value)}
                placeholder="e.g., Within 2 hours"
              />
            </div>

            <div>
              <Label htmlFor="cancellation_policy">Cancellation Policy</Label>
              <Input
                id="cancellation_policy"
                value={formData.cancellation_policy}
                onChange={(e) => handleInputChange('cancellation_policy', e.target.value)}
                placeholder="e.g., Free cancellation up to 24h"
              />
            </div>
          </div>

          <div className="mt-4">
            <Label>Service Images</Label>
            <div className="border-2 border-dashed rounded-lg p-4">
              <div className="text-center">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag & drop images here or click to upload
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <Button variant="outline" asChild>
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Images
                  </label>
                </Button>
              </div>
              
              {selectedImages.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Selected Images:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedImages.map((file, index) => (
                      <div key={index} className="relative">
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => removeSelectedImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <p className="text-xs mt-1 truncate w-16">{file.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitForm} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingService ? 'Update Service' : 'Create Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 