"use client"

import React, { useRef } from "react"
import { motion, useInView } from "framer-motion"

interface TimelineItemProps {
  children: React.ReactNode
  position?: "left" | "right"
  active?: boolean
  isFirst?: boolean
  isLast?: boolean
  icon?: React.ReactNode
  accentColorClass?: string
}

interface TimelineProps {
  children: React.ReactNode
}

const TimelineItem = ({ children, position = "left", active = false, isFirst = false, isLast = false, icon, accentColorClass = "bg-primary" }: TimelineItemProps) => {
  const isLeft = position === "left"
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isInView = useInView(containerRef, { amount: 0.3, once: false })
  const isActive = active || isInView

  return (
    <motion.div
      ref={containerRef}
      className="grid grid-cols-9 gap-4 md:gap-8 items-stretch relative overflow-visible"
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Left side content */}
      <div className={`col-span-9 md:col-span-4 ${isLeft ? '' : 'md:col-start-1 md:hidden'}`}>
        {isLeft && (
          <div className="h-full md:mr-6 relative overflow-visible">
            {/* Connector from spine to card (longer to touch spine) */}
            <div className={`hidden md:block absolute top-6 -right-14 w-14 h-0.5 ${accentColorClass} z-10`} />
            {/* Inner wrapper so accent bar renders inside the card */}
            <div className="relative rounded-xl overflow-visible">
              <div className={`absolute inset-y-0 right-0 w-2 ${accentColorClass} z-20 pointer-events-none`} />
              {/* Notch that visually attaches card to connector and overlaps edge */}
              <div className={`hidden md:block absolute top-5 -right-2 w-3.5 h-3.5 rotate-45 ${accentColorClass} z-30`} />
              <div className="pr-1">
                {children}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Center column with connectors and icon (on spine) */}
      <div className="col-span-9 md:col-span-1 md:col-start-5 flex flex-col items-center relative z-10">
        {/* Top connector */}
        {!isFirst && (
          <motion.div
            className="w-0.5 h-8 bg-gradient-to-b from-primary/30 to-primary/60 rounded"
            animate={{ opacity: isActive ? 1 : 0.4 }}
            transition={{ duration: 0.3 }}
          />
        )}
        {/* Icon on main vertical line */}
        <motion.div className="relative z-10" animate={{ scale: isActive ? 1 : 0.95, opacity: isActive ? 1 : 0.6 }} transition={{ duration: 0.2 }}>
          <div className={`w-10 h-10 rounded-full text-white shadow-lg flex items-center justify-center ${accentColorClass}`}>
            {icon}
          </div>
        </motion.div>
        {/* Bottom connector */}
        {!isLast && (
          <motion.div
            className="w-0.5 h-8 bg-gradient-to-t from-primary/30 to-primary/60 rounded"
            animate={{ opacity: isActive ? 1 : 0.4 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>

      {/* Right side content */}
      <div className={`col-span-9 md:col-span-4 ${isLeft ? 'md:col-start-6 md:hidden' : ''}`}>
        {!isLeft && (
          <div className="h-full md:ml-6 relative overflow-visible">
            {/* Connector from spine to card (longer to touch spine) */}
            <div className={`hidden md:block absolute top-6 -left-14 w-14 h-0.5 ${accentColorClass} z-10`} />
            {/* Inner wrapper so accent bar renders inside the card */}
            <div className="relative rounded-xl overflow-visible">
              <div className={`absolute inset-y-0 left-0 w-2 ${accentColorClass} z-20 pointer-events-none`} />
              {/* Notch that visually attaches card to connector and overlaps edge */}
              <div className={`hidden md:block absolute top-5 -left-2 w-3.5 h-3.5 rotate-45 ${accentColorClass} z-30`} />
              <div className="pl-1">
                {children}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const VerticalTimeline = ({ children }: TimelineProps) => {
  return (
    <div className="relative overflow-visible">
      {/* Central timeline line */}
      <div className="pointer-events-none absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-0.5 z-0">
        <div className="h-full bg-gradient-to-b from-primary/10 via-primary/30 to-primary/10" />
      </div>
      <div className="ml-0 space-y-8 md:space-y-10 relative z-0">
        {children}
      </div>
    </div>
  )
}

VerticalTimeline.Item = TimelineItem

export { VerticalTimeline }