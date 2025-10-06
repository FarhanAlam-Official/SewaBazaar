/**
 * Error handling utilities for API calls
 * This module provides functions to handle errors through the error context
 * instead of direct navigation, allowing for cleaner error page integration
 */

import { ErrorInfo } from '@/contexts/ErrorContext'

// Global error handler function that can be called from anywhere
let globalErrorHandler: ((error: ErrorInfo) => void) | null = null

export function setGlobalErrorHandler(handler: (error: ErrorInfo) => void) {
  globalErrorHandler = handler
}

export function handleApiError(error: any, customMessage?: string) {
  if (!globalErrorHandler) {
    console.warn('Global error handler not set. Falling back to console.error')
    console.error('API Error:', error)
    return
  }

  // Determine error type
  let errorType: 'network' | 'server' | 'generic' = 'generic'
  
  // Network error: no response from server
  if (!error?.response && error?.code !== 'ECONNABORTED') {
    errorType = 'network'
  }
  // Server error: 5xx status codes
  else if (error?.response?.status >= 500 && error?.response?.status < 600) {
    errorType = 'server'
  }

  const errorInfo: ErrorInfo = {
    type: errorType,
    message: customMessage || error?.message || getDefaultErrorMessage(errorType),
    statusCode: error?.response?.status,
    originalError: error
  }

  globalErrorHandler(errorInfo)
}

function getDefaultErrorMessage(errorType: 'network' | 'server' | 'generic'): string {
  switch (errorType) {
    case 'network':
      return 'Network connection failed. Please check your internet connection and try again.'
    case 'server':
      return 'Server error occurred. Please try again later.'
    default:
      return 'An unexpected error occurred. Please try again.'
  }
}

// Helper function to check if an error should trigger the error boundary
export function shouldTriggerErrorBoundary(error: any): boolean {
  // Don't trigger for client-side errors that should be handled locally
  if (error?.response?.status >= 400 && error?.response?.status < 500) {
    return false
  }
  
  // Trigger for network errors and server errors
  return !error?.response || (error?.response?.status >= 500 && error?.response?.status < 600)
}
