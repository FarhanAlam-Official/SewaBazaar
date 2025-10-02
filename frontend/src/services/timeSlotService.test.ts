import { timeSlotService, TimeSlot, TimeSlotAvailability } from './timeSlotService'
import api from './api'

// Mock the API
jest.mock('./api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}))

const mockApi = api as jest.Mocked<typeof api>

describe('timeSlotService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAvailableSlots', () => {
    const mockSlotAvailability: TimeSlotAvailability = {
      date: '2023-12-15',
      slots: [
        {
          id: '1',
          service_id: 1,
          date: '2023-12-15',
          start_time: '09:00',
          end_time: '12:00',
          is_available: true,
          max_bookings: 1,
          current_bookings: 0,
          created_at: '2023-12-01T00:00:00Z',
          updated_at: '2023-12-01T00:00:00Z',
        },
        {
          id: '2',
          service_id: 1,
          date: '2023-12-15',
          start_time: '12:00',
          end_time: '15:00',
          is_available: false,
          max_bookings: 1,
          current_bookings: 1,
          created_at: '2023-12-01T00:00:00Z',
          updated_at: '2023-12-01T00:00:00Z',
        },
      ],
      total_slots: 2,
      available_slots: 1,
    }

    it('should fetch available slots for a service and date', async () => {
      mockApi.get.mockResolvedValue({ data: mockSlotAvailability })

      const result = await timeSlotService.getAvailableSlots(1, '2023-12-15')

      expect(mockApi.get).toHaveBeenCalledWith('/bookings/booking_slots/available_slots/', {
        params: { service_id: 1, date: '2023-12-15' },
      })
      expect(result).toEqual(mockSlotAvailability)
    })

    it('should handle API errors', async () => {
      const errorResponse = {
        response: {
          data: { detail: 'Service not found' },
        },
      }
      mockApi.get.mockRejectedValue(errorResponse)

      await expect(
        timeSlotService.getAvailableSlots(999, '2023-12-15')
      ).rejects.toThrow('Service not found')
    })

    it('should handle generic errors', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'))

      await expect(
        timeSlotService.getAvailableSlots(1, '2023-12-15')
      ).rejects.toThrow('Failed to fetch time slots')
    })
  })

  describe('getAvailableSlotsRange', () => {
    const mockSlotsRange: TimeSlotAvailability[] = [
      {
        date: '2023-12-15',
        slots: [],
        total_slots: 2,
        available_slots: 1,
      },
      {
        date: '2023-12-16',
        slots: [],
        total_slots: 2,
        available_slots: 2,
      },
    ]

    it('should fetch available slots for a date range', async () => {
      mockApi.get.mockResolvedValue({ data: mockSlotsRange })

      const result = await timeSlotService.getAvailableSlotsRange(
        1,
        '2023-12-15',
        '2023-12-16'
      )

      expect(mockApi.get).toHaveBeenCalledWith('/bookings/booking_slots/available_slots/', {
        params: {
          service_id: 1,
          start_date: '2023-12-15',
          end_date: '2023-12-16',
        },
      })
      expect(result).toEqual(mockSlotsRange)
    })
  })

  describe('createTimeSlot', () => {
    const mockTimeSlot: TimeSlot = {
      id: '3',
      service_id: 1,
      date: '2023-12-15',
      start_time: '15:00',
      end_time: '18:00',
      is_available: true,
      max_bookings: 1,
      current_bookings: 0,
      created_at: '2023-12-01T00:00:00Z',
      updated_at: '2023-12-01T00:00:00Z',
    }

    it('should create a new time slot', async () => {
      mockApi.post.mockResolvedValue({ data: mockTimeSlot })

      const createData = {
        service_id: 1,
        date: '2023-12-15',
        start_time: '15:00',
        end_time: '18:00',
        max_bookings: 1,
      }

      const result = await timeSlotService.createTimeSlot(createData)

      expect(mockApi.post).toHaveBeenCalledWith('/bookings/booking-slots/', createData)
      expect(result).toEqual(mockTimeSlot)
    })

    it('should handle creation errors', async () => {
      const errorResponse = {
        response: {
          data: { detail: 'Time slot conflicts with existing slot' },
        },
      }
      mockApi.post.mockRejectedValue(errorResponse)

      const createData = {
        service_id: 1,
        date: '2023-12-15',
        start_time: '15:00',
        end_time: '18:00',
      }

      await expect(
        timeSlotService.createTimeSlot(createData)
      ).rejects.toThrow('Time slot conflicts with existing slot')
    })
  })

  describe('updateTimeSlot', () => {
    const mockUpdatedSlot: TimeSlot = {
      id: '1',
      service_id: 1,
      date: '2023-12-15',
      start_time: '09:00',
      end_time: '12:00',
      is_available: false,
      max_bookings: 2,
      current_bookings: 0,
      created_at: '2023-12-01T00:00:00Z',
      updated_at: '2023-12-01T12:00:00Z',
    }

    it('should update an existing time slot', async () => {
      mockApi.patch.mockResolvedValue({ data: mockUpdatedSlot })

      const updateData = {
        is_available: false,
        max_bookings: 2,
      }

      const result = await timeSlotService.updateTimeSlot('1', updateData)

      expect(mockApi.patch).toHaveBeenCalledWith('/time-slots/1/', updateData)
      expect(result).toEqual(mockUpdatedSlot)
    })

    it('should handle update errors', async () => {
      const errorResponse = {
        response: {
          data: { detail: 'Time slot not found' },
        },
      }
      mockApi.patch.mockRejectedValue(errorResponse)

      await expect(
        timeSlotService.updateTimeSlot('999', { is_available: false })
      ).rejects.toThrow('Time slot not found')
    })
  })

  describe('deleteTimeSlot', () => {
    it('should delete a time slot', async () => {
      mockApi.delete.mockResolvedValue({})

      await timeSlotService.deleteTimeSlot('1')

      expect(mockApi.delete).toHaveBeenCalledWith('/time-slots/1/')
    })

    it('should handle deletion errors', async () => {
      const errorResponse = {
        response: {
          data: { detail: 'Cannot delete booked time slot' },
        },
      }
      mockApi.delete.mockRejectedValue(errorResponse)

      await expect(
        timeSlotService.deleteTimeSlot('1')
      ).rejects.toThrow('Cannot delete booked time slot')
    })
  })

  describe('checkSlotAvailability', () => {
    it('should check if a slot is available', async () => {
      mockApi.get.mockResolvedValue({ data: { is_available: true } })

      const result = await timeSlotService.checkSlotAvailability('1')

      expect(mockApi.get).toHaveBeenCalledWith('/time-slots/1/availability/')
      expect(result).toBe(true)
    })

    it('should return false for unavailable slots', async () => {
      mockApi.get.mockResolvedValue({ data: { is_available: false } })

      const result = await timeSlotService.checkSlotAvailability('1')

      expect(result).toBe(false)
    })
  })

  describe('reserveTimeSlot', () => {
    const mockReservation = {
      reservation_id: 'res_123',
      expires_at: '2023-12-15T10:15:00Z',
    }

    it('should reserve a time slot with default duration', async () => {
      mockApi.post.mockResolvedValue({ data: mockReservation })

      const result = await timeSlotService.reserveTimeSlot('1')

      expect(mockApi.post).toHaveBeenCalledWith('/time-slots/1/reserve/', {
        reservation_minutes: 15,
      })
      expect(result).toEqual(mockReservation)
    })

    it('should reserve a time slot with custom duration', async () => {
      mockApi.post.mockResolvedValue({ data: mockReservation })

      const result = await timeSlotService.reserveTimeSlot('1', 30)

      expect(mockApi.post).toHaveBeenCalledWith('/time-slots/1/reserve/', {
        reservation_minutes: 30,
      })
      expect(result).toEqual(mockReservation)
    })

    it('should handle reservation errors', async () => {
      const errorResponse = {
        response: {
          data: { detail: 'Time slot is no longer available' },
        },
      }
      mockApi.post.mockRejectedValue(errorResponse)

      await expect(
        timeSlotService.reserveTimeSlot('1')
      ).rejects.toThrow('Time slot is no longer available')
    })
  })

  describe('releaseReservation', () => {
    it('should release a reservation', async () => {
      mockApi.delete.mockResolvedValue({})

      await timeSlotService.releaseReservation('res_123')

      expect(mockApi.delete).toHaveBeenCalledWith('/time-slot-reservations/res_123/')
    })

    it('should handle release errors', async () => {
      const errorResponse = {
        response: {
          data: { detail: 'Reservation not found' },
        },
      }
      mockApi.delete.mockRejectedValue(errorResponse)

      await expect(
        timeSlotService.releaseReservation('res_999')
      ).rejects.toThrow('Reservation not found')
    })
  })

  describe('generateDefaultSlots', () => {
    const mockGeneratedSlots: TimeSlot[] = [
      {
        id: '4',
        service_id: 1,
        date: '2023-12-15',
        start_time: '09:00',
        end_time: '12:00',
        is_available: true,
        max_bookings: 1,
        current_bookings: 0,
        created_at: '2023-12-01T00:00:00Z',
        updated_at: '2023-12-01T00:00:00Z',
      },
      {
        id: '5',
        service_id: 1,
        date: '2023-12-15',
        start_time: '12:00',
        end_time: '15:00',
        is_available: true,
        max_bookings: 1,
        current_bookings: 0,
        created_at: '2023-12-01T00:00:00Z',
        updated_at: '2023-12-01T00:00:00Z',
      },
    ]

    it('should generate default slots for a service', async () => {
      mockApi.post.mockResolvedValue({ data: mockGeneratedSlots })

      const result = await timeSlotService.generateDefaultSlots(
        1,
        '2023-12-15',
        '2023-12-16'
      )

      expect(mockApi.post).toHaveBeenCalledWith('/services/1/generate-slots/', {
        start_date: '2023-12-15',
        end_date: '2023-12-16',
      })
      expect(result).toEqual(mockGeneratedSlots)
    })

    it('should handle generation errors', async () => {
      const errorResponse = {
        response: {
          data: { detail: 'Service availability not configured' },
        },
      }
      mockApi.post.mockRejectedValue(errorResponse)

      await expect(
        timeSlotService.generateDefaultSlots(1, '2023-12-15', '2023-12-16')
      ).rejects.toThrow('Service availability not configured')
    })
  })

  describe('getProviderSlotStats', () => {
    const mockStats = {
      total_slots: 100,
      booked_slots: 75,
      available_slots: 25,
      booking_rate: 0.75,
      revenue_potential: 90000,
      peak_hours: [
        { hour: 9, bookings: 15 },
        { hour: 14, bookings: 12 },
        { hour: 16, bookings: 10 },
      ],
    }

    it('should fetch provider slot statistics', async () => {
      mockApi.get.mockResolvedValue({ data: mockStats })

      const result = await timeSlotService.getProviderSlotStats(
        1,
        '2023-12-01',
        '2023-12-31'
      )

      expect(mockApi.get).toHaveBeenCalledWith('/providers/1/slot-stats/', {
        params: {
          start_date: '2023-12-01',
          end_date: '2023-12-31',
        },
      })
      expect(result).toEqual(mockStats)
    })

    it('should handle stats errors', async () => {
      const errorResponse = {
        response: {
          data: { detail: 'Provider not found' },
        },
      }
      mockApi.get.mockRejectedValue(errorResponse)

      await expect(
        timeSlotService.getProviderSlotStats(999, '2023-12-01', '2023-12-31')
      ).rejects.toThrow('Provider not found')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockApi.get.mockRejectedValue(new Error('Network Error'))

      await expect(
        timeSlotService.getAvailableSlots(1, '2023-12-15')
      ).rejects.toThrow('Failed to fetch time slots')
    })

    it('should handle timeout errors', async () => {
      mockApi.get.mockRejectedValue(new Error('timeout'))

      await expect(
        timeSlotService.checkSlotAvailability('1')
      ).rejects.toThrow('Failed to check slot availability')
    })

    it('should handle malformed responses', async () => {
      mockApi.get.mockResolvedValue({ data: null })

      const result = await timeSlotService.getAvailableSlots(1, '2023-12-15')
      expect(result).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty slot arrays', async () => {
      const emptyAvailability: TimeSlotAvailability = {
        date: '2023-12-15',
        slots: [],
        total_slots: 0,
        available_slots: 0,
      }

      mockApi.get.mockResolvedValue({ data: emptyAvailability })

      const result = await timeSlotService.getAvailableSlots(1, '2023-12-15')
      expect(result.slots).toHaveLength(0)
      expect(result.available_slots).toBe(0)
    })

    it('should handle invalid date formats', async () => {
      const errorResponse = {
        response: {
          data: { detail: 'Invalid date format' },
        },
      }
      mockApi.get.mockRejectedValue(errorResponse)

      await expect(
        timeSlotService.getAvailableSlots(1, 'invalid-date')
      ).rejects.toThrow('Invalid date format')
    })

    it('should handle concurrent reservation attempts', async () => {
      const errorResponse = {
        response: {
          data: { detail: 'Time slot was just reserved by another user' },
        },
      }
      mockApi.post.mockRejectedValue(errorResponse)

      await expect(
        timeSlotService.reserveTimeSlot('1')
      ).rejects.toThrow('Time slot was just reserved by another user')
    })
  })

  describe('Performance', () => {
    it('should handle large numbers of slots efficiently', async () => {
      const largeSlotArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        service_id: 1,
        date: '2023-12-15',
        start_time: '09:00',
        end_time: '12:00',
        is_available: true,
        max_bookings: 1,
        current_bookings: 0,
        created_at: '2023-12-01T00:00:00Z',
        updated_at: '2023-12-01T00:00:00Z',
      }))

      const largeAvailability: TimeSlotAvailability = {
        date: '2023-12-15',
        slots: largeSlotArray,
        total_slots: 1000,
        available_slots: 1000,
      }

      mockApi.get.mockResolvedValue({ data: largeAvailability })

      const result = await timeSlotService.getAvailableSlots(1, '2023-12-15')
      expect(result.slots).toHaveLength(1000)
    })
  })
})