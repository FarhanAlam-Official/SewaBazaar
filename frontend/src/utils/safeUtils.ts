/**
 * Safe utility functions to prevent runtime errors
 * when dealing with potentially undefined or null values
 */

/**
 * Safely format a number to fixed decimal places
 * @param value - The value to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string or '0.0' if invalid
 */
export const safeToFixed = (value: any, decimals: number = 1): string => {
  if (typeof value === 'number' && !isNaN(value)) {
    return value.toFixed(decimals)
  }
  return '0.0'
}

/**
 * Safely get array length
 * @param array - The array to check
 * @returns Length of array or 0 if not an array
 */
export const safeArrayLength = (array: any): number => {
  return Array.isArray(array) ? array.length : 0
}

/**
 * Safely slice an array
 * @param array - The array to slice
 * @param start - Start index
 * @param end - End index (optional)
 * @returns Sliced array or empty array if not an array
 */
export const safeArraySlice = (array: any, start: number, end?: number): any[] => {
  if (!Array.isArray(array)) return []
  return end !== undefined ? array.slice(start, end) : array.slice(start)
}

/**
 * Safely map over an array
 * @param array - The array to map over
 * @param callback - The mapping function
 * @returns Mapped array or empty array if not an array
 */
export const safeArrayMap = <T, U>(array: any, callback: (item: T, index: number) => U): U[] => {
  if (!Array.isArray(array)) return []
  return array.map(callback)
}

/**
 * Safely filter an array
 * @param array - The array to filter
 * @param callback - The filter function
 * @returns Filtered array or empty array if not an array
 */
export const safeArrayFilter = <T>(array: any, callback: (item: T, index: number) => boolean): T[] => {
  if (!Array.isArray(array)) return []
  return array.filter(callback)
}

/**
 * Safely find an item in an array
 * @param array - The array to search
 * @param callback - The find function
 * @returns Found item or undefined
 */
export const safeArrayFind = <T>(array: any, callback: (item: T, index: number) => boolean): T | undefined => {
  if (!Array.isArray(array)) return undefined
  return array.find(callback)
}

/**
 * Safely check if an array has items
 * @param array - The array to check
 * @returns True if array exists and has items
 */
export const safeArrayHasItems = (array: any): boolean => {
  return Array.isArray(array) && array.length > 0
}

/**
 * Safely get a property value with fallback
 * @param obj - The object to get property from
 * @param property - The property name
 * @param fallback - Fallback value if property doesn't exist
 * @returns Property value or fallback
 */
export const safeGet = (obj: any, property: string, fallback: any = null): any => {
  if (obj && typeof obj === 'object' && property in obj) {
    return obj[property]
  }
  return fallback
}

/**
 * Safely format a rating with proper fallback
 * @param rating - The rating value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted rating string
 */
export const safeFormatRating = (rating: any, decimals: number = 1): string => {
  return safeToFixed(rating, decimals)
}

/**
 * Safely format a percentage
 * @param value - The value to format as percentage
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export const safeFormatPercentage = (value: any, decimals: number = 1): string => {
  const num = typeof value === 'number' ? value : parseFloat(value) || 0
  return `${safeToFixed(num, decimals)}%`
}

/**
 * Safely format currency
 * @param value - The value to format as currency
 * @param currency - Currency symbol (default: 'NPR')
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted currency string
 */
export const safeFormatCurrency = (value: any, currency: string = 'NPR', decimals: number = 0): string => {
  const num = typeof value === 'number' ? value : parseFloat(value) || 0
  return `${currency} ${safeToFixed(num, decimals)}`
}
