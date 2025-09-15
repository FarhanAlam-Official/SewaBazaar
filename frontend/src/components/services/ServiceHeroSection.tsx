"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { 
  Heart, Share2, Play, ZoomIn, Grid3X3, Award, Verified, 
  Crown, Diamond, Sparkles, Eye, TrendingUp, Star,
  ImageIcon, Camera, Video, Maximize2, Bookmark,
  MapPin, Clock, Shield, CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ServiceHeroProps } from '@/types/service-detail'
import { cn } from '@/lib/utils'

interface ServiceHeroComponentProps extends ServiceHeroProps {
  viewCount?: number
  recentBookings?: number
  onShare: () => void
  onVideoPlay?: () => void
  onBookNow?: () => void
  className?: string
}

export function ServiceHeroSection({ 
  service, 
  onImageGalleryOpen, 
  onVideoPlay, 
  onFavoriteToggle, 
  isFavorited,
  onShare,
  onBookNow,
  viewCount = 0,
  recentBookings = 0,
  className 
}: ServiceHeroComponentProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  // Get the main display image
  const mainImage = service.gallery_images?.find(img => img.is_hero) || 
                   service.gallery_images?.[0] || 
                   { image: service.hero_image || '/placeholder.svg', alt_text: service.title }

  // Calculate discount percentage if applicable
  const hasDiscount = service.packages?.some(pkg => pkg.original_price && pkg.original_price > pkg.price)
  const maxDiscount = hasDiscount ? 
    Math.max(...service.packages
      .filter(pkg => pkg.original_price && pkg.original_price > pkg.price)
      .map(pkg => Math.round(((pkg.original_price! - pkg.price) / pkg.original_price!) * 100))
    ) : 0

  const startingPrice = Math.min(...service.packages.map(pkg => pkg.price))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className={cn("relative", className)}
    >
      {/* Live Activity Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 border border-emerald-200/50 dark:border-emerald-700/50 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-center gap-6 text-sm">
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"
          >
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <Eye className="h-4 w-4" />
            <span className="font-medium">{viewCount} viewing now</span>
          </motion.div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">{recentBookings} booked today</span>
          </div>
          {service.is_verified_provider && (
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Verified className="h-4 w-4" />
              <span className="font-medium">Verified Pro</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Enhanced Image Gallery - Left Side */}
        <div className="lg:col-span-8">
          <div className="space-y-4">
            {/* Main Image with Floating Elements */}
            <div className="relative group cursor-pointer" onClick={() => onImageGalleryOpen(activeImageIndex)}>
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 shadow-2xl">
                <Image
                  src={mainImage.image}
                  alt={mainImage.alt_text || service.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  onLoadingComplete={() => setImageLoading(false)}
                  onError={() => setImageError(true)}
                  priority
                  unoptimized={mainImage.image.startsWith('http')}
                />
                
                {/* Glassmorphism overlay on hover */}
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                  <div className="text-white bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-2">
                      <ZoomIn className="h-4 w-4" />
                      Click to view gallery
                    </div>
                  </div>
                </div>
                
                {/* Floating Badges */}
                <div className="absolute top-6 left-6 flex flex-col gap-3">
                  {hasDiscount && (
                    <motion.div
                      initial={{ scale: 0, rotate: -12 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-xl border border-red-400/50"
                    >
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        {maxDiscount}% OFF
                      </div>
                    </motion.div>
                  )}
                  
                  {service.is_verified_provider && (
                    <motion.div
                      initial={{ scale: 0, rotate: 12 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-xl border border-emerald-400/50"
                    >
                      <div className="flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        Premium Pro
                      </div>
                    </motion.div>
                  )}

                  {service.instant_delivery_available && (
                    <motion.div
                      initial={{ scale: 0, rotate: -8 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-r from-violet-500 via-purple-600 to-violet-700 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-xl border border-violet-400/50"
                    >
                      <div className="flex items-center gap-1">
                        <Diamond className="h-3 w-3" />
                        Express
                      </div>
                    </motion.div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="absolute top-6 right-6 flex flex-col gap-3">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/90 hover:bg-white backdrop-blur-sm shadow-xl border border-white/50 text-slate-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        onImageGalleryOpen(0)
                      }}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/90 hover:bg-white backdrop-blur-sm shadow-xl border border-white/50 text-slate-700"
                      onClick={() => window.open(mainImage.image, '_blank')}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </motion.div>

                  {service.video_url && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/90 hover:bg-white backdrop-blur-sm shadow-xl border border-white/50 text-slate-700"
                        onClick={onVideoPlay}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}
                </div>

                {/* Image Loading State */}
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    <div className="animate-pulse">
                      <ImageIcon className="h-12 w-12 text-slate-400" />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Enhanced Thumbnail Gallery */}
              {service.gallery_images && service.gallery_images.length > 1 && (
                <div className="grid grid-cols-5 gap-3 mt-4">
                  {service.gallery_images.slice(0, 5).map((img, index) => (
                    <motion.button
                      key={img.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setActiveImageIndex(index)
                        onImageGalleryOpen(index)
                      }}
                      className={cn(
                        "relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 group",
                        activeImageIndex === index 
                          ? 'border-violet-500 ring-4 ring-violet-200 dark:ring-violet-800 shadow-lg' 
                          : 'border-slate-200 dark:border-slate-700 hover:border-violet-300 hover:shadow-md'
                      )}
                    >
                      <Image
                        src={img.image}
                        alt={img.alt_text || `Gallery ${index + 1}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        unoptimized={img.image.startsWith('http')}
                      />
                      {/* Gallery Icon Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Grid3X3 className="h-5 w-5 text-white" />
                      </div>
                      {/* More Images Indicator */}
                      {index === 4 && service.gallery_images!.length > 5 && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                          <span className="font-bold text-lg">+{service.gallery_images!.length - 5}</span>
                          <span className="text-xs">more</span>
                        </div>
                      )}
                      {/* Featured Badge */}
                      {img.is_hero && (
                        <div className="absolute top-1 right-1 bg-yellow-500/90 rounded-full p-1">
                          <Star className="h-3 w-3 text-white fill-white" />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              )}
              
              {/* View All Gallery Button */}
              {service.gallery_images && service.gallery_images.length > 5 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onImageGalleryOpen(0)}
                  className="mt-3 w-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20 border border-violet-200 dark:border-violet-700 rounded-xl py-3 px-4 transition-all duration-300"
                >
                  <div className="flex items-center justify-center gap-2 text-violet-600 dark:text-violet-400">
                    <Grid3X3 className="h-4 w-4" />
                    <span className="font-medium">View All {service.gallery_images.length} Images</span>
                  </div>
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Service Overview - Right Side */}
        <div className="lg:col-span-4">
          <div className="sticky top-24">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
              <CardContent className="p-8 space-y-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                  <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200 px-3 py-1 text-sm font-medium">
                    {service.category.title}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={onFavoriteToggle}
                        className={cn(
                          "border-slate-200 hover:border-red-300",
                          isFavorited && "border-red-300 bg-red-50 text-red-600"
                        )}
                      >
                        <Heart className={cn("h-4 w-4", isFavorited && "fill-red-500 text-red-500")} />
                      </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <Button variant="outline" size="sm" onClick={onShare}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
                
                {/* Rating */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-lg">{typeof service.average_rating === 'number' ? service.average_rating.toFixed(1) : '0.0'}</span>
                  </div>
                  <span className="text-slate-600 dark:text-slate-400">
                    ({service.reviews_count.toLocaleString()} reviews)
                  </span>
                  {service.reviews_count > 100 && (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      Bestseller
                    </Badge>
                  )}
                </div>
                
                {/* Title and Tagline */}
                <div className="space-y-3">
                  <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                    {service.title}
                  </h1>
                  {service.tagline && (
                    <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                      {service.tagline}
                    </p>
                  )}
                  <p className="text-slate-600 dark:text-slate-300">
                    {service.short_description}
                  </p>
                </div>
                
                {/* Pricing Display */}
                <div className="space-y-4">
                  <div className="flex items-baseline gap-3">
                    <div className="text-3xl font-bold text-violet-600 dark:text-violet-400">
                      {service.currency} {startingPrice.toLocaleString()}
                    </div>
                    <span className="text-slate-500">starting from</span>
                  </div>
                  
                  {hasDiscount && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        {maxDiscount}% OFF
                      </Badge>
                      <span className="text-emerald-600 font-semibold">
                        Limited time offer!
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Key Features */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{service.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <MapPin className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm">{service.service_location_type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Shield className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Insured</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm">{service.completion_rate}% success</span>
                  </div>
                </div>
                
                {/* Trust Indicators */}
                <div className="space-y-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Total Orders</span>
                    <span className="font-semibold">{service.total_orders.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Completion Rate</span>
                    <span className="font-semibold text-emerald-600">{service.completion_rate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Response Time</span>
                    <span className="font-semibold">{service.response_time}</span>
                  </div>
                </div>
                
                {/* Book Now Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="pt-6 border-t border-slate-200/50 dark:border-slate-700/50"
                >
                  <Button
                    onClick={onBookNow}
                    size="lg"
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    <motion.div
                      className="flex items-center justify-center gap-2"
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>Book Now</span>
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        →
                      </motion.div>
                    </motion.div>
                  </Button>
                  
                  {/* Quick Action Subtext */}
                  <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3 text-emerald-500" />
                      <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-blue-500" />
                      <span>Instant Booking</span>
                    </div>
                  </div>
                </motion.div>
                
                {/* Tags */}
                {service.tags && service.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {service.tags.slice(0, 4).map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs hover:bg-violet-100 hover:text-violet-800 cursor-pointer transition-colors"
                      >
                        #{tag}
                      </Badge>
                    ))}
                    {service.tags.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{service.tags.length - 4} more
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  )
}