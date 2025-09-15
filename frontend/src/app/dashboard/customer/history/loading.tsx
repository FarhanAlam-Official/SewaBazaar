"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { 
  TrendingUp, 
  Filter, 
  Search,
  Clock,
  CalendarIcon,
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from "lucide-react"

export default function ServiceHistoryLoading() {
  return (
    <div className="container py-6">
      {/* Page Header with title and search */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="text-3xl font-bold text-foreground flex items-center gap-3 dark:text-foreground">
              <TrendingUp className="h-8 w-8 text-primary" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-5 w-96 mt-2" />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
              <Skeleton className="h-10 w-64 pl-10 rounded-md" />
            </div>
            <Skeleton className="h-10 w-10 rounded-md md:hidden" />
          </div>
        </div>

        {/* Filters Section */}
        <motion.div
          initial={false}
          animate={{ height: "auto" }}
          className="overflow-hidden"
        >
          <Card className="mb-6 dark:bg-background/50 dark:border-border">
            <CardHeader>
              <div className="flex items-center gap-2 dark:text-foreground">
                <Filter className="h-5 w-5" />
                <Skeleton className="h-6 w-32" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <Skeleton className="h-10 w-full md:w-[240px]" />
                <Skeleton className="h-10 w-full md:w-[240px]" />
                <Skeleton className="h-10 w-full md:w-[240px]" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Results Summary */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-64" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </motion.div>

      {/* Booking Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(9).fill(0).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="h-full dark:bg-background/50 dark:border-border">
              <CardHeader className="p-0 relative">
                <div className="relative h-48 w-full overflow-hidden">
                  <div className="w-full h-full bg-muted flex items-center justify-center dark:bg-muted/20">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-start">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-24 mt-2" />
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between border-t border-border pt-6 mt-6 dark:border-border">
        <div className="text-sm text-muted-foreground dark:text-muted-foreground">
          <Skeleton className="h-4 w-64" />
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-9 w-24" />
            <div className="flex items-center space-x-1">
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
              <div className="w-9 h-9 flex items-center justify-center text-muted-foreground dark:text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </div>
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}