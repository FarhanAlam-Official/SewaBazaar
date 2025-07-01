"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Tags,
  Calendar,
  User,
  Filter,
} from "lucide-react"
import { DataGrid } from "@/components/ui/data-grid"

// TODO: Replace with actual API calls and database models
interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  author: string
  categories: string[]
  tags: string[]
  featuredImage?: string
  publishedAt: string | null
  status: "draft" | "published" | "scheduled"
}

interface Category {
  id: string
  name: string
  slug: string
  description: string
  postCount: number
}

interface Tag {
  id: string
  name: string
  slug: string
  postCount: number
}

// Mock data
const MOCK_POSTS: BlogPost[] = [
  {
    id: "1",
    title: "How to Find the Best Service Provider",
    slug: "find-best-service-provider",
    content: "# Finding the Best Service Provider\n\nWhen looking for a service provider...",
    excerpt: "A comprehensive guide to finding and selecting the best service provider for your needs.",
    author: "John Doe",
    categories: ["Guides", "Tips"],
    tags: ["service-provider", "tips", "guide"],
    publishedAt: "2024-03-15T10:00:00Z",
    status: "published",
  },
  {
    id: "2",
    title: "Top 10 Home Services in 2024",
    slug: "top-home-services-2024",
    content: "# Top 10 Home Services in 2024\n\n1. Home Cleaning...",
    excerpt: "Discover the most popular and in-demand home services this year.",
    author: "Jane Smith",
    categories: ["Trends"],
    tags: ["home-services", "trends", "2024"],
    publishedAt: null,
    status: "draft",
  },
]

const MOCK_CATEGORIES: Category[] = [
  {
    id: "1",
    name: "Guides",
    slug: "guides",
    description: "Helpful guides and tutorials",
    postCount: 5,
  },
  {
    id: "2",
    name: "Tips",
    slug: "tips",
    description: "Quick tips and advice",
    postCount: 3,
  },
]

const MOCK_TAGS: Tag[] = [
  {
    id: "1",
    name: "service-provider",
    slug: "service-provider",
    postCount: 8,
  },
  {
    id: "2",
    name: "tips",
    slug: "tips",
    postCount: 12,
  },
]

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>(MOCK_POSTS)
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES)
  const [tags, setTags] = useState<Tag[]>(MOCK_TAGS)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)

  // TODO: Implement these functions with actual API calls
  const handlePostSave = (post: BlogPost) => {
    if (selectedPost) {
      setPosts(prev => prev.map(p => p.id === post.id ? post : p))
    } else {
      setPosts(prev => [...prev, { ...post, id: Date.now().toString() }])
    }
    setIsPostDialogOpen(false)
  }

  const handleCategorySave = (category: Category) => {
    if (selectedCategory) {
      setCategories(prev => prev.map(c => c.id === category.id ? category : c))
    } else {
      setCategories(prev => [...prev, { ...category, id: Date.now().toString() }])
    }
    setIsCategoryDialogOpen(false)
  }

  const handleTagSave = (tag: Tag) => {
    if (selectedTag) {
      setTags(prev => prev.map(t => t.id === tag.id ? tag : t))
    } else {
      setTags(prev => [...prev, { ...tag, id: Date.now().toString() }])
    }
    setIsTagDialogOpen(false)
  }

  const columns = [
    {
      field: "title",
      headerName: "Title",
      flex: 2,
      renderCell: (params: any) => (
        <div className="flex flex-col">
          <span className="font-medium">{params.row.title}</span>
          <span className="text-sm text-muted-foreground">{params.row.excerpt}</span>
        </div>
      ),
    },
    {
      field: "author",
      headerName: "Author",
      flex: 1,
    },
    {
      field: "categories",
      headerName: "Categories",
      flex: 1,
      renderCell: (params: any) => (
        <div className="flex gap-1">
          {params.row.categories.map((cat: string) => (
            <Badge key={cat} variant="secondary">{cat}</Badge>
          ))}
        </div>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params: any) => (
        <Badge variant={
          params.row.status === "published" ? "default" :
          params.row.status === "scheduled" ? "outline" : "secondary"
        }>
          {params.row.status}
        </Badge>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      renderCell: (params: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedPost(params.row)
              setIsPostDialogOpen(true)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(`/blog/${params.row.slug}`, "_blank")}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Blog Management</h2>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsCategoryDialogOpen(true)}>
            <Filter className="h-4 w-4 mr-2" />
            Categories
          </Button>
          <Button onClick={() => setIsTagDialogOpen(true)}>
            <Tags className="h-4 w-4 mr-2" />
            Tags
          </Button>
          <Button onClick={() => {
            setSelectedPost(null)
            setIsPostDialogOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataGrid
            rows={posts}
            columns={columns}
            pageSize={10}
            className="min-h-[500px]"
          />
        </CardContent>
      </Card>

      {/* Post Edit Dialog */}
      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPost ? "Edit Post" : "New Post"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={selectedPost?.title || ""}
                  onChange={(e) => setSelectedPost(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="Post title"
                />
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input
                  value={selectedPost?.author || ""}
                  onChange={(e) => setSelectedPost(prev => prev ? { ...prev, author: e.target.value } : null)}
                  placeholder="Author name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea
                value={selectedPost?.excerpt || ""}
                onChange={(e) => setSelectedPost(prev => prev ? { ...prev, excerpt: e.target.value } : null)}
                placeholder="Brief description of the post"
              />
            </div>
            <div className="space-y-2">
              <Label>Content (Markdown)</Label>
              <Textarea
                value={selectedPost?.content || ""}
                onChange={(e) => setSelectedPost(prev => prev ? { ...prev, content: e.target.value } : null)}
                placeholder="Write your post content in Markdown format..."
                className="min-h-[300px] font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categories</Label>
                <select
                  multiple
                  value={selectedPost?.categories || []}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value)
                    setSelectedPost(prev => prev ? { ...prev, categories: values } : null)
                  }}
                  className="w-full border rounded-md p-2 h-32"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <select
                  multiple
                  value={selectedPost?.tags || []}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value)
                    setSelectedPost(prev => prev ? { ...prev, tags: values } : null)
                  }}
                  className="w-full border rounded-md p-2 h-32"
                >
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.name}>{tag.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={selectedPost?.status || "draft"}
                onChange={(e) => setSelectedPost(prev => prev ? { ...prev, status: e.target.value as BlogPost["status"] } : null)}
                className="w-full border rounded-md p-2"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            <Button
              className="w-full"
              onClick={() => selectedPost && handlePostSave(selectedPost)}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Categories</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">
                    {category.name}
                  </CardTitle>
                  <Badge variant="secondary">{category.postCount} posts</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </CardContent>
              </Card>
            ))}
            <Button
              className="w-full"
              onClick={() => {
                setSelectedCategory(null)
                setIsCategoryDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tag Dialog */}
      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tags</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {tags.map((tag) => (
                <Card key={tag.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">
                      {tag.name}
                    </CardTitle>
                    <Badge variant="secondary">{tag.postCount} posts</Badge>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <Button
              className="w-full"
              onClick={() => {
                setSelectedTag(null)
                setIsTagDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Tag
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 