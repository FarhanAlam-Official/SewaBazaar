import { useErrorHandler } from '@/contexts/ErrorContext'
import React from 'react'

export type UserRole = 'admin' | 'provider' | 'customer' | 'guest'

export interface PermissionConfig {
  allowedRoles: UserRole[]
  redirectTo?: string
  customMessage?: string
  requestedPath?: string
}

/**
 * Hook for checking user permissions and handling unauthorized access
 */
export function usePermissionGuard() {
  const { handleError } = useErrorHandler()

  const checkPermission = (
    userRole: UserRole | null | undefined,
    config: PermissionConfig
  ): boolean => {
    // If no user role, treat as guest
    const role = userRole || 'guest'
    
    // Check if user role is allowed
    const hasPermission = config.allowedRoles.includes(role)
    
    if (!hasPermission) {
      // Create unauthorized error
      const unauthorizedError = {
        message: "Unauthorized Access",
        response: {
          status: 403
        }
      }
      
      const message = config.customMessage || `Access denied.`
      
      handleError(unauthorizedError, {
        message,
        requiredRoles: config.allowedRoles as any,
        requestedRole: (config.allowedRoles[0] as any),
        requestedPath: config.requestedPath
      })
      
      // Redirect if specified
      if (config.redirectTo && typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = config.redirectTo!
        }, 1000)
      }
    }
    
    return hasPermission
  }

  const requireRole = (userRole: UserRole | null | undefined, requiredRole: UserRole): boolean => {
    return checkPermission(userRole, {
      allowedRoles: [requiredRole],
      customMessage: `This page requires ${requiredRole} access.`
    })
  }

  const requireAnyRole = (userRole: UserRole | null | undefined, roles: UserRole[]): boolean => {
    return checkPermission(userRole, {
      allowedRoles: roles,
      customMessage: `This page requires one of the following roles: ${roles.join(', ')}`
    })
  }

  const requireAuthenticated = (userRole: UserRole | null | undefined): boolean => {
    return checkPermission(userRole, {
      allowedRoles: ['admin', 'provider', 'customer'],
      customMessage: 'Please log in to access this page.'
    })
  }

  return {
    checkPermission,
    requireRole,
    requireAnyRole,
    requireAuthenticated
  }
}

/**
 * Higher-order component for protecting routes
 * Note: This is a simplified version. For complex use cases, 
 * use the usePermissionGuard hook directly in components.
 */
export function withPermissionGuard(
  Component: React.ComponentType<any>,
  config: PermissionConfig
) {
  return function ProtectedComponent(props: any) {
    const { userRole } = props
    const { checkPermission } = usePermissionGuard()
    
    const hasPermission = checkPermission(userRole, config)
    
    if (!hasPermission) {
      return null // Error will be handled by the error context
    }
    
    return React.createElement(Component, props)
  }
}

/**
 * Utility function to get role-based access info
 */
export function getRoleAccessInfo(role: UserRole) {
  const accessMap = {
    admin: {
      canAccess: ['admin', 'provider', 'customer'],
      description: 'Full system access',
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    provider: {
      canAccess: ['provider', 'customer'],
      description: 'Service provider access',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    customer: {
      canAccess: ['customer'],
      description: 'Customer access only',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    guest: {
      canAccess: [],
      description: 'No access - login required',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  }
  
  return accessMap[role] || accessMap.guest
}