"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  Filter,
  Star,
  Calendar,
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  Download,
  Users,
  MessageSquare
} from "lucide-react"
import Image from "next/image"

export default function CustomerManagement() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground">Manage your customer relationships</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <h3 className="text-2xl font-bold">156</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Regular Customers</p>
              <h3 className="text-2xl font-bold">45</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <h3 className="text-2xl font-bold">28</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Chats</p>
              <h3 className="text-2xl font-bold">12</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <Card className="lg:col-span-3 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Customer List</h2>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  className="pl-9 w-[300px]"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Service</TableHead>
                  <TableHead>Total Bookings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Image
                        src="/placeholder-user.jpg"
                        alt="Sarah Johnson"
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div>
                        <div className="font-medium">Sarah Johnson</div>
                        <div className="text-sm text-muted-foreground">Customer since Jan 2024</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">sarah@example.com</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">+977 9812345678</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Thamel, Kathmandu</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">House Cleaning</div>
                      <div className="text-sm text-muted-foreground">Mar 15, 2024</div>
                    </div>
                  </TableCell>
                  <TableCell>12</TableCell>
                  <TableCell>
                    <Badge variant="success">Regular</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Image
                        src="/placeholder-user.jpg"
                        alt="Michael Chen"
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div>
                        <div className="font-medium">Michael Chen</div>
                        <div className="text-sm text-muted-foreground">Customer since Feb 2024</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">michael@example.com</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">+977 9876543210</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Patan, Lalitpur</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">Deep Cleaning</div>
                      <div className="text-sm text-muted-foreground">Mar 10, 2024</div>
                    </div>
                  </TableCell>
                  <TableCell>5</TableCell>
                  <TableCell>
                    <Badge variant="secondary">New</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Customer Details */}
        <Card className="lg:col-span-2 p-6">
          <h2 className="text-xl font-semibold mb-4">Customer Details</h2>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Image
                src="/placeholder-user.jpg"
                alt="Sarah Johnson"
                width={80}
                height={80}
                className="rounded-full"
              />
              <div>
                <h3 className="text-lg font-semibold">Sarah Johnson</h3>
                <p className="text-muted-foreground">Premium Customer</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm">4.8 average rating</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">sarah@example.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">+977 9812345678</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Thamel, Kathmandu</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Service History</h4>
                <div className="space-y-2">
                  <div className="text-sm">Total Bookings: 12</div>
                  <div className="text-sm">Last Service: Mar 15, 2024</div>
                  <div className="text-sm">Preferred Service: House Cleaning</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Notes</h4>
              <textarea
                className="w-full h-24 p-2 border rounded-md"
                placeholder="Add customer notes..."
              ></textarea>
            </div>

            <div className="flex gap-2">
              <Button>View Full Profile</Button>
              <Button variant="outline">Service History</Button>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="font-medium">New Booking</p>
                <p className="text-sm text-muted-foreground">House Cleaning Service booked for Mar 20, 2024</p>
                <p className="text-sm text-muted-foreground mt-1">2 hours ago</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <MessageSquare className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="font-medium">New Message</p>
                <p className="text-sm text-muted-foreground">Asked about deep cleaning services</p>
                <p className="text-sm text-muted-foreground mt-1">1 day ago</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <Star className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="font-medium">New Review</p>
                <p className="text-sm text-muted-foreground">Left a 5-star review for House Cleaning</p>
                <p className="text-sm text-muted-foreground mt-1">3 days ago</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 