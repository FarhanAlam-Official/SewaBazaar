import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift, Star, Trophy, Sparkles } from "lucide-react"
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
          icon: <Star className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />,
          title: "Review Reward",
          description: "Thank you for leaving a review! You've earned reward points.",
          color: "from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20",
          border: "border-l-yellow-500"
        }
      case "confirmation":
        return {
          icon: <Trophy className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />,
          title: "Confirmation Reward",
          description: "Thanks for confirming your service! Here are your reward points.",
          color: "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
          border: "border-l-blue-500"
        }
      case "referral":
        return {
          icon: <Gift className="h-5 w-5 md:h-6 md:w-6 text-green-500" />,
          title: "Referral Reward",
          description: "You've earned points for referring a friend!",
          color: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
          border: "border-l-green-500"
        }
      default:
        return {
          icon: <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />,
          title: "Reward Earned",
          description: "You've earned reward points!",
          color: "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",
          border: "border-l-purple-500"
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
      <Card className={`border-l-4 ${rewardInfo.border} bg-gradient-to-r ${rewardInfo.color} shadow-lg`}>
        <CardHeader className="pb-3 p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                {rewardInfo.icon}
              </div>
              <div>
                <CardTitle className="text-xl">{rewardInfo.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  {rewardInfo.description}
                </p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white self-start text-base py-2 px-4 shadow-md">
              +{rewardPoints} pts
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 p-5 md:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={onClaimReward}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-base py-5 px-6 shadow-md"
            >
              <Gift className="h-5 w-5 mr-2" />
              Claim Reward
            </Button>
            <Button variant="outline" size="lg" className="border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20 text-base py-5 px-6">
              View Rewards
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}