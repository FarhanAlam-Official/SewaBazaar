"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Skeleton loader specifically designed for the payments dashboard page
export function PaymentsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container py-6">
        {/* Page Header Skeleton */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </motion.div>

        {/* Summary Cards Skeleton */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {[1, 2, 3, 4].map((item) => (
            <Card key={item} className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <Skeleton className="h-4 w-20 mt-2" />
              </CardHeader>
              <CardContent className="pt-0">
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Filters Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-6 w-32" />
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment List Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {[1, 2, 3, 4, 5].map((item) => (
                  <motion.div 
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: item * 0.1 }}
                    className="p-6 border-l-4 border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        {/* Payment icon skeleton */}
                        <Skeleton className="w-16 h-16 rounded-2xl" />
                        
                        {/* Payment details skeleton */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                          </div>
                          <Skeleton className="h-4 w-48" />
                          <div className="flex items-center gap-6">
                            <Skeleton className="h-6 w-24 rounded-md" />
                            <Skeleton className="h-6 w-28 rounded-md" />
                            <Skeleton className="h-6 w-20 rounded-md" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Amount and actions skeleton */}
                      <div className="text-right space-y-3">
                        <Skeleton className="h-8 w-32 ml-auto" />
                        <div className="flex items-center gap-2 justify-end">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Pagination skeleton */}
              <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/10 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-10 w-24" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-32 rounded-lg" />
                    <Skeleton className="h-4 w-px" />
                    <Skeleton className="h-8 w-40 rounded-lg" />
                  </div>
                  <Skeleton className="h-10 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

// Simplified skeleton for loading states within the existing component
export function PaymentListSkeleton() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 space-y-4"
    >
      {[...Array(5)].map((_, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center justify-between p-6 border-l-4 border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-6">
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-48" />
              <div className="flex gap-6">
                <Skeleton className="h-6 w-24 rounded-md" />
                <Skeleton className="h-6 w-28 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
            </div>
          </div>
          <div className="text-right space-y-3">
            <Skeleton className="h-8 w-32" />
            <div className="flex gap-2 justify-end">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}