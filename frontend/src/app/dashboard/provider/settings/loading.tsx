"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  User, 
  Bell, 
  CreditCard, 
  Lock, 
  Globe,
  Camera
} from "lucide-react"

export default function ProviderSettingsLoading() {
  return (
    <div className="container py-6">
      <div className="mb-8">
        <Skeleton className="h-8 w-32 mb-2 rounded-xl" />
        <Skeleton className="h-5 w-64 rounded" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-32 rounded-lg" />
        ))}
      </div>

      {/* Profile Settings Card */}
      <Card className="rounded-xl overflow-hidden">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-32 rounded" />
          </div>
          <Skeleton className="h-4 w-64 rounded" />
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-8">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center space-y-6">
              <div className="relative h-32 w-32 rounded-full">
                <Skeleton className="h-full w-full rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <Skeleton className="h-4 w-48 rounded" />
            </div>
            
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-24 rounded" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))}
              
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}