"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import NextImage from "next/image"
import Cookies from "js-cookie"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { showToast } from "@/components/ui/enhanced-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  ImagePlus,
  Star,
  ThumbsUp,
  Award,
  Camera,
  Upload,
  Pencil,
  Trash2,
  Calendar,
  MoreVertical,
  RefreshCw,
  Eye,
  Filter,
  Search,
  Grid,
  Play,
  X,
  AlertTriangle,
  Image as ImageIcon,
  Video
} from "lucide-react"

import { providerApi } from "@/services/provider.api"
import { useAuth } from "@/contexts/AuthContext"
import { EnhancedStatsCard } from "@/components/provider/EnhancedStatsCard"
import type { 
  PortfolioProject,
  PortfolioStats, 
  CreatePortfolioProjectData,
  PortfolioFilters
} from "@/types/portfolio"

// Enhanced Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
      duration: 0.6,
      ease: "easeOut"
    }
  }
}

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.9
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      type: "spring" as const,
      damping: 25,
      stiffness: 120
    }
  }
}

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    y: 20
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      type: "spring" as const,
      damping: 20,
      stiffness: 100
    }
  }
}

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 50
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      type: "spring" as const,
      damping: 25,
      stiffness: 300
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: {
      duration: 0.2
    }
  }
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
}

const hoverVariants = {
  hover: {
    scale: 1.02,
    y: -4,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  },
  tap: {
    scale: 0.98
  }
}

const buttonVariants = {
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  },
  tap: {
    scale: 0.95
  }
}

const iconVariants = {
  hover: {
    rotate: 5,
    scale: 1.1,
    transition: {
      duration: 0.2
    }
  }
}

const badgeVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      delay: 0.2,
      type: "spring" as const,
      damping: 15,
      stiffness: 200
    }
  }
}

// Enhanced Portfolio Project Card Component
const PortfolioProjectCard: React.FC<{
  project: PortfolioProject
  onEdit: (project: PortfolioProject) => void
  onDelete: (project: PortfolioProject) => void
  onView: (project: PortfolioProject) => void
}> = ({ project, onEdit, onDelete, onView }) => {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const getImageUrl = (url?: string) => {
    if (!url) return '/placeholder.jpg'
    
    // Handle different URL formats
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    } else if (url.startsWith('/media/')) {
      return `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}${url}`
    } else if (url.startsWith('/')) {
      return `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}${url}`
    } else {
      return `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/media/${url}`
    }
  }

  return (
    <motion.div
      variants={itemVariants}
      whileHover="hover"
      whileTap="tap"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-xl border bg-card/50 backdrop-blur-sm hover:bg-card transition-all duration-500 cursor-pointer"
      style={{
        boxShadow: isHovered 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
          : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}
      onClick={() => onView(project)}
    >
      <motion.div 
        className="relative aspect-square overflow-hidden"
        variants={hoverVariants}
      >
        {project.primary_image_url && !imageError ? (
          <motion.img
            src={getImageUrl(project.primary_image_url)}
            alt={project.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
            animate={{
              scale: isHovered ? 1.1 : 1,
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
            <motion.div
              animate={{
                scale: isHovered ? 1.1 : 1,
                rotate: isHovered ? 5 : 0
              }}
              transition={{ duration: 0.3 }}
            >
              <Camera className="h-12 w-12 text-gray-400 dark:text-gray-600" />
            </motion.div>
          </div>
        )}
        
        {/* Gradient overlay */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
          animate={{
            opacity: isHovered ? 0.8 : 0.3
          }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Media count badges */}
        <motion.div 
          className="absolute top-3 left-3 flex gap-2"
          variants={badgeVariants}
          initial="hidden"
          animate="visible"
        >
          {project.images_count > 0 && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Badge 
                variant="secondary" 
                className="text-xs bg-white/90 text-gray-800 backdrop-blur-sm border-0 shadow-lg hover:bg-white transition-all duration-200"
              >
                <ImageIcon className="h-3 w-3 mr-1" />
                {project.images_count}
              </Badge>
            </motion.div>
          )}
          {project.videos_count > 0 && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Badge 
                variant="secondary" 
                className="text-xs bg-blue-500/90 text-white backdrop-blur-sm border-0 shadow-lg hover:bg-blue-500 transition-all duration-200"
              >
                <Video className="h-3 w-3 mr-1" />
                {project.videos_count}
              </Badge>
            </motion.div>
          )}
        </motion.div>
        
        {/* Action buttons overlay */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center gap-3"
          animate={{
            opacity: isHovered ? 1 : 0,
            y: isHovered ? 0 : 20
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onView(project)
              }}
              className="bg-white/95 hover:bg-white text-gray-800 shadow-lg backdrop-blur-sm border-0 h-10 w-10 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(project)
              }}
              className="bg-blue-500/95 hover:bg-blue-500 text-white shadow-lg backdrop-blur-sm border-0 h-10 w-10 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(project)
              }}
              className="bg-red-500/95 hover:bg-red-500 text-white shadow-lg backdrop-blur-sm border-0 h-10 w-10 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="p-4 bg-gradient-to-b from-transparent to-card/50"
        animate={{
          y: isHovered ? -2 : 0
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <motion.h3 
              className="font-semibold text-base truncate text-foreground"
              animate={{
                color: isHovered ? 'rgb(59 130 246)' : 'currentColor'
              }}
              transition={{ duration: 0.3 }}
            >
              {project.title}
            </motion.h3>
            {project.description && (
              <motion.p 
                className="text-sm text-muted-foreground mt-1 line-clamp-2"
                animate={{
                  opacity: isHovered ? 0.8 : 0.6
                }}
                transition={{ duration: 0.3 }}
              >
                {project.description}
              </motion.p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-muted/80 transition-colors duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onView(project)} className="cursor-pointer">
                <Eye className="h-4 w-4 mr-2" />
                View Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(project)} className="cursor-pointer">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(project)}
                className="text-red-600 hover:text-red-700 cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <motion.div 
          className="flex items-center justify-between text-sm"
          animate={{
            opacity: isHovered ? 1 : 0.7
          }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-muted-foreground">
            {format(new Date(project.created_at), 'MMM dd, yyyy')}
          </span>
          <motion.div
            className="flex items-center gap-1 text-primary font-medium"
            whileHover={{ scale: 1.05 }}
          >
            <Camera className="h-3 w-3" />
            <span>{project.media_count} files</span>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}


export default function PortfolioPage() {
  const { user } = useAuth()
  
  // State management
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Data state
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([])
  const [stats, setStats] = useState<PortfolioStats | null>(null)
  
  // UI state
  const [filters, setFilters] = useState<PortfolioFilters>({
    search: '',
    ordering: '-created_at'
  })
  const [searchText, setSearchText] = useState('')
  
  // Dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null)
  
  // Upload state
  const [uploadData, setUploadData] = useState<{
    files: File[]
    title: string
    description: string
  }>({
    files: [],
    title: '',
    description: ''
  })
  const [uploading, setUploading] = useState(false)
  const [deletingMediaIds, setDeletingMediaIds] = useState<number[]>([])
  const [settingFeaturedId, setSettingFeaturedId] = useState<number | null>(null)
  const [confirmDeleteMediaId, setConfirmDeleteMediaId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection with validation
  const handleFileSelection = useCallback((files: File[]) => {
    const validFiles: File[] = []
    const errors: string[] = []
    
    let newImages = 0
    let newVideos = 0
    
    for (const file of files) {
      // Check file type
      if (file.type.startsWith('image/')) {
        newImages++
        
        // Check image size limit (10MB)
        if (file.size > 10 * 1024 * 1024) {
          errors.push(`Image "${file.name}" exceeds 10MB limit.`)
          continue
        }
        
        // Check image count limit per project (10 images max)
        if (newImages > 10) {
          errors.push(`Maximum 10 images allowed per project. Skipping "${file.name}".`)
          continue
        }
        
        validFiles.push(file)
      } else if (file.type.startsWith('video/')) {
        newVideos++
        
        // Check video size limit (25MB)
        if (file.size > 25 * 1024 * 1024) {
          errors.push(`Video "${file.name}" exceeds 25MB limit.`)
          continue
        }
        
        // Check video count limit per project (5 videos max)
        if (newVideos > 5) {
          errors.push(`Maximum 5 videos allowed per project. Skipping "${file.name}".`)
          continue
        }
        
        validFiles.push(file)
      } else {
        errors.push(`Unsupported file type: "${file.name}". Only images and videos are allowed.`)
      }
    }
    
    // Add valid files to upload data
    if (validFiles.length > 0) {
      setUploadData(prev => ({
        ...prev,
        files: [...prev.files, ...validFiles]
      }))
    }
    
    // Show errors if any
    if (errors.length > 0) {
      showToast.error({
        title: "File Validation Errors",
        description: errors.slice(0, 3).join(' '), // Show first 3 errors
        duration: 5000
      })
    }
    
    // Show success message for valid files
    if (validFiles.length > 0) {
      showToast.success({
        title: "Files Added",
        description: `${validFiles.length} file${validFiles.length === 1 ? '' : 's'} added successfully.`,
        duration: 3000
      })
    }
  }, [])

  // Load portfolio data
  const loadPortfolioData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      // Load portfolio projects and stats
      const [projectsResponse, statsResponse] = await Promise.allSettled([
        providerApi.getPortfolioProjects({ ordering: filters.ordering } as any),
        providerApi.getPortfolioStats()
      ])

      // Handle portfolio projects
      if (projectsResponse.status === 'fulfilled') {
        setPortfolioProjects(projectsResponse.value)
      } else {
        console.warn('Failed to load portfolio projects:', projectsResponse.reason)
        setPortfolioProjects([])
      }

      // Handle stats
      if (statsResponse.status === 'fulfilled') {
        setStats(statsResponse.value)
      } else {
        console.warn('Failed to load portfolio stats:', statsResponse.reason)
        setStats({
          total_projects: 0,
          average_rating: 0,
          total_reviews: 0,
          achievements_count: 0,
          total_services: 0,
          featured_projects: 0
        })
      }

    } catch (error: any) {
      console.error('Error loading portfolio data:', error)
      setError('Failed to load portfolio data. Please try again.')
      showToast.error({
        title: "Error Loading Portfolio",
        description: "Failed to load portfolio information. Please try again.",
        duration: 5000
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filters.ordering])

  // Debounce search updates to avoid heavy re-computation and reload feeling
  useEffect(() => {
    const handle = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchText }))
    }, 300)
    return () => clearTimeout(handle)
  }, [searchText])

  // Initial load
  useEffect(() => {
    loadPortfolioData()
  }, [loadPortfolioData])

  // Filter and sort portfolio projects
  const filteredPortfolioProjects = useMemo(() => {
    let filtered = portfolioProjects

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(project => 
        project.title?.toLowerCase().includes(filters.search!.toLowerCase()) ||
        project.description?.toLowerCase().includes(filters.search!.toLowerCase())
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.ordering) {
        case 'created_at':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case '-created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'title':
          return (a.title || '').localeCompare(b.title || '')
        case 'order':
          return a.order - b.order
        case '-order':
          return b.order - a.order
        default:
          return 0
      }
    })

    return filtered
  }, [portfolioProjects, filters])

  // Handle project creation
  const handleProjectCreation = useCallback(async () => {
    if (uploadData.files.length === 0) {
      showToast.error({
        title: "No Files Selected",
        description: "Please select at least one file to upload.",
        duration: 3000
      })
      return
    }

    if (!uploadData.title.trim()) {
      showToast.error({
        title: "Title Required",
        description: "Please enter a title for your project.",
        duration: 3000
      })
      return
    }

    try {
      setUploading(true)
      
      const projectData: CreatePortfolioProjectData = {
        title: uploadData.title,
        description: uploadData.description,
        files: uploadData.files
      }

      const newProject = await providerApi.createPortfolioProject(projectData)
      
      // Add new project to the list
      setPortfolioProjects(prev => [newProject, ...prev])
      
      setUploadDialogOpen(false)
      setUploadData({ files: [], title: '', description: '' })
      
      showToast.success({
        title: "Project Created",
        description: "Your portfolio project has been created successfully.",
        duration: 3000
      })
    } catch (error: any) {
      showToast.error({
        title: "Creation Failed",
        description: error.message || "Failed to create portfolio project.",
        duration: 5000
      })
    } finally {
      setUploading(false)
    }
  }, [uploadData])

  // Handle project edit
  const handleEditProject = useCallback(async () => {
    if (!selectedProject) return

    try {
      const updateData = {
        title: uploadData.title,
        description: uploadData.description,
        files: uploadData.files.length > 0 ? uploadData.files : undefined
      }

      const updatedProject = await providerApi.updatePortfolioProject(selectedProject.id, updateData)
      
      setPortfolioProjects(prev => prev.map(project => 
        project.id === selectedProject.id ? updatedProject : project
      ))
      
      setEditDialogOpen(false)
      setSelectedProject(null)
      setUploadData({ files: [], title: '', description: '' })
      
      showToast.success({
        title: "Update Successful",
        description: "Portfolio project has been updated successfully.",
        duration: 3000
      })
    } catch (error: any) {
      showToast.error({
        title: "Update Failed",
        description: error.message || "Failed to update portfolio project.",
        duration: 5000
      })
    }
  }, [selectedProject, uploadData])

  // Handle project delete
  const handleDeleteProject = useCallback(async () => {
    if (!selectedProject) return

    try {
      await providerApi.deletePortfolioProject(selectedProject.id)
      
      setPortfolioProjects(prev => prev.filter(project => project.id !== selectedProject.id))
      setDeleteDialogOpen(false)
      setSelectedProject(null)
      
      showToast.success({
        title: "Delete Successful",
        description: "Portfolio project has been deleted successfully.",
        duration: 3000
      })
    } catch (error: any) {
      showToast.error({
        title: "Delete Failed",
        description: error.message || "Failed to delete portfolio project.",
        duration: 5000
      })
    }
  }, [selectedProject])

  // Delete a single media file from a project
  const handleDeleteMedia = useCallback(async (mediaId: number) => {
    if (!selectedProject) return
    try {
      setDeletingMediaIds(prev => [...prev, mediaId])
      await providerApi.deletePortfolioMedia(mediaId)

      // Determine deleted media type to adjust counts
      const deletedMedia = selectedProject.media_files.find(m => m.id === mediaId)

      const updatedMediaFiles = selectedProject.media_files.filter(m => m.id !== mediaId)
      // Determine new primary image if needed
      let newPrimaryImageUrl = selectedProject.primary_image_url || ''
      const deletedWasPrimary = deletedMedia && selectedProject.primary_image_url && selectedProject.primary_image_url === deletedMedia.file_url
      if (deletedWasPrimary || !newPrimaryImageUrl) {
        const firstImage = updatedMediaFiles.find(m => m.media_type === 'image')
        newPrimaryImageUrl = firstImage ? firstImage.file_url : ''
      }
      const updatedProject = {
        ...selectedProject,
        media_files: updatedMediaFiles,
        media_count: Math.max(0, (selectedProject.media_count || selectedProject.media_files.length) - 1),
        images_count: deletedMedia?.media_type === 'image' ? Math.max(0, (selectedProject.images_count || 0) - 1) : (selectedProject.images_count || 0),
        videos_count: deletedMedia?.media_type === 'video' ? Math.max(0, (selectedProject.videos_count || 0) - 1) : (selectedProject.videos_count || 0),
        primary_image_url: newPrimaryImageUrl,
      }

      setSelectedProject(updatedProject)
      setPortfolioProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p))

      showToast.success({
        title: 'Media removed',
        description: 'The media file was deleted from this project.',
        duration: 2500
      })
    } catch (error: any) {
      showToast.error({
        title: 'Failed to delete media',
        description: error?.message || 'Please try again.',
        duration: 4000
      })
    } finally {
      setDeletingMediaIds(prev => prev.filter(id => id !== mediaId))
    }
  }, [selectedProject])

  // Set an image as featured (makes it order=1)
  const handleSetFeatured = useCallback(async (mediaId: number) => {
    if (!selectedProject) return
    const target = selectedProject.media_files.find(m => m.id === mediaId)
    if (!target || target.media_type !== 'image') return

    try {
      setSettingFeaturedId(mediaId)

      // Build new orders: selected -> 1, others shift preserving relative order
      const others = selectedProject.media_files
        .filter(m => m.id !== mediaId)
        .sort((a, b) => a.order - b.order)

      const mediaOrders: Record<number, number> = {}
      mediaOrders[mediaId] = 1
      let nextOrder = 2
      for (const m of others) {
        // Keep videos too, but images first is not required; preserve existing
        mediaOrders[m.id] = nextOrder++
      }

      // Optimistically update local state (orders + is_featured flags)
      const updatedMediaFiles = [...selectedProject.media_files]
        .map(m => ({ ...m, is_featured: m.id === mediaId }))
        .sort((a, b) => (mediaOrders[a.id] || a.order) - (mediaOrders[b.id] || b.order))
      const updatedProject = {
        ...selectedProject,
        media_files: updatedMediaFiles,
        primary_image_url: target.file_url
      }
      setSelectedProject(updatedProject)
      setPortfolioProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p))

      // Persist to backend
      await providerApi.updatePortfolioProject(selectedProject.id, { media_orders: mediaOrders as any, featured_media_id: mediaId })

      showToast.success({
        title: 'Featured image updated',
        description: 'This image will be used as the project cover.',
        duration: 2500
      })
    } catch (error: any) {
      showToast.error({
        title: 'Failed to set featured',
        description: error?.message || 'Please try again.',
        duration: 4000
      })
    } finally {
      setSettingFeaturedId(null)
    }
  }, [selectedProject])

  // Dialog handlers
  const openUploadDialog = useCallback(() => {
    setUploadData({ files: [], title: '', description: '' })
    setUploadDialogOpen(true)
  }, [])

  const openEditDialog = useCallback((project: PortfolioProject) => {
    setSelectedProject(project)
    setUploadData({
      files: [], // Don't include existing files for editing
      title: project.title || '',
      description: project.description || ''
    })
    setEditDialogOpen(true)
  }, [])

  const openViewDialog = useCallback((project: PortfolioProject) => {
    setSelectedProject(project)
    setViewDialogOpen(true)
  }, [])

  const openDeleteDialog = useCallback((project: PortfolioProject) => {
    setSelectedProject(project)
    setDeleteDialogOpen(true)
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* Header skeleton */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-xl" />
                </div>
              </Card>
            ))}
          </div>

          {/* Content skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div 
      className="container mx-auto p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        variants={cardVariants}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Portfolio</h1>
          <p className="text-muted-foreground mt-1">
            Showcase your work and achievements to attract more customers
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => loadPortfolioData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 transition-all duration-200 hover:shadow-md"
          >
            <RefreshCw className={`h-4 w-4 transition-transform duration-300 ${refreshing ? 'animate-spin' : 'hover:rotate-180'}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            onClick={openUploadDialog}
            className="transition-all duration-200 hover:shadow-md"
          >
            <ImagePlus className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
            Create New Project
          </Button>
        </div>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="mx-auto mb-4 p-3 bg-red-100 dark:bg-red-950/30 rounded-full w-16 h-16 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-red-800 dark:text-red-200">Unable to Load Portfolio</h3>
                <p className="text-red-700 dark:text-red-300 mb-6 max-w-md mx-auto">
                  {error}
                </p>
                <Button 
                  variant="default" 
                  onClick={() => loadPortfolioData(true)}
                  disabled={refreshing}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Retrying...' : 'Try Again'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Overview */}
      <motion.div 
        variants={cardVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <EnhancedStatsCard
          title="Total Projects"
          value={stats?.total_projects || portfolioProjects.length}
          subtitle="Portfolio projects"
          icon={Camera}
          tone="primary"
        />
        <EnhancedStatsCard
          title="Average Rating"
          value={stats?.average_rating ? stats.average_rating.toFixed(1) : '0.0'}
          subtitle="Customer satisfaction"
          icon={Star}
          tone="warning"
        />
        <EnhancedStatsCard
          title="Total Reviews"
          value={stats?.total_reviews || 0}
          subtitle="Customer feedback"
          icon={ThumbsUp}
          tone="success"
        />
        <EnhancedStatsCard
          title="Total Services"
          value={stats?.total_services || 0}
          subtitle="Services offered"
          icon={Award}
          tone="info"
        />
      </motion.div>

      {/* Filters and Controls */}
      <motion.div variants={cardVariants} className="mb-6">
        <Card className="p-6">
          <div className="flex flex-col items-start gap-4">
            <div className="w-full flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
              <div className="w-full sm:w-auto">
                <Select 
                  value={filters.ordering} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, ordering: value as any }))}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-created_at">Newest First</SelectItem>
                    <SelectItem value="created_at">Oldest First</SelectItem>
                    <SelectItem value="title">Title A-Z</SelectItem>
                    <SelectItem value="order">Custom Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* View toggle removed: grid is the only view */}
          </div>
        </Card>
      </motion.div>

      {/* Portfolio Grid */}
      <motion.div variants={cardVariants}>
        <AnimatePresence>
          {filteredPortfolioProjects.length > 0 ? (
            <motion.div
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredPortfolioProjects.map((project) => (
                <PortfolioProjectCard
                  key={project.id}
                  project={project}
                  onEdit={openEditDialog}
                  onDelete={openDeleteDialog}
                  onView={openViewDialog}
                />
              ))}
              
              {/* Add New Project Card */}
              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center aspect-square border-2 border-dashed border-muted-foreground/25 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all duration-300"
                onClick={openUploadDialog}
              >
                <div className="text-center">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  </motion.div>
                  <p className="text-sm font-medium">Create New Project</p>
                  <p className="text-sm text-muted-foreground">Upload photos and videos</p>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="mx-auto mb-6 p-4 bg-muted rounded-full w-24 h-24 flex items-center justify-center">
                <Camera className="h-12 w-12 text-muted-foreground" />
              </div>
              
              <h3 className="text-xl font-semibold mb-2">
                {filters.search 
                  ? "No matching projects found" 
                  : "No portfolio projects yet"}
              </h3>
              
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {filters.search 
                  ? "Try adjusting your search criteria to find what you're looking for."
                  : "Start building your portfolio by creating projects with photos and videos of your completed work."}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={openUploadDialog}
                    className="transition-all duration-200 hover:shadow-md"
                  >
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Create Your First Project
                  </Button>
                </motion.div>
                {filters.search && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      variant="outline" 
                      onClick={() => setFilters({ search: '', ordering: '-created_at' })}
                      className="transition-all duration-200 hover:shadow-md"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Clear Search
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Create Project Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Portfolio Project</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Create a new project with multiple photos and videos. Images: max 10MB each. Videos: max 25MB each.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Project Title *</label>
              <Input
                placeholder="Enter project title"
                value={uploadData.title}
                onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                placeholder="Describe your project..."
                value={uploadData.description}
                onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Files *</label>
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.add('border-primary/50')
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove('border-primary/50')
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove('border-primary/50')
                  const files = Array.from(e.dataTransfer.files)
                  handleFileSelection(files)
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    handleFileSelection(files)
                  }}
                  className="hidden"
                />
                
                {uploadData.files.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">{uploadData.files.length} files selected</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          fileInputRef.current?.click()
                        }}
                        className="mt-2"
                      >
                        Add More Files
                      </Button>
                    </div>
                    
                    <ScrollArea className="max-h-32">
                      <div className="space-y-2">
                        {uploadData.files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-left">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {file.type.startsWith('video/') ? (
                                <Play className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              ) : (
                                <Camera className="h-4 w-4 text-green-500 flex-shrink-0" />
                              )}
                              <span className="text-sm font-medium truncate">{file.name}</span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                ({(file.size / 1024 / 1024).toFixed(1)} MB)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setUploadData(prev => ({
                                  ...prev,
                                  files: prev.files.filter((_, i) => i !== index)
                                }))
                              }}
                              className="h-6 w-6 p-0 flex-shrink-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">Drop files here or click to browse</p>
                    <p className="text-xs text-muted-foreground">
                      Support for images (JPG, PNG, GIF) and videos (MP4, MOV, AVI)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setUploadDialogOpen(false)
                setUploadData({ files: [], title: '', description: '' })
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleProjectCreation}
              disabled={uploading || uploadData.files.length === 0 || !uploadData.title.trim()}
            >
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Create Project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Portfolio Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Project Title</label>
              <Input
                placeholder="Enter project title"
                value={uploadData.title || ''}
                onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                placeholder="Describe your project..."
                value={uploadData.description || ''}
                onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>

            {/* Show existing media */}
            {selectedProject && selectedProject.media_files.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Current Files ({selectedProject.media_files.length})</label>
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {selectedProject.media_files.map((media) => (
                    <div key={media.id} className="relative aspect-square rounded overflow-hidden">
                      {media.media_type === 'video' ? (
                        <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <Play className="h-6 w-6 text-gray-400" />
                        </div>
                      ) : (
                        <NextImage
                          src={media.file_url}
                          alt={media.caption || 'Project media'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 25vw, 128px"
                          unoptimized
                        />
                      )}
                      {/* Featured badge */}
                      {selectedProject.primary_image_url && media.file_url === selectedProject.primary_image_url && (
                        <div className="absolute top-1 left-1">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-yellow-500 text-white">Featured</Badge>
                        </div>
                      )}
                      {/* Actions: Set Featured (for images), Delete (disabled for featured) */}
                      <div className="absolute top-1 right-1 flex gap-1">
                        {media.media_type === 'image' && media.file_url !== selectedProject.primary_image_url && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSetFeatured(media.id)}
                            disabled={settingFeaturedId === media.id}
                            className="h-7 px-2 text-[11px] bg-blue-600/90 hover:bg-blue-600 text-white"
                            title="Set as Featured"
                          >
                            {settingFeaturedId === media.id ? 'Setting…' : 'Feature'}
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          onClick={() => setConfirmDeleteMediaId(media.id)}
                          disabled={deletingMediaIds.includes(media.id) || !!(selectedProject.primary_image_url && media.file_url === selectedProject.primary_image_url)}
                          className="h-7 w-7"
                          title={(selectedProject.primary_image_url && media.file_url === selectedProject.primary_image_url) ? 'Cannot delete featured image' : 'Remove'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Add new files */}
            <div>
              <label className="text-sm font-medium mb-2 block">Add New Files (Optional)</label>
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    handleFileSelection(files)
                  }}
                  className="hidden"
                />
                
                {uploadData.files.length > 0 ? (
                  <div>
                    <p className="text-sm font-medium">{uploadData.files.length} new files selected</p>
                    <div className="mt-2 space-y-1">
                      {uploadData.files.map((file, index) => (
                        <div key={index} className="text-xs text-muted-foreground">
                          {file.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                    <p className="text-sm">Click to add more files</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditProject}>
              <Pencil className="h-4 w-4 mr-2" />
              Update Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced View Project Dialog */}
      <AnimatePresence>
        {viewDialogOpen && (
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                <DialogHeader className="pb-4 border-b border-border">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <DialogTitle className="text-2xl font-bold text-foreground">
                        {selectedProject?.title || 'Portfolio Project'}
                      </DialogTitle>
                      {selectedProject?.description && (
                        <p className="text-muted-foreground max-w-2xl">
                          {selectedProject.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {selectedProject && format(new Date(selectedProject.created_at), 'MMM dd, yyyy')}
                      </Badge>
                    </div>
                  </div>
                </DialogHeader>

                {selectedProject && (
                  <motion.div 
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {/* Project Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <motion.div 
                        className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-xl"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {selectedProject.media_count}
                        </div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">Total Files</div>
                      </motion.div>
                      <motion.div 
                        className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 rounded-xl"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {selectedProject.images_count}
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300">Images</div>
                      </motion.div>
                      <motion.div 
                        className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-xl"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {selectedProject.videos_count}
                        </div>
                        <div className="text-sm text-purple-700 dark:text-purple-300">Videos</div>
                      </motion.div>
                    </div>

                    {/* Media Gallery */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold flex items-center gap-2">
                          <Camera className="h-5 w-5 text-primary" />
                          Media Gallery
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {selectedProject.media_files.length} files
                        </Badge>
                      </div>
                      
                      <ScrollArea className="h-96 w-full rounded-xl border bg-muted/30">
                        <motion.div 
                          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4"
                          variants={gridVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {selectedProject.media_files.map((media, index) => (
                            <motion.div
                              key={media.id}
                              variants={itemVariants}
                              className="group relative aspect-square rounded-xl overflow-hidden bg-card shadow-sm hover:shadow-lg transition-all duration-300"
                              whileHover={{ scale: 1.02, y: -2 }}
                              style={{
                                animationDelay: `${index * 0.05}s`
                              }}
                            >
                              {media.media_type === 'video' ? (
                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center relative">
                                  <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Play className="h-8 w-8 text-blue-500" />
                                  </motion.div>
                                  <div className="absolute top-2 right-2">
                                    <Badge variant="secondary" className="text-xs bg-blue-500 text-white">
                                      <Video className="h-3 w-3 mr-1" />
                                      Video
                                    </Badge>
                                  </div>
                                </div>
                              ) : (
                                <div className="relative w-full h-full">
                                  <NextImage
                                    src={media.file_url}
                                    alt={media.caption || 'Project media'}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                                    sizes="(max-width: 1024px) 33vw, 256px"
                                    unoptimized
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <Badge variant="secondary" className="text-xs bg-green-500 text-white">
                                      <ImageIcon className="h-3 w-3 mr-1" />
                                      Image
                                    </Badge>
                                  </div>
                                </div>
                              )}
                              
                              {/* Media caption overlay */}
                              {media.caption && (
                                <motion.div 
                                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3"
                                  initial={{ opacity: 0, y: 20 }}
                                  whileHover={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <p className="text-white text-xs font-medium truncate">
                                    {media.caption}
                                  </p>
                                </motion.div>
                              )}
                            </motion.div>
                          ))}
                        </motion.div>
                      </ScrollArea>
                    </div>
                  </motion.div>
                )}

                <DialogFooter className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Created {selectedProject && format(new Date(selectedProject.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button 
                          variant="outline" 
                          onClick={() => setViewDialogOpen(false)}
                          className="hover:bg-muted/80"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Close
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button 
                          onClick={() => {
                            setViewDialogOpen(false)
                            if (selectedProject) openEditDialog(selectedProject)
                          }}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Project
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </DialogFooter>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Portfolio Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedProject?.title || 'this project'}"? This will permanently delete the project and all its media files. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm delete media dialog */}
      <AlertDialog open={!!confirmDeleteMediaId} onOpenChange={(open) => !open && setConfirmDeleteMediaId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete media file?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The media file will be permanently removed from this project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (confirmDeleteMediaId) {
                  await handleDeleteMedia(confirmDeleteMediaId)
                  setConfirmDeleteMediaId(null)
                }
              }}
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