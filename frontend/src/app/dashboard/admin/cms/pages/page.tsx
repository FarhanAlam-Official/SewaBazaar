"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  FileText,
  Globe,
  HelpCircle,
  ShieldCheck,
  Info,
} from "lucide-react"

// TODO: Replace with actual API calls and database models
interface StaticPage {
  id: string
  title: string
  slug: string
  content: string
  type: "faq" | "terms" | "privacy" | "about" | "custom"
  lastUpdated: string
  isPublished: boolean
}

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  order: number
}

// Mock data
const MOCK_PAGES: StaticPage[] = [
  {
    id: "1",
    title: "About Us",
    slug: "about",
    content: "# About SewaBazaar\n\nWe are a platform connecting service providers with customers...",
    type: "about",
    lastUpdated: "2024-03-15T10:00:00Z",
    isPublished: true,
  },
  {
    id: "2",
    title: "Terms of Service",
    slug: "terms",
    content: "# Terms of Service\n\n## 1. Acceptance of Terms\n\nBy accessing our service...",
    type: "terms",
    lastUpdated: "2024-03-14T15:30:00Z",
    isPublished: true,
  },
]

const MOCK_FAQS: FAQItem[] = [
  {
    id: "1",
    question: "How do I book a service?",
    answer: "You can book a service by browsing our categories, selecting a provider...",
    category: "Booking",
    order: 1,
  },
  {
    id: "2",
    question: "What payment methods do you accept?",
    answer: "We accept various payment methods including credit cards, eSewa, and Khalti...",
    category: "Payments",
    order: 2,
  },
]

const FAQ_CATEGORIES = ["General", "Booking", "Payments", "Services", "Support"]

export default function PagesPage() {
  const [pages, setPages] = useState<StaticPage[]>(MOCK_PAGES)
  const [faqs, setFaqs] = useState<FAQItem[]>(MOCK_FAQS)
  const [selectedPage, setSelectedPage] = useState<StaticPage | null>(null)
  const [selectedFAQ, setSelectedFAQ] = useState<FAQItem | null>(null)
  const [isPageDialogOpen, setIsPageDialogOpen] = useState(false)
  const [isFAQDialogOpen, setIsFAQDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState<"page" | "faq" | null>(null)

  // TODO: Implement these functions with actual API calls
  const handlePageSave = (page: StaticPage) => {
    if (editMode === "page") {
      setPages(prev => prev.map(p => p.id === page.id ? page : p))
    } else {
      setPages(prev => [...prev, { ...page, id: Date.now().toString() }])
    }
    setIsPageDialogOpen(false)
  }

  const handleFAQSave = (faq: FAQItem) => {
    if (editMode === "faq") {
      setFaqs(prev => prev.map(f => f.id === faq.id ? faq : f))
    } else {
      setFaqs(prev => [...prev, { ...faq, id: Date.now().toString() }])
    }
    setIsFAQDialogOpen(false)
  }

  const getPageIcon = (type: StaticPage["type"]) => {
    switch (type) {
      case "about":
        return <Info className="h-4 w-4" />
      case "terms":
        return <FileText className="h-4 w-4" />
      case "privacy":
        return <ShieldCheck className="h-4 w-4" />
      case "faq":
        return <HelpCircle className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Static Pages</h2>
        <div className="flex items-center gap-2">
          <Button onClick={() => {
            setSelectedFAQ(null)
            setEditMode(null)
            setIsFAQDialogOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
          <Button onClick={() => {
            setSelectedPage(null)
            setEditMode(null)
            setIsPageDialogOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Page
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pages">
        <TabsList>
          <TabsTrigger value="pages">Static Pages</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-4">
          {pages.map((page) => (
            <Card key={page.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  {getPageIcon(page.type)}
                  <CardTitle className="text-lg font-medium">
                    {page.title}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedPage(page)
                      setEditMode("page")
                      setIsPageDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(`/${page.slug}`, "_blank")}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Badge variant={page.isPublished ? "default" : "secondary"}>
                    {page.isPublished ? "Published" : "Draft"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Last updated: {new Date(page.lastUpdated).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          {FAQ_CATEGORIES.map((category) => {
            const categoryFaqs = faqs.filter(faq => faq.category === category)
            if (categoryFaqs.length === 0) return null

            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">{category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {categoryFaqs.map((faq) => (
                    <div
                      key={faq.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{faq.question}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedFAQ(faq)
                            setEditMode("faq")
                            setIsFAQDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>

      {/* Page Edit Dialog */}
      <Dialog open={isPageDialogOpen} onOpenChange={setIsPageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editMode === "page" ? "Edit Page" : "Add New Page"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={selectedPage?.title || ""}
                onChange={(e) => setSelectedPage(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="e.g., About Us"
              />
            </div>
            <div className="space-y-2">
              <Label>Content (Markdown)</Label>
              <Textarea
                value={selectedPage?.content || ""}
                onChange={(e) => setSelectedPage(prev => prev ? { ...prev, content: e.target.value } : null)}
                placeholder="Write your content in Markdown format..."
                className="min-h-[300px] font-mono"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => selectedPage && handlePageSave(selectedPage)}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* FAQ Edit Dialog */}
      <Dialog open={isFAQDialogOpen} onOpenChange={setIsFAQDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMode === "faq" ? "Edit FAQ" : "Add New FAQ"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Question</Label>
              <Input
                value={selectedFAQ?.question || ""}
                onChange={(e) => setSelectedFAQ(prev => prev ? { ...prev, question: e.target.value } : null)}
                placeholder="e.g., How do I book a service?"
              />
            </div>
            <div className="space-y-2">
              <Label>Answer</Label>
              <Textarea
                value={selectedFAQ?.answer || ""}
                onChange={(e) => setSelectedFAQ(prev => prev ? { ...prev, answer: e.target.value } : null)}
                placeholder="Write the answer..."
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                value={selectedFAQ?.category || "General"}
                onChange={(e) => setSelectedFAQ(prev => prev ? { ...prev, category: e.target.value } : null)}
                className="w-full border rounded-md p-2"
              >
                {FAQ_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <Button
              className="w-full"
              onClick={() => selectedFAQ && handleFAQSave(selectedFAQ)}
            >
              <Save className="h-4 w-4 mr-2" />
              Save FAQ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 