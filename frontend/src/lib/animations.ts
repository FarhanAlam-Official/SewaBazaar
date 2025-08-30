/**
 * Animation utilities for SewaBazaar
 * Provides reusable animation configurations and CSS classes
 * Maintains brand consistency across the application
 */

// Animation timing functions
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 700,
} as const;

export const EASING = {
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  bounceOut: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  smoothOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

// Common animation variants for framer-motion (if used) or CSS classes
export const FADE_IN_UP = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' }
};

export const FADE_IN_DOWN = {
  initial: { opacity: 0, y: -30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' }
};

export const FADE_IN_LEFT = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.5, ease: 'easeOut' }
};

export const FADE_IN_RIGHT = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.5, ease: 'easeOut' }
};

export const SCALE_IN = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.4, ease: 'easeOut' }
};

export const STAGGER_CONTAINER = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

// CSS Animation classes for simple animations without motion libraries
export const CSS_ANIMATIONS = {
  fadeInUp: 'animate-fade-in-up',
  fadeInDown: 'animate-fade-in-down',
  fadeInLeft: 'animate-fade-in-left',
  fadeInRight: 'animate-fade-in-right',
  scaleIn: 'animate-scale-in',
  slideUp: 'animate-slide-up',
  bounceIn: 'animate-bounce-in',
} as const;

// Hover effects
export const HOVER_EFFECTS = {
  lift: 'hover:-translate-y-2 transition-transform duration-300 ease-out',
  scale: 'hover:scale-105 transition-transform duration-300 ease-out',
  glow: 'hover:shadow-lg hover:shadow-primary/20 transition-shadow duration-300',
  brightGlow: 'hover:shadow-xl hover:shadow-primary/30 transition-shadow duration-300',
  subtleScale: 'hover:scale-[1.02] transition-transform duration-200 ease-out',
} as const;

// Loading states
export const LOADING_ANIMATIONS = {
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
  ping: 'animate-ping',
} as const;

// Scroll-based animations configuration
export const SCROLL_ANIMATIONS = {
  threshold: 0.1, // Trigger when 10% of element is visible
  rootMargin: '0px 0px -50px 0px', // Trigger 50px before element comes into view
  triggerOnce: true, // Only animate once
} as const;

// Button press animations
export const BUTTON_PRESS = {
  scale: 'active:scale-95 transition-transform duration-100',
  lift: 'active:translate-y-0.5 transition-transform duration-100',
} as const;

// Animation delays for staggered effects
export const STAGGER_DELAYS = {
  sm: 100,   // 0.1s
  md: 200,   // 0.2s
  lg: 300,   // 0.3s
  xl: 400,   // 0.4s
} as const;