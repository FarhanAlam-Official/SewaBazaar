import api from './api'

export interface DocumentType {
  value: string
  label: string
}

export interface DocumentRequirement {
  id: number
  name: string
  document_type: string
  description: string
  is_mandatory: boolean
  priority: string
  max_file_size: number
  max_file_size_formatted: string
  allowed_file_types: string[]
  validity_period_days?: number
  order: number
  is_active: boolean
}

export interface ProviderDocument {
  id: number
  document_type: string
  title: string
  description?: string
  file: string
  file_url: string
  file_size?: number
  file_size_formatted: string
  file_type?: string
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired' | 'resubmission_required'
  priority: string
  is_required: boolean
  is_featured: boolean
  expiry_date?: string
  issue_date?: string
  issuing_authority?: string
  reviewed_by?: number
  reviewed_by_name?: string
  reviewed_at?: string
  review_notes?: string
  rejection_reason?: string
  order: number
  tags: string[]
  metadata: Record<string, any>
  is_expired: boolean
  days_until_expiry?: number
  can_be_renewed: boolean
  verification_progress: number
  verification_history: DocumentVerificationHistory[]
  created_at: string
  updated_at: string
}

export interface DocumentVerificationHistory {
  id: number
  previous_status: string
  new_status: string
  changed_by?: number
  changed_by_name: string
  change_reason?: string
  notes?: string
  created_at: string
}

export interface DocumentStats {
  total_documents: number
  pending_documents: number
  approved_documents: number
  rejected_documents: number
  expired_documents: number
  verification_progress: number
  required_documents_count: number
  completed_requirements: number
  missing_requirements: string[]
}

export interface CreateDocumentData {
  document_type: string
  title: string
  description?: string
  file: File
  is_required?: boolean
  is_featured?: boolean
  expiry_date?: string
  issue_date?: string
  issuing_authority?: string
  priority?: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface UpdateDocumentData {
  title?: string
  description?: string
  file?: File
  is_featured?: boolean
  expiry_date?: string
  issue_date?: string
  issuing_authority?: string
  priority?: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface BulkUploadData {
  files: File[]
  document_types: string[]
  titles: string[]
  descriptions?: string[]
}

/**
 * Document Service API
 * Handles all document management operations for providers
 */
export const documentService = {
  /**
   * Get all documents for the current provider
   */
  getDocuments: async (params?: {
    document_type?: string
    status?: string
    is_required?: boolean
    is_featured?: boolean
    search?: string
    ordering?: string
    page?: number
    page_size?: number
  }): Promise<{ results: ProviderDocument[], count: number, next?: string, previous?: string }> => {
    try {
      const response = await api.get('/auth/provider-documents/', { params })
      return response.data
    } catch (error: any) {
      console.error('Error fetching documents:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch documents')
    }
  },

  /**
   * Get a specific document by ID
   */
  getDocument: async (documentId: number): Promise<ProviderDocument> => {
    try {
      const response = await api.get(`/auth/provider-documents/${documentId}/`)
      return response.data
    } catch (error: any) {
      console.error('Error fetching document:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch document')
    }
  },

  /**
   * Create a new document
   */
  createDocument: async (documentData: CreateDocumentData): Promise<ProviderDocument> => {
    try {
      const formData = new FormData()
      
      // Add file
      formData.append('file', documentData.file)
      
      // Add other fields
      formData.append('document_type', documentData.document_type)
      formData.append('title', documentData.title)
      
      if (documentData.description) {
        formData.append('description', documentData.description)
      }
      if (documentData.is_required !== undefined) {
        formData.append('is_required', documentData.is_required.toString())
      }
      if (documentData.is_featured !== undefined) {
        formData.append('is_featured', documentData.is_featured.toString())
      }
      if (documentData.expiry_date) {
        formData.append('expiry_date', documentData.expiry_date)
      }
      if (documentData.issue_date) {
        formData.append('issue_date', documentData.issue_date)
      }
      if (documentData.issuing_authority) {
        formData.append('issuing_authority', documentData.issuing_authority)
      }
      if (documentData.priority) {
        formData.append('priority', documentData.priority)
      }
      if (documentData.tags) {
        formData.append('tags', JSON.stringify(documentData.tags))
      }
      if (documentData.metadata) {
        formData.append('metadata', JSON.stringify(documentData.metadata))
      }

      const response = await api.post('/auth/provider-documents/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      return response.data
    } catch (error: any) {
      console.error('Error creating document:', error)
      throw new Error(error.response?.data?.message || 'Failed to create document')
    }
  },

  /**
   * Update an existing document
   */
  updateDocument: async (documentId: number, updateData: UpdateDocumentData): Promise<ProviderDocument> => {
    try {
      const formData = new FormData()
      
      // Add file if provided
      if (updateData.file) {
        formData.append('file', updateData.file)
      }
      
      // Add other fields
      if (updateData.title) {
        formData.append('title', updateData.title)
      }
      if (updateData.description !== undefined) {
        formData.append('description', updateData.description)
      }
      if (updateData.is_featured !== undefined) {
        formData.append('is_featured', updateData.is_featured.toString())
      }
      if (updateData.expiry_date !== undefined) {
        formData.append('expiry_date', updateData.expiry_date || '')
      }
      if (updateData.issue_date !== undefined) {
        formData.append('issue_date', updateData.issue_date || '')
      }
      if (updateData.issuing_authority !== undefined) {
        formData.append('issuing_authority', updateData.issuing_authority || '')
      }
      if (updateData.priority) {
        formData.append('priority', updateData.priority)
      }
      if (updateData.tags) {
        formData.append('tags', JSON.stringify(updateData.tags))
      }
      if (updateData.metadata) {
        formData.append('metadata', JSON.stringify(updateData.metadata))
      }

      const response = await api.patch(`/auth/provider-documents/${documentId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      return response.data
    } catch (error: any) {
      console.error('Error updating document:', error)
      throw new Error(error.response?.data?.message || 'Failed to update document')
    }
  },

  /**
   * Delete a document
   */
  deleteDocument: async (documentId: number): Promise<void> => {
    try {
      await api.delete(`/auth/provider-documents/${documentId}/`)
    } catch (error: any) {
      console.error('Error deleting document:', error)
      throw new Error(error.response?.data?.message || 'Failed to delete document')
    }
  },

  /**
   * Get document statistics
   */
  getDocumentStats: async (): Promise<DocumentStats> => {
    try {
      const response = await api.get('/auth/provider-documents/statistics/')
      return response.data
    } catch (error: any) {
      console.error('Error fetching document statistics:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch document statistics')
    }
  },

  /**
   * Get document requirements
   */
  getDocumentRequirements: async (): Promise<DocumentRequirement[]> => {
    try {
      const response = await api.get('/auth/provider-documents/requirements/')
      return response.data
    } catch (error: any) {
      console.error('Error fetching document requirements:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch document requirements')
    }
  },

  /**
   * Bulk upload documents
   */
  bulkUploadDocuments: async (uploadData: BulkUploadData): Promise<{
    message: string
    documents: ProviderDocument[]
    errors?: string[]
  }> => {
    try {
      const formData = new FormData()
      
      // Add files
      uploadData.files.forEach(file => {
        formData.append('files', file)
      })
      
      // Add document types
      uploadData.document_types.forEach(type => {
        formData.append('document_types', type)
      })
      
      // Add titles
      uploadData.titles.forEach(title => {
        formData.append('titles', title)
      })
      
      // Add descriptions if provided
      if (uploadData.descriptions) {
        uploadData.descriptions.forEach(description => {
          formData.append('descriptions', description)
        })
      }

      const response = await api.post('/auth/provider-documents/bulk_upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      return response.data
    } catch (error: any) {
      console.error('Error bulk uploading documents:', error)
      throw new Error(error.response?.data?.message || 'Failed to bulk upload documents')
    }
  },

  /**
   * Get documents expiring soon
   */
  getExpiringDocuments: async (): Promise<{
    count: number
    documents: ProviderDocument[]
  }> => {
    try {
      const response = await api.get('/auth/provider-documents/expiring_soon/')
      return response.data
    } catch (error: any) {
      console.error('Error fetching expiring documents:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch expiring documents')
    }
  },

  /**
   * Get document verification history
   */
  getDocumentHistory: async (params?: {
    document?: number
    previous_status?: string
    new_status?: string
    page?: number
    page_size?: number
  }): Promise<{ results: DocumentVerificationHistory[], count: number }> => {
    try {
      const response = await api.get('/auth/document-history/', { params })
      return response.data
    } catch (error: any) {
      console.error('Error fetching document history:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch document history')
    }
  },

  /**
   * Get all document requirements (from separate endpoint)
   */
  getAllRequirements: async (params?: {
    document_type?: string
    is_mandatory?: boolean
    priority?: string
    ordering?: string
  }): Promise<DocumentRequirement[]> => {
    try {
      const response = await api.get('/auth/document-requirements/', { params })
      return response.data.results || response.data
    } catch (error: any) {
      console.error('Error fetching all requirements:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch requirements')
    }
  },

  /**
   * Helper function to get document type options
   */
  getDocumentTypes: (): DocumentType[] => {
    return [
      { value: 'business_license', label: 'Business Registration Certificate' },
      { value: 'insurance_certificate', label: 'Professional Liability Insurance' },
      { value: 'professional_certification', label: 'Professional Certification' },
      { value: 'identity_document', label: 'National Identity Card' },
      { value: 'tax_certificate', label: 'Tax Registration Certificate' },
      { value: 'bank_statement', label: 'Bank Account Verification' },
      { value: 'portfolio_certificate', label: 'Portfolio/Work Samples' },
      { value: 'other', label: 'Additional Certifications' }
    ]
  },

  /**
   * Helper function to get priority based on document type
   */
  getPriorityByType: (documentType: string): string => {
    const priorityMap = {
      'business_license': 'critical',
      'identity_document': 'critical',
      'insurance_certificate': 'high',
      'professional_certification': 'high',
      'tax_certificate': 'high',
      'bank_statement': 'medium',
      'portfolio_certificate': 'low',
      'other': 'low'
    }
    return priorityMap[documentType as keyof typeof priorityMap] || 'medium'
  },

  /**
   * Helper function to get status badge color
   */
  getStatusColor: (status: string): string => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      resubmission_required: 'bg-orange-100 text-orange-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  },

  /**
   * Helper function to get priority color
   */
  getPriorityColor: (priority: string): string => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    }
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  },

  /**
   * Helper function to validate file before upload
   */
  validateFile: (file: File, requirements?: DocumentRequirement): { valid: boolean, error?: string } => {
    // Check file size (default 5MB limit)
    const maxSize = requirements?.max_file_size || 5 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit`
      }
    }

    // Check file type
    const allowedTypes = requirements?.allowed_file_types || [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Unsupported file type. Please upload PDF, DOC, DOCX, or image files.'
      }
    }

    return { valid: true }
  }
}

export default documentService