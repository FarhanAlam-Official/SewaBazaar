"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Clock, 
  MapPin, 
  DollarSign,
  Image as ImageIcon,
  ToggleLeft,
  Calendar,
  Target,
  Settings,
  Clock4
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function ServicesManagement() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Services Management</h1>
          <p className="text-muted-foreground">Manage your services, schedule, and preferences</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add New Service
        </Button>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link href="/dashboard/provider/schedule">
          <Card className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Schedule</h3>
                <p className="text-sm text-muted-foreground">Manage availability & timings</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/provider/marketing">
          <Card className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Marketing</h3>
                <p className="text-sm text-muted-foreground">Promote your services</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/provider/settings">
          <Card className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Preferences</h3>
                <p className="text-sm text-muted-foreground">Service settings & options</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Services */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Active Services</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Clock4 className="h-4 w-4 mr-2" />
                Availability
              </Button>
              <select className="h-9 rounded-md border px-3 text-sm">
                <option>All Services</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden">
                        <Image
                          src="/placeholder.jpg"
                          alt="House Cleaning"
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">House Cleaning</div>
                        <div className="text-sm text-muted-foreground">Basic Package</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>NPR 1,500/hr</TableCell>
                  <TableCell>2 hours</TableCell>
                  <TableCell>
                    <Badge variant="default">Active</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <Clock className="h-4 w-4 mr-2" />
              Set Availability
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <MapPin className="h-4 w-4 mr-2" />
              Update Service Areas
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <DollarSign className="h-4 w-4 mr-2" />
              Update Pricing
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <ImageIcon className="h-4 w-4 mr-2" />
              Manage Photos
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <ToggleLeft className="h-4 w-4 mr-2" />
              Service Status
            </Button>
          </div>
        </Card>

        {/* Service Form */}
        <Card className="lg:col-span-3 p-6">
          <h2 className="text-xl font-semibold mb-4">Add/Edit Service</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Service Name</label>
                <Input placeholder="e.g., House Cleaning" />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input placeholder="e.g., Cleaning Services" />
              </div>
              <div>
                <label className="text-sm font-medium">Base Price (per hour)</label>
                <Input placeholder="e.g., 1500" type="number" />
              </div>
              <div>
                <label className="text-sm font-medium">Duration (hours)</label>
                <Input placeholder="e.g., 2" type="number" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  placeholder="Describe your service..."
                  className="h-32"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Service Area</label>
                <Input placeholder="e.g., Kathmandu Valley" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Service Images</label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop images here or click to upload
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <Button>Save Service</Button>
            <Button variant="outline">Cancel</Button>
          </div>
        </Card>
      </div>
    </div>
  )
} 