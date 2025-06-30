"use client"

import { useState } from "react"
import { DataGrid } from "@/components/ui/data-grid"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import {
  Grid,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Star,
} from "lucide-react"

interface Service {
  id: string
  title: string
  description: string
  price: number
  category: string
  status: string
  image_url: string
  provider: {
    name: string
  }
  created_at: string
  rating: number
}

const columns = [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "provider.name",
    header: "Provider",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => `$${row.original.price.toLocaleString()}`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          row.original.status === "active"
            ? "bg-green-100 text-green-800"
            : row.original.status === "inactive"
            ? "bg-gray-100 text-gray-800"
            : row.original.status === "featured"
            ? "bg-blue-100 text-blue-800"
            : "bg-yellow-100 text-yellow-800"
        }`}
      >
        {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
      </div>
    ),
  },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) => (
      <div className="flex items-center">
        <Star className="h-4 w-4 text-yellow-400 fill-current" />
        <span className="ml-1">{row.original.rating.toFixed(1)}</span>
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>View Details</DropdownMenuItem>
          <DropdownMenuItem>Edit Service</DropdownMenuItem>
          {row.original.status !== "featured" ? (
            <DropdownMenuItem>Mark as Featured</DropdownMenuItem>
          ) : (
            <DropdownMenuItem>Remove from Featured</DropdownMenuItem>
          )}
          <DropdownMenuItem className="text-red-600">Delete Service</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export default function ServicesPage() {
  const { toast } = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"grid" | "list">("grid")

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select(`
          *,
          provider:profiles(name)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      setServices(data)
    } catch (error) {
      console.error("Error fetching services:", error)
      toast({
        title: "Error",
        description: "Failed to fetch services",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useState(() => {
    fetchServices()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Services</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-lg border p-1">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="px-2"
              onClick={() => setView("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              className="px-2"
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search services..." className="pl-8" />
        </div>
        <Button variant="outline" size="sm">
          Filter
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Services</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {view === "grid" ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <Card key={service.id}>
                  <CardHeader className="p-0">
                    <div className="relative aspect-video">
                      <Image
                        src={service.image_url || "/placeholder.jpg"}
                        alt={service.title}
                        fill
                        className="object-cover rounded-t-lg"
                      />
                      {service.status === "featured" && (
                        <div className="absolute top-2 right-2">
                          <Star className="h-5 w-5 text-yellow-400 fill-current" />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {service.description}
                    </CardDescription>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        by {service.provider.name}
                      </div>
                      <div className="font-semibold">${service.price}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <DataGrid
              columns={columns}
              data={services}
              filterColumn="title"
            />
          )}
        </TabsContent>

        <TabsContent value="featured">
          {/* Similar structure as "all" but filtered for featured services */}
        </TabsContent>

        <TabsContent value="pending">
          {/* Similar structure as "all" but filtered for pending services */}
        </TabsContent>

        <TabsContent value="inactive">
          {/* Similar structure as "all" but filtered for inactive services */}
        </TabsContent>
      </Tabs>
    </div>
  )
} 