import React from 'react'
import { Link2, ExternalLink } from 'lucide-react'

export function VideoUrlInput({ label, value = '', onChange, helper, compact = false }) {
  const isYouTube = value.includes('youtube.com') || value.includes('youtu.be')
  const isVimeo = value.includes('vimeo.com')

  // Common styles
  const inputBaseStyle = "w-full border border-gray-200 rounded-xl pl-9 text-sm text-[#111111] bg-white placeholder:text-gray-400 focus:outline-none focus:border-[#0F3D2E] focus:ring-2 focus:ring-[#0F3D2E]/10 transition-all duration-200"
  
  // Compact specific sizing vs full size
  const inputStyle = compact 
    ? `${inputBaseStyle} py-1.5 pr-3 text-xs w-48` 
    : `${inputBaseStyle} py-2.5 pr-4`

  return (
    <div className={compact ? "flex flex-col w-48 flex-shrink-0" : "w-full"}>
      {/* Label (Omitted if compact) */}
      {!compact && label && (
        <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block text-left">
          {label}
        </label>
      )}

      {/* Input container */}
      <div className="relative">
        <Link2 className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={compact ? "Video URL..." : "https://youtube.com/watch?v=..."}
          className={inputStyle}
        />
      </div>

      {/* Helper text (Omitted if compact) */}
      {!compact && helper && (
        <p className="text-xs text-gray-400 mt-1 text-left">{helper}</p>
      )}

      {/* Detection Badge */}
      {value && (isYouTube || isVimeo) && (
        <div className={`flex items-center gap-1.5 mt-1.5 text-[10px] md:text-xs font-medium w-fit ${
          isYouTube 
            ? 'bg-red-50 text-red-600 border border-red-100 rounded-lg px-2.5 py-0.5 md:py-1' 
            : 'bg-blue-50 text-blue-600 border border-blue-100 rounded-lg px-2.5 py-0.5 md:py-1'
        }`}>
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
          <span>{isYouTube ? 'YouTube video detected' : 'Vimeo video detected'}</span>
        </div>
      )}
    </div>
  )
}

export default VideoUrlInput
