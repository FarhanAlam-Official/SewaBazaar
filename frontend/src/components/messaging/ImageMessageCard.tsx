"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Share2, 
  Eye, 
  EyeOff, 
  MoreVertical,
  ImageIcon,
  Maximize2,
  X,
  Copy,
  ExternalLink,
  FolderOpen,
  Image as ImageIcon2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { showToast } from "@/components/ui/enhanced-toast"

interface ImageMessageCardProps {
  imageUrl: string
  fileName?: string
  fileSize?: number
  isOwn?: boolean
  timestamp?: string
  onError?: (error: string) => void
  onImageSelect?: (file: File) => void
}

export function ImageMessageCard({ 
  imageUrl, 
  fileName, 
  fileSize, 
  isOwn = false, 
  timestamp,
  onError,
  onImageSelect
}: ImageMessageCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [imageNaturalDimensions, setImageNaturalDimensions] = useState({ width: 0, height: 0 })
  const [isImageVisible, setIsImageVisible] = useState(true)
  
  const imageRef = useRef<HTMLImageElement>(null)

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get image type from URL
  const getImageType = (url: string | null | undefined) => {
    if (!url || typeof url !== 'string') return 'Unknown'
    const ext = url.split('.').pop()?.toLowerCase()
    const types: Record<string, string> = {
      'jpg': 'JPEG',
      'jpeg': 'JPEG',
      'png': 'PNG',
      'gif': 'GIF',
      'webp': 'WebP',
      'svg': 'SVG',
      'bmp': 'BMP'
    }
    return types[ext || ''] || 'Image'
  }

  // Handle image load
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setImageNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight })
    setIsLoading(false)
  }

  // Handle image error
  const handleImageError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.("Failed to load image")
  }

  // Generate a proper filename for downloads
  const generateFileName = () => {
    // If we have a custom fileName, use it
    if (fileName && fileName.trim()) {
      const hasExtension = fileName.includes('.')
      if (hasExtension) {
        return fileName
      } else {
        // Add appropriate extension
        const ext = getImageType(imageUrl).toLowerCase()
        return `${fileName}.${ext === 'jpeg' ? 'jpg' : ext}`
      }
    }
    
    // Generate a meaningful name based on context
    const imageType = getImageType(imageUrl).toLowerCase()
    const ext = imageType === 'jpeg' ? 'jpg' : imageType
    
    // Use timestamp to create a readable date
    let dateStr = 'unknown-date'
    if (timestamp) {
      try {
        const date = new Date(timestamp)
        dateStr = date.toISOString().slice(0, 19).replace(/[T:]/g, '-')
      } catch {
        dateStr = Date.now().toString()
      }
    }
    
    return `SewaBazaar-Image-${dateStr}.${ext}`
  }

  // Download image
  const downloadImage = async () => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = generateFileName()
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      showToast.success({
        title: "Download Started",
        description: `Downloading as: ${generateFileName()}`,
      })
    } catch (error) {
      showToast.error({
        title: "Download Failed", 
        description: "Unable to download the image",
      })
    }
  }

  // Copy image to clipboard
  const copyImageUrl = async () => {
    try {
      // Check if ClipboardItem is supported
      if (!window.ClipboardItem) {
        throw new Error('ClipboardItem not supported')
      }
      
      // Try to copy the actual image to clipboard first
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch image')
      }
      
      const blob = await response.blob()
      
      // Create a clipboard item with the image
      const clipboardItem = new ClipboardItem({
        [blob.type]: blob
      })
      
      await navigator.clipboard.write([clipboardItem])
      
      showToast.success({
        title: "Image Copied ✓",
        description: "Image copied to clipboard - you can paste it anywhere!",
      })
    } catch (error) {
      console.log('Image copy failed, falling back to URL:', error)
      
      // Fallback to copying URL if image copy fails
      try {
        await navigator.clipboard.writeText(imageUrl)
        showToast.success({
          title: "URL Copied ✓",
          description: "Image URL copied to clipboard (image copy not supported in this browser)",
        })
      } catch (urlError) {
        showToast.error({
          title: "Copy Failed",
          description: "Unable to copy image or URL. Please try downloading the image instead.",
        })
      }
    }
  }

  // Open in new tab
  const openInNewTab = () => {
    window.open(imageUrl, '_blank')
  }

  // Share image (if supported)
  const shareImage = async () => {
    if (navigator.share) {
      try {
        // Try to share the actual image file first
        const response = await fetch(imageUrl)
        if (!response.ok) {
          throw new Error('Failed to fetch image')
        }
        
        const blob = await response.blob()
        const file = new File([blob], generateFileName(), { type: blob.type })
        
        await navigator.share({
          title: 'Shared Image from SewaBazaar',
          text: 'Check out this image from our conversation',
          files: [file]
        })
        
        showToast.success({
          title: "Image Shared ✓",
          description: "Image file shared successfully!",
        })
      } catch (error) {
        console.log('File sharing failed, falling back to URL sharing:', error)
        
        // Fallback to URL sharing if file sharing fails
        try {
          await navigator.share({
            title: 'Shared Image from SewaBazaar',
            text: 'Check out this image from our conversation',
            url: imageUrl
          })
          showToast.success({
            title: "URL Shared ✓",
            description: "Image URL shared successfully (file sharing not supported)",
          })
        } catch (urlError) {
          console.log('URL sharing failed, falling back to copy:', urlError)
          // Final fallback to copy image to clipboard
          copyImageUrl()
        }
      }
    } else {
      // If Web Share API is not supported, copy image to clipboard
      showToast.info({
        title: "Share Not Supported",
        description: "Native sharing not available, copying image to clipboard instead",
      })
      copyImageUrl()
    }
  }

  // Open gallery to select image
  const openGallery = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = false
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          showToast.error({
            title: "File Too Large",
            description: "Please select an image smaller than 10MB",
          })
          return
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          showToast.error({
            title: "Invalid File Type",
            description: "Please select a valid image file",
          })
          return
        }
        
        onImageSelect?.(file)
        showToast.success({
          title: "Image Selected",
          description: `Selected: ${file.name}`,
        })
      }
    }
    
    input.click()
  }

  // Reset zoom and rotation
  const resetImageTransform = () => {
    setZoom(1)
    setRotation(0)
  }

  // Calculate responsive display dimensions
  const calculateDisplaySize = () => {
    // Responsive container sizes
    const breakpoints = {
      mobile: { width: 280, height: 210 },    // sm screens
      tablet: { width: 320, height: 240 },    // md screens  
      desktop: { width: 400, height: 300 }    // lg+ screens
    }
    
    // Default to mobile size
    const containerWidth = 320
    const containerHeight = 240
    
    if (!imageNaturalDimensions.width || !imageNaturalDimensions.height) {
      return { 
        containerWidth, 
        containerHeight,
        breakpoints
      }
    }
    
    const aspectRatio = imageNaturalDimensions.width / imageNaturalDimensions.height
    
    let width = containerWidth
    let height = width / aspectRatio
    
    if (height > containerHeight) {
      height = containerHeight
      width = height * aspectRatio
    }
    
    return { 
      containerWidth, 
      containerHeight, 
      breakpoints,
      imageWidth: Math.round(width), 
      imageHeight: Math.round(height) 
    }
  }

  const displaySize = calculateDisplaySize()

  return (
    <motion.div 
      className={`
        relative group rounded-2xl overflow-hidden backdrop-blur-sm border
        w-[280px] sm:w-[320px] lg:w-[400px] max-w-full
        ${isOwn 
          ? 'bg-gradient-to-br from-blue-500/10 to-purple-600/10 border-blue-500/20 shadow-lg shadow-blue-500/10' 
          : 'bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-800/95 dark:to-gray-900/95 border-gray-200/50 dark:border-gray-700/50 shadow-lg shadow-black/5'
        }
      `}
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      onHoverStart={() => setShowControls(true)}
      onHoverEnd={() => setShowControls(false)}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isOwn ? 'bg-blue-500/10' : 'bg-blue-500/10'}`}>
              <ImageIcon className={`w-4 h-4 ${isOwn ? 'text-blue-600' : 'text-blue-600'}`} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${isOwn ? 'text-gray-900 dark:text-gray-100' : 'text-gray-900 dark:text-gray-100'}`}>
                {fileName || 'Image'}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {getImageType(imageUrl)}
                </Badge>
                {fileSize && (
                  <span className="text-xs text-gray-500">
                    {formatFileSize(fileSize)}
                  </span>
                )}
                {imageNaturalDimensions.width > 0 && (
                  <span className="text-xs text-gray-500">
                    {imageNaturalDimensions.width} × {imageNaturalDimensions.height}
                  </span>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Image Display Area */}
      <div className="relative">
        {isImageVisible && (
          <div 
            className="relative bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden
                       h-[210px] sm:h-[240px] lg:h-[300px] w-full"
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
                />
              </div>
            )}

            {hasError ? (
              <div className="flex flex-col items-center justify-center p-6 text-gray-500">
                <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">Failed to load image</p>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHasError(false)
                      setIsLoading(true)
                    }}
                  >
                    Retry
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(imageUrl, '_blank')}
                  >
                    Open Direct
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <Image
                  ref={imageRef}
                  src={imageUrl}
                  alt={fileName || "Message image"}
                  fill
                  sizes="(max-width: 640px) 280px, (max-width: 768px) 320px, 400px"
                  className={`
                    object-contain transition-all duration-300 cursor-pointer
                    ${isLoading ? 'opacity-0' : 'opacity-100'}
                    group-hover:brightness-110
                  `}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  onClick={() => setIsFullscreen(true)}
                  unoptimized={imageUrl.startsWith('blob:') || imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')}
                  priority={false}
                />
                
                {/* Zoom overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all duration-200">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 bg-white/90 text-gray-900 hover:bg-white transform scale-95 group-hover:scale-100 transition-all duration-200"
                    onClick={() => setIsFullscreen(true)}
                  >
                    <Maximize2 className="w-4 h-4 mr-2" />
                    View Full Size
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {!isImageVisible && (
          <div 
            className="flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800
                       h-[210px] sm:h-[240px] lg:h-[300px] w-full"
          >
            <EyeOff className="w-12 h-12 mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Image hidden</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImageVisible(true)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Show Image
            </Button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="p-2 sm:p-3 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={downloadImage}
                    className="h-7 sm:h-8 px-1.5 sm:px-2 text-xs transition-all duration-200 hover:scale-105 active:scale-95 text-gray-600 hover:text-white hover:bg-blue-500 dark:text-gray-400 dark:hover:text-white dark:hover:bg-blue-500 rounded-md hover:shadow-md"
                    title="Download image"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    <span className="hidden xs:inline">Download</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={shareImage}
                    className="h-7 sm:h-8 px-1.5 sm:px-2 text-xs transition-all duration-200 hover:scale-105 active:scale-95 text-gray-600 hover:text-white hover:bg-emerald-500 dark:text-gray-400 dark:hover:text-white dark:hover:bg-emerald-500 rounded-md hover:shadow-md"
                    title="Share image file (falls back to URL or copy if not supported)"
                  >
                    <Share2 className="w-3 h-3 mr-1" />
                    <span className="hidden xs:inline">Share</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsImageVisible(!isImageVisible)}
                    className="h-7 sm:h-8 px-1.5 sm:px-2 text-xs transition-all duration-200 hover:scale-105 active:scale-95 text-gray-600 hover:text-white hover:bg-amber-500 dark:text-gray-400 dark:hover:text-white dark:hover:bg-amber-500 rounded-md hover:shadow-md"
                    title={isImageVisible ? "Hide image" : "Show image"}
                  >
                    {isImageVisible ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                    <span className="hidden xs:inline">{isImageVisible ? "Hide" : "Show"}</span>
                  </Button>
                </div>

                <div className="flex items-center gap-0.5 sm:gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyImageUrl}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95 text-gray-600 hover:text-white hover:bg-orange-500 dark:text-gray-400 dark:hover:text-white dark:hover:bg-orange-500 rounded-md hover:shadow-md"
                    title="Copy image to clipboard (falls back to URL if not supported)"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openInNewTab}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95 text-gray-600 hover:text-white hover:bg-violet-500 dark:text-gray-400 dark:hover:text-white dark:hover:bg-violet-500 rounded-md hover:shadow-md"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Modal */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="w-[95vw] h-[85vh] sm:w-[85vw] sm:h-[80vh] md:w-[75vw] md:h-[75vh] lg:max-w-4xl lg:max-h-[700px] xl:max-w-5xl xl:max-h-[800px] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              {fileName || 'Image Viewer'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative flex-1 bg-gray-50 dark:bg-gray-900 min-h-[300px] sm:min-h-[400px] md:min-h-[500px] max-h-[75vh] overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <Image
                src={imageUrl}
                alt={fileName || "Message image"}
                width={imageNaturalDimensions.width}
                height={imageNaturalDimensions.height}
                sizes="(max-width: 768px) 100vw, 80vw"
                className={`
                  max-w-full max-h-full object-contain transition-transform duration-300
                `}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`
                }}
                unoptimized={imageUrl.startsWith('blob:') || imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')}
                priority={false}
              />
            </div>
            
            {/* Fullscreen Controls */}
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-sm text-white rounded-lg sm:rounded-xl p-2 sm:p-3 flex items-center gap-1 sm:gap-2 shadow-2xl flex-wrap justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-white hover:text-gray-900 hover:bg-white rounded transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-white/20 disabled:hover:text-white"
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              
              <span className="text-xs sm:text-sm px-1 sm:px-2 font-medium min-w-[35px] sm:min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-white hover:text-gray-900 hover:bg-white rounded transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-white/20 disabled:hover:text-white"
                disabled={zoom >= 3}
              >
                <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              
              <div className="w-px h-4 sm:h-6 bg-white/30 mx-0.5 sm:mx-1" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRotation((prev) => prev + 90)}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-white hover:text-gray-900 hover:bg-white rounded transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
              >
                <RotateCw className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={resetImageTransform}
                className="h-7 sm:h-8 px-1.5 sm:px-2 text-xs sm:text-sm text-white hover:text-gray-900 hover:bg-white rounded transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
              >
                Reset
              </Button>
              
              <div className="w-px h-4 sm:h-6 bg-white/30 mx-0.5 sm:mx-1" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={openGallery}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-white hover:text-gray-900 hover:bg-white rounded transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
                title="Select from gallery"
              >
                <FolderOpen className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadImage}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-white hover:text-gray-900 hover:bg-white rounded transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
                title="Download"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}