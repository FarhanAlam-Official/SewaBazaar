"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { showToast } from "@/components/ui/enhanced-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Clock,
  Calendar as CalendarIcon,
  Sun,
  Moon,
  Plane,
  Plus,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
  Settings,
  Copy,
  Info,
  Image as ImageIcon,
  ThumbsUp,
  ThumbsDown,
  DollarSign,
  PackageCheck,
  TrendingUp,
  TrendingDown,
  Search,
  User,
  MapPin
} from "lucide-react"
import { useProviderSchedule } from '@/hooks/useProviderSchedule'
import { useProviderBookings } from '@/hooks/useProviderBookings'
import { format, addDays, startOfMonth, endOfMonth, parseISO, isSameDay, startOfDay } from 'date-fns'
import FullCalendarBookings, { type CalendarEvent } from '@/components/calendar/FullCalendarBookings'
import Image from 'next/image'
import React from 'react'
import { useProviderServices } from '@/hooks/useProviderServices'

interface WorkingHoursForm {
  [key: string]: {
    start: string
    end: string
    enabled: boolean
  }
}

interface BreakTimeForm {
  start: string
  end: string
}

interface BlockedTimeForm {
  title: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  isAllDay: boolean
  scheduleType: 'blocked' | 'vacation' | 'maintenance'
  notes: string
  isRecurring: boolean
  recurringPattern: string
  recurringUntil: string
}

export default function ScheduleManagement() {
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })

  const {
    scheduleData,
    loading: scheduleLoading,
    error: scheduleError,
    updateWorkingHours,
    createBlockedTime,
    deleteBlockedTime,
    refreshSchedule
  } = useProviderSchedule(dateRange.from, dateRange.to)

  const {
    bookings,
    loading: bookingsLoading,
    error: bookingsError,
    refreshBookings
  } = useProviderBookings()

  // Load provider services to resolve missing service images in bookings
  const { services: providerServices = [] as any[] } = useProviderServices?.() || ({} as any)

  // Reuse service image resolver from provider/services page
  const getServiceImageFromService = (service: any): string | null => {
    if (!service) return null
    if (service.image) return service.image
    if (service.images && Array.isArray(service.images) && service.images.length > 0) {
      const featured = service.images.find((img: any) => img?.is_featured && img?.image)
      if (featured?.image) return featured.image
      const first = service.images[0]
      if (first?.image) return first.image
    }
    if (service.image_url) return service.image_url
    if (service.imageUrl) return service.imageUrl
    return null
  }

  // Build quick lookup by service id -> image url (memoized to prevent rerenders)
  const serviceImageIndex = useMemo(() => {
    const index = new Map<any, string>()
    for (const s of providerServices) {
      const url = getServiceImageFromService(s)
      if (url && (s.id !== undefined && s.id !== null)) {
        index.set(s.id, url)
      }
      if (url && s.title) {
        index.set(`title::${String(s.title)}`, url)
      }
    }
    return index
  }, [providerServices])

  const getImageForService = useCallback((service: any): string | null => {
    if (!service) return null
    if (service.id !== undefined && service.id !== null) {
      const byId = serviceImageIndex.get(service.id)
      if (byId) return byId
    }
    if (service.title) {
      const byTitle = serviceImageIndex.get(`title::${String(service.title)}`)
      if (byTitle) return byTitle
    }
    return service.image || service.image_url || service.imageUrl || null
  }, [serviceImageIndex])

  const [workingHours, setWorkingHours] = useState<WorkingHoursForm>({
    sunday: { start: '09:00', end: '17:00', enabled: false },
    monday: { start: '09:00', end: '17:00', enabled: true },
    tuesday: { start: '09:00', end: '17:00', enabled: true },
    wednesday: { start: '09:00', end: '17:00', enabled: true },
    thursday: { start: '09:00', end: '17:00', enabled: true },
    friday: { start: '09:00', end: '17:00', enabled: true },
    saturday: { start: '09:00', end: '17:00', enabled: false }
  })

  const [breakTime, setBreakTime] = useState<BreakTimeForm>({
    start: '13:00',
    end: '14:00'
  })

  const [blockedTimeForm, setBlockedTimeForm] = useState<BlockedTimeForm>({
    title: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '17:00',
    isAllDay: true,
    scheduleType: 'blocked',
    notes: '',
    isRecurring: false,
    recurringPattern: 'weekly',
    recurringUntil: format(addDays(new Date(), 30), 'yyyy-MM-dd')
  })

  const [isBlockTimeDialogOpen, setIsBlockTimeDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sectionRefreshing, setSectionRefreshing] = useState(false)
  const [lastSyncedWorkingHours, setLastSyncedWorkingHours] = useState<WorkingHoursForm | null>(null)
  const [lastSyncedBreakTime, setLastSyncedBreakTime] = useState<BreakTimeForm | null>(null)
  const [hasLocalDraft, setHasLocalDraft] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null)

  // Central reject dialog state to avoid per-card state updates
  const commonRejectReasons = useMemo(() => [
    'Customer unavailable',
    'Schedule conflict',
    'Out of service area',
    'Insufficient details',
    'Price/expectation mismatch'
  ], [])
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectBookingId, setRejectBookingId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState<string>(commonRejectReasons[0])
  const [rejectCustomReason, setRejectCustomReason] = useState('')
  const { updateBookingStatus } = useProviderBookings()

  const openRejectFor = useCallback((bookingId: number) => {
    setRejectBookingId(bookingId)
    setRejectReason(commonRejectReasons[0])
    setRejectCustomReason('')
    setRejectOpen(true)
  }, [commonRejectReasons])

  const confirmReject = useCallback(async () => {
    if (!rejectBookingId) return
    const finalReason = rejectReason === 'Other' ? (rejectCustomReason || 'Other') : rejectReason
    await updateBookingStatus(rejectBookingId, 'rejected', undefined, finalReason)
    setRejectOpen(false)
    setRejectBookingId(null)
  }, [rejectBookingId, rejectReason, rejectCustomReason, updateBookingStatus])

  // Initialize working hours from API data
  useEffect(() => {
    if (scheduleData?.workingHours) {
      setWorkingHours(scheduleData.workingHours)
      setLastSyncedWorkingHours(scheduleData.workingHours)
    }
    if (scheduleData?.breakTime) {
      setBreakTime(scheduleData.breakTime)
      setLastSyncedBreakTime(scheduleData.breakTime)
    }
  }, [scheduleData])

  // On mount: load any draft from localStorage and sync silently
  useEffect(() => {
    try {
      const raw = localStorage.getItem('provider_schedule_draft')
      if (!raw) return
      const draft = JSON.parse(raw || '{}')
      if (draft?.workingHours) setWorkingHours(draft.workingHours)
      if (draft?.breakTime) setBreakTime(draft.breakTime)
      setHasLocalDraft(true)
      // Attempt immediate silent sync shortly after mount
      const t = setTimeout(async () => {
        try {
          await updateWorkingHours(draft.workingHours || workingHours, draft.breakTime || breakTime)
          setLastSyncedWorkingHours(draft.workingHours || workingHours)
          setLastSyncedBreakTime(draft.breakTime || breakTime)
          setHasLocalDraft(false)
          try { localStorage.removeItem('provider_schedule_draft') } catch {}
        } catch (err) {
          // keep draft; will retry via interval
        }
      }, 800)
      return () => clearTimeout(t)
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Transform booking data for calendar
  const getCalendarEvents = (): CalendarEvent[] => {
    if (!bookings) return []
    
    const allBookings = [
      ...bookings.upcoming,
      ...bookings.pending,
      ...bookings.completed
    ]
    
    return allBookings.map(booking => {
      // Ensure we have a valid date
      let dateValue: Date | string = new Date()
      if (booking.date) {
        dateValue = booking.date
      } else if (booking.booking_date) {
        dateValue = booking.booking_date
      }
      
      return {
        id: booking.id,
        date: dateValue,
        time: booking.time || booking.booking_time || '',
        title: booking.service.title,
        category: booking.service_category || 'Service',
        status: booking.status,
        meta: { booking }
      }
    })
  }
  
  const calendarEvents = getCalendarEvents()

  // Lightweight stats similar to customer page
  const normalizeStatus = (s?: string) => (s || '').toLowerCase()
  const parseDateSafe = (value: any): Date | null => {
    if (!value) return null
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value
    const iso = parseISO(String(value))
    if (!isNaN(iso.getTime())) return iso
    const fb = new Date(String(value))
    return isNaN(fb.getTime()) ? null : fb
  }
  const allProviderBookings: any[] = bookings ? [
    ...(bookings.upcoming || []),
    ...(bookings.pending || []),
    ...(bookings.completed || []),
  ] : []
  const today = startOfDay(new Date())
  const now = new Date()
  const futureProviderBookings = allProviderBookings.filter((b) => {
    const d = parseDateSafe(b.date || b.booking_date)
    if (!d) return false
    const dDay = startOfDay(d)
    if (isSameDay(dDay, today)) {
      const t = b.time || b.booking_time
      if (!t) return true
      try {
        const [timeStr] = String(t).split(' - ')
        const [hStr, mStr] = timeStr.replace(/[AP]M/i, '').trim().split(':')
        const hours = Number(hStr)
        const minutes = Number(mStr || '0')
        const isPM = /PM/i.test(timeStr) && hours !== 12
        const is12AM = /AM/i.test(timeStr) && hours === 12
        const dt = new Date(d)
        dt.setHours(is12AM ? 0 : isPM ? hours + 12 : hours, minutes || 0, 0, 0)
        return dt > now
      } catch {
        return true
      }
    }
    return dDay > today
  })
  const upcomingCount = futureProviderBookings.filter((b) => ['pending','confirmed'].includes(normalizeStatus(b.status))).length
  const pendingCount = futureProviderBookings.filter((b) => normalizeStatus(b.status) === 'pending').length
  const confirmedCount = futureProviderBookings.filter((b) => normalizeStatus(b.status) === 'confirmed').length

  // Enhanced stats with trends (adapted from customer page)
  const getBookingStats = () => {
    const todayDate = new Date()
    const now = new Date()

    const todayBookings = allProviderBookings.filter((b) => {
      const d = parseDateSafe(b.date || b.booking_date)
      if (!d) return false
      // include if same day and time not passed
      if (isSameDay(d, todayDate)) {
        const t = b.time || b.booking_time
        if (!t) return true
        try {
          const [timeStr] = String(t).split(' - ')
          const [hStr, mStr] = timeStr.replace(/[AP]M/i, '').trim().split(':')
          const hours = Number(hStr)
          const minutes = Number(mStr || '0')
          const isPM = /PM/i.test(timeStr) && hours !== 12
          const is12AM = /AM/i.test(timeStr) && hours === 12
          const dt = new Date(d)
          dt.setHours(is12AM ? 0 : isPM ? hours + 12 : hours, minutes || 0, 0, 0)
          return dt > now
        } catch {
          return true
        }
      }
      return false
    })

    const todayCountEx = todayBookings.length

    // Previous 30 days window excluding today
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const previousBookings = allProviderBookings.filter((b) => {
      const d = parseDateSafe(b.date || b.booking_date)
      return d && d >= thirtyDaysAgo && d < todayDate
    })

    const previousUpcomingCount = previousBookings.length
    const previousConfirmedCount = previousBookings.filter((b) => normalizeStatus(b.status) === 'confirmed').length
    const previousPendingCount = previousBookings.filter((b) => normalizeStatus(b.status) === 'pending').length

    const yesterday = new Date(todayDate)
    yesterday.setDate(yesterday.getDate() - 1)
    const previousTodayCount = allProviderBookings.filter((b) => {
      const d = parseDateSafe(b.date || b.booking_date)
      return d && isSameDay(d, yesterday)
    }).length

    const pct = (cur: number, prev: number) => prev > 0 ? ((cur - prev) / prev) * 100 : (cur > 0 ? 100 : 0)

    return {
      todayCountEx,
      upcomingChange: pct(upcomingCount, previousUpcomingCount),
      confirmedChange: pct(confirmedCount, previousConfirmedCount),
      pendingChange: pct(pendingCount, previousPendingCount),
      todayChange: pct(todayCountEx, previousTodayCount)
    }
  }

  const { todayCountEx, upcomingChange, confirmedChange, pendingChange, todayChange } = getBookingStats()

  // Monetary stats for upcoming bookings (pending + confirmed)
  const sumAmount = (items: any[]) => items.reduce((acc, b) => acc + (Number(b.total_amount ?? b.price ?? 0) || 0), 0)
  const currency = (amt: number) => new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 2 }).format(amt).replace('NPR', 'Rs.')
  const upcomingMonetaryBookings = futureProviderBookings.filter((b) => ['pending','confirmed'].includes(normalizeStatus(b.status)))
  const upcomingValue = sumAmount(upcomingMonetaryBookings)
  const previousBookingsForValue = (() => {
    const todayDate = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return allProviderBookings.filter((b) => {
      const d = parseDateSafe(b.date || b.booking_date)
      return d && d >= thirtyDaysAgo && d < todayDate && ['pending','confirmed'].includes(normalizeStatus(b.status))
    })
  })()
  const previousUpcomingValue = sumAmount(previousBookingsForValue)
  const upcomingValueChange = previousUpcomingValue > 0 ? ((upcomingValue - previousUpcomingValue) / previousUpcomingValue) * 100 : (upcomingValue > 0 ? 100 : 0)

  // Search and status filters
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')

  // Debounce search input for smoother UX
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim())
    }, 250)
    return () => clearTimeout(t)
  }, [searchQuery])

  const categories = Array.from(new Set(
    futureProviderBookings.map((b) => b.service_category || b.service?.category).filter(Boolean)
  )) as string[]

  const bookingPassesFilters = (b: any) => {
    // Search across fields
    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase()
      const fields = [
        b.service?.title,
        b.service_title,
        b.service_category,
        b.customer_name,
        b.customer,
        b.city,
        b.address,
      ].filter(Boolean).map((v: any) => String(v).toLowerCase())
      const match = fields.some((f: string) => f.includes(q))
      if (!match) return false
    }

    // Category
    if (filterCategory !== 'all') {
      const cat = b.service_category || b.service?.category
      if (!cat || String(cat) !== filterCategory) return false
    }

    // Status
    if (filterStatus !== 'all') {
      if (normalizeStatus(b.status) !== filterStatus) return false
    }

    // Priority (only apply if present on item)
    if (filterPriority !== 'all') {
      if (!b.priority || String(b.priority) !== filterPriority) return false
    }

    return true
  }

  const sortBookings = (arr: any[]) => {
    const copy = [...arr]
    if (sortBy === 'amount') {
      return copy.sort((a, b) => (Number(b.total_amount ?? b.price ?? 0) || 0) - (Number(a.total_amount ?? a.price ?? 0) || 0))
    }
    // date sort: by date then time
    return copy.sort((a, b) => {
      const da = parseDateSafe(a.date || a.booking_date)
      const db = parseDateSafe(b.date || b.booking_date)
      const ta = String(a.time || a.booking_time || '')
      const tb = String(b.time || b.booking_time || '')
      const ad = da ? da.getTime() : 0
      const bd = db ? db.getTime() : 0
      if (ad !== bd) return ad - bd
      // same day: try time lexicographically as fallback
      return ta.localeCompare(tb)
    })
  }

  // Handle working hours change
  const handleWorkingHoursChange = (day: string, field: string, value: any) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
    setHasLocalDraft(true)
  }

  // Handle break time change
  const handleBreakTimeChange = (field: string, value: string) => {
    setBreakTime(prev => ({
      ...prev,
      [field]: value
    }))
    setHasLocalDraft(true)
  }

  // Save working hours
  const handleSaveWorkingHours = async () => {
    try {
      setIsSubmitting(true)
      // Save to local draft only, do not hit server immediately
      setHasLocalDraft(true)
      // Persist draft so it survives accidental reloads
      try {
        const draft = { workingHours, breakTime, savedAt: Date.now() }
        localStorage.setItem('provider_schedule_draft', JSON.stringify(draft))
      } catch {}
      setDraftSavedAt(Date.now())
      showToast.success({
        title: 'Availability Saved',
        description: 'Your changes are now active.',
        duration: 2500,
      })
        } finally {
      setIsSubmitting(false)
    }
  }

  // Utility: shallow/deep comparers
  const equalBreak = (a?: BreakTimeForm | null, b?: BreakTimeForm | null) => {
    if (!a || !b) return false
    return a.start === b.start && a.end === b.end
  }
  const equalHours = (a?: WorkingHoursForm | null, b?: WorkingHoursForm | null) => {
    if (!a || !b) return false
    const daysArray = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]))
    for (let i = 0; i < daysArray.length; i++) {
      const d = daysArray[i]
      const av = a[d] || ({} as any)
      const bv = b[d] || ({} as any)
      if (av.start !== bv.start || av.end !== bv.end || av.enabled !== bv.enabled) return false
    }
    return true
  }

  const isDirty = !equalHours(workingHours, lastSyncedWorkingHours) || !equalBreak(breakTime, lastSyncedBreakTime)

  // Background sync every 5 minutes if there's a local draft and changes
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!hasLocalDraft || !isDirty || isSyncing) return
      try {
        setIsSyncing(true)
        await updateWorkingHours(workingHours, breakTime)
        setLastSyncedWorkingHours(workingHours)
        setLastSyncedBreakTime(breakTime)
        setHasLocalDraft(false)
        try { localStorage.removeItem('provider_schedule_draft') } catch {}
        // Background sync succeeded silently
      } catch (err: any) {
        // Silent failure; will retry automatically
      } finally {
        setIsSyncing(false)
      }
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [hasLocalDraft, isDirty, isSyncing, workingHours, breakTime, updateWorkingHours, toast])

  // Sync on page hide/unload
  useEffect(() => {
    const syncOnHide = async () => {
      if (!hasLocalDraft || !isDirty || isSyncing) return
      try {
        setIsSyncing(true)
        await updateWorkingHours(workingHours, breakTime)
        setLastSyncedWorkingHours(workingHours)
        setLastSyncedBreakTime(breakTime)
        setHasLocalDraft(false)
        try { localStorage.removeItem('provider_schedule_draft') } catch {}
      } finally {
        setIsSyncing(false)
      }
    }
    const visHandler = () => { if (document.visibilityState === 'hidden') syncOnHide() }
    window.addEventListener('visibilitychange', visHandler)
    window.addEventListener('beforeunload', syncOnHide as any)
    return () => {
      window.removeEventListener('visibilitychange', visHandler)
      window.removeEventListener('beforeunload', syncOnHide as any)
    }
  }, [hasLocalDraft, isDirty, isSyncing, workingHours, breakTime, updateWorkingHours])

  // Handle blocked time form submission
  const handleCreateBlockedTime = async () => {
    try {
      setIsSubmitting(true)
      setSectionRefreshing(true)
      await createBlockedTime({
        title: blockedTimeForm.title,
        startDate: blockedTimeForm.startDate,
        endDate: blockedTimeForm.endDate,
        startTime: blockedTimeForm.isAllDay ? undefined : blockedTimeForm.startTime,
        endTime: blockedTimeForm.isAllDay ? undefined : blockedTimeForm.endTime,
        isAllDay: blockedTimeForm.isAllDay,
        scheduleType: blockedTimeForm.scheduleType,
        notes: blockedTimeForm.notes,
        isRecurring: blockedTimeForm.isRecurring,
        recurringPattern: blockedTimeForm.isRecurring ? blockedTimeForm.recurringPattern : undefined,
        recurringUntil: blockedTimeForm.isRecurring ? blockedTimeForm.recurringUntil : undefined
      })

      setIsBlockTimeDialogOpen(false)
      setBlockedTimeForm({
        title: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '17:00',
        isAllDay: true,
        scheduleType: 'blocked',
        notes: '',
        isRecurring: false,
        recurringPattern: 'weekly',
        recurringUntil: format(addDays(new Date(), 30), 'yyyy-MM-dd')
      })

      await refreshSchedule()
      toast({
        title: "Blocked Time Created",
        description: "Your availability has been updated"
      })
    } catch (error: any) {
      toast({
        title: "Failed to Block Time",
        description: error.message || "Failed to create blocked time",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
      setSectionRefreshing(false)
    }
  }

  // Handle delete blocked time
  const handleDeleteBlockedTime = async (id: number) => {
    try {
      await deleteBlockedTime(id)
      toast({
        title: "Blocked Time Removed",
        description: "The blocked time has been removed successfully"
      })
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to remove blocked time",
        variant: "destructive"
      })
    }
  }

  // Copy weekday hours to all weekdays
  const copyWeekdayHours = () => {
    const mondayHours = workingHours.monday
    setWorkingHours(prev => ({
      ...prev,
      tuesday: { ...mondayHours },
      wednesday: { ...mondayHours },
      thursday: { ...mondayHours },
      friday: { ...mondayHours }
    }))
  }

  // Copy weekend hours to both weekend days
  const copyWeekendHours = () => {
    const saturdayHours = workingHours.saturday
    setWorkingHours(prev => ({
      ...prev,
      sunday: { ...saturdayHours }
    }))
  }

  // Reset to default hours
  const resetToDefaultHours = () => {
    setWorkingHours({
      sunday: { start: '09:00', end: '17:00', enabled: false },
      monday: { start: '09:00', end: '17:00', enabled: true },
      tuesday: { start: '09:00', end: '17:00', enabled: true },
      wednesday: { start: '09:00', end: '17:00', enabled: true },
      thursday: { start: '09:00', end: '17:00', enabled: true },
      friday: { start: '09:00', end: '17:00', enabled: true },
      saturday: { start: '09:00', end: '17:00', enabled: false }
    })
    setBreakTime({ start: '13:00', end: '14:00' })
  }

  // Get calendar day modifiers for availability display
  const getCalendarModifiers = () => {
    const modifiers: any = {}
    
    if (scheduleData?.availability) {
      const availableDates: Date[] = []
      const bookedDates: Date[] = []
      
      scheduleData.availability.forEach(day => {
        const date = new Date(day.date)
        const hasAvailableSlots = day.slots.some(slot => slot.status === 'available')
        const hasBookedSlots = day.slots.some(slot => slot.status === 'booked')
        
        if (hasAvailableSlots) availableDates.push(date)
        if (hasBookedSlots) bookedDates.push(date)
      })
      
      modifiers.available = availableDates
      modifiers.booked = bookedDates
    }
    
    if (scheduleData?.blockedTimes) {
      const blockedDates = scheduleData.blockedTimes.map(blocked => new Date(blocked.startDate))
      modifiers.blocked = blockedDates
    }
    
    return modifiers
  }

  const loading = scheduleLoading || bookingsLoading
  const error = scheduleError || bookingsError

  return (
    <div className="container mx-auto p-6">
      <motion.div className="flex justify-between items-center mb-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule & Availability</h1>
          <p className="text-muted-foreground">Manage your working hours and availability</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              refreshSchedule()
              refreshBookings()
            }}
            className="transition-transform hover:-translate-y-0.5"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isBlockTimeDialogOpen} onOpenChange={setIsBlockTimeDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" className="transition-transform hover:-translate-y-0.5">
                <Plus className="h-4 w-4 mr-2" />
                Block Time
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Block Time</DialogTitle>
                <DialogDescription>
                  Block time periods when you're not available for bookings
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={blockedTimeForm.title}
                    onChange={(e) => setBlockedTimeForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Personal Time Off"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={blockedTimeForm.startDate}
                      onChange={(e) => setBlockedTimeForm(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={blockedTimeForm.endDate}
                      onChange={(e) => setBlockedTimeForm(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isAllDay"
                    checked={blockedTimeForm.isAllDay}
                    onCheckedChange={(checked) => setBlockedTimeForm(prev => ({ ...prev, isAllDay: checked }))}
                  />
                  <Label htmlFor="isAllDay">All Day</Label>
                </div>

                {!blockedTimeForm.isAllDay && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={blockedTimeForm.startTime}
                        onChange={(e) => setBlockedTimeForm(prev => ({ ...prev, startTime: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={blockedTimeForm.endTime}
                        onChange={(e) => setBlockedTimeForm(prev => ({ ...prev, endTime: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="scheduleType">Type</Label>
                  <Select
                    value={blockedTimeForm.scheduleType}
                    onValueChange={(value: 'blocked' | 'vacation' | 'maintenance') => 
                      setBlockedTimeForm(prev => ({ ...prev, scheduleType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="vacation">Vacation</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={blockedTimeForm.notes}
                    onChange={(e) => setBlockedTimeForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsBlockTimeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleCreateBlockedTime} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Block Time
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Enhanced Stats Header */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Today's Bookings with change */}
        <Card role="region" aria-label="Today's bookings" className="p-4 border-emerald-200/50 bg-gradient-to-br from-emerald-50/70 to-green-50/40 dark:border-emerald-800/50 dark:from-emerald-950/40 dark:to-green-950/20 transition hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 dark:bg-emerald-400/20">
                <CalendarIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs font-medium text-emerald-700/80 dark:text-emerald-300/80">Today's Bookings</p>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {futureProviderBookings.filter((b) => {
                const d = parseDateSafe(b.date || b.booking_date)
                if (!d) return false
                return isSameDay(d, today)
              }).length}
            </div>
            <div className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${todayChange >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'}`}>
              {todayChange >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {Math.abs(todayChange).toFixed(1)}%
            </div>
          </div>
        </Card>

        {/* Upcoming Bookings with change */}
        <Card role="region" aria-label="Upcoming bookings" className="p-4 border-blue-200/50 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 dark:border-blue-800/50 dark:from-blue-950/40 dark:to-indigo-950/20 transition hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 dark:bg-blue-400/20">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs font-medium text-blue-700/80 dark:text-blue-300/80">Upcoming Bookings</p>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="text-2xl font-semibold text-blue-700 dark:text-blue-300">{upcomingCount}</div>
            <div className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${upcomingChange >= 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'}`}>
              {upcomingChange >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {Math.abs(upcomingChange).toFixed(1)}%
            </div>
          </div>
        </Card>

        {/* Upcoming Booking Value with change */}
        <Card role="region" aria-label="Upcoming booking value" className="p-4 border-indigo-200/50 bg-gradient-to-br from-indigo-50/70 to-violet-50/40 dark:border-indigo-800/50 dark:from-indigo-950/40 dark:to-violet-950/20 transition hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 dark:bg-indigo-400/20">
                <DollarSign className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-xs font-medium text-indigo-700/80 dark:text-indigo-300/80">Upcoming Booking Value</p>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2 min-w-0">
            <div className="text-l font-semibold text-indigo-700 dark:text-indigo-300 truncate whitespace-nowrap overflow-hidden">
              {currency(upcomingValue)}
            </div>
            <div className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${upcomingValueChange >= 0 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'}`}>
              {upcomingValueChange >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {Math.abs(upcomingValueChange).toFixed(1)}%
            </div>
          </div>
        </Card>

        {/* Pending and Confirmed split */}
        <Card role="region" aria-label="Pending bookings" className="p-4 border-amber-200/50 bg-gradient-to-br from-amber-50/70 to-orange-50/40 dark:border-amber-800/50 dark:from-amber-950/40 dark:to-orange-950/20 transition hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 dark:bg-amber-400/20">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-xs font-medium text-amber-700/80 dark:text-amber-300/80">Pending Bookings</p>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="text-2xl font-semibold text-amber-700 dark:text-amber-300">{pendingCount}</div>
            <div className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${pendingChange >= 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'}`}>
              {pendingChange >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {Math.abs(pendingChange).toFixed(1)}%
            </div>
          </div>
        </Card>

        {/* Confirmed Bookings with change */}
        <Card role="region" aria-label="Confirmed bookings" className="p-4 border-emerald-200/50 bg-gradient-to-br from-emerald-50/70 to-green-50/40 dark:border-emerald-800/50 dark:from-emerald-950/40 dark:to-green-950/20 transition hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15 dark:bg-green-400/20">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-xs font-medium text-green-700/80 dark:text-green-300/80">Confirmed Bookings</p>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="text-2xl font-semibold text-green-700 dark:text-green-300">{confirmedCount}</div>
            <div className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${confirmedChange >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'}`}>
              {confirmedChange >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {Math.abs(confirmedChange).toFixed(1)}%
            </div>
          </div>
        </Card>
      </div>
      {/* Calendar section aligned with customer page */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <Card className="p-4 transition-shadow hover:shadow-md focus-within:shadow-md">
            <div className="overflow-x-auto" role="region" aria-label="Booking calendar">
              <FullCalendarBookings
                events={calendarEvents}
                initialDate={selectedDate}
                onSelectDate={(date) => setSelectedDate(date)}
                onSelectEvent={() => {}}
                className="w-full"
              />
            </div>
            {/* Legend labels similar to customer page (inside card) */}
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-gradient-to-br from-indigo-100 to-indigo-200 border border-indigo-300"></div>
                  <span>Selected date</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-primary border border-primary/50"></div>
                  <span>Today</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Booking Status Colors:</div>
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-orange-500 border border-orange-500"></div>
                    <span className="text-orange-500">Pending</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500 border border-green-500"></div>
                    <span className="text-green-500">Confirmed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-500 border border-blue-500"></div>
                    <span className="text-blue-500">Completed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-500 border border-red-500"></div>
                    <span className="text-red-500">Cancelled</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-cyan-500 border border-cyan-500"></div>
                    <span className="text-cyan-600">Awaiting Confirmation</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-violet-500 border border-violet-500"></div>
                    <span className="text-violet-600">Service Delivered</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-lime-500 border border-lime-500"></div>
                    <span className="text-lime-600">Payment Pending</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-700 border border-red-700"></div>
                    <span className="text-red-700">Disputed</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Central Reject reason modal */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Booking</DialogTitle>
            <DialogDescription>Select a reason so the customer understands what happened.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              {[...commonRejectReasons, 'Other'].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectReason(reason)}
                  className={`text-left px-3 py-2 rounded-md border transition-colors ${rejectReason === reason ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' : 'hover:bg-muted'}`}
                >
                  {reason}
                </button>
              ))}
            </div>
            {rejectReason === 'Other' && (
              <Textarea
                placeholder="Write a short reason (optional)"
                value={rejectCustomReason}
                onChange={(e) => setRejectCustomReason(e.target.value)}
              />
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button type="button" onClick={confirmReject}>Confirm Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs similar to customer page with provider actions */}
      <div className="mt-6">
        <Tabs defaultValue="today" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="grid w-full grid-cols-2 sm:w-auto text-sm">
              <TabsTrigger value="today">Selected Date Bookings</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming Bookings</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-[26rem] md:w-[34rem]">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookings..."
                  className="pl-8 focus-visible:ring-2 focus-visible:ring-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <TabsContent value="today" className="mt-4">
            <Card className="h-full max-h-[calc(100vh-200px)] overflow-y-auto transition-shadow hover:shadow-sm">
              <div className="p-4">
                <div className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Select a date on the calendar'}
                </div>
                {/* Inline filters similar to customer page */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                  <div>
                    <Label className="text-xs">Category</Label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Priority</Label>
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="low">low</SelectItem>
                        <SelectItem value="medium">medium</SelectItem>
                        <SelectItem value="high">high</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Sort by</Label>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'amount')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="amount">Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  {sortBookings(allProviderBookings.filter((b) => {
                    if (!selectedDate) return false
                    const d = parseDateSafe(b.date || b.booking_date)
                    if (!d) return false
                    return isSameDay(d, selectedDate) && bookingPassesFilters(b)
                  })).length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-12" aria-live="polite">
                      <CalendarIcon className="w-4 h-4 mx-auto mb-3" />
                      No bookings for the selected date
                    </div>
                  )}

                  {sortBookings(allProviderBookings.filter((b) => {
                    if (!selectedDate) return false
                    const d = parseDateSafe(b.date || b.booking_date)
                    if (!d) return false
                    return isSameDay(d, selectedDate) && bookingPassesFilters(b)
                  })).map((b, idx) => (
                    <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                      <BookingCard booking={b as any} imageSrc={getImageForService((b as any).service)} onRejectClick={openRejectFor} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming" className="mt-4">
            <Card className="h-full max-h-[calc(100vh-200px)] overflow-y-auto transition-shadow hover:shadow-sm">
              <div className="p-4 space-y-3">
                {/* Inline filters similar to customer page */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Category</Label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Priority</Label>
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="low">low</SelectItem>
                        <SelectItem value="medium">medium</SelectItem>
                        <SelectItem value="high">high</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Sort by</Label>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'amount')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="amount">Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {sortBookings(futureProviderBookings.filter(bookingPassesFilters)).length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-12" aria-live="polite">
                    <CalendarIcon className="w-4 h-4 mx-auto mb-3" />
                    No upcoming bookings
                  </div>
                ) : (
                  sortBookings(futureProviderBookings.filter(bookingPassesFilters)).map((b, idx) => (
                    <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}>
                      <BookingCard booking={b as any} imageSrc={getImageForService((b as any).service)} onRejectClick={openRejectFor} />
                    </motion.div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Working Hours */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        <Card className="p-6 lg:col-span-3 w-full transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Working Hours</h2>
            {isSubmitting && (
              <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </div>
            )}
          </div>
          <div className="space-y-6">
            {/* Weekly Schedule - redesigned grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(workingHours).map(([day, hours]) => (
                <div key={day} className="group rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Switch
                        id={`wh-${day}`}
                        checked={hours.enabled}
                        onCheckedChange={(checked) => handleWorkingHoursChange(day, 'enabled', checked)}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor={`wh-${day}`} className="capitalize font-medium w-24">{day}</Label>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Input
                        type="time"
                        className="w-28"
                        value={hours.start}
                        onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value)}
                        disabled={!hours.enabled || isSubmitting}
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        className="w-28"
                        value={hours.end}
                        onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value)}
                        disabled={!hours.enabled || isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Break Time - enhanced */}
            <div className="rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Break Time</h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Enable</span>
                  <Switch
                    id="break-enabled"
                    checked={Boolean(breakTime.start || breakTime.end)}
                    onCheckedChange={(checked) => {
                      if (!checked) {
                        setBreakTime({ start: '', end: '' })
                      } else {
                        setBreakTime((prev) => ({ start: prev.start || '13:00', end: prev.end || '14:00' }))
                      }
                    }}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  type="time"
                  className="w-28"
                  value={breakTime.start}
                  onChange={(e) => handleBreakTimeChange('start', e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Start"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="time"
                  className="w-28"
                  value={breakTime.end}
                  onChange={(e) => handleBreakTimeChange('end', e.target.value)}
                  disabled={isSubmitting}
                  placeholder="End"
                />
                <div className="flex flex-wrap gap-2 ml-auto">
                  {[
                    ['12:00','13:00'],
                    ['13:00','14:00'],
                    ['14:00','15:00'],
                  ].map(([s,e]) => (
                    <Button type="button" key={`${s}-${e}`} size="sm" variant="outline" onClick={() => setBreakTime({ start: s, end: e })} disabled={isSubmitting}>
                      {s} - {e}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button variant="outline" className="w-full justify-start transition-transform hover:-translate-y-0.5" onClick={copyWeekdayHours} disabled={isSubmitting}>
                <Sun className="h-4 w-4 mr-2" />
                Copy Weekday Hours
              </Button>
              <Button variant="outline" className="w-full justify-start transition-transform hover:-translate-y-0.5" onClick={copyWeekendHours} disabled={isSubmitting}>
                <Moon className="h-4 w-4 mr-2" />
                Copy Weekend Hours
              </Button>
              <Button variant="outline" className="w-full justify-start transition-transform hover:-translate-y-0.5" onClick={resetToDefaultHours} disabled={isSubmitting}>
                <Clock className="h-4 w-4 mr-2" />
                Reset to Default Hours
              </Button>
            </div>

            {/* Inline Block Time entry point */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Need to block time (vacation/maintenance)?</div>
              <Dialog open={isBlockTimeDialogOpen} onOpenChange={setIsBlockTimeDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" size="sm" className="transition-transform hover:-translate-y-0.5">
                    <Plus className="h-4 w-4 mr-2" /> Block Time
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <Button type="button" className="flex-1 transition-transform hover:-translate-y-0.5" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveWorkingHours(); }} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
              <Button type="button" variant="outline" className="sm:w-32" onClick={() => { refreshSchedule() }} disabled={isSubmitting}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Tip: Toggle a day to enable or disable availability for that day. Click Save to update your schedule.</p>
          </div>
        </Card>

        {/* Removed duplicate quick stats to avoid repetition with tabs above */}
      </div>

      {/* Blocked Times */}
      <Card className="mt-6 p-6 transition-shadow hover:shadow-md">
          <h2 className="text-xl font-semibold mb-4">Blocked Times</h2>
          
          {scheduleData?.blockedTimes && scheduleData.blockedTimes.length > 0 ? (
            <div className="space-y-4">
              {scheduleData.blockedTimes.map((blocked) => (
                <div key={blocked.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    {blocked.reason === 'vacation' ? (
                      <Plane className="h-8 w-8 text-muted-foreground" />
                    ) : blocked.reason === 'maintenance' ? (
                      <Settings className="h-8 w-8 text-muted-foreground" />
                    ) : (
                      <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                    <div>
                      <h3 className="font-medium">{blocked.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {blocked.startDate === blocked.endDate 
                          ? format(new Date(blocked.startDate), 'MMM d, yyyy')
                          : `${format(new Date(blocked.startDate), 'MMM d')} - ${format(new Date(blocked.endDate), 'MMM d, yyyy')}`
                        }
                      </p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="hover:bg-red-50 hover:text-red-600">
                        <X className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Blocked Time</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove this blocked time? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteBlockedTime(blocked.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No blocked times scheduled</p>
              <p className="text-sm text-muted-foreground mt-1">
                Use the "Block Time" button to add vacation days or maintenance periods
              </p>
            </div>
          )}
        </Card>
    </div>
  )
}

// Provider Booking Card with action buttons
const BookingCard = React.memo(function BookingCard({ booking, imageSrc, onRejectClick }: { booking: any, imageSrc?: string | null, onRejectClick: (bookingId: number) => void }) {
  const { updateBookingStatus, markServiceDelivered, processCashPayment } = useProviderBookings()
  const status = (booking.status || '').toLowerCase()
  const price = Number(booking.total_amount ?? booking.price ?? 0) || 0
  const formatPrice = (amt: number) => new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 2 }).format(amt).replace('NPR', 'Rs.')
  // local reject UI removed; handled by parent-level dialog for performance

  const handleAccept = async () => {
    await updateBookingStatus(booking.id, 'confirmed')
  }

  const handleRejectClick = () => onRejectClick(booking.id)

  const handleDelivered = async () => {
    const notes = window.prompt('Delivery notes (optional):') || undefined
    await markServiceDelivered(booking.id, notes)
  }

  const handleCash = async () => {
    const amountStr = window.prompt('Amount collected (numeric):', String(booking.total_amount || ''))
    if (!amountStr) return
    const amount = Number(amountStr)
    if (Number.isNaN(amount)) return
    const notes = window.prompt('Collection notes (optional):') || undefined
    await processCashPayment(booking.id, amount, notes)
  }

  // Match provider/services image behavior
  const stableImageSrc = imageSrc || '/placeholder.svg'

  const ServiceImage = React.memo((({ 
    src, 
    alt, 
    className = "", 
    fill = false, 
    width, 
    height 
  }: { 
    src: string | null, 
    alt: string, 
    className?: string, 
    fill?: boolean, 
    width?: number, 
    height?: number 
  }) => {
    const [imageError, setImageError] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)
    const memoSrc = useMemo(() => src, [src])

    if (!src || imageError) {
      return (
        <div className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className}`}>
          <ImageIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
        </div>
      )
    }

    return (
      <div className={`relative ${className}`}>
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
        <Image
          key={memoSrc || 'placeholder'}
          src={memoSrc || '/placeholder.svg'}
          alt={alt}
          fill={fill}
          width={width}
          height={height}
          className={`${fill ? 'object-cover' : ''} ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={() => {
            console.log('[ProviderSchedule] Image loaded for booking', booking?.id, src)
            setImageLoaded(true)
          }}
          onError={(e) => {
            console.warn('[ProviderSchedule] Image failed to load for booking', booking?.id, src, e)
            setImageError(true)
          }}
          unoptimized={true}
        />
      </div>
    )
  }))
  ServiceImage.displayName = 'ServiceImage'

  // Derive normalized fields similar to customer card
  const serviceTitle = booking.service?.title || booking.service_title || 'Service'
  const serviceCategory = booking.service_category || booking.service?.category || 'General'
  const bookingType = booking.booking_type || 'normal'
  const customerName = booking.customer?.name || booking.customer_name || 'Customer'
  const dateStr = (() => {
    const d = booking.date || booking.booking_date
    try {
      const dateObj = d instanceof Date ? d : new Date(String(d))
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }
    } catch {}
    return '—'
  })()
  const timeStr = booking.time || booking.booking_time || '—'
  const locationStr = booking.city || booking.address || '—'

  return (
    <Card className="group overflow-hidden rounded-xl border border-border transition-all duration-300 hover:border-indigo-200 hover:shadow-lg">
      <div className="p-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          {/* Left: Image + details */}
          <div className="flex items-start gap-3 min-w-0">
            <ServiceImage
              src={stableImageSrc}
              alt="Service"
              fill
              className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="truncate font-semibold text-slate-900 dark:text-slate-100">
                  {serviceTitle}
                </div>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800">
                  {serviceCategory}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
                  {bookingType}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span className="truncate">{customerName}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{dateStr}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{timeStr}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{locationStr}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: price + status */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={(e) => { e.preventDefault() }}
                aria-label="Booking info"
              >
                <Info className="h-4 w-4" />
              </Button>
              {price > 0 && (
                <span className="text-lg font-bold text-foreground">
                  {formatPrice(price)}
                </span>
              )}
            </div>
            {status && (
              <span className={`text-[11px] px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                status === 'completed' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' :
                status === 'cancelled' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' :
                status === 'awaiting' || status === 'awaiting confirmation' || status === 'awaiting_confirmation' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' :
                status === 'delivered' || status === 'service delivered' || status === 'service_delivered' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' :
                status === 'payment_pending' ? 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300' :
                status === 'disputed' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                <span className={`inline-block w-2 h-2 rounded-full ${
                  status === 'pending' ? 'bg-orange-500' :
                  status === 'confirmed' ? 'bg-emerald-500' :
                  status === 'completed' ? 'bg-indigo-500' :
                  status === 'cancelled' ? 'bg-rose-500' :
                  status === 'awaiting' || status === 'awaiting confirmation' || status === 'awaiting_confirmation' ? 'bg-cyan-500' :
                  status === 'delivered' || status === 'service delivered' || status === 'service_delivered' ? 'bg-violet-500' :
                  status === 'payment_pending' ? 'bg-lime-500' :
                  status === 'disputed' ? 'bg-red-700' : 'bg-slate-400'
                }`} />
                <span className="capitalize">{status}</span>
              </span>
            )}
          </div>
        </div>

        {/* Actions row (kept for provider, styled subtly) */}
        {(status === 'pending' || status === 'confirmed') && (
          <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
            {status === 'pending' && (
              <>
                <Button size="sm" onClick={handleAccept} className="transition-transform hover:-translate-y-0.5">
                  <ThumbsUp className="h-4 w-4 mr-2" /> Accept
                </Button>
                <Button size="sm" variant="outline" onClick={handleRejectClick} className="transition-transform hover:-translate-y-0.5">
                  <ThumbsDown className="h-4 w-4 mr-2" /> Reject
                </Button>
              </>
            )}
            {status === 'confirmed' && (
              <>
                <Button size="sm" onClick={handleDelivered} className="transition-transform hover:-translate-y-0.5">
                  <PackageCheck className="h-4 w-4 mr-2" /> Mark Delivered
                </Button>
                <Button size="sm" variant="outline" onClick={handleCash} className="transition-transform hover:-translate-y-0.5">
                  <DollarSign className="h-4 w-4 mr-2" /> Cash Payment
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  )
})
BookingCard.displayName = 'BookingCard'