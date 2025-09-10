/**
 * StaggeredContainer Component
 * Provides staggered animation effects for child elements
 * Ideal for lists, grids, and sequential content reveals
 */

'use client';

import { cn } from "@/lib/utils";
import { ReactNode, Children, cloneElement, isValidElement, useState, useEffect } from "react";

interface StaggeredContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number; // Delay between each child animation in ms
  animation?: 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn';
  startDelay?: number; // Initial delay before first animation starts
}

export function StaggeredContainer({ 
  children, 
  className,
  staggerDelay = 100,
  animation = 'fadeInUp',
  startDelay = 0
}: StaggeredContainerProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const childrenArray = Children.toArray(children);

  return (
    <div className={cn("space-y-4", className)}>
      {childrenArray.map((child, index) => {
        const delay = startDelay + (index * staggerDelay);
        
        if (isValidElement(child)) {
          // Only apply animations on the client side to prevent hydration mismatches
          const animationClass = isClient 
            ? `animate-${animation.toLowerCase().replace(/([A-Z])/g, '-$1')}` 
            : '';
          const animationDelay = isClient ? `${delay}ms` : '0ms';
          
          return cloneElement(child as React.ReactElement<any>, {
            key: index,
            className: cn(
              child.props.className,
              animationClass
            ),
            style: {
              ...child.props.style,
              animationDelay,
            }
          });
        }
        
        // Only apply animations on the client side to prevent hydration mismatches
        const animationClass = isClient 
          ? `animate-${animation.toLowerCase().replace(/([A-Z])/g, '-$1')}` 
          : '';
        const animationDelay = isClient ? `${delay}ms` : '0ms';
        
        return (
          <div
            key={index}
            className={animationClass}
            style={{ animationDelay }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}

/**
 * InteractiveIcon Component
 * Animated icon wrapper with hover effects and optional pulse/bounce
 */
interface InteractiveIconProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  hoverEffect?: 'scale' | 'bounce' | 'glow' | 'rotate';
  onClick?: () => void;
}

export function InteractiveIcon({
  children,
  className,
  size = 'md',
  variant = 'default',
  hoverEffect = 'scale',
  onClick
}: InteractiveIconProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const variantClasses = {
    default: 'text-muted-foreground dark:text-indigo-200/60',
    primary: 'text-primary dark:text-indigo-400',
    secondary: 'text-secondary dark:text-blue-400',
    accent: 'text-accent dark:text-purple-400'
  };

  const hoverEffectClasses = {
    scale: 'hover:scale-110 transition-transform duration-200 ease-out',
    bounce: 'hover:animate-bounce',
    glow: 'hover:drop-shadow-lg hover:brightness-125 transition-all duration-200',
    rotate: 'hover:rotate-12 transition-transform duration-200 ease-out'
  };

  return (
    <div
      className={cn(
        sizeClasses[size],
        variantClasses[variant],
        hoverEffectClasses[hoverEffect],
        onClick && 'cursor-pointer',
        'inline-flex items-center justify-center',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/**
 * ScrollProgressBar Component
 * Shows reading/scroll progress for long content
 */
export function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const updateProgress = () => {
      const scrollPx = document.documentElement.scrollTop;
      const winHeightPx = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = scrollPx / winHeightPx;
      setProgress(scrolled * 100);
    };

    window.addEventListener('scroll', updateProgress);
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  // Don't render on server to prevent hydration mismatches
  if (!isClient) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-muted/20 z-50">
      <div 
        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}