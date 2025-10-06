"use client"

import { useState } from "react"
import Image from "next/image"

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  onError?: (e: any) => void
  onLoad?: () => void
  onClick?: () => void
}

export function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  className, 
  onError, 
  onLoad, 
  onClick 
}: OptimizedImageProps) {
  const [useFallback, setUseFallback] = useState(false)

  const handleError = (e: any) => {
    console.log('Next.js Image failed, falling back to regular img tag')
    setUseFallback(true)
    onError?.(e)
  }

  if (useFallback) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={onError}
        onLoad={onLoad}
        onClick={onClick}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      onLoad={onLoad}
      onClick={onClick}
      unoptimized={true} // Disable optimization for local backend images
    />
  )
}
