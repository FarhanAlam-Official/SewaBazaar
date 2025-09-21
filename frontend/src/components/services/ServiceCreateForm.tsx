"use client"

import { useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Loader2
} from "lucide-react"

import { useProviderServices } from "@/hooks/useProviderServices"
import type { CreateServiceData, ServiceCategory, City } from "@/types/provider"

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

  const {
    categories,
    cities,
    creating,
    createService,
    refreshCategories,
    refreshCities
  } = useProviderServices({
    autoRefresh: false
  })

  // Ensure categories and cities are always arrays
  const safeCategories = Array.isArray(categories) ? categories : []
  const safeCities = Array.isArray(cities) ? cities : []

  // Load categories and cities on mount
  useEffect(() => {
    if (isOpen) {
      refreshCategories()
      refreshCities()
    }
  }, [isOpen, refreshCategories, refreshCities])

  const steps = [
    { id: 1, title: "Basic Information", description: "Service title and description" },
    { id: 2, title: "Pricing & Duration", description: "Set your rates and timing" },
    { id: 3, title: "Location & Category", description: "Where and what type of service" },
    { id: 4, title: "Details & Policies", description: "Additional information and policies" },
    { id: 5, title: "Review & Create", description: "Review and publish your service" }
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
      onSuccess?.(newService)
      setFormData(initialFormData)
      setCurrentStep(1)
      setErrors({})
    } catch (error) {
      console.error("Error creating service:", error)
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Create New Service</h2>
            <p className="text-muted-foreground">Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep > step.id 
                    ? 'bg-green-500 text-white' 
                    : currentStep === step.id 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <Label htmlFor="title" className="text-base font-medium">
                    Service Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Professional House Cleaning"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="short_description" className="text-base font-medium">
                    Short Description *
                  </Label>
                  <Input
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => handleInputChange('short_description', e.target.value)}
                    placeholder="Brief description for service cards"
                    className={errors.short_description ? 'border-red-500' : ''}
                  />
                  {errors.short_description && (
                    <p className="text-sm text-red-500 mt-1">{errors.short_description}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description" className="text-base font-medium">
                    Detailed Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Provide a detailed description of your service..."
                    rows={6}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="price" className="text-base font-medium">
                      Price (NPR) *
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="0"
                        className={`pl-10 ${errors.price ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.price && (
                      <p className="text-sm text-red-500 mt-1">{errors.price}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="discount_price" className="text-base font-medium">
                      Discount Price (NPR)
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="discount_price"
                        type="number"
                        value={formData.discount_price}
                        onChange={(e) => handleInputChange('discount_price', e.target.value)}
                        placeholder="0"
                        className={`pl-10 ${errors.discount_price ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.discount_price && (
                      <p className="text-sm text-red-500 mt-1">{errors.discount_price}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="duration" className="text-base font-medium">
                    Service Duration *
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      placeholder="e.g., 2 hours, 1 day, 30 minutes"
                      className={`pl-10 ${errors.duration ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.duration && (
                    <p className="text-sm text-red-500 mt-1">{errors.duration}</p>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <Label htmlFor="category" className="text-base font-medium">
                    Service Category *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {safeCategories.length > 0 ? (
                        safeCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.title}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-500 mt-1">{errors.category}</p>
                  )}
                </div>

                <div>
                  <Label className="text-base font-medium">
                    Service Areas (Cities) *
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {safeCities.length > 0 ? (
                      safeCities.map((city) => (
                        <div key={city.id} className="flex items-center space-x-2">
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
                          />
                          <Label htmlFor={`city-${city.id}`} className="text-sm">
                            {city.name}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center text-muted-foreground py-4">
                        Loading cities...
                      </div>
                    )}
                  </div>
                  {errors.city_ids && (
                    <p className="text-sm text-red-500 mt-1">{errors.city_ids}</p>
                  )}
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

            {currentStep === 5 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Service Summary</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Title</h4>
                      <p className="text-muted-foreground">{formData.title}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">Description</h4>
                      <p className="text-muted-foreground">{formData.short_description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium">Price</h4>
                        <p className="text-muted-foreground">
                          NPR {formData.price}
                          {formData.discount_price && (
                            <span className="text-green-600 ml-2">
                              (Discounted: NPR {formData.discount_price})
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium">Duration</h4>
                        <p className="text-muted-foreground">{formData.duration}</p>
                      </div>
                    </div>
                    
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
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            {currentStep < steps.length ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={creating}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
    </motion.div>
  )
}
