"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { showToast } from "@/components/ui/enhanced-toast"
import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Award,
  Download,
  Eye,
  Trash2,
  Plus,
  RefreshCw,
  Calendar,
  Building,
  AlertTriangle,
  Filter,
  Search,
  X,
  FileIcon,
  ExternalLink
} from "lucide-react"
import documentService, { 
  ProviderDocument, 
  DocumentStats, 
  DocumentRequirement, 
  CreateDocumentData,
  UpdateDocumentData 
} from "@/services/documentService"

export default function DocumentsAndVerification() {
  const [documents, setDocuments] = useState<ProviderDocument[]>([])
  const [stats, setStats] = useState<DocumentStats | null>(null)
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([])
  const [expiringDocuments, setExpiringDocuments] = useState<ProviderDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<ProviderDocument | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  // Form states
  const [uploadForm, setUploadForm] = useState<{
    document_type: string
    title: string
    description: string
    file: File | null
    expiry_date: string
    issue_date: string
    issuing_authority: string
    is_featured: boolean
  }>({
    document_type: '',
    title: '',
    description: '',
    file: null,
    expiry_date: '',
    issue_date: '',
    issuing_authority: '',
    is_featured: false
  })

  const [editForm, setEditForm] = useState<{
    title: string
    description: string
    file: File | null
    expiry_date: string
    issue_date: string
    issuing_authority: string
    is_featured: boolean
  }>({
    title: '',
    description: '',
    file: null,
    expiry_date: '',
    issue_date: '',
    issuing_authority: '',
    is_featured: false
  })

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [documentsData, statsData, requirementsData, expiringData] = await Promise.all([
        documentService.getDocuments(),
        documentService.getDocumentStats(),
        documentService.getDocumentRequirements(),
        documentService.getExpiringDocuments()
      ])

      setDocuments(documentsData.results)
      setStats(statsData)
      setRequirements(requirementsData)
      setExpiringDocuments(expiringData.documents)
    } catch (error: any) {
      console.error('Error loading documents data:', error)
      showToast.error({
        title: "Error",
        description: error.message || "Failed to load documents data"
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.issuing_authority?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
    const matchesType = typeFilter === 'all' || doc.document_type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file
      const validation = documentService.validateFile(file)
      if (!validation.valid) {
        showToast.error({
          title: "Invalid File",
          description: validation.error
        })
        return
      }

      if (isEdit) {
        setEditForm(prev => ({ ...prev, file }))
      } else {
        setUploadForm(prev => ({ ...prev, file }))
      }
    }
  }

  // Handle document upload
  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.document_type || !uploadForm.title) {
      showToast.error({
        title: "Missing Information",
        description: "Please fill in all required fields and select a file"
      })
      return
    }

    try {
      setUploading(true)
      
      const documentData: CreateDocumentData = {
        document_type: uploadForm.document_type,
        title: uploadForm.title,
        description: uploadForm.description,
        file: uploadForm.file,
        expiry_date: uploadForm.expiry_date || undefined,
        issue_date: uploadForm.issue_date || undefined,
        issuing_authority: uploadForm.issuing_authority || undefined,
        priority: documentService.getPriorityByType(uploadForm.document_type),
        is_featured: uploadForm.is_featured
      }

      await documentService.createDocument(documentData)
      
      showToast.success({
        title: "Success",
        description: "Document uploaded successfully"
      })

      // Reset form and close dialog
      setUploadForm({
        document_type: '',
        title: '',
        description: '',
        file: null,
        expiry_date: '',
        issue_date: '',
        issuing_authority: '',
        is_featured: false
      })
      setIsUploadDialogOpen(false)
      
      // Reload data
      loadData()
    } catch (error: any) {
      console.error('Error uploading document:', error)
      showToast.error({
        title: "Upload Failed",
        description: error.message || "Failed to upload document"
      })
    } finally {
      setUploading(false)
    }
  }

  // Handle document edit
  const handleEdit = async () => {
    if (!selectedDocument || !editForm.title) {
      showToast.error({
        title: "Missing Information",
        description: "Please fill in all required fields"
      })
      return
    }

    try {
      setUploading(true)
      
      const updateData: UpdateDocumentData = {
        title: editForm.title,
        description: editForm.description,
        file: editForm.file || undefined,
        expiry_date: editForm.expiry_date || undefined,
        issue_date: editForm.issue_date || undefined,
        issuing_authority: editForm.issuing_authority || undefined,
        is_featured: editForm.is_featured
      }

      await documentService.updateDocument(selectedDocument.id, updateData)
      
      showToast.success({
        title: "Success",
        description: "Document updated successfully"
      })

      setIsEditDialogOpen(false)
      setSelectedDocument(null)
      
      // Reload data
      loadData()
    } catch (error: any) {
      console.error('Error updating document:', error)
      showToast.error({
        title: "Update Failed",
        description: error.message || "Failed to update document"
      })
    } finally {
      setUploading(false)
    }
  }

  // Handle document delete
  const handleDelete = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      await documentService.deleteDocument(documentId)
      
      showToast.success({
        title: "Success",
        description: "Document deleted successfully"
      })
      
      // Reload data
      loadData()
    } catch (error: any) {
      console.error('Error deleting document:', error)
      showToast.error({
        title: "Delete Failed",
        description: error.message || "Failed to delete document"
      })
    }
  }

  // Open edit dialog
  const openEditDialog = (document: ProviderDocument) => {
    setSelectedDocument(document)
    setEditForm({
      title: document.title,
      description: document.description || '',
      file: null,
      expiry_date: document.expiry_date || '',
      issue_date: document.issue_date || '',
      issuing_authority: document.issuing_authority || '',
      is_featured: document.is_featured
    })
    setIsEditDialogOpen(true)
  }

  // Open view dialog
  const openViewDialog = (document: ProviderDocument) => {
    setSelectedDocument(document)
    setIsViewDialogOpen(true)
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', icon: Clock, variant: 'secondary' as const },
      under_review: { label: 'Under Review', icon: Eye, variant: 'default' as const },
      approved: { label: 'Approved', icon: CheckCircle, variant: 'success' as const },
      rejected: { label: 'Rejected', icon: X, variant: 'destructive' as const },
      expired: { label: 'Expired', icon: AlertTriangle, variant: 'secondary' as const },
      resubmission_required: { label: 'Resubmission Required', icon: RefreshCw, variant: 'warning' as const }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  // Get document type label
  const getDocumentTypeLabel = (type: string) => {
    const types = documentService.getDocumentTypes()
    return types.find(t => t.value === type)?.label || type
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Documents & Verification</h1>
          <p className="text-muted-foreground">Manage your licenses and certifications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload New Document</DialogTitle>
                <DialogDescription>
                  Upload a new document for verification. Make sure the file is clear and readable.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="document_type">Document Type *</Label>
                  <Select 
                    value={uploadForm.document_type} 
                    onValueChange={(value) => setUploadForm(prev => ({ ...prev, document_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentService.getDocumentTypes().map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center justify-between w-full">
                            <span>{type.label}</span>
                            <Badge 
                              variant="outline" 
                              className={`ml-2 text-xs ${documentService.getPriorityColor(documentService.getPriorityByType(type.value))}`}
                            >
                              {documentService.getPriorityByType(type.value).toUpperCase()}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {uploadForm.document_type && (
                    <p className="text-sm text-muted-foreground">
                      Priority: <span className="font-medium capitalize">{documentService.getPriorityByType(uploadForm.document_type)}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Document Title *</Label>
                  <Input
                    id="title"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter document title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter document description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issue_date">Issue Date</Label>
                    <Input
                      id="issue_date"
                      type="date"
                      value={uploadForm.issue_date}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, issue_date: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Expiry Date</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      value={uploadForm.expiry_date}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issuing_authority">Issuing Authority</Label>
                  <Input
                    id="issuing_authority"
                    value={uploadForm.issuing_authority}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, issuing_authority: e.target.value }))}
                    placeholder="Enter issuing authority"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Document File *</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => handleFileChange(e)}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <p className="text-sm text-muted-foreground">
                    Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 5MB)
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Expiring Documents Alert */}
      {expiringDocuments.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                Documents Expiring Soon
              </h3>
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
              You have {expiringDocuments.length} document(s) expiring within 30 days. Please renew them to maintain your verification status.
            </p>
            <div className="flex flex-wrap gap-2">
              {expiringDocuments.map(doc => (
                <Badge key={doc.id} variant="outline" className="text-orange-700 border-orange-300">
                  {doc.title} - {doc.days_until_expiry} days left
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verification Progress</p>
                <h3 className="text-2xl font-bold">{stats.verification_progress}%</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <h3 className="text-2xl font-bold">{stats.total_documents}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <h3 className="text-2xl font-bold">{stats.approved_documents}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <h3 className="text-2xl font-bold">{stats.pending_documents}</h3>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {documentService.getDocumentTypes().map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Documents List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Documents</h2>
            <Badge variant="outline">{filteredDocuments.length} documents</Badge>
          </div>
          
          <div className="space-y-4">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No documents found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                    ? 'Try adjusting your filters or search terms.'
                    : 'Upload your first document to get started with verification.'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                  <Button onClick={() => setIsUploadDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                )}
              </div>
            ) : (
              filteredDocuments.map((document) => (
                <div key={document.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                      <FileIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{document.title}</h3>
                        {document.is_featured && (
                          <Badge variant="secondary" className="text-xs">Featured</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {getDocumentTypeLabel(document.document_type)}
                        {document.expiry_date && (
                          <> • Valid until {new Date(document.expiry_date).toLocaleDateString()}</>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(document.status)}
                        <span className="text-sm text-muted-foreground">
                          Uploaded on {new Date(document.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {document.rejection_reason && (
                        <p className="text-sm text-red-600 mt-1">
                          <AlertCircle className="h-3 w-3 inline mr-1" />
                          {document.rejection_reason}
                        </p>
                      )}
                      {document.review_notes && document.status !== 'rejected' && (
                        <p className="text-sm text-blue-600 mt-1">
                          <Eye className="h-3 w-3 inline mr-1" />
                          {document.review_notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openViewDialog(document)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={document.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(document)}>
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(document.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Verification Progress Sidebar */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Verification Progress</h2>
          
          {stats && (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">{stats.verification_progress}%</span>
                </div>
                <Progress value={stats.verification_progress} className="h-2" />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Document Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Approved</span>
                    <Badge variant="success">{stats.approved_documents}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending</span>
                    <Badge variant="secondary">{stats.pending_documents}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rejected</span>
                    <Badge variant="destructive">{stats.rejected_documents}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Expired</span>
                    <Badge variant="outline">{stats.expired_documents}</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Requirements</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completed</span>
                    <span className="text-muted-foreground">
                      {stats.completed_requirements}/{stats.required_documents_count}
                    </span>
                  </div>
                  <Progress 
                    value={stats.required_documents_count > 0 ? (stats.completed_requirements / stats.required_documents_count) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
                
                {stats.missing_requirements.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-orange-600">Missing Requirements:</h4>
                    <div className="space-y-1">
                      {stats.missing_requirements.map((req, index) => (
                        <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                          <AlertCircle className="h-3 w-3 text-orange-500" />
                          {req}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button className="w-full" onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Edit Document Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update document information. Upload a new file to replace the existing one.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_title">Document Title *</Label>
              <Input
                id="edit_title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter document title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter document description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_issue_date">Issue Date</Label>
                <Input
                  id="edit_issue_date"
                  type="date"
                  value={editForm.issue_date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, issue_date: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_expiry_date">Expiry Date</Label>
                <Input
                  id="edit_expiry_date"
                  type="date"
                  value={editForm.expiry_date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_issuing_authority">Issuing Authority</Label>
              <Input
                id="edit_issuing_authority"
                value={editForm.issuing_authority}
                onChange={(e) => setEditForm(prev => ({ ...prev, issuing_authority: e.target.value }))}
                placeholder="Enter issuing authority"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_file">Replace Document File (Optional)</Label>
              <Input
                id="edit_file"
                type="file"
                onChange={(e) => handleFileChange(e, true)}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <p className="text-sm text-muted-foreground">
                Leave empty to keep the current file. Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 5MB)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={uploading}>
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Update Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
            <DialogDescription>
              View document information and verification history.
            </DialogDescription>
          </DialogHeader>
          
          {selectedDocument && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-sm text-muted-foreground">{selectedDocument.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm text-muted-foreground">
                    {getDocumentTypeLabel(selectedDocument.document_type)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedDocument.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <Badge variant="outline" className={documentService.getPriorityColor(selectedDocument.priority)}>
                    {selectedDocument.priority}
                  </Badge>
                </div>
              </div>

              {selectedDocument.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedDocument.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedDocument.issue_date && (
                  <div>
                    <Label className="text-sm font-medium">Issue Date</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedDocument.issue_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedDocument.expiry_date && (
                  <div>
                    <Label className="text-sm font-medium">Expiry Date</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedDocument.expiry_date).toLocaleDateString()}
                      {selectedDocument.days_until_expiry !== undefined && (
                        <span className={selectedDocument.days_until_expiry < 30 ? 'text-orange-600' : ''}>
                          {' '}({selectedDocument.days_until_expiry} days left)
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {selectedDocument.issuing_authority && (
                <div>
                  <Label className="text-sm font-medium">Issuing Authority</Label>
                  <p className="text-sm text-muted-foreground">{selectedDocument.issuing_authority}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">File Size</Label>
                  <p className="text-sm text-muted-foreground">{selectedDocument.file_size_formatted}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Uploaded</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedDocument.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedDocument.verification_history.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Verification History</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedDocument.verification_history.map((history) => (
                      <div key={history.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <p className="text-sm">
                            {history.previous_status} → {history.new_status}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            by {history.changed_by_name} on {new Date(history.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button asChild>
                  <a href={selectedDocument.file_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View File
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={selectedDocument.file_url} download>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 