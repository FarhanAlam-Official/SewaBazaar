import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

interface EnhancedStatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'cyan';
  growth?: number;
}

export function EnhancedStatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  tone = 'primary',
  growth
}: EnhancedStatsCardProps) {
  const toneClasses: Record<string, { 
    card: string
    pill: string
    icon: string
    border: string
    shadow: string
  }> = {
    primary: { 
      card: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30',
      pill: 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 dark:from-blue-400/20 dark:to-indigo-400/20',
      icon: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700',
      shadow: 'shadow-blue-100/50 dark:shadow-blue-900/20 hover:shadow-blue-200/60 dark:hover:shadow-blue-800/30'
    },
    success: { 
      card: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 hover:from-emerald-100 hover:to-green-100 dark:hover:from-emerald-950/30 dark:hover:to-green-950/30',
      pill: 'bg-gradient-to-br from-emerald-500/20 to-green-500/20 dark:from-emerald-400/20 dark:to-green-400/20',
      icon: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200/50 dark:border-emerald-800/50 hover:border-emerald-300 dark:hover:border-emerald-700',
      shadow: 'shadow-emerald-100/50 dark:shadow-emerald-900/20 hover:shadow-emerald-200/60 dark:hover:shadow-emerald-800/30'
    },
    danger: { 
      card: 'bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20 hover:from-rose-100 hover:to-red-100 dark:hover:from-rose-950/30 dark:hover:to-red-950/30',
      pill: 'bg-gradient-to-br from-rose-500/20 to-red-500/20 dark:from-rose-400/20 dark:to-red-400/20',
      icon: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-200/50 dark:border-rose-800/50 hover:border-rose-300 dark:hover:border-rose-700',
      shadow: 'shadow-rose-100/50 dark:shadow-rose-900/20 hover:shadow-rose-200/60 dark:hover:shadow-rose-800/30'
    },
    warning: { 
      card: 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 hover:from-amber-100 hover:to-yellow-100 dark:hover:from-amber-950/30 dark:hover:to-yellow-950/30',
      pill: 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 dark:from-amber-400/20 dark:to-yellow-400/20',
      icon: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200/50 dark:border-amber-800/50 hover:border-amber-300 dark:hover:border-amber-700',
      shadow: 'shadow-amber-100/50 dark:shadow-amber-900/20 hover:shadow-amber-200/60 dark:hover:shadow-amber-800/30'
    },
    info: { 
      card: 'bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950/20 dark:to-sky-950/20 hover:from-cyan-100 hover:to-sky-100 dark:hover:from-cyan-950/30 dark:hover:to-sky-950/30',
      pill: 'bg-gradient-to-br from-cyan-500/20 to-sky-500/20 dark:from-cyan-400/20 dark:to-sky-400/20',
      icon: 'text-cyan-600 dark:text-cyan-400',
      border: 'border-cyan-200/50 dark:border-cyan-800/50 hover:border-cyan-300 dark:hover:border-cyan-700',
      shadow: 'shadow-cyan-100/50 dark:shadow-cyan-900/20 hover:shadow-cyan-200/60 dark:hover:shadow-cyan-800/30'
    },
    purple: { 
      card: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 hover:from-purple-100 hover:to-violet-100 dark:hover:from-purple-950/30 dark:hover:to-violet-950/30',
      pill: 'bg-gradient-to-br from-purple-500/20 to-violet-500/20 dark:from-purple-400/20 dark:to-violet-400/20',
      icon: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200/50 dark:border-purple-800/50 hover:border-purple-300 dark:hover:border-purple-700',
      shadow: 'shadow-purple-100/50 dark:shadow-purple-900/20 hover:shadow-purple-200/60 dark:hover:shadow-purple-800/30'
    },
    cyan: { 
      card: 'bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/20 dark:to-teal-950/20 hover:from-cyan-100 hover:to-teal-100 dark:hover:from-cyan-950/30 dark:hover:to-teal-950/30',
      pill: 'bg-gradient-to-br from-cyan-500/20 to-teal-500/20 dark:from-cyan-400/20 dark:to-teal-400/20',
      icon: 'text-cyan-600 dark:text-cyan-400',
      border: 'border-cyan-200/50 dark:border-cyan-800/50 hover:border-cyan-300 dark:hover:border-cyan-700',
      shadow: 'shadow-cyan-100/50 dark:shadow-cyan-900/20 hover:shadow-cyan-200/60 dark:hover:shadow-cyan-800/30'
    },
  };

  const c = toneClasses[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring", damping: 20, stiffness: 100 }}
      whileHover={{ 
        y: -6,
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      className="group"
    >
      <Card className={`p-6 ${c.card} ${c.border} ${c.shadow} transition-all duration-500 ease-out group-hover:shadow-xl`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1 group-hover:text-foreground/80 transition-colors duration-300">
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground group-hover:scale-105 transition-transform duration-300">
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-2 group-hover:text-foreground/70 transition-colors duration-300">
              {subtitle}
            </p>
          </div>
          <div className={`p-3 ${c.pill} rounded-xl group-hover:scale-110 transition-all duration-300 group-hover:rotate-3`}>
            <Icon className={`h-6 w-6 ${c.icon} group-hover:drop-shadow-sm transition-all duration-300`} />
          </div>
        </div>
        {growth !== undefined && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center text-xs">
              <TrendingUp className={`h-3 w-3 mr-1 ${growth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              <span className={growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {growth >= 0 ? '+' : ''}{growth}% from last period
              </span>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}