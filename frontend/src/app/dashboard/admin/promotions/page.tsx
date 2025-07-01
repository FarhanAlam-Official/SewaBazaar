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

interface Promotion {
  id: number
  code: string
  title: string
  description: string
  type: "percentage" | "fixed" | "bogo" | "cashback"
  value: number
  minPurchase?: number
  maxDiscount?: number
  target: "all" | "new_users" | "existing_users" | "specific_services"
  status: "active" | "scheduled" | "expired" | "draft"
  startDate: string
  endDate: string
  usageLimit?: number
  usageCount: number
  services?: string[]
}

// Mock data - TODO: Replace with API integration
const mockPromotions: Promotion[] = [
  {
    id: 1,
    code: "WELCOME20",
    title: "New User Discount",
    description: "20% off for new users",
    type: "percentage",
    value: 20,
    minPurchase: 1000,
    maxDiscount: 500,
    target: "new_users",
    status: "active",
    startDate: "2024-03-01",
    endDate: "2024-04-30",
    usageLimit: 1000,
    usageCount: 245,
  },
  {
    id: 2,
    code: "CLEAN50",
    title: "Cleaning Services Special",
    description: "₹50 off on cleaning services",
    type: "fixed",
    value: 50,
    target: "specific_services",
    status: "scheduled",
    startDate: "2024-04-01",
    endDate: "2024-04-15",
    usageLimit: 500,
    usageCount: 0,
    services: ["Home Cleaning", "Deep Cleaning"],
  },
]

export default function PromotionsPage() {
  const [activeTab, setActiveTab] = useState("all")

  const columns: ColumnDef<Promotion>[] = [
    { accessorKey: "code", header: "Code" },
    { accessorKey: "title", header: "Title" },
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
      accessorKey: "value",
      header: "Value",
      cell: ({ row }) => (
        <span>
          {row.original.type === "percentage" ? `${row.original.value}%` : `₹${row.original.value}`}
        </span>
      ),
    },
    {
      accessorKey: "target",
      header: "Target",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.target.replace("_", " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={
          row.original.status === "active" ? "success" :
          row.original.status === "scheduled" ? "warning" :
          row.original.status === "expired" ? "destructive" :
          "secondary"
        }>
          {row.original.status}
        </Badge>
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
      accessorKey: "usage",
      header: "Usage",
      cell: ({ row }) => (
        <div className="text-sm">
          <span className="font-medium">{row.original.usageCount}</span>
          {row.original.usageLimit && (
            <span className="text-muted-foreground"> / {row.original.usageLimit}</span>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Promotions</h2>
          <p className="text-muted-foreground">Manage promotional offers and discounts</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create Promotion</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Promotion</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Promo Code</Label>
                <Input id="code" placeholder="Enter promo code" className="uppercase" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Enter promotion title" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Enter promotion description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage Off</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="bogo">Buy One Get One</SelectItem>
                      <SelectItem value="cashback">Cashback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Value</Label>
                  <Input type="number" placeholder="Enter discount value" />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Target</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="new_users">New Users</SelectItem>
                      <SelectItem value="existing_users">Existing Users</SelectItem>
                      <SelectItem value="specific_services">Specific Services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Usage Limit</Label>
                  <Input type="number" placeholder="Enter usage limit" />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Promotions</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockPromotions}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockPromotions.filter(p => p.status === "active")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockPromotions.filter(p => p.status === "scheduled")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockPromotions.filter(p => p.status === "expired")}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 