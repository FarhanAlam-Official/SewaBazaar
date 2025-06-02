import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Star, MapPin, Filter } from "lucide-react"
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Browse Services</h1>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input placeholder="Search services..." className="h-10" />
          </div>
          <div className="w-full md:w-48">
            <Select defaultValue="all-categories">
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category, index) => (
                  <SelectItem key={index} value={category.toLowerCase().replace(/\s+/g, "-")}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Select defaultValue="all-cities">
              <SelectTrigger className="h-10">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city, index) => (
                  <SelectItem key={index} value={city.toLowerCase().replace(/\s+/g, "-")}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="h-10 bg-freshAqua hover:bg-freshAqua/90 text-white">Search</Button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3 space-y-6">
            <div>
              <h3 className="font-medium mb-3 flex items-center">
                <Filter className="h-4 w-4 mr-2" /> Filters
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Price Range (NPR)</Label>
                  <div className="pt-4">
                    <Slider defaultValue={[0, 5000]} min={0} max={5000} step={100} />
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <span>NPR 0</span>
                    <span>NPR 5,000+</span>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Rating</Label>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center">
                        <Checkbox id={`rating-${rating}`} />
                        <Label htmlFor={`rating-${rating}`} className="ml-2 flex items-center">
                          {rating}+ <Star className="h-3 w-3 ml-1 fill-yellow-400 text-yellow-400" />
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Service Type</Label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Checkbox id="type-home" />
                      <Label htmlFor="type-home" className="ml-2">
                        Home Visit
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="type-remote" />
                      <Label htmlFor="type-remote" className="ml-2">
                        Remote
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="type-center" />
                      <Label htmlFor="type-center" className="ml-2">
                        Service Center
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:w-2/3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service) => (
                <Link href={`/services/${service.id}`} key={service.id}>
                  <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                    <div className="relative h-48">
                      <Image
                        src={service.image || "/placeholder.svg"}
                        alt={service.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium px-2 py-1 bg-sky-100 text-sky-800 rounded-full">
                          {service.category}
                        </span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < service.rating
                                  ? "text-saffronGlow fill-saffronGlow"
                                  : "text-gray-300 dark:text-gray-700"
                              }`}
                            />
                          ))}
                          <span className="text-sm font-medium">{service.rating}</span>
                          <span className="text-xs text-gray-500 ml-1">({service.reviews})</span>
                        </div>
                      </div>
                      <h3 className="font-semibold mb-1">{service.title}</h3>
                      <p className="text-sm text-gray-500 mb-2">by {service.provider}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-3 w-3 mr-1" />
                          {service.location}
                        </div>
                        <p className="font-bold text-freshAqua">NPR {service.price}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <Button variant="outline" className="mr-2">
                Previous
              </Button>
              <Button variant="outline" className="bg-sky-50">
                1
              </Button>
              <Button variant="outline" className="mx-1">
                2
              </Button>
              <Button variant="outline">3</Button>
              <Button variant="outline" className="ml-2">
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
