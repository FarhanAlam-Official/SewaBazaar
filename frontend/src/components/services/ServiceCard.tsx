import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Star } from "lucide-react"
import Image from "next/image"

interface ServiceCardProps {
  service: {
    id: string
    name: string
    provider: string
    image: string
    rating: number
    price: number
    date?: string
    time?: string
    location?: string
    status?: 'completed' | 'upcoming' | 'cancelled'
  }
  variant?: 'history' | 'wishlist' | 'default'
  onAction?: (id: string) => void
  actionLabel?: string
}

export function ServiceCard({ service, variant = 'default', onAction, actionLabel }: ServiceCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 w-full">
        <Image
          src={service.image || "/placeholder.jpg"}
          alt={service.name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{service.name}</span>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{service.rating}</span>
          </div>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{service.provider}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {service.date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span>{service.date}</span>
            </div>
          )}
          {service.time && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>{service.time}</span>
            </div>
          )}
          {service.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              <span>{service.location}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-4">
            <span className="text-lg font-bold">Rs. {service.price}</span>
            {onAction && actionLabel && (
              <Button onClick={() => onAction(service.id)}>{actionLabel}</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 