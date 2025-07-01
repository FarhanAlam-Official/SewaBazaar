"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataGrid } from "@/components/ui/data-grid"
import { Badge } from "@/components/ui/badge"
import { ColumnDef } from "@tanstack/react-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Booking {
  id: number
  bookingId: string
  customerName: string
  providerName: string
  service: string
  date: string
  time: string
  status: "pending" | "confirmed" | "completed" | "cancelled" | "disputed"
  amount: number
  paymentStatus: "paid" | "pending" | "refunded"
}

interface BookingMetrics {
  period: string
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  disputedBookings: number
  revenue: number
  avgRating: number
}

interface DisputeCase {
  id: number
  bookingId: string
  customerName: string
  providerName: string
  reason: string
  status: "open" | "investigating" | "resolved"
  date: string
  priority: "high" | "medium" | "low"
}

// Mock data - TODO: Replace with API integration
const mockBookings: Booking[] = [
  {
    id: 1,
    bookingId: "BK001",
    customerName: "John Doe",
    providerName: "CleanPro Services",
    service: "Home Cleaning",
    date: "2024-03-20",
    time: "10:00 AM",
    status: "confirmed",
    amount: 1500,
    paymentStatus: "paid",
  },
  {
    id: 2,
    bookingId: "BK002",
    customerName: "Jane Smith",
    providerName: "Plumb Perfect",
    service: "Plumbing",
    date: "2024-03-21",
    time: "02:00 PM",
    status: "pending",
    amount: 2500,
    paymentStatus: "pending",
  },
]

const mockMetrics: BookingMetrics[] = [
  {
    period: "Today",
    totalBookings: 45,
    completedBookings: 32,
    cancelledBookings: 5,
    disputedBookings: 2,
    revenue: 67500,
    avgRating: 4.5,
  },
]

const mockDisputes: DisputeCase[] = [
  {
    id: 1,
    bookingId: "BK003",
    customerName: "Alice Johnson",
    providerName: "CleanPro Services",
    reason: "Service not completed as described",
    status: "open",
    date: "2024-03-19",
    priority: "high",
  },
]

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState("all")

  const bookingColumns: ColumnDef<Booking>[] = [
    { accessorKey: "bookingId", header: "Booking ID" },
    { accessorKey: "customerName", header: "Customer" },
    { accessorKey: "providerName", header: "Provider" },
    { accessorKey: "service", header: "Service" },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "time", header: "Time" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        const variant = 
          status === "confirmed" ? "success" :
          status === "completed" ? "default" :
          status === "cancelled" ? "destructive" :
          status === "disputed" ? "warning" : 
          "secondary"
        
        return <Badge variant={variant}>{status}</Badge>
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `Rs. ${row.original.amount}`,
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      cell: ({ row }) => (
        <Badge variant={row.original.paymentStatus === "paid" ? "success" : "warning"}>
          {row.original.paymentStatus}
        </Badge>
      ),
    },
  ]

  const metricsColumns: ColumnDef<BookingMetrics>[] = [
    { accessorKey: "period", header: "Period" },
    { accessorKey: "totalBookings", header: "Total Bookings" },
    { accessorKey: "completedBookings", header: "Completed" },
    { accessorKey: "cancelledBookings", header: "Cancelled" },
    { accessorKey: "disputedBookings", header: "Disputed" },
    { 
      accessorKey: "revenue", 
      header: "Revenue",
      cell: ({ row }) => `Rs. ${row.original.revenue}`,
    },
    { accessorKey: "avgRating", header: "Avg Rating" },
  ]

  const disputeColumns: ColumnDef<DisputeCase>[] = [
    { accessorKey: "bookingId", header: "Booking ID" },
    { accessorKey: "customerName", header: "Customer" },
    { accessorKey: "providerName", header: "Provider" },
    { accessorKey: "reason", header: "Reason" },
    { accessorKey: "date", header: "Date" },
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
          "success"
        }>
          {row.original.status}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Bookings Management</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Export Data</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Bookings Data</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* TODO: Add export options (date range, format, etc.) */}
              <p>Export options will be implemented here</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Bookings</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={bookingColumns}
                data={mockBookings}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={metricsColumns}
                data={mockMetrics}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dispute Management</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <DataGrid
                columns={disputeColumns}
                data={mockDisputes}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 