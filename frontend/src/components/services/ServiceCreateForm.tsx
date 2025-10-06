"use client"

import { useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { showToast } from "@/components/ui/enhanced-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

import {
  Plus,
  X,
  Upload,
  Image as ImageIcon,
  MapPin,
  Clock,
  DollarSign,
  Tag,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw
} from "lucide-react"

import { useProviderServices } from "@/hooks/useProviderServices"
import type { CreateServiceData, ServiceCategory, City } from "@/types/provider"
import ServiceImageManager, { ServiceImageManagerRef } from "./ServiceImageManager"
import { useRef } from "react"

interface ServiceCreateFormProps {
  onSuccess?: (service: any) => void
  onCancel?: () => void
  isOpen: boolean
}

interface FormData {
  title: string
  description: string
  short_description: string
  price: string
  discount_price: string
  duration: string
  category: string
  city_ids: string[]
  includes: string
  excludes: string
  tags: string[]
  response_time: string
  cancellation_policy: string
}

const initialFormData: FormData = {
  title: "",
  description: "",
  short_description: "",
  price: "",
  discount_price: "",
  duration: "",
  category: "",
  city_ids: [],
  includes: "",
  excludes: "",
  tags: [],
  response_time: "",
  cancellation_policy: ""
}

export default function ServiceCreateForm({ 
  onSuccess, 
  onCancel, 
  isOpen 
}: ServiceCreateFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tagInput, setTagInput] = useState("")
  const [includeInput, setIncludeInput] = useState("")
  const [excludeInput, setExcludeInput] = useState("")
  const [loadingData, setLoadingData] = useState(false)
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false)
  const [newCategoryData, setNewCategoryData] = useState({
    title: "",
    description: "",
    icon: ""
  })
  const imageManagerRef = useRef<ServiceImageManagerRef>(null)

  const {
    categories,
    cities,
    creating,
    createService,
    createServiceCategory,
    refreshCategories,
    refreshCities
  } = useProviderServices({
    autoRefresh: false
  })

  // Ensure categories and cities are always arrays
  const safeCategories = Array.isArray(categories) ? categories : []
  const safeCities = Array.isArray(cities) ? cities : []

  // Function to load categories and cities
  const loadData = useCallback(async () => {
    setLoadingData(true)
    try {
      await Promise.all([
        refreshCategories(),
        refreshCities()
      ])
    } catch (error) {
      showToast.error({
        title: 'Loading Error',
        description: 'Failed to load categories and cities. Please try again.',
        duration: 5000
      })
    } finally {
      setLoadingData(false)
    }
  }, [refreshCategories, refreshCities])

  // Load categories and cities on mount
  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, loadData])

  const steps = [
    { id: 1, title: "Basic Information", description: "Service title and description" },
    { id: 2, title: "Pricing & Duration", description: "Set your rates and timing" },
    { id: 3, title: "Location & Category", description: "Where and what type of service" },
    { id: 4, title: "Details & Policies", description: "Additional information and policies" },
    { id: 5, title: "Images", description: "Add service images" },
    { id: 6, title: "Review & Create", description: "Review and publish your service" }
  ]

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.title.trim()) newErrors.title = "Service title is required"
        if (!formData.description.trim()) newErrors.description = "Service description is required"
        if (!formData.short_description.trim()) newErrors.short_description = "Short description is required"
        break
      case 2:
        if (!formData.price.trim()) newErrors.price = "Price is required"
        if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
          newErrors.price = "Price must be a positive number"
        }
        if (formData.discount_price && (isNaN(Number(formData.discount_price)) || Number(formData.discount_price) <= 0)) {
          newErrors.discount_price = "Discount price must be a positive number"
        }
        if (!formData.duration.trim()) newErrors.duration = "Duration is required"
        break
      case 3:
        if (!formData.category) newErrors.category = "Category is required"
        if (formData.city_ids.length === 0) newErrors.city_ids = "At least one city is required"
        break
      case 4:
        if (!formData.response_time.trim()) newErrors.response_time = "Response time is required"
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
    }
  }, [currentStep, validateStep, steps.length])

  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }, [])

  const handleInputChange = useCallback((field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }, [errors])

  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput("")
    }
  }, [tagInput, formData.tags])

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }, [])

  const handleAddInclude = useCallback(() => {
    if (includeInput.trim()) {
      setFormData(prev => ({
        ...prev,
        includes: prev.includes ? `${prev.includes}\n• ${includeInput.trim()}` : `• ${includeInput.trim()}`
      }))
      setIncludeInput("")
    }
  }, [includeInput])

  const handleAddExclude = useCallback(() => {
    if (excludeInput.trim()) {
      setFormData(prev => ({
        ...prev,
        excludes: prev.excludes ? `${prev.excludes}\n• ${excludeInput.trim()}` : `• ${excludeInput.trim()}`
      }))
      setExcludeInput("")
    }
  }, [excludeInput])

  const handleCreateCategory = useCallback(async () => {
    if (!newCategoryData.title.trim()) {
      showToast.error({
        title: 'Validation Error',
        description: 'Category title is required',
        duration: 3000
      })
      return
    }

    try {
      const newCategory = await createServiceCategory({
        title: newCategoryData.title.trim(),
        description: newCategoryData.description.trim() || undefined,
        icon: newCategoryData.icon.trim() || undefined
      })
      
      // Set the newly created category as selected
      setFormData(prev => ({ ...prev, category: newCategory.id.toString() }))
      
      // Reset form and close dialog
      setNewCategoryData({ title: "", description: "", icon: "" })
      setShowNewCategoryDialog(false)
    } catch (error) {
      showToast.error({
        title: 'Category Creation Failed',
        description: 'Failed to create category. Please try again.',
        duration: 2500
      })
    }
  }, [newCategoryData, createServiceCategory])

  const handleCancelNewCategory = useCallback(() => {
    setNewCategoryData({ title: "", description: "", icon: "" })
    setShowNewCategoryDialog(false)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!validateStep(currentStep)) return

    try {
      const serviceData: CreateServiceData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        short_description: formData.short_description.trim(),
        price: Number(formData.price),
        discount_price: formData.discount_price ? Number(formData.discount_price) : undefined,
        duration: formData.duration.trim(),
        category: Number(formData.category),
        city_ids: formData.city_ids.map(id => Number(id)),
        includes: formData.includes.trim() || undefined,
        excludes: formData.excludes.trim() || undefined,
        tags: formData.tags,
        response_time: formData.response_time.trim(),
        cancellation_policy: formData.cancellation_policy.trim() || undefined
      }

      const newService = await createService(serviceData)
      
      // Upload any temporary images after service creation
      if (imageManagerRef.current) {
        try {
          // Update the service ID in the image manager before uploading
          if (imageManagerRef.current.setServiceId) {
            imageManagerRef.current.setServiceId(newService.id)
          }
          
          // Check if there are temporary images to upload
          const tempImagesCount = imageManagerRef.current.getTemporaryImagesCount?.() || 0
          
          if (tempImagesCount > 0) {
            await imageManagerRef.current.uploadTemporaryImages(newService.id)
          }
        } catch (error) {
          showToast.error({
            title: "Image Upload Failed",
            description: "Service created but some images failed to upload. You can add them later.",
            duration: 5000
          })
        }
      }
      
      onSuccess?.(newService)
      setFormData(initialFormData)
      setCurrentStep(1)
      setErrors({})
    } catch (error) {
      showToast.error({
        title: 'Service Creation Failed',
        description: 'Failed to create service. Please try again.',
        duration: 2500
      })
    }
  }, [formData, currentStep, validateStep, createService, onSuccess])

  const handleCancel = useCallback(() => {
    setFormData(initialFormData)
    setCurrentStep(1)
    setErrors({})
    onCancel?.()
  }, [onCancel])

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleCancel}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground">Create New Service</h2>
            <p className="text-sm text-muted-foreground">
              Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCancel}
            className="h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-5 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center min-w-0">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all duration-200 ${
                  currentStep > step.id 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : currentStep === step.id 
                    ? 'bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/20' 
                    : 'bg-muted text-muted-foreground border border-border'
                }`}>
                  {currentStep > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
                </div>
                <div className="ml-3 hidden lg:block min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 lg:w-16 h-0.5 mx-3 lg:mx-4 transition-colors duration-200 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 px-8 py-8">
            <div className="max-w-5xl mx-auto">
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Basic Information</h3>
                    <p className="text-muted-foreground">Let's start with the essential details about your service</p>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-medium text-foreground">
                          Service Title *
                        </Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder="e.g., Professional House Cleaning"
                          className={`h-11 transition-all duration-200 ${
                            errors.title 
                              ? 'border-destructive focus:border-destructive focus:ring-destructive/20' 
                              : 'hover:border-ring/50 focus:border-primary focus:ring-primary/20'
                          }`}
                        />
                        {errors.title && (
                          <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.title}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="short_description" className="text-sm font-medium text-foreground">
                          Short Description *
                        </Label>
                        <Input
                          id="short_description"
                          value={formData.short_description}
                          onChange={(e) => handleInputChange('short_description', e.target.value)}
                          placeholder="Brief description for service cards (max 100 characters)"
                          className={`h-11 transition-all duration-200 ${
                            errors.short_description 
                              ? 'border-destructive focus:border-destructive focus:ring-destructive/20' 
                              : 'hover:border-ring/50 focus:border-primary focus:ring-primary/20'
                          }`}
                        />
                        <div className="flex justify-between items-center">
                          {errors.short_description ? (
                            <p className="text-sm text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.short_description}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              This appears on service cards and search results
                            </p>
                          )}
                          <span className={`text-xs ${
                            formData.short_description.length > 100 ? 'text-destructive' : 'text-muted-foreground'
                          }`}>
                            {formData.short_description.length}/100
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium text-foreground">
                        Detailed Description *
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Provide a comprehensive description of your service, what's included, your experience, and what makes you unique..."
                        rows={12}
                        className={`resize-none transition-all duration-200 ${
                          errors.description 
                            ? 'border-destructive focus:border-destructive focus:ring-destructive/20' 
                            : 'hover:border-ring/50 focus:border-primary focus:ring-primary/20'
                        }`}
                      />
                      <div className="flex justify-between items-start">
                        {errors.description ? (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.description}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Detailed descriptions help customers understand your service better
                          </p>
                        )}
                        <span className={`text-xs ${
                          formData.description.length > 1000 ? 'text-amber-500' : 'text-muted-foreground'
                        }`}>
                          {formData.description.length} characters
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Pricing & Duration</h3>
                    <p className="text-muted-foreground">Set competitive rates and realistic timeframes</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium text-foreground">
                        Price (NPR) *
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="price"
                          type="number"
                          value={formData.price}
                          onChange={(e) => handleInputChange('price', e.target.value)}
                          placeholder="1000"
                          className={`pl-10 h-11 transition-all duration-200 ${
                            errors.price 
                              ? 'border-destructive focus:border-destructive focus:ring-destructive/20' 
                              : 'hover:border-ring/50 focus:border-primary focus:ring-primary/20'
                          }`}
                        />
                      </div>
                      {errors.price ? (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.price}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Set a competitive price for your service
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discount_price" className="text-sm font-medium text-foreground">
                        Discount Price (NPR)
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="discount_price"
                          type="number"
                          value={formData.discount_price}
                          onChange={(e) => handleInputChange('discount_price', e.target.value)}
                          placeholder="800"
                          className={`pl-10 h-11 transition-all duration-200 ${
                            errors.discount_price 
                              ? 'border-destructive focus:border-destructive focus:ring-destructive/20' 
                              : 'hover:border-ring/50 focus:border-primary focus:ring-primary/20'
                          }`}
                        />
                      </div>
                      {errors.discount_price ? (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.discount_price}
                        </p>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Optional promotional price
                          </p>
                          {formData.price && formData.discount_price && Number(formData.discount_price) < Number(formData.price) && (
                            <span className="text-xs text-green-600 font-medium">
                              Give {Math.round((Number(formData.discount_price) / Number(formData.price)) * 100)}% off
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-sm font-medium text-foreground">
                        Service Duration *
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="duration"
                          value={formData.duration}
                          onChange={(e) => handleInputChange('duration', e.target.value)}
                          placeholder="e.g., 2 hours, 1 day, 30 minutes"
                          className={`pl-10 h-11 transition-all duration-200 ${
                            errors.duration 
                              ? 'border-destructive focus:border-destructive focus:ring-destructive/20' 
                              : 'hover:border-ring/50 focus:border-primary focus:ring-primary/20'
                          }`}
                        />
                      </div>
                      {errors.duration ? (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.duration}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          How long does it typically take to complete this service?
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Location & Category</h3>
                    <p className="text-muted-foreground">Choose your service category and coverage areas</p>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label htmlFor="category" className="text-sm font-medium text-foreground">
                        Service Category *
                      </Label>
                      <SearchableSelect
                        options={safeCategories.map(category => ({
                          value: category.id.toString(),
                          label: category.title,
                          description: category.description
                        }))}
                        value={formData.category}
                        onValueChange={(value) => handleInputChange('category', value)}
                        placeholder="Search and select a category..."
                        searchPlaceholder="Search categories..."
                        emptyMessage="No categories found."
                        loading={loadingData}
                        onAddNew={() => setShowNewCategoryDialog(true)}
                        addNewLabel="Create new category"
                        className={errors.category ? 'border-destructive' : ''}
                      />
                      {errors.category ? (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.category}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Select the category that best describes your service
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-foreground">
                        Service Areas (Cities) *
                      </Label>
                      <div className="border border-border rounded-lg p-4 bg-muted/20 min-h-[200px]">
                        {safeCities.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {safeCities.map((city) => (
                              <div 
                                key={city.id} 
                                className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                              >
                                <Checkbox
                                  id={`city-${city.id}`}
                                  checked={formData.city_ids.includes(city.id.toString())}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleInputChange('city_ids', [...formData.city_ids, city.id.toString()])
                                    } else {
                                      handleInputChange('city_ids', formData.city_ids.filter(id => id !== city.id.toString()))
                                    }
                                  }}
                                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <Label 
                                  htmlFor={`city-${city.id}`} 
                                  className="text-sm font-medium cursor-pointer flex items-center gap-2"
                                >
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  {city.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground py-8">
                            <div className="space-y-3">
                              <MapPin className="h-8 w-8 mx-auto text-muted-foreground/50" />
                              <p className="text-sm">
                                {loadingData ? 'Loading cities...' : 'No cities available'}
                              </p>
                              {!loadingData && (
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={loadData}
                                  className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Retry Loading
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {errors.city_ids ? (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.city_ids}
                        </p>
                      ) : (
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-muted-foreground">
                            Select all cities where you provide this service
                          </p>
                          {formData.city_ids.length > 0 && (
                            <span className="text-xs text-primary font-medium">
                              {formData.city_ids.length} {formData.city_ids.length === 1 ? 'city' : 'cities'} selected
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <Label htmlFor="response_time" className="text-base font-medium">
                      Response Time *
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="response_time"
                        value={formData.response_time}
                        onChange={(e) => handleInputChange('response_time', e.target.value)}
                        placeholder="e.g., Within 2 hours, Same day"
                        className={`pl-10 ${errors.response_time ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.response_time && (
                      <p className="text-sm text-red-500 mt-1">{errors.response_time}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="cancellation_policy" className="text-base font-medium">
                      Cancellation Policy
                    </Label>
                    <Textarea
                      id="cancellation_policy"
                      value={formData.cancellation_policy}
                      onChange={(e) => handleInputChange('cancellation_policy', e.target.value)}
                      placeholder="Describe your cancellation policy..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label className="text-base font-medium">Service Includes</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={includeInput}
                          onChange={(e) => setIncludeInput(e.target.value)}
                          placeholder="Add what's included..."
                          onKeyPress={(e) => e.key === 'Enter' && handleAddInclude()}
                        />
                        <Button type="button" onClick={handleAddInclude} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {formData.includes && (
                        <div className="p-3 bg-gray-50 rounded-md">
                          <pre className="text-sm whitespace-pre-wrap">{formData.includes}</pre>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Service Excludes</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={excludeInput}
                          onChange={(e) => setExcludeInput(e.target.value)}
                          placeholder="Add what's not included..."
                          onKeyPress={(e) => e.key === 'Enter' && handleAddExclude()}
                        />
                        <Button type="button" onClick={handleAddExclude} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {formData.excludes && (
                        <div className="p-3 bg-gray-50 rounded-md">
                          <pre className="text-sm whitespace-pre-wrap">{formData.excludes}</pre>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Tags</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="Add tags..."
                          onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        />
                        <Button type="button" onClick={handleAddTag} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {tag}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-transparent"
                                onClick={() => handleRemoveTag(tag)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Always render ServiceImageManager to preserve temporary images state */}
              <div className={currentStep === 5 ? 'block' : 'hidden'}>
                {currentStep === 5 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                  >
                    <div className="text-center mb-8">
                      <h3 className="text-xl font-semibold text-foreground mb-2">Service Images</h3>
                      <p className="text-muted-foreground">Add images to showcase your service (optional)</p>
                    </div>
                  </motion.div>
                )}
                
                <ServiceImageManager
                  ref={imageManagerRef}
                  serviceId={null} // No service ID yet, will be created first
                  images={[]} // Start with empty images
                  onImagesUpdate={(images) => {
                  }}
                  maxImages={10}
                />
              </div>

              {currentStep === 6 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Review Your Service</CardTitle>
                      <p className="text-muted-foreground">Please review all details before creating your service</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-medium text-lg mb-2">Service Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium">Title</h4>
                            <p className="text-muted-foreground">{formData.title}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium">Price</h4>
                            <p className="text-muted-foreground">NPR {formData.price}</p>
                            {formData.discount_price && (
                              <p className="text-sm text-green-600">Discount: NPR {formData.discount_price}</p>
                            )}
                          </div>
                          
                          <div>
                            <h4 className="font-medium">Duration</h4>
                            <p className="text-muted-foreground">{formData.duration}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium">Response Time</h4>
                            <p className="text-muted-foreground">{formData.response_time}</p>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="font-medium text-lg mb-2">Description</h3>
                        <div className="space-y-2">
                          <div>
                            <h4 className="font-medium">Short Description</h4>
                            <p className="text-muted-foreground">{formData.short_description}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium">Full Description</h4>
                            <p className="text-muted-foreground whitespace-pre-wrap">{formData.description}</p>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="font-medium text-lg mb-2">Category & Location</h3>
                        <div className="space-y-2">
                          <div>
                            <h4 className="font-medium">Category</h4>
                            <p className="text-muted-foreground">
                              {safeCategories.length > 0 ? 
                                safeCategories.find(c => c.id.toString() === formData.category)?.title || 'Unknown Category' 
                                : 'Loading...'
                              }
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium">Service Areas</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {formData.city_ids.map(cityId => {
                                const city = safeCities.find(c => c.id.toString() === cityId)
                                return city ? (
                                  <Badge key={cityId} variant="outline">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {city.name}
                                  </Badge>
                                ) : null
                              })}
                            </div>
                          </div>
                          
                          {formData.tags.length > 0 && (
                            <div>
                              <h4 className="font-medium">Tags</h4>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {formData.tags.map((tag, index) => (
                                  <Badge key={index} variant="secondary">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <h4 className="font-medium">Images</h4>
                            <p className="text-muted-foreground">
                              {imageManagerRef.current?.getTemporaryImagesCount() || 0} image(s) ready for upload
                            </p>
                            {(imageManagerRef.current?.getTemporaryImagesCount() || 0) > 0 && (
                              <p className="text-xs text-orange-600 mt-1">
                                Images will be uploaded after service creation
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
            >
              Cancel
            </Button>
            {currentStep < steps.length ? (
              <Button 
                onClick={handleNext}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200"
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={creating}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Create Service
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* New Category Dialog */}
      {showNewCategoryDialog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={handleCancelNewCategory}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border bg-muted/30">
              <h3 className="text-lg font-semibold text-foreground">Create New Category</h3>
              <p className="text-sm text-muted-foreground mt-1">Add a new service category</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-category-title" className="text-sm font-medium text-foreground">
                    Category Title *
                  </Label>
                  <Input
                    id="new-category-title"
                    value={newCategoryData.title}
                    onChange={(e) => setNewCategoryData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Custom Carpentry"
                    className="h-11 transition-all duration-200 hover:border-ring/50 focus:border-primary focus:ring-primary/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-category-description" className="text-sm font-medium text-foreground">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="new-category-description"
                    value={newCategoryData.description}
                    onChange={(e) => setNewCategoryData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the category"
                    rows={3}
                    className="resize-none transition-all duration-200 hover:border-ring/50 focus:border-primary focus:ring-primary/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-category-icon" className="text-sm font-medium text-foreground">
                    Icon (Optional)
                  </Label>
                  <Input
                    id="new-category-icon"
                    value={newCategoryData.icon}
                    onChange={(e) => setNewCategoryData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="e.g., hammer, brush, tool"
                    className="h-11 transition-all duration-200 hover:border-ring/50 focus:border-primary focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/20">
              <Button 
                variant="outline" 
                onClick={handleCancelNewCategory}
                className="hover:bg-muted hover:text-foreground transition-colors"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCategory}
                disabled={creating || !newCategoryData.title.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Create Category
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
