"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Bell,
  Download,
  Globe,
  Lock,
  Mail,
  Shield,
  Smartphone,
  Trash2,
  Users,
  Settings,
  Database,
  FileJson,
  RefreshCw,
  Key,
  Wallet,
  Percent,
  Clock,
  Languages,
  Moon,
  Sun,
  AlertTriangle
} from "lucide-react"

interface GeneralSettings {
  site_name: string
  site_description: string
  support_email: string
  commission_rate: number
  currency: string
  timezone: string
  maintenance_mode: boolean
  registration_enabled: boolean
}

interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  sms_notifications: boolean
  notification_types: {
    user_registration: boolean
    new_booking: boolean
    service_approval: boolean
    system_alerts: boolean
  }
}

interface SecuritySettings {
  two_factor_auth: boolean
  ip_restriction: boolean
  rate_limiting: boolean
  password_policy: {
    min_length: number
    require_special: boolean
    require_numbers: boolean
    require_uppercase: boolean
  }
  session_timeout: number
}

interface Role {
  id: string
  name: string
  permissions: string[]
  description: string
  users_count: number
}

interface BackupSettings {
  auto_backup: boolean
  backup_frequency: string
  retention_days: number
  include_media: boolean
}

export default function SettingsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    site_name: "SewaBazaar",
    site_description: "Your trusted platform for local services",
    support_email: "support@sewabazaar.com",
    commission_rate: 10,
    currency: "NPR",
    timezone: "Asia/Kathmandu",
    maintenance_mode: false,
    registration_enabled: true
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    notification_types: {
      user_registration: true,
      new_booking: true,
      service_approval: true,
      system_alerts: true
    }
  })

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    two_factor_auth: false,
    ip_restriction: false,
    rate_limiting: true,
    password_policy: {
      min_length: 8,
      require_special: true,
      require_numbers: true,
      require_uppercase: true
    },
    session_timeout: 30
  })

  const [roles, setRoles] = useState<Role[]>([
    {
      id: "1",
      name: "Super Admin",
      permissions: ["all"],
      description: "Full system access with all permissions",
      users_count: 2
    },
    {
      id: "2",
      name: "Manager",
      permissions: ["read", "write", "approve"],
      description: "Can manage users and approve services",
      users_count: 5
    },
    {
      id: "3",
      name: "Support",
      permissions: ["read", "respond"],
      description: "Can view and respond to user inquiries",
      users_count: 8
    }
  ])

  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
    auto_backup: true,
    backup_frequency: "daily",
    retention_days: 30,
    include_media: true
  })

  const handleGeneralSettingsUpdate = async () => {
    setIsLoading(true)
    try {
      // Implement settings update logic here
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulated API call
      toast({
        title: "Success",
        description: "Settings updated successfully",
      })
    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackupDownload = () => {
    toast({
      title: "Success",
      description: "Backup downloaded successfully",
    })
  }

  const handleCacheFlush = () => {
    toast({
      title: "Success",
      description: "Cache flushed successfully",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
          <p className="text-muted-foreground">
            Manage your platform settings and configurations
          </p>
        </div>
        <Button onClick={handleGeneralSettingsUpdate} disabled={isLoading}>
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="backup">Backup & Maintenance</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic platform settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="site_name">Site Name</Label>
                  <Input
                    id="site_name"
                    value={generalSettings.site_name}
                    onChange={(e) =>
                      setGeneralSettings((prev) => ({
                        ...prev,
                        site_name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support_email">Support Email</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value={generalSettings.support_email}
                    onChange={(e) =>
                      setGeneralSettings((prev) => ({
                        ...prev,
                        support_email: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="site_description">Site Description</Label>
                  <Textarea
                    id="site_description"
                    value={generalSettings.site_description}
                    onChange={(e) =>
                      setGeneralSettings((prev) => ({
                        ...prev,
                        site_description: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="commission_rate"
                      type="number"
                      value={generalSettings.commission_rate}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({
                          ...prev,
                          commission_rate: Number(e.target.value),
                        }))
                      }
                    />
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={generalSettings.currency}
                    onValueChange={(value) =>
                      setGeneralSettings((prev) => ({
                        ...prev,
                        currency: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NPR">Nepalese Rupee (NPR)</SelectItem>
                      <SelectItem value="USD">US Dollar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={generalSettings.timezone}
                    onValueChange={(value) =>
                      setGeneralSettings((prev) => ({
                        ...prev,
                        timezone: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kathmandu">Nepal (GMT+5:45)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Asia/Kolkata">India (GMT+5:30)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable maintenance mode to temporarily disable the site
                    </p>
                  </div>
                  <Switch
                    checked={generalSettings.maintenance_mode}
                    onCheckedChange={(checked) =>
                      setGeneralSettings((prev) => ({
                        ...prev,
                        maintenance_mode: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>User Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow new users to register on the platform
                    </p>
                  </div>
                  <Switch
                    checked={generalSettings.registration_enabled}
                    onCheckedChange={(checked) =>
                      setGeneralSettings((prev) => ({
                        ...prev,
                        registration_enabled: checked,
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure system-wide notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.email_notifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        email_notifications: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable browser push notifications
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.push_notifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        push_notifications: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via SMS
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.sms_notifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        sms_notifications: checked,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Notification Types</h3>
                <div className="space-y-2">
                  {Object.entries(notificationSettings.notification_types).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            notification_types: {
                              ...prev.notification_types,
                              [key]: checked,
                            },
                          }))
                        }
                      />
                      <Label className="capitalize">
                        {key.split("_").join(" ")}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for admin accounts
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.two_factor_auth}
                    onCheckedChange={(checked) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        two_factor_auth: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>IP Restriction</Label>
                    <p className="text-sm text-muted-foreground">
                      Restrict admin access to specific IP addresses
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.ip_restriction}
                    onCheckedChange={(checked) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        ip_restriction: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rate Limiting</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable API rate limiting
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.rate_limiting}
                    onCheckedChange={(checked) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        rate_limiting: checked,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Password Policy</h3>
                <div className="space-y-2">
                  <div className="grid gap-2">
                    <Label htmlFor="min_length">Minimum Password Length</Label>
                    <Input
                      id="min_length"
                      type="number"
                      value={securitySettings.password_policy.min_length}
                      onChange={(e) =>
                        setSecuritySettings((prev) => ({
                          ...prev,
                          password_policy: {
                            ...prev.password_policy,
                            min_length: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    {Object.entries(securitySettings.password_policy)
                      .filter(([key]) => key !== "min_length")
                      .map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) =>
                              setSecuritySettings((prev) => ({
                                ...prev,
                                password_policy: {
                                  ...prev.password_policy,
                                  [key]: checked,
                                },
                              }))
                            }
                          />
                          <Label className="capitalize">
                            Require {key.split("_")[1]}
                          </Label>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                <Input
                  id="session_timeout"
                  type="number"
                  value={securitySettings.session_timeout}
                  onChange={(e) =>
                    setSecuritySettings((prev) => ({
                      ...prev,
                      session_timeout: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>
                Manage user roles and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <h4 className="font-medium">{role.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {role.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {role.users_count} users
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Role</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this role? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Add New Role
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Maintenance</CardTitle>
              <CardDescription>
                Manage system backups and maintenance tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automatic Backups</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable scheduled automatic backups
                    </p>
                  </div>
                  <Switch
                    checked={backupSettings.auto_backup}
                    onCheckedChange={(checked) =>
                      setBackupSettings((prev) => ({
                        ...prev,
                        auto_backup: checked,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backup_frequency">Backup Frequency</Label>
                  <Select
                    value={backupSettings.backup_frequency}
                    onValueChange={(value) =>
                      setBackupSettings((prev) => ({
                        ...prev,
                        backup_frequency: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Every Hour</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retention_days">Retention Period (days)</Label>
                  <Input
                    id="retention_days"
                    type="number"
                    value={backupSettings.retention_days}
                    onChange={(e) =>
                      setBackupSettings((prev) => ({
                        ...prev,
                        retention_days: Number(e.target.value),
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Media Files</Label>
                    <p className="text-sm text-muted-foreground">
                      Include uploaded media in backups
                    </p>
                  </div>
                  <Switch
                    checked={backupSettings.include_media}
                    onCheckedChange={(checked) =>
                      setBackupSettings((prev) => ({
                        ...prev,
                        include_media: checked,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Maintenance Tasks</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Button variant="outline" className="w-full" onClick={handleBackupDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Backup
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleCacheFlush}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Flush Cache
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Database className="mr-2 h-4 w-4" />
                    Optimize Database
                  </Button>
                  <Button variant="outline" className="w-full">
                    <FileJson className="mr-2 h-4 w-4" />
                    Export Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of your platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Theme Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose between light and dark mode
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Sun className="h-4 w-4" />
                    <Switch defaultChecked={false} />
                    <Moon className="h-4 w-4" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ne">नेपाली</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select defaultValue="MM/DD/YYYY">
                    <SelectTrigger>
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Time Format</Label>
                  <Select defaultValue="12">
                    <SelectTrigger>
                      <SelectValue placeholder="Select time format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12-hour</SelectItem>
                      <SelectItem value="24">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Custom Branding</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input type="color" className="w-12 h-12 p-1" />
                      <Input type="text" placeholder="#000000" className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input type="color" className="w-12 h-12 p-1" />
                      <Input type="text" placeholder="#000000" className="flex-1" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 