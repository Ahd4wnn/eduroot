import React from 'react'
import { motion } from 'motion/react'

export function StatCard({ value, label, icon: Icon, color = '#0F3D2E', index = 0 }) {
  // Generate 10% opacity background color from hex code
  const bgOpacityColor = `${color}1a` // '1a' is ~10% opacity in hex

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: bgOpacityColor, color: color }}
      >
        {Icon && <Icon className="w-5 h-5" style={{ color: color }} />}
      </div>
      <div className="text-3xl font-bold text-[#111111] tracking-tight">
        {value}
      </div>
      <div className="text-sm text-[#5F6368] mt-1">
        {label}
      </div>
    </motion.div>
  )
}

export default StatCard
