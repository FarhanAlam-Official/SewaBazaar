import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Star } from "lucide-react"

interface ServiceQualityRatingProps {
  onQualityChange: (quality: {
    punctuality: number
    quality: number
    communication: number
    value: number
  }) => void
}

export function ServiceQualityRating({ onQualityChange }: ServiceQualityRatingProps) {
  const [ratings, setRatings] = useState({
    punctuality: 0,
    quality: 0,
    communication: 0,
    value: 0
  })

  const handleRatingChange = (category: keyof typeof ratings, value: number) => {
    const newRatings = { ...ratings, [category]: value }
    setRatings(newRatings)
    onQualityChange(newRatings)
  }

  const categories = [
    { key: "punctuality", label: "Punctuality", description: "Was the provider on time?" },
    { key: "quality", label: "Quality", description: "How was the quality of service?" },
    { key: "communication", label: "Communication", description: "How was the communication?" },
    { key: "value", label: "Value", description: "Was the service worth the price?" }
  ]

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Service Quality Ratings</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((category) => (
          <Card key={category.key} className="bg-muted/30">
            <CardContent className="p-3 md:p-4">
              <div className="space-y-2">
                <div>
                  <h4 className="font-medium text-sm">{category.label}</h4>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(category.key as keyof typeof ratings, star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-5 w-5 md:h-6 md:w-6 transition-colors ${
                          star <= (ratings[category.key as keyof typeof ratings] || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 hover:text-yellow-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}