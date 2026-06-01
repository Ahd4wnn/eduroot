import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sprout, CheckCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Password reset execution using Supabase trigger
  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
      })

      if (resetError) throw resetError
      setSuccess(true)
    } catch (err) {
      console.error('Password reset failed:', err.message)
      setError(err.message || 'Failed to send password reset link. Please check your email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-screen bg-[#111111] flex items-center justify-center p-6 text-left select-none">
      <div className="w-full max-w-sm mx-auto">
        
        {/* Main Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col gap-6">
          
          {/* Logo row */}
          <div className="flex items-center gap-2">
            <Sprout size={22} className="text-white" />
            <span className="font-bold text-xl text-white tracking-tight">eduroot</span>
          </div>

          {success ? (
            /* Success confirmation panel */
            <div className="text-center py-4 flex flex-col items-center gap-4">
              <CheckCircle size={48} className="text-[#C8A96B] animate-bounce" />
              <h1 className="text-xl font-bold text-white mt-4">Reset link sent! Check your inbox.</h1>
              
              <Link 
                to="/login" 
                className="mt-6 text-[#C8A96B] text-sm hover:underline font-semibold flex items-center gap-1.5 justify-center"
              >
                <ArrowLeft size={14} />
                <span>Back to login</span>
              </Link>
            </div>
          ) : (
            /* Recovery Input Form */
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <h1 className="text-xl font-bold text-white mt-6">Reset your password</h1>
                <p className="text-sm text-white/50 leading-relaxed">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleReset} className="flex flex-col gap-4">
                
                {/* Email address */}
                <div className="flex flex-col text-left">
                  <label className="text-xs text-white/50 mb-1.5 block">Email</label>
                  <input
                    type="email"
                    placeholder="eg. john@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C8A96B]/60 focus:bg-white/8 transition-all duration-200"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-[#111111] font-semibold text-sm py-3 rounded-xl hover:bg-[#F8F6F2] active:scale-[0.98] transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md select-none"
                >
                  {loading ? (
                    <span className="animate-spin border-2 border-[#111]/20 border-t-[#111] rounded-full w-4 h-4" />
                  ) : (
                    'Reset Password'
                  )}
                </button>

              </form>

              {/* Error messages */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400 text-center font-medium leading-relaxed">
                  {error}
                </div>
              )}

              <div className="text-center border-t border-white/5 pt-4 mt-1 select-none">
                <Link 
                  to="/login" 
                  className="text-xs text-white/40 hover:text-white flex items-center gap-1.5 justify-center transition-colors"
                >
                  <ArrowLeft size={14} className="text-[#C8A96B]" />
                  <span>Back to login</span>
                </Link>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}

export default ForgotPassword
