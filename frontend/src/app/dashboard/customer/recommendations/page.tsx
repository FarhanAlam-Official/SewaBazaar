"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ServiceCard } from "@/components/services/ServiceCard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Star, MapPin, History, ThumbsUp } from "lucide-react"

// Temporary mock data
const MOCK_RECOMMENDED_SERVICES = [
  {
    id: "1",
    name: "Deep House Cleaning",
    provider: "CleanPro Services",
    image: "/placeholder.jpg",
    rating: 4.8,
    price: 3000,
    location: "Kathmandu",
    reason: "Based on your previous bookings"
  },
  // Add more services...
]

const MOCK_NEARBY_SERVICES = [
  {
    id: "2",
    name: "Plumbing Service",
    provider: "FixIt Pro",
    image: "/placeholder.jpg",
    rating: 4.5,
    price: 1500,
    location: "Lalitpur",
    distance: "2.5 km"
  },
  // Add more services...
]

const MOCK_POPULAR_SERVICES = [
  {
    id: "3",
    name: "AC Maintenance",
    provider: "CoolAir Services",
    image: "/placeholder.jpg",
    rating: 4.7,
    price: 2000,
    location: "Bhaktapur",
    bookings: 150
  },
  // Add more services...
]

export default function RecommendationsPage() {
  const [activeTab, setActiveTab] = useState("personalized")

  const handleBook = (serviceId: string) => {
    // Handle booking logic
    console.log("Booking service:", serviceId)
  }

  return (
    <div className="container py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recommended Services</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="personalized" className="space-y-6">
            <TabsList>
              <TabsTrigger value="personalized">
                <History className="h-4 w-4 mr-2" />
                Based on History
              </TabsTrigger>
              <TabsTrigger value="nearby">
                <MapPin className="h-4 w-4 mr-2" />
                Nearby Services
              </TabsTrigger>
              <TabsTrigger value="popular">
                <ThumbsUp className="h-4 w-4 mr-2" />
                Popular Services
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personalized">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_RECOMMENDED_SERVICES.map((service) => (
                  <div key={service.id} className="relative">
                    <ServiceCard
                      service={service}
                      onAction={handleBook}
                      actionLabel="Book Now"
                    />
                    <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
                      {service.reason}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="nearby">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_NEARBY_SERVICES.map((service) => (
                  <div key={service.id} className="relative">
                    <ServiceCard
                      service={service}
                      onAction={handleBook}
                      actionLabel="Book Now"
                    />
                    <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                      {service.distance} away
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="popular">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_POPULAR_SERVICES.map((service) => (
                  <div key={service.id} className="relative">
                    <ServiceCard
                      service={service}
                      onAction={handleBook}
                      actionLabel="Book Now"
                    />
                    <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                      {service.bookings}+ bookings
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Why these recommendations?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <History className="h-5 w-5 mt-1" />
                <div>
                  <h3 className="font-medium">Based on Your History</h3>
                  <p className="text-sm text-muted-foreground">
                    We analyze your booking history and preferences to suggest services you might like
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="h-5 w-5 mt-1" />
                <div>
                  <h3 className="font-medium">Location-Based</h3>
                  <p className="text-sm text-muted-foreground">
                    Find top-rated service providers in your area for quick and convenient booking
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Star className="h-5 w-5 mt-1" />
                <div>
                  <h3 className="font-medium">Highly Rated</h3>
                  <p className="text-sm text-muted-foreground">
                    All recommended services maintain high customer satisfaction ratings
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seasonal Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Pre-Monsoon Services</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get your home ready for the monsoon season with these essential services
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Roof Inspection</Button>
                  <Button variant="outline" size="sm">Drainage Check</Button>
                  <Button variant="outline" size="sm">Waterproofing</Button>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Summer Specials</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Beat the heat with our summer maintenance services
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">AC Service</Button>
                  <Button variant="outline" size="sm">Fan Installation</Button>
                  <Button variant="outline" size="sm">Cool Roof Coating</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 