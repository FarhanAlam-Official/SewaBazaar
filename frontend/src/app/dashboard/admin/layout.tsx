import { ReactNode } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <ScrollArea className="flex-1 h-full">
        <main className="flex-1 p-6 space-y-8">
          {children}
        </main>
      </ScrollArea>
    </div>
  )
} 