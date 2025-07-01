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

interface ServiceApproval {
  id: number
  serviceId: string
  title: string
  category: string
  provider: {
    id: string
    name: string
    rating: number
    verificationStatus: "verified" | "unverified"
  }
  status: "pending" | "approved" | "rejected" | "revision_requested"
  submittedAt: string
  updatedAt: string
  documents: string[]
  notes?: string
}

// Mock data - TODO: Replace with API integration
const mockApprovals: ServiceApproval[] = [
  {
    id: 1,
    serviceId: "SRV001",
    title: "Premium House Cleaning Service",
    category: "Home Cleaning",
    provider: {
      id: "P001",
      name: "CleanPro Services",
      rating: 4.5,
      verificationStatus: "verified",
    },
    status: "pending",
    submittedAt: "2024-03-20",
    updatedAt: "2024-03-20",
    documents: ["business_license.pdf", "insurance.pdf"],
  },
  {
    id: 2,
    serviceId: "SRV002",
    title: "Emergency Plumbing Service",
    category: "Plumbing",
    provider: {
      id: "P002",
      name: "Quick Fix Plumbing",
      rating: 4.2,
      verificationStatus: "unverified",
    },
    status: "revision_requested",
    submittedAt: "2024-03-19",
    updatedAt: "2024-03-20",
    documents: ["certification.pdf"],
    notes: "Please provide insurance documentation",
  },
]

export default function ServiceApprovalsPage() {
  const [activeTab, setActiveTab] = useState("pending")

  const columns: ColumnDef<ServiceApproval>[] = [
    { 
      accessorKey: "serviceId",
      header: "Service ID",
    },
    { 
      accessorKey: "title",
      header: "Service Title",
    },
    { 
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "provider",
      header: "Provider",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.provider.name}
          <Badge variant={row.original.provider.verificationStatus === "verified" ? "success" : "outline"}>
            {row.original.provider.verificationStatus}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "documents",
      header: "Documents",
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.documents.map((doc) => (
            <Badge key={doc} variant="secondary">
              {doc.split(".")[0]}
            </Badge>
          ))}
        </div>
      ),
    },
    { 
      accessorKey: "submittedAt",
      header: "Submitted",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        const variant = 
          status === "approved" ? "success" :
          status === "rejected" ? "destructive" :
          status === "revision_requested" ? "warning" :
          "secondary"
        
        return <Badge variant={variant}>{status.replace("_", " ")}</Badge>
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Service Approvals</h2>
          <p className="text-muted-foreground">Review and approve new service listings</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="revision">Revision Requested</TabsTrigger>
          <TabsTrigger value="approved">Recently Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockApprovals.filter(a => a.status === "pending")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revision" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockApprovals.filter(a => a.status === "revision_requested")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockApprovals.filter(a => a.status === "approved")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataGrid
                columns={columns}
                data={mockApprovals.filter(a => a.status === "rejected")}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="hidden">Review Service</Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Service Application</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Review Notes</Label>
              <Textarea placeholder="Enter your review notes..." />
            </div>
            <div className="flex gap-2">
              <Button variant="success">Approve</Button>
              <Button variant="destructive">Reject</Button>
              <Button>Request Revision</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 