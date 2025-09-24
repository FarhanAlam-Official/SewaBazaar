/**
 * Contact Page - Redesigned
 * Modern contact page with floating label forms, animated social links, and enhanced UX
 * Features form validation, interactive elements, and responsive design
 */

'use client';

import { Button } from "@/components/ui/button"
import { AnimatedCard, AnimatedCardContent } from "@/components/ui/animated-card"
import { AnimatedSection } from "@/components/ui/animated-section"
import { FloatingLabelInput, FloatingLabelTextarea } from "@/components/ui/floating-label-input"
import { InteractiveIcon, StaggeredContainer } from "@/components/ui/animation-components"
import { Mail, Phone, MapPin, Clock, Send, Sparkles, MessageCircle, Users, Headphones, Globe } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { contactService } from "@/services/contactService"
import { showToast } from "@/components/ui/enhanced-toast"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const contactMethods = [
    {
      icon: Phone,
      title: "Phone",
      description: "Call us for immediate assistance",
      primary: "+977-1-4XXXXXX",
      secondary: "+977-9XXXXXXXXX", 
      available: "Mon-Fri 9AM-6PM",
      color: "from-green-500 to-emerald-500",
      action: "Call Now"
    },
    {
      icon: Mail,
      title: "Email",
      description: "Send us a detailed message",
      primary: "info@sewabazaar.com",
      secondary: "support@sewabazaar.com",
      available: "24/7 Response",
      color: "from-blue-500 to-cyan-500",
      action: "Send Email"
    },
    {
      icon: MapPin,
      title: "Location",
      description: "Visit our office in person",
      primary: "New Baneshwor",
      secondary: "Kathmandu, Nepal",
      available: "Mon-Fri 9AM-5PM",
      color: "from-purple-500 to-violet-500",
      action: "Get Directions"
    },
  ]

  const quickLinks = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team",
      color: "from-orange-500 to-red-500",
      available: true
    },
    {
      icon: Users,
      title: "Community",
      description: "Join our community forum",
      color: "from-pink-500 to-rose-500",
      available: true
    },
    {
      icon: Headphones,
      title: "Support Center",
      description: "Browse our help articles",
      color: "from-indigo-500 to-purple-500",
      available: true
    },
  ]

  const socialLinks = [
    { name: "Facebook", icon: "📘", color: "hover:text-blue-600" },
    { name: "Twitter", icon: "🐦", color: "hover:text-sky-500" },
    { name: "Instagram", icon: "📷", color: "hover:text-pink-600" },
    { name: "LinkedIn", icon: "💼", color: "hover:text-blue-700" },
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Send message using the contact service
      const result = await contactService.sendSimpleMessage(formData);
      
      // Reset form
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Show success toast
      showToast.success({
        title: 'Message Sent Successfully!',
        description: result.message || 'We\'ll get back to you soon.',
        duration: 5000
      })
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Handle validation errors
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.name || errorData.email || errorData.subject || errorData.message) {
          setErrors({
            name: errorData.name?.[0] || '',
            email: errorData.email?.[0] || '',
            subject: errorData.subject?.[0] || '',
            message: errorData.message?.[0] || '',
          });
          
          showToast.error({
            title: 'Validation Error',
            description: 'Please check the form fields and try again.',
            duration: 4000
          })
        } else {
          showToast.error({
            title: 'Failed to Send Message',
            description: errorData.detail || 'Please try again.',
            duration: 4000
          })
        }
      } else {
        showToast.error({
          title: 'Connection Error',
          description: 'Please check your connection and try again.',
          duration: 4000
        })
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-pearlWhite dark:bg-black overflow-hidden">
      {/* Hero Section */}
      <AnimatedSection className="relative py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 dark:from-primary/10 dark:via-accent/10 dark:to-secondary/10" />
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-indigo-400 text-sm font-medium mb-6 animate-bounce-in">
              <Sparkles className="w-4 h-4" />
              We're Here to Help
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 dark:text-white">
              Contact{' '}
              <span className="bg-gradient-to-r from-[#8E54E9] to-[#4776E6] dark:from-[#9D5CFF] dark:to-[#3B82F6] bg-clip-text text-transparent">
                Us
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-indigo-200/70 mb-8 max-w-3xl mx-auto leading-relaxed">
              Have questions? We'd love to hear from you.{' '}
              <span className="font-semibold text-primary dark:text-indigo-400">Send us a message</span>{' '}
              and we'll respond as soon as possible.
            </p>

            {/* Quick stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
              <AnimatedSection delay={100} animation="scaleIn">
                <div className="text-center p-4 rounded-2xl bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-indigo-900/30 hover-lift">
                  <div className="text-2xl mb-2">🕰️</div>
                  <div className="text-lg font-bold text-primary dark:text-indigo-400 mb-1">&lt; 1hr</div>
                  <div className="text-sm text-gray-600 dark:text-indigo-200/60">Response Time</div>
                </div>
              </AnimatedSection>
              
              <AnimatedSection delay={200} animation="scaleIn">
                <div className="text-center p-4 rounded-2xl bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-indigo-900/30 hover-lift">
                  <div className="text-2xl mb-2">📞</div>
                  <div className="text-lg font-bold text-primary dark:text-indigo-400 mb-1">24/7</div>
                  <div className="text-sm text-gray-600 dark:text-indigo-200/60">Support Available</div>
                </div>
              </AnimatedSection>
              
              <AnimatedSection delay={300} animation="scaleIn">
                <div className="text-center p-4 rounded-2xl bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-indigo-900/30 hover-lift">
                  <div className="text-2xl mb-2">🚀</div>
                  <div className="text-lg font-bold text-primary dark:text-indigo-400 mb-1">98%</div>
                  <div className="text-sm text-gray-600 dark:text-indigo-200/60">Satisfaction Rate</div>
                </div>
              </AnimatedSection>
              
              <AnimatedSection delay={400} animation="scaleIn">
                <div className="text-center p-4 rounded-2xl bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-indigo-900/30 hover-lift">
                  <div className="text-2xl mb-2">🌐</div>
                  <div className="text-lg font-bold text-primary dark:text-indigo-400 mb-1">5</div>
                  <div className="text-sm text-gray-600 dark:text-indigo-200/60">Languages</div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Contact Methods Section */}
      <AnimatedSection className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 dark:text-white">
                Get in{' '}
                <span className="gradient-text">Touch</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-indigo-200/70 max-w-2xl mx-auto">
                Choose your preferred way to reach us. We're always ready to help.
              </p>
            </div>

            <StaggeredContainer staggerDelay={150} animation="fadeInUp">
              <div className="grid lg:grid-cols-3 gap-8 mb-16">
                {contactMethods.map((method, index) => (
                  <AnimatedCard key={index} className="group relative overflow-hidden" hoverEffect="lift" delay={index * 150}>
                    {/* Background gradient on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${method.color} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-500`} />
                    
                    <AnimatedCardContent className="relative text-center p-8">
                      {/* Icon */}
                      <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${method.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <method.icon className="w-8 h-8 text-white" />
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-2 dark:text-white group-hover:text-primary dark:group-hover:text-indigo-400 transition-colors duration-300">
                        {method.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-indigo-200/70 mb-4">
                        {method.description}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <p className="font-semibold text-gray-800 dark:text-white">{method.primary}</p>
                        <p className="text-gray-600 dark:text-indigo-200/70">{method.secondary}</p>
                      </div>
                      
                      <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400 mb-6">
                        <Clock className="w-4 h-4" />
                        <span>{method.available}</span>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="w-full group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300"
                      >
                        {method.action}
                      </Button>
                    </AnimatedCardContent>
                  </AnimatedCard>
                ))}
              </div>
            </StaggeredContainer>

            {/* Quick Links */}
            <div className="grid lg:grid-cols-3 gap-6">
              {quickLinks.map((link, index) => (
                <AnimatedSection key={index} delay={index * 100} animation="fadeInUp">
                  <div className="group p-6 rounded-xl bg-white/70 dark:bg-black/30 backdrop-blur-sm border border-white/20 dark:border-indigo-900/30 hover-lift cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <link.icon className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1 dark:text-white group-hover:text-primary dark:group-hover:text-indigo-400 transition-colors duration-300">
                          {link.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-indigo-200/70">
                          {link.description}
                        </p>
                      </div>
                      
                      {link.available && (
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      )}
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Contact Form Section */}
      <AnimatedSection className="py-20 lg:py-32 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-black dark:via-indigo-950/20 dark:to-purple-950/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 dark:text-white">
                Send us a{' '}
                <span className="gradient-text">Message</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-indigo-200/70">
                Fill out the form below and we'll get back to you shortly
              </p>
            </div>

            <AnimatedCard className="relative overflow-hidden" hoverEffect="lift">
              {/* Background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50 dark:from-[#111827] dark:via-[#131A2B] dark:to-[#151C2E]" />
              
              <AnimatedCardContent className="relative p-8 lg:p-12">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid lg:grid-cols-2 gap-8">
                    <AnimatedSection delay={100} animation="fadeInLeft">
                      <FloatingLabelInput
                        label="Full Name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        error={errors.name}
                        className="text-lg"
                        disabled={isSubmitting}
                      />
                    </AnimatedSection>
                    
                    <AnimatedSection delay={200} animation="fadeInRight">
                      <FloatingLabelInput
                        type="email"
                        label="Email Address"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        error={errors.email}
                        className="text-lg"
                        disabled={isSubmitting}
                      />
                    </AnimatedSection>
                  </div>
                  
                  <AnimatedSection delay={300} animation="fadeInUp">
                    <FloatingLabelInput
                      label="Subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      error={errors.subject}
                      className="text-lg"
                      disabled={isSubmitting}
                      helperText="Brief description of your inquiry"
                    />
                  </AnimatedSection>
                  
                  <AnimatedSection delay={400} animation="fadeInUp">
                    <FloatingLabelTextarea
                      label="Your Message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      error={errors.message}
                      className="min-h-[150px] text-lg resize-none"
                      disabled={isSubmitting}
                      helperText="Please provide as much detail as possible"
                    />
                  </AnimatedSection>
                  
                  <AnimatedSection delay={500} animation="fadeInUp">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button 
                        type="submit" 
                        size="lg"
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-[#8E54E9] to-[#4776E6] dark:from-[#2D1B69] dark:via-[#2B2483] dark:to-[#1E3377] hover:opacity-90 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            Send Message
                            <Send className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline"
                        size="lg"
                        disabled={isSubmitting}
                        className="px-8 py-4 text-lg font-semibold"
                        onClick={() => {
                          setFormData({ name: '', email: '', subject: '', message: '' });
                          setErrors({});
                        }}
                      >
                        Clear Form
                      </Button>
                    </div>
                  </AnimatedSection>
                </form>
                
                {/* Form features */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-indigo-900/30">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-indigo-200/70">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Secure & Encrypted</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-indigo-200/70">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>Quick Response</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-indigo-200/70">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      <span>No Spam Guarantee</span>
                    </div>
                  </div>
                </div>
              </AnimatedCardContent>
            </AnimatedCard>
          </div>
        </div>
      </AnimatedSection>
      {/* Map & Social Section */}
      <AnimatedSection className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Map placeholder and address */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-3xl font-bold mb-4 dark:text-white">
                    Visit Our{' '}
                    <span className="gradient-text">Office</span>
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-indigo-200/70 mb-6">
                    Come meet us in person at our headquarters in the heart of Kathmandu
                  </p>
                </div>
                
                {/* Map placeholder */}
                <AnimatedCard className="relative overflow-hidden" hoverEffect="lift">
                  <div className="h-[300px] bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 rounded-xl flex items-center justify-center relative">
                    {/* Map placeholder content */}
                    <div className="text-center">
                      <MapPin className="w-16 h-16 mx-auto mb-4 text-primary dark:text-indigo-400" />
                      <h4 className="text-xl font-semibold mb-2 dark:text-white">Interactive Map</h4>
                      <p className="text-gray-600 dark:text-indigo-200/70 mb-4">Click to open in Google Maps</p>
                      <Button className="bg-white text-primary hover:bg-gray-50 dark:bg-gray-800 dark:text-indigo-400 dark:hover:bg-gray-700">
                        <Globe className="w-4 h-4 mr-2" />
                        Open Map
                      </Button>
                    </div>
                    
                    {/* Floating location pin */}
                    <div className="absolute top-4 right-4 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
                      <MapPin className="w-6 h-6" />
                    </div>
                  </div>
                </AnimatedCard>
                
                {/* Address details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-semibold text-blue-800 dark:text-blue-300">Address</span>
                    </div>
                    <p className="text-blue-700 dark:text-blue-400">New Baneshwor, Kathmandu 44600, Nepal</p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-green-800 dark:text-green-300">Office Hours</span>
                    </div>
                    <p className="text-green-700 dark:text-green-400">Monday - Friday, 9:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </div>
              
              {/* Social links and additional info */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-3xl font-bold mb-4 dark:text-white">
                    Follow{' '}
                    <span className="gradient-text">Us</span>
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-indigo-200/70 mb-6">
                    Stay connected and get the latest updates from SewaBazaar
                  </p>
                </div>
                
                {/* Social media links */}
                <div className="grid grid-cols-2 gap-4">
                  {socialLinks.map((social, index) => (
                    <AnimatedSection key={index} delay={index * 100} animation="scaleIn">
                      <div className="group p-6 rounded-xl bg-white/70 dark:bg-black/30 backdrop-blur-sm border border-white/20 dark:border-indigo-900/30 hover-lift cursor-pointer text-center">
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                          {social.icon}
                        </div>
                        <h4 className={`font-semibold transition-colors duration-300 dark:text-white ${social.color}`}>
                          {social.name}
                        </h4>
                      </div>
                    </AnimatedSection>
                  ))}
                </div>
                
                {/* Newsletter signup */}
                <AnimatedCard className="relative overflow-hidden" hoverEffect="lift">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent" />
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent" />
                  
                  <AnimatedCardContent className="relative text-white p-8">
                    <div className="text-center">
                      <Mail className="w-12 h-12 mx-auto mb-4" />
                      <h4 className="text-xl font-bold mb-2">Stay Updated</h4>
                      <p className="text-white/90 mb-6">Subscribe to our newsletter for the latest news and updates</p>
                      
                      <div className="flex gap-2">
                        <input 
                          type="email" 
                          placeholder="Enter your email"
                          className="flex-1 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                        <Button className="bg-white text-primary hover:bg-white/90 px-6">
                          Subscribe
                        </Button>
                      </div>
                    </div>
                  </AnimatedCardContent>
                </AnimatedCard>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  )
} 