"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AnimatedCard, AnimatedCardContent } from "@/components/ui/animated-card"
import { AnimatedSection } from "@/components/ui/animated-section"
import { StaggeredContainer } from "@/components/ui/animation-components"
import { Star, ArrowRight, Search, MapPin, Sparkles, Shield, Clock, Users, Heart, CheckCircle, Award, Globe, Zap } from "lucide-react"
import Link from "next/link"
import {useEffect } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import SplineScene from '@/app/SplineScene'

export default function Home() {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -50])
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8])

  useEffect(() => {
    const handleScroll = () => {
      // Scroll handling logic if needed
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Remove artificial loading - real apps should load content immediately

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
    <main className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Hero Section - Glassmorphism & Floating Elements */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Primary Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-blue-600/15 to-cyan-500/20 dark:from-violet-800/30 dark:via-blue-800/25 dark:to-cyan-700/30" />
          
          {/* Floating Orbs - Glassmorphism Effect */}
          <motion.div 
            className="absolute top-20 left-10 w-72 h-72 rounded-full bg-gradient-to-br from-violet-400/30 to-pink-400/30 backdrop-blur-3xl border border-white/20 dark:border-white/10"
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              scale: [1, 1.1, 1],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <motion.div 
            className="absolute top-40 right-20 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400/25 to-cyan-400/25 backdrop-blur-3xl border border-white/20 dark:border-white/10"
            animate={{
              y: [30, -30, 30],
              x: [15, -15, 15],
              scale: [1.1, 1, 1.1],
              rotate: [360, 180, 0]
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
          
          <motion.div 
            className="absolute bottom-20 left-1/3 w-64 h-64 rounded-full bg-gradient-to-br from-violet-400/20 to-blue-400/20 backdrop-blur-3xl border border-white/20 dark:border-white/10"
            animate={{
              y: [25, -25, 25],
              x: [-20, 20, -20],
              scale: [1, 1.2, 1],
              rotate: [0, -180, -360]
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
          
          {/* Subtle Pattern Overlay */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234F46E5' fill-opacity='1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen py-20">
            {/* Left Content - Enhanced Typography */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8 text-center lg:text-left"
              style={{ y, opacity }}
            >
              {/* Enhanced Floating Badge - User Friendly Size */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-violet-200/50 dark:border-violet-700/50 shadow-lg shadow-violet-500/15 dark:shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/25 dark:hover:shadow-violet-500/35 transition-all duration-300 group hover:scale-102"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="relative"
                >
                  <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <div className="absolute inset-0 bg-violet-400 rounded-full blur-sm opacity-40 group-hover:opacity-60 transition-opacity" />
                </motion.div>
                
                <span className="text-sm font-semibold text-slate-800 dark:text-white">
                  Nepal&apos;s
                  <motion.span 
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-md shadow-md shadow-green-500/25 font-bold text-sm"
                    animate={{ 
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <motion.span
                      animate={{ rotate: [0, 3, -3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      #1
                    </motion.span>
                    <Award className="w-3 h-3" />
                  </motion.span>
                  {' '}Trusted Platform
                </span>
                
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 bg-green-500 rounded-full shadow-sm shadow-green-500/50"
                />
              </motion.div>

              {/* Hero Title - Kinetic Typography */}
              <div className="space-y-4">
                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-none tracking-tight"
                >
                  <span className="block text-slate-900 dark:text-white">
                    Find
                  </span>
                  <motion.span 
                    className="block bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 dark:from-violet-400 dark:via-blue-400 dark:to-cyan-400 bg-clip-text text-transparent"
                    animate={{ 
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                    }}
                    transition={{ 
                      duration: 5, 
                      repeat: Infinity, 
                      ease: "linear" 
                    }}
                    style={{ 
                      backgroundSize: '200% 200%' 
                    }}
                  >
                    Trusted
                  </motion.span>
                  <span className="block text-slate-900 dark:text-white">
                    Local Services
                  </span>
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="text-xl lg:text-2xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl"
                >
                  Connect with{' '}
                  <motion.span 
                    className="font-semibold bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400 bg-clip-text text-transparent"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  >
                    verified professionals
                  </motion.span>
                  {' '}for all your home and personal needs. 
                  <span className="block mt-2 text-lg text-slate-500 dark:text-slate-400">
                    Book with confidence, get results that exceed expectations.
                  </span>
                </motion.p>
              </div>

              {/* CTA Buttons - Glassmorphism */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group"
                >
                  <Link
                    href="/services"
                    className="relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Search className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Explore Services</span>
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-6 h-6" />
                    </motion.div>
                  </Link>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group"
                >
                  <Link
                    href="/register"
                    className="relative inline-flex items-center justify-center gap-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 text-slate-900 dark:text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white dark:hover:bg-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Users className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                    <span>Join as Provider</span>
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    >
                      <ArrowRight className="w-6 h-6" />
                    </motion.div>
                  </Link>
                </motion.div>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-8 -mt-4 text-sm text-slate-500 dark:text-slate-400"
              >
                <motion.div 
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="relative">
                    <Shield className="w-5 h-5 text-violet-500" />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-violet-500 rounded-full blur opacity-30"
                    />
                  </div>
                  <span className="font-medium">100% Verified</span>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="relative">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-2 border-blue-500 rounded-full opacity-20"
                    />
                  </div>
                  <span className="font-medium">24/7 Support</span>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex -space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                      >
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      </motion.div>
                    ))}
                  </div>
                  <span className="font-medium">4.9/5 Rating</span>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right Content - Enhanced 3D Scene */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="relative h-[600px] lg:h-[700px] hidden lg:block"
            >
              {/* Glassmorphism Frame */}
              <div className="absolute inset-0 bg-white/10 dark:bg-slate-800/10 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-slate-700/30 shadow-2xl shadow-violet-500/10 dark:shadow-violet-500/20 overflow-hidden">
                {/* Animated Border */}
                <div className="absolute inset-0 rounded-3xl">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-3xl"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent, rgba(139, 92, 246, 0.3), transparent, rgba(59, 130, 246, 0.3), transparent)',
                      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      maskComposite: 'xor',
                      padding: '2px'
                    }}
                  />
                </div>
                
                {/* 3D Scene */}
                <SplineScene className="absolute inset-0 rounded-3xl" />
                
                {/* Overlay Effects */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent rounded-3xl" />
              </div>
              
              {/* Floating Stats - User Friendly Size */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="absolute -left-6 top-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-3 border border-white/20 dark:border-slate-700/50 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-green-400 rounded-lg blur-sm opacity-20"
                    />
                  </div>
                  <div>
                    <motion.div 
                      className="text-lg font-bold text-slate-900 dark:text-white"
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      10,000+
                    </motion.div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Happy Customers</div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.4 }}
                className="absolute -right-6 bottom-32 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-3 border border-white/20 dark:border-slate-700/50 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-purple-500 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      className="absolute inset-0 bg-violet-400 rounded-lg blur-sm opacity-20"
                    />
                  </div>
                  <div>
                    <motion.div 
                      className="text-lg font-bold text-slate-900 dark:text-white"
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    >
                      1,000+
                    </motion.div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Expert Providers</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Advanced Search Section - Glassmorphism */}
      <AnimatedSection className="relative z-10 -mt-32">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-6xl mx-auto relative"
          >
            {/* Glassmorphism Container */}
            <div className="relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-slate-700/30 shadow-2xl shadow-black/5 dark:shadow-black/20 overflow-hidden">
              {/* Animated Border */}
              <div className="absolute inset-0 rounded-3xl">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-3xl opacity-50"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent, rgba(139, 92, 246, 0.2), transparent, rgba(59, 130, 246, 0.2), transparent)',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'xor',
                    padding: '1px'
                  }}
                />
              </div>
              
              <div className="relative p-8 md:p-12">
                {/* Header */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-center mb-8"
                >
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    <span className="bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 dark:from-violet-400 dark:via-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                      Find Services Near You
                    </span>
                  </h2>
                  <p className="text-lg text-slate-600 dark:text-slate-300">
                    Discover trusted professionals in your area with our intelligent search
                  </p>
                </motion.div>
                
                {/* Search Form */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4"
                >
                  {/* Service Search */}
                  <div className="md:col-span-5 relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 group-hover:border-violet-300 dark:group-hover:border-violet-600 transition-all duration-300">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5 group-hover:text-violet-500 transition-colors" />
                      <Input 
                        placeholder="What service do you need?" 
                        className="h-14 pl-12 pr-4 bg-transparent border-0 text-lg placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0" 
                      />
                    </div>
                  </div>
                  
                  {/* Location Search */}
                  <div className="md:col-span-4 relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-all duration-300">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5 group-hover:text-blue-500 transition-colors" />
                      <Select defaultValue="">
                        <SelectTrigger className="h-14 pl-12 pr-4 bg-transparent border-0 text-lg focus:ring-0 focus:ring-offset-0">
                          <SelectValue placeholder="Select your city" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                          {cities.map((city) => (
                            <SelectItem key={city} value={city.toLowerCase()} className="text-lg py-3">
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Search Button */}
                  <div className="md:col-span-3">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="h-full"
                    >
                      <Button 
                        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white border-0 rounded-2xl shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 group"
                      >
                        <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                        Search
                        <motion.div
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="ml-2"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </motion.div>
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
                
                {/* Quick Search Tags */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-700/50"
                >
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Popular searches:
                  </span>
                  {['Plumbing', 'House Cleaning', 'Electrical', 'Beauty Services', 'Tutoring'].map((tag) => (
                    <button
                      key={tag}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-gradient-to-r hover:from-violet-100 hover:to-blue-100 dark:hover:from-violet-900/30 dark:hover:to-blue-900/30 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-all duration-300 border border-transparent hover:border-violet-200 dark:hover:border-violet-700 cursor-pointer"
                      aria-label={`Search for ${tag}`}
                      suppressHydrationWarning
                    >
                      {tag}
                    </button>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Categories Section - Enhanced with Micro-interactions */}
      <AnimatedSection className="py-24 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 via-transparent to-blue-50/30 dark:from-slate-900/50 dark:via-transparent dark:to-slate-800/30" />
          
          {/* Floating Geometric Shapes */}
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1],
              x: [0, 30, 0],
              y: [0, -20, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-violet-200/30 to-blue-200/30 dark:from-violet-800/20 dark:to-blue-800/20 rounded-3xl backdrop-blur-sm"
          />
          
          <motion.div
            animate={{ 
              rotate: [360, 0],
              scale: [1.1, 1, 1.1],
              x: [0, -40, 0],
              y: [0, 15, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-32 right-16 w-24 h-24 bg-gradient-to-br from-cyan-200/30 to-emerald-200/30 dark:from-cyan-800/20 dark:to-emerald-800/20 rounded-full backdrop-blur-sm"
          />
        </div>
        
        <div className="container mx-auto px-4 relative">
          <StaggeredContainer staggerDelay={100} animation="fadeInUp">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-100 to-blue-100 dark:from-violet-900/30 dark:to-blue-900/30 rounded-full mb-6 border border-violet-200/50 dark:border-violet-700/50"
              >
                <Globe className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">Explore Our Services</span>
              </motion.div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-slate-900 via-violet-700 to-blue-700 dark:from-white dark:via-violet-300 dark:to-blue-300 bg-clip-text text-transparent">
                  Popular Categories
                </span>
              </h2>
              
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                Discover trusted professionals across{' '}
                <motion.span 
                  className="font-semibold bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400 bg-clip-text text-transparent"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  50+ service categories
                </motion.span>
                {' '}in your area
              </p>
            </motion.div>
            
            {/* Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.1,
                    type: "spring",
                    bounce: 0.4
                  }}
                  whileHover={{ 
                    y: -8, 
                    scale: 1.02,
                    transition: { duration: 0.2 } 
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link href={`/services?category=${category.name.toLowerCase()}`}>
                    <AnimatedCard className="group h-full relative overflow-hidden bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 hover:border-violet-200 dark:hover:border-violet-600/50 transition-all duration-500">
                      {/* Gradient Overlay on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-blue-500/5 to-cyan-500/5 dark:from-violet-400/10 dark:via-blue-400/10 dark:to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Animated Border */}
                      <div className="absolute inset-0 rounded-xl">
                        <motion.div
                          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                          style={{
                            background: `conic-gradient(from 0deg, transparent, rgba(139, 92, 246, 0.1), transparent)`,
                            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                            maskComposite: 'xor',
                            padding: '1px'
                          }}
                        />
                      </div>
                      
                      <AnimatedCardContent className="flex flex-col items-center justify-center p-8 relative z-10 h-full min-h-[200px]">
                        {/* Icon with Enhanced Animation */}
                        <motion.div 
                          className="relative mb-6 group-hover:scale-110 transition-transform duration-300"
                          whileHover={{ 
                            rotate: [0, -10, 10, -10, 0],
                            scale: 1.2
                          }}
                          transition={{ duration: 0.6 }}
                        >
                          <div className="text-6xl md:text-7xl relative z-10">
                            {category.icon}
                          </div>
                          
                          {/* Glow Effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-violet-400/20 to-blue-400/20 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            animate={{ scale: [1.5, 1.8, 1.5] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          />
                        </motion.div>
                        
                        {/* Content */}
                        <div className="text-center space-y-3">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-300">
                            {category.name}
                          </h3>
                          
                          <motion.div 
                            className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400"
                            whileHover={{ scale: 1.05 }}
                          >
                            <Users className="w-4 h-4" />
                            <span className="font-medium">{category.count} providers</span>
                          </motion.div>
                          
                          {/* Hover Action */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            className="opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-y-0 translate-y-2"
                          >
                            <div className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 dark:text-violet-400">
                              <span>Explore services</span>
                              <motion.div
                                animate={{ x: [0, 4, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                <ArrowRight className="w-4 h-4" />
                              </motion.div>
                            </div>
                          </motion.div>
                        </div>
                        
                        {/* Bottom Accent */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-b-xl" />
                      </AnimatedCardContent>
                    </AnimatedCard>
                  </Link>
                </motion.div>
              ))}
            </div>
            
            {/* View All Button */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-center mt-12"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  href="/services"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 group"
                >
                  <Globe className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  <span>View All Categories</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>
          </StaggeredContainer>
        </div>
      </AnimatedSection>

      {/* How It Works Section - Interactive Process Flow */}
      <AnimatedSection className="py-24 relative overflow-hidden">
        {/* Background with Parallax Effect */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-blue-50/30 to-cyan-50/50 dark:from-violet-950/30 dark:via-blue-950/20 dark:to-cyan-950/30" />
          
          {/* Animated Connection Lines */}
          <motion.div
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, delay: 1 }}
            className="absolute inset-0"
          >
            <svg className="w-full h-full" viewBox="0 0 1200 600" fill="none">
              <motion.path
                d="M200 300 Q400 200 600 300 T1000 300"
                stroke="url(#gradient)"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 4, delay: 1.5 }}
                className="opacity-30"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(139, 92, 246)" />
                  <stop offset="50%" stopColor="rgb(59, 130, 246)" />
                  <stop offset="100%" stopColor="rgb(6, 182, 212)" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <StaggeredContainer staggerDelay={200} animation="fadeInUp">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-3xl mx-auto mb-20"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full mb-6 border border-blue-200/50 dark:border-blue-700/50"
              >
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Simple Process</span>
              </motion.div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-slate-900 via-blue-700 to-cyan-700 dark:from-white dark:via-blue-300 dark:to-cyan-300 bg-clip-text text-transparent">
                  How It Works
                </span>
              </h2>
              
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                Get started with SewaBazaar in{' '}
                <motion.span 
                  className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                  four simple steps
                </motion.span>
              </p>
            </motion.div>
            
            {/* Process Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {[
                { 
                  step: 1, 
                  title: "Search Services", 
                  description: "Browse our extensive catalog or use smart search to find the perfect service for your needs", 
                  icon: Search,
                  color: "from-violet-500 to-purple-500",
                  bgColor: "from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20"
                },
                { 
                  step: 2, 
                  title: "Choose Provider", 
                  description: "Select from verified professionals based on ratings, reviews, and availability", 
                  icon: Users,
                  color: "from-blue-500 to-indigo-500",
                  bgColor: "from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20"
                },
                { 
                  step: 3, 
                  title: "Book Appointment", 
                  description: "Schedule your preferred date and time with instant confirmation and calendar sync", 
                  icon: CheckCircle,
                  color: "from-violet-500 to-blue-500",
                  bgColor: "from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20"
                },
                { 
                  step: 4, 
                  title: "Get Service", 
                  description: "Enjoy professional service delivery with real-time tracking and quality guarantee", 
                  icon: Award,
                  color: "from-amber-500 to-orange-500",
                  bgColor: "from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20"
                }
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.2,
                    type: "spring",
                    bounce: 0.4
                  }}
                  whileHover={{ 
                    y: -10, 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  className="relative group"
                >
                  {/* Connection Line (Hidden on Mobile) */}
                  {index < 3 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-slate-300 to-slate-200 dark:from-slate-600 dark:to-slate-700 z-0" />
                  )}
                  
                  {/* Step Card */}
                  <AnimatedCard className="relative h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 group-hover:border-violet-200 dark:group-hover:border-violet-600/50 transition-all duration-500 overflow-hidden">
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    
                    {/* Animated Border */}
                    <div className="absolute inset-0 rounded-xl">
                      <motion.div
                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        style={{
                          background: `conic-gradient(from 0deg, transparent, rgba(139, 92, 246, 0.1), transparent)`,
                          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                          maskComposite: 'xor',
                          padding: '1px'
                        }}
                      />
                    </div>
                    
                    <AnimatedCardContent className="relative p-8 text-center h-full flex flex-col justify-center">
                      {/* Step Number */}
                      <motion.div
                        className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-violet-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                        whileHover={{ scale: 1.1, rotate: 360 }}
                        transition={{ duration: 0.3 }}
                      >
                        {item.step}
                      </motion.div>
                      
                      {/* Icon */}
                      <motion.div 
                        className="relative mb-6 flex justify-center"
                        whileHover={{ 
                          scale: 1.1,
                          rotate: [0, -5, 5, -5, 0]
                        }}
                        transition={{ duration: 0.6 }}
                      >
                        <div className={`relative w-20 h-20 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                          <item.icon className="w-10 h-10 text-white" />
                          
                          {/* Glow Effect */}
                          <motion.div
                            className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 scale-110`}
                            animate={{ scale: [1.1, 1.3, 1.1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          />
                        </div>
                      </motion.div>
                      
                      {/* Content */}
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-300">
                          {item.title}
                        </h3>
                        
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {item.description}
                        </p>
                        
                        {/* Hover Action */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-y-0 translate-y-2"
                        >
                          <div className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 dark:text-violet-400">
                            <span>Learn more</span>
                            <motion.div
                              animate={{ x: [0, 4, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <ArrowRight className="w-4 h-4" />
                            </motion.div>
                          </div>
                        </motion.div>
                      </div>
                    </AnimatedCardContent>
                  </AnimatedCard>
                </motion.div>
              ))}
            </div>
            
            {/* Call to Action */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="text-center mt-16"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  href="/how-it-works"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 group"
                >
                  <Clock className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  <span>Learn More About Our Process</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>
          </StaggeredContainer>
        </div>
      </AnimatedSection>

      {/* Enhanced Testimonials Section - Social Proof */}
      <AnimatedSection className="py-24 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50/30 via-transparent to-blue-50/30 dark:from-violet-950/20 dark:via-transparent dark:to-blue-950/20" />
          
          {/* Floating Testimonial Bubbles */}
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-16 left-10 w-24 h-24 bg-violet-200/20 dark:bg-violet-800/20 rounded-full backdrop-blur-sm"
          />
          
          <motion.div
            animate={{ 
              y: [0, 15, 0],
              rotate: [0, -3, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-20 right-16 w-32 h-32 bg-blue-200/20 dark:bg-blue-800/20 rounded-3xl backdrop-blur-sm"
          />
        </div>
        
        <div className="container mx-auto px-4 relative">
          <StaggeredContainer staggerDelay={200} animation="fadeInUp">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-3xl mx-auto mb-20"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-100 to-blue-100 dark:from-violet-900/30 dark:to-blue-900/30 rounded-full mb-6 border border-violet-200/50 dark:border-violet-700/50"
              >
                <Heart className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">Customer Stories</span>
              </motion.div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-slate-900 via-violet-700 to-blue-700 dark:from-white dark:via-violet-300 dark:to-blue-300 bg-clip-text text-transparent">
                  What Our Users Say
                </span>
              </h2>
              
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                Join{' '}
                <motion.span 
                  className="font-semibold bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400 bg-clip-text text-transparent"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                  thousands of satisfied customers
                </motion.span>
                {' '}who trust SewaBazaar for their service needs
              </p>
            </motion.div>
            
            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.2,
                    type: "spring",
                    bounce: 0.4
                  }}
                  whileHover={{ 
                    y: -10, 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  className="group"
                >
                  <AnimatedCard className="h-full relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 group-hover:border-violet-200 dark:group-hover:border-violet-600/50 transition-all duration-500">
                    {/* Quote Background */}
                    <div className="absolute top-6 right-6 text-6xl text-violet-100 dark:text-violet-900/30 font-serif">&quot;
                    </div>
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-blue-500/5 to-cyan-500/5 dark:from-violet-400/10 dark:via-blue-400/10 dark:to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Animated Border */}
                    <div className="absolute inset-0 rounded-xl">
                      <motion.div
                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                        style={{
                          background: `conic-gradient(from 0deg, transparent, rgba(139, 92, 246, 0.1), transparent)`,
                          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                          maskComposite: 'xor',
                          padding: '1px'
                        }}
                      />
                    </div>
                    
                    <AnimatedCardContent className="relative p-8 h-full flex flex-col">
                      {/* User Info */}
                      <div className="flex items-center mb-6">
                        <motion.div 
                          className="relative w-16 h-16 rounded-full overflow-hidden mr-4 group-hover:scale-110 transition-transform duration-300"
                          whileHover={{ scale: 1.1 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-blue-500 rounded-full" />
                          <div className="absolute inset-1 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-2xl font-bold text-violet-600 dark:text-violet-400">
                            {testimonial.name.charAt(0)}
                          </div>
                          
                          {/* Glow Effect */}
                          <motion.div
                            className="absolute inset-0 bg-violet-400 rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-500 scale-110"
                            animate={{ scale: [1.1, 1.3, 1.1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          />
                        </motion.div>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-300">
                            {testimonial.name}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                            {testimonial.role}
                          </p>
                          
                          {/* Verification Badge */}
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: index * 0.1 + 0.5 }}
                            className="inline-flex items-center gap-1 mt-1 px-2 py-1 bg-violet-100 dark:bg-violet-900/30 rounded-full"
                          >
                            <CheckCircle className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                            <span className="text-xs font-medium text-violet-700 dark:text-violet-300">Verified Customer</span>
                          </motion.div>
                        </div>
                      </div>
                      
                      {/* Testimonial Content */}
                      <div className="flex-1 mb-6">
                        <motion.p 
                          className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg italic"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.6, delay: index * 0.2 + 0.4 }}
                        >
                          &quot;{testimonial.content}&quot;
                        </motion.p>
                      </div>
                      
                      {/* Rating */}
                      <motion.div 
                        className="flex items-center justify-between"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 + 0.6 }}
                      >
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ 
                                duration: 0.3, 
                                delay: index * 0.1 + i * 0.05 + 0.8,
                                type: "spring",
                                bounce: 0.6
                              }}
                            >
                              <Star
                                className={`w-5 h-5 transition-colors duration-200 ${
                                  i < testimonial.rating
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-slate-300 dark:text-slate-600"
                                }`}
                              />
                            </motion.div>
                          ))}
                        </div>
                        
                        {/* Service Category */}
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full"
                        >
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            {index === 0 ? 'Plumbing' : index === 1 ? 'Cleaning' : 'Business'}
                          </span>
                        </motion.div>
                      </motion.div>
                    </AnimatedCardContent>
                  </AnimatedCard>
                </motion.div>
              ))}
            </div>
            
            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-wrap items-center justify-center gap-8 mt-16 pt-12 border-t border-slate-200/50 dark:border-slate-700/50"
            >
              {[
                { icon: Shield, label: "100% Secure", value: "SSL Protected" },
                { icon: Clock, label: "24/7 Support", value: "Always Available" },
                { icon: Award, label: "Top Rated", value: "4.9/5 Stars" },
                { icon: Users, label: "Trusted by", value: "10,000+ Users" }
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 1 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="flex items-center gap-3 px-4 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/30 hover:border-violet-200 dark:hover:border-violet-600/50 transition-all duration-300 group"
                >
                  <div className="relative">
                    <item.icon className="w-6 h-6 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform" />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                      className="absolute inset-0 bg-violet-400 rounded-full blur opacity-0 group-hover:opacity-20 transition-opacity"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{item.value}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">{item.label}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </StaggeredContainer>
        </div>
      </AnimatedSection>
    </main>
  )
}
