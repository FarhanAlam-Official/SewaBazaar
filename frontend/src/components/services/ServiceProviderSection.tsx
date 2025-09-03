"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Star, Crown, Award, Calendar, MapPin, Clock, 
  CheckCircle2, MessageCircle, Eye, Users, 
  TrendingUp, Shield, Verified, Phone, Mail,
  ExternalLink, ChevronRight, Briefcase, Globe
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProviderInfoProps } from '@/types/service-detail'
import { cn } from '@/lib/utils'

export function ServiceProviderSection({ 
  provider, 
  service,
  onMessageProvider,
  onViewPortfolio,
  className 
}: ProviderInfoProps & { className?: string }) {
  const [activeTab, setActiveTab] = useState('overview')

  const profile = provider.profile

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={cn("space-y-6", className)}
    >
      {/* Provider Header */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Provider Avatar & Basic Info */}
            <div className="flex flex-col items-center lg:items-start">
              <div className="relative">
                <Avatar className="w-24 h-24 ring-4 ring-violet-200 dark:ring-violet-800">
                  <AvatarImage src={profile.profile_image} />
                  <AvatarFallback className="bg-violet-100 text-violet-800 text-2xl font-bold">
                    {provider.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {profile.is_verified && (
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-2">
                    <Crown className="h-4 w-4" />
                  </div>
                )}
              </div>
              
              <div className="text-center lg:text-left mt-4">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {provider.name}
                  {profile.is_verified && (
                    <Verified className="h-5 w-5 text-emerald-500" />
                  )}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  {profile.specializations.slice(0, 2).join(' • ')}
                </p>
                
                <div className="flex items-center gap-2 mt-2 justify-center lg:justify-start">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold">{profile.avg_rating}</span>
                  <span className="text-slate-600">({profile.reviews_count} reviews)</span>
                </div>
              </div>
            </div>

            {/* Provider Stats */}
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{profile.experience_years}</div>
                <div className="text-sm text-blue-800 dark:text-blue-200">Years Experience</div>
              </div>
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">{profile.completed_projects}</div>
                <div className="text-sm text-emerald-800 dark:text-emerald-200">Projects Done</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{profile.on_time_delivery_rate}%</div>
                <div className="text-sm text-purple-800 dark:text-purple-200">On-Time Rate</div>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{profile.repeat_clients_percentage}%</div>
                <div className="text-sm text-amber-800 dark:text-amber-200">Repeat Clients</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 lg:w-48">
              <Button onClick={onMessageProvider} className="w-full">
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
              <Button variant="outline" onClick={onViewPortfolio} className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                View Portfolio
              </Button>
              <Link href={`/providers/${provider.id}`}>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Profile
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Provider Information */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-6 space-y-6">
            <div>
              <h4 className="text-lg font-semibold mb-3">About</h4>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {profile.bio}
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3">Specializations</h4>
              <div className="flex flex-wrap gap-2">
                {profile.specializations.map((spec, index) => (
                  <Badge key={index} variant="secondary">
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3">Languages</h4>
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((lang, index) => (
                  <Badge key={index} variant="outline">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="portfolio" className="p-6">
            {profile.portfolio.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.portfolio.slice(0, 4).map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video relative">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h5 className="font-semibold mb-2">{item.title}</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{item.category}</Badge>
                        {item.project_url && (
                          <Button size="sm" variant="ghost">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Portfolio items will be available soon</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="credentials" className="p-6">
            {profile.credentials.length > 0 ? (
              <div className="space-y-4">
                {profile.credentials.map((credential) => (
                  <div key={credential.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <Award className="h-6 w-6 text-amber-500 mt-1" />
                    <div className="flex-1">
                      <h5 className="font-semibold">{credential.name}</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {credential.issuer} • {credential.date_obtained}
                      </p>
                      <Badge className="mt-2" variant="outline">
                        {credential.credential_type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Professional credentials will be displayed here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </motion.div>
  )
}