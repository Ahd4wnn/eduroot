import React, { forwardRef } from 'react'
import { cn } from '../../lib/utils'

/**
 * Reusable controlled/uncontrolled Input component for eduroot.online.
 * Supports a normal inputs and textareas under one component reference.
 */
export const Input = forwardRef(({
  label,
  error,
  helperText,
  type = 'text',
  textarea = false,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`

  // Base class setups: border 1px #e5e5e5, focus border 2px #0F3D2E, border-radius md (10px)
  const inputStyles = cn(
    'w-full px-4 py-2.5 rounded-md border border-[#e5e5e5] bg-white text-[#111111] transition-all duration-200 focus:outline-none focus:border-2 focus:border-primary placeholder:text-gray-400 disabled:opacity-50 disabled:bg-gray-50',
    error && 'border-red-500 focus:border-red-500 focus:ring-0',
    className
  )

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-primary select-none">
          {label}
        </label>
      )}

      {textarea ? (
        <textarea
          id={inputId}
          ref={ref}
          className={cn(inputStyles, 'resize-y min-h-[100px]')}
          {...props}
        />
      ) : (
        <input
          id={inputId}
          ref={ref}
          type={type}
          className={inputStyles}
          {...props}
        />
      )}

      {error ? (
        <p className="text-xs text-red-500 font-medium mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-textSecondary mt-0.5">{helperText}</p>
      ) : null}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
