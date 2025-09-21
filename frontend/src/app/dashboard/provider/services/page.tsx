"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { showToast } from "@/components/ui/enhanced-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

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
import type { ProviderService } from "@/types/provider"
import ServiceCreateForm from "@/components/services/ServiceCreateForm"
import ServiceEditForm from "@/components/services/ServiceEditForm"
import ServiceViewDialog from "@/components/services/ServiceViewDialog"
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

// Service Card Component
const ServiceCard = ({ 
  service, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onView,
  onDuplicate 
}: {
  service: ProviderService
  onEdit: (service: ProviderService) => void
  onDelete: (service: ProviderService) => void
  onToggleStatus: (service: ProviderService) => void
  onView: (service: ProviderService) => void
  onDuplicate: (service: ProviderService) => void
}) => {
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
      case 'active': return <CheckCircle className="h-3 w-3" />
      case 'inactive': return <XCircle className="h-3 w-3" />
      case 'pending': return <Clock className="h-3 w-3" />
      case 'draft': return <Edit className="h-3 w-3" />
      default: return <AlertTriangle className="h-3 w-3" />
    }
  }

  return (
    <motion.div
      variants={cardVariants}
      className="group relative"
    >
      <Card className="h-full hover:shadow-lg transition-all duration-200 border-l-4 border-l-transparent hover:border-l-blue-500">
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
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                {service.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {service.short_description || service.description}
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(service)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(service)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Service
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(service)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onToggleStatus(service)}
                  className={service.status === 'active' ? 'text-orange-600' : 'text-green-600'}
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
                <DropdownMenuItem 
                  onClick={() => onDelete(service)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Service Image */}
            {service.image && (
              <div className="relative h-32 w-full rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            
            {/* Service Stats */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-medium">${service.price}</span>
                {service.discount_price && (
                  <span className="text-xs text-muted-foreground line-through">
                    ${service.discount_price}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>{service.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>{safeToFixed(service.average_rating, 1)}</span>
                <span className="text-muted-foreground">({service.reviews_count || 0})</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-purple-600" />
                <span>{service.inquiry_count || 0} inquiries</span>
              </div>
            </div>
            
            {/* Service Category & Cities */}
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">
                {service.category}
              </Badge>
              {safeArraySlice(service.cities, 0, 2).map((city, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {city.name}
                </Badge>
              ))}
              {safeArrayLength(service.cities) > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{safeArrayLength(service.cities) - 2} more
                </Badge>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => onView(service)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => onEdit(service)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        </CardContent>
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
  onDuplicate 
}: {
  services: ProviderService[]
  onEdit: (service: ProviderService) => void
  onDelete: (service: ProviderService) => void
  onToggleStatus: (service: ProviderService) => void
  onView: (service: ProviderService) => void
  onDuplicate: (service: ProviderService) => void
}) => {
  return (
    <div className="space-y-3">
      {services.map((service) => (
        <motion.div
          key={service.id}
          variants={cardVariants}
          className="group"
        >
          <Card className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Service Image */}
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {service.image ? (
                      <Image
                        src={service.image}
                        alt={service.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Service Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{service.title}</h3>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          service.status === 'active' 
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : service.status === 'inactive'
                            ? 'bg-gray-100 text-gray-800 border-gray-200'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}
                      >
                        {service.status}
                      </Badge>
                      {service.is_featured && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {service.short_description || service.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${service.price}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {service.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {safeToFixed(service.average_rating, 1)} ({service.reviews_count || 0})
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {service.inquiry_count || 0} inquiries
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onView(service)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onEdit(service)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onDuplicate(service)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onToggleStatus(service)}
                        className={service.status === 'active' ? 'text-orange-600' : 'text-green-600'}
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
                      <DropdownMenuItem 
                        onClick={() => onDelete(service)}
                        className="text-red-600"
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
  const [serviceToDelete, setServiceToDelete] = useState<ProviderService | null>(null)
  const [serviceToEdit, setServiceToEdit] = useState<ProviderService | null>(null)
  const [serviceToView, setServiceToView] = useState<ProviderService | null>(null)

  // Use provider services hook
  const {
    services,
    categories,
    loading,
    deleting,
    refreshServices,
    deleteService,
    toggleServiceStatus,
    getServicesByStatus,
    getActiveServicesCount
  } = useProviderServices({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000
  })

  // Ensure categories is always an array
  const safeCategories = Array.isArray(categories) ? categories : []

  // Filter and sort services
  const filteredServices = useCallback(() => {
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

  const handleDuplicateService = useCallback((service: ProviderService) => {
    // TODO: Implement service duplication
    showToast.info({
      title: "Duplicate Service",
      description: `Duplicating ${service.title} - Coming soon!`,
      duration: 3000
    })
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
      setSelectedServices(filteredServices().map(service => service.id))
    } else {
      setSelectedServices([])
    }
  }, [filteredServices])

  const handleBulkAction = useCallback(async (action: string) => {
    if (selectedServices.length === 0) return

    try {
      switch (action) {
        case 'activate':
          await Promise.all(
            selectedServices.map(id => 
              toggleServiceStatus(id, 'active')
            )
          )
          break
        case 'deactivate':
          await Promise.all(
            selectedServices.map(id => 
              toggleServiceStatus(id, 'inactive')
            )
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
  }, [selectedServices, toggleServiceStatus])

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
      className="p-4 md:p-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Services Management</h1>
          <p className="text-muted-foreground">Manage your service offerings</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshServices}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleCreateService}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Service
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Services</p>
                <p className="text-2xl font-bold">{totalServices}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Services</p>
                <p className="text-2xl font-bold text-green-600">{activeServices}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingServices}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Draft Services</p>
                <p className="text-2xl font-bold text-gray-600">{draftServices}</p>
              </div>
              <Edit className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {safeCategories
                    .filter(category => category.title && category.title.trim() !== '')
                    .map((category) => (
                      <SelectItem key={category.id} value={category.title}>
                        {category.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="bookings">Bookings</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
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
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedServices.length === filteredServices().length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">
                  {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('activate')}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('deactivate')}
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Deactivate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedServices([])}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services List */}
      {filteredServices().length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || statusFilter !== "all" || categoryFilter !== "all" 
                ? "No services match your filters" 
                : "No services yet"
              }
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Create your first service to get started"
              }
            </p>
            {!searchQuery && statusFilter === "all" && categoryFilter === "all" && (
              <Button onClick={handleCreateService}>
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
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-3"
          }
        >
          <AnimatePresence>
            {filteredServices().map((service) => (
              viewMode === "grid" ? (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onEdit={handleEditService}
                  onDelete={handleDeleteService}
                  onToggleStatus={handleToggleStatus}
                  onView={handleViewService}
                  onDuplicate={handleDuplicateService}
                />
              ) : (
                <ServiceList
                  key={service.id}
                  services={[service]}
                  onEdit={handleEditService}
                  onDelete={handleDeleteService}
                  onToggleStatus={handleToggleStatus}
                  onView={handleViewService}
                  onDuplicate={handleDuplicateService}
                />
              )
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{serviceToDelete?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
    </motion.div>
  )
}