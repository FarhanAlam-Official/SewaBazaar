"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
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
  Copy
} from "lucide-react"
import { useProviderSchedule } from '@/hooks/useProviderSchedule'
import { format, addDays, startOfMonth, endOfMonth } from 'date-fns'

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
    loading,
    error,
    updateWorkingHours,
    createBlockedTime,
    deleteBlockedTime,
    refreshSchedule
  } = useProviderSchedule(dateRange.from, dateRange.to)

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

  // Initialize working hours from API data
  useEffect(() => {
    if (scheduleData?.workingHours) {
      setWorkingHours(scheduleData.workingHours)
    }
    if (scheduleData?.breakTime) {
      setBreakTime(scheduleData.breakTime)
    }
  }, [scheduleData])

  // Handle working hours change
  const handleWorkingHoursChange = (day: string, field: string, value: any) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
  }

  // Handle break time change
  const handleBreakTimeChange = (field: string, value: string) => {
    setBreakTime(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Save working hours
  const handleSaveWorkingHours = async () => {
    try {
      setIsSubmitting(true)
      await updateWorkingHours(workingHours, breakTime)
      toast({
        title: "Schedule Updated",
        description: "Your working hours have been updated successfully"
      })
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update working hours",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle blocked time form submission
  const handleCreateBlockedTime = async () => {
    try {
      setIsSubmitting(true)
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

      toast({
        title: "Blocked Time Created",
        description: "Time has been blocked successfully"
      })
    } catch (error: any) {
      toast({
        title: "Failed to Block Time",
        description: error.message || "Failed to create blocked time",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading schedule...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => refreshSchedule()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Schedule & Availability</h1>
          <p className="text-muted-foreground">Manage your working hours and availability</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refreshSchedule()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isBlockTimeDialogOpen} onOpenChange={setIsBlockTimeDialogOpen}>
            <DialogTrigger asChild>
              <Button>
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
                <Button variant="outline" onClick={() => setIsBlockTimeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateBlockedTime} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Block Time
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Calendar</h2>
            <div className="flex gap-2 items-center">
              <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Available
              </Badge>
              <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Booked
              </Badge>
              <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                Blocked
              </Badge>
            </div>
          </div>
          
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            modifiers={getCalendarModifiers()}
            modifiersStyles={{
              available: { backgroundColor: '#dcfce7' },
              booked: { backgroundColor: '#fecaca' },
              blocked: { backgroundColor: '#fef3c7' }
            }}
            className="rounded-md border"
          />

          {/* Selected Date Details */}
          {selectedDate && scheduleData?.availability && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              {(() => {
                const dayData = scheduleData.availability.find(
                  day => day.date === format(selectedDate, 'yyyy-MM-dd')
                )
                
                if (!dayData || dayData.slots.length === 0) {
                  return <p className="text-muted-foreground">No time slots available</p>
                }

                return (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {dayData.slots.map((slot) => (
                      <Badge
                        key={slot.id}
                        variant={slot.status === 'available' ? 'default' : 'secondary'}
                        className={`justify-center ${
                          slot.status === 'booked' ? 'bg-red-100 text-red-800' :
                          slot.status === 'blocked' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}
                      >
                        {slot.startTime} - {slot.endTime}
                      </Badge>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}
        </Card>

        {/* Working Hours */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Working Hours</h2>
          <div className="space-y-6">
            {/* Weekly Schedule */}
            <div className="space-y-4">
              {Object.entries(workingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={day}
                      checked={hours.enabled}
                      onCheckedChange={(checked) => handleWorkingHoursChange(day, 'enabled', checked)}
                    />
                    <Label htmlFor={day} className="capitalize">{day}</Label>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Input
                      type="time"
                      className="w-24"
                      value={hours.start}
                      onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value)}
                      disabled={!hours.enabled}
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      className="w-24"
                      value={hours.end}
                      onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value)}
                      disabled={!hours.enabled}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Break Time */}
            <div>
              <h3 className="text-sm font-medium mb-2">Break Time</h3>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  className="w-24"
                  value={breakTime.start}
                  onChange={(e) => handleBreakTimeChange('start', e.target.value)}
                />
                <span>to</span>
                <Input
                  type="time"
                  className="w-24"
                  value={breakTime.end}
                  onChange={(e) => handleBreakTimeChange('end', e.target.value)}
                />
              </div>
            </div>

            {/* Quick Settings */}
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={copyWeekdayHours}>
                <Sun className="h-4 w-4 mr-2" />
                Copy Weekday Hours
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={copyWeekendHours}>
                <Moon className="h-4 w-4 mr-2" />
                Copy Weekend Hours
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={resetToDefaultHours}>
                <Clock className="h-4 w-4 mr-2" />
                Reset to Default Hours
              </Button>
            </div>

            <Button className="w-full" onClick={handleSaveWorkingHours} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </Card>

        {/* Blocked Times */}
        <Card className="lg:col-span-3 p-6">
          <h2 className="text-xl font-semibold mb-4">Blocked Times</h2>
          
          {scheduleData?.blockedTimes && scheduleData.blockedTimes.length > 0 ? (
            <div className="space-y-4">
              {scheduleData.blockedTimes.map((blocked) => (
                <div key={blocked.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                      <Button variant="ghost" size="sm">
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
    </div>
  )
}