/**
 * How It Works Page - Redesigned
 * Modern, animated page showcasing SewaBazaar's process
 * Features scroll animations, interactive steps, and enhanced visual hierarchy
 */
"use client"

import { Button } from "@/components/ui/button"
import { AnimatedCard, AnimatedCardContent } from "@/components/ui/animated-card"
import { AnimatedSection } from "@/components/ui/animated-section"
import { InteractiveIcon, StaggeredContainer } from "@/components/ui/animation-components"
import { Search, Calendar, Star, UserCheck, Shield, CheckCircle, Clock, ArrowRight, Sparkles, Heart } from "lucide-react"
import Link from "next/link"

export default function HowItWorksPage() {
  const steps = [
    {
      icon: Search,
      title: "Search for Services",
      description: "Browse through our extensive catalog of services or use our smart search to find exactly what you need.",
      detail: "Our intelligent search algorithm helps you discover the perfect service provider based on your location, preferences, and requirements.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Calendar,
      title: "Book an Appointment",
      description: "Choose your preferred date and time slot that works best for you. Our real-time booking system ensures instant confirmation.",
      detail: "Real-time availability checking with instant booking confirmation and automated calendar integration.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: UserCheck,
      title: "Get Service Delivered",
      description: "Our verified service provider will arrive at your location on time and deliver quality service as per your requirements.",
      detail: "Track your provider's arrival with live updates and GPS tracking for complete peace of mind.",
      color: "from-purple-500 to-violet-500"
    },
    {
      icon: Star,
      title: "Rate and Review",
      description: "Share your experience by rating the service and providing feedback to help other users make informed decisions.",
      detail: "Your reviews help maintain our quality standards and assist other customers in making informed choices.",
      color: "from-orange-500 to-red-500"
    },
  ]

  const features = [
    {
      icon: Shield,
      title: "Verified Providers",
      description: "All our service providers undergo thorough background checks and verification process.",
      badge: "100% Verified"
    },
    {
      icon: Star,
      title: "Quality Assurance",
      description: "We maintain high service standards through regular quality checks and customer feedback.",
      badge: "4.8+ Rating"
    },
    {
      icon: Clock,
      title: "Flexible Scheduling",
      description: "Book services at your convenience with our 24/7 booking system.",
      badge: "24/7 Available"
    },
  ]

  const stats = [
    { number: "10,000+", label: "Happy Customers", icon: "👥" },
    { number: "1,000+", label: "Service Providers", icon: "🔧" },
    { number: "50+", label: "Service Categories", icon: "📋" },
    { number: "4.8/5", label: "Average Rating", icon: "⭐" },
  ]

  return (
    <div className="min-h-screen bg-pearlWhite dark:bg-black overflow-hidden">
      {/* Hero Section */}
      <AnimatedSection className="relative py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 dark:from-primary/10 dark:via-accent/10 dark:to-secondary/10" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-indigo-400 text-sm font-medium mb-6 animate-bounce-in">
              <Sparkles className="w-4 h-4" />
              Simple & Effective Process
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 dark:text-white">
              How It{' '}
              <span className="bg-gradient-to-r from-[#8E54E9] to-[#4776E6] dark:from-[#9D5CFF] dark:to-[#3B82F6] bg-clip-text text-transparent">
                Works
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-indigo-200/70 mb-8 max-w-3xl mx-auto leading-relaxed">
              Get the services you need in{' '}
              <span className="font-semibold text-primary dark:text-indigo-400">four simple steps</span>.
              From discovery to delivery, we make it seamless.
            </p>

            {/* Stats Section */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
              {stats.map((stat, index) => (
                <AnimatedSection key={index} delay={index * 100} animation="scaleIn">
                  <div className="text-center p-4 rounded-2xl bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-indigo-900/30 hover-lift">
                    <div className="text-2xl mb-2">{stat.icon}</div>
                    <div className="text-2xl lg:text-3xl font-bold text-primary dark:text-indigo-400 mb-1">
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-indigo-200/60">
                      {stat.label}
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Steps Section */}
      <AnimatedSection className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 dark:text-white">
                Your Journey to{' '}
                <span className="gradient-text">Perfect Service</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-indigo-200/70 max-w-2xl mx-auto">
                Follow these simple steps to connect with trusted service providers
              </p>
            </div>

            <div className="space-y-20">
              {steps.map((step, index) => (
                <AnimatedSection key={index} delay={index * 200} animation="fadeInUp">
                  <div className={`flex flex-col lg:flex-row items-center gap-12 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                    {/* Step Number & Icon */}
                    <div className="flex-shrink-0 relative">
                      <div className="relative">
                        {/* Background glow */}
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${step.color} opacity-20 blur-xl scale-150`} />
                        
                        {/* Main circle */}
                        <div className={`relative w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300`}>
                          <step.icon className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
                        </div>
                        
                        {/* Step number */}
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-[#8E54E9] to-[#4776E6] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          {index + 1}
                        </div>
                      </div>
                      
                      {/* Connecting line (except for last step) */}
                      {index < steps.length - 1 && (
                        <div className="hidden lg:block absolute top-full left-1/2 transform -translate-x-1/2 w-px h-20 bg-gradient-to-b from-gray-300 to-transparent dark:from-indigo-800" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-center lg:text-left">
                      <AnimatedCard className="p-8 lg:p-10" hoverEffect="lift" delay={index * 100}>
                        <AnimatedCardContent padding="sm">
                          <h3 className="text-2xl lg:text-3xl font-bold mb-4 dark:text-white">
                            {step.title}
                          </h3>
                          
                          <p className="text-lg text-gray-600 dark:text-indigo-200/70 mb-6 leading-relaxed">
                            {step.description}
                          </p>
                          
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20">
                            <CheckCircle className="w-5 h-5 text-primary dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700 dark:text-indigo-200/80">
                              {step.detail}
                            </p>
                          </div>
                        </AnimatedCardContent>
                      </AnimatedCard>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Why Choose Us Section */}
      <AnimatedSection className="py-20 lg:py-32 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-black dark:via-indigo-950/20 dark:to-purple-950/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 dark:text-white">
                Why Choose{' '}
                <span className="gradient-text">SewaBazaar</span>?
              </h2>
              <p className="text-xl text-gray-600 dark:text-indigo-200/70 max-w-2xl mx-auto">
                Experience the difference with our commitment to quality and customer satisfaction
              </p>
            </div>

            <StaggeredContainer staggerDelay={150} animation="scaleIn">
              <div className="grid lg:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <AnimatedCard 
                    key={index} 
                    className="relative overflow-hidden group" 
                    hoverEffect="lift"
                    delay={index * 150}
                  >
                    {/* Background pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <AnimatedCardContent className="relative text-center p-8">
                      {/* Badge */}
                      <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold rounded-full">
                        {feature.badge}
                      </div>
                      
                      {/* Icon */}
                      <InteractiveIcon 
                        size="xl" 
                        variant="primary" 
                        hoverEffect="bounce"
                        className="mx-auto mb-6"
                      >
                        <feature.icon className="w-full h-full" />
                      </InteractiveIcon>
                      
                      <h3 className="text-2xl font-bold mb-4 dark:text-white group-hover:text-primary dark:group-hover:text-indigo-400 transition-colors duration-300">
                        {feature.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-indigo-200/70 leading-relaxed">
                        {feature.description}
                      </p>
                      
                      {/* Hover indicator */}
                      <div className="mt-6 flex items-center justify-center gap-2 text-primary dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-sm font-medium">Learn more</span>
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </AnimatedCardContent>
                  </AnimatedCard>
                ))}
              </div>
            </StaggeredContainer>
          </div>
        </div>
      </AnimatedSection>
    </div>
  )
} 