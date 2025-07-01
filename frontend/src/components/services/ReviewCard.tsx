import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Edit, Trash } from "lucide-react"
import Image from "next/image"

interface ReviewCardProps {
  review: {
    id: string
    serviceName: string
    providerName: string
    rating: number
    comment: string
    date: string
    images?: string[]
  }
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  canModify?: boolean
}

export function ReviewCard({ review, onEdit, onDelete, canModify = false }: ReviewCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="font-semibold">{review.serviceName}</h3>
          <p className="text-sm text-muted-foreground">{review.providerName}</p>
        </div>
        <div className="flex items-center gap-2">
          {canModify && (
            <>
              <Button variant="ghost" size="icon" onClick={() => onEdit?.(review.id)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete?.(review.id)}>
                <Trash className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                }`}
              />
            ))}
            <span className="ml-2 text-sm text-muted-foreground">{review.date}</span>
          </div>
          <p className="text-sm">{review.comment}</p>
          {review.images && review.images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {review.images.map((image, index) => (
                <div key={index} className="relative aspect-square overflow-hidden rounded-md">
                  <Image
                    src={image}
                    alt={`Review image ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 