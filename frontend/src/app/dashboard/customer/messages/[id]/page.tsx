"use client"

import { use } from "react"
import { ChatPage } from "@/components/messaging"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function IndividualChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { user, isAuthenticated, loading } = useAuth()
  
  const conversationId = parseInt(resolvedParams.id)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 h-[calc(100vh-200px)]">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            <div className="flex flex-col h-full">
              {/* Header skeleton */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </div>
              </div>
              
              {/* Messages skeleton */}
              <div className="flex-1 p-4 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`flex gap-2 ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    {i % 2 !== 0 && <Skeleton className="w-8 h-8 rounded-full" />}
                    <div className={`max-w-[70%] space-y-1`}>
                      <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-[200px]' : 'w-[250px]'} rounded-lg`} />
                      <Skeleton className="h-3 w-[50px]" />
                    </div>
                    {i % 2 === 0 && <Skeleton className="w-8 h-8 rounded-full" />}
                  </div>
                ))}
              </div>
              
              {/* Input skeleton */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-8 h-8" />
                  <Skeleton className="flex-1 h-10" />
                  <Skeleton className="w-8 h-8" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Please login to access messages</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isNaN(conversationId)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive mb-4">Invalid conversation ID</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen w-full">
      <ChatPage 
        conversationId={conversationId}
        currentUser={{
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          avatar: user.profile_picture
        }}
      />
    </div>
  )
}