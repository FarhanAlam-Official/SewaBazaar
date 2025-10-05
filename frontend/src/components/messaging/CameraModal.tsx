"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { showToast } from "@/components/ui/enhanced-toast"
import { 
  Camera, 
  X, 
  RotateCcw, 
  Image as ImageIcon,
  Focus,
  AlertCircle,
  FolderOpen
} from "lucide-react"

interface CameraModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (imageBlob: Blob) => void
  onImageSelect?: (file: File) => void
}

export function CameraModal({ isOpen, onClose, onCapture, onImageSelect }: CameraModalProps) {
  const [isFrontCamera, setIsFrontCamera] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

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
        onClose() // Close the camera modal after selection
        showToast.success({
          title: "Image Selected",
          description: `Selected: ${file.name}`,
        })
      }
    }
    
    input.click()
  }

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      setCameraReady(false)
      
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      const constraints = {
        video: {
          facingMode: isFrontCamera ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true)
        }
      }
    } catch (err) {
      console.error('Camera error:', err)
      setError('Could not access camera. Please check permissions.')
    }
  }, [isFrontCamera])

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraReady(false)
  }

  // Switch camera
  const switchCamera = () => {
    setIsFrontCamera(!isFrontCamera)
  }

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return

    setIsCapturing(true)
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (context && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0)

      canvas.toBlob((blob) => {
        if (blob) {
          onCapture(blob)
          onClose()
        }
        setIsCapturing(false)
      }, 'image/jpeg', 0.9)
    } else {
      setIsCapturing(false)
    }
  }

  // Handle video tap for focus
  const handleVideoTap = (e: React.MouseEvent<HTMLVideoElement>) => {
    if (!cameraReady) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setFocusPoint({ x, y })
    setTimeout(() => setFocusPoint(null), 1000)
  }

  // Handle close
  const handleClose = () => {
    stopCamera()
    onClose()
  }

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen, isFrontCamera, startCamera])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/90 to-black/70 backdrop-blur-sm z-30 border-b border-white/20 shadow-lg">
            <Button 
              onClick={handleClose} 
              variant="ghost" 
              className="text-white hover:bg-white/20 rounded-full p-3 z-30"
            >
              <X className="w-6 h-6" />
            </Button>
            <div className="text-white font-medium">Take Photo</div>
            <div className="w-12" />
          </div>

          {/* Camera Preview */}
          <div className="flex-1 relative bg-black pt-16 pb-[140px] md:pb-[160px]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover pointer-events-none"
              onClick={handleVideoTap}
            />
            
            {/* Focus indicator */}
            {focusPoint && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="absolute pointer-events-none"
                style={{
                  left: `${focusPoint.x}%`,
                  top: `${focusPoint.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="w-16 h-16 border-2 border-white rounded-full animate-pulse">
                  <Focus className="w-8 h-8 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
              </motion.div>
            )}

            {/* Loading indicator */}
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
                />
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white p-6">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                  <p className="text-lg font-medium mb-2">Camera Error</p>
                  <p className="text-sm opacity-80">{error}</p>
                  <Button 
                    onClick={startCamera}
                    className="mt-4 bg-white text-black hover:bg-gray-200"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Controls - Always Visible */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/90 to-black/70 backdrop-blur-sm z-30 min-h-[140px] md:min-h-[160px] flex flex-col justify-center border-t border-white/30 shadow-2xl">
            <div className="flex items-center justify-center gap-4 md:gap-8">
              {/* Gallery Button */}
              <Button
                variant="ghost"
                onClick={openGallery}
                className="text-white hover:bg-white/20 rounded-full p-3 z-30 transition-all duration-200 hover:scale-105 active:scale-95"
                title="Select from gallery"
              >
                <FolderOpen className="w-6 h-6" />
              </Button>

              {/* Capture Button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={capturePhoto}
                  disabled={!cameraReady || isCapturing}
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-full p-0 z-30 ${
                    cameraReady && !isCapturing
                      ? 'bg-white hover:bg-gray-200 text-black'
                      : 'bg-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isCapturing ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-2 border-black border-t-transparent rounded-full"
                    />
                  ) : (
                    <Camera className="w-8 h-8 md:w-10 md:h-10" />
                  )}
                </Button>
              </motion.div>

              {/* Switch Camera Button */}
              <Button
                onClick={switchCamera}
                variant="ghost"
                className="text-white hover:bg-white/20 rounded-full p-3 z-30"
                disabled={!cameraReady}
              >
                <RotateCcw className="w-6 h-6" />
              </Button>
            </div>

            {/* Tips */}
            <div className="text-center mt-4">
              <p className="text-xs text-white/80 font-medium">
                Tap to focus • Switch camera with rotate button
              </p>
              <div className="flex items-center justify-center mt-2">
                <div className="w-1 h-1 bg-white/60 rounded-full mx-1 animate-pulse"></div>
                <div className="w-1 h-1 bg-white/60 rounded-full mx-1 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-1 h-1 bg-white/60 rounded-full mx-1 animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>

          {/* Hidden Canvas */}
          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
