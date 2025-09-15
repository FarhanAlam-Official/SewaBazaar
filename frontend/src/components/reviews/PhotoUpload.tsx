import { useState, useRef, ChangeEvent } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera, X, Upload, Image as ImageIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface PhotoUploadProps {
  onPhotosChange: (photos: File[]) => void
  maxPhotos?: number
  maxSizeMB?: number
}

export function PhotoUpload({ 
  onPhotosChange, 
  maxPhotos = 5, 
  maxSizeMB = 5 
}: PhotoUploadProps) {
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const files = e.target.files
    if (!files) return

    const newPhotos = Array.from(files)
    const totalPhotos = photos.length + newPhotos.length

    // Check max photos limit
    if (totalPhotos > maxPhotos) {
      setError(`You can only upload up to ${maxPhotos} photos`)
      return
    }

    // Check file sizes
    const oversizedFiles = newPhotos.filter(file => file.size > maxSizeMB * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setError(`Each photo must be smaller than ${maxSizeMB}MB`)
      return
    }

    // Check file types
    const invalidFiles = newPhotos.filter(file => !file.type.startsWith('image/'))
    if (invalidFiles.length > 0) {
      setError('Only image files are allowed')
      return
    }

    // Create previews
    const newPreviews = newPhotos.map(file => URL.createObjectURL(file))

    setPhotos(prev => [...prev, ...newPhotos])
    setPreviews(prev => [...prev, ...newPreviews])
    onPhotosChange([...photos, ...newPhotos])
  }

  const removePhoto = (index: number) => {
    const newPhotos = [...photos]
    const newPreviews = [...previews]
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(newPreviews[index])
    
    newPhotos.splice(index, 1)
    newPreviews.splice(index, 1)
    
    setPhotos(newPhotos)
    setPreviews(newPreviews)
    onPhotosChange(newPhotos)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
        <label className="text-sm font-medium">Add Photos (Optional)</label>
        <span className="text-xs text-muted-foreground">
          ({photos.length}/{maxPhotos})
        </span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
        {/* Photo previews */}
        <AnimatePresence>
          {previews.map((preview, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="relative aspect-square"
            >
              <Card className="h-full overflow-hidden">
                <CardContent className="p-0 relative h-full">
                  <img
                    src={preview}
                    alt={`Review photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-5 w-5 md:h-6 md:w-6 rounded-full"
                  >
                    <X className="h-2 w-2 md:h-3 md:w-3" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Upload button */}
        {photos.length < maxPhotos && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="aspect-square border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer flex flex-col items-center justify-center transition-colors p-2"
              onClick={triggerFileInput}
            >
              <CardContent className="p-0 flex flex-col items-center justify-center h-full">
                <Upload className="h-4 w-4 md:h-6 md:w-6 text-muted-foreground mb-1 md:mb-2" />
                <span className="text-xs text-muted-foreground text-center px-1">
                  Add Photo
                </span>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />
      
      {/* Error message */}
      {error && (
        <motion.p 
          className="text-sm text-destructive"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
      
      {/* Info text */}
      <p className="text-xs text-muted-foreground">
        JPG, PNG up to {maxSizeMB}MB each
      </p>
    </div>
  )
}