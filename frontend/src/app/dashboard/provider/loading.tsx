"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Star, 
  BarChart2, 
  TrendingUp, 
  Briefcase, 
  Users2,
  Activity,
  ChevronRight
} from "lucide-react"

// Animation variants for smooth transitions
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
      duration: 0.4
    }
  }
}

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      type: "spring" as const,
      damping: 20,
      stiffness: 100
    }
  }
}

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
}

const chartContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
}

const chartCardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function ProviderDashboardLoading() {
  return (
    <motion.div 
      className="p-4 md:p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.div 
        className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        variants={headerVariants}
      >
        <div>
          <Skeleton className="h-8 w-48 mb-2 rounded-xl" />
          <Skeleton className="h-5 w-80 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </motion.div>

      {/* Stats Cards Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={containerVariants}
      >
        {[...Array(4)].map((_, i) => (
          <motion.div key={i} variants={cardVariants}>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-24 mb-1 rounded" />
                  <Skeleton className="h-6 w-16 rounded" />
                  <Skeleton className="h-3 w-20 mt-2 rounded" />
                </div>
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center">
                  <Skeleton className="h-3 w-3 mr-1 rounded-full" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Bookings and Reviews Section */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        variants={containerVariants}
      >
        {/* Recent Bookings Card */}
        <motion.div variants={cardVariants}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-40 rounded" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                  </div>
                  <div className="space-y-2 text-right">
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                </div>
              ))}
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </Card>
        </motion.div>
        
        {/* Recent Reviews Card */}
        <motion.div variants={cardVariants}>
          <Card className="p-6">
            <Skeleton className="h-6 w-32 rounded mb-4" />
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, starIndex) => (
                      <Skeleton key={starIndex} className="h-4 w-4 rounded-full" />
                    ))}
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                  </div>
                </div>
              ))}
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Services and Booking Requests Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* My Services Card */}
        <motion.div variants={cardVariants}>
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32 rounded" />
            <Skeleton className="h-8 w-40 rounded-md" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex">
                    <Skeleton className="w-16 h-16 rounded-md mr-4" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-32 rounded" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-20 rounded" />
                        <Skeleton className="h-4 w-16 rounded" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24 rounded" />
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-12 rounded-md" />
                          <Skeleton className="h-8 w-20 rounded-md" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Booking Requests Card */}
        <motion.div variants={cardVariants}>
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-40 rounded" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <Skeleton className="w-10 h-10 rounded-xl mr-4" />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-32 rounded" />
                          <Skeleton className="h-4 w-24 rounded" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Skeleton className="h-4 w-20 rounded" />
                        <Skeleton className="h-4 w-16 rounded" />
                        <Skeleton className="h-4 w-24 rounded" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-20 rounded" />
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-16 rounded-md" />
                          <Skeleton className="h-8 w-16 rounded-md" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Dashboard Analytics Charts Section */}
      <motion.div 
        className="mb-12"
        variants={containerVariants}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center">
              <Skeleton className="h-6 w-6 mr-3 rounded-full" />
              <Skeleton className="h-8 w-64 rounded-xl" />
            </div>
            <Skeleton className="h-5 w-80 mt-1 rounded" />
          </div>
        </div>
        
        <motion.div 
          className="space-y-6"
          variants={chartContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* First Row of Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bookings Overview Chart */}
            <motion.div variants={chartCardVariants}>
              <Card className="p-6">
                <CardHeader className="pb-4">
                  <div className="flex items-center">
                    <Skeleton className="h-5 w-5 mr-2 rounded-full" />
                    <Skeleton className="h-5 w-40 rounded" />
                  </div>
                  <Skeleton className="h-4 w-64 mt-1 rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <Skeleton className="h-48 w-48 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Monthly Bookings Trends Chart */}
            <motion.div variants={chartCardVariants}>
              <Card className="p-6">
                <CardHeader className="pb-4">
                  <div className="flex items-center">
                    <Skeleton className="h-5 w-5 mr-2 rounded-full" />
                    <Skeleton className="h-5 w-48 rounded" />
                  </div>
                  <Skeleton className="h-4 w-56 mt-1 rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <div className="flex items-end h-48 gap-2 mt-8">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center">
                          <Skeleton className="h-2 w-8 mb-2 rounded" />
                          <Skeleton 
                            className="w-full rounded-t" 
                            style={{ height: `${Math.floor(Math.random() * 40) + 10}px` }} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-center mt-2">
                    <Skeleton className="h-3 w-64 rounded" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Second Row of Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Categories Chart */}
            <motion.div variants={chartCardVariants}>
              <Card className="p-6">
                <CardHeader className="pb-4">
                  <div className="flex items-center">
                    <Skeleton className="h-5 w-5 mr-2 rounded-full" />
                    <Skeleton className="h-5 w-40 rounded" />
                  </div>
                  <Skeleton className="h-4 w-48 mt-1 rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <Skeleton className="h-48 w-48 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Monthly Earnings Chart */}
            <motion.div variants={chartCardVariants}>
              <Card className="p-6">
                <CardHeader className="pb-4">
                  <div className="flex items-center">
                    <Skeleton className="h-5 w-5 mr-2 rounded-full" />
                    <Skeleton className="h-5 w-32 rounded" />
                  </div>
                  <Skeleton className="h-4 w-48 mt-1 rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <div className="flex items-end h-48 gap-2 mt-8">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center">
                          <Skeleton className="h-2 w-8 mb-2 rounded" />
                          <Skeleton 
                            className="w-full rounded-t" 
                            style={{ height: `${Math.floor(Math.random() * 40) + 10}px` }} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Upcoming Services Timeline */}
          <motion.div variants={chartCardVariants}>
            <Card className="p-6">
              <CardHeader className="pb-4">
                <div className="flex items-center">
                  <Skeleton className="h-5 w-5 mr-2 rounded-full" />
                  <Skeleton className="h-5 w-56 rounded" />
                </div>
                <Skeleton className="h-4 w-80 mt-1 rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32 rounded" />
                          <Skeleton className="h-3 w-24 rounded" />
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <Skeleton className="h-4 w-16 rounded" />
                        <Skeleton className="h-3 w-20 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}