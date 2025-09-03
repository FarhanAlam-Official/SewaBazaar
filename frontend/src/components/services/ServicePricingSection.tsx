"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Check, Star, Zap, Crown, Diamond, Sparkles, 
  ArrowRight, Calculator, MessageCircle, Clock,
  Shield, Award, Gift, Plus, Minus, Info,
  TrendingUp, Target, Users, Package
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ServicePricingProps, ServicePackageTier, ServiceExtra } from '@/types/service-detail'
import { cn } from '@/lib/utils'

interface ServicePricingSectionProps extends ServicePricingProps {
  onGetQuote?: () => void
  onContactProvider?: () => void
  className?: string
}

export function ServicePricingSection({ 
  packages, 
  pricing_type, 
  onPackageSelect, 
  selectedPackage,
  currency,
  onGetQuote,
  onContactProvider,
  className 
}: ServicePricingSectionProps) {
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [showExtras, setShowExtras] = useState<string | null>(null)

  // Get the popular package
  const popularPackage = packages.find(pkg => pkg.is_popular)

  // Handle extra selection
  const toggleExtra = (extraId: string) => {
    setSelectedExtras(prev => 
      prev.includes(extraId) 
        ? prev.filter(id => id !== extraId)
        : [...prev, extraId]
    )
  }

  // Calculate total price with extras
  const calculateTotalPrice = (packageTier: ServicePackageTier) => {
    const basePrice = packageTier.price
    const extrasPrice = packageTier.extras
      ?.filter(extra => selectedExtras.includes(extra.id))
      .reduce((sum, extra) => sum + extra.price, 0) || 0
    return basePrice + extrasPrice
  }

  // Get tier styling
  const getTierStyling = (tier: ServicePackageTier) => {
    if (tier.is_popular) {
      return {
        card: "ring-2 ring-violet-500 border-violet-300 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20",
        header: "bg-gradient-to-r from-violet-500 to-purple-600 text-white",
        button: "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white",
        badge: "bg-violet-500 text-white"
      }
    }
    if (tier.name === 'premium' || tier.name === 'enterprise') {
      return {
        card: "border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20",
        header: "bg-gradient-to-r from-amber-500 to-yellow-600 text-white",
        button: "bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white",
        badge: "bg-amber-500 text-white"
      }
    }
    return {
      card: "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
      header: "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white",
      button: "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100",
      badge: "bg-slate-500 text-white"
    }
  }

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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  if (pricing_type === 'custom') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("space-y-6", className)}
      >
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-700 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="space-y-6">
              <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Calculator className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Custom Pricing
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Get a personalized quote tailored to your specific needs
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 justify-center">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <span>No hidden fees</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span>Fast response</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <Award className="h-5 w-5 text-blue-500" />
                  <span>Best value guarantee</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={onGetQuote}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Calculator className="h-5 w-5 mr-2" />
                  Get Free Quote
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={onContactProvider}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Contact Provider
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={cn("space-y-8", className)}
    >
      {/* Section Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          Choose Your Package
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Select the perfect plan for your needs. All packages include our quality guarantee and professional support.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((tier, index) => {
          const styling = getTierStyling(tier)
          const isSelected = selectedPackage === tier.id
          const totalPrice = calculateTotalPrice(tier)
          const savings = tier.original_price ? tier.original_price - tier.price : 0

          return (
            <motion.div
              key={tier.id}
              variants={cardVariants}
              whileHover={{ y: -5 }}
              className="relative"
            >
              <Card className={cn(
                "relative overflow-hidden transition-all duration-300 shadow-lg hover:shadow-xl",
                styling.card,
                isSelected && "ring-2 ring-violet-500 shadow-xl"
              )}>
                {/* Popular Badge */}
                {tier.is_popular && (
                  <div className="absolute top-0 right-6 transform -translate-y-1/2">
                    <Badge className={styling.badge}>
                      <Crown className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className={cn("text-center", styling.header)}>
                  <div className="space-y-2">
                    <CardTitle className="text-xl font-bold">{tier.title}</CardTitle>
                    <p className="text-sm opacity-90">{tier.description}</p>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Pricing */}
                  <div className="text-center space-y-2">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-3xl font-bold text-slate-900 dark:text-white">
                        {currency} {tier.price.toLocaleString()}
                      </span>
                      {tier.original_price && (
                        <span className="text-lg text-slate-500 line-through">
                          {currency} {tier.original_price.toLocaleString()}
                        </span>
                      )}
                    </div>
                    
                    {savings > 0 && (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Save {currency} {savings.toLocaleString()}
                      </Badge>
                    )}

                    <div className="flex items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {tier.delivery_time}
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {tier.revisions === 'unlimited' ? 'Unlimited' : `${tier.revisions}`} revisions
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {tier.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Extras */}
                  {tier.extras && tier.extras.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-slate-900 dark:text-white">Add-ons</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowExtras(showExtras === tier.id ? null : tier.id)}
                        >
                          {showExtras === tier.id ? (
                            <Minus className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <AnimatePresence>
                        {showExtras === tier.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-2 overflow-hidden"
                          >
                            {tier.extras.map((extra) => (
                              <div
                                key={extra.id}
                                className="flex items-center justify-between p-2 rounded border border-slate-200 dark:border-slate-700"
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedExtras.includes(extra.id)}
                                    onChange={() => toggleExtra(extra.id)}
                                    className="rounded"
                                  />
                                  <div>
                                    <div className="text-sm font-medium">{extra.title}</div>
                                    <div className="text-xs text-slate-500">{extra.description}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium">
                                    +{currency} {extra.price}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {extra.delivery_time_addition}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Total Price with Extras */}
                  {selectedExtras.length > 0 && totalPrice !== tier.price && (
                    <div className="p-3 bg-violet-50 dark:bg-violet-950/20 rounded-lg border border-violet-200 dark:border-violet-700">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-violet-800 dark:text-violet-200">
                          Total with add-ons:
                        </span>
                        <span className="text-lg font-bold text-violet-900 dark:text-violet-100">
                          {currency} {totalPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Select Button */}
                  <Button
                    onClick={() => onPackageSelect(tier.id)}
                    className={cn(
                      "w-full transition-all duration-300",
                      isSelected 
                        ? "bg-violet-600 hover:bg-violet-700 text-white" 
                        : styling.button
                    )}
                    size="lg"
                  >
                    {isSelected ? (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Selected
                      </>
                    ) : (
                      <>
                        Select Package
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Pricing Notes */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Info className="h-5 w-5 text-blue-500" />
          <span className="font-medium">Important Information</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500" />
            <span>Money-back guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>On-time delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-purple-500" />
            <span>Quality assurance</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-amber-500" />
            <span>24/7 support included</span>
          </div>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-400">
          * Prices are subject to change based on project complexity. Final pricing will be confirmed before work begins.
        </div>
      </div>

      {/* Comparison Table (for 3+ packages) */}
      {packages.length >= 3 && (
        <motion.div variants={cardVariants}>
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-center">Package Comparison</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="p-4 text-left">Features</th>
                      {packages.map((pkg) => (
                        <th key={pkg.id} className="p-4 text-center min-w-[120px]">
                          <div className="font-semibold">{pkg.title}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {currency} {pkg.price}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    <tr>
                      <td className="p-4 font-medium">Delivery Time</td>
                      {packages.map((pkg) => (
                        <td key={pkg.id} className="p-4 text-center">{pkg.delivery_time}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-medium">Revisions</td>
                      {packages.map((pkg) => (
                        <td key={pkg.id} className="p-4 text-center">
                          {pkg.revisions === 'unlimited' ? 'Unlimited' : pkg.revisions}
                        </td>
                      ))}
                    </tr>
                    {/* Add more comparison rows as needed */}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}