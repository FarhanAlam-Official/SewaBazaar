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

interface Dispute {
  id: number
  disputeId: string
  bookingId: string
  customerName: string
  providerName: string
  service: string
  reason: string
  description: string
  status: "open" | "investigating" | "resolved" | "closed"
  priority: "high" | "medium" | "low"
  createdAt: string
  updatedAt: string
  resolution?: string
  refundStatus?: "pending" | "approved" | "rejected" | "processed"
  assignedTo?: string
}

// Mock data - TODO: Replace with API integration
const mockDisputes: Dispute[] = [
  {
    id: 1,
    disputeId: "DSP001",
    bookingId: "BK001",
    customerName: "John Doe",
    providerName: "CleanPro Services",
    service: "House Cleaning",
    reason: "Service not completed as described",
    description: "The cleaning service did not cover all areas as agreed",
    status: "open",
    priority: "high",
    createdAt: "2024-03-20",
    updatedAt: "2024-03-20",
  },
  {
    id: 2,
    disputeId: "DSP002",
    bookingId: "BK002",
    customerName: "Jane Smith",
    providerName: "Quick Fix Plumbing",
    service: "Plumbing Repair",
    reason: "Overcharged for service",
    description: "The final amount was higher than the quoted price",
    status: "investigating",
    priority: "medium",
    createdAt: "2024-03-19",
    updatedAt: "2024-03-20",
    assignedTo: "Support Team A",
  },
]

export default function DisputesPage() {
  const [activeTab, setActiveTab] = useState("all")

  const columns: ColumnDef<Dispute>[] = [
    { accessorKey: "disputeId", header: "Dispute ID" },
    { accessorKey: "bookingId", header: "Booking ID" },
    { accessorKey: "customerName", header: "Customer" },
    { accessorKey: "providerName", header: "Provider" },
    { accessorKey: "reason", header: "Reason" },
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
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={
          row.original.status === "open" ? "destructive" :
          row.original.status === "investigating" ? "warning" :
          row.original.status === "resolved" ? "success" :
          "default"
        }>
          {row.original.status}
        </Badge>
      ),
    },
    { accessorKey: "createdAt", header: "Created" },
    { 
      accessorKey: "assignedTo",
      header: "Assigned To",
      cell: ({ row }) => (
        row.original.assignedTo || "Unassigned"
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dispute Management</h2>
          <p className="text-muted-foreground">Handle customer and provider disputes</p>
        </div>
        <div className="flex gap-4">
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Export Report</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Disputes</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="investigating">Investigating</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockDisputes}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="open" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockDisputes.filter(d => d.status === "open")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investigating" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockDisputes.filter(d => d.status === "investigating")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockDisputes.filter(d => d.status === "resolved")}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dispute Resolution Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="hidden">Handle Dispute</Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Dispute Resolution</DialogTitle>
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
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status Update</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Update status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="investigating">Mark as Investigating</SelectItem>
                  <SelectItem value="resolved">Mark as Resolved</SelectItem>
                  <SelectItem value="closed">Close Dispute</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Resolution Notes</Label>
              <Textarea placeholder="Enter resolution details..." />
            </div>
            <div className="grid gap-2">
              <Label>Refund Decision</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select refund decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approve Refund</SelectItem>
                  <SelectItem value="partial">Partial Refund</SelectItem>
                  <SelectItem value="rejected">Reject Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 