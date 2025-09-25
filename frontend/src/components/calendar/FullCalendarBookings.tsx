/**
 * @fileoverview FullCalendar Bookings Component
 * 
 * A modern calendar component for booking management in the SewaBazaar platform using FullCalendar.
 * Provides a comprehensive view of bookings with interactive features and responsive design.
 * 
 * Key Features:
 * - Interactive calendar with day, week, and month views
 * - Color-coded booking status visualization
 * - Click-to-select date and event functionality
 * - Responsive design for all device sizes
 * - Support for multiple bookings per day
 * - Accessibility features
 * 
 * @author SewaBazaar Development Team
 * @version 1.0.0
 * @since 2024
 */

"use client"

import React, { useMemo, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Card } from '@/components/ui/card'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Import custom styles
import './FullCalendarBookings.css'

/**
 * @interface CalendarEvent
 * @description Represents a single booking event displayed on the calendar
 * 
 * @property {string | number} id - Unique identifier for the event
 * @property {string | Date} date - Event date (supports multiple formats)
 * @property {string} [time] - Optional time string for the event
 * @property {string} title - Display title for the event
 * @property {string} category - Event category for grouping and filtering
 * @property {string} [status] - Booking status (pending, confirmed, completed, cancelled)
 * @property {Record<string, unknown>} [meta] - Additional metadata for the event
 */
export type CalendarEvent = {
  id: string | number
  date: string | Date
  time?: string
  title: string
  category: string
  status?: string
  meta?: Record<string, unknown>
}

/**
 * Format time string for FullCalendar
 * 
 * Converts various time formats to ISO string format required by FullCalendar
 * 
 * @param date - The date string in YYYY-MM-DD format
 * @param time - The time string in various formats (12h or 24h)
 * @returns Formatted datetime string for FullCalendar
 */
const formatTimeForCalendar = (date: string, time: string): string => {
  console.log('Formatting time for calendar:', { date, time });
  
  try {
    // Handle different time formats
    let formattedTime = time;
    
    // If time contains AM/PM, convert to 24-hour format
    if (time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')) {
      const parts = time.toLowerCase().split(/\s+/);
      const timePart = parts[0];
      const modifier = parts[1];
      const timeParts = timePart.split(':');
      let hours = Number(timeParts[0]);
      const minutes = Number(timeParts[1]);
      
      // Convert to 24-hour format
      if (modifier === 'pm' && hours < 12) {
        hours += 12;
      } else if (modifier === 'am' && hours === 12) {
        hours = 0;
      }
      
      // Format as HH:MM
      formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // If time contains a range (e.g., "10:00 - 11:00"), use the start time
    if (formattedTime.includes('-')) {
      formattedTime = formattedTime.split('-')[0].trim();
    }
    
    // Ensure time is in HH:MM format
    if (!formattedTime.match(/^\d{1,2}:\d{2}$/)) {
      throw new Error(`Invalid time format: ${time}`);
    }
    
    // Combine date and time
    return `${date}T${formattedTime}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    // Return just the date if we can't format the time
    return date;
  }
}

/**
 * @interface FullCalendarBookingsProps
 * @description Configuration properties for the FullCalendarBookings component
 * 
 * @property {CalendarEvent[]} events - Array of booking events to display
 * @property {Date} [initialDate] - Initial date to show on calendar load
 * @property {boolean} [loading] - Loading state indicator
 * @property {function} [onSelectEvent] - Callback when an event is selected
 * @property {function} [onSelectDate] - Callback when a date is selected
 * @property {object} [filters] - Filter configuration for categories and statuses
 * @property {function} [onChangeFilters] - Callback when filters are changed
 * @property {string} [className] - Additional CSS classes for styling
 */
export type FullCalendarBookingsProps = {
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
  className?: string
}

/**
 * Get event background color and CSS class based on status
 */
const getEventColor = (status?: string): { backgroundColor: string; borderColor: string; className: string } => {
  const s = status?.toLowerCase() || ''
  // normalize backend statuses and synonyms
  const normalized =
    s === 'awaiting_confirmation' || s.includes('await') ? 'awaiting' :
    s === 'service_delivered' || s.includes('deliver') ? 'delivered' :
    s === 'payment_pending' ? 'payment_pending' :
    s === 'disputed' ? 'disputed' :
    s
  switch (normalized) {
    case 'pending':
      return { backgroundColor: 'transparent', borderColor: 'transparent', className: 'status-pending minimal-event' }
    case 'confirmed':
      return { backgroundColor: 'transparent', borderColor: 'transparent', className: 'status-confirmed minimal-event' }
    case 'completed':
      return { backgroundColor: 'transparent', borderColor: 'transparent', className: 'status-completed minimal-event' }
    case 'cancelled':
      return { backgroundColor: 'transparent', borderColor: 'transparent', className: 'status-cancelled minimal-event' }
    case 'awaiting':
      return { backgroundColor: 'transparent', borderColor: 'transparent', className: 'status-awaiting minimal-event' }
    case 'delivered':
      return { backgroundColor: 'transparent', borderColor: 'transparent', className: 'status-delivered minimal-event' }
    case 'payment_pending':
      return { backgroundColor: 'transparent', borderColor: 'transparent', className: 'status-payment minimal-event' }
    case 'disputed':
      return { backgroundColor: 'transparent', borderColor: 'transparent', className: 'status-disputed minimal-event' }
    default:
      return { backgroundColor: 'transparent', borderColor: 'transparent', className: 'status-default minimal-event' }
  }
}

/**
 * FullCalendarBookings Component
 * 
 * A modern calendar component for booking management using FullCalendar library.
 */
const FullCalendarBookings: React.FC<FullCalendarBookingsProps> = ({
  events,
  initialDate = new Date(),
  loading = false,
  onSelectEvent,
  onSelectDate,
  filters,
  onChangeFilters,
  className,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate ?? new Date())

  // Debug events data
  console.log('FullCalendarBookings - Raw events:', events);

  // Utilities to group events by YYYY-MM-DD for sidebar
  const formatKey = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const buckets = useMemo(() => {
    const byDay: Record<string, CalendarEvent[]> = {}
    for (const e of events) {
      // Apply status filter like Advanced calendar
      if (filters?.statuses?.length && e.status && !filters.statuses.includes(e.status.toLowerCase())) {
        continue
      }
      let d: Date | null = null
      if (e.date instanceof Date) d = e.date
      else if (typeof e.date === 'string') {
        if (e.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [y, m, day] = e.date.split('-').map(Number)
          d = new Date(y, m - 1, day)
        } else {
          const parsed = new Date(e.date)
          if (!isNaN(parsed.getTime())) d = parsed
        }
      }
      if (!d) continue
      const key = formatKey(d)
      if (!byDay[key]) byDay[key] = []
      byDay[key].push(e)
    }
    return byDay
  }, [events, filters?.statuses])

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [] as CalendarEvent[]
    const key = formatKey(selectedDate)
    return buckets[key] ?? []
  }, [buckets, selectedDate])
  
  // Transform events to FullCalendar format
  const calendarEvents = events
    .filter(event => {
      // Apply status filters if provided
      if (filters?.statuses?.length && event.status) {
        return filters.statuses.includes(event.status.toLowerCase())
      }
      return true
    })
    .map(event => {
      const { backgroundColor, borderColor, className } = getEventColor(event.status)
      
      // Debug individual event transformation
      console.log('Processing event:', {
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        status: event.status,
        category: event.category
      });
      
      // Fix date formatting issues
      let startDate;
      
      try {
        // Handle different date formats
        if (typeof event.date === 'string') {
          // If it's already a string date (YYYY-MM-DD)
          if (event.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            startDate = event.date;
          } else {
            // Try to parse other string date formats
            const parsedDate = new Date(event.date);
            if (!isNaN(parsedDate.getTime())) {
              startDate = parsedDate.toISOString().split('T')[0];
            }
          }
        } else if (event.date instanceof Date) {
          // If it's already a Date object
          startDate = event.date.toISOString().split('T')[0];
        }
        
        console.log('Processed date for event:', event.id, 'Date:', startDate);
        
        // If we couldn't process the date, log an error
        if (!startDate) {
          console.error('Could not process date for event:', event);
          return null; // Skip this event
        }
        
        const formattedEvent = {
          id: String(event.id),
          title: '',
          start: event.time 
            ? formatTimeForCalendar(startDate, event.time)
            : startDate,
          backgroundColor,
          borderColor,
          textColor: 'transparent',
          className,
          extendedProps: {
            category: event.category,
            status: event.status,
            originalEvent: event
          }
        };
      
        console.log('Formatted calendar event:', formattedEvent);
        return formattedEvent;
      } catch (error) {
        console.error('Error processing event:', event, error);
        return null; // Skip this event if there's an error
      }
    })
    .filter((event) => event !== null); // Filter out null events
    
  console.log('FullCalendarBookings - Transformed events:', calendarEvents);

  return (
    <Card className={cn("w-full", className)}>
      <div className="p-4 grid gap-4 sm:gap-5 lg:gap-6 lg:grid-cols-[2.4fr,1.2fr] xl:grid-cols-[2.8fr,1.4fr]">
        <div className="min-w-0">
          <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={initialDate}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          events={calendarEvents}
          eventClick={(info) => {
            if (onSelectEvent && info.event.extendedProps?.originalEvent) {
              onSelectEvent(info.event.extendedProps.originalEvent as CalendarEvent)
            }
          }}
          dateClick={(info) => {
            setSelectedDate(info.date)
            onSelectDate?.(info.date)
          }}
          height="auto"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: 'short'
          }}
          dayMaxEvents={false}
          eventDisplay="none"
          dayCellContent={(dayInfo) => {
            const dayDate = dayInfo.date
            const dayKey = formatKey(dayDate)
            const dayEvents = buckets[dayKey] || []
            
            // Group events by status and count them
            const statusCounts = new Map<string, number>()
            dayEvents.forEach(event => {
              const status = event.status || 'pending'
              statusCounts.set(status, (statusCounts.get(status) || 0) + 1)
            })
            
            const statusEntries = Array.from(statusCounts.entries())
            // Show at most 3 colored bars; the 4th row is a +N overflow bar
            const maxBars = 3
            const visibleStatuses = statusEntries.slice(0, maxBars)
            const overflowCount = statusEntries.length > maxBars
              ? statusEntries.slice(maxBars).reduce((sum, [, count]) => sum + count, 0)
              : 0
            
            return (
              <div className="w-full h-full flex flex-col">
                {/* Day number with special style for today */}
                <div className="text-sm font-medium mb-1 flex items-center justify-start">
                  {(() => {
                    const today = new Date()
                    const isToday = today.getFullYear() === dayDate.getFullYear() && today.getMonth() === dayDate.getMonth() && today.getDate() === dayDate.getDate()
                    if (isToday) {
                      return (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs shadow-sm">
                          {dayDate.getDate()}
                        </span>
                      )
                    }
                    return <span>{dayDate.getDate()}</span>
                  })()}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  {visibleStatuses.map(([status, count]) => (
                    <div
                      key={status}
                      className={cn(
                        "h-4 w-11/12 mx-auto rounded-md transition-all duration-200 flex items-center justify-center relative overflow-hidden",
                        status === 'pending' && 'bg-orange-500',
                        status === 'confirmed' && 'bg-green-500',
                        status === 'completed' && 'bg-blue-500',
                        status === 'cancelled' && 'bg-red-500',
                        (status === 'awaiting' || status === 'awaiting confirmation' || status === 'awaiting_confirmation') && 'bg-amber-400',
                        (status === 'delivered' || status === 'service delivered' || status === 'service_delivered') && 'bg-violet-500',
                        (status === 'payment_pending') && 'bg-yellow-400',
                        (status === 'disputed') && 'bg-rose-500'
                      )}
                      title={`${status}: ${count} booking${count > 1 ? 's' : ''}`}
                    >
                      <span className="text-white text-[10px] font-bold leading-none">
                        {count}
                      </span>
                    </div>
                  ))}
                  {overflowCount > 0 && (
                    <div className="h-4 w-11/12 mx-auto rounded-md bg-slate-600 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold leading-none">+{overflowCount}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          }}
          dayCellClassNames={(arg) => {
            const d = arg.date
            const isSelected = selectedDate && d.getFullYear() === selectedDate.getFullYear() && d.getMonth() === selectedDate.getMonth() && d.getDate() === selectedDate.getDate()
            return cn('hover:bg-gray-50', isSelected && 'fc-day-selected')
          }}
          firstDay={1} // Week starts on Monday
        />
        </div>

        {/* Right side details panel */}
        <div className="min-h-[420px] max-h-[720px] overflow-hidden flex flex-col rounded-lg border bg-card">
          <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b">
            <div className="font-semibold text-base">
              {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Selected Day'}
            </div>
            {loading && <div className="text-xs text-gray-500">Loading…</div>}
          </div>

          {!selectedDate && (
            <div className="text-sm text-muted-foreground m-4 text-center py-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-gray-400" />
              </div>
              <p className="font-medium">Select a Date</p>
              <p className="text-xs mt-1">Click on a calendar date to view bookings</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border/50">
            {selectedDate && selectedEvents.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-10">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                </div>
                <p className="font-medium">No Bookings</p>
                <p className="text-xs mt-1">This day has no scheduled bookings</p>
              </div>
            ) : (
              <div className="space-y-2.5 p-3">
                {selectedEvents
                  .slice()
                  .sort((a, b) => {
                    const pa = (a.time || '').split(':').map(Number)
                    const pb = (b.time || '').split(':').map(Number)
                    if (pa.length < 2 || pb.length < 2 || isNaN(pa[0]) || isNaN(pb[0])) return 0
                    return pa[0] !== pb[0] ? pa[0] - pb[0] : pa[1] - pb[1]
                  })
                  .map((e) => (
                  <button
                    key={e.id}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border border-border/60 bg-card",
                      "hover:border-indigo-200 dark:hover:border-indigo-400/40",
                      "hover:bg-gradient-to-br hover:from-indigo-50/50 hover:to-blue-50/50",
                      "dark:hover:from-indigo-950/10 dark:hover:to-blue-950/10",
                      "transition-all duration-200 group shadow-sm hover:shadow-md"
                    )}
                    onClick={() => onSelectEvent?.(e)}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-medium truncate text-sm group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                        {e.title}
                      </div>
                      {e.time && (
                        <div className="text-xs text-muted-foreground bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 px-2.5 py-1 rounded-full font-medium">
                          {e.time}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span
                        aria-hidden
                        className={cn(
                          "inline-block w-2.5 h-2.5 rounded-full",
                          e.status?.toLowerCase() === 'pending' && 'bg-orange-500',
                          e.status?.toLowerCase() === 'confirmed' && 'bg-emerald-500',
                          e.status?.toLowerCase() === 'completed' && 'bg-indigo-500',
                          e.status?.toLowerCase() === 'cancelled' && 'bg-rose-500',
                          (e.status?.toLowerCase() === 'awaiting' || e.status?.toLowerCase() === 'awaiting confirmation' || e.status?.toLowerCase() === 'awaiting_confirmation') && 'bg-cyan-500',
                          (e.status?.toLowerCase() === 'delivered' || e.status?.toLowerCase() === 'service delivered' || e.status?.toLowerCase() === 'service_delivered') && 'bg-violet-500',
                          (e.status?.toLowerCase() === 'payment_pending') && 'bg-lime-500',
                          (e.status?.toLowerCase() === 'disputed') && 'bg-red-700',
                          !e.status && 'bg-gray-400'
                        )}
                      />
                      {e.status && (
                        <span className="capitalize">{e.status}</span>
                      )}
                      <span>•</span>
                      <span className="truncate">{e.category}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default FullCalendarBookings