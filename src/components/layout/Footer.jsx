import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sprout, Mail, ArrowRight } from 'lucide-react'

/**
 * Premium Dark Footer Layout for eduroot.online.
 * Stacks smoothly to single columns on mobile displays.
 */
export function Footer() {
  const location = useLocation()
  const currentYear = new Date().getFullYear()

  // Hide footer on full-screen standalone auth routes
  const hideFooterRoutes = ['/login', '/signup', '/forgot-password']
  if (hideFooterRoutes.includes(location.pathname)) {
    return null
  }

  return (
    <footer className="bg-bgDark text-white border-t border-white/5 pt-16 pb-8 select-none">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 pb-12 border-b border-white/5">
        
        {/* Brand Information Column */}
        <div className="flex flex-col gap-4 text-left">
          <Link to="/" className="flex items-center gap-2 group w-fit">
            <div className="bg-white/10 p-1.5 rounded-md transition-colors duration-250 group-hover:bg-accent/20">
              <Sprout className="w-5 h-5 text-accent" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              eduroot<span className="text-accent">.online</span>
            </span>
          </Link>
          <p className="text-sm text-gray-400 max-w-sm leading-relaxed mt-2">
            Providing industry-aligned masterclasses in modern creative and marketing skills. Learn at your own pace from experienced practitioners and gain career credentials.
          </p>
        </div>

        {/* Featured Course Links Column */}
        <div className="flex flex-col gap-4 text-left">
          <h4 className="text-xs font-bold uppercase tracking-widest text-accent">Popular Skills</h4>
          <nav className="flex flex-col gap-3 mt-2">
            <Link 
              to="/courses/digital-marketing-bootcamp" 
              className="text-sm text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-1.5 group"
            >
              <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 text-accent" />
              <span>Digital Marketing Masterclass</span>
            </Link>
            <Link 
              to="/courses/graphic-design-mastery" 
              className="text-sm text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-1.5 group"
            >
              <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 text-accent" />
              <span>Graphic Designing Mastery</span>
            </Link>
            <Link 
              to="/courses/video-editing-cinematic" 
              className="text-sm text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-1.5 group"
            >
              <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 text-accent" />
              <span>Cinematic Video Editing</span>
            </Link>
          </nav>
        </div>

        {/* Corporate / Support Column */}
        <div className="flex flex-col gap-4 text-left">
          <h4 className="text-xs font-bold uppercase tracking-widest text-accent">Company</h4>
          <nav className="flex flex-col gap-3 mt-2">
            <Link to="/about" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">
              About Our Vision
            </Link>
            <a 
              href="mailto:support@eduroot.online" 
              className="text-sm text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-2"
            >
              <Mail className="w-4 h-4 text-accent" />
              <span>support@eduroot.online</span>
            </a>
            <Link to="/privacy-policy" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">
              Privacy & Security Policy
            </Link>
          </nav>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-gray-500">
          &copy; {currentYear} eduroot.online. All rights reserved.
        </p>
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <span>Made with</span>
          <span className="text-red-500 hover:scale-110 transition-transform duration-200 animate-pulse">❤</span>
          <span>in India</span>
        </p>
      </div>
    </footer>
  )
}

export default Footer
