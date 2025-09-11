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
        const data = await bookingsApi.getCustomerBookings()
        setBookings(data)
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