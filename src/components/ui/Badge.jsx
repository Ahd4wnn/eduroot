import React from 'react'
import { cn } from '../../lib/utils'

/**
 * Reusable Badge component for eduroot.online.
 * Formats statuses, categories, or course tags in neat rounded-full pills.
 */
export function Badge({
  children,
  variant = 'default',
  className,
  ...props
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-600 border-gray-250',
    success: 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]',
    warning: 'bg-[rgba(200,169,107,0.12)] text-primary border-[rgba(200,169,107,0.3)]', // gold using accent color
    new: 'bg-[rgba(15,61,46,0.08)] text-primary border-[rgba(15,61,46,0.18)]', // primary deep green
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors duration-200',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export default Badge
