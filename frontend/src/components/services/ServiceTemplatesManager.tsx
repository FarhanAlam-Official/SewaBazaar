"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { showToast } from "@/components/ui/enhanced-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

import {
  Copy,
  Plus,
  Edit,
  Trash2,
  Star,
  Eye,
  Save,
  Download,
  Upload,
  FileText,
  Image as ImageIcon,
  Tag,
  MapPin,
  Clock,
  DollarSign,
  Users,
  BarChart3,
  Settings,
  X
} from "lucide-react"

import { safeToFixed, safeFormatCurrency } from "@/utils/safeUtils"
import type { ProviderService, ServiceCategory, City } from "@/types/provider"

interface ServiceTemplate {
  id: string
  name: string
  description: string
  category: string
  base_service?: ProviderService
  template_data: {
    title_template: string
    description_template: string
    price_range: { min: number; max: number }
    duration_template: string
    includes_template: string[]
    excludes_template: string[]
    tags_template: string[]
    response_time_template: string
    cancellation_policy_template: string
  }
  usage_count: number
  created_at: string
  is_public: boolean
  created_by: string
}

interface ServiceTemplatesManagerProps {
  services: ProviderService[]
  categories: ServiceCategory[]
  cities: City[]
  onServiceCreate: (serviceData: any) => Promise<ProviderService>
  onTemplateSave?: (template: ServiceTemplate) => void
}

const DEFAULT_TEMPLATES: ServiceTemplate[] = [
  {
    id: "cleaning-template",
    name: "Cleaning Service Template",
    description: "Template for various cleaning services",
    category: "Cleaning",
    template_data: {
      title_template: "{service_type} Cleaning Service",
      description_template: "Professional {service_type} cleaning service with experienced staff and quality equipment.",
      price_range: { min: 2000, max: 5000 },
      duration_template: "2-4 hours",
      includes_template: [
        "Professional cleaning equipment",
        "Eco-friendly cleaning products",
        "Experienced cleaning staff",
        "Quality assurance guarantee"
      ],
      excludes_template: [
        "Deep carpet cleaning",
        "Window cleaning (exterior)",
        "Appliance cleaning"
      ],
      tags_template: ["cleaning", "professional", "eco-friendly"],
      response_time_template: "Within 2 hours",
      cancellation_policy_template: "Free cancellation up to 24 hours before service"
    },
    usage_count: 15,
    created_at: "2024-01-01",
    is_public: true,
    created_by: "System"
  },
  {
    id: "maintenance-template",
    name: "Maintenance Service Template",
    description: "Template for maintenance and repair services",
    category: "Maintenance",
    template_data: {
      title_template: "{service_type} Maintenance Service",
      description_template: "Expert {service_type} maintenance and repair service with certified technicians.",
      price_range: { min: 1500, max: 8000 },
      duration_template: "1-3 hours",
      includes_template: [
        "Certified technician",
        "Quality replacement parts",
        "Service warranty",
        "Follow-up support"
      ],
      excludes_template: [
        "Major component replacement",
        "Specialized tools not available",
        "Emergency after-hours service"
      ],
      tags_template: ["maintenance", "repair", "certified"],
      response_time_template: "Same day",
      cancellation_policy_template: "Free cancellation up to 12 hours before service"
    },
    usage_count: 8,
    created_at: "2024-01-02",
    is_public: true,
    created_by: "System"
  }
]

export default function ServiceTemplatesManager({
  services,
  categories,
  cities,
  onServiceCreate,
  onTemplateSave
}: ServiceTemplatesManagerProps) {
  const [templates, setTemplates] = useState<ServiceTemplate[]>(DEFAULT_TEMPLATES)
  const [userTemplates, setUserTemplates] = useState<ServiceTemplate[]>([])
  const [activeTab, setActiveTab] = useState("browse")
  const [selectedTemplate, setSelectedTemplate] = useState<ServiceTemplate | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<ServiceTemplate | null>(null)
  const [creating, setCreating] = useState(false)

  const safeCategories = useMemo(() => Array.isArray(categories) ? categories : [], [categories])
  const safeCities = useMemo(() => Array.isArray(cities) ? cities : [], [cities])

  const handleCreateFromTemplate = useCallback(async (template: ServiceTemplate) => {
    setCreating(true)
    try {
      // Create service data from template
      const serviceData = {
        title: template.template_data.title_template.replace("{service_type}", "Professional"),
        description: template.template_data.description_template.replace("{service_type}", "Professional"),
        short_description: `Professional service based on ${template.name}`,
        price: template.template_data.price_range.min,
        duration: template.template_data.duration_template,
        category: safeCategories[0]?.id || 1,
        city_ids: safeCities.slice(0, 3).map((city: City) => city.id),
        includes: template.template_data.includes_template.join("\n• "),
        excludes: template.template_data.excludes_template.join("\n• "),
        tags: template.template_data.tags_template,
        response_time: template.template_data.response_time_template,
        cancellation_policy: template.template_data.cancellation_policy_template
      }

      const newService = await onServiceCreate(serviceData)
      
      // Update template usage count
      setTemplates(prev => prev.map(t => 
        t.id === template.id ? { ...t, usage_count: t.usage_count + 1 } : t
      ))

      showToast.success({
        title: "Service Created",
        description: `Service created successfully from ${template.name}`,
        duration: 3000
      })
    } catch (error) {
      showToast.error({
        title: "Creation Failed",
        description: "Failed to create service from template",
        duration: 3000
      })
    } finally {
      setCreating(false)
    }
  }, [onServiceCreate, safeCategories, safeCities])

  const handleCreateFromService = useCallback((service: ProviderService) => {
    setSelectedTemplate({
      id: `template-${Date.now()}`,
      name: `${service.title} Template`,
      description: `Template created from ${service.title}`,
      category: service.category,
      base_service: service,
      template_data: {
        title_template: service.title,
        description_template: service.description,
        price_range: { min: service.price, max: service.price * 1.5 },
        duration_template: service.duration,
        includes_template: service.includes ? service.includes.split('\n').filter(Boolean) : [],
        excludes_template: service.excludes ? service.excludes.split('\n').filter(Boolean) : [],
        tags_template: service.tags || [],
        response_time_template: service.response_time || "Within 24 hours",
        cancellation_policy_template: service.cancellation_policy || "Standard cancellation policy"
      },
      usage_count: 0,
      created_at: new Date().toISOString(),
      is_public: false,
      created_by: "You"
    })
    setShowCreateDialog(true)
  }, [])

  const handleSaveTemplate = useCallback((template: ServiceTemplate) => {
    setUserTemplates(prev => [...prev, template])
    setShowCreateDialog(false)
    setSelectedTemplate(null)
    
    showToast.success({
      title: "Template Saved",
      description: "Service template has been saved successfully",
      duration: 3000
    })
  }, [])

  const handleDeleteTemplate = useCallback((template: ServiceTemplate) => {
    setTemplateToDelete(template)
    setShowDeleteDialog(true)
  }, [])

  const confirmDeleteTemplate = useCallback(() => {
    if (!templateToDelete) return

    setUserTemplates(prev => prev.filter(t => t.id !== templateToDelete.id))
    setShowDeleteDialog(false)
    setTemplateToDelete(null)
    
    showToast.success({
      title: "Template Deleted",
      description: "Service template has been deleted",
      duration: 3000
    })
  }, [templateToDelete])

  const handleExportTemplate = useCallback((template: ServiceTemplate) => {
    const dataStr = JSON.stringify(template, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${template.name.replace(/\s+/g, '_')}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    showToast.success({
      title: "Template Exported",
      description: "Template has been exported successfully",
      duration: 3000
    })
  }, [])

  const handleImportTemplate = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const template = JSON.parse(e.target?.result as string) as ServiceTemplate
        template.id = `imported-${Date.now()}`
        template.created_at = new Date().toISOString()
        template.created_by = "You"
        template.usage_count = 0
        
        setUserTemplates(prev => [...prev, template])
        
        showToast.success({
          title: "Template Imported",
          description: "Template has been imported successfully",
          duration: 3000
        })
      } catch (error) {
        showToast.error({
          title: "Import Failed",
          description: "Invalid template file format",
          duration: 3000
        })
      }
    }
    reader.readAsText(file)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Service Templates</h2>
          <p className="text-muted-foreground dark:text-gray-400">Create and manage service templates for quick service creation</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            onChange={handleImportTemplate}
            className="hidden"
            id="import-template"
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => document.getElementById('import-template')?.click()}
            className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-md transition-all duration-200"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button 
            size="sm" 
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Templates Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 dark:bg-gray-800">
          <TabsTrigger 
            value="browse" 
            className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
          >
            Browse Templates
          </TabsTrigger>
          <TabsTrigger 
            value="my-templates" 
            className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
          >
            My Templates
          </TabsTrigger>
          <TabsTrigger 
            value="from-services" 
            className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
          >
            Create from Services
          </TabsTrigger>
        </TabsList>

        {/* Browse Templates Tab */}
        <TabsContent value="browse" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.2 }}
                className="group"
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:shadow-xl dark:hover:shadow-blue-500/10">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2 dark:text-white">{template.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 dark:text-gray-400">
                          {template.description}
                        </p>
                      </div>
                      <Badge variant="secondary" className="ml-2 dark:bg-gray-700 dark:text-gray-300">
                        {template.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{template.usage_count} uses</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        <span>{template.is_public ? 'Public' : 'Private'}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="dark:text-gray-300">Price Range:</span>
                        <span className="font-medium dark:text-white">
                          {safeFormatCurrency(template.template_data.price_range.min)} - {safeFormatCurrency(template.template_data.price_range.max)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="dark:text-gray-300">Duration:</span>
                        <span className="font-medium dark:text-white">{template.template_data.duration_template}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="dark:text-gray-300">Response Time:</span>
                        <span className="font-medium dark:text-white">{template.template_data.response_time_template}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:shadow-md"
                        onClick={() => handleCreateFromTemplate(template)}
                        disabled={creating}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        {creating ? "Creating..." : "Use Template"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedTemplate(template)}
                        className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-sm transition-all duration-200"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleExportTemplate(template)}
                        className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-sm transition-all duration-200"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* My Templates Tab */}
        <TabsContent value="my-templates" className="space-y-6 mt-4">
          {userTemplates.length === 0 ? (
            <Card className="p-8 text-center dark:bg-gray-800 dark:border-gray-700">
              <div className="flex flex-col items-center">
                <FileText className="h-16 w-16 text-gray-400 mb-4 dark:text-gray-500" />
                <h3 className="text-lg font-semibold mb-2 dark:text-white">No Custom Templates</h3>
                <p className="text-muted-foreground mb-4 dark:text-gray-400">
                  Create your first custom template to get started
                </p>
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:shadow-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="group"
                >
                  <Card className="h-full hover:shadow-xl transition-all duration-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:shadow-xl dark:hover:shadow-blue-500/10">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2 dark:text-white">{template.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2 dark:text-gray-400">
                            {template.description}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2 dark:border-gray-700 dark:text-gray-300">
                          {template.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{template.usage_count} uses</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          <span>{template.is_public ? 'Public' : 'Private'}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="dark:text-gray-300">Price Range:</span>
                          <span className="font-medium dark:text-white">
                            {safeFormatCurrency(template.template_data.price_range.min)} - {safeFormatCurrency(template.template_data.price_range.max)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="dark:text-gray-300">Duration:</span>
                          <span className="font-medium dark:text-white">{template.template_data.duration_template}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:shadow-md"
                          onClick={() => handleCreateFromTemplate(template)}
                          disabled={creating}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          {creating ? "Creating..." : "Use Template"}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSelectedTemplate(template)}
                          className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-sm transition-all duration-200"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteTemplate(template)}
                          className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-sm transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Create from Services Tab */}
        <TabsContent value="from-services" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.2 }}
                className="group"
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:shadow-xl dark:hover:shadow-blue-500/10">
                  <div className="relative h-32 w-full overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-700">
                    {service.image ? (
                      <Image
                        src={service.image}
                        alt={service.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                        <ImageIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2 dark:text-white">{service.title}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2 dark:text-gray-400">
                      {service.short_description || service.description}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{safeFormatCurrency(service.price)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{service.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        <span>{safeToFixed(service.average_rating, 1)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:shadow-md"
                        onClick={() => handleCreateFromService(service)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Create Template
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-sm transition-all duration-200"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Preview Dialog */}
      {selectedTemplate && (
        <TemplatePreviewDialog
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onUse={() => {
            handleCreateFromTemplate(selectedTemplate)
            setSelectedTemplate(null)
          }}
        />
      )}

      {/* Create Template Dialog */}
      {showCreateDialog && (
        <CreateTemplateDialog
          template={selectedTemplate}
          onSave={handleSaveTemplate}
          onCancel={() => {
            setShowCreateDialog(false)
            setSelectedTemplate(null)
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Delete Template</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTemplate}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}

// Template Preview Dialog Component
interface TemplatePreviewDialogProps {
  template: ServiceTemplate
  onClose: () => void
  onUse: () => void
}

function TemplatePreviewDialog({ template, onClose, onUse }: TemplatePreviewDialogProps) {
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
        transition={{ duration: 0.2 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-gray-800"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold dark:text-white">{template.name}</h3>
              <p className="text-muted-foreground dark:text-gray-400">{template.description}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="dark:text-gray-300 dark:hover:bg-gray-700">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium dark:text-gray-300">Price Range</Label>
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  {safeFormatCurrency(template.template_data.price_range.min)} - {safeFormatCurrency(template.template_data.price_range.max)}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium dark:text-gray-300">Duration</Label>
                <p className="text-sm text-muted-foreground dark:text-gray-400">{template.template_data.duration_template}</p>
              </div>
              <div>
                <Label className="text-sm font-medium dark:text-gray-300">Response Time</Label>
                <p className="text-sm text-muted-foreground dark:text-gray-400">{template.template_data.response_time_template}</p>
              </div>
              <div>
                <Label className="text-sm font-medium dark:text-gray-300">Category</Label>
                <p className="text-sm text-muted-foreground dark:text-gray-400">{template.category}</p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium dark:text-gray-300">Description Template</Label>
              <p className="text-sm text-muted-foreground mt-1 dark:text-gray-400">{template.template_data.description_template}</p>
            </div>

            <div>
              <Label className="text-sm font-medium dark:text-gray-300">Includes</Label>
              <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside dark:text-gray-400">
                {template.template_data.includes_template.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <Label className="text-sm font-medium dark:text-gray-300">Excludes</Label>
              <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside dark:text-gray-400">
                {template.template_data.excludes_template.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <Label className="text-sm font-medium dark:text-gray-300">Tags</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {template.template_data.tags_template.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs dark:bg-gray-700 dark:text-gray-300">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              Close
            </Button>
            <Button 
              onClick={onUse}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:shadow-md"
            >
              <Copy className="h-4 w-4 mr-2" />
              Use Template
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Create Template Dialog Component
interface CreateTemplateDialogProps {
  template?: ServiceTemplate | null
  onSave: (template: ServiceTemplate) => void
  onCancel: () => void
}

function CreateTemplateDialog({ template, onSave, onCancel }: CreateTemplateDialogProps) {
  const [formData, setFormData] = useState({
    name: template?.name || "",
    description: template?.description || "",
    category: template?.category || "",
    is_public: template?.is_public || false
  })

  const handleSave = () => {
    if (!template) return

    const updatedTemplate: ServiceTemplate = {
      ...template,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      is_public: formData.is_public
    }

    onSave(updatedTemplate)
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
        transition={{ duration: 0.2 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-md dark:bg-gray-800"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold dark:text-white">Create Template</h3>
            <Button variant="ghost" size="sm" onClick={onCancel} className="dark:text-gray-300 dark:hover:bg-gray-700">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="dark:text-gray-300">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter template name..."
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
              />
            </div>

            <div>
              <Label htmlFor="description" className="dark:text-gray-300">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter template description..."
                rows={3}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
              />
            </div>

            <div>
              <Label htmlFor="category" className="dark:text-gray-300">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Enter category..."
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: !!checked }))}
              />
              <Label htmlFor="is_public" className="dark:text-gray-300">Make this template public</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onCancel} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.name.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:shadow-md"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
