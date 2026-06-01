import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Sprout } from 'lucide-react'

export function NotFound() {
  return (
    <div className="bg-[#F8F6F2] min-h-screen flex items-center justify-center p-6 text-center select-none">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center max-w-md w-full relative"
      >
        {/* Large Background 404 text */}
        <h1 className="text-[120px] font-black text-[#0F3D2E] opacity-10 leading-none select-none tracking-tighter">
          404
        </h1>

        {/* Foreground Content */}
        <div className="relative -mt-10 flex flex-col items-center">
          <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-[#0F3D2E] mb-4">
            <Sprout size={32} />
          </div>
          <h2 className="text-2xl font-bold text-[#111111] tracking-tight">
            Page not found.
          </h2>
          <p className="text-sm text-[#5F6368] mt-2 max-w-[280px] leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <Link
            to="/"
            className="bg-[#0F3D2E] hover:bg-[#15543f] text-white px-6 py-2.5 rounded-xl text-sm font-semibold mt-6 transition-all shadow-sm active:scale-95 text-center w-full sm:w-auto"
          >
            Go back home
          </Link>
          <Link
            to="/courses"
            className="text-sm text-[#0F3D2E] hover:text-[#15543f] font-bold mt-3 block hover:underline transition-colors"
          >
            Browse courses
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default NotFound
