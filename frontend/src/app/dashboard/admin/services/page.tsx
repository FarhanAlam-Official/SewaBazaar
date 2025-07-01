"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataGrid } from "@/components/ui/data-grid"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ColumnDef } from "@tanstack/react-table"

interface ServiceCategory {
  id: number
  name: string
  description: string
  totalProviders: number
  activeProviders: number
  status: string
  commission: string
  minPrice: number
  maxPrice: number
}

interface ProviderApplication {
  id: number
  businessName: string
  ownerName: string
  category: string
  documents: string
  experience: string
  status: string
  appliedDate: string
}

interface ServiceMetrics {
  category: string
  totalBookings: number
  completionRate: string
  avgRating: number
  revenue: string
  growth: string
}

// Mock data - TODO: Replace with API integration
const mockCategories: ServiceCategory[] = [
  {
    id: 1,
    name: "Home Cleaning",
    description: "All types of home cleaning services",
    totalProviders: 25,
    activeProviders: 18,
    status: "active",
    commission: "10%",
    minPrice: 1000,
    maxPrice: 5000,
  },
  {
    id: 2,
    name: "Plumbing",
    description: "Professional plumbing services",
    totalProviders: 15,
    activeProviders: 12,
    status: "active",
    commission: "12%",
    minPrice: 500,
    maxPrice: 3000,
  },
]

const mockProviderApplications: ProviderApplication[] = [
  {
    id: 1,
    businessName: "CleanPro Services",
    ownerName: "John Doe",
    category: "Home Cleaning",
    documents: "Verified",
    experience: "5 years",
    status: "pending",
    appliedDate: "2024-03-15",
  },
]

const mockServiceMetrics: ServiceMetrics[] = [
  {
    category: "Home Cleaning",
    totalBookings: 150,
    completionRate: "95%",
    avgRating: 4.5,
    revenue: "75000",
    growth: "+12%",
  },
]

export default function ServicesManagementPage() {
  const [activeTab, setActiveTab] = useState("categories")

  const categoryColumns: ColumnDef<ServiceCategory>[] = [
    { accessorKey: "name", header: "Category Name" },
    { accessorKey: "totalProviders", header: "Total Providers" },
    { accessorKey: "activeProviders", header: "Active Providers" },
    { accessorKey: "commission", header: "Commission Rate" },
    { accessorKey: "minPrice", header: "Min Price" },
    { accessorKey: "maxPrice", header: "Max Price" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "active" ? "success" : "destructive"}>
          {row.original.status}
        </Badge>
      ),
    },
  ]

  const providerApplicationColumns: ColumnDef<ProviderApplication>[] = [
    { accessorKey: "businessName", header: "Business Name" },
    { accessorKey: "ownerName", header: "Owner Name" },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "experience", header: "Experience" },
    { accessorKey: "documents", header: "Documents" },
    { accessorKey: "appliedDate", header: "Applied Date" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "approved" ? "success" : row.original.status === "pending" ? "warning" : "destructive"}>
          {row.original.status}
        </Badge>
      ),
    },
  ]

  const metricsColumns: ColumnDef<ServiceMetrics>[] = [
    { accessorKey: "category", header: "Category" },
    { accessorKey: "totalBookings", header: "Total Bookings" },
    { accessorKey: "completionRate", header: "Completion Rate" },
    { accessorKey: "avgRating", header: "Avg Rating" },
    { accessorKey: "revenue", header: "Revenue (Rs)" },
    { accessorKey: "growth", header: "Monthly Growth" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Service Management</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Service Category</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Service Category</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Category Name</Label>
                <Input id="name" placeholder="Enter category name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Enter category description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="commission">Commission Rate (%)</Label>
                  <Input id="commission" type="number" placeholder="10" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="minPrice">Minimum Price</Label>
                  <Input id="minPrice" type="number" placeholder="500" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxPrice">Maximum Price</Label>
                  <Input id="maxPrice" type="number" placeholder="5000" />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="providers">Provider Applications</TabsTrigger>
          <TabsTrigger value="metrics">Service Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={categoryColumns}
                data={mockCategories}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={providerApplicationColumns}
                data={mockProviderApplications}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={metricsColumns}
                data={mockServiceMetrics}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 