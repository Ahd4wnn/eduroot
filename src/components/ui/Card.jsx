import React from 'react'
import { cn } from '../../lib/utils'

/**
 * Reusable Card component for eduroot.online.
 * Conforms to the 16px (lg) border-radius specification and supports optional translateY lift animations.
 */
export function Card({
  children,
  padding = 'md',
  hoverLift = false,
  className,
  ...props
}) {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      className={cn(
        'bg-white border border-gray-100/50 rounded-lg shadow-card transition-all duration-300',
        paddings[padding],
        hoverLift && 'hover:-translate-y-0.5 hover:shadow-elevated',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
