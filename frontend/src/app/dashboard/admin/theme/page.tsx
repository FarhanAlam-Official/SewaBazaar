"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"
import {
  Check,
  Download,
  Moon,
  Palette,
  Save,
  Sun,
  Upload,
} from "lucide-react"

interface ThemeConfig {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  radius: string
  font: string
}

export default function ThemePage() {
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>({
    primaryColor: "#3b82f6",
    secondaryColor: "#6b7280",
    accentColor: "#10b981",
    radius: "0.5rem",
    font: "Inter",
  })

  const handleSave = () => {
    toast({
      title: "Theme Saved",
      description: "Your theme settings have been saved successfully.",
    })
  }

  const handleExport = () => {
    const config = {
      ...themeConfig,
      theme,
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "theme-config.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    toast({
      title: "Coming Soon",
      description: "Import functionality will be available soon",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Theme & Branding</h1>
          <p className="text-muted-foreground mt-1">
            Customize your application's look and feel
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Theme Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Color Scheme</CardTitle>
              <CardDescription>
                Choose between light and dark mode
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => setTheme("light")}
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  onClick={() => setTheme("system")}
                >
                  <Palette className="h-4 w-4 mr-2" />
                  System
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>
                Customize your brand's color palette
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="color"
                    value={themeConfig.primaryColor}
                    onChange={(e) =>
                      setThemeConfig({
                        ...themeConfig,
                        primaryColor: e.target.value,
                      })
                    }
                    className="w-20 p-1 h-10"
                  />
                  <Input
                    value={themeConfig.primaryColor}
                    onChange={(e) =>
                      setThemeConfig({
                        ...themeConfig,
                        primaryColor: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Secondary Color</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="color"
                    value={themeConfig.secondaryColor}
                    onChange={(e) =>
                      setThemeConfig({
                        ...themeConfig,
                        secondaryColor: e.target.value,
                      })
                    }
                    className="w-20 p-1 h-10"
                  />
                  <Input
                    value={themeConfig.secondaryColor}
                    onChange={(e) =>
                      setThemeConfig({
                        ...themeConfig,
                        secondaryColor: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Accent Color</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="color"
                    value={themeConfig.accentColor}
                    onChange={(e) =>
                      setThemeConfig({
                        ...themeConfig,
                        accentColor: e.target.value,
                      })
                    }
                    className="w-20 p-1 h-10"
                  />
                  <Input
                    value={themeConfig.accentColor}
                    onChange={(e) =>
                      setThemeConfig({
                        ...themeConfig,
                        accentColor: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Typography & Spacing</CardTitle>
              <CardDescription>
                Customize fonts and component styles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Border Radius</Label>
                <Select
                  value={themeConfig.radius}
                  onValueChange={(value) =>
                    setThemeConfig({ ...themeConfig, radius: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select border radius" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Square</SelectItem>
                    <SelectItem value="0.25rem">Small</SelectItem>
                    <SelectItem value="0.5rem">Medium</SelectItem>
                    <SelectItem value="1rem">Large</SelectItem>
                    <SelectItem value="9999px">Full</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select
                  value={themeConfig.font}
                  onValueChange={(value) =>
                    setThemeConfig({ ...themeConfig, font: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select font family" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                    <SelectItem value="Poppins">Poppins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                See how your theme changes affect components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="buttons" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="buttons" className="flex-1">
                    Buttons
                  </TabsTrigger>
                  <TabsTrigger value="cards" className="flex-1">
                    Cards
                  </TabsTrigger>
                  <TabsTrigger value="forms" className="flex-1">
                    Forms
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="buttons" className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <Button>Primary Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="outline">Outline Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <Button size="sm">Small</Button>
                    <Button>Default</Button>
                    <Button size="lg">Large</Button>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <Button>
                      <Check className="h-4 w-4 mr-2" />
                      With Icon
                    </Button>
                    <Button variant="outline" disabled>
                      Disabled
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="cards" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Card Title</CardTitle>
                        <CardDescription>Card description here</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>Card content goes here</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Interactive Card</CardTitle>
                        <CardDescription>With actions</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p>Card content with button</p>
                        <Button>Action</Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value="forms" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Input Field</Label>
                      <Input placeholder="Type something..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Select Menu</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Option 1</SelectItem>
                          <SelectItem value="2">Option 2</SelectItem>
                          <SelectItem value="3">Option 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 