/**
 * Status Management Utilities
 * 
 * This file provides utilities for managing the enhanced booking status system
 * and service delivery workflow. It ensures consistent status display and
 * validation across the frontend application.
 */

import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Ban, 
  CreditCard, 
  Truck, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react"

// ENHANCED STATUS DEFINITIONS
export interface StatusInfo {
  label: string
  color: string
  icon: any
  description: string
  isActive: boolean
  canTransition: string[]
}

// STATUS MAPPING - Provides consistent status information across the app
export const STATUS_MAP: Record<string, StatusInfo> = {
  // EXISTING STATUSES (maintained for backward compatibility)
  'pending': {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 hover:border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50',
    icon: Clock,
    description: 'Awaiting payment confirmation',
    isActive: true,
    canTransition: ['confirmed', 'cancelled']
  },
  'confirmed': {
    label: 'Confirmed',
    color: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 hover:border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50',
    icon: CheckCircle,
    description: 'Payment completed, service scheduled',
    isActive: true,
    canTransition: ['service_delivered', 'cancelled']
  },
  'completed': {
    label: 'Completed',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 hover:border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50',
    icon: CheckCircle2,
    description: 'Service completed and confirmed by customer',
    isActive: false,
    canTransition: []
  },
  'cancelled': {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 hover:border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700/50',
    icon: XCircle,
    description: 'Booking cancelled',
    isActive: false,
    canTransition: []
  },
  'rejected': {
    label: 'Rejected',
    color: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 hover:border-gray-300 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700/50',
    icon: Ban,
    description: 'Booking rejected by provider',
    isActive: false,
    canTransition: []
  },
  
  // NEW STATUSES (enhanced service delivery tracking)
  'payment_pending': {
    label: 'Payment Pending',
    color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 hover:border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50',
    icon: CreditCard,
    description: 'Payment in progress',
    isActive: true,
    canTransition: ['confirmed', 'cancelled']
  },
  'service_delivered': {
    label: 'Service Delivered',
    color: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 hover:border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50',
    icon: Truck,
    description: 'Provider marked service as delivered',
    isActive: true,
    canTransition: ['awaiting_confirmation', 'completed', 'disputed']
  },
  'awaiting_confirmation': {
    label: 'Awaiting Confirmation',
    color: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 hover:border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/50',
    icon: UserCheck,
    description: 'Waiting for customer confirmation',
    isActive: true,
    canTransition: ['completed', 'disputed']
  },
  'disputed': {
    label: 'Disputed',
    color: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 hover:border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700/50',
    icon: AlertTriangle,
    description: 'Service delivery disputed',
    isActive: true,
    canTransition: ['completed', 'cancelled']
  }
}

// BOOKING STEP MAPPING
export const BOOKING_STEP_MAP: Record<string, string> = {
  'service_selection': 'Service Selection',
  'datetime_selection': 'Date & Time Selection',
  'details_input': 'Details Input',
  'payment': 'Payment',
  'confirmation': 'Confirmation',
  'completed': 'Completed',
  'payment_completed': 'Payment Completed',
  'service_delivered': 'Service Delivered',
  'customer_confirmed': 'Customer Confirmed'
}

/**
 * Get status information for a given status
 */
export function getStatusInfo(status: string): StatusInfo {
  return STATUS_MAP[status] || STATUS_MAP['pending']
}

/**
 * Get booking step display name
 */
export function getBookingStepName(step: string): string {
  return BOOKING_STEP_MAP[step] || step
}

/**
 * Check if a status transition is valid
 */
export function canTransitionTo(currentStatus: string, targetStatus: string): boolean {
  const statusInfo = getStatusInfo(currentStatus)
  return statusInfo.canTransition.includes(targetStatus)
}

/**
 * Get the next possible statuses for a given status
 */
export function getNextPossibleStatuses(status: string): string[] {
  const statusInfo = getStatusInfo(status)
  return statusInfo.canTransition
}

/**
 * Check if a booking requires customer action
 */
export function requiresCustomerAction(booking: any): boolean {
  if (!booking) return false
  
  // Check if customer needs to confirm service completion
  if (booking.status === 'service_delivered') {
    return true
  }
  
  // Check if customer needs to provide payment for cash bookings
  if (booking.status === 'pending' && booking.payment_type === 'cash') {
    return true
  }
  
  return false
}

/**
 * Check if a booking requires provider action
 */
export function requiresProviderAction(booking: any): boolean {
  if (!booking) return false
  
  // Check if provider needs to mark service as delivered
  if (booking.status === 'confirmed') {
    return true
  }
  
  // Check if provider needs to process cash payment
  if (booking.status === 'service_delivered' && booking.payment_type === 'cash') {
    return true
  }
  
  return false
}

/**
 * Get the primary action for a booking based on user role and status
 */
export function getPrimaryAction(booking: any, userRole: string): string | null {
  if (!booking) return null
  
  // Customer actions
  if (userRole === 'customer') {
    if (booking.status === 'service_delivered') {
      return 'confirm_completion'
    }
    if (booking.status === 'pending' && booking.payment_type === 'cash') {
      return 'confirm_booking'
    }
  }
  
  // Provider actions
  if (userRole === 'provider') {
    if (booking.status === 'confirmed') {
      return 'mark_delivered'
    }
    if (booking.status === 'service_delivered' && booking.payment_type === 'cash') {
      return 'process_cash_payment'
    }
  }
  
  // Admin actions
  if (userRole === 'admin') {
    if (booking.status === 'disputed') {
      return 'resolve_dispute'
    }
  }
  
  return null
}

/**
 * Get status priority for sorting (lower number = higher priority)
 */
export function getStatusPriority(status: string): number {
  const priorityMap: Record<string, number> = {
    'disputed': 1,
    'service_delivered': 2,
    'awaiting_confirmation': 3,
    'confirmed': 4,
    'payment_pending': 5,
    'pending': 6,
    'completed': 7,
    'cancelled': 8,
    'rejected': 9
  }
  
  return priorityMap[status] || 10
}

/**
 * Check if a booking is in a terminal state (no further actions possible)
 */
export function isTerminalStatus(status: string): boolean {
  return ['completed', 'cancelled', 'rejected'].includes(status)
}

/**
 * Get the status color classes for Tailwind CSS
 */
export function getStatusColorClasses(status: string): string {
  const statusInfo = getStatusInfo(status)
  return statusInfo.color
}

/**
 * Format status for display with proper capitalization
 */
export function formatStatus(status: string): string {
  const statusInfo = getStatusInfo(status)
  return statusInfo.label
}

/**
 * Get status description for tooltips and help text
 */
export function getStatusDescription(status: string): string {
  const statusInfo = getStatusInfo(status)
  return statusInfo.description
}
