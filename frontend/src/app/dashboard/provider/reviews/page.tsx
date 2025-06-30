"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Star, MessageCircle, TrendingUp, Award, ThumbsUp } from "lucide-react"
import Image from "next/image"

export default function ReviewsAndRatings() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reviews & Ratings</h1>
        <Button variant="outline">
          <TrendingUp className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {/* Rating Stats */}
        <Card className="p-6">
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-2">4.8</h2>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="h-5 w-5 text-yellow-400 fill-yellow-400"
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Overall Rating</p>
            <p className="text-sm text-muted-foreground">Based on 125 reviews</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">98%</h3>
              <p className="text-sm text-muted-foreground">Response Rate</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Top 10%</h3>
              <p className="text-sm text-muted-foreground">Service Provider</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ThumbsUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">95%</h3>
              <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating Distribution */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Rating Distribution</h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-2">
                <div className="flex items-center gap-1 w-20">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span>{rating}</span>
                </div>
                <Progress value={rating === 5 ? 75 : rating === 4 ? 20 : 5} className="flex-1" />
                <span className="text-sm text-muted-foreground w-12">
                  {rating === 5 ? "75%" : rating === 4 ? "20%" : "5%"}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Reviews */}
        <Card className="lg:col-span-2 p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Reviews</h2>
          <div className="space-y-6">
            {/* Review Item */}
            <div className="border-b pb-6">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <Image
                    src="/placeholder-user.jpg"
                    alt="User"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div>
                    <h3 className="font-medium">Sarah Johnson</h3>
                    <p className="text-sm text-muted-foreground">House Cleaning Service</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="h-4 w-4 text-yellow-400 fill-yellow-400"
                      />
                    ))}
                  </div>
                  <Badge variant="outline">2 days ago</Badge>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                Excellent service! Very professional and thorough with their work. Would definitely recommend!
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Response</label>
                <Textarea placeholder="Write a response..." />
                <Button size="sm">Reply</Button>
              </div>
            </div>

            {/* More Review Items */}
            <div className="border-b pb-6">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <Image
                    src="/placeholder-user.jpg"
                    alt="User"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div>
                    <h3 className="font-medium">Michael Chen</h3>
                    <p className="text-sm text-muted-foreground">Deep Cleaning Service</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4].map((star) => (
                      <Star
                        key={star}
                        className="h-4 w-4 text-yellow-400 fill-yellow-400"
                      />
                    ))}
                  </div>
                  <Badge variant="outline">1 week ago</Badge>
                </div>
              </div>
              <p className="text-muted-foreground mb-2">
                Good service overall. Could improve on time management but quality of work was great.
              </p>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground italic">
                  <span className="font-medium">Your response:</span> Thank you for your feedback! We'll work on improving our time management.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 