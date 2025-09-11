"use client"

import React, { useMemo, useState } from "react"
import { DayPicker } from "react-day-picker"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import "react-day-picker/dist/style.css"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

export type CalendarEvent = {
  id: string | number
  date: string | Date
  time?: string
  title: string
  category: string
  status?: string
  meta?: Record<string, unknown>
}

export type AdvancedBookingsCalendarProps = {
  events: CalendarEvent[]
  initialDate?: Date
  loading?: boolean
  onSelectEvent?: (event: CalendarEvent) => void
  onSelectDate?: (date: Date) => void
  filters?: {
    categories?: string[]
    statuses?: string[]
  }
  onChangeFilters?: (filters: { categories?: string[]; statuses?: string[] }) => void
  categoryColors?: Record<string, string>
  className?: string
}

// Brand color palette for booking statuses
const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-200 border border-amber-200 dark:border-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800", 
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-200 border border-blue-200 dark:border-blue-800",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-200 border border-red-200 dark:border-red-800",
}

const formatKey = (date: Date) => {
  // Use local date to avoid timezone issues
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function AdvancedBookingsCalendar({
  events,
  initialDate,
  loading,
  onSelectEvent,
  onSelectDate,
  filters,
  onChangeFilters,
  categoryColors,
  className,
}: AdvancedBookingsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(
    initialDate ? new Date(initialDate) : new Date()
  )
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialDate ? new Date(initialDate) : new Date()
  )

  const activeStatusSet = useMemo(() => new Set(filters?.statuses ?? []), [
    filters?.statuses,
  ])

  const palette = { ...DEFAULT_CATEGORY_COLORS, ...(categoryColors ?? {}) }

  const buckets = useMemo(() => {
    const byDay: Record<string, CalendarEvent[]> = {}
    console.log('Processing events for calendar:', events)
    console.log('Active statuses:', activeStatusSet)
    
    for (const e of events) {
      console.log('Processing event:', e)
      
      if (activeStatusSet.size && e.status && !activeStatusSet.has(e.status)) {
        console.log('Filtered out by status:', e.status)
        continue
      }
      
      // Handle different date formats with proper timezone handling
      let d: Date
      if (e.date instanceof Date) {
        d = e.date
      } else if (typeof e.date === 'string') {
        // Handle ISO string or other string formats
        // If it's just a date string (YYYY-MM-DD), treat it as local date
        if (e.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = e.date.split('-').map(Number)
          d = new Date(year, month - 1, day) // month is 0-indexed
        } else {
          d = new Date(e.date)
        }
        
        if (isNaN(d.getTime())) {
          console.warn('Invalid date format:', e.date)
          continue
        }
      } else {
        console.warn('Invalid date type:', typeof e.date, e.date)
        continue
      }
      
      const key = formatKey(d)
      console.log(`Event date: ${e.date} -> Parsed: ${d.toISOString()} -> Key: ${key}`)
      
      if (!byDay[key]) byDay[key] = []
      byDay[key].push(e)
    }
    
    console.log('Calendar buckets:', byDay)
    console.log('Keys with bookings:', Object.keys(byDay))
    return byDay
  }, [events, activeStatusSet])

  const dayRenderer = (day: Date) => {
    const key = formatKey(day)
    const dayEvents = buckets[key] || []
    const MAX_BADGES = 2 // Show up to 2 status badges
    const statuses = new Map<string, number>()
    dayEvents.forEach((e) => statuses.set(e.status || 'pending', (statuses.get(e.status || 'pending') || 0) + 1))
    const entries = Array.from(statuses.entries()).sort((a, b) => b[1] - a[1])
    const overflow = entries.length > MAX_BADGES ? entries.length - MAX_BADGES : 0
    const isToday = formatKey(day) === formatKey(new Date())
    const totalBookings = dayEvents.length
    
    // Debug logging for specific days
    if (dayEvents.length > 0) {
      console.log(`Day ${key} has ${dayEvents.length} events:`, dayEvents)
    }

    return (
      <div className="flex flex-col h-full w-full p-0.5 sm:p-1 gap-0.5">
        {/* Date number */}
        <div className={cn(
          "text-xs sm:text-sm font-medium text-center leading-none min-h-[16px] sm:min-h-[20px] flex items-center justify-center",
          isToday && "text-primary-foreground font-bold bg-primary rounded-full w-5 h-5 sm:w-6 sm:h-6 mx-auto text-[10px] sm:text-xs shadow-sm"
        )}>
          {day.getDate()}
        </div>
        
        {/* Event indicators - responsive display */}
        {dayEvents.length > 0 && (
          <div className="flex-1 flex flex-col gap-0.5 min-h-0">
            {/* Mobile view - show total count */}
            <div className="block sm:hidden">
              <div className="flex justify-center">
                <div className="bg-indigo-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-medium shadow-sm">
                  {totalBookings}
                </div>
              </div>
            </div>
            
            {/* Desktop view - show status badges with counts */}
            <div className="hidden sm:flex flex-col gap-0.5">
              {entries.slice(0, MAX_BADGES).map(([status, count]) => (
                <div
                  key={status}
                  className={cn(
                    "rounded text-[8px] lg:text-[9px] font-medium text-center py-0.5 px-1 leading-tight flex items-center justify-center shadow-sm transition-all duration-200 cursor-pointer transform hover:scale-110 hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-200/50 dark:hover:shadow-indigo-900/30",
                    palette[status] ?? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100 border border-gray-200 dark:border-gray-600"
                  )}
                  title={`${status.charAt(0).toUpperCase() + status.slice(1)}: ${count} booking${count > 1 ? 's' : ''}`}
                >
                  {count}
                </div>
              ))}
              {overflow > 0 && (
                <div className="text-[7px] lg:text-[8px] text-muted-foreground text-center leading-none bg-gray-100 dark:bg-gray-700 dark:text-gray-100 rounded py-0.5 px-1 shadow-sm transition-all duration-200 cursor-pointer transform hover:scale-110 hover:-translate-y-0.5 hover:shadow-md hover:bg-gray-200 hover:text-gray-900 hover:shadow-gray-200/50 dark:hover:bg-gray-600 dark:hover:text-gray-100 dark:hover:shadow-gray-900/30">
                  +{overflow}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return []
    return buckets[formatKey(selectedDate)] ?? []
  }, [buckets, selectedDate])

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[2.6fr,1.1fr] xl:grid-cols-[2.9fr,1.6fr]", className)}>
      <Card className="p-4 min-h-[495px]">
        {/* Custom Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div className="text-lg font-semibold">
            {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
          </div>
          <div className="flex items-center gap-2 justify-center sm:justify-end">
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline" }), "h-8 w-8 p-0 hover:bg-accent")}
              onClick={() => {
                const d = new Date(currentMonth)
                d.setMonth(d.getMonth() - 1)
                setCurrentMonth(d)
              }}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline" }), "h-8 w-8 p-0 hover:bg-accent")}
              onClick={() => {
                const d = new Date()
                setCurrentMonth(d)
                setSelectedDate(d)
                onSelectDate?.(d)
              }}
              aria-label="Go to today"
              title="Today"
            >
              <div className="w-2 h-2 bg-current rounded-full"></div>
            </button>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline" }), "h-8 w-8 p-0 hover:bg-accent")}
              onClick={() => {
                const d = new Date(currentMonth)
                d.setMonth(d.getMonth() + 1)
                setCurrentMonth(d)
              }}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Status Filters */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Filter by Status:</div>
          <div className="flex flex-wrap items-center gap-2">
            {['pending', 'confirmed', 'completed', 'cancelled'].map((status) => {
              const checked = !filters?.statuses?.length || filters?.statuses?.includes(status)
              return (
                <label key={status} className="flex items-center gap-2 text-xs select-none cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-3 w-3 accent-indigo-600"
                    checked={checked}
                    onChange={() => {
                      const current = new Set(filters?.statuses ?? ['pending', 'confirmed', 'completed', 'cancelled'])
                      if (checked) current.delete(status)
                      else current.add(status)
                      onChangeFilters?.({ statuses: Array.from(current), categories: filters?.categories })
                    }}
                  />
                  <span className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-200/50 dark:hover:shadow-indigo-900/30",
                    palette[status] ?? "bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
                    checked ? "opacity-100 shadow-sm" : "opacity-50"
                  )}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        <DayPicker
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          mode="single"
          selected={selectedDate}
          onSelect={(d) => {
            console.log('Date selected:', d)
            if (!d) return
            setSelectedDate(d)
            onSelectDate?.(d)
          }}
          showOutsideDays={false}
          className="p-0"
          modifiers={{
            hasBooking: Object.keys(buckets).map(key => {
              const date = new Date(key)
              return isNaN(date.getTime()) ? null : date
            }).filter((date): date is Date => date !== null),
            today: new Date(),
            weekend: (date: Date) => [0, 6].includes(date.getDay()),
          }}
          classNames={{
            months: "flex flex-col w-full",
            month: "w-full",
            caption: "hidden",
            caption_label: "hidden",
            nav: "hidden",
            nav_button: "hidden",
            nav_button_previous: "hidden",
            nav_button_next: "hidden",
            table: "w-full border-collapse border-spacing-0",
            head_row: "grid grid-cols-7 w-full",
            head_cell: "h-11 w-full flex items-center justify-center text-muted-foreground font-medium text-sm border border-border/30 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 dark:border-border/50",
            row: "grid grid-cols-7 w-full",
            cell: "h-17 sm:h-20 lg:h-24 w-full border border-border/20 p-0 relative overflow-hidden bg-card hover:bg-gradient-to-br hover:from-indigo-50 hover:to-blue-50 dark:hover:from-indigo-900/20 dark:hover:to-blue-900/20 transition-all duration-200",
            day: "w-full h-full p-0",
            day_selected: "bg-gradient-to-br from-indigo-100 to-indigo-200 border-indigo-300 dark:from-indigo-900/70 dark:to-indigo-800/70 dark:border-indigo-500",
            day_today: "bg-gradient-to-br from-primary/20 to-primary/30 border-primary/40 dark:from-primary/30 dark:to-primary/20 dark:border-primary/60",
            day_outside: "text-muted-foreground/40 bg-muted/10 dark:bg-muted/5",
            day_disabled: "text-muted-foreground/30 dark:text-muted-foreground/50",
            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
          }}
          components={{
            Day: (props: any) => {
              const { date, modifiers, ...buttonProps } = props
              const isSelected = selectedDate && formatKey(date) === formatKey(selectedDate)
              const isToday = formatKey(date) === formatKey(new Date())
              const hasBooking = modifiers?.hasBooking
              const isOutside = modifiers?.outside
              const currentMonthCheck = date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear()
              
              // Don't render outside days
              if (isOutside || !currentMonthCheck) {
                return (
                  <div className="w-full h-full bg-muted/5 border border-border/20 dark:bg-muted/10">
                    <div className="w-full h-full p-1 text-muted-foreground/30 text-xs dark:text-muted-foreground/50">
                      {date.getDate()}
                    </div>
                  </div>
                )
              }
              
              return (
                <button
                  {...buttonProps}
                  type="button"
                  className={cn(
                    "w-full h-full relative overflow-hidden transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:z-10",
                    "hover:bg-gradient-to-br hover:from-indigo-50 hover:to-blue-50 hover:shadow-sm dark:hover:from-indigo-900/20 dark:hover:to-blue-900/20",
                    isSelected && "bg-gradient-to-br from-indigo-100 to-indigo-200 border-indigo-300 ring-2 ring-indigo-300/50 z-20 shadow-md dark:from-indigo-900/70 dark:to-indigo-800/70 dark:border-indigo-500 dark:ring-indigo-500/70",
                    isToday && !isSelected && "bg-gradient-to-br from-primary/20 to-primary/30 border-primary/40 shadow-sm dark:from-primary/30 dark:to-primary/20 dark:border-primary/60",
                    hasBooking && !isSelected && !isToday && "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700/50",
                    hasBooking && isSelected && "bg-gradient-to-br from-indigo-200 to-indigo-300 dark:from-indigo-800/80 dark:to-indigo-700/80",
                    hasBooking && isToday && !isSelected && "bg-gradient-to-br from-primary/30 to-primary/40 border-primary/50 dark:from-primary/40 dark:to-primary/30 dark:border-primary/70"
                  )}
                  onClick={() => {
                    console.log('Day clicked:', date, 'modifiers:', modifiers)
                    setSelectedDate(date)
                    onSelectDate?.(date)
                  }}
                >
                  {dayRenderer(date)}
                </button>
              )
            },
            IconLeft: () => <ChevronLeft className="h-4 w-4" />,
            IconRight: () => <ChevronRight className="h-4 w-4" />,
          }}
        />
      </Card>

      <Card className="p-4 min-h-[495px] max-h-[750px] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold text-base">
            {selectedDate ? selectedDate.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            }) : 'Selected Day'}
          </div>
          {loading && <div className="text-xs text-muted-foreground">Loading…</div>}
        </div>
        
        {!selectedDate && (
          <div className="text-sm text-muted-foreground mb-4 text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Select a Date</p>
            <p className="text-xs mt-1">Click on a calendar date to view bookings</p>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
          {selectedEvents.length === 0 && selectedDate ? (
            <div className="text-sm text-muted-foreground text-center py-12">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="font-medium">No Bookings</p>
              <p className="text-xs mt-1">This day has no scheduled bookings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((e) => (
                <button
                  key={e.id}
                  className="w-full text-left p-4 rounded-xl border border-border/50 hover:border-indigo-200 hover:bg-gradient-to-br hover:from-indigo-50/50 hover:to-blue-50/50 dark:hover:from-indigo-950/20 dark:hover:to-blue-950/20 transition-all duration-300 group shadow-sm hover:shadow-md"
                  onClick={() => onSelectEvent?.(e)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium truncate text-sm group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                      {e.title}
                    </div>
                    {e.time && (
                      <div className="text-xs text-muted-foreground bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 px-3 py-1.5 rounded-full font-medium">
                        {e.time}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn(
                      "px-3 py-1 text-[11px] border-0 font-medium shadow-sm transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200/50 dark:hover:shadow-indigo-900/30",
                      palette[e.status || 'pending']
                    )}>
                      {e.status ? e.status.charAt(0).toUpperCase() + e.status.slice(1) : 'Pending'}
                    </Badge>
                    <Badge variant="secondary" className="px-3 py-1 text-[11px] bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg hover:bg-slate-200 hover:text-slate-900 hover:shadow-slate-200/50 dark:hover:bg-slate-700 dark:hover:text-slate-100 dark:hover:shadow-slate-900/30">
                      {e.category}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default AdvancedBookingsCalendar

