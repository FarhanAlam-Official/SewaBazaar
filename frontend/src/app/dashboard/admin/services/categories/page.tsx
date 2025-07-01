"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataGrid } from "@/components/ui/data-grid"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ColumnDef } from "@tanstack/react-table"

interface ServiceCategory {
  id: number
  name: string
  slug: string
  description: string
  totalServices: number
  activeServices: number
  featuredServices: number
  status: "active" | "inactive"
  icon: string
  createdAt: string
  updatedAt: string
}

// Mock data - TODO: Replace with API integration
const mockCategories: ServiceCategory[] = [
  {
    id: 1,
    name: "Home Cleaning",
    slug: "home-cleaning",
    description: "Professional home cleaning services",
    totalServices: 45,
    activeServices: 38,
    featuredServices: 5,
    status: "active",
    icon: "🧹",
    createdAt: "2024-01-15",
    updatedAt: "2024-03-20",
  },
  {
    id: 2,
    name: "Plumbing",
    slug: "plumbing",
    description: "Expert plumbing services",
    totalServices: 32,
    activeServices: 28,
    featuredServices: 3,
    status: "active",
    icon: "🔧",
    createdAt: "2024-01-15",
    updatedAt: "2024-03-18",
  },
]

export default function ServiceCategoriesPage() {
  const columns: ColumnDef<ServiceCategory>[] = [
    {
      accessorKey: "name",
      header: "Category Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span>{row.original.icon}</span>
          <span>{row.original.name}</span>
        </div>
      ),
    },
    { accessorKey: "slug", header: "Slug" },
    { accessorKey: "totalServices", header: "Total Services" },
    { accessorKey: "activeServices", header: "Active Services" },
    { accessorKey: "featuredServices", header: "Featured" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "active" ? "success" : "destructive"}>
          {row.original.status}
        </Badge>
      ),
    },
    { accessorKey: "updatedAt", header: "Last Updated" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Service Categories</h2>
          <p className="text-muted-foreground">Manage service categories and subcategories</p>
        </div>
        <div className="flex gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Add Category</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input id="name" placeholder="Enter category name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" placeholder="category-slug" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Enter category description" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Input id="icon" placeholder="Enter emoji or icon class" />
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Reorder Categories</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reorder Categories</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                {/* TODO: Add drag and drop reordering UI */}
                <p className="text-muted-foreground">Drag and drop categories to reorder them</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <DataGrid
            columns={columns}
            data={mockCategories}
          />
        </CardContent>
      </Card>
    </div>
  )
} 