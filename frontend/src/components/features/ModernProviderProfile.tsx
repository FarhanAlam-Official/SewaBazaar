"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Star, 
  MapPin, 
  Calendar, 
  Award, 
  Briefcase, 
  MessageSquare,
  Phone,
  Mail,
  ExternalLink,
  Shield,
  Clock,
  Users,
  TrendingUp,
  Heart,
  Share2,
  ChevronRight,
  Play,
  Image as ImageIcon,
  Video,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  Globe,
  Reply,
  Search
} from "lucide-react"
import { showToast } from "@/components/ui/enhanced-toast"
import { ProviderService, providerUtils } from "@/services/providerService"
import { format } from "date-fns"
import Image from "next/image"

// Define types locally
interface ProviderProfile {
  id?: number;
  display_name?: string;
  bio?: string;
  profile_picture?: string;
  location_city?: string;
  years_of_experience?: number;
  certifications?: string[];
  is_verified?: boolean;
  rating_summary?: {
    average: number;
    count: number;
    breakdown: { [key: number]: number };
  };
  service_categories?: string[];
  portfolio_media?: Array<{
    id: number;
    caption?: string;
    file_url: string;
    media_type: 'image' | 'video';
  }>;
  services?: Array<{
    id: number;
    title: string;
    description: string;
    price: number;
    discount_price?: number;
    image?: string;
    average_rating?: number;
    reviews_count?: number;
  }>;
  total_services?: number;
  total_bookings?: number;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  customer: {
    name: string;
  };
}

interface ModernProviderProfileProps {
  providerId: number;
  user?: any;
  isAuthenticated: boolean;
}

export const ModernProviderProfile: React.FC<ModernProviderProfileProps> = ({
  providerId,
  user,
  isAuthenticated
}) => {
  const router = useRouter();
  
  // State
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<any>(null);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  
  // Helper function to construct proper image URLs
  const getImageUrl = (url?: string) => {
    if (!url) return '/placeholder-user.jpg';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    if (url.startsWith('/')) return `${backendBase}${url}`;
    return `${backendBase}/media/${url}`;
  };

  // Load provider profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profileData = await ProviderService.getProviderProfile(providerId);
        setProfile(profileData);
      } catch (error) {
        console.error('Error loading provider profile:', error);
        setError('Failed to load provider profile');
      } finally {
        setLoading(false);
      }
    };

    if (providerId) {
      loadProfile();
    }
  }, [providerId]);

  // Load reviews
  useEffect(() => {
    const loadReviews = async () => {
      try {
        const reviewsData = await ProviderService.getProviderReviews(providerId, {
          page: 1,
          page_size: 10
        });
        setReviews(reviewsData.results || []);
      } catch (error) {
        console.error('Error loading reviews:', error);
        // Don't set error state for reviews, just log it
      }
    };

    if (providerId) {
      loadReviews();
    }
  }, [providerId]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const cardHoverVariants = {
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const iconHoverVariants = {
    hover: {
      rotate: 360,
      scale: 1.1,
      transition: {
        duration: 0.6,
        ease: "easeInOut"
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading provider profile...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Provider Not Found</h2>
          <p className="text-slate-600 mb-6">{error || 'The provider profile you are looking for does not exist.'}</p>
          <Button onClick={() => router.push('/services')} className="bg-blue-600 hover:bg-blue-700">
            Back to Services
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 py-8"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants} className="mb-8">
          <Card className="overflow-hidden border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm transition-colors duration-300">
            <div className="relative">
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 dark:from-blue-400/20 dark:via-purple-400/20 dark:to-indigo-400/20"></div>
              <div className="absolute inset-0 opacity-40 dark:opacity-20">
                <div className="w-full h-full" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundRepeat: 'repeat'
                }}></div>
              </div>
              
              <CardContent className="relative p-8">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  {/* Profile Section */}
                  <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
                    {/* Avatar */}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                      className="relative"
                    >
                      <div className="relative p-1 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-400 hover:via-purple-400 hover:to-pink-400 transition-all duration-300 hover:scale-105">
                        <Avatar className="w-32 h-32 ring-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                          <AvatarImage src={getImageUrl(profile.profile_picture)} alt={profile.display_name || 'Provider'} />
                          <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {(profile.display_name || 'P').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      {profile.is_verified && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5, type: "spring" }}
                          className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-2 shadow-lg"
                        >
                          <Shield className="w-5 h-5" />
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Profile Info */}
                    <div className="text-center lg:text-left">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-3 mb-3"
                      >
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent transition-colors duration-300">
                          {profile.display_name || 'Provider'}
                        </h1>
                        {profile.is_verified && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                            <Shield className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-300 mb-4"
                      >
                        {profile.location_city && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                            <span className="font-medium">{profile.location_city}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                          <span className="font-medium">{providerUtils.formatExperience(profile.years_of_experience)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                          <span className="font-medium">{profile.total_services || 0} services</span>
                        </div>
                      </motion.div>

                      {/* Rating */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center gap-3 mb-4"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= Math.floor(profile.rating_summary?.average || 0)
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xl font-bold text-slate-900 dark:text-white">
                            {providerUtils.formatRating(profile.rating_summary?.average)}
                          </span>
                          <span className="text-slate-600 dark:text-slate-300">
                            ({profile.rating_summary?.count || 0} reviews)
                          </span>
                        </div>
                      </motion.div>

                      {/* Bio */}
                      {profile.bio && (
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="text-slate-700 dark:text-slate-200 leading-relaxed max-w-2xl"
                        >
                          {profile.bio}
                        </motion.p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col gap-3 lg:ml-auto"
                  >
                    <Button 
                      size="lg" 
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => router.push('/services')}
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Book Service
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="border-slate-300 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-600 hover:shadow-lg dark:hover:shadow-red-500/20 transition-all duration-300 group"
                      onClick={() => setIsFavorited(!isFavorited)}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Heart className={`w-5 h-5 mr-2 ${isFavorited ? 'fill-red-500 text-red-500' : 'group-hover:text-red-500 dark:group-hover:text-red-400'} transition-colors duration-300`} />
                      </motion.div>
                      {isFavorited ? 'Favorited' : 'Add to Favorites'}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="border-slate-300 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg dark:hover:shadow-blue-500/20 transition-all duration-300 group"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Share2 className="w-5 h-5 mr-2 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-300" />
                      </motion.div>
                      Share Profile
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </div>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { icon: Star, label: "Rating", value: providerUtils.formatRating(profile.rating_summary?.average), color: "text-yellow-500 dark:text-yellow-400" },
            { icon: Users, label: "Reviews", value: profile.rating_summary?.count || 0, color: "text-blue-500 dark:text-blue-400" },
            { icon: Briefcase, label: "Services", value: profile.total_services || 0, color: "text-purple-500 dark:text-purple-400" },
            { icon: CheckCircle, label: "Completed", value: profile.total_bookings || 0, color: "text-emerald-500 dark:text-emerald-400" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={cardHoverVariants}
              whileHover="hover"
              className="group"
            >
              <Card className="border-0 shadow-lg hover:shadow-xl dark:hover:shadow-blue-500/10 transition-all duration-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm group-hover:bg-white/90 dark:group-hover:bg-slate-800/90 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <motion.div
                    variants={iconHoverVariants}
                    whileHover="hover"
                    className="inline-block"
                  >
                    <stat.icon className={`w-8 h-8 mx-auto mb-3 ${stat.color} group-hover:drop-shadow-lg transition-all duration-300`} />
                  </motion.div>
                  <motion.div 
                    className="text-2xl font-bold text-slate-900 dark:text-white mb-1 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 transition-colors duration-300 group-hover:text-slate-700 dark:group-hover:text-slate-200">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs Navigation */}
        <motion.div variants={itemVariants} className="mb-8">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm transition-colors duration-300 hover:shadow-xl dark:hover:shadow-blue-500/10">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-700 p-1 transition-colors duration-300">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:bg-blue-100 dark:hover:bg-blue-800/50 hover:text-blue-700 dark:hover:text-blue-200 group"
                >
                  <Briefcase className="w-4 h-4 mr-2 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors duration-300" />
                  Services
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:bg-yellow-100 dark:hover:bg-yellow-800/50 hover:text-yellow-700 dark:hover:text-yellow-200 group"
                >
                  <Star className="w-4 h-4 mr-2 text-slate-700 dark:text-slate-300 group-hover:text-yellow-600 dark:group-hover:text-yellow-300 transition-colors duration-300" />
                  Reviews ({profile.rating_summary?.count || 0})
                </TabsTrigger>
                <TabsTrigger 
                  value="portfolio" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:bg-green-100 dark:hover:bg-green-800/50 hover:text-green-700 dark:hover:text-green-200 group"
                >
                  <ImageIcon className="w-4 h-4 mr-2 text-slate-700 dark:text-slate-300 group-hover:text-green-600 dark:group-hover:text-green-300 transition-colors duration-300" />
                  Portfolio
                </TabsTrigger>
                <TabsTrigger 
                  value="about" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:bg-purple-100 dark:hover:bg-purple-800/50 hover:text-purple-700 dark:hover:text-purple-200 group"
                >
                  <Users className="w-4 h-4 mr-2 text-slate-700 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors duration-300" />
                  About
                </TabsTrigger>
              </TabsList>

              {/* Services Tab */}
              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column - Services */}
                  <div className="lg:col-span-2">
                    <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm transition-colors duration-300">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-2xl text-slate-900 dark:text-white transition-colors duration-300">
                          <Sparkles className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                          Services Offered
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {profile.services && profile.services.length > 0 ? (
                          <div className="grid gap-6">
                            {profile.services.map((service, index) => (
                              <motion.div
                                key={service.id || `service-${index}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                variants={cardHoverVariants}
                                whileHover="hover"
                              >
                                <Card className="border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 cursor-pointer group bg-white dark:bg-slate-800 hover:shadow-lg dark:hover:shadow-blue-500/10">
                                  <CardContent className="p-6">
                                    <div className="flex gap-4">
                                      {service.image && (
                                        <motion.div 
                                          className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0"
                                          whileHover={{ scale: 1.05 }}
                                          transition={{ duration: 0.2 }}
                                        >
                                          <img
                                            src={getImageUrl(service.image)}
                                            alt={service.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                          />
                                        </motion.div>
                                      )}
                                      <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                          <motion.h3 
                                            className="text-xl font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                                            whileHover={{ scale: 1.02 }}
                                            transition={{ duration: 0.2 }}
                                          >
                                            {service.title}
                                          </motion.h3>
                                          <div className="text-right">
                                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                              ₹{service.price}
                                            </div>
                                            {service.discount_price && (
                                              <div className="text-sm text-slate-500 dark:text-slate-400 line-through">
                                                ₹{service.discount_price}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
                                          {service.description}
                                        </p>
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                                              {service.average_rating || 0}
                                            </span>
                                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                              ({service.reviews_count || 0} reviews)
                                            </span>
                                          </div>
                                          <Button 
                                            size="sm" 
                                            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            onClick={() => router.push(`/services/${service.id}`)}
                                          >
                                            View Details
                                            <ArrowRight className="w-4 h-4 ml-1" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <Briefcase className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-500 dark:text-slate-400 text-lg">No services available at the moment.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Sidebar */}
                  <div className="space-y-6">
                    {/* Service Categories */}
                    {profile.service_categories && profile.service_categories.length > 0 && (
                      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:hover:shadow-blue-500/10 hover:scale-105 group">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white transition-colors duration-300">
                            <Target className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                            Specializations
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {Array.from(new Set(profile.service_categories)).map((category, index) => (
                              <motion.div
                                key={`${category}-${index}`}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                              >
                                <Badge variant="secondary" className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-300">
                                  {category}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Certifications */}
                    {profile.certifications && profile.certifications.length > 0 && (
                      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:hover:shadow-blue-500/10 hover:scale-105 group">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white transition-colors duration-300">
                            <Award className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                            Certifications
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Array.from(new Set(profile.certifications)).map((cert, index) => (
                              <motion.div
                                key={`${cert}-${index}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors duration-300"
                              >
                                <div className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full"></div>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{cert}</span>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Portfolio Preview */}
                    {profile.portfolio_media && profile.portfolio_media.length > 0 && (
                      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:hover:shadow-blue-500/10 hover:scale-105 group">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white transition-colors duration-300">
                            <ImageIcon className="w-5 h-5 text-green-500 dark:text-green-400" />
                            Portfolio
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-3">
                            {profile.portfolio_media.slice(0, 4).map((media, index) => (
                              <motion.div
                                key={media.id || `media-${index}`}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                                onClick={() => setSelectedPortfolioItem(media)}
                              >
                                {media.media_type === 'image' ? (
                                  <img
                                    src={getImageUrl(media.file_url)}
                                    alt={media.caption || 'Portfolio item'}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                    <Play className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                  {media.media_type === 'video' && (
                                    <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                          {profile.portfolio_media.length > 4 && (
                            <Button 
                              variant="outline" 
                              className="w-full mt-4 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-300"
                              onClick={() => setActiveTab("portfolio")}
                            >
                              View All Portfolio
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-6">
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm transition-colors duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl text-slate-900 dark:text-white transition-colors duration-300">
                      <Star className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                      Customer Reviews
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reviews && reviews.length > 0 ? (
                      <div className="space-y-6">
                        {reviews.map((review, index) => (
                          <motion.div
                            key={review.id || `review-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card 
                              className="border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 cursor-pointer bg-white dark:bg-slate-800"
                              onClick={() => setSelectedReview(review)}
                            >
                              <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                  <Avatar className="w-12 h-12">
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                      {review.customer?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="font-semibold text-slate-900 dark:text-white">{review.customer?.name || 'Anonymous'}</h4>
                                      <div className="flex">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`w-4 h-4 ${
                                              star <= (review.rating || 0)
                                                ? 'text-yellow-400 fill-yellow-400'
                                                : 'text-gray-300 dark:text-gray-600'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-sm text-slate-500 dark:text-slate-400">
                                        {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Recently'}
                                      </span>
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{review.comment || 'No comment provided.'}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Star className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 text-lg">No reviews yet. Be the first to review!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Portfolio Tab */}
              <TabsContent value="portfolio" className="mt-6">
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm transition-colors duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl text-slate-900 dark:text-white transition-colors duration-300">
                      <ImageIcon className="w-6 h-6 text-green-500 dark:text-green-400" />
                      Portfolio Gallery
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profile.portfolio_media && profile.portfolio_media.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {profile.portfolio_media.map((media, index) => (
                          <motion.div
                            key={media.id || `media-${index}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                            onClick={() => setSelectedPortfolioItem(media)}
                          >
                            {media.media_type === 'image' ? (
                              <img
                                src={getImageUrl(media.file_url)}
                                alt={media.caption || 'Portfolio item'}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                                ) : (
                                  <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                    <Play className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                                  {media.media_type === 'video' && (
                                    <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  )}
                                  {media.caption && (
                                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                                      <p className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        {media.caption}
                                      </p>
                                    </div>
                                  )}
                                </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <ImageIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 text-lg">No portfolio items available.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* About Tab */}
              <TabsContent value="about" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm transition-colors duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white transition-colors duration-300">
                        <Users className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                        About {profile.display_name || 'Provider'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {profile.bio ? (
                          <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{profile.bio}</p>
                        ) : (
                          <p className="text-slate-500 dark:text-slate-400 italic">No bio available.</p>
                        )}
                        
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                            <span className="font-medium text-slate-700 dark:text-slate-200">Experience:</span>
                            <span className="text-slate-600 dark:text-slate-300">{providerUtils.formatExperience(profile.years_of_experience)}</span>
                          </div>
                          
                          {profile.location_city && (
                            <div className="flex items-center gap-3">
                              <MapPin className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                              <span className="font-medium text-slate-700 dark:text-slate-200">Location:</span>
                              <span className="text-slate-600 dark:text-slate-300">{profile.location_city}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-3">
                            <Briefcase className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                            <span className="font-medium text-slate-700 dark:text-slate-200">Services:</span>
                            <span className="text-slate-600 dark:text-slate-300">{profile.total_services || 0} active services</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                            <span className="font-medium text-slate-700 dark:text-slate-200">Completed:</span>
                            <span className="text-slate-600 dark:text-slate-300">{profile.total_bookings || 0} bookings</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-6">
                    {/* Service Categories */}
                    {profile.service_categories && profile.service_categories.length > 0 && (
                      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:hover:shadow-blue-500/10 hover:scale-105 group">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white transition-colors duration-300">
                            <Target className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                            Specializations
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {Array.from(new Set(profile.service_categories)).map((category, index) => (
                              <Badge key={`${category}-${index}`} variant="secondary" className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-300">
                                {category}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Certifications */}
                    {profile.certifications && profile.certifications.length > 0 && (
                      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:hover:shadow-blue-500/10 hover:scale-105 group">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white transition-colors duration-300">
                            <Award className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                            Certifications
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Array.from(new Set(profile.certifications)).map((cert, index) => (
                              <div key={`${cert}-${index}`} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors duration-300">
                                <div className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full"></div>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{cert}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>

        {/* Portfolio Modal */}
        <AnimatePresence>
          {selectedPortfolioItem && (
            <Dialog open={!!selectedPortfolioItem} onOpenChange={() => setSelectedPortfolioItem(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white dark:bg-slate-800 transition-colors duration-300">
                <DialogHeader>
                  <DialogTitle className="text-slate-900 dark:text-white transition-colors duration-300">{selectedPortfolioItem.caption || 'Portfolio Item'}</DialogTitle>
                </DialogHeader>
                <div className="relative">
                  {selectedPortfolioItem.media_type === 'image' ? (
                    <img
                      src={getImageUrl(selectedPortfolioItem.file_url)}
                      alt={selectedPortfolioItem.caption || 'Portfolio item'}
                      className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-auto max-h-[70vh] rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <video
                        src={getImageUrl(selectedPortfolioItem.file_url)}
                        controls
                        className="w-full h-auto max-h-[70vh] rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>

        {/* Detailed Review Modal */}
        <AnimatePresence>
          {selectedReview && (
            <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 transition-colors duration-300">
                <DialogHeader className="pb-4">
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white transition-colors duration-300">
                    <Star className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                    Review Details
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Review Header */}
                  <div className="flex items-start gap-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg transition-colors duration-300">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg">
                        {selectedReview.customer?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white transition-colors duration-300">
                          {selectedReview.customer?.name || 'Anonymous'}
                        </h3>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= (selectedReview.rating || 0)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {selectedReview.rating || 0}/5
                        </Badge>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-sm transition-colors duration-300">
                        {selectedReview.created_at ? format(new Date(selectedReview.created_at), "MMMM d, yyyy 'at' h:mm a") : 'Recently'}
                      </p>
                    </div>
                  </div>

                  {/* User and Provider Profiles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Profile */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors duration-300"
                    >
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2 transition-colors duration-300">
                        <Users className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                        Customer Profile
                      </h4>
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                            {selectedReview.customer?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h5 className="font-medium text-slate-900 dark:text-white transition-colors duration-300">
                            {selectedReview.customer?.name || 'Anonymous Customer'}
                          </h5>
                          <p className="text-sm text-slate-600 dark:text-slate-300 transition-colors duration-300">
                            Verified Customer
                          </p>
                          {selectedReview.customer?.email && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors duration-300">
                              {selectedReview.customer.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Provider Profile */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 transition-colors duration-300"
                    >
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2 transition-colors duration-300">
                        <Briefcase className="w-5 h-5 text-green-500 dark:text-green-400" />
                        Provider Profile
                      </h4>
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          {profile?.profile_picture ? (
                            <img
                              src={getImageUrl(profile.profile_picture)}
                              alt={profile.display_name || 'Provider'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                              {profile?.display_name?.charAt(0)?.toUpperCase() || 'P'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <h5 className="font-medium text-slate-900 dark:text-white transition-colors duration-300">
                            {profile?.display_name || 'Service Provider'}
                          </h5>
                          <p className="text-sm text-slate-600 dark:text-slate-300 transition-colors duration-300">
                            {profile?.years_of_experience ? `${profile.years_of_experience} years experience` : 'Professional Provider'}
                          </p>
                          {profile?.location_city && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors duration-300 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {profile.location_city}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Review Comment */}
                  <div className="p-6 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors duration-300">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2 transition-colors duration-300">
                      <MessageSquare className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                      Review Comment
                    </h4>
                    <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-lg transition-colors duration-300">
                      {selectedReview.comment || 'No comment provided.'}
                    </p>
                  </div>

                  {/* Service Information */}
                  {selectedReview.service_title && (
                    <div className="p-6 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors duration-300">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2 transition-colors duration-300">
                        <Briefcase className="w-5 h-5 text-green-500 dark:text-green-400" />
                        Service Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors duration-300">Service:</span>
                          <p className="text-slate-900 dark:text-white font-medium transition-colors duration-300">{selectedReview.service_title}</p>
                        </div>
                        {selectedReview.booking_id && (
                          <div>
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors duration-300">Booking ID:</span>
                            <p className="text-slate-900 dark:text-white font-medium transition-colors duration-300">#{selectedReview.booking_id}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Review Images */}
                  {selectedReview.images && selectedReview.images.length > 0 && (
                    <div className="p-6 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors duration-300">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2 transition-colors duration-300">
                        <ImageIcon className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                        Review Photos ({selectedReview.images.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {selectedReview.images.map((image: any, index: number) => (
                          <div
                            key={index}
                            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                            onClick={() => window.open(getImageUrl(image.image_url || image), '_blank')}
                          >
                            <Image
                              src={getImageUrl(image.image_url || image)}
                              alt={`Review photo ${index + 1}`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                              <Search className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Provider Response */}
                  {selectedReview.provider_response && (
                    <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800 transition-colors duration-300">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2 transition-colors duration-300">
                        <Reply className="w-5 h-5 text-green-500 dark:text-green-400" />
                        Provider Response
                      </h4>
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white">
                            {profile?.display_name?.charAt(0)?.toUpperCase() || 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-slate-900 dark:text-white transition-colors duration-300">{profile?.display_name || 'Provider'}</span>
                            {selectedReview.provider_response_updated_at && (
                              <span className="text-sm text-slate-500 dark:text-slate-400 transition-colors duration-300">
                                {format(new Date(selectedReview.provider_response_updated_at), "MMM d, yyyy")}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 dark:text-slate-200 leading-relaxed transition-colors duration-300">
                            {selectedReview.provider_response}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quality Ratings */}
                  {(selectedReview.punctuality_rating || selectedReview.quality_rating || 
                    selectedReview.communication_rating || selectedReview.value_rating) && (
                    <div className="p-6 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors duration-300">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2 transition-colors duration-300">
                        <TrendingUp className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                        Detailed Quality Ratings
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedReview.punctuality_rating && (
                          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors duration-300">
                            <Zap className="w-8 h-8 text-blue-500 dark:text-blue-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 transition-colors duration-300">Punctuality</p>
                            <div className="flex justify-center gap-1 mb-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= selectedReview.punctuality_rating
                                      ? 'text-blue-400 fill-blue-400'
                                      : 'text-gray-300 dark:text-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400 transition-colors duration-300">{selectedReview.punctuality_rating}/5</p>
                          </div>
                        )}
                        
                        {selectedReview.quality_rating && (
                          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg transition-colors duration-300">
                            <Award className="w-8 h-8 text-green-500 dark:text-green-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 transition-colors duration-300">Quality</p>
                            <div className="flex justify-center gap-1 mb-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= selectedReview.quality_rating
                                      ? 'text-green-400 fill-green-400'
                                      : 'text-gray-300 dark:text-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400 transition-colors duration-300">{selectedReview.quality_rating}/5</p>
                          </div>
                        )}
                        
                        {selectedReview.communication_rating && (
                          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg transition-colors duration-300">
                            <MessageSquare className="w-8 h-8 text-purple-500 dark:text-purple-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 transition-colors duration-300">Communication</p>
                            <div className="flex justify-center gap-1 mb-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= selectedReview.communication_rating
                                      ? 'text-purple-400 fill-purple-400'
                                      : 'text-gray-300 dark:text-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-lg font-bold text-purple-600 dark:text-purple-400 transition-colors duration-300">{selectedReview.communication_rating}/5</p>
                          </div>
                        )}
                        
                        {selectedReview.value_rating && (
                          <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg transition-colors duration-300">
                            <Heart className="w-8 h-8 text-amber-500 dark:text-amber-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 transition-colors duration-300">Value</p>
                            <div className="flex justify-center gap-1 mb-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= selectedReview.value_rating
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-gray-300 dark:text-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-lg font-bold text-amber-600 dark:text-amber-400 transition-colors duration-300">{selectedReview.value_rating}/5</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
