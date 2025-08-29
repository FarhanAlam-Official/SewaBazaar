"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Star, MapPin, Clock, Check, X, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter, useSearchParams } from "next/navigation"
import { showToast } from "@/components/ui/enhanced-toast"

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [timeSlot, setTimeSlot] = useState<string | null>(null)
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isBookingIntent = searchParams.get('booking') === 'true'

  // Mock service data
  const service = {
    id: Number.parseInt(params.id),
    title: "Professional House Cleaning",
    category: "Cleaning",
    price: 1200,
    rating: 4.8,
    reviews: 124,
    provider: {
      name: "CleanHome Nepal",
      image: "/placeholder.svg?height=50&width=50",
      rating: 4.9,
      verified: true,
      since: "2020",
    },
    location: "Kathmandu",
    image: "/placeholder.svg?height=400&width=800",
    description:
      "Our professional house cleaning service includes thorough cleaning of all rooms, bathrooms, kitchen, and living areas. We use eco-friendly cleaning products and ensure every corner of your home is spotless. The service includes dusting, vacuuming, mopping, bathroom cleaning, kitchen cleaning, and more.",
    includes: [
      "Deep cleaning of all rooms",
      "Bathroom sanitization",
      "Kitchen deep cleaning",
      "Floor mopping and vacuuming",
      "Dusting of all surfaces",
      "Window cleaning (interior)",
    ],
    excludes: ["Exterior window cleaning", "Carpet shampooing", "Wall washing", "Ceiling cleaning"],
    duration: "3-4 hours",
    reviewsList: [
      {
        id: 1,
        user: "Aarav Sharma",
        rating: 5,
        date: "2023-04-15",
        comment:
          "Excellent service! The team was punctual, professional, and did a thorough job. My house has never been cleaner.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 2,
        user: "Priya Thapa",
        rating: 4,
        date: "2023-03-22",
        comment:
          "Good service overall. They missed a few spots under the furniture, but when I pointed it out, they immediately fixed it.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 3,
        user: "Rohan Gurung",
        rating: 5,
        date: "2023-02-10",
        comment:
          "Very satisfied with the cleaning service. The team was friendly and efficient. Will definitely book again!",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    ],
  }

  // Mock time slots
  const timeSlots = ["09:00 AM - 12:00 PM", "12:00 PM - 03:00 PM", "03:00 PM - 06:00 PM"]

  // Mock similar services
  const similarServices = [
    {
      id: 101,
      title: "Deep Cleaning Service",
      price: 2200,
      rating: 4.7,
      image: "/placeholder.svg?height=100&width=150",
    },
    {
      id: 102,
      title: "Office Cleaning",
      price: 1800,
      rating: 4.6,
      image: "/placeholder.svg?height=100&width=150",
    },
    {
      id: 103,
      title: "Carpet Cleaning",
      price: 800,
      rating: 4.5,
      image: "/placeholder.svg?height=100&width=150",
    },
  ]

  // Handle Book Now button click
  const handleBookNow = () => {
    if (!isAuthenticated) {
      // Show login prompt for unauthenticated users
      showToast.warning({
        title: "Login Required",
        description: "Please login to book this service",
        duration: 4000,
        action: {
          label: "Login Now",
          onClick: () => router.push("/login")
        }
      })
      return
    }

    // Check if user is a customer (only customers can book services)
    if (user?.role !== 'customer') {
      showToast.error({
        title: "Access Denied",
        description: "Only customers can book services. Providers cannot book their own services.",
        duration: 5000
      })
      return
    }

    // Check if date and time are selected
    if (!date || !timeSlot) {
      showToast.warning({
        title: "Selection Required",
        description: "Please select a date and time slot before booking",
        duration: 4000
      })
      return
    }

    // Proceed with booking - redirect to booking wizard
    router.push(`/dashboard/customer/bookings/new?service=${service.id}&date=${date.toISOString().split('T')[0]}&time=${timeSlot}`)
  }

  // Show booking success message if coming from services page
  if (isBookingIntent && isAuthenticated && user?.role === 'customer') {
    showToast.success({
      title: "Ready to Book!",
      description: "Please select your preferred date and time to continue",
      duration: 3000
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Main Content */}
        <div className="md:w-2/3">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm mb-4">
            <Link href="/" className="text-gray-500 hover:text-sky-600">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
            <Link href="/services" className="text-gray-500 hover:text-sky-600">
              Services
            </Link>
            <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
            <Link
              href={`/services?category=${service.category.toLowerCase()}`}
              className="text-gray-500 hover:text-sky-600"
            >
              {service.category}
            </Link>
            <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
            <span className="text-gray-900">{service.title}</span>
          </div>

          {/* Service Image */}
          <div className="relative h-[300px] md:h-[400px] w-full rounded-xl overflow-hidden mb-6">
            <Image src={service.image || "/placeholder.svg"} alt={service.title} fill className="object-cover" />
          </div>

          {/* Service Title and Info */}
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <span className="text-sm font-medium px-2 py-1 bg-sky-100 text-sky-800 rounded-full mr-3">
                {service.category}
              </span>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                <span className="text-sm font-medium">{service.rating}</span>
                <span className="text-sm text-gray-500 ml-1">({service.reviews} reviews)</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">{service.title}</h1>
            <div className="flex items-center text-gray-500 mb-4">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm">{service.location}</span>
              <span className="mx-2">•</span>
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-sm">{service.duration}</span>
            </div>
            <div className="flex items-center">
              <Image
                src={service.provider.image || "/placeholder.svg"}
                alt={service.provider.name}
                width={40}
                height={40}
                className="rounded-full mr-3"
              />
              <div>
                <div className="flex items-center">
                  <p className="font-medium">{service.provider.name}</p>
                  {service.provider.verified && (
                    <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full flex items-center">
                      <Check className="h-3 w-3 mr-1" /> Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">Member since {service.provider.since}</p>
              </div>
            </div>
          </div>

          {/* Service Details Tabs */}
          <Tabs defaultValue="description" className="mb-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="includes">What's Included</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="pt-4">
              <p className="text-gray-700 leading-relaxed">{service.description}</p>
            </TabsContent>
            <TabsContent value="includes" className="pt-4">
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3">Service Includes:</h3>
                <ul className="space-y-2">
                  {service.includes.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3">Service Excludes:</h3>
                <ul className="space-y-2">
                  {service.excludes.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <X className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="reviews" className="pt-4">
              <div className="space-y-6">
                {service.reviewsList.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                    <div className="flex items-center mb-3">
                      <Image
                        src={review.avatar || "/placeholder.svg"}
                        alt={review.user}
                        width={40}
                        height={40}
                        className="rounded-full mr-3"
                      />
                      <div>
                        <p className="font-medium">{review.user}</p>
                        <div className="flex items-center">
                          <div className="flex mr-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "text-saffronGlow fill-saffronGlow"
                                    : "text-gray-300 dark:text-gray-700"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-gray-500">{review.date}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="mt-4 w-full">
                See All Reviews
              </Button>
            </TabsContent>
          </Tabs>

          {/* Similar Services */}
          <div>
            <h2 className="text-xl font-bold mb-4">Similar Services</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {similarServices.map((item) => (
                <Link href={`/services/${item.id}`} key={item.id}>
                  <Card className="overflow-hidden transition-all hover:shadow-md">
                    <div className="relative h-24">
                      <Image src={item.image || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm mb-1 line-clamp-1">{item.title}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 mr-1" />
                          <span className="text-xs">{item.rating}</span>
                        </div>
                        <p className="font-bold text-sky-600 text-sm">NPR {item.price}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Booking Sidebar */}
        <div className="md:w-1/3">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-2">Book This Service</h2>
              <div className="flex items-center justify-between mb-6">
                <p className="text-2xl font-bold text-freshAqua">NPR {service.price}</p>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                  <span className="font-medium">{service.rating}</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Select Time Slot</label>
                  <div className="grid grid-cols-1 gap-2">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot}
                        variant={timeSlot === slot ? "default" : "outline"}
                        className={timeSlot === slot ? "bg-sky-600 hover:bg-sky-700" : ""}
                        onClick={() => setTimeSlot(slot)}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Special Instructions (Optional)</label>
                  <Textarea placeholder="Any specific requirements or details..." />
                </div>
              </div>

              <Button className="w-full bg-freshAqua hover:bg-freshAqua/90 text-white" onClick={handleBookNow}>
                Book Now
              </Button>

              <div className="mt-6 text-sm text-gray-500">
                <p className="flex items-start mb-2">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  Free cancellation up to 24 hours before the service
                </p>
                <p className="flex items-start mb-2">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  Verified and background-checked professionals
                </p>
                <p className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  Secure payment through SewaBazaar
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
