"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CalendarProps {
  mode?: "single" | "multiple" | "range"
  selected?: Date | Date[] | { from: Date; to?: Date }
  onSelect?: (date: Date | Date[] | { from: Date; to?: Date } | undefined) => void
  disabled?: (date: Date) => boolean
  className?: string
  showOutsideDays?: boolean
  numberOfMonths?: number
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

function Calendar({
  mode = "single",
  selected,
  onSelect,
  disabled,
  className,
  showOutsideDays = true,
  numberOfMonths = 1,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())

  // Get the first day of the month
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  
  // Get the first day of the calendar grid (might be from previous month)
  const firstDayOfCalendar = new Date(firstDayOfMonth)
  firstDayOfCalendar.setDate(firstDayOfCalendar.getDate() - firstDayOfMonth.getDay())
  
  // Get the last day of the calendar grid (might be from next month)
  const lastDayOfCalendar = new Date(lastDayOfMonth)
  const daysToAdd = 6 - lastDayOfMonth.getDay()
  lastDayOfCalendar.setDate(lastDayOfCalendar.getDate() + daysToAdd)

  // Generate all days for the calendar grid
  const calendarDays = []
  const currentDay = new Date(firstDayOfCalendar)
  
  while (currentDay <= lastDayOfCalendar) {
    calendarDays.push(new Date(currentDay))
    currentDay.setDate(currentDay.getDate() + 1)
  }

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // Helper functions
  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear()
  }

  const isToday = (date: Date) => {
    return isSameDay(date, new Date())
  }

  const isSelected = (date: Date) => {
    if (!selected) return false
    
    if (mode === "single" && selected instanceof Date) {
      return isSameDay(date, selected)
    }
    
    if (mode === "multiple" && Array.isArray(selected)) {
      return selected.some(selectedDate => isSameDay(date, selectedDate))
    }
    
    if (mode === "range" && selected && typeof selected === "object" && "from" in selected) {
      if (!selected.to) {
        return isSameDay(date, selected.from)
      }
      return date >= selected.from && date <= selected.to
    }
    
    return false
  }

  const isOutsideMonth = (date: Date) => {
    return date.getMonth() !== currentDate.getMonth()
  }

  const isDisabled = (date: Date) => {
    return disabled ? disabled(date) : false
  }

  // Handle day click
  const handleDayClick = (date: Date) => {
    if (isDisabled(date) || !onSelect) return

    if (mode === "single") {
      onSelect(date)
    } else if (mode === "multiple") {
      const currentSelected = Array.isArray(selected) ? selected : []
      const isAlreadySelected = currentSelected.some(selectedDate => isSameDay(date, selectedDate))
      
      if (isAlreadySelected) {
        onSelect(currentSelected.filter(selectedDate => !isSameDay(date, selectedDate)))
      } else {
        onSelect([...currentSelected, date])
      }
    } else if (mode === "range") {
      const currentSelected = selected && typeof selected === "object" && "from" in selected ? selected : null
      
      if (!currentSelected || (currentSelected.from && currentSelected.to)) {
        // Start new range
        onSelect({ from: date })
      } else if (currentSelected.from && !currentSelected.to) {
        // Complete the range
        if (date >= currentSelected.from) {
          onSelect({ from: currentSelected.from, to: date })
        } else {
          onSelect({ from: date, to: currentSelected.from })
        }
      }
    }
  }

  return (
    <div className={cn("p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
          className="h-9 w-9 p-0 bg-white dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 border-slate-300 dark:border-slate-600 transition-colors duration-200"
          >
            <ChevronLeft className="h-4 w-4 text-slate-700 dark:text-slate-200" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date()
              setCurrentDate(today)
              if (mode === "single" && onSelect) {
                onSelect(today)
              }
            }}
            className="text-sm h-9 px-3 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900 border-slate-300 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-200"
          >
            Today
          </Button>
        </div>
        
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        
        <Button
          variant="outline"
          size="sm"
          onClick={goToNextMonth}
          className="h-9 w-9 p-0 bg-white dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 border-slate-300 dark:border-slate-600 transition-colors duration-200"
        >
          <ChevronRight className="h-4 w-4 text-slate-700 dark:text-slate-200" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="w-full">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="h-10 flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const isOutside = isOutsideMonth(date)
            const isSelectedDay = isSelected(date)
            const isTodayDay = isToday(date)
            const isDisabledDay = isDisabled(date)

            return (
              <button
                key={index}
                onClick={() => handleDayClick(date)}
                disabled={isDisabledDay}
                className={cn(
                  "h-10 w-full flex items-center justify-center text-sm rounded-md transition-all duration-200 focus:outline-none",
                  {
                    // Outside month days
                    "text-slate-400 dark:text-slate-500": isOutside && showOutsideDays,
                    "invisible": isOutside && !showOutsideDays,
                    
                    // Today
                    "bg-indigo-600 text-white font-semibold shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-700": isTodayDay && !isSelectedDay,
                    
                    // Selected
                    "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-sm": isSelectedDay,
                    
                    // Selected outside month days (fix for dark theme readability)
                    "dark:text-white": isSelectedDay && isOutside,
                    
                    // Disabled
                    "text-slate-300 dark:text-slate-600 cursor-not-allowed": isDisabledDay,
                    
                    // Default state
                    "text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900": !isOutside && !isTodayDay && !isSelectedDay && !isDisabledDay,
                  }
                )}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
export type { CalendarProps }