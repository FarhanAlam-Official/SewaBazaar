"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { Bell } from "lucide-react"

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
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

const LoadingNotificationCard = () => (
  <motion.div
    variants={item}
    className="group"
  >
    <Card className="border-0 shadow-sm bg-card">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start space-x-4">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-2">
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

export default function ProviderNotificationsLoading() {
  return (
    <motion.div 
      className="container mx-auto py-8 px-4 max-w-5xl"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
          }
        }
      }}
    >
      {/* Enhanced Header */}
      <motion.div variants={headerVariants} className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <Skeleton className="h-10 w-64 rounded-xl" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-5 w-80" />
          </div>
          
          {/* Action Buttons Skeleton */}
          <motion.div 
            className="flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </motion.div>
        </div>
      </motion.div>

      {/* Enhanced Search and Filters Skeleton */}
      <motion.div 
        variants={headerVariants}
        className="mb-6 p-4 bg-card/50 backdrop-blur-sm border rounded-xl shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          
          {/* Type Filter */}
          <Skeleton className="h-10 w-full rounded-md" />
          
          {/* Read Status Filter */}
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </motion.div>

      {/* Enhanced Content Area */}
      <motion.div variants={headerVariants}>
        <Card className="border shadow-lg bg-white dark:bg-gradient-to-br dark:from-card dark:via-card dark:to-card/95 backdrop-blur-sm">
          <CardContent className="p-6">
            <motion.div 
              className="space-y-4"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {[...Array(4)].map((_, i) => (
                <LoadingNotificationCard key={i} />
              ))}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}