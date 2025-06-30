"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bell,
  Clock,
  CreditCard,
  Globe,
  Lock,
  Mail,
  Phone,
  Shield,
  User,
  Wallet
} from "lucide-react"

export default function ProviderSettings() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings & Preferences</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Service Preferences</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <div className="grid gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              <div className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">First Name</label>
                    <Input defaultValue="John" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Name</label>
                    <Input defaultValue="Doe" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" defaultValue="john.doe@example.com" />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input type="tel" defaultValue="+977 9812345678" />
                </div>
                <div>
                  <label className="text-sm font-medium">Bio</label>
                  <Textarea 
                    defaultValue="Professional cleaner with 5+ years of experience in residential and commercial cleaning services."
                    className="h-24"
                  />
                </div>
                <Button>Save Changes</Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <label className="text-sm font-medium">New Booking Notifications</label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications when you get new booking requests
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <label className="text-sm font-medium">Email Notifications</label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive booking updates and reminders via email
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <label className="text-sm font-medium">SMS Notifications</label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive booking updates and reminders via SMS
                  </p>
                </div>
                <Switch />
              </div>
              <Button>Save Preferences</Button>
            </div>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payments">
          <div className="grid gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <CreditCard className="h-6 w-6" />
                  <div className="flex-1">
                    <p className="font-medium">Visa ending in 4242</p>
                    <p className="text-sm text-muted-foreground">Expires 12/24</p>
                  </div>
                  <Button variant="outline">Remove</Button>
                </div>
                <Button>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Payout Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Wallet className="h-6 w-6" />
                  <div className="flex-1">
                    <p className="font-medium">Bank Account</p>
                    <p className="text-sm text-muted-foreground">NIC Asia Bank **** 5678</p>
                  </div>
                  <Button variant="outline">Edit</Button>
                </div>
                <div>
                  <label className="text-sm font-medium">Payout Schedule</label>
                  <select className="w-full h-10 px-3 rounded-md border mt-1">
                    <option>Weekly</option>
                    <option>Bi-weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Current Password</label>
                    <Input type="password" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">New Password</label>
                    <Input type="password" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Confirm New Password</label>
                    <Input type="password" />
                  </div>
                  <Button>Update Password</Button>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <label className="text-sm font-medium">Enable 2FA</label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Service Preferences */}
        <TabsContent value="preferences">
          <div className="grid gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Service Area</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Service Radius</label>
                  <select className="w-full h-10 px-3 rounded-md border mt-1">
                    <option>5 km</option>
                    <option>10 km</option>
                    <option>15 km</option>
                    <option>20 km</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Primary Service Area</label>
                  <Input placeholder="e.g., Thamel, Kathmandu" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <label className="text-sm font-medium">Show Service Area on Profile</label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Display your service area to potential clients
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Availability</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <label className="text-sm font-medium">Auto Accept Bookings</label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Automatically accept bookings that match your availability
                    </p>
                  </div>
                  <Switch />
                </div>
                <div>
                  <label className="text-sm font-medium">Minimum Booking Notice</label>
                  <select className="w-full h-10 px-3 rounded-md border mt-1">
                    <option>2 hours</option>
                    <option>4 hours</option>
                    <option>6 hours</option>
                    <option>12 hours</option>
                    <option>24 hours</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Maximum Daily Bookings</label>
                  <Input type="number" defaultValue="5" min="1" max="10" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Service Customization</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Default Service Duration</label>
                  <select className="w-full h-10 px-3 rounded-md border mt-1">
                    <option>1 hour</option>
                    <option>2 hours</option>
                    <option>3 hours</option>
                    <option>4 hours</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Service Add-ons</label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="addon1" className="rounded border-gray-300" />
                      <label htmlFor="addon1" className="text-sm">Deep Cleaning (+NPR 1000)</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="addon2" className="rounded border-gray-300" />
                      <label htmlFor="addon2" className="text-sm">Window Cleaning (+NPR 500)</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="addon3" className="rounded border-gray-300" />
                      <label htmlFor="addon3" className="text-sm">Laundry Service (+NPR 800)</label>
                    </div>
                  </div>
                </div>
                <Button>Save Preferences</Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 