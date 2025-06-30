"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Filter,
  MoreHorizontal,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  XCircle,
} from "lucide-react"

interface AutomationRule {
  id: string
  name: string
  type: "verify" | "reminder" | "escalation"
  condition: string
  action: string
  status: "active" | "inactive"
}

interface LogEntry {
  id: string
  timestamp: string
  level: "info" | "warning" | "error"
  message: string
  source: string
}

interface QueueJob {
  id: string
  type: string
  status: "pending" | "processing" | "completed" | "failed"
  created_at: string
  data: any
}

export default function AutomationTools() {
  const { toast } = useToast()
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: "1",
      name: "Auto-verify Providers",
      type: "verify",
      condition: "Documents uploaded and phone verified",
      action: "Set status to verified",
      status: "active",
    },
    {
      id: "2",
      name: "Booking Reminder",
      type: "reminder",
      condition: "24 hours before booking",
      action: "Send SMS and email reminder",
      status: "active",
    },
    {
      id: "3",
      name: "Support Escalation",
      type: "escalation",
      condition: "Ticket unresolved for 48 hours",
      action: "Escalate to senior support",
      status: "inactive",
    },
  ])

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "1",
      timestamp: "2024-03-20 10:30:00",
      level: "info",
      message: "User registration successful",
      source: "auth.service",
    },
    {
      id: "2",
      timestamp: "2024-03-20 10:29:00",
      level: "warning",
      message: "Failed login attempt",
      source: "auth.service",
    },
    {
      id: "3",
      timestamp: "2024-03-20 10:28:00",
      level: "error",
      message: "Database connection failed",
      source: "db.service",
    },
  ])

  const [queueJobs, setQueueJobs] = useState<QueueJob[]>([
    {
      id: "1",
      type: "email",
      status: "completed",
      created_at: "2024-03-20 10:30:00",
      data: {
        to: "user@example.com",
        subject: "Welcome to SewaBazaar",
      },
    },
    {
      id: "2",
      type: "sms",
      status: "processing",
      created_at: "2024-03-20 10:29:00",
      data: {
        to: "+977123456789",
        message: "Your booking is confirmed",
      },
    },
    {
      id: "3",
      type: "import",
      status: "failed",
      created_at: "2024-03-20 10:28:00",
      data: {
        file: "users.csv",
        error: "Invalid format",
      },
    },
  ])

  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "info":
        return "bg-blue-500"
      case "warning":
        return "bg-yellow-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusColor = (status: QueueJob["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "processing":
        return "bg-blue-500"
      case "failed":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleDownloadLogs = () => {
    // Implement log download logic here
    toast({
      title: "Success",
      description: "Logs downloaded successfully",
    })
  }

  const handleRetryJob = (jobId: string) => {
    // Implement job retry logic here
    toast({
      title: "Success",
      description: "Job queued for retry",
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Automation & Logs</h2>

      <Tabs defaultValue="automation" className="space-y-6">
        <TabsList>
          <TabsTrigger value="automation">Automation Rules</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="queue">Queue Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="automation">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Automation Rules</CardTitle>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Rule
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automationRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{rule.name}</h3>
                        <Badge
                          variant={rule.status === "active" ? "default" : "secondary"}
                        >
                          {rule.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        When: {rule.condition}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Then: {rule.action}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={rule.status === "active"}
                        onCheckedChange={() => {
                          // Implement status toggle logic
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>System Logs</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search logs..."
                    className="w-[200px]"
                  />
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
                <Button variant="outline" onClick={handleDownloadLogs}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 border-l-2 pl-4"
                    style={{ borderColor: getLevelColor(log.level) }}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{log.message}</p>
                        <Badge variant="outline">{log.level}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {log.timestamp}
                        </div>
                        <div>{log.source}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Queue Jobs</CardTitle>
              <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {queueJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{job.type}</h3>
                        <Badge
                          variant={
                            job.status === "completed"
                              ? "default"
                              : job.status === "failed"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {job.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {job.created_at}
                      </div>
                      <pre className="mt-2 rounded bg-muted p-2 text-sm">
                        {JSON.stringify(job.data, null, 2)}
                      </pre>
                    </div>
                    {job.status === "failed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRetryJob(job.id)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 