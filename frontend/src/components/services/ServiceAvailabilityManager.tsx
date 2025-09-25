"use client"

import { useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { showToast } from "@/components/ui/enhanced-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Copy,
  Settings,
  AlertCircle,
  CheckCircle,
  X
} from "lucide-react"

import type { ServiceAvailability } from "@/types/provider"

interface ServiceAvailabilityManagerProps {
  serviceId: number
  availability: ServiceAvailability[]
  onAvailabilityUpdate: (availability: ServiceAvailability[]) => void
}

interface TimeSlot {
  id: string
  start_time: string
  end_time: string
  is_available: boolean
  max_bookings?: number
  price_modifier?: number
}

interface DaySchedule {
  day_of_week: number
  day_name: string
  is_available: boolean
  time_slots: TimeSlot[]
}

const DAYS_OF_WEEK = [
  { id: 0, name: "Sunday", short: "Sun" },
  { id: 1, name: "Monday", short: "Mon" },
  { id: 2, name: "Tuesday", short: "Tue" },
  { id: 3, name: "Wednesday", short: "Wed" },
  { id: 4, name: "Thursday", short: "Thu" },
  { id: 5, name: "Friday", short: "Fri" },
  { id: 6, name: "Saturday", short: "Sat" }
]

const DEFAULT_TIME_SLOTS = [
  { start: "09:00", end: "12:00", label: "Morning" },
  { start: "12:00", end: "17:00", label: "Afternoon" },
  { start: "17:00", end: "20:00", label: "Evening" }
]

export default function ServiceAvailabilityManager({
  serviceId,
  availability,
  onAvailabilityUpdate
}: ServiceAvailabilityManagerProps) {
  const [schedules, setSchedules] = useState<DaySchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("weekly")
  const [editingDay, setEditingDay] = useState<number | null>(null)

  // Initialize schedules from availability data
  useEffect(() => {
    const initialSchedules: DaySchedule[] = DAYS_OF_WEEK.map(day => {
      const existingAvailability = availability.find(a => a.day_of_week === day.id)
      
      if (existingAvailability) {
        return {
          day_of_week: day.id,
          day_name: day.name,
          is_available: existingAvailability.is_available,
          time_slots: [{
            id: `slot-${day.id}`,
            start_time: existingAvailability.start_time,
            end_time: existingAvailability.end_time,
            is_available: existingAvailability.is_available,
            max_bookings: 5,
            price_modifier: 0
          }]
        }
      }

      return {
        day_of_week: day.id,
        day_name: day.name,
        is_available: false,
        time_slots: []
      }
    })

    setSchedules(initialSchedules)
  }, [availability])

  const handleDayToggle = useCallback((dayId: number, isAvailable: boolean) => {
    setSchedules(prev => prev.map(day => {
      if (day.day_of_week === dayId) {
        return {
          ...day,
          is_available: isAvailable,
          time_slots: isAvailable && day.time_slots.length === 0 
            ? [{
                id: `slot-${dayId}-${Date.now()}`,
                start_time: "09:00",
                end_time: "17:00",
                is_available: true,
                max_bookings: 5,
                price_modifier: 0
              }]
            : day.time_slots
        }
      }
      return day
    }))
  }, [])

  const handleAddTimeSlot = useCallback((dayId: number) => {
    setSchedules(prev => prev.map(day => {
      if (day.day_of_week === dayId) {
        const newSlot: TimeSlot = {
          id: `slot-${dayId}-${Date.now()}`,
          start_time: "09:00",
          end_time: "17:00",
          is_available: true,
          max_bookings: 5,
          price_modifier: 0
        }
        return {
          ...day,
          time_slots: [...day.time_slots, newSlot]
        }
      }
      return day
    }))
  }, [])

  const handleRemoveTimeSlot = useCallback((dayId: number, slotId: string) => {
    setSchedules(prev => prev.map(day => {
      if (day.day_of_week === dayId) {
        const updatedSlots = day.time_slots.filter(slot => slot.id !== slotId)
        return {
          ...day,
          time_slots: updatedSlots,
          is_available: updatedSlots.length > 0
        }
      }
      return day
    }))
  }, [])

  const handleTimeSlotChange = useCallback((
    dayId: number, 
    slotId: string, 
    field: keyof TimeSlot, 
    value: string | boolean | number
  ) => {
    setSchedules(prev => prev.map(day => {
      if (day.day_of_week === dayId) {
        return {
          ...day,
          time_slots: day.time_slots.map(slot => 
            slot.id === slotId ? { ...slot, [field]: value } : slot
          )
        }
      }
      return day
    }))
  }, [])

  const handleApplyTemplate = useCallback((template: string) => {
    const templateSchedules = schedules.map(day => {
      let isAvailable = false
      let timeSlots: TimeSlot[] = []

      switch (template) {
        case "weekdays":
          isAvailable = day.day_of_week >= 1 && day.day_of_week <= 5
          break
        case "weekends":
          isAvailable = day.day_of_week === 0 || day.day_of_week === 6
          break
        case "all_days":
          isAvailable = true
          break
        case "custom":
          return day // Don't change
      }

      if (isAvailable) {
        timeSlots = DEFAULT_TIME_SLOTS.map((slot, index) => ({
          id: `slot-${day.day_of_week}-${index}`,
          start_time: slot.start,
          end_time: slot.end,
          is_available: true,
          max_bookings: 5,
          price_modifier: 0
        }))
      }

      return {
        ...day,
        is_available: isAvailable,
        time_slots: timeSlots
      }
    })

    setSchedules(templateSchedules)
    showToast.success({
      title: "Template Applied",
      description: `${template} template has been applied to your schedule`,
      duration: 3000
    })
  }, [schedules])

  const handleCopySchedule = useCallback((fromDayId: number, toDayId: number) => {
    const fromDay = schedules.find(day => day.day_of_week === fromDayId)
    if (!fromDay) return

    setSchedules(prev => prev.map(day => {
      if (day.day_of_week === toDayId) {
        return {
          ...day,
          is_available: fromDay.is_available,
          time_slots: fromDay.time_slots.map(slot => ({
            ...slot,
            id: `slot-${toDayId}-${Date.now()}-${Math.random()}`
          }))
        }
      }
      return day
    }))

    showToast.success({
      title: "Schedule Copied",
      description: `Schedule copied from ${fromDay.day_name}`,
      duration: 3000
    })
  }, [schedules])

  const handleSaveAvailability = useCallback(async () => {
    setLoading(true)
    try {
      // Convert schedules to availability format
      const newAvailability: ServiceAvailability[] = schedules
        .filter(day => day.is_available && day.time_slots.length > 0)
        .flatMap(day => 
          day.time_slots.map(slot => ({
            id: parseInt(slot.id.split('-')[1]) || day.day_of_week,
            day_of_week: day.day_of_week,
            day_name: day.day_name,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: slot.is_available
          }))
        )

      onAvailabilityUpdate(newAvailability)
      
      showToast.success({
        title: "Availability Updated",
        description: "Service availability has been saved successfully",
        duration: 3000
      })
    } catch (error) {
      showToast.error({
        title: "Save Failed",
        description: "Failed to save availability settings",
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }, [schedules, onAvailabilityUpdate])

  const getDayStatus = (day: DaySchedule) => {
    if (!day.is_available) return { color: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300", label: "Unavailable" }
    if (day.time_slots.length === 0) return { color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-200", label: "No Slots" }
    return { color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-200", label: "Available" }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Service Availability</h2>
          <p className="text-muted-foreground dark:text-gray-400">Manage when your service is available for booking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSaveAvailability} 
            disabled={loading}
            className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-all duration-200 hover:shadow-md"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Quick Templates */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Settings className="h-5 w-5" />
            Quick Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleApplyTemplate("weekdays")}
              className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-md transition-all duration-200"
            >
              Weekdays Only
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleApplyTemplate("weekends")}
              className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-md transition-all duration-200"
            >
              Weekends Only
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleApplyTemplate("all_days")}
              className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-md transition-all duration-200"
            >
              All Days
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleApplyTemplate("custom")}
              className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-md transition-all duration-200"
            >
              Custom Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 dark:bg-gray-800">
          <TabsTrigger 
            value="weekly" 
            className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
          >
            Weekly Schedule
          </TabsTrigger>
          <TabsTrigger 
            value="calendar" 
            className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
          >
            Calendar View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4 mt-4">
          {schedules.map((day) => {
            const status = getDayStatus(day)
            return (
              <motion.div
                key={day.day_of_week}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                whileHover={{ y: -2 }}
              >
                <Card className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={day.is_available}
                            onCheckedChange={(checked) => handleDayToggle(day.day_of_week, checked)}
                            className="dark:data-[state=checked]:bg-blue-600"
                          />
                          <h3 className="text-lg font-medium dark:text-white">{day.day_name}</h3>
                        </div>
                        <Badge className={`${status.color} transition-all duration-200`}>
                          {status.label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {day.is_available && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddTimeSlot(day.day_of_week)}
                            className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-sm transition-all duration-200"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Slot
                          </Button>
                        )}
                        
                        {/* Copy to other days */}
                        <Select onValueChange={(value) => handleCopySchedule(day.day_of_week, parseInt(value))}>
                          <SelectTrigger className="w-32 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            <SelectValue placeholder="Copy to" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                            {DAYS_OF_WEEK.filter(d => d.id !== day.day_of_week).map(d => (
                              <SelectItem key={d.id} value={d.id.toString()} className="dark:hover:bg-gray-700 dark:focus:bg-gray-700">
                                {d.short}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {day.is_available && (
                      <div className="space-y-4">
                        {day.time_slots.map((slot, index) => (
                          <motion.div
                            key={slot.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600"
                          >
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <Switch
                                checked={slot.is_available}
                                onCheckedChange={(checked) => 
                                  handleTimeSlotChange(day.day_of_week, slot.id, 'is_available', checked)
                                }
                                className="dark:data-[state=checked]:bg-blue-600"
                              />
                              <span className="text-sm font-medium dark:text-gray-200">Slot {index + 1}</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full">
                              <div className="flex flex-col">
                                <Label className="text-sm mb-1 dark:text-gray-300">From:</Label>
                                <Input
                                  type="time"
                                  value={slot.start_time}
                                  onChange={(e) => 
                                    handleTimeSlotChange(day.day_of_week, slot.id, 'start_time', e.target.value)
                                  }
                                  className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                                />
                              </div>

                              <div className="flex flex-col">
                                <Label className="text-sm mb-1 dark:text-gray-300">To:</Label>
                                <Input
                                  type="time"
                                  value={slot.end_time}
                                  onChange={(e) => 
                                    handleTimeSlotChange(day.day_of_week, slot.id, 'end_time', e.target.value)
                                  }
                                  className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                                />
                              </div>

                              <div className="flex flex-col">
                                <Label className="text-sm mb-1 dark:text-gray-300">Max Bookings:</Label>
                                <Input
                                  type="number"
                                  value={slot.max_bookings || 5}
                                  onChange={(e) => 
                                    handleTimeSlotChange(day.day_of_week, slot.id, 'max_bookings', parseInt(e.target.value) || 5)
                                  }
                                  className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                                  min="1"
                                  max="20"
                                />
                              </div>

                              <div className="flex flex-col">
                                <Label className="text-sm mb-1 dark:text-gray-300">Price Modifier:</Label>
                                <div className="flex">
                                  <Input
                                    type="number"
                                    value={slot.price_modifier || 0}
                                    onChange={(e) => 
                                      handleTimeSlotChange(day.day_of_week, slot.id, 'price_modifier', parseFloat(e.target.value) || 0)
                                    }
                                    className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                                    step="0.1"
                                  />
                                  <span className="ml-1 self-center text-sm text-muted-foreground dark:text-gray-400">%</span>
                                </div>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveTimeSlot(day.day_of_week, slot.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 mt-2 sm:mt-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        ))}

                        {day.time_slots.length === 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8 text-muted-foreground dark:text-gray-400"
                          >
                            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                            <p className="font-medium mb-1">No time slots configured for this day</p>
                            <p className="text-sm">Add time slots to make this day available for booking</p>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {!day.is_available && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-8 text-muted-foreground dark:text-gray-400"
                      >
                        <X className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                        <p className="font-medium mb-1">This day is not available for booking</p>
                        <p className="text-sm">Enable the switch above to add time slots</p>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4 mt-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Weekly Calendar View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const daySchedule = schedules.find(s => s.day_of_week === day.id)
                    const status = getDayStatus(daySchedule || { day_of_week: day.id, day_name: day.name, is_available: false, time_slots: [] })
                    
                    return (
                      <motion.div
                        key={day.id}
                        whileHover={{ scale: 1.05 }}
                        className="text-center"
                      >
                        <div className="text-sm font-medium mb-2 dark:text-gray-300">{day.short}</div>
                        <div className={`h-16 rounded-lg border-2 flex items-center justify-center text-xs transition-all duration-200 ${
                          daySchedule?.is_available 
                            ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200' 
                            : 'bg-gray-100 border-gray-300 text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                        }`}>
                          {daySchedule?.is_available ? (
                            <div className="text-center">
                              <div className="font-medium">{daySchedule.time_slots.length} slots</div>
                              <div className="text-xs">Available</div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="font-medium">Closed</div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg dark:bg-gray-700/50">
                  <h4 className="font-medium mb-3 dark:text-white">Quick Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleApplyTemplate("weekdays")}
                      className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-sm transition-all duration-200"
                    >
                      Set Weekdays
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleApplyTemplate("weekends")}
                      className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-sm transition-all duration-200"
                    >
                      Set Weekends
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleApplyTemplate("all_days")}
                      className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-sm transition-all duration-200"
                    >
                      Set All Days
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Availability Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20"
            >
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {schedules.filter(day => day.is_available).length}
              </div>
              <div className="text-sm text-muted-foreground dark:text-gray-400">Available Days</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20"
            >
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {schedules.reduce((total, day) => total + day.time_slots.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground dark:text-gray-400">Total Time Slots</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20"
            >
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {schedules.reduce((total, day) => 
                  total + day.time_slots.reduce((dayTotal, slot) => 
                    dayTotal + (slot.max_bookings || 5), 0
                  ), 0
                )}
              </div>
              <div className="text-sm text-muted-foreground dark:text-gray-400">Max Daily Bookings</div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
