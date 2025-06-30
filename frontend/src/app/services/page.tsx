import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Star, MapPin, Filter, Clock, BadgeCheck, Heart } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ServicesPage() {
  // Mock data for services
  const services = [
    {
      id: 1,
      title: "Professional House Cleaning",
      category: "Cleaning",
      price: 1200,
      rating: 4.8,
      reviews: 124,
      provider: "CleanHome Nepal",
      location: "Kathmandu",
      image: "/placeholder.svg?height=200&width=300",
      isVerified: true,
      responseTime: "Under 30 mins",
      completedJobs: 450,
    },
    {
      id: 2,
      title: "Plumbing Repair & Installation",
      category: "Plumbing",
      price: 800,
      rating: 4.6,
      reviews: 98,
      provider: "FixIt Plumbers",
      location: "Lalitpur",
      image: "/placeholder.svg?height=200&width=300",
      isVerified: true,
      responseTime: "1 hour",
      completedJobs: 320,
    },
    {
      id: 3,
      title: "Electrical Wiring & Repair",
      category: "Electrical",
      price: 1000,
      rating: 4.7,
      reviews: 87,
      provider: "PowerFix Nepal",
      location: "Bhaktapur",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 4,
      title: "Professional Haircut & Styling",
      category: "Beauty",
      price: 600,
      rating: 4.9,
      reviews: 156,
      provider: "GlamStyle Salon",
      location: "Kathmandu",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 5,
      title: "Home Painting Services",
      category: "Painting",
      price: 3500,
      rating: 4.5,
      reviews: 62,
      provider: "ColorMaster Painters",
      location: "Kathmandu",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 6,
      title: "Furniture Assembly",
      category: "Carpentry",
      price: 1500,
      rating: 4.4,
      reviews: 45,
      provider: "WoodWorks Nepal",
      location: "Lalitpur",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 7,
      title: "Garden Maintenance",
      category: "Gardening",
      price: 900,
      rating: 4.6,
      reviews: 38,
      provider: "GreenThumb Gardens",
      location: "Bhaktapur",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 8,
      title: "Math & Science Tutoring",
      category: "Tutoring",
      price: 700,
      rating: 4.8,
      reviews: 112,
      provider: "SmartLearn Tutors",
      location: "Kathmandu",
      image: "/placeholder.svg?height=200&width=300",
    },
  ]

  const categories = [
    "All Categories",
    "Cleaning",
    "Plumbing",
    "Electrical",
    "Beauty",
    "Painting",
    "Carpentry",
    "Gardening",
    "Tutoring",
  ]

  const cities = ["All Cities", "Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Biratnagar", "Birgunj"]

  const sortOptions = [
    { value: "relevance", label: "Most Relevant" },
    { value: "rating", label: "Highest Rated" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "reviews", label: "Most Reviewed" },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="md:w-1/4">
          <div className="bg-gradient-to-br from-[#FFFFFF] via-[#FDFCFF] to-[#F8F7FF] dark:from-[#111827] dark:via-[#131A2B] dark:to-[#151C2E] rounded-xl shadow-md p-6 sticky top-24 border border-[#E9E5FF]/20 dark:border-indigo-950 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <h3 className="font-medium mb-4 flex items-center dark:text-white">
              <Filter className="h-4 w-4 mr-2" /> Filters
            </h3>
            
            <div className="space-y-6">
              <div>
                <Label className="mb-2 block dark:text-white">Price Range (NPR)</Label>
                <div className="pt-4">
                  <Slider defaultValue={[0, 5000]} min={0} max={5000} step={100} />
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-indigo-200/60">
                  <span>NPR 0</span>
                  <span>NPR 5,000+</span>
                </div>
              </div>

              <div>
                <Label className="mb-2 block dark:text-white">Rating</Label>
                <div className="space-y-2">
                  {[4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center">
                      <Checkbox id={`rating-${rating}`} />
                      <Label htmlFor={`rating-${rating}`} className="ml-2 flex items-center dark:text-white">
                        {rating}+ <Star className="h-3 w-3 ml-1 fill-yellow-400 text-yellow-400" />
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block dark:text-white">Service Type</Label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Checkbox id="type-home" />
                    <Label htmlFor="type-home" className="ml-2 dark:text-white">Home Visit</Label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox id="type-remote" />
                    <Label htmlFor="type-remote" className="ml-2 dark:text-white">Remote</Label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox id="type-center" />
                    <Label htmlFor="type-center" className="ml-2 dark:text-white">Service Center</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label className="mb-2 block dark:text-white">Provider Verification</Label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Checkbox id="verified" />
                    <Label htmlFor="verified" className="ml-2 flex items-center dark:text-white">
                      Verified Only <BadgeCheck className="h-4 w-4 ml-1 text-[#4776E6] dark:text-indigo-400" />
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:w-3/4">
          {/* Search and Sort Section */}
          <div className="bg-gradient-to-br from-[#FFFFFF] via-[#FDFCFF] to-[#F8F7FF] dark:from-[#111827] dark:via-[#131A2B] dark:to-[#151C2E] rounded-xl shadow-md p-6 mb-8 border border-[#E9E5FF]/20 dark:border-indigo-950 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input 
                  placeholder="Search services..." 
                  className="h-10 bg-white dark:bg-[#1E2433] border-[#E9E5FF]/20 dark:border-indigo-950 dark:text-white dark:placeholder:text-indigo-200/30" 
                />
              </div>
              <div className="w-full md:w-48">
                <Select defaultValue="all-categories">
                  <SelectTrigger className="h-10 bg-white dark:bg-[#1E2433] border-[#E9E5FF]/20 dark:border-indigo-950 dark:text-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#111827] dark:border-indigo-950">
                    {categories.map((category, index) => (
                      <SelectItem key={index} value={category.toLowerCase().replace(/\s+/g, "-")} className="dark:text-white dark:focus:bg-indigo-950/50">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select defaultValue="all-cities">
                  <SelectTrigger className="h-10 bg-white dark:bg-[#1E2433] border-[#E9E5FF]/20 dark:border-indigo-950 dark:text-white">
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#111827] dark:border-indigo-950">
                    {cities.map((city, index) => (
                      <SelectItem key={index} value={city.toLowerCase().replace(/\s+/g, "-")} className="dark:text-white dark:focus:bg-indigo-950/50">
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select defaultValue="relevance">
                  <SelectTrigger className="h-10 bg-white dark:bg-[#1E2433] border-[#E9E5FF]/20 dark:border-indigo-950 dark:text-white">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#111827] dark:border-indigo-950">
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="dark:text-white dark:focus:bg-indigo-950/50">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="bg-gradient-to-br from-[#FFFFFF] via-[#FDFCFF] to-[#F8F7FF] dark:from-[#111827] dark:via-[#131A2B] dark:to-[#151C2E] hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 dark:border-indigo-950 border border-[#E9E5FF]/20">
                <CardContent className="p-0">
                  <div className="relative h-48">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black"
                    >
                      <Heart className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </Button>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1 dark:text-white">{service.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-indigo-200/60">{service.provider}</p>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="ml-1 text-sm font-medium dark:text-white">{service.rating}</span>
                        <span className="ml-1 text-sm text-gray-500 dark:text-indigo-200/60">({service.reviews})</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500 dark:text-indigo-200/60">
                        <MapPin className="w-4 h-4 mr-1" />
                        {service.location}
                      </div>
                      <p className="font-semibold text-[#4776E6] dark:text-indigo-400">NPR {service.price}</p>
                    </div>
                    {service.isVerified && (
                      <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-indigo-200/60">
                        <BadgeCheck className="w-4 h-4 mr-1 text-[#4776E6] dark:text-indigo-400" />
                        Verified Provider
                      </div>
                    )}
                    {service.responseTime && (
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-indigo-200/60">
                        <Clock className="w-4 h-4 mr-1" />
                        Responds {service.responseTime}
                      </div>
                    )}
                    <div className="mt-6">
                      <Button className="w-full bg-gradient-to-r from-[#8E54E9] to-[#4776E6] dark:from-[#2D1B69] dark:via-[#2B2483] dark:to-[#1E3377] hover:opacity-90 text-white">
                        Book Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex justify-center">
            <div className="flex gap-2">
              <Button variant="outline" className="w-10 h-10 p-0">1</Button>
              <Button variant="outline" className="w-10 h-10 p-0">2</Button>
              <Button variant="outline" className="w-10 h-10 p-0">3</Button>
              <Button variant="outline" className="w-10 h-10 p-0">...</Button>
              <Button variant="outline" className="w-10 h-10 p-0">10</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
