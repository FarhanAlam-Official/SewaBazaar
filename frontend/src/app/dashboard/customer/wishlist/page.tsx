"use client"

import { useState } from "react"
import { ServiceCard } from "@/components/services/ServiceCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Share2, Trash2 } from "lucide-react"

// Temporary mock data
const MOCK_SAVED_SERVICES = [
  {
    id: "1",
    name: "House Cleaning",
    provider: "CleanPro Services",
    image: "/placeholder.jpg",
    rating: 4.5,
    price: 2500,
    location: "Kathmandu",
    category: "Cleaning"
  },
  // Add more services...
]

export default function WishlistPage() {
  const [category, setCategory] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<any>(null)

  const handleRemoveFromWishlist = (serviceId: string) => {
    // Handle remove from wishlist logic
    console.log("Removing from wishlist:", serviceId)
  }

  const handleShare = (service: any) => {
    setSelectedService(service)
    setIsShareDialogOpen(true)
  }

  const handleBook = (serviceId: string) => {
    // Handle booking logic
    console.log("Booking service:", serviceId)
  }

  const filteredServices = MOCK_SAVED_SERVICES.filter(service => {
    const matchesCategory = !category || service.category === category
    const matchesSearch = !searchQuery || 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.provider.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="container py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Saved Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search saved services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="Cleaning">Cleaning</SelectItem>
                <SelectItem value="Repair">Repair</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div key={service.id} className="relative group">
            <ServiceCard
              service={service}
              variant="wishlist"
              onAction={handleBook}
              actionLabel="Book Now"
            />
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare(service)}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleRemoveFromWishlist(service.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Service</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{selectedService.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedService.provider}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm">Share this service with:</p>
                <div className="flex gap-2">
                  <Button className="flex-1">
                    Copy Link
                  </Button>
                  <Button className="flex-1">
                    Share via Email
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 