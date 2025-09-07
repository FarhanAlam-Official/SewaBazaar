import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"

export default function DashboardLoading() {
  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-8"
      >
        {/* Enhanced Header skeleton with gradient animation */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="space-y-3 mb-4 md:mb-0">
            <Skeleton className="h-10 w-80 bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse" />
            <Skeleton className="h-5 w-96 bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-12 w-36 rounded-lg" />
            <Skeleton className="h-12 w-32 rounded-lg" />
          </div>
        </div>
        
        {/* Enhanced Stats skeleton grid with staggered animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-3 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-xl" />
                </div>
                <Skeleton className="h-16 w-full rounded-md" />
              </Card>
            </motion.div>
          ))}
        </div>
        
        {/* Enhanced Content skeleton with realistic proportions */}
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
            >
              <Card className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
                <Skeleton className="h-64 w-full rounded-lg" />
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}