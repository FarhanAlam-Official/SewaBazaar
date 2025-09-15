/**
 * Time utility functions for consistent time formatting across the application
 */

/**
 * Convert 24-hour time string to 12-hour format with AM/PM
 * @param time24 - Time in 24-hour format (e.g., "14:30:00" or "14:30")
 * @returns Time in 12-hour format (e.g., "2:30 PM")
 */
export const formatTime12Hr = (time24: string): string => {
  if (!time24) return 'Time not set'
  
  // Handle both "HH:MM:SS" and "HH:MM" formats
  const timeString = time24.includes(':') ? time24 : `${time24}:00`
  const [hours, minutes] = timeString.split(':').map(Number)
  
  if (isNaN(hours) || isNaN(minutes)) return 'Invalid time'
  
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Format time range from start and end times
 * @param startTime - Start time in 24-hour format
 * @param endTime - End time in 24-hour format
 * @returns Formatted time range (e.g., "2:30 PM - 4:30 PM")
 */
export const formatTimeRange = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return 'Time not set'
  
  const start12Hr = formatTime12Hr(startTime)
  const end12Hr = formatTime12Hr(endTime)
  
  return `${start12Hr} - ${end12Hr}`
}

/**
 * Format booking time display - handles both single time and time range
 * @param bookingTime - Single booking time
 * @param bookingSlot - Optional booking slot with time range
 * @returns Formatted time display
 */
export const formatBookingTime = (bookingTime: string, bookingSlot?: string): string => {
  // If we have booking slot details, try to extract time range
  if (bookingSlot && bookingSlot.includes(' - ')) {
    // bookingSlot is already formatted as time range
    return bookingSlot
  }
  
  // If we have booking slot with start and end times, format as range
  if (bookingSlot && bookingSlot.includes(':')) {
    // Assume bookingSlot contains time range information
    // This might need adjustment based on actual data structure
    return bookingSlot
  }
  
  // Fallback to single time
  return formatTime12Hr(bookingTime)
}

/**
 * Extract time range from booking slot details
 * @param bookingSlot - Booking slot string that might contain time range
 * @returns Formatted time range or single time
 */
export const extractTimeFromSlot = (bookingSlot: string): string => {
  if (!bookingSlot) return ''
  
  // If it already contains a time range format, return as is
  if (bookingSlot.includes(' - ') && bookingSlot.includes('AM') || bookingSlot.includes('PM')) {
    return bookingSlot
  }
  
  // If it contains time information, try to format it
  if (bookingSlot.includes(':')) {
    // This might need more sophisticated parsing based on actual data structure
    return bookingSlot
  }
  
  return bookingSlot
}
