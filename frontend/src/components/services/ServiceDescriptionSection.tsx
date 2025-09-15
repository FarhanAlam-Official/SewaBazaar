"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ChevronDown, ChevronRight, CheckCircle2, Star, Lightbulb, 
  Target, Users, TrendingUp, Award, Zap, Shield, Clock,
  Gift, Sparkles, ArrowRight, Info, HelpCircle, BookOpen,
  Layers, PieChart, BarChart3, LineChart, Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { EnhancedServiceDetail, ServiceBenefit, ServiceUseCase } from '@/types/service-detail'
import { cn } from '@/lib/utils'

interface ServiceDescriptionSectionProps {
  service: EnhancedServiceDetail
  className?: string
}

// Icon mapping for benefit categories
const benefitIcons = {
  value: Gift,
  quality: Award,
  convenience: Zap,
  support: Shield
}

// Icon mapping for use case scenarios
const useCaseIcons = {
  startup: TrendingUp,
  enterprise: Layers,
  personal: Users,
  ecommerce: PieChart,
  default: Target
}

export function ServiceDescriptionSection({ service, className }: ServiceDescriptionSectionProps) {
  const [expandedFeatures, setExpandedFeatures] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={cn("space-y-8", className)}
    >
      {/* Main Description Tabs */}
      <motion.div variants={itemVariants}>
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50 shadow-xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6 h-12 bg-slate-100/50 dark:bg-slate-800/50">
              <TabsTrigger value="overview" className="text-xs lg:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="features" className="text-xs lg:text-sm">Features</TabsTrigger>
              <TabsTrigger value="benefits" className="text-xs lg:text-sm">Benefits</TabsTrigger>
              <TabsTrigger value="use-cases" className="text-xs lg:text-sm">Use Cases</TabsTrigger>
              <TabsTrigger value="process" className="text-xs lg:text-sm">Process</TabsTrigger>
              <TabsTrigger value="requirements" className="text-xs lg:text-sm">Requirements</TabsTrigger>
            </TabsList>
            
            <div className="p-8">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                      Service Overview
                    </h3>
                    <div className="prose max-w-none dark:prose-invert">
                      <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  {/* Key Highlights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 p-4 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-800 dark:text-blue-200">Completion Rate</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {service.completion_rate}%
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 p-4 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-emerald-600" />
                        <span className="font-semibold text-emerald-800 dark:text-emerald-200">Response Time</span>
                      </div>
                      <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                        {service.response_time}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 p-4 rounded-xl border border-purple-200/50 dark:border-purple-700/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-purple-800 dark:text-purple-200">Average Rating</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {typeof service.average_rating === 'number' ? service.average_rating.toFixed(1) : '0.0'}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 p-4 rounded-xl border border-amber-200/50 dark:border-amber-700/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-amber-600" />
                        <span className="font-semibold text-amber-800 dark:text-amber-200">Total Orders</span>
                      </div>
                      <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                        {service.total_orders.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Service Attributes */}
                  {service.tags && service.tags.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 text-slate-900 dark:text-white">Service Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {service.tags.map((tag, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 transition-colors cursor-pointer"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Features Tab */}
              <TabsContent value="features" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    What's Included
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Included Features */}
                    <div>
                      <h4 className="font-semibold text-lg mb-4 text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Included Features
                      </h4>
                      <div className="space-y-3">
                        {service.features.slice(0, expandedFeatures ? undefined : 6).map((feature, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-700/50"
                          >
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                          </motion.div>
                        ))}
                        
                        {service.features.length > 6 && (
                          <Button
                            variant="ghost"
                            onClick={() => setExpandedFeatures(!expandedFeatures)}
                            className="w-full justify-center text-emerald-600 hover:text-emerald-700"
                          >
                            {expandedFeatures ? (
                              <>
                                <ChevronDown className="h-4 w-4 mr-2" />
                                Show Less
                              </>
                            ) : (
                              <>
                                <ChevronRight className="h-4 w-4 mr-2" />
                                Show {service.features.length - 6} More Features
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-6">
                      {/* Includes */}
                      {Array.isArray(service.includes) && service.includes.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-lg mb-4 text-blue-700 dark:text-blue-400 flex items-center gap-2">
                            <Gift className="h-5 w-5" />
                            Service Includes
                          </h4>
                          <div className="space-y-2">
                            {service.includes.map((item, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                                <span className="text-slate-700 dark:text-slate-300 text-sm">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Excludes */}
                      {Array.isArray(service.excludes) && service.excludes.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-lg mb-4 text-amber-700 dark:text-amber-400 flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            Not Included
                          </h4>
                          <div className="space-y-2">
                            {service.excludes.map((item, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <div className="w-4 h-4 border border-amber-400 rounded mt-1 flex-shrink-0" />
                                <span className="text-slate-600 dark:text-slate-400 text-sm">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Benefits Tab */}
              <TabsContent value="benefits" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    Why Choose This Service
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.isArray(service.benefits) && service.benefits.map((benefit, index) => {
                      const IconComponent = benefitIcons[benefit.category] || Award
                      const categoryColors = {
                        value: 'emerald',
                        quality: 'blue',
                        convenience: 'purple',
                        support: 'amber'
                      }
                      const color = categoryColors[benefit.category] || 'blue'
                      
                      return (
                        <motion.div
                          key={benefit.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-6 rounded-xl border bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-950/20 dark:to-${color}-900/20 border-${color}-200/50 dark:border-${color}-700/50`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg bg-${color}-500/10 border border-${color}-200 dark:border-${color}-700`}>
                              <IconComponent className={`h-6 w-6 text-${color}-600`} />
                            </div>
                            <div className="flex-1">
                              <h4 className={`font-semibold text-lg mb-2 text-${color}-800 dark:text-${color}-200`}>
                                {benefit.title}
                              </h4>
                              <p className={`text-${color}-700 dark:text-${color}-300`}>
                                {benefit.description}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* Use Cases Tab */}
              <TabsContent value="use-cases" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    Perfect For
                  </h3>
                  
                  <div className="space-y-6">
                    {Array.isArray(service.use_cases) && service.use_cases.map((useCase, index) => {
                      const IconComponent = useCaseIcons[useCase.scenario as keyof typeof useCaseIcons] || useCaseIcons.default
                      
                      return (
                        <motion.div
                          key={useCase.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-200 dark:border-violet-700">
                              <IconComponent className="h-6 w-6 text-violet-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg mb-2 text-slate-900 dark:text-white">
                                {useCase.title}
                              </h4>
                              <p className="text-slate-600 dark:text-slate-400 mb-3">
                                {useCase.description}
                              </p>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Ideal for: </span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {useCase.ideal_for.map((item, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {item}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                {useCase.example && (
                                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Example: </span>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">{useCase.example}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* Process Tab */}
              <TabsContent value="process" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    How It Works
                  </h3>
                  
                  {Array.isArray(service.process_steps) && service.process_steps.length > 0 ? (
                    <div className="space-y-4">
                      {service.process_steps.map((step, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-4 p-4 rounded-lg bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-700/50"
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-violet-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-slate-700 dark:text-slate-300">{step}</p>
                          </div>
                          {index < (service.process_steps?.length || 0) - 1 && (
                            <ArrowRight className="h-5 w-5 text-slate-400" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Process steps will be provided during consultation.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Requirements Tab */}
              <TabsContent value="requirements" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    Requirements & Preparation
                  </h3>
                  
                  {service.requirements && service.requirements.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-4">
                        What You Need to Provide
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {service.requirements.map((requirement, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-700/50"
                          >
                            <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700 dark:text-slate-300">{requirement}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Requirements will be discussed during initial consultation.</p>
                    </div>
                  )}

                  {/* Policies */}
                  <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold text-lg text-slate-900 dark:text-white">
                      Policies & Terms
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-700">
                        <h5 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Cancellation Policy</h5>
                        <p className="text-sm text-amber-700 dark:text-amber-300">{service.cancellation_policy}</p>
                      </div>
                      {service.refund_policy && (
                        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-700">
                          <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">Refund Policy</h5>
                          <p className="text-sm text-green-700 dark:text-green-300">{service.refund_policy}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </motion.div>

      {/* FAQ Section */}
      {service.faqs && service.faqs.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-violet-600" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-2">
                {service.faqs.map((faq) => (
                  <AccordionItem 
                    key={faq.id} 
                    value={faq.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg px-4"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      <span className="font-medium">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <p className="text-slate-600 dark:text-slate-400">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}