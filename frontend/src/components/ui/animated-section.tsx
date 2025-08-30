/**
 * AnimatedSection Component
 * A container component that handles scroll-based animations
 * Provides fade-in effects when sections come into view
 */

'use client';

import { cn } from "@/lib/utils";
import { ReactNode, useEffect, useRef, useState } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animation?: 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn';
  delay?: number;
  threshold?: number;
  once?: boolean;
}

export function AnimatedSection({ 
  children, 
  className,
  animation = 'fadeInUp',
  delay = 0,
  threshold = 0.1,
  once = true
}: AnimatedSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
            if (once) {
              setHasAnimated(true);
            }
          }, delay);
          
          // Disconnect observer if animation should only happen once
          if (once) {
            observer.disconnect();
          }
        } else if (!once && !hasAnimated) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [delay, threshold, once, hasAnimated]);

  const animationClasses = {
    fadeInUp: isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
    fadeInDown: isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8',
    fadeInLeft: isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8',
    fadeInRight: isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8',
    scaleIn: isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
  };

  return (
    <div
      ref={sectionRef}
      className={cn(
        'transition-all duration-700 ease-out',
        animationClasses[animation],
        className
      )}
    >
      {children}
    </div>
  );
}