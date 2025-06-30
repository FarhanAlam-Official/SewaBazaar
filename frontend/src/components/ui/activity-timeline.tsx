import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TimelineItem {
  id: string | number
  title: string
  description: string
  timestamp: string
  type: "info" | "success" | "warning" | "error"
  icon?: React.ReactNode
}

interface ActivityTimelineProps {
  items: TimelineItem[]
  title?: string
  className?: string
  maxHeight?: number
}

export function ActivityTimeline({
  items,
  title = "Activity Timeline",
  className,
  maxHeight = 400,
}: ActivityTimelineProps) {
  const getTypeStyles = (type: TimelineItem["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-500"
      case "warning":
        return "bg-yellow-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="pr-4" style={{ maxHeight }}>
          <div className="space-y-8">
            {items.map((item, index) => (
              <div key={item.id} className="relative">
                {/* Vertical line */}
                {index !== items.length - 1 && (
                  <div
                    className="absolute left-2.5 top-10 h-full w-px bg-border"
                    aria-hidden="true"
                  />
                )}
                <div className="flex gap-4">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "mt-2 h-6 w-6 rounded-full flex items-center justify-center",
                      getTypeStyles(item.type)
                    )}
                  >
                    {item.icon ? (
                      item.icon
                    ) : (
                      <div className="h-3 w-3 rounded-full bg-white" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium leading-none">{item.title}</h4>
                      <Badge variant="secondary" className="rounded-full">
                        {item.timestamp}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 