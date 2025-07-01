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

interface Campaign {
  id: number
  name: string
  description: string
  type: "email" | "push" | "sms" | "social" | "referral"
  status: "draft" | "active" | "paused" | "completed"
  startDate: string
  endDate: string
  budget?: number
  target: {
    audience: "all" | "customers" | "providers" | "inactive_users"
    location?: string[]
    services?: string[]
  }
  metrics: {
    reach: number
    engagement: number
    conversions: number
    roi?: number
  }
}

// Mock data - TODO: Replace with API integration
const mockCampaigns: Campaign[] = [
  {
    id: 1,
    name: "Spring Cleaning Special",
    description: "Promotional campaign for cleaning services",
    type: "email",
    status: "active",
    startDate: "2024-03-01",
    endDate: "2024-04-30",
    budget: 5000,
    target: {
      audience: "customers",
      services: ["Home Cleaning", "Deep Cleaning"],
    },
    metrics: {
      reach: 5000,
      engagement: 1200,
      conversions: 150,
      roi: 280,
    },
  },
  {
    id: 2,
    name: "Provider Referral Program",
    description: "Referral campaign for service providers",
    type: "referral",
    status: "draft",
    startDate: "2024-04-01",
    endDate: "2024-06-30",
    budget: 10000,
    target: {
      audience: "providers",
    },
    metrics: {
      reach: 0,
      engagement: 0,
      conversions: 0,
    },
  },
]

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState("all")

  const columns: ColumnDef<Campaign>[] = [
    { accessorKey: "name", header: "Campaign Name" },
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
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={
          row.original.status === "active" ? "success" :
          row.original.status === "paused" ? "warning" :
          row.original.status === "completed" ? "default" :
          "secondary"
        }>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "target",
      header: "Target Audience",
      cell: ({ row }) => (
        <div className="space-y-1">
          <Badge variant="secondary">
            {row.original.target.audience.replace("_", " ")}
          </Badge>
          {row.original.target.services && (
            <div className="text-xs text-muted-foreground">
              {row.original.target.services.join(", ")}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "dates",
      header: "Duration",
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{row.original.startDate}</div>
          <div className="text-muted-foreground">to {row.original.endDate}</div>
        </div>
      ),
    },
    {
      accessorKey: "metrics",
      header: "Performance",
      cell: ({ row }) => (
        <div className="space-y-1 text-sm">
          <div>
            Reach: <span className="font-medium">{row.original.metrics.reach.toLocaleString()}</span>
          </div>
          <div>
            Conversions: <span className="font-medium">{row.original.metrics.conversions}</span>
            {row.original.metrics.roi && (
              <span className="ml-2 text-green-600">
                (ROI: {row.original.metrics.roi}%)
              </span>
            )}
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Marketing Campaigns</h2>
          <p className="text-muted-foreground">Create and manage marketing campaigns</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create Campaign</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input id="name" placeholder="Enter campaign name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Enter campaign description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Campaign Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email Campaign</SelectItem>
                      <SelectItem value="push">Push Notifications</SelectItem>
                      <SelectItem value="sms">SMS Campaign</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="referral">Referral Program</SelectItem>
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
                      <SelectItem value="inactive_users">Inactive Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Start Date</Label>
                  <Input type="date" />
                </div>
                <div className="grid gap-2">
                  <Label>End Date</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Budget</Label>
                <Input type="number" placeholder="Enter campaign budget" />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Campaigns</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockCampaigns}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockCampaigns.filter(c => c.status === "active")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockCampaigns.filter(c => c.status === "draft")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockCampaigns.filter(c => c.status === "completed")}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 