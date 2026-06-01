import React from 'react'

export function Skeleton({ 
  width = '100%', 
  height = '16px', 
  rounded = 'md', 
  className = '' 
}) {
  const getRoundedClass = (r) => {
    switch (r) {
      case 'none': return 'rounded-none'
      case 'sm': return 'rounded-sm'
      case 'md': return 'rounded-md'
      case 'lg': return 'rounded-lg'
      case 'xl': return 'rounded-xl'
      case '2xl': return 'rounded-2xl'
      case 'full': return 'rounded-full'
      default: return 'rounded-md'
    }
  }

  const roundedClass = getRoundedClass(rounded)

  return (
    <div
      className={`bg-gray-200/80 animate-pulse ${roundedClass} ${className}`}
      style={{ width, height }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col text-left">
      {/* Thumbnail Aspect-Ratio box */}
      <div className="aspect-video w-full animate-shimmer" />

      {/* Body details */}
      <div className="p-5 flex flex-col gap-3">
        {/* Category badge skeleton */}
        <Skeleton height="12px" width="40%" rounded="md" />

        {/* Title skeleton */}
        <Skeleton height="20px" width="80%" rounded="md" className="mt-1" />

        {/* Description lines skeletons */}
        <div className="flex flex-col gap-1.5 mt-2">
          <Skeleton height="12px" width="60%" rounded="sm" />
          <Skeleton height="12px" width="45%" rounded="sm" />
        </div>

        {/* Action button skeleton */}
        <Skeleton height="36px" width="100%" rounded="xl" className="mt-4" />
      </div>
    </div>
  )
}

export default Skeleton
