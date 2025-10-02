"use client"

import { useState, useCallback, useRef } from "react"
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
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { showToast } from "@/components/ui/enhanced-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { providerApi } from "@/services/provider.api"
import React from "react"

import {
  Upload,
  Image as ImageIcon,
  X,
  Star,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Plus,
  Move,
  RotateCw,
  GripVertical
} from "lucide-react"

import type { ServiceImage } from "@/types/provider"

interface ServiceImageManagerProps {
  serviceId: number | null
  serviceSlug?: string | null
  images: ServiceImage[]
  onImagesUpdate: (images: ServiceImage[]) => void
  maxImages?: number
}

export interface ServiceImageManagerRef {
  uploadTemporaryImages: (serviceId?: number) => Promise<ServiceImage[]>
  setServiceId: (serviceId: number) => void
  getTemporaryImagesCount: () => number
}

interface UploadProgress {
  file: File
  progress: number
  preview: string
}

interface TemporaryImage {
  id: string
  file: File
  preview: string
  caption: string
  alt_text: string
  is_featured: boolean
  order: number
  is_temporary: true
}

const ServiceImageManager = React.forwardRef<ServiceImageManagerRef, ServiceImageManagerProps>(({
  serviceId: initialServiceId,
  serviceSlug,
  images,
  onImagesUpdate,
  maxImages = 10
}, ref) => {
  const [currentServiceId, setServiceIdState] = useState<number | null>(initialServiceId)
  const [currentServiceSlug, setServiceSlug] = useState<string | null>(serviceSlug || null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [editingImage, setEditingImage] = useState<ServiceImage | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<ServiceImage | null>(null)
  const [draggedImage, setDraggedImage] = useState<ServiceImage | TemporaryImage | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [temporaryImages, setTemporaryImages] = useState<TemporaryImage[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return

    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        showToast.error({
          title: "Invalid File Type",
          description: `${file.name} is not an image file`,
          duration: 3000
        })
        return false
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast.error({
          title: "File Too Large",
          description: `${file.name} is larger than 5MB`,
          duration: 3000
        })
        return false
      }
      
      return true
    })

    if (validFiles.length === 0) return

    const totalImages = images.length + temporaryImages.length + validFiles.length
    if (totalImages > maxImages) {
      showToast.error({
        title: "Too Many Images",
        description: `You can only have up to ${maxImages} images. Current: ${images.length + temporaryImages.length}, trying to add: ${validFiles.length}`,
        duration: 3000
      })
      return
    }

    // Create temporary images
    const newTemporaryImages: TemporaryImage[] = validFiles.map((file, index) => ({
      id: `temp_${Date.now()}_${index}`,
      file,
      preview: URL.createObjectURL(file),
      caption: '',
      alt_text: '',
      is_featured: images.length === 0 && temporaryImages.length === 0 && index === 0, // First image is featured by default
      order: images.length + temporaryImages.length + index,
      is_temporary: true
    }))

    setTemporaryImages(prev => [...prev, ...newTemporaryImages])
    
    showToast.success({
      title: "Images Added",
      description: `${validFiles.length} image(s) added. ${currentServiceId ? 'Click \'Save Changes\' to upload.' : 'Images will be uploaded when service is created.'}`,
      duration: 3000
    })
  }, [images, temporaryImages, maxImages, currentServiceId])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDeleteImage = useCallback((image: ServiceImage) => {
    // Prevent deleting featured image if it's the only image or if there are multiple images
    if (image.is_featured && images.length > 1) {
      showToast.error({
        title: "Cannot Delete Featured Image",
        description: "Please set another image as featured before deleting this one.",
        duration: 5000
      })
      return
    }
    
    setImageToDelete(image)
    setShowDeleteDialog(true)
  }, [images])

  const handleDeleteTemporaryImage = useCallback((imageId: string) => {
    setTemporaryImages(prev => {
      const updated = prev.filter(img => img.id !== imageId)
      // Update order for remaining images
      return updated.map((img, index) => ({
        ...img,
        order: images.length + index
      }))
    })
  }, [images.length])

  const handleSetFeaturedTemporary = useCallback((imageId: string) => {
    // Update temporary images - ensure only one is featured
    setTemporaryImages(prev => prev.map(img => ({
      ...img,
      is_featured: img.id === imageId
    })))
    
    // Also clear featured status from regular images
    const updatedImages = images.map(img => ({
      ...img,
      is_featured: false
    }))
    onImagesUpdate(updatedImages)
    
    showToast.success({
      title: "Featured Image Updated",
      description: "Featured image has been updated (will be applied when uploaded)",
      duration: 3000
    })
  }, [images, onImagesUpdate])

  const handleUpdateTemporaryImage = useCallback((imageId: string, updates: Partial<TemporaryImage>) => {
    setTemporaryImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, ...updates } : img
    ))
  }, [])

  const confirmDeleteImage = useCallback(async () => {
    if (!imageToDelete) return

    const serviceIdentifier = currentServiceSlug || currentServiceId

    if (!serviceIdentifier) {
      // For temporary images, just remove from local state
      const updatedImages = images.filter(img => img.id !== imageToDelete.id)
      
      if (imageToDelete.is_featured && updatedImages.length > 0) {
        updatedImages[0].is_featured = true
      }

      onImagesUpdate(updatedImages)
      setShowDeleteDialog(false)
      setImageToDelete(null)
      
      showToast.success({
        title: "Image Deleted",
        description: "Image has been removed successfully",
        duration: 3000
      })
      return
    }

    try {
      // Delete from backend directly using slug or ID
      await providerApi.deleteServiceImage(serviceIdentifier, imageToDelete.id)
      
      // Refresh the service data to get the updated images from backend
      const updatedService = await providerApi.getService(serviceIdentifier)
      onImagesUpdate(updatedService.images)
      
      setShowDeleteDialog(false)
      setImageToDelete(null)
      
      showToast.success({
        title: "Image Deleted",
        description: "Image has been removed successfully",
        duration: 3000
      })
    } catch (error: any) {
      showToast.error({
        title: "Delete Failed",
        description: error.message || "Failed to delete image. Please try again.",
        duration: 5000
      })
    }
  }, [imageToDelete, images, onImagesUpdate, currentServiceId, currentServiceSlug])

  const handleSetFeatured = useCallback(async (image: ServiceImage) => {
    const serviceIdentifier = currentServiceSlug || currentServiceId
    
    if (!serviceIdentifier) {
      // For temporary images, update local state only
      const updatedImages = images.map(img => ({
        ...img,
        is_featured: img.id === image.id
      }))
      onImagesUpdate(updatedImages)
      
      showToast.success({
        title: "Featured Image Updated",
        description: "Featured image has been updated",
        duration: 3000
      })
      return
    }

    try {
      // Update backend directly using slug or ID
      const updatedImage = await providerApi.updateServiceImage(serviceIdentifier, image.id, { is_featured: true })
      
      // Refresh the service data to get the updated images from backend
      const updatedService = await providerApi.getService(serviceIdentifier)
      onImagesUpdate(updatedService.images)
      
      showToast.success({
        title: "Featured Image Updated",
        description: "Featured image has been updated successfully",
        duration: 3000
      })
    } catch (error: any) {
      showToast.error({
        title: "Update Failed",
        description: error.message || "Failed to update featured image. Please try again.",
        duration: 5000
      })
    }
  }, [images, onImagesUpdate, currentServiceId, currentServiceSlug])

  const handleUpdateImage = useCallback((updatedImage: ServiceImage) => {
    const updatedImages = images.map(img => 
      img.id === updatedImage.id ? updatedImage : img
    )
    onImagesUpdate(updatedImages)
    setEditingImage(null)
    
    showToast.success({
      title: "Image Updated",
      description: "Image details have been updated",
      duration: 3000
    })
  }, [images, onImagesUpdate])

  const handleImageDragStart = useCallback((e: React.DragEvent, image: ServiceImage | TemporaryImage, index: number) => {
    setDraggedImage(image)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML)
  }, [])

  const handleImageDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }, [])

  const handleImageDragLeave = useCallback(() => {
    setDragOverIndex(null)
  }, [])

  const handleImageDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    setDragOverIndex(null)
    
    if (!draggedImage) return

    // Determine if we're dealing with regular images or temporary images
    const isTemporaryDrag = 'is_temporary' in draggedImage
    const allImages = [...images, ...temporaryImages].sort((a, b) => a.order - b.order)
    const dragIndex = allImages.findIndex(img => 
      'is_temporary' in img && 'is_temporary' in draggedImage 
        ? img.id === draggedImage.id 
        : img.id === draggedImage.id
    )

    if (dragIndex === dropIndex) return

    // Reorder the combined array
    const reorderedImages = [...allImages]
    reorderedImages.splice(dragIndex, 1)
    reorderedImages.splice(dropIndex, 0, draggedImage)

    // Update order property and separate back into regular and temporary
    const updatedRegularImages: ServiceImage[] = []
    const updatedTemporaryImages: TemporaryImage[] = []

    reorderedImages.forEach((img, index) => {
      const updatedImg = { ...img, order: index }
      if ('is_temporary' in img) {
        updatedTemporaryImages.push(updatedImg as TemporaryImage)
      } else {
        updatedRegularImages.push(updatedImg as ServiceImage)
      }
    })

    // Update state
    setTemporaryImages(updatedTemporaryImages)
    onImagesUpdate(updatedRegularImages)
    setDraggedImage(null)
  }, [draggedImage, images, temporaryImages, onImagesUpdate])


  // Function to upload all temporary images
  const uploadTemporaryImages = useCallback(async (serviceId?: number): Promise<ServiceImage[]> => {
    const targetServiceId = serviceId || currentServiceId
    const targetServiceSlug = currentServiceSlug
    const serviceIdentifier = targetServiceSlug || targetServiceId
    
    if (temporaryImages.length === 0) return []
    
    if (!serviceIdentifier) {
      throw new Error('Service ID or slug is required to upload images')
    }

    setUploading(true)
    const uploadedImages: ServiceImage[] = []
    const failedUploads: string[] = []

    try {
      for (let i = 0; i < temporaryImages.length; i++) {
        const tempImage = temporaryImages[i]
        
        try {
          const uploadedImage = await providerApi.uploadServiceImage(
            serviceIdentifier,
            tempImage.file,
            tempImage.is_featured
          )
          
          // Add caption and alt_text if provided
          const finalImage = {
            ...uploadedImage,
            caption: tempImage.caption,
            alt_text: tempImage.alt_text,
            order: tempImage.order
          }
          
          uploadedImages.push(finalImage)
        } catch (error: any) {
          failedUploads.push(tempImage.file.name)
          
          showToast.error({
            title: "Upload Failed",
            description: `Failed to upload ${tempImage.file.name}: ${error.message}`,
            duration: 5000
          })
        }
      }

      // Clear temporary images and refresh from backend
      if (uploadedImages.length > 0) {
        setTemporaryImages([])
        
        // Refresh the service data to get the updated images from backend
        try {
          const updatedService = await providerApi.getService(serviceIdentifier)
          onImagesUpdate(updatedService.images)
        } catch (error) {
          showToast.error({
            title: 'Image Upload Failed',
            description: 'Failed to upload images. Please try again.',
            duration: 2500
          })
          // Fallback to local update if refresh fails
          onImagesUpdate([...images, ...uploadedImages])
        }
      }
      
      // Show appropriate success/error messages
      if (uploadedImages.length > 0) {
        showToast.success({
          title: "Images Uploaded",
          description: `${uploadedImages.length} image(s) uploaded successfully${failedUploads.length > 0 ? `. ${failedUploads.length} failed.` : ''}`,
          duration: 3000
        })
      }
      
      if (failedUploads.length > 0 && uploadedImages.length === 0) {
        throw new Error(`All image uploads failed: ${failedUploads.join(', ')}`)
      }

      return uploadedImages
    } finally {
      setUploading(false)
    }
  }, [temporaryImages, currentServiceId, currentServiceSlug, images, onImagesUpdate])

  // Method to set service ID (for create form)
  const setServiceId = useCallback((newServiceId: number) => {
    setServiceIdState(newServiceId)
  }, [])

  // Method to get temporary images count
  const getTemporaryImagesCount = useCallback(() => {
    return temporaryImages.length
  }, [temporaryImages.length])

  // Expose upload function to parent component
  React.useImperativeHandle(ref, () => ({
    uploadTemporaryImages,
    setServiceId,
    getTemporaryImagesCount
  }))

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              uploading 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                : 'border-gray-300 hover:border-blue-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              disabled={uploading}
            />
            
            <div className="flex flex-col items-center">
              {uploading ? (
                <>
                  <Loader2 className="h-12 w-12 text-blue-500 mb-4 animate-spin" />
                  <h3 className="text-lg font-medium mb-2">Uploading Images...</h3>
                  <p className="text-muted-foreground mb-4">
                    Please wait while your images are being uploaded
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Add Service Images</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop images here, or click to select files
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports JPG, PNG, GIF up to 5MB each. Max {maxImages} images.
                  </p>
                  <p className="text-xs text-orange-600 mt-2">
                    {currentServiceId 
                      ? "Images will be uploaded when you click 'Save Changes'" 
                      : "Images will be uploaded when service is created"
                    }
                  </p>
                  {(images.length + temporaryImages.length) > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: {images.length + temporaryImages.length}/{maxImages} images
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploadProgress.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-2"
          >
            {uploadProgress.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={item.preview}
                        alt="Upload preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.file.name}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.progress}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Images Grid */}
      {(images.length > 0 || temporaryImages.length > 0) && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                Service Images ({images.length + temporaryImages.length})
                {temporaryImages.length > 0 && (
                  <span className="text-sm text-orange-600 ml-2">
                    ({temporaryImages.length} pending upload)
                  </span>
                )}
              </h3>
              <div className="text-sm text-muted-foreground">
                Drag to reorder • Click star to set featured
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Combined Images (Regular + Temporary) sorted by order */}
              {[...images, ...temporaryImages]
                .sort((a, b) => a.order - b.order)
                .map((image, index) => {
                  const isTemporary = 'is_temporary' in image
                  return (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`group relative ${dragOverIndex === index ? 'scale-105 z-10' : ''}`}
                    >
                      <div
                        draggable
                        onDragStart={(e) => handleImageDragStart(e, image, index)}
                        onDragOver={(e) => handleImageDragOver(e, index)}
                        onDragLeave={handleImageDragLeave}
                        onDrop={(e) => handleImageDrop(e, index)}
                      >
                        <Card className={`overflow-hidden ${isTemporary ? 'border-orange-200 bg-orange-50/50' : ''} ${dragOverIndex === index ? 'ring-2 ring-blue-500' : ''}`}>
                        <div className="relative aspect-square">
                          {isTemporary ? (
                            <Image
                              src={(image as TemporaryImage).preview}
                              alt={image.alt_text || image.caption || "Temporary image"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <ServiceImage
                              src={(image as ServiceImage).image}
                              alt={image.alt_text || image.caption || "Service image"}
                              fill={true}
                              className="w-full h-full"
                            />
                          )}
                          
                          {/* Status Badge */}
                          <div className="absolute top-2 left-2">
                            {isTemporary ? (
                              <Badge className="bg-orange-500 text-white">
                                <Upload className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            ) : null}
                          </div>
                          
                          {/* Featured Badge - always show if featured */}
                          {image.is_featured && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-yellow-500 text-white shadow-lg">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                Featured
                              </Badge>
                            </div>
                          )}
                          
                          {/* Order Badge */}
                          <div className="absolute bottom-2 right-2">
                            <Badge variant="secondary" className="text-xs">
                              #{index + 1}
                            </Badge>
                          </div>
                          
                          {/* Drag Handle */}
                          <div className="absolute bottom-2 left-2 cursor-move">
                            <div className="bg-black/50 rounded p-1">
                              <GripVertical className="h-3 w-3 text-white" />
                            </div>
                          </div>
                          
                          {/* Actions Overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setEditingImage(isTemporary ? null : image as ServiceImage)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={image.is_featured ? "default" : "secondary"}
                              onClick={() => isTemporary 
                                ? handleSetFeaturedTemporary(image.id) 
                                : handleSetFeatured(image as ServiceImage)
                              }
                              disabled={image.is_featured}
                              className={image.is_featured 
                                ? 'bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500' 
                                : 'hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-300'
                              }
                              title={image.is_featured ? "This is the featured image" : "Set as featured image"}
                            >
                              <Star className={`h-4 w-4 ${image.is_featured ? 'fill-current' : ''}`} />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => isTemporary 
                                ? handleDeleteTemporaryImage(image.id)
                                : handleDeleteImage(image as ServiceImage)
                              }
                              disabled={!isTemporary && image.is_featured && images.length > 1}
                              title={!isTemporary && image.is_featured && images.length > 1 
                                ? "Cannot delete featured image. Set another image as featured first." 
                                : "Delete image"
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="p-2">
                          <p className="text-xs text-muted-foreground truncate">
                            {image.caption || "No caption"}
                          </p>
                          </div>
                        </Card>
                      </div>
                    </motion.div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Image Dialog */}
      {editingImage && (
        <ImageEditDialog
          image={editingImage}
          onSave={(updatedImage) => {
            // Check if this is a temporary image
            if ('is_temporary' in updatedImage && updatedImage.is_temporary) {
              handleUpdateTemporaryImage(updatedImage.id, updatedImage)
            } else {
              handleUpdateImage(updatedImage as ServiceImage)
            }
          }}
          onCancel={() => setEditingImage(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteImage}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
})

ServiceImageManager.displayName = 'ServiceImageManager'

export default ServiceImageManager

// Image Edit Dialog Component
interface ImageEditDialogProps {
  image: ServiceImage | TemporaryImage
  onSave: (image: ServiceImage | TemporaryImage) => void
  onCancel: () => void
}

function ImageEditDialog({ image, onSave, onCancel }: ImageEditDialogProps) {
  const [caption, setCaption] = useState(image.caption || "")
  const [altText, setAltText] = useState(image.alt_text || "")

  const handleSave = () => {
    onSave({
      ...image,
      caption: caption.trim(),
      alt_text: altText.trim()
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Edit Image</h3>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
            <div className="space-y-4">
              <div className="relative h-32 w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                {'preview' in image ? (
                  <Image
                    src={image.preview}
                    alt={altText || caption || "Temporary image"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <ServiceImage
                    src={image.image}
                    alt={altText || caption || "Service image"}
                    fill={true}
                    className="w-full h-full"
                  />
                )}
              </div>
            
            <div>
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Enter image caption..."
              />
            </div>
            
            <div>
              <Label htmlFor="altText">Alt Text</Label>
              <Input
                id="altText"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Enter alt text for accessibility..."
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
