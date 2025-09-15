import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift, Star, Trophy, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

interface RewardNotificationProps {
  rewardPoints: number
  rewardType: "review" | "confirmation" | "referral"
  onClaimReward: () => void
  onViewDetails?: () => void
}

export function RewardNotification({ 
  rewardPoints, 
  rewardType, 
  onClaimReward,
  onViewDetails
}: RewardNotificationProps) {
  
  const getRewardInfo = () => {
    switch (rewardType) {
      case "review":
        return {
          title: "Thanks for your review!",
          description: "You've earned reward points for sharing your experience.",
          color: "from-green-50 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-900/10",
          border: "border-emerald-500",
          icon: <Star className="h-6 w-6 text-yellow-500" />
        }
      case "confirmation":
        return {
          title: "Service confirmed!",
          description: "Thanks for confirming the service delivery. Here are your points.",
          color: "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/10",
          border: "border-blue-500",
          icon: <Sparkles className="h-6 w-6 text-blue-500" />
        }
      case "referral":
        return {
          title: "Referral bonus unlocked!",
          description: "Your friend joined SewaBazaar. Enjoy your reward points!",
          color: "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/10",
          border: "border-purple-500",
          icon: <Trophy className="h-6 w-6 text-purple-500" />
        }
      default:
        return {
          title: "Reward available",
          description: "Claim your available reward points.",
          color: "from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/10",
          border: "border-gray-400",
          icon: <Gift className="h-6 w-6 text-gray-600" />
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
            <Button 
              variant="outline" 
              size="lg" 
              onClick={onViewDetails} 
              className="
                border-2 border-blue-300 
                bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 
                hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/30 dark:hover:to-indigo-800/30 
                text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200
                hover:border-blue-400 hover:shadow-md 
                transition-all duration-200 hover:scale-105 
                text-base py-5 px-6 font-medium
              "
            >
              <Sparkles className="h-5 w-5 mr-2" />
              View Rewards
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}