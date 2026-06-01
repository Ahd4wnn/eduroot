import React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

/**
 * Reusable premium Button component for eduroot.online.
 * Inherits deep transitions and subtle hover/active scale interactions without framer-motion.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  children,
  type = 'button',
  href,
  className,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none'

  // Match the precise hex/custom color specifications from design tokens
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-light focus:ring-primary',
    secondary: 'border-2 border-primary text-primary hover:bg-primary hover:text-white bg-transparent focus:ring-primary',
    accent: 'bg-accent text-primary hover:bg-accent-light focus:ring-accent',
    ghost: 'text-primary hover:bg-primary/10 bg-transparent focus:ring-primary',
  }

  // Border-radius sizes matching tokens (sm: 6px, md: 10px, lg: 16px)
  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-sm',
    md: 'text-sm px-5 py-2.5 rounded-md',
    lg: 'text-base px-7 py-3.5 rounded-lg',
  }

  const isLink = !!href
  const isExternal = isLink && (href.startsWith('http') || href.startsWith('//') || href.startsWith('mailto:') || href.startsWith('tel:'))

  const renderContent = () => (
    <>
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </>
  )

  const mergedClasses = cn(
    baseStyles,
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    className
  )

  if (isLink) {
    if (isExternal) {
      return (
        <a href={href} className={mergedClasses} target="_blank" rel="noopener noreferrer" {...props}>
          {renderContent()}
        </a>
      )
    }
    return (
      <Link to={href} className={mergedClasses} {...props}>
        {renderContent()}
      </Link>
    )
  }

  return (
    <button
      type={type}
      className={mergedClasses}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {renderContent()}
    </button>
  )
}
export default Button
