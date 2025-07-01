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
import { Star } from "lucide-react"

interface Review {
  id: number
  serviceId: string
  serviceName: string
  customerId: string
  customerName: string
  providerId: string
  providerName: string
  rating: number
  content: string
  status: "pending" | "approved" | "rejected" | "flagged"
  flags?: {
    reason: string
    count: number
  }[]
  createdAt: string
  updatedAt: string
  moderatorNotes?: string
}

// Mock data - TODO: Replace with API integration
const mockReviews: Review[] = [
  {
    id: 1,
    serviceId: "SRV001",
    serviceName: "Deep House Cleaning",
    customerId: "C001",
    customerName: "John Doe",
    providerId: "P001",
    providerName: "CleanPro Services",
    rating: 2,
    content: "The service was not up to the mark. Several areas were missed and the cleaning was superficial.",
    status: "flagged",
    flags: [
      { reason: "inappropriate_content", count: 1 },
      { reason: "spam", count: 2 },
    ],
    createdAt: "2024-03-20",
    updatedAt: "2024-03-20",
  },
  {
    id: 2,
    serviceId: "SRV002",
    serviceName: "Plumbing Repair",
    customerId: "C002",
    customerName: "Jane Smith",
    providerId: "P002",
    providerName: "Quick Fix Plumbing",
    rating: 5,
    content: "Excellent service! Fixed the issue quickly and professionally.",
    status: "pending",
    createdAt: "2024-03-19",
    updatedAt: "2024-03-19",
  },
]

export default function ReviewsModerationPage() {
  const [activeTab, setActiveTab] = useState("all")

  const RatingStars = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  )

  const columns: ColumnDef<Review>[] = [
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => <RatingStars rating={row.original.rating} />,
    },
    {
      accessorKey: "content",
      header: "Review",
      cell: ({ row }) => (
        <div className="max-w-[400px]">
          <div className="font-medium">{row.original.serviceName}</div>
          <div className="text-sm text-muted-foreground line-clamp-2">
            {row.original.content}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) => row.original.customerName,
    },
    {
      accessorKey: "provider",
      header: "Provider",
      cell: ({ row }) => row.original.providerName,
    },
    {
      accessorKey: "flags",
      header: "Flags",
      cell: ({ row }) => (
        row.original.flags ? (
          <div className="space-y-1">
            {row.original.flags.map((flag, index) => (
              <Badge key={index} variant="destructive" className="mr-1">
                {flag.reason.replace("_", " ")} ({flag.count})
              </Badge>
            ))}
          </div>
        ) : null
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={
          row.original.status === "approved" ? "success" :
          row.original.status === "rejected" ? "destructive" :
          row.original.status === "flagged" ? "warning" :
          "secondary"
        }>
          {row.original.status}
        </Badge>
      ),
    },
    { accessorKey: "createdAt", header: "Created" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Review Moderation</h2>
          <p className="text-muted-foreground">Manage and moderate user reviews</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Reviews</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="flagged">Flagged</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockReviews}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockReviews.filter(r => r.status === "pending")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flagged" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockReviews.filter(r => r.status === "flagged")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockReviews.filter(r => r.status === "approved")}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Moderation Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="hidden">Moderate Review</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Review Moderation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Moderation Action</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve Review</SelectItem>
                  <SelectItem value="reject">Reject Review</SelectItem>
                  <SelectItem value="flag">Flag for Further Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Moderator Notes</Label>
              <Textarea placeholder="Enter notes about the moderation decision..." />
            </div>
            <div className="grid gap-2">
              <Label>Send Notification</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select notification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Notification</SelectItem>
                  <SelectItem value="customer">Notify Customer</SelectItem>
                  <SelectItem value="provider">Notify Provider</SelectItem>
                  <SelectItem value="both">Notify Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 