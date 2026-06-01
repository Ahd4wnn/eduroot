import React from 'react'
import { motion } from 'motion/react'
import { toast } from 'react-hot-toast'

export function showBadgeToast(badge) {
  toast.custom((t) => (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-center gap-4 bg-white rounded-2xl
        shadow-lg border border-gray-100 px-5 py-4 max-w-sm
        ${t.visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Badge icon circle */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center
          text-2xl flex-shrink-0"
        style={{ backgroundColor: badge.color + '18' }}
      >
        {badge.icon}
      </div>

      {/* Content */}
      <div className="flex-1 text-left">
        <p className="text-[10px] font-bold uppercase tracking-widest
          text-[#C8A96B] mb-0.5">
          Badge Earned!
        </p>
        <p className="text-sm font-bold text-[#111111]">{badge.name}</p>
        <p className="text-xs text-[#5F6368] mt-0.5">{badge.description}</p>
      </div>

      {/* XP reward */}
      <div className="flex-shrink-0 text-center">
        <p className="text-lg font-bold text-[#0F3D2E]">+{badge.xp_reward}</p>
        <p className="text-[10px] text-[#5F6368]">XP</p>
      </div>
    </motion.div>
  ), { duration: 4500 })
}
