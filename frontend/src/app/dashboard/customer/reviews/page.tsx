"use client"

import { useState } from "react"
import { ReviewCard } from "@/components/services/ReviewCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"

// Temporary mock data
const MOCK_REVIEWS = [
  {
    id: "1",
    serviceName: "House Cleaning",
    providerName: "CleanPro Services",
    rating: 4,
    comment: "Great service! Very professional and thorough.",
    date: "March 15, 2024",
    images: ["/placeholder.jpg"]
  },
  // Add more mock reviews...
]

const MOCK_PENDING_REVIEWS = [
  {
    id: "2",
    serviceName: "Plumbing Service",
    providerName: "FixIt Pro",
    date: "March 20, 2024"
  },
  // Add more pending reviews...
]

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<any>(null)

  const handleEditReview = (reviewId: string) => {
    const review = MOCK_REVIEWS.find(r => r.id === reviewId)
    if (review) {
      setRating(review.rating)
      setComment(review.comment)
      setSelectedService(review)
      setIsDialogOpen(true)
    }
  }

  const handleDeleteReview = (reviewId: string) => {
    // Handle delete logic
    console.log("Deleting review:", reviewId)
  }

  const handleSubmitReview = () => {
    // Handle submit logic
    console.log("Submitting review:", { rating, comment, serviceId: selectedService?.id })
    setIsDialogOpen(false)
    setRating(0)
    setComment("")
    setSelectedService(null)
  }

  return (
    <div className="container py-6">
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Reviews</TabsTrigger>
          <TabsTrigger value="pending">Pending Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="space-y-6">
            {MOCK_REVIEWS.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onEdit={handleEditReview}
                onDelete={handleDeleteReview}
                canModify
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="space-y-6">
            {MOCK_PENDING_REVIEWS.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{service.serviceName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{service.providerName}</p>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => {
                      setSelectedService(service)
                      setIsDialogOpen(true)
                    }}
                  >
                    Leave Review
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedService?.id ? "Edit Review" : "Leave a Review"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">{selectedService?.serviceName}</h4>
              <p className="text-sm text-muted-foreground">{selectedService?.providerName}</p>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-6 w-6 ${
                      value <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Write your review..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
            <Button onClick={handleSubmitReview} className="w-full">
              Submit Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 