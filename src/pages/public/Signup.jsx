import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sprout, Eye, EyeOff, CheckCircle, Gift } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useReferral } from '../../hooks/useReferral'

export function Signup() {
  const navigate = useNavigate()
  const { user, role, loading: authLoading } = useAuth()
  const { captureReferralCode, applyReferral } = useReferral()

  const [refCode] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('ref') || localStorage.getItem('eduroot_ref') || ''
  })

  useEffect(() => {
    captureReferralCode()
  }, [])

  // Form parameters
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  // Automatic race-free redirection when user session and profile role are fully loaded
  useEffect(() => {
    if (user && !authLoading) {
      console.log('Signup.jsx: User is authenticated. Redirecting based on role:', role)
      if (role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    }
  }, [user, role, authLoading, navigate])

  // Supabase Signup method
  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setFieldErrors({})

    let hasError = false
    const newFieldErrors = {}

    if (!firstName.trim()) {
      newFieldErrors.firstName = true
      hasError = true
    }
    if (!lastName.trim()) {
      newFieldErrors.lastName = true
      hasError = true
    }
    if (!email.trim() || !email.includes('@')) {
      newFieldErrors.email = true
      hasError = true
    }
    if (!password.trim() || password.length < 8) {
      newFieldErrors.password = true
      hasError = true
    }

    if (hasError) {
      setFieldErrors(newFieldErrors)
      if (password.length < 8) {
        setError('Password must be at least 8 characters.')
      } else {
        setError('Please fill in all fields correctly.')
      }
      setLoading(false)
      return
    }

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: `${firstName} ${lastName}` }
        }
      })

      if (signUpError) throw signUpError
      if (signUpData?.user) {
        await applyReferral(signUpData.user.id)
      }
      setSuccess(true)
    } catch (err) {
      console.error('Signup action encountered error:', err.message)
      setError(err.message || 'Registration failed. Try checking your credentials.')
      setFieldErrors({ firstName: true, lastName: true, email: true, password: true })
    } finally {
      setLoading(false)
    }
  }

  // Google OAuth
  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/dashboard' }
      })
    } catch (err) {
      console.error('Google login failed:', err.message)
    }
  }

  return (
    <div className="h-screen w-screen flex flex-row overflow-hidden bg-[#111111] select-none">
      
      {/* 1. LEFT BRANDED PANEL (45% Width - Hidden on mobile) */}
      <motion.div 
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex lg:w-[45%] bg-[#0F3D2E] text-white flex-col justify-between p-10 relative"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,169,107,0.1),transparent_70%)] pointer-events-none" />
        
        {/* Top Logo */}
        <Link to="/" className="flex items-center gap-2 w-fit relative z-10">
          <Sprout size={22} className="text-[#C8A96B]" />
          <span className="font-bold text-xl text-white tracking-tight">eduroot</span>
        </Link>

        {/* Middle Welcome Content */}
        <div className="flex-1 flex flex-col justify-center relative z-10 text-left max-w-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-4xl font-bold text-white leading-tight tracking-tight mb-4">
              Start learning today.
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-sm text-white/60 max-w-xs leading-relaxed mb-10">
              Complete these simple steps to unlock your courses and start building real skills.
            </p>
          </motion.div>

          {/* Horizontal Step Cards Row */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex gap-3"
          >
            {[
              { num: '01', label: 'Sign up your account', active: true, delay: 0.45 },
              { num: '02', label: 'Set up your profile', active: false, delay: 0.55 },
              { num: '03', label: 'Start learning', active: false, delay: 0.65 }
            ].map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: step.delay, ease: [0.22, 1, 0.36, 1] }}
                className={`rounded-xl p-4 w-32 flex flex-col gap-2 text-left transition-all ${
                  step.active 
                    ? 'bg-white text-[#0F3D2E] shadow-md' 
                    : 'bg-white/10 text-white/60 border border-white/10'
                }`}
              >
                <div 
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    step.active ? 'bg-[#0F3D2E] text-white' : 'bg-white/20 text-white/50'
                  }`}
                >
                  {step.num}
                </div>
                <span className="text-xs font-medium mt-1 leading-tight">{step.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-left">
          <span className="text-xs text-white/30">
            © {new Date().getFullYear()} eduroot.online · All rights reserved
          </span>
        </div>

      </motion.div>

      {/* 2. RIGHT PANEL (55% Width - Full width on mobile) */}
      <motion.div 
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full lg:w-[55%] bg-[#111111] flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-10 overflow-y-auto"
      >
        <div className="max-w-sm w-full mx-auto text-left flex flex-col">
          
          <AnimatePresence mode="wait">
            {success ? (
              /* Success confirmation display */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="text-center py-6 flex flex-col items-center gap-4 w-full"
              >
                <CheckCircle size={48} className="text-[#C8A96B] animate-bounce" />
                <h2 className="text-xl font-bold text-white mt-4">Check your inbox.</h2>
                <p className="text-sm text-white/50 leading-relaxed text-center max-w-xs mt-2">
                  We sent a confirmation link to <span className="text-white font-semibold">{email}</span>. Click it to activate your account.
                </p>
                <Link to="/login" className="text-[#C8A96B] hover:underline font-medium text-sm mt-6">
                  Back to login
                </Link>
              </motion.div>
            ) : (
              /* Active Registration Form */
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col"
              >
                {/* Invite Banner */}
                {refCode && (
                  <div className="mb-5 flex items-center gap-2.5 bg-[#C8A96B]/10 border border-[#C8A96B]/20 rounded-xl px-4 py-3 select-none text-left">
                    <Gift size={16} className="text-[#C8A96B] flex-shrink-0 animate-pulse" />
                    <p className="text-[#C8A96B] text-xs font-semibold">
                      You were invited! Sign up to get started.
                    </p>
                  </div>
                )}

                {/* Header */}
                <motion.div 
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="mb-8"
                >
                  <h1 className="text-2xl font-bold text-white tracking-tight">Sign Up</h1>
                  <p className="text-sm text-white/45 mt-1 leading-relaxed">Create your account to access all courses.</p>
                </motion.div>

                {/* OAuth options (Google only - full width) */}
                <motion.div 
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="mb-6 select-none"
                >
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-medium text-white/80 hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="flex-shrink-0">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Google</span>
                  </button>
                </motion.div>

                {/* Divider */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="flex items-center mb-6 select-none"
                >
                  <hr className="flex-1 border-white/10" />
                  <span className="text-xs text-white/30 px-3 font-medium">or</span>
                  <hr className="flex-1 border-white/10" />
                </motion.div>

                {/* Core form */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <form onSubmit={handleSignup} className="flex flex-col gap-4">
                    
                    {/* First and Last names row */}
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-white/50 mb-1.5 block">First Name</label>
                        <input
                          type="text"
                          placeholder="eg. John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C8A96B]/60 focus:bg-white/8 focus:ring-2 focus:ring-[#C8A96B]/20 transition-all duration-200 ${
                            fieldErrors.firstName 
                              ? 'border-red-500/60 bg-red-500/5' 
                              : 'border-white/10'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-white/50 mb-1.5 block">Last Name</label>
                        <input
                          type="text"
                          placeholder="eg. Sharma"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C8A96B]/60 focus:bg-white/8 focus:ring-2 focus:ring-[#C8A96B]/20 transition-all duration-200 ${
                            fieldErrors.lastName 
                              ? 'border-red-500/60 bg-red-500/5' 
                              : 'border-white/10'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Email address */}
                    <div className="flex flex-col">
                      <label className="text-xs text-white/50 mb-1.5 block">Email</label>
                      <input
                        type="email"
                        placeholder="eg. john@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C8A96B]/60 focus:bg-white/8 focus:ring-2 focus:ring-[#C8A96B]/20 transition-all duration-200 ${
                          fieldErrors.email 
                            ? 'border-red-500/60 bg-red-500/5' 
                            : 'border-white/10'
                        }`}
                      />
                    </div>

                    {/* Password field */}
                    <div className="flex flex-col">
                      <label className="text-xs text-white/50 mb-1.5 block">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className={`w-full bg-white/5 border rounded-xl px-4 pr-10 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C8A96B]/60 focus:bg-white/8 focus:ring-2 focus:ring-[#C8A96B]/20 transition-all duration-200 ${
                            fieldErrors.password 
                              ? 'border-red-500/60 bg-red-500/5' 
                              : 'border-white/10'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 focus:outline-none"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <span className="text-xs text-white/30 mt-1 select-none block">
                        Must be at least 8 characters.
                      </span>
                    </div>

                    {/* Submit button */}
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.1 }}
                      className="mt-6 w-full bg-white text-[#111111] font-semibold text-sm py-3 rounded-xl hover:bg-[#F8F6F2] active:scale-[0.98] transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md select-none"
                    >
                      {loading ? (
                        <span className="animate-spin border-2 border-[#111]/20 border-t-[#111] rounded-full w-4 h-4" />
                      ) : (
                        'Create Account'
                      )}
                    </motion.button>

                  </form>
                </motion.div>

                {/* Validation errors */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 text-xs text-red-400 text-center font-semibold leading-relaxed"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom Login redirect links */}
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.55 }}
                  className="mt-5 text-center text-xs text-white/40 select-none"
                >
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#C8A96B] hover:underline font-medium">
                    Log in
                  </Link>
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>

    </div>
  )
}

export default Signup
