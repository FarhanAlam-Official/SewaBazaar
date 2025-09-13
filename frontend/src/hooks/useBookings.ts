import { useState, useEffect } from "react"
import { bookingsApi } from "@/services/api"
import { Booking } from "@/types"

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        
        // Fetch all pages of bookings
        let allBookings: Booking[] = []
        let currentPage = 1
        let hasNextPage = true
        
        while (hasNextPage) {
          const data = await bookingsApi.getCustomerBookings(currentPage)
          
          // Check if data is wrapped in a property
          if (data && typeof data === 'object' && !Array.isArray(data)) {
            // Look for common response wrapper properties
            const possibleArrays = ['results', 'data', 'bookings', 'items']
            for (const key of possibleArrays) {
              if (data[key] && Array.isArray(data[key])) {
                allBookings = [...allBookings, ...data[key]]
                
                // Check if there's a next page
                hasNextPage = !!data.next
                currentPage++
                break
              }
            }
            
            // If no nested array found, stop pagination
            if (!data.results && !data.data && !data.bookings && !data.items) {
              hasNextPage = false
            }
          } else if (Array.isArray(data)) {
            allBookings = [...allBookings, ...data]
            hasNextPage = false // No pagination info, assume single page
          } else {
            hasNextPage = false
          }
        }
        
        console.log(`Fetched ${allBookings.length} total bookings across ${currentPage - 1} pages`)
        setBookings(allBookings)
        setError(null)
      } catch (err) {
        setError("Failed to fetch bookings")
        console.error("Error fetching bookings:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [])

  return { bookings, loading, error }
}