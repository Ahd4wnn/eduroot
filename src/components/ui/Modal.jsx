import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Reusable modal overlay component for eduroot.online.
 * Portals overlay onto document.body to ensure it renders correctly on top of sticky navigations.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) {
  // Disable parent page scrolling when active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-5xl',
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark backdrop with blur */}
      <div
        className="fixed inset-0 bg-[#111111]/50 backdrop-blur-sm transition-opacity duration-300 cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Surface Box */}
      <div
        className={cn(
          'relative w-full bg-white rounded-lg shadow-elevated border border-gray-100 flex flex-col max-h-[90vh] z-10 transition-all duration-300 transform scale-100 animate-in fade-in zoom-in-95',
          sizes[size]
        )}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          {title ? (
            <h3 className="text-lg font-bold text-primary tracking-tight">{title}</h3>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-textSecondary hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollbox */}
        <div className="flex-1 px-6 py-5 overflow-y-auto text-left">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default Modal
