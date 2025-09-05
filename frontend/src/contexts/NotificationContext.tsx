"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { customerApi } from '@/services/customer.api'
import { useAuth } from './AuthContext'

interface NotificationContextType {
  unreadCount: number
  refreshUnreadCount: () => Promise<void>
  decrementUnreadCount: () => void
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  loading: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Function to fetch unread count from API
  const refreshUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    try {
      setLoading(true)
      const count = await customerApi.getUnreadNotificationsCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('Failed to fetch unread notifications count:', error)
      // Don't reset to 0 on error, keep the current count
    } finally {
      setLoading(false)
    }
  }, [user])

  // Load unread count when user changes
  useEffect(() => {
    if (user) {
      refreshUnreadCount()
    } else {
      setUnreadCount(0)
    }
  }, [user, refreshUnreadCount])

  // Function to manually decrement count (optimistic update)
  const decrementUnreadCount = useCallback(() => {
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  // Function to mark a notification as read
  const markAsRead = useCallback(async (id: number) => {
    try {
      await customerApi.markNotificationAsRead(id)
      // Optimistically update the count
      decrementUnreadCount()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      // If the API call fails, refresh from server to get accurate count
      await refreshUnreadCount()
      throw error
    }
  }, [decrementUnreadCount, refreshUnreadCount])

  // Function to mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await customerApi.markAllNotificationsAsRead()
      // Reset count to 0
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      // If the API call fails, refresh from server to get accurate count
      await refreshUnreadCount()
      throw error
    }
  }, [refreshUnreadCount])

  const value = {
    unreadCount,
    refreshUnreadCount,
    decrementUnreadCount,
    markAsRead,
    markAllAsRead,
    loading
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}