"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataGrid } from "@/components/ui/data-grid"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ColumnDef } from "@tanstack/react-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Notification {
  id: number
  title: string
  content: string
  type: "announcement" | "promotion" | "system" | "alert"
  target: "all" | "customers" | "providers" | "specific"
  status: "draft" | "scheduled" | "sent" | "cancelled"
  priority: "high" | "normal" | "low"
  scheduledFor?: string
  sentAt?: string
  readCount?: number
  clickRate?: number
}

// Mock data - TODO: Replace with API integration
const mockNotifications: Notification[] = [
  {
    id: 1,
    title: "New Feature Launch",
    content: "We're excited to announce our new booking features!",
    type: "announcement",
    target: "all",
    status: "sent",
    priority: "high",
    sentAt: "2024-03-20",
    readCount: 1250,
    clickRate: 45,
  },
  {
    id: 2,
    title: "Special Discount Offer",
    content: "Get 20% off on cleaning services this weekend",
    type: "promotion",
    target: "customers",
    status: "scheduled",
    priority: "normal",
    scheduledFor: "2024-03-25",
  },
]

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all")

  const columns: ColumnDef<Notification>[] = [
    { accessorKey: "title", header: "Title" },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={
          row.original.type === "announcement" ? "default" :
          row.original.type === "promotion" ? "success" :
          row.original.type === "alert" ? "destructive" :
          "secondary"
        }>
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "target",
      header: "Target Audience",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.target}
        </Badge>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <Badge variant={
          row.original.priority === "high" ? "destructive" :
          row.original.priority === "normal" ? "default" :
          "secondary"
        }>
          {row.original.priority}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={
          row.original.status === "sent" ? "success" :
          row.original.status === "scheduled" ? "warning" :
          row.original.status === "draft" ? "secondary" :
          "destructive"
        }>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "scheduledFor",
      header: "Scheduled/Sent",
      cell: ({ row }) => row.original.sentAt || row.original.scheduledFor || "-",
    },
    {
      accessorKey: "metrics",
      header: "Metrics",
      cell: ({ row }) => (
        row.original.readCount ? (
          <div className="text-sm">
            <span className="font-medium">{row.original.readCount}</span> reads
            <span className="mx-1">•</span>
            <span className="font-medium">{row.original.clickRate}%</span> clicks
          </div>
        ) : "-"
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">Manage system notifications and announcements</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create Notification</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Notification</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Enter notification title" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                <Textarea id="content" placeholder="Enter notification content" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="alert">Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Target Audience</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="customers">Customers</SelectItem>
                      <SelectItem value="providers">Service Providers</SelectItem>
                      <SelectItem value="specific">Specific Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Schedule</Label>
                  <Input type="datetime-local" />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Notifications</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockNotifications}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockNotifications.filter(n => n.status === "scheduled")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockNotifications.filter(n => n.status === "sent")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockNotifications.filter(n => n.status === "draft")}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 