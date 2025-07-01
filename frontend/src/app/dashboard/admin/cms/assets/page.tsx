"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataGrid } from "@/components/ui/data-grid"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Image as ImageIcon,
  File,
  FileText,
  FileVideo,
  Upload,
  FolderPlus,
  Search,
  Trash2,
  Download,
  Copy,
  Filter,
} from "lucide-react"

// TODO: Replace with actual API calls and database models
interface Asset {
  id: string
  name: string
  type: "image" | "video" | "document" | "other"
  url: string
  size: number
  folder: string
  uploadedAt: string
  uploadedBy: string
}

// Mock data
const MOCK_ASSETS: Asset[] = [
  {
    id: "1",
    name: "hero-banner.jpg",
    type: "image",
    url: "/assets/hero-banner.jpg",
    size: 1024 * 1024 * 2, // 2MB
    folder: "banners",
    uploadedAt: "2024-03-15T10:00:00Z",
    uploadedBy: "admin@example.com",
  },
  {
    id: "2",
    name: "terms-of-service.pdf",
    type: "document",
    url: "/assets/terms-of-service.pdf",
    size: 1024 * 512, // 512KB
    folder: "documents",
    uploadedAt: "2024-03-14T15:30:00Z",
    uploadedBy: "admin@example.com",
  },
  {
    id: "3",
    name: "promo-video.mp4",
    type: "video",
    url: "/assets/promo-video.mp4",
    size: 1024 * 1024 * 15, // 15MB
    folder: "videos",
    uploadedAt: "2024-03-13T09:15:00Z",
    uploadedBy: "admin@example.com",
  },
]

const MOCK_FOLDERS = ["banners", "documents", "videos", "logos", "misc"]

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    folder: "all",
  })

  // TODO: Implement these functions with actual API calls
  const handleAssetUpload = async (files: FileList) => {
    // Mock upload
    const newAssets = Array.from(files).map((file, index) => ({
      id: `new-${index}`,
      name: file.name,
      type: file.type.startsWith("image/") 
        ? "image" 
        : file.type.startsWith("video/")
        ? "video"
        : "document",
      url: URL.createObjectURL(file),
      size: file.size,
      folder: "misc",
      uploadedAt: new Date().toISOString(),
      uploadedBy: "admin@example.com",
    })) as Asset[]

    setAssets(prev => [...prev, ...newAssets])
    setIsUploadDialogOpen(false)
  }

  const handleAssetDelete = (id: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== id))
  }

  const getAssetIcon = (type: Asset["type"]) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "video":
        return <FileVideo className="h-4 w-4" />
      case "document":
        return <FileText className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const columns = [
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }: { row: { original: Asset } }) => (
        <div className="flex items-center gap-2">
          {getAssetIcon(row.original.type)}
          <span>{row.original.name}</span>
        </div>
      ),
    },
    {
      header: "Type",
      accessorKey: "type",
      cell: ({ row }: { row: { original: Asset } }) => (
        <Badge variant="outline">
          {row.original.type}
        </Badge>
      ),
    },
    {
      header: "Size",
      accessorKey: "size",
      cell: ({ row }: { row: { original: Asset } }) => formatFileSize(row.original.size),
    },
    {
      header: "Folder",
      accessorKey: "folder",
    },
    {
      header: "Uploaded",
      accessorKey: "uploadedAt",
      cell: ({ row }: { row: { original: Asset } }) => new Date(row.original.uploadedAt).toLocaleString(),
    },
    {
      header: "Actions",
      cell: ({ row }: { row: { original: Asset } }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(row.original.url, "_blank")}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigator.clipboard.writeText(row.original.url)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleAssetDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Asset Management</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            className="pl-8"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <Select
          value={filters.type}
          onValueChange={(value) => setFilters({ ...filters, type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.folder}
          onValueChange={(value) => setFilters({ ...filters, folder: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by folder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Folders</SelectItem>
            {MOCK_FOLDERS.map((folder) => (
              <SelectItem key={folder} value={folder}>{folder}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataGrid
        columns={columns}
        data={assets.filter(asset => {
          if (filters.search && !asset.name.toLowerCase().includes(filters.search.toLowerCase())) {
            return false
          }
          if (filters.type !== "all" && asset.type !== filters.type) {
            return false
          }
          if (filters.folder !== "all" && asset.folder !== filters.folder) {
            return false
          }
          return true
        })}
      />

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Input
                type="file"
                multiple
                className="hidden"
                id="file-upload"
                onChange={(e) => e.target.files && handleAssetUpload(e.target.files)}
              />
              <Label
                htmlFor="file-upload"
                className="flex flex-col items-center gap-2 cursor-pointer"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Click to upload or drag and drop files here
                </span>
              </Label>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Maximum file size: 50MB</p>
              <p>Supported formats: JPG, PNG, PDF, MP4, etc.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 