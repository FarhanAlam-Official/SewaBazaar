import { motion } from "framer-motion";
import { MessageSquare, Clock, Star, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface EnhancedStatsCardProps {
  reviewsCount: number;
  pendingCount: number;
  averageRating: number;
  userPoints: number;
  onRefresh: () => void;
}

export function EnhancedStatsCard({ 
  reviewsCount, 
  pendingCount, 
  averageRating, 
  userPoints,
  onRefresh
}: EnhancedStatsCardProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            My Reviews
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your service reviews and feedback
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Your Points</div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Gift className="h-5 w-5" />
              {userPoints}
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRefresh}
            className="hidden sm:flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Enhanced Stats Cards with Better Spacing and Visual Hierarchy */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        role="region"
        aria-label="Review Statistics"
      >
        <motion.div 
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/20 rounded-xl p-5 shadow-sm border border-blue-200 dark:border-blue-800/50 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1"
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {reviewsCount}
          </div>
          <div className="text-sm font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Reviews
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-900/20 rounded-xl p-5 shadow-sm border border-amber-200 dark:border-amber-800/50 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1"
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2">
            {pendingCount}
          </div>
          <div className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/20 rounded-xl p-5 shadow-sm border border-green-200 dark:border-green-800/50 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1"
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
            {typeof averageRating === 'number' ? averageRating.toFixed(1) : '0.0'}
          </div>
          <div className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            Avg Rating
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}