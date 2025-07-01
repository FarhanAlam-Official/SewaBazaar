"use client"

import { useState, useEffect } from "react"
import { DataGrid } from "@/components/ui/data-grid"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Activity,
  Search,
  Download,
  Filter,
  UserCircle,
  ShoppingBag,
  Calendar,
  Settings,
  MessageSquare,
  Star,
  AlertTriangle,
} from "lucide-react"

interface ActivityLog {
  id: string
  user_id: string
  user_email: string
  action: string
  entity_type: string
  entity_id: string
  details: string
  ip_address: string
  created_at: string
}

const ACTIVITY_TYPES = {
  "auth": { icon: UserCircle, label: "Authentication" },
  "service": { icon: ShoppingBag, label: "Service" },
  "booking": { icon: Calendar, label: "Booking" },
  "settings": { icon: Settings, label: "Settings" },
  "review": { icon: Star, label: "Review" },
  "comment": { icon: MessageSquare, label: "Comment" },
  "report": { icon: AlertTriangle, label: "Report" },
}

export default function ActivityLogsPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: "",
    entityType: "all",
    action: "all",
    dateRange: "all",
  })

  useEffect(() => {
    fetchLogs()
  }, [filters])

  const fetchLogs = async () => {
    try {
      let query = supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })

      // Apply filters
      if (filters.search) {
        query = query.or(`user_email.ilike.%${filters.search}%,details.ilike.%${filters.search}%`)
      }
      if (filters.entityType !== "all") {
        query = query.eq("entity_type", filters.entityType)
      }
      if (filters.action !== "all") {
        query = query.eq("action", filters.action)
      }
      if (filters.dateRange !== "all") {
        const date = new Date()
        if (filters.dateRange === "today") {
          date.setHours(0, 0, 0, 0)
          query = query.gte("created_at", date.toISOString())
        } else if (filters.dateRange === "week") {
          date.setDate(date.getDate() - 7)
          query = query.gte("created_at", date.toISOString())
        } else if (filters.dateRange === "month") {
          date.setMonth(date.getMonth() - 1)
          query = query.gte("created_at", date.toISOString())
        }
      }

      const { data, error } = await query

      if (error) throw error

      setLogs(data)
    } catch (error) {
      console.error("Error fetching activity logs:", error)
      toast({
        title: "Error",
        description: "Failed to fetch activity logs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    try {
      const csv = [
        ["Date", "User", "Action", "Type", "Details", "IP Address"],
        ...logs.map(log => [
          new Date(log.created_at).toLocaleString(),
          log.user_email,
          log.action,
          log.entity_type,
          log.details,
          log.ip_address,
        ])
      ]
      .map(row => row.join(","))
      .join("\n")

      const blob = new Blob([csv], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `activity-logs-${new Date().toISOString()}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting logs:", error)
      toast({
        title: "Error",
        description: "Failed to export activity logs",
        variant: "destructive",
      })
    }
  }

  const columns = [
    {
      header: "Date",
      accessorKey: "created_at",
      cell: ({ row }: { row: { original: ActivityLog } }) => new Date(row.original.created_at).toLocaleString(),
    },
    {
      header: "User",
      accessorKey: "user_email",
    },
    {
      header: "Action",
      accessorKey: "action",
      cell: ({ row }: { row: { original: ActivityLog } }) => (
        <Badge variant="outline">
          {row.original.action}
        </Badge>
      ),
    },
    {
      header: "Type",
      accessorKey: "entity_type",
      cell: ({ row }: { row: { original: ActivityLog } }) => {
        const type = ACTIVITY_TYPES[row.original.entity_type as keyof typeof ACTIVITY_TYPES]
        const Icon = type?.icon || Activity
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span>{type?.label || row.original.entity_type}</span>
          </div>
        )
      },
    },
    {
      header: "Details",
      accessorKey: "details",
    },
    {
      header: "IP Address",
      accessorKey: "ip_address",
      cell: ({ row }: { row: { original: ActivityLog } }) => (
        <code className="text-sm">{row.original.ip_address}</code>
      ),
    },
  ]

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Activity Logs</h2>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Search</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user or details..."
              className="pl-8"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={filters.entityType}
            onValueChange={(value) => setFilters({ ...filters, entityType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(ACTIVITY_TYPES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Action</Label>
          <Select
            value={filters.action}
            onValueChange={(value) => setFilters({ ...filters, action: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Date Range</Label>
          <Select
            value={filters.dateRange}
            onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataGrid
        columns={columns}
        data={logs}
      />
    </div>
  )
} 