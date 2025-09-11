import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift, Star, Trophy } from "lucide-react"
import { motion } from "framer-motion"

interface RewardNotificationProps {
  rewardPoints: number
  rewardType: "review" | "confirmation" | "referral"
  onClaimReward: () => void
}

export function RewardNotification({ 
  rewardPoints, 
  rewardType, 
  onClaimReward 
}: RewardNotificationProps) {
  const getRewardInfo = () => {
    switch (rewardType) {
      case "review":
        return {
          icon: <Star className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />,
          title: "Review Reward",
          description: "Thank you for leaving a review! You've earned reward points."
        }
      case "confirmation":
        return {
          icon: <Trophy className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />,
          title: "Confirmation Reward",
          description: "Thanks for confirming your service! Here are your reward points."
        }
      case "referral":
        return {
          icon: <Gift className="h-4 w-4 md:h-5 md:w-5 text-green-500" />,
          title: "Referral Reward",
          description: "You've earned points for referring a friend!"
        }
      default:
        return {
          icon: <Gift className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />,
          title: "Reward Earned",
          description: "You've earned reward points!"
        }
    }
  }

  const rewardInfo = getRewardInfo()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10">
        <CardHeader className="pb-3 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                {rewardInfo.icon}
              </div>
              <div>
                <CardTitle className="text-base md:text-lg">{rewardInfo.title}</CardTitle>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  {rewardInfo.description}
                </p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 self-start text-xs">
              +{rewardPoints} pts
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <Button 
              onClick={onClaimReward}
              size="sm"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-xs md:text-sm"
            >
              <Gift className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden xs:inline">Claim Reward</span>
              <span className="xs:hidden">Claim</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs md:text-sm">
              View Rewards
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}