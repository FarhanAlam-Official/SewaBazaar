/**
 * AnimatedCard Component
 * A reusable card component with built-in hover animations and visual effects
 * Maintains SewaBazaar's design system while adding modern interactions
 */

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HOVER_EFFECTS } from "@/lib/animations";
import { forwardRef, ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: keyof typeof HOVER_EFFECTS;
  glowOnHover?: boolean;
  onClick?: () => void;
  delay?: number; // For staggered animations
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ 
    children, 
    className, 
    hoverEffect = 'lift', 
    glowOnHover = true,
    onClick,
    delay = 0,
    ...props 
  }, ref) => {
    const hoverClasses = [
      HOVER_EFFECTS[hoverEffect],
      glowOnHover && HOVER_EFFECTS.glow,
    ].filter(Boolean).join(' ');

    return (
      <Card
        ref={ref}
        className={cn(
          // Base design system classes from existing components
          "bg-gradient-to-br from-[#FFFFFF] via-[#FDFCFF] to-[#F8F7FF]",
          "dark:from-[#111827] dark:via-[#131A2B] dark:to-[#151C2E]", 
          "border border-[#E9E5FF]/20 dark:border-indigo-950",
          "cursor-pointer group",
          // Animation classes
          hoverClasses,
          "animate-fade-in-up",
          className
        )}
        style={{
          animationDelay: `${delay}ms`,
        }}
        onClick={onClick}
        {...props}
      >
        {children}
      </Card>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";

/**
 * AnimatedCardContent Component
 * Enhanced CardContent with animation-ready styling
 */
interface AnimatedCardContentProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export const AnimatedCardContent = forwardRef<HTMLDivElement, AnimatedCardContentProps>(
  ({ children, className, padding = 'md', ...props }, ref) => {
    const paddingClasses = {
      sm: 'p-4',
      md: 'p-6', 
      lg: 'p-8'
    };

    return (
      <CardContent
        ref={ref}
        className={cn(
          paddingClasses[padding],
          className
        )}
        {...props}
      >
        {children}
      </CardContent>
    );
  }
);

AnimatedCardContent.displayName = "AnimatedCardContent";