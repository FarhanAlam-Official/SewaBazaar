/**
 * Provider Dashboard Hooks
 * 
 * Centralized exports for all provider-related hooks
 */

export { useProviderDashboard, default as useProviderDashboardDefault } from '../useProviderDashboard'
export { useProviderBookings, default as useProviderBookingsDefault } from '../useProviderBookings'
export { useProviderServices, default as useProviderServicesDefault } from '../useProviderServices'
export { useProviderEarnings, default as useProviderEarningsDefault } from '../useProviderEarnings'

// Re-export types for convenience
export type {
  ProviderDashboardStats,
  ProviderRecentBookings,
  ProviderEarningsAnalytics,
  ProviderServicePerformance,
  LegacyProviderStats,
  ProviderBooking,
  ProviderBookingGroups,
  ProviderService,
  CreateServiceData,
  ServiceImage,
  ServiceCategory,
  City
} from '../../types/provider'