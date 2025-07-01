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

interface BlacklistedEntity {
  id: number
  entityId: string
  type: "user" | "provider" | "ip" | "device" | "payment_method"
  name: string
  reason: string
  evidence?: string[]
  status: "active" | "expired" | "under_review"
  duration: "permanent" | "temporary"
  startDate: string
  endDate?: string
  addedBy: string
  violations: {
    type: string
    count: number
  }[]
  notes?: string
  appealStatus?: "none" | "pending" | "approved" | "rejected"
}

// Mock data - TODO: Replace with API integration
const mockBlacklist: BlacklistedEntity[] = [
  {
    id: 1,
    entityId: "U001",
    type: "user",
    name: "John Smith",
    reason: "Multiple fraudulent activities",
    evidence: ["report_123.pdf", "evidence_456.jpg"],
    status: "active",
    duration: "permanent",
    startDate: "2024-03-01",
    addedBy: "Admin Team",
    violations: [
      { type: "fraud", count: 3 },
      { type: "harassment", count: 2 },
    ],
    notes: "Multiple verified complaints from different users",
  },
  {
    id: 2,
    entityId: "IP192168001",
    type: "ip",
    name: "192.168.0.1",
    reason: "Suspicious activities",
    status: "active",
    duration: "temporary",
    startDate: "2024-03-15",
    endDate: "2024-06-15",
    addedBy: "Security Team",
    violations: [
      { type: "spam", count: 10 },
    ],
    appealStatus: "pending",
  },
]

export default function BlacklistPage() {
  const [activeTab, setActiveTab] = useState("all")

  const columns: ColumnDef<BlacklistedEntity>[] = [
    { accessorKey: "entityId", header: "ID" },
    { accessorKey: "name", header: "Name/Value" },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.type.replace("_", " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={
          row.original.status === "active" ? "destructive" :
          row.original.status === "expired" ? "secondary" :
          "warning"
        }>
          {row.original.status.replace("_", " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }) => (
        <div>
          <Badge variant={row.original.duration === "permanent" ? "destructive" : "warning"}>
            {row.original.duration}
          </Badge>
          {row.original.duration === "temporary" && row.original.endDate && (
            <div className="text-xs text-muted-foreground mt-1">
              Until {row.original.endDate}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "violations",
      header: "Violations",
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.violations.map((violation, index) => (
            <Badge key={index} variant="secondary" className="mr-1">
              {violation.type} ({violation.count})
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "appeal",
      header: "Appeal Status",
      cell: ({ row }) => (
        row.original.appealStatus && row.original.appealStatus !== "none" ? (
          <Badge variant={
            row.original.appealStatus === "approved" ? "success" :
            row.original.appealStatus === "rejected" ? "destructive" :
            "warning"
          }>
            {row.original.appealStatus}
          </Badge>
        ) : null
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Blacklist Management</h2>
          <p className="text-muted-foreground">Manage banned users and entities</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add to Blacklist</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add to Blacklist</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Entity Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="provider">Service Provider</SelectItem>
                    <SelectItem value="ip">IP Address</SelectItem>
                    <SelectItem value="device">Device</SelectItem>
                    <SelectItem value="payment_method">Payment Method</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Entity ID/Value</Label>
                <Input placeholder="Enter ID or value to blacklist" />
              </div>
              <div className="grid gap-2">
                <Label>Reason</Label>
                <Textarea placeholder="Enter reason for blacklisting..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Duration</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="temporary">Temporary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>End Date</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Evidence</Label>
                <Input type="file" multiple />
              </div>
              <div className="grid gap-2">
                <Label>Additional Notes</Label>
                <Textarea placeholder="Enter any additional notes..." />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Entries</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="appeals">Appeals</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockBlacklist}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockBlacklist.filter(item => item.status === "active")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appeals" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockBlacklist.filter(item => item.appealStatus === "pending")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockBlacklist.filter(item => item.status === "expired")}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Appeal Review Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="hidden">Review Appeal</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Review Appeal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Decision</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve Appeal</SelectItem>
                  <SelectItem value="reject">Reject Appeal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Decision Notes</Label>
              <Textarea placeholder="Enter reason for decision..." />
            </div>
            <div className="grid gap-2">
              <Label>Conditions (if approved)</Label>
              <Textarea placeholder="Enter any conditions or warnings..." />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 