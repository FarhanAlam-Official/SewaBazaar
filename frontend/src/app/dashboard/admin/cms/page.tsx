"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Image as ImageIcon,
  Plus,
  Edit,
  Trash2,
  MoveUp,
  MoveDown,
  Eye,
} from "lucide-react"

// TODO: Replace with actual API calls and database models
interface Section {
  id: string
  title: string
  type: "hero" | "features" | "testimonials" | "cta" | "custom"
  content: any
  isActive: boolean
  order: number
}

interface Banner {
  id: string
  title: string
  image: string
  link: string
  isActive: boolean
  startDate: string
  endDate: string
}

// Mock data
const MOCK_SECTIONS: Section[] = [
  {
    id: "1",
    title: "Hero Section",
    type: "hero",
    content: {
      heading: "Find the Perfect Service Provider",
      subheading: "Book trusted professionals for all your needs",
      image: "/hero-image.jpg",
      ctaText: "Get Started",
      ctaLink: "/services",
    },
    isActive: true,
    order: 1,
  },
  {
    id: "2",
    title: "Featured Services",
    type: "features",
    content: {
      heading: "Popular Services",
      items: [
        { title: "Home Cleaning", icon: "🧹", link: "/services/cleaning" },
        { title: "Plumbing", icon: "🔧", link: "/services/plumbing" },
        { title: "Electrical", icon: "⚡", link: "/services/electrical" },
      ],
    },
    isActive: true,
    order: 2,
  },
]

const MOCK_BANNERS: Banner[] = [
  {
    id: "1",
    title: "Summer Sale",
    image: "/banners/summer-sale.jpg",
    link: "/promotions/summer",
    isActive: true,
    startDate: "2024-06-01",
    endDate: "2024-08-31",
  },
  {
    id: "2",
    title: "New User Offer",
    image: "/banners/new-user.jpg",
    link: "/promotions/new-user",
    isActive: true,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
  },
]

export default function CMSPage() {
  const [sections, setSections] = useState<Section[]>(MOCK_SECTIONS)
  const [banners, setBanners] = useState<Banner[]>(MOCK_BANNERS)
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // TODO: Implement these functions with actual API calls
  const handleSectionUpdate = (section: Section) => {
    setSections(prev => prev.map(s => s.id === section.id ? section : s))
    setIsEditDialogOpen(false)
  }

  const handleSectionMove = (id: string, direction: "up" | "down") => {
    setSections(prev => {
      const newSections = [...prev]
      const index = newSections.findIndex(s => s.id === id)
      if (direction === "up" && index > 0) {
        [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]]
      } else if (direction === "down" && index < newSections.length - 1) {
        [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]]
      }
      return newSections
    })
  }

  const handleBannerToggle = (id: string) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Content Management</h2>
        <Button onClick={() => {
          setSelectedSection(null)
          setIsEditDialogOpen(true)
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>

      <Tabs defaultValue="sections">
        <TabsList>
          <TabsTrigger value="sections">Page Sections</TabsTrigger>
          <TabsTrigger value="banners">Banners & Carousels</TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="space-y-4">
          {sections.map((section) => (
            <Card key={section.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">
                    {section.title}
                  </CardTitle>
                  <CardDescription>
                    Type: {section.type}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSectionMove(section.id, "up")}
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSectionMove(section.id, "down")}
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedSection(section)
                      setIsEditDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Badge variant={section.isActive ? "default" : "secondary"}>
                    {section.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Order: {section.order}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="banners" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {banners.map((banner) => (
              <Card key={banner.id}>
                <CardHeader>
                  <div className="aspect-video relative rounded-lg overflow-hidden bg-muted">
                    <ImageIcon className="h-12 w-12 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg font-medium mt-2">
                    {banner.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={banner.isActive ? "default" : "secondary"}>
                        {banner.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBannerToggle(banner.id)}
                      >
                        {banner.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Start: {new Date(banner.startDate).toLocaleDateString()}</p>
                      <p>End: {new Date(banner.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Section Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedSection ? "Edit Section" : "Add New Section"}
            </DialogTitle>
          </DialogHeader>
          {/* TODO: Implement section editor form */}
          <div className="space-y-4">
            <p className="text-muted-foreground">Section editor coming soon...</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 