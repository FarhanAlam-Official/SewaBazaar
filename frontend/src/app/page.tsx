"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Star, ArrowRight, Search, MapPin } from "lucide-react"
import Link from "next/link"
import { CategoryCardSkeleton, TestimonialCardSkeleton } from "@/components/ui/skeleton"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import SplineScene from '@/app/SplineScene'

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Mock data for categories and testimonials
  const categories = [
    { id: 1, name: "Plumbing", icon: "🔧", count: 24 },
    { id: 2, name: "Cleaning", icon: "🧹", count: 36 },
    { id: 3, name: "Beauty", icon: "💇‍♀️", count: 42 },
    { id: 4, name: "Electrical", icon: "⚡", count: 18 },
    { id: 5, name: "Carpentry", icon: "🪚", count: 15 },
    { id: 6, name: "Painting", icon: "🎨", count: 12 },
    { id: 7, name: "Gardening", icon: "🌱", count: 9 },
    { id: 8, name: "Tutoring", icon: "📚", count: 27 },
  ]

  const testimonials = [
    {
      id: 1,
      name: "Aarav Sharma",
      role: "Homeowner",
      content:
        "SewaBazaar helped me find a reliable plumber within hours. The service was excellent and pricing transparent.",
      rating: 5,
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 2,
      name: "Priya Thapa",
      role: "Working Professional",
      content:
        "I've been using SewaBazaar for all my home cleaning needs. The platform is easy to use and the service providers are professional.",
      rating: 4,
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 3,
      name: "Rohan Gurung",
      role: "Small Business Owner",
      content:
        "As a busy entrepreneur, SewaBazaar has been a lifesaver. I can quickly book services for my office and home without any hassle.",
      rating: 5,
      image: "/placeholder.svg?height=80&width=80",
    },
  ]

  const cities = ["Kathmandu", "Pokhara", "Lalitpur", "Bhaktapur", "Biratnagar", "Birgunj", "Dharan", "Nepalgunj"]

  return (
    <main className="bg-gradient-to-br from-[#EEF1FF] via-[#F8F6FF] to-[#F1F1FF] dark:from-[#0B1120] dark:via-[#0D1424] dark:to-[#0F1627]">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center bg-[#4776E6] bg-gradient-to-r from-[#8E54E9] to-[#4776E6] dark:from-[#2D1B69] dark:via-[#2B2483] dark:to-[#1E3377] overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10"
          style={{
            y: scrollY * 0.2,
            scale: 1 + scrollY * 0.0002
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/20 dark:from-black/40 dark:to-black/60"></div>
        <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-[#4B2FBB]/20 dark:via-[#3B3AA9]/20 dark:to-[#2C4AB8]/20 dark:blur-3xl dark:opacity-30 animate-gradient"></div>
        
        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left side content */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-xl lg:pl-6"
            >
              <div className="space-y-6">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="heading-1 text-white drop-shadow-md text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight"
                >
                  Find Trusted Local Service Providers
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="large-text text-white/90 text-balance drop-shadow text-lg lg:text-xl"
                >
                  Connect with skilled professionals for all your home and personal needs.
                  Book services with confidence.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4 pt-4"
                >
                  <Link
                    href="/services"
                    className="inline-flex items-center justify-center gap-2 bg-white text-[#4776E6] dark:text-[#3B3AA9] px-8 py-4 rounded-full font-semibold hover:bg-gray-50 hover:scale-105 transition-all duration-300 shadow-lg group dark:shadow-black/30"
                  >
                    Explore Services
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 border-2 border-white/80 text-white px-8 py-4 rounded-full font-semibold hover:bg-white/10 transition-all duration-300 group backdrop-blur-sm dark:shadow-black/20"
                  >
                    Become a Provider
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* Right side - Spline Scene */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 1 }}
               className="relative h-[650px] hidden lg:block lg:translate-x-12"
             >
               <SplineScene
                 className="absolute inset-0"
               />
             </motion.div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="relative z-10">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto -mt-20 bg-gradient-to-br from-[#FFFFFF] via-[#FDFCFF] to-[#F8F7FF] dark:from-[#111827] dark:via-[#131A2B] dark:to-[#151C2E] rounded-3xl shadow-lg dark:shadow-2xl dark:shadow-indigo-500/10 p-6 sm:p-8 border border-[#E9E5FF]/20 dark:border-indigo-950 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 backdrop-blur-lg"
          >
            <motion.h2 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-2xl md:text-3xl font-bold text-center mb-6 dark:text-white bg-gradient-to-r from-[#8E54E9] to-[#4776E6] dark:from-white dark:to-white/80 bg-clip-text text-transparent"
            >
              Find Services Near You
            </motion.h2>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col md:flex-row gap-4"
            >
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors group-hover:text-primary" />
                <Input 
                  placeholder="What service do you need?" 
                  className="h-12 pl-12 rounded-xl bg-white dark:bg-[#1E2433] border-[#E9E5FF]/20 dark:border-indigo-950 dark:text-white dark:placeholder:text-indigo-200/30 transition-all duration-300 focus:ring-2 focus:ring-primary/20 hover:border-primary/30" 
                />
              </div>
              <div className="w-full md:w-48 relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 z-10 transition-colors group-hover:text-primary" />
                <Select defaultValue="">
                  <SelectTrigger className="h-12 pl-12 rounded-xl bg-white dark:bg-[#1E2433] border-[#E9E5FF]/20 dark:border-indigo-950 dark:text-white transition-all duration-300 focus:ring-2 focus:ring-primary/20 hover:border-primary/30">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#111827] dark:border-indigo-950">
                    {cities.map((city) => (
                      <SelectItem key={city} value={city.toLowerCase()} className="dark:text-white dark:focus:bg-indigo-950/50 transition-colors">
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="default" 
                className="h-12 px-8 bg-gradient-to-r from-[#8E54E9] to-[#4776E6] dark:from-[#2D1B69] dark:via-[#2B2483] dark:to-[#1E3377] hover:opacity-90 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
              >
                Search
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#EEF1FF]/80 via-transparent to-[#F8F6FF]/80 dark:from-[#0B1120]/80 dark:via-transparent dark:to-[#0F1627]/80"></div>
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="heading-2 mb-4 dark:text-white bg-gradient-to-r from-[#8E54E9] to-[#4776E6] dark:from-white dark:to-white/80 bg-clip-text text-transparent"
            >
              Popular Categories
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-gray-500 dark:text-indigo-200/60 mb-12 max-w-2xl"
            >
              Browse through our most requested service categories and find the help you need
            </motion.p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array(8).fill(0).map((_, i) => (
                <CategoryCardSkeleton key={i} />
              ))
            ) : (
              categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                >
                  <Link href={`/services?category=${category.name.toLowerCase()}`}>
                    <Card className="group h-full bg-gradient-to-br from-[#FFFFFF] via-[#FDFCFF] to-[#F8F7FF] dark:from-[#111827] dark:via-[#131A2B] dark:to-[#151C2E] hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 dark:border-indigo-950 border border-[#E9E5FF]/20 overflow-hidden">
                      <CardContent className="flex flex-col items-center justify-center p-6 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <motion.div 
                          className="text-5xl mb-4 transform transition-transform duration-300 group-hover:scale-110"
                          initial={{ scale: 1 }}
                          whileHover={{ scale: 1.1, rotate: [0, -10, 10, -10, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          {category.icon}
                        </motion.div>
                        <h3 className="font-semibold text-lg mb-2 dark:text-white relative z-10 bg-gradient-to-r from-[#8E54E9] to-[#4776E6] dark:from-white dark:to-white/80 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity duration-300">
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-indigo-200/60 relative z-10">
                          {category.count} providers
                        </p>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#8E54E9] to-[#4776E6] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#EEF1FF]/80 via-transparent to-[#F8F6FF]/80 dark:from-[#0B1120]/80 dark:via-transparent dark:to-[#0F1627]/80"></div>
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="heading-2 mb-4 dark:text-white bg-gradient-to-r from-[#8E54E9] to-[#4776E6] dark:from-white dark:to-white/80 bg-clip-text text-transparent"
            >
              How It Works
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-gray-500 dark:text-indigo-200/60"
            >
              Get started with SewaBazaar in three simple steps
            </motion.p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-[#8E54E9] to-[#4776E6] transform -translate-y-1/2 opacity-20 hidden md:block"></div>
            {[
              { step: 1, title: "Choose a Service", description: "Browse through our wide range of professional services", icon: "🔍" },
              { step: 2, title: "Book Appointment", description: "Select your preferred time and date for the service", icon: "📅" },
              { step: 3, title: "Get Service", description: "Our verified professional will deliver the service", icon: "✅" }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-[#FFFFFF] via-[#FDFCFF] to-[#F8F7FF] dark:from-[#111827] dark:via-[#131A2B] dark:to-[#151C2E] p-8 rounded-2xl shadow-sm dark:shadow-lg dark:shadow-indigo-500/10 dark:border-indigo-950 border border-[#E9E5FF]/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#8E54E9] to-[#4776E6] flex items-center justify-center text-3xl mb-2 transform transition-transform duration-300 group-hover:scale-110 relative z-10">
                      {item.icon}
                    </div>
                    <div className="absolute inset-0 bg-primary/20 rounded-full filter blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute -right-4 -top-4 w-8 h-8 rounded-full bg-gradient-to-r from-[#8E54E9] to-[#4776E6] flex items-center justify-center text-white font-bold">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#8E54E9] to-[#4776E6] dark:from-white dark:to-white/80 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity duration-300">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 dark:text-indigo-200/60 text-sm leading-relaxed">
                    {item.description}
                  </p>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#8E54E9] to-[#4776E6] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-2xl"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <h2 className="heading-2 mb-4 dark:text-white">What Our Users Say</h2>
            <p className="text-gray-500 dark:text-indigo-200/60">
              Read what our satisfied customers have to say about their experience with SewaBazaar
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <TestimonialCardSkeleton key={i} />
              ))
            ) : (
              testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <Card className="h-full bg-gradient-to-br from-[#FFFFFF] via-[#FDFCFF] to-[#F8F7FF] dark:from-[#111827] dark:via-[#131A2B] dark:to-[#151C2E] hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 dark:border-indigo-950 border border-[#E9E5FF]/20">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
                          <Image
                            src={testimonial.image}
                            alt={testimonial.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold dark:text-white">{testimonial.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-indigo-200/60">{testimonial.role}</p>
                        </div>
                      </div>
                      <p className="text-gray-500 dark:text-indigo-200/60 mb-4">{testimonial.content}</p>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < testimonial.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300 dark:text-gray-700"
                            }`}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-[#8E54E9] via-[#6E48E5] to-[#4776E6] dark:from-[#6E3EB3] dark:via-[#4B44BE] dark:to-[#2F5BB8] text-white rounded-3xl p-12 text-center relative overflow-hidden shadow-xl dark:shadow-indigo-500/20"
          >
            {/* Decorative elements */}
            <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-5"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            
            {/* Animated circles */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="heading-2 mb-4 drop-shadow-md text-white">Ready to Get Started ?</h2>
                <p className="large-text mb-8 max-w-2xl mx-auto text-white/90">
                  Join thousands of satisfied customers who trust SewaBazaar for their service needs
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link
                    href="/services"
                    className="group inline-flex items-center justify-center gap-2 bg-white text-[#6E48E5] dark:text-[#4B44BE] px-8 py-4 rounded-full font-semibold hover:bg-opacity-95 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Book a Service
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/register"
                    className="group inline-flex items-center justify-center gap-2 border-2 border-white/80 text-white px-8 py-4 rounded-full font-semibold hover:bg-white/10 hover:border-white transition-all duration-300"
                  >
                    Become a Provider
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
