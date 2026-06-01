import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Sprout, 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export function AdminSidebar() {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Courses', icon: BookOpen, path: '/admin/courses' },
    { label: 'Students', icon: Users, path: /^\/admin\/students/, displayPath: '/admin/students' },
    { label: 'Settings', icon: Settings, path: '/admin/settings' }
  ]

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase()
    }
    return 'AD'
  }

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut()
    }
  }

  const isActive = (item) => {
    if (item.isStub) return false
    if (item.path instanceof RegExp) {
      return item.path.test(location.pathname)
    }
    return location.pathname === item.path
  }

  const renderNavItems = () => {
    return navItems.map((item, index) => {
      const Icon = item.icon
      const active = isActive(item)
      const targetPath = item.isStub ? '#' : (item.displayPath || item.path)

      return (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.04, duration: 0.3, ease: 'easeOut' }}
        >
          {item.isStub ? (
            <span
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/40 cursor-not-allowed select-none"
              title="Coming Soon"
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
              <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-white/30 ml-auto font-mono">STUB</span>
            </span>
          ) : (
            <Link
              to={targetPath}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors duration-150 ${
                active 
                  ? 'bg-white/15 text-white shadow-sm' 
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          )}
        </motion.div>
      )
    })
  }

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-[#0F3D2E] p-2.5 rounded-xl text-white shadow-lg border border-white/10 hover:bg-[#15543f] active:scale-95 transition-all"
        aria-label="Toggle Menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <div
        className={`fixed top-0 bottom-0 left-0 bg-[#0F3D2E] w-60 z-40 border-r border-white/5 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Branding Section */}
        <div className="p-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/10 p-1.5 rounded-lg border border-white/5 flex items-center justify-center">
              <Sprout className="w-5 h-5 text-[#C8A96B]" />
            </div>
            <span className="text-white font-extrabold text-xl tracking-tight">
              eduroot
            </span>
          </div>
          <div className="bg-white/10 text-white/70 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full w-fit mt-3 border border-white/5">
            Admin Panel
          </div>

          {/* Navigation Links */}
          <nav className="mt-10 flex flex-col gap-1.5">
            {renderNavItems()}
          </nav>
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-6 border-t border-white/5 bg-[#09271e]/50">
          <div className="flex items-center gap-3">
            <div className="bg-white/15 text-white w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold shadow-sm border border-white/10">
              {getInitials()}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-white font-semibold text-xs truncate">
                {profile?.full_name || 'Administrator'}
              </span>
              <span className="text-white/40 text-[10px] truncate font-mono">
                {user?.email || 'admin@eduroot.online'}
              </span>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="mt-4 w-full flex items-center gap-2 text-white/40 hover:text-white/80 hover:bg-white/5 text-xs py-2 px-3 rounded-lg border border-transparent hover:border-white/5 transition-all duration-150"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default AdminSidebar
