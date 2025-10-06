"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { showToast } from "@/components/ui/enhanced-toast"
import { 
  Upload, 
  X, 
  FileText, 
  Image as ImageIcon,
  File,
  Paperclip
} from "lucide-react"
import Image from "next/image"

interface FileUploadProps {
  onFileSelect: (files: File[]) => void
  maxFiles?: number
  maxSizePerFile?: number // in MB
  acceptedTypes?: string[]
  className?: string
}

interface SelectedFile {
  file: File
  preview?: string
  progress?: number
}

export function FileUpload({
  onFileSelect,
  maxFiles = 5,
  maxSizePerFile = 10, // 10MB default
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.txt'],
  className = ""
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelection = (files: FileList | null) => {
    if (!files) return

    const newFiles: SelectedFile[] = []
    const maxSizeBytes = maxSizePerFile * 1024 * 1024

    for (let i = 0; i < files.length && selectedFiles.length + newFiles.length < maxFiles; i++) {
      const file = files[i]

      // Check file size
      if (file.size > maxSizeBytes) {
        showToast.error({
          title: "File too large",
          description: `${file.name} exceeds ${maxSizePerFile}MB limit`
        })
        continue
      }

      // Check file type
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase())
        }
        return file.type.match(type.replace('*', '.*'))
      })

      if (!isAccepted) {
        showToast.error({
          title: "Invalid file type",
          description: `${file.name} is not an accepted file type`
        })
        continue
      }

      // Create preview for images
      let preview = undefined
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file)
      }

      newFiles.push({ file, preview })
    }

    const updatedFiles = [...selectedFiles, ...newFiles]
    setSelectedFiles(updatedFiles)
    onFileSelect(updatedFiles.map(sf => sf.file))
  }

  const removeFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(updatedFiles)
    onFileSelect(updatedFiles.map(sf => sf.file))

    // Cleanup preview URLs
    const removedFile = selectedFiles[index]
    if (removedFile.preview) {
      URL.revokeObjectURL(removedFile.preview)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return ImageIcon
    if (file.type === 'application/pdf') return FileText
    return File
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={className}>
      {/* Upload area */}
      <motion.div
        className={`
          border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer
          ${isDragging ? 'border-primary bg-gradient-to-br from-primary/10 to-accent/10 scale-105 shadow-xl' : 'border-muted-foreground/25 hover:border-primary/50'}
          ${selectedFiles.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gradient-to-br hover:from-primary/5 hover:to-accent/5 hover:shadow-lg'}
        `}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          if (selectedFiles.length < maxFiles) {
            handleFileSelection(e.dataTransfer.files)
          }
        }}
        onClick={() => {
          if (selectedFiles.length < maxFiles) {
            fileInputRef.current?.click()
          }
        }}
        whileHover={{ scale: selectedFiles.length >= maxFiles ? 1 : 1.02 }}
        whileTap={{ scale: selectedFiles.length >= maxFiles ? 1 : 0.98 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFileSelection(e.target.files)}
        />

        <motion.div 
          className="flex flex-col items-center gap-4"
          animate={isDragging ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
        >
          <motion.div 
            className="flex items-center gap-3"
            animate={isDragging ? { rotate: [0, 5, -5, 0] } : {}}
            transition={{ duration: 1, repeat: isDragging ? Infinity : 0 }}
          >
            <Upload className="w-8 h-8 text-primary" />
            <Paperclip className="w-6 h-6 text-accent" />
          </motion.div>
          
          <div>
            <p className="text-lg font-semibold text-foreground mb-2">
              {selectedFiles.length >= maxFiles 
                ? `Maximum ${maxFiles} files reached`
                : isDragging 
                  ? 'Drop files here!'
                  : 'Drop files here or click to browse'
              }
            </p>
            <p className="text-sm text-muted-foreground">
              Up to {maxFiles} files, {maxSizePerFile}MB each
            </p>
            {isDragging && (
              <motion.p 
                className="text-primary font-medium mt-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                Release to upload
              </motion.p>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Selected files */}
      {selectedFiles.length > 0 && (
        <motion.div 
          className="mt-6 space-y-3"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Paperclip className="w-5 h-5 text-primary" />
            <p className="text-base font-semibold text-foreground">
              Selected Files ({selectedFiles.length}/{maxFiles})
            </p>
          </div>
          
          <div className="space-y-3">
            {selectedFiles.map((selectedFile, index) => {
              const FileIcon = getFileIcon(selectedFile.file)
              
              return (
                <motion.div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-muted/50 to-muted/30 backdrop-blur-sm rounded-xl border border-border/50 shadow-lg hover:shadow-xl transition-all duration-200"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  {/* File preview/icon */}
                  <div className="flex-shrink-0">
                    {selectedFile.preview ? (
                      <div className="w-12 h-12 relative rounded-lg overflow-hidden shadow-md">
                        <Image
                          src={selectedFile.preview}
                          alt={selectedFile.file.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center shadow-md">
                        <FileIcon className="w-6 h-6 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground">
                      {selectedFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {formatFileSize(selectedFile.file.size)}
                    </p>
                    
                    {/* Upload progress */}
                    {selectedFile.progress !== undefined && (
                      <div className="mt-2">
                        <Progress 
                          value={selectedFile.progress} 
                          className="h-2 bg-muted/50"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedFile.progress}% uploaded
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Remove button */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}