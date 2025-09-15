"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { 
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, 
  Download, Share2, RotateCw, Maximize2, Minimize2,
  Heart, Star, ImageIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface GalleryImage {
  id: number | string
  image: string
  caption?: string
  alt_text?: string
  is_featured?: boolean
  order?: number
}

interface ImageGalleryProps {
  images: GalleryImage[]
  isOpen: boolean
  onClose: () => void
  initialIndex?: number
  serviceTitle?: string
}

export function ImageGallery({ 
  images, 
  isOpen, 
  onClose, 
  initialIndex = 0,
  serviceTitle 
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isZoomed, setIsZoomed] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // Update current index when initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      setIsZoomed(false)
      setImageLoading(true)
    }
  }, [initialIndex, isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          e.preventDefault()
          navigatePrevious()
          break
        case 'ArrowRight':
          e.preventDefault()
          navigateNext()
          break
        case ' ':
          e.preventDefault()
          toggleZoom()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isOpen, currentIndex])

  const navigateNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
    setImageLoading(true)
    setIsZoomed(false)
  }

  const navigatePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    setImageLoading(true)
    setIsZoomed(false)
  }

  const toggleZoom = () => {
    setIsZoomed(!isZoomed)
  }

  const currentImage = images[currentIndex]

  if (!isOpen || !images.length) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-6">
          <div className="flex items-center justify-between text-white">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1">
                {serviceTitle || 'Service Gallery'}
              </h2>
              <p className="text-sm text-white/70">
                Image {currentIndex + 1} of {images.length}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {currentImage?.is_featured && (
                <Badge className="bg-yellow-500/20 text-yellow-200 border-yellow-500/30">
                  <Star className="h-3 w-3 mr-1 fill-yellow-400" />
                  Featured
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleZoom()
                }}
              >
                {isZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation()
                  // Add share functionality
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Image Container */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: isZoomed ? 1.5 : 1,
              transition: { duration: 0.3 }
            }}
            className={cn(
              "relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center",
              isZoomed && "cursor-zoom-out overflow-auto"
            )}
            onClick={isZoomed ? toggleZoom : undefined}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4 text-white">
                    <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full" />
                    <ImageIcon className="h-12 w-12 text-white/50" />
                  </div>
                </div>
              )}
              
              <Image
                src={currentImage?.image || '/placeholder.svg'}
                alt={currentImage?.alt_text || currentImage?.caption || `Gallery image ${currentIndex + 1}`}
                width={1200}
                height={800}
                className={cn(
                  "max-w-full max-h-full object-contain transition-opacity duration-300",
                  imageLoading ? "opacity-0" : "opacity-100",
                  !isZoomed && "cursor-zoom-in"
                )}
                onLoadingComplete={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
                onClick={!isZoomed ? toggleZoom : undefined}
                priority
                unoptimized={currentImage?.image?.startsWith('http')}
              />
            </div>
          </motion.div>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="lg"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 rounded-full"
              onClick={(e) => {
                e.stopPropagation()
                navigatePrevious()
              }}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 rounded-full"
              onClick={(e) => {
                e.stopPropagation()
                navigateNext()
              }}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <div className="flex items-center justify-center gap-2 overflow-x-auto max-w-full">
              <div className="flex gap-2 px-4">
                {images.map((img, index) => (
                  <motion.button
                    key={img.id}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentIndex(index)
                      setImageLoading(true)
                      setIsZoomed(false)
                    }}
                    className={cn(
                      "relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 flex-shrink-0",
                      index === currentIndex 
                        ? "border-white ring-2 ring-white/50" 
                        : "border-white/30 hover:border-white/60"
                    )}
                  >
                    <Image
                      src={img.image}
                      alt={img.alt_text || `Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized={img.image.startsWith('http')}
                    />
                    {img.is_featured && (
                      <div className="absolute top-1 right-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Image Caption */}
        {currentImage?.caption && (
          <div className="absolute bottom-20 left-6 right-6 text-center">
            <motion.p
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white/90 bg-black/50 rounded-lg px-4 py-2 backdrop-blur-sm"
            >
              {currentImage.caption}
            </motion.p>
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        <div className="absolute bottom-6 right-6 text-white/60 text-xs space-y-1">
          <div>Press ESC to close</div>
          <div>Arrow keys to navigate</div>
          <div>Space to zoom</div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}