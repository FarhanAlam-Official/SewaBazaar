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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Report {
  id: number
  reportId: string
  type: "user" | "service" | "review" | "message" | "other"
  category: "spam" | "inappropriate" | "fraud" | "harassment" | "quality" | "other"
  status: "pending" | "investigating" | "resolved" | "dismissed"
  priority: "high" | "medium" | "low"
  reportedItemId: string
  reportedItemType: string
  reportedBy: {
    id: string
    name: string
    role: "customer" | "provider"
  }
  reportedUser?: {
    id: string
    name: string
    role: "customer" | "provider"
  }
  description: string
  evidence?: string[]
  createdAt: string
  updatedAt: string
  assignedTo?: string
  resolution?: string
}

// Mock data - TODO: Replace with API integration
const mockReports: Report[] = [
  {
    id: 1,
    reportId: "RPT001",
    type: "user",
    category: "harassment",
    status: "pending",
    priority: "high",
    reportedItemId: "U001",
    reportedItemType: "User Profile",
    reportedBy: {
      id: "C001",
      name: "John Doe",
      role: "customer",
    },
    reportedUser: {
      id: "P001",
      name: "Service Provider A",
      role: "provider",
    },
    description: "Provider was extremely rude and made threatening comments",
    createdAt: "2024-03-20",
    updatedAt: "2024-03-20",
  },
  {
    id: 2,
    reportId: "RPT002",
    type: "service",
    category: "fraud",
    status: "investigating",
    priority: "high",
    reportedItemId: "SRV001",
    reportedItemType: "Service Listing",
    reportedBy: {
      id: "C002",
      name: "Jane Smith",
      role: "customer",
    },
    description: "Service provider charged more than the listed price",
    evidence: ["receipt.pdf", "chat_screenshot.jpg"],
    createdAt: "2024-03-19",
    updatedAt: "2024-03-20",
    assignedTo: "Support Team A",
  },
]

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("all")

  const columns: ColumnDef<Report>[] = [
    { accessorKey: "reportId", header: "Report ID" },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.type.toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <Badge variant={
          row.original.category === "harassment" || row.original.category === "fraud"
            ? "destructive"
            : "secondary"
        }>
          {row.original.category.replace("_", " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <Badge variant={
          row.original.priority === "high" ? "destructive" :
          row.original.priority === "medium" ? "warning" :
          "default"
        }>
          {row.original.priority}
        </Badge>
      ),
    },
    {
      accessorKey: "details",
      header: "Details",
      cell: ({ row }) => (
        <div className="max-w-[400px]">
          <div className="font-medium">
            {row.original.reportedItemType}: {row.original.reportedUser?.name || row.original.reportedItemId}
          </div>
          <div className="text-sm text-muted-foreground line-clamp-2">
            {row.original.description}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "reportedBy",
      header: "Reported By",
      cell: ({ row }) => (
        <div>
          <div>{row.original.reportedBy.name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.reportedBy.role}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={
          row.original.status === "resolved" ? "success" :
          row.original.status === "investigating" ? "warning" :
          row.original.status === "dismissed" ? "secondary" :
          "destructive"
        }>
          {row.original.status}
        </Badge>
      ),
    },
    { 
      accessorKey: "assignedTo",
      header: "Assigned To",
      cell: ({ row }) => row.original.assignedTo || "Unassigned",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports Management</h2>
          <p className="text-muted-foreground">Handle user reports and complaints</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="investigating">Investigating</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockReports}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockReports.filter(r => r.status === "pending")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investigating" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockReports.filter(r => r.status === "investigating")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockReports.filter(r => r.status === "resolved")}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Investigation Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="hidden">Investigate Report</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Report Investigation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Assign To</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team-a">Support Team A</SelectItem>
                  <SelectItem value="team-b">Support Team B</SelectItem>
                  <SelectItem value="legal">Legal Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Update Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="investigating">Mark as Investigating</SelectItem>
                  <SelectItem value="resolved">Mark as Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismiss Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Action Taken</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warning">Issue Warning</SelectItem>
                  <SelectItem value="suspend">Suspend Account</SelectItem>
                  <SelectItem value="ban">Ban Account</SelectItem>
                  <SelectItem value="none">No Action Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Resolution Notes</Label>
              <Textarea placeholder="Enter details about the investigation and resolution..." />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 