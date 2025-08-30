/**
 * About Page - Redesigned
 * Enhanced storytelling with hero section, animated cards, and team showcase
 * Features modern design with scroll animations and interactive elements
 */

import { Button } from "@/components/ui/button"
import { AnimatedCard, AnimatedCardContent } from "@/components/ui/animated-card"
import { AnimatedSection } from "@/components/ui/animated-section"
import { InteractiveIcon, StaggeredContainer } from "@/components/ui/animation-components"
import { Users, Target, Heart, Award, MapPin, Phone, Mail, Sparkles, TrendingUp, Shield, Clock, Search, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function AboutPage() {
  const values = [
    {
      icon: Users,
      title: "Community First",
      description: "We believe in building strong communities by connecting skilled professionals with those who need their services.",
      detail: "Our platform has connected over 10,000 customers with local service providers, strengthening neighborhoods across Nepal.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Target,
      title: "Quality Service",
      description: "We maintain high standards through rigorous vetting and continuous monitoring of service quality.",
      detail: "Every provider undergoes a comprehensive verification process including background checks and skill assessments.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Heart,
      title: "Customer Care",
      description: "Your satisfaction is our priority. We're here to support you at every step of your service journey.",
      detail: "Our dedicated support team is available 24/7 to ensure your experience is seamless and satisfactory.",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: Award,
      title: "Trust & Reliability",
      description: "We ensure all our service providers are verified and trustworthy professionals in their fields.",
      detail: "With a 4.8-star average rating and 99% completion rate, trust is at the heart of everything we do.",
      color: "from-purple-500 to-violet-500"
    },
  ]

  const stats = [
    { number: "10,000+", label: "Happy Customers", icon: "😊", growth: "+25%" },
    { number: "1,000+", label: "Service Providers", icon: "🔧", growth: "+40%" },
    { number: "50+", label: "Service Categories", icon: "📋", growth: "+15%" },
    { number: "4.8/5", label: "Average Rating", icon: "⭐", growth: "+0.3" },
  ]

  const timeline = [
    {
      year: "2024",
      title: "The Beginning",
      description: "SewaBazaar was founded with a vision to revolutionize local services in Nepal."
    },
    {
      year: "Early 2024",
      title: "First Launch",
      description: "Launched in Kathmandu with 50 service providers across 10 categories."
    },
    {
      year: "Mid 2024",
      title: "Rapid Growth",
      description: "Expanded to 3 major cities with over 500 service providers."
    },
    {
      year: "Present",
      title: "Market Leader",
      description: "Now serving 1000+ providers across 50+ categories nationwide."
    },
  ]

  const team = [
    {
      name: "The Visionaries",
      role: "Founding Team",
      description: "A passionate group of entrepreneurs dedicated to transforming local services.",
      image: "/team-placeholder.jpg"
    },
    {
      name: "The Builders",
      role: "Engineering Team", 
      description: "Expert developers creating seamless experiences for users and providers.",
      image: "/team-placeholder.jpg"
    },
    {
      name: "The Connectors",
      role: "Community Team",
      description: "Relationship builders ensuring quality partnerships and customer satisfaction.",
      image: "/team-placeholder.jpg"
    },
  ]

  return (
    <div className="min-h-screen bg-pearlWhite dark:bg-black overflow-hidden">
      {/* Hero Section */}
      <AnimatedSection className="relative py-20 lg:py-32">
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 dark:from-primary/10 dark:via-accent/10 dark:to-secondary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-purple-100 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20" />
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-indigo-400 text-sm font-medium animate-bounce-in">
                  <Sparkles className="w-4 h-4" />
                  Nepal's #1 Service Marketplace
                </div>
                
                <div>
                  <h1 className="text-5xl lg:text-7xl font-bold mb-6 dark:text-white leading-tight">
                    About{' '}
                    <span className="bg-gradient-to-r from-[#8E54E9] to-[#4776E6] dark:from-[#9D5CFF] dark:to-[#3B82F6] bg-clip-text text-transparent">
                      SewaBazaar
                    </span>
                  </h1>
                  
                  <p className="text-xl lg:text-2xl text-gray-600 dark:text-indigo-200/70 mb-8 leading-relaxed">
                    We're{' '}
                    <span className="font-semibold text-primary dark:text-indigo-400">revolutionizing</span>{' '}
                    how Nepal connects with local services, making quality and trust accessible to everyone.
                  </p>
                </div>
                
                {/* Mission highlight */}
                <div className="p-6 rounded-2xl bg-white/70 dark:bg-black/30 backdrop-blur-sm border border-white/20 dark:border-indigo-900/30">
                  <h3 className="text-lg font-semibold mb-2 dark:text-white">Our Mission</h3>
                  <p className="text-gray-600 dark:text-indigo-200/70">
                    To bridge the gap between skilled professionals and customers, creating opportunities 
                    while ensuring quality service delivery across Nepal.
                  </p>
                </div>
              </div>
              
              {/* Hero Image/Stats */}
              <div className="relative">
                <AnimatedCard className="p-8" hoverEffect="lift">
                  <AnimatedCardContent>
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold mb-4 dark:text-white">Impact by Numbers</h3>
                      <p className="text-gray-600 dark:text-indigo-200/70">Growing together since 2024</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      {stats.map((stat, index) => (
                        <AnimatedSection key={index} delay={index * 100} animation="scaleIn">
                          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 hover-lift">
                            <div className="text-2xl mb-2">{stat.icon}</div>
                            <div className="text-2xl font-bold text-primary dark:text-indigo-400 mb-1">
                              {stat.number}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-indigo-200/60 mb-1">
                              {stat.label}
                            </div>
                            <div className="flex items-center justify-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <TrendingUp className="w-3 h-3" />
                              {stat.growth}
                            </div>
                          </div>
                        </AnimatedSection>
                      ))}
                    </div>
                  </AnimatedCardContent>
                </AnimatedCard>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Story & Vision Section */}
      <AnimatedSection className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="relative">
                <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary/30 dark:to-accent/30" />
                  <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20 dark:opacity-30">
                    🏗️
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/50 backdrop-blur-sm rounded-xl text-white">
                    <p className="text-sm">Building Nepal's service ecosystem</p>
                  </div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full opacity-20 animate-pulse" />
                <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full opacity-20 animate-pulse" style={{animationDelay: '1s'}} />
              </div>
              
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl lg:text-5xl font-bold mb-6 dark:text-white">
                    Our{' '}
                    <span className="gradient-text">Story</span>
                  </h2>
                  
                  <div className="space-y-6 text-lg text-gray-600 dark:text-indigo-200/70 leading-relaxed">
                    <p>
                      Founded in 2024, SewaBazaar was born from a simple observation: finding reliable service providers 
                      in Nepal was a challenge that affected both customers and skilled professionals.
                    </p>
                    
                    <p>
                      We set out to solve this problem by creating a platform that makes it 
                      easy to{' '}
                      <span className="font-semibold text-primary dark:text-indigo-400">find, book, and manage</span>{' '}
                      local services while ensuring quality and reliability.
                    </p>
                    
                    <p>
                      Today, we're proud to be the bridge between thousands of skilled professionals and customers, 
                      making service booking as easy as a few clicks while maintaining the highest standards.
                    </p>
                  </div>
                </div>
                
                {/* Key achievements */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-green-800 dark:text-green-300 text-sm">Verified Network</span>
                    </div>
                    <p className="text-green-700 dark:text-green-400 text-sm">100% verified providers</p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-semibold text-blue-800 dark:text-blue-300 text-sm">Always Available</span>
                    </div>
                    <p className="text-blue-700 dark:text-blue-400 text-sm">24/7 booking system</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Values Section */}
      <AnimatedSection className="py-20 lg:py-32 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 dark:from-black dark:via-purple-950/10 dark:to-blue-950/10">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 dark:text-white">
                Our{' '}
                <span className="gradient-text">Values</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-indigo-200/70 max-w-2xl mx-auto">
                The principles that guide everything we do and shape our commitment to excellence
              </p>
            </div>

            <StaggeredContainer staggerDelay={150} animation="fadeInUp">
              <div className="grid lg:grid-cols-2 gap-8">
                {values.map((value, index) => (
                  <AnimatedCard key={index} className="group relative overflow-hidden" hoverEffect="lift" delay={index * 150}>
                    {/* Background gradient on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${value.color} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-500`} />
                    
                    <AnimatedCardContent className="relative p-8">
                      <div className="flex items-start gap-6">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <value.icon className="w-8 h-8 text-white" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold mb-4 dark:text-white group-hover:text-primary dark:group-hover:text-indigo-400 transition-colors duration-300">
                            {value.title}
                          </h3>
                          
                          <p className="text-gray-600 dark:text-indigo-200/70 mb-4 leading-relaxed">
                            {value.description}
                          </p>
                          
                          {/* Detail on hover */}
                          <div className="overflow-hidden">
                            <div className="transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-100">
                              <div className="p-4 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20">
                                <p className="text-sm text-gray-700 dark:text-indigo-200/80">
                                  {value.detail}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AnimatedCardContent>
                  </AnimatedCard>
                ))}
              </div>
            </StaggeredContainer>
          </div>
        </div>
      </AnimatedSection>

      {/* Timeline Section */}
      <AnimatedSection className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 dark:text-white">
                Our{' '}
                <span className="gradient-text">Journey</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-indigo-200/70">
                From a simple idea to Nepal's leading service marketplace
              </p>
            </div>
            
            <div className="space-y-8">
              {timeline.map((milestone, index) => (
                <AnimatedSection key={index} delay={index * 200} animation="fadeInLeft">
                  <div className="relative">
                    {/* Timeline line */}
                    {index < timeline.length - 1 && (
                      <div className="absolute left-8 top-16 w-px h-16 bg-gradient-to-b from-primary to-transparent dark:from-indigo-400" />
                    )}
                    
                    <div className="flex items-start gap-6">
                      {/* Year badge */}
                      <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {milestone.year.slice(-2)}
                      </div>
                      
                      {/* Content */}
                      <AnimatedCard className="flex-1 group" hoverEffect="lift">
                        <AnimatedCardContent className="p-6">
                          <h3 className="text-xl font-bold mb-2 dark:text-white group-hover:text-primary dark:group-hover:text-indigo-400 transition-colors duration-300">
                            {milestone.title}
                          </h3>
                          <p className="text-gray-600 dark:text-indigo-200/70">
                            {milestone.description}
                          </p>
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

      {/* Team Section */}
      <AnimatedSection className="py-20 lg:py-32 bg-pearlWhite dark:bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 dark:text-white">
                Meet Our{' '}
                <span className="gradient-text">Team</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-indigo-200/70 max-w-2xl mx-auto">
                The passionate people behind SewaBazaar's success
              </p>
            </div>

            <StaggeredContainer staggerDelay={200} animation="scaleIn">
              <div className="grid lg:grid-cols-3 gap-8">
                {team.map((member, index) => {
                  const borderColors = [
                    'border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700',
                    'border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700',
                    'border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700'
                  ];
                  
                  const gradientColors = [
                    'from-blue-500 to-cyan-500',
                    'from-purple-500 to-violet-500', 
                    'from-green-500 to-emerald-500'
                  ];
                  
                  const bgAccents = [
                    'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
                    'from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20',
                    'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20'
                  ];
                  
                  return (
                    <AnimatedCard 
                      key={index} 
                      className={`group text-center relative overflow-hidden border-2 ${borderColors[index % 3]} transition-all duration-300`} 
                      hoverEffect="lift" 
                      delay={index * 200}
                    >
                      {/* Enhanced background with subtle gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${bgAccents[index % 3]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                      
                      {/* Decorative corner accent */}
                      <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${gradientColors[index % 3]} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} 
                           style={{
                             clipPath: 'polygon(100% 0%, 0% 0%, 100% 100%)'
                           }} />
                      
                      <AnimatedCardContent className="relative p-8">
                        {/* Enhanced team image placeholder */}
                        <div className="relative w-28 h-28 mx-auto mb-6">
                          {/* Glow effect behind avatar */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors[index % 3]} rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300 scale-110`} />
                          
                          <div className={`relative w-full h-full rounded-full bg-gradient-to-br ${gradientColors[index % 3]} flex items-center justify-center text-white text-2xl font-bold shadow-xl group-hover:scale-110 transition-transform duration-300 border-4 border-white dark:border-gray-800`}>
                            {member.name.split(' ')[1]?.[0] || '👥'}
                          </div>
                          
                          {/* Enhanced online indicator */}
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-3 border-white dark:border-gray-800 flex items-center justify-center shadow-lg">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-bold mb-3 dark:text-white group-hover:text-primary dark:group-hover:text-indigo-400 transition-colors duration-300">
                          {member.name}
                        </h3>
                        
                        {/* Enhanced role badge */}
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${gradientColors[index % 3]} text-white text-sm font-medium mb-4 shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                          {member.role}
                        </div>
                        
                        <p className="text-gray-600 dark:text-indigo-200/70 leading-relaxed mb-6">
                          {member.description}
                        </p>
                        
                        {/* Enhanced social links with colored backgrounds */}
                        <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors duration-200 cursor-pointer group/icon">
                            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover/icon:scale-110 transition-transform duration-200" />
                          </div>
                          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors duration-200 cursor-pointer group/icon">
                            <Phone className="w-5 h-5 text-green-600 dark:text-green-400 group-hover/icon:scale-110 transition-transform duration-200" />
                          </div>
                        </div>
                      </AnimatedCardContent>
                      
                      {/* Bottom accent line */}
                      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientColors[index % 3]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    </AnimatedCard>
                  );
                })}
              </div>
            </StaggeredContainer>
          </div>
        </div>
      </AnimatedSection>
    </div>
  )
} 