import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sprout, Menu, X, ChevronDown, LogOut, Trophy, BookOpen, Settings } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const location = useLocation()
  const { user, profile, signOut, isAdmin } = useAuth()
  const dropdownRef = useRef(null)

  const isLanding = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu and dropdown on route change
  useEffect(() => {
    setMobileOpen(false)
    setDropdownOpen(false)
  }, [location.pathname])

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'
  const initials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  /*
   * Color logic:
   * Landing + not scrolled → transparent bg, DARK text (hero is warm white #F8F6F2)
   * Landing + scrolled     → white bg + blur, DARK text
   * Any other page         → white bg, DARK text always
   *
   * Result: text is always dark (#111111) — readable on both light bg and white navbar.
   * The only thing that changes is the navbar background itself.
   */
  const isTransparent = isLanding && !scrolled

  const navBg = isTransparent
    ? 'bg-transparent'
    : 'bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm'

  // Text is ALWAYS dark — visible on warm white hero AND white navbar bg
  const linkClass =
    'text-sm font-medium text-[#111111] hover:text-[#0F3D2E] transition-colors duration-200'

  const logoTextClass = 'font-bold text-lg text-[#0F3D2E]'

  // Hide header and its spacer on full-screen standalone auth routes (called after all hook executions)
  const hideNavRoutes = ['/login', '/signup', '/forgot-password']
  if (hideNavRoutes.includes(location.pathname)) {
    return null
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Sprout size={20} className="text-[#C8A96B]" />
            <span className={logoTextClass}>eduroot</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/courses" className={linkClass}>Courses</Link>
            <Link to="/leaderboard" className={linkClass}>Leaderboard</Link>
            <Link to="/#about" className={linkClass}>About</Link>
            {user && (
              <Link to="/dashboard" className={linkClass}>Dashboard</Link>
            )}
          </div>

          {/* Desktop CTA buttons or User Profile Dropdown */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(prev => !prev)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer select-none"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0F3D2E] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {initials}
                  </div>
                  <span className="text-sm font-semibold text-[#111111] max-w-[120px] truncate">
                    {displayName.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Card */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-150 py-2 w-48 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-xs font-medium text-gray-400">Signed in as</p>
                      <p className="text-sm font-bold text-[#111111] truncate">{displayName}</p>
                    </div>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2.5 text-sm text-[#0F3D2E] font-semibold hover:bg-gray-50 border-b border-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Admin Panel ↗
                      </Link>
                    )}
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <BookOpen size={14} className="text-gray-400" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Settings size={14} className="text-gray-400" />
                      <span>Settings</span>
                    </Link>
                    <Link
                      to="/leaderboard"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Trophy size={14} className="text-gray-400" />
                      <span>Leaderboard</span>
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => {
                        setDropdownOpen(false)
                        signOut()
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full text-left transition-colors cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-[#111111] hover:text-[#0F3D2E] transition-colors duration-200 px-3 py-1.5"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-semibold bg-[#0F3D2E] text-white px-4 py-2 rounded-lg hover:bg-[#1a5c44] transition-colors duration-200"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger — always dark icon */}
          <button
            className="md:hidden p-2 text-[#111111] hover:text-[#0F3D2E] transition-colors"
            onClick={() => setMobileOpen(prev => !prev)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4 shadow-lg">
            <Link to="/courses" className="text-sm font-medium text-[#111111] hover:text-[#0F3D2E] py-2">
              Courses
            </Link>
            <Link to="/leaderboard" className="text-sm font-medium text-[#111111] hover:text-[#0F3D2E] py-2">
              Leaderboard
            </Link>
            <Link to="/#about" className="text-sm font-medium text-[#111111] hover:text-[#0F3D2E] py-2">
              About
            </Link>
            {user ? (
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-3 px-2 py-1">
                  <div className="w-9 h-9 rounded-full bg-[#0F3D2E] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#111111] leading-tight">{displayName}</span>
                    <span className="text-xs text-gray-400 truncate max-w-[200px]">{user.email}</span>
                  </div>
                </div>
                <Link
                  to="/dashboard"
                  className="text-sm font-semibold text-[#111111] hover:text-[#0F3D2E] py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/settings"
                  className="text-sm font-semibold text-[#111111] hover:text-[#0F3D2E] py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Settings
                </Link>
                <Link
                  to="/leaderboard"
                  className="text-sm font-semibold text-[#111111] hover:text-[#0F3D2E] py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Leaderboard
                </Link>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 text-sm font-semibold text-red-500 hover:bg-red-50 py-2.5 px-2 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-150 pt-4 flex flex-col gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-center text-[#111111] border border-gray-200 rounded-lg py-2.5 hover:bg-gray-50 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-semibold text-center bg-[#0F3D2E] text-white rounded-lg py-2.5 hover:bg-[#1a5c44] transition-colors"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Spacer so page content doesn't hide under fixed navbar */}
      <div className="h-16" />
    </>
  )
}
