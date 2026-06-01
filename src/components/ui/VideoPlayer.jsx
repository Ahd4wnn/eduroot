import React, { useRef } from 'react'
import ReactPlayer from 'react-player'
import { PlayCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function VideoPlayer({
  url,
  lessonTitle,
  onComplete,
  isCompleted = false,
  onEnded,
  autoPlay = false
}) {
  const playerRef = useRef(null)

  return (
    <div 
      className="relative bg-black rounded-2xl overflow-hidden shadow-md border border-white/5" 
      style={{ aspectRatio: '16/9' }}
    >
      {/* react-player */}
      {url ? (
        <ReactPlayer
          ref={playerRef}
          url={url}
          src={url}
          playing={autoPlay}
          width="100%"
          height="100%"
          controls={true}
          onEnded={onEnded}
          onError={(err) => {
            console.warn('ReactPlayer encountered load error:', err)
            toast.error('Failed to load video. Verify the URL, internet connection, or if video embedding is restricted.')
          }}
          config={{
            youtube: {
              playerVars: {
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                controls: 1
              }
            },
            vimeo: {
              playerOptions: {
                byline: false,
                portrait: false,
                title: false,
                controls: true
              }
            }
          }}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111111]">
          <PlayCircle size={48} className="text-white/20" />
          <p className="text-white/40 text-sm mt-3 font-medium">
            No video available for this lesson
          </p>
        </div>
      )}
    </div>
  )
}

export default VideoPlayer
