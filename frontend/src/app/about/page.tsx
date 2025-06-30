import { Card, CardContent } from "@/components/ui/card"
import { Users, Target, Heart, Award } from "lucide-react"
import Image from "next/image"

export default function AboutPage() {
  const values = [
    {
      icon: Users,
      title: "Community First",
      description: "We believe in building strong communities by connecting skilled professionals with those who need their services.",
    },
    {
      icon: Target,
      title: "Quality Service",
      description: "We maintain high standards through rigorous vetting and continuous monitoring of service quality.",
    },
    {
      icon: Heart,
      title: "Customer Care",
      description: "Your satisfaction is our priority. We're here to support you at every step of your service journey.",
    },
    {
      icon: Award,
      title: "Trust & Reliability",
      description: "We ensure all our service providers are verified and trustworthy professionals in their fields.",
    },
  ]

  const stats = [
    { number: "10,000+", label: "Happy Customers" },
    { number: "1,000+", label: "Service Providers" },
    { number: "50+", label: "Service Categories" },
    { number: "4.8/5", label: "Average Rating" },
  ]

  return (
    <div className="min-h-screen bg-pearlWhite dark:bg-black">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4 dark:text-white">About SewaBazaar</h1>
            <p className="text-gray-500 dark:text-indigo-200/60 max-w-2xl mx-auto">
              SewaBazaar is Nepal's leading online marketplace for local services, connecting skilled professionals 
              with customers looking for quality service providers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-4 dark:text-white">Our Story</h2>
              <p className="text-gray-500 dark:text-indigo-200/60 mb-4">
                Founded in 2024, SewaBazaar was born from a simple observation: finding reliable service providers 
                in Nepal was a challenge. We set out to solve this problem by creating a platform that makes it 
                easy to find, book, and manage local services.
              </p>
              <p className="text-gray-500 dark:text-indigo-200/60">
                Today, we're proud to be the bridge between thousands of skilled professionals and customers, 
                making service booking as easy as a few clicks while ensuring quality and reliability.
              </p>
            </div>
            <div className="relative h-[300px] rounded-lg overflow-hidden">
              <Image
                src="/placeholder.jpg"
                alt="About SewaBazaar"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8 dark:text-white">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {values.map((value, index) => (
                <Card key={index} className="bg-gradient-to-br from-[#FFFFFF] via-[#FDFCFF] to-[#F8F7FF] dark:from-[#111827] dark:via-[#131A2B] dark:to-[#151C2E] hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 dark:border-indigo-950 border border-[#E9E5FF]/20">
                  <CardContent className="p-6">
                    <value.icon className="w-12 h-12 text-[#4776E6] dark:text-indigo-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2 dark:text-white">{value.title}</h3>
                    <p className="text-gray-500 dark:text-indigo-200/60">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FFFFFF] via-[#FDFCFF] to-[#F8F7FF] dark:from-[#111827] dark:via-[#131A2B] dark:to-[#151C2E] rounded-xl p-8 mb-16 border border-[#E9E5FF]/20 dark:border-indigo-950 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <h2 className="text-3xl font-bold text-center mb-8 dark:text-white">SewaBazaar by Numbers</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-[#4776E6] dark:text-indigo-400 mb-2">{stat.number}</div>
                  <div className="text-gray-500 dark:text-indigo-200/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4 dark:text-white">Join Our Mission</h2>
            <p className="text-gray-500 dark:text-indigo-200/60 mb-8">
              Whether you're a service provider looking to grow your business or a customer seeking quality services, 
              we invite you to be part of our journey in transforming the local services industry in Nepal.
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="/services"
                className="bg-gradient-to-r from-[#8E54E9] to-[#4776E6] dark:from-[#2D1B69] dark:via-[#2B2483] dark:to-[#1E3377] hover:opacity-90 text-white px-8 py-3 rounded-lg font-medium"
              >
                Find Services
              </a>
              <a
                href="/contact"
                className="bg-white dark:bg-[#111827] border border-[#4776E6] dark:border-indigo-400 text-[#4776E6] dark:text-indigo-400 hover:bg-[#4776E6]/5 dark:hover:bg-indigo-400/10 px-8 py-3 rounded-lg font-medium"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 