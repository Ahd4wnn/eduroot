import React from 'react'

export function PageLoader() {
  return (
    <div className="bg-[#F8F6F2] min-h-screen flex items-center justify-center p-6 text-center select-none">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#0F3D2E]/20 border-t-[#0F3D2E] animate-spin" />
        <span className="text-sm text-[#5F6368] font-medium tracking-wide">
          Loading...
        </span>
      </div>
    </div>
  )
}

export default PageLoader
