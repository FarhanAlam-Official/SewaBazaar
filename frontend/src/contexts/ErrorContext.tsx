"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { setGlobalErrorHandler } from '@/utils/errorHandler'

export type ErrorType = 'network' | 'server' | 'generic' | 'unauthorized'

type AppRole = 'customer' | 'provider' | 'admin'

export interface ErrorInfo {
  type: ErrorType
  message?: string
  statusCode?: number
  originalError?: Error
  timestamp: number
  requiredRoles?: AppRole[]
  requestedRole?: AppRole
  requestedPath?: string
}

interface ErrorContextType {
  error: ErrorInfo | null
  setError: (error: ErrorInfo) => void
  clearError: () => void
  isNetworkError: (error: any) => boolean
  isServerError: (error: any) => boolean
  getErrorType: (error: any) => ErrorType
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [error, setErrorState] = useState<ErrorInfo | null>(null)

  const setError = useCallback((errorInfo: ErrorInfo) => {
    setErrorState({
      ...errorInfo,
      timestamp: Date.now()
    })
  }, [])

  const clearError = useCallback(() => {
    setErrorState(null)
  }, [])

  // Set up global error handler
  useEffect(() => {
    setGlobalErrorHandler(setError)
    
    // Cleanup on unmount
    return () => {
      setGlobalErrorHandler(null as any)
    }
  }, [setError])

  const isNetworkError = useCallback((error: any): boolean => {
    // Network error: no response from server
    return !error?.response && error?.code !== 'ECONNABORTED'
  }, [])

  const isServerError = useCallback((error: any): boolean => {
    // Server error: 5xx status codes
    const status = error?.response?.status
    return status && status >= 500 && status < 600
  }, [])

  const getErrorType = useCallback((error: any): ErrorType => {
    if (isNetworkError(error)) return 'network'
    if (isServerError(error)) return 'server'
    if (error?.response?.status === 403) return 'unauthorized'
    return 'generic'
  }, [isNetworkError, isServerError])

  const value: ErrorContextType = {
    error,
    setError,
    clearError,
    isNetworkError,
    isServerError,
    getErrorType
  }

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  )
}

export function useError() {
  const context = useContext(ErrorContext)
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}

// Hook for triggering errors from API calls
type ErrorOptions = {
  message?: string
  requiredRoles?: AppRole[]
  requestedRole?: AppRole
  requestedPath?: string
}

export function useErrorHandler() {
  const { setError, getErrorType } = useError()

  const handleError = useCallback((error: any, custom?: string | ErrorOptions) => {
    const errorType = getErrorType(error)
    const options: ErrorOptions = typeof custom === 'string' ? { message: custom } : (custom || {})
    const errorInfo: ErrorInfo = {
      type: errorType,
      message: options.message || error?.message || 'An unexpected error occurred',
      statusCode: error?.response?.status,
      originalError: error,
      timestamp: Date.now(),
      requiredRoles: options.requiredRoles,
      requestedRole: options.requestedRole,
      requestedPath: options.requestedPath
    }
    
    setError(errorInfo)
  }, [setError, getErrorType])

  return { handleError }
}

