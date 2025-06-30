"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Gift,
  Package,
  Share2,
  Users,
  Plus,
  Edit2,
  Trash2,
  Facebook,
  Twitter,
  Instagram,
  Link as LinkIcon
} from "lucide-react"

export default function MarketingTools() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Marketing Tools</h1>
          <p className="text-muted-foreground">Manage your promotions and marketing</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Promotion
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Promotions</p>
              <h3 className="text-2xl font-bold">5</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Service Packages</p>
              <h3 className="text-2xl font-bold">3</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Share2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Referral Links</p>
              <h3 className="text-2xl font-bold">25</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Referral Customers</p>
              <h3 className="text-2xl font-bold">12</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Promotions */}
        <Card className="lg:col-span-2 p-6">
          <h2 className="text-xl font-semibold mb-4">Active Promotions</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Promotion</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div>
                      <div className="font-medium">First Time Discount</div>
                      <div className="text-sm text-muted-foreground">20% off first booking</div>
                    </div>
                  </TableCell>
                  <TableCell>Discount</TableCell>
                  <TableCell>
                    <Badge variant="success">Active</Badge>
                  </TableCell>
                  <TableCell>45/100</TableCell>
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
                <TableRow>
                  <TableCell>
                    <div>
                      <div className="font-medium">Weekend Special</div>
                      <div className="text-sm text-muted-foreground">15% off weekend bookings</div>
                    </div>
                  </TableCell>
                  <TableCell>Seasonal</TableCell>
                  <TableCell>
                    <Badge variant="success">Active</Badge>
                  </TableCell>
                  <TableCell>28/50</TableCell>
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
              <Gift className="h-4 w-4 mr-2" />
              Create New Promotion
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Package className="h-4 w-4 mr-2" />
              Create Service Package
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Share2 className="h-4 w-4 mr-2" />
              Generate Referral Link
            </Button>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium mb-4">Social Media Integration</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Facebook className="h-4 w-4 mr-2" />
                Connect Facebook
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Twitter className="h-4 w-4 mr-2" />
                Connect Twitter
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Instagram className="h-4 w-4 mr-2" />
                Connect Instagram
              </Button>
            </div>
          </div>
        </Card>

        {/* Create Promotion Form */}
        <Card className="lg:col-span-3 p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Promotion</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Promotion Name</label>
                <Input placeholder="e.g., Summer Special" />
              </div>
              <div>
                <label className="text-sm font-medium">Discount Type</label>
                <select className="w-full h-10 px-3 rounded-md border">
                  <option>Percentage Discount</option>
                  <option>Fixed Amount</option>
                  <option>Buy One Get One</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Discount Value</label>
                <Input placeholder="e.g., 20" type="number" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  placeholder="Describe your promotion..."
                  className="h-32"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Usage Limit</label>
                <Input placeholder="e.g., 100" type="number" />
              </div>
              <div>
                <label className="text-sm font-medium">Expiry Date</label>
                <Input type="date" />
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <Button>Create Promotion</Button>
            <Button variant="outline">Cancel</Button>
          </div>
        </Card>
      </div>
    </div>
  )
} 