import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, User, Mail, Link as LinkIcon, BookOpen, AlertTriangle, Copy } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useReferral } from '../../hooks/useReferral'

export function Settings() {
  const { user, profile, session } = useAuth()
  const navigate = useNavigate()
  const { getReferralStats, getReferralLink } = useReferral()

  // Profile State
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [referralStats, setReferralStats] = useState(null)

  // Password Reset State
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  // Enrollments State
  const [enrollments, setEnrollments] = useState([])
  const [progress, setProgress] = useState({})
  const [loadingEnrollments, setLoadingEnrollments] = useState(true)

  // Initials derived from full_name
  const initials = fullName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setAvatarUrl(profile.avatar_url || '')
    }
  }, [profile])

  // On mount, fetch referral stats
  useEffect(() => {
    if (session?.user?.id) {
      getReferralStats(session.user.id).then(setReferralStats)
    }
  }, [session])

  useEffect(() => {
    if (!user) return

    const fetchEnrollmentsData = async () => {
      try {
        // Fetch enrolled courses
        const { data: enrollData, error: enrollErr } = await supabase
          .from('enrollments')
          .select(`
            courses ( id, title, slug )
          `)
          .eq('user_id', user.id)

        if (enrollErr) throw enrollErr
        setEnrollments(enrollData || [])

        // Fetch course progress
        const { data: progData, error: progErr } = await supabase
          .from('course_progress_view')
          .select('*')
          .eq('user_id', user.id)

        if (progErr) {
          console.error('Settings: Progress fetch failed:', progErr.message)
        } else {
          const progressMap = {}
          progData?.forEach(item => {
            progressMap[item.course_id] = Number(item.progress_pct || 0)
          })
          setProgress(progressMap)
        }
      } catch (err) {
        console.error('Settings: Error loading settings info:', err)
      } finally {
        setLoadingEnrollments(false)
      }
    }

    fetchEnrollmentsData()
  }, [user])

  const handleProfileSave = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error('Full name is required.')
      return
    }

    setProfileSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          avatar_url: avatarUrl.trim() || null
        })
        .eq('id', session.user.id)

      if (error) throw error
      toast.success('Profile updated!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to update profile.')
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    setPasswordError('')

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setPasswordSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Password updated!')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to update password.')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleGlobalSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out of all devices?')) {
      try {
        const { error } = await supabase.auth.signOut({ scope: 'global' })
        if (error) throw error
        toast.success('Signed out successfully!')
        navigate('/')
      } catch (err) {
        console.error(err)
        toast.error('Error signing out.')
      }
    }
  }

  // Styles helpers
  const inputStyle = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#111111] bg-white placeholder:text-gray-400 focus:outline-none focus:border-[#0F3D2E] focus:ring-2 focus:ring-[#0F3D2E]/10 transition-all duration-200"
  const disabledInputStyle = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500 bg-gray-50 cursor-not-allowed"

  return (
    <div className="bg-[#F8F6F2] min-h-screen text-[#111111] font-sans pb-16">
      
      {/* HEADER SECTION */}
      <header className="bg-white border-b border-gray-100 px-8 py-6 text-left select-none">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold text-[#111111]">Settings</h1>
          <p className="text-sm text-[#5F6368] mt-1">
            Manage your account and preferences.
          </p>
        </div>
      </header>

      {/* CONTENT PORTAL */}
      <main className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6 text-left">

        {/* SECTION 1: PROFILE */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-base font-semibold text-[#111111] mb-5 select-none">Profile</h2>

          {/* Avatar Area */}
          <div className="flex items-center gap-4 mb-6 select-none">
            <div className="w-16 h-16 rounded-full bg-[#0F3D2E] flex items-center justify-center text-white text-xl font-bold shadow-sm overflow-hidden flex-shrink-0">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              ) : initials}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[#111111]">Profile photo</span>
              <span className="text-xs text-[#5F6368] mt-0.5">Update via URL below.</span>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block select-none">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="eg. John Doe"
                  className={inputStyle}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block select-none">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className={disabledInputStyle}
              />
              <p className="text-[11px] text-[#5F6368] mt-1.5 ml-1 select-none">
                Email cannot be changed here.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block select-none">Avatar Image URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className={inputStyle}
              />
              <p className="text-[11px] text-[#5F6368] mt-1.5 ml-1 select-none">
                Paste a direct image URL for your profile photo.
              </p>
            </div>

            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={profileSaving}
                className="bg-[#0F3D2E] hover:bg-[#1a5c44] text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-sm transition-all duration-150 disabled:opacity-50 select-none cursor-pointer"
              >
                {profileSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* SECTION 1.5: REFERRAL PROGRAM */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-left">
          <h2 className="text-base font-semibold text-[#111111] mb-1 select-none">
            Referral Program
          </h2>
          <p className="text-xs text-[#5F6368] mb-6 select-none">
            Share your link. When someone signs up and enrolls, you both benefit.
          </p>

          {referralStats ? (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-6 select-none">
                {[
                  { label: 'Total referrals', value: referralStats.total_referrals },
                  { label: 'Signed up',       value: referralStats.signed_up },
                  { label: 'Enrolled',        value: referralStats.enrolled },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#F8F6F2] rounded-xl p-3 text-center border border-gray-100 shadow-inner">
                    <p className="text-xl sm:text-2xl font-bold text-[#0F3D2E]">
                      {stat.value}
                    </p>
                    <p className="text-[10px] text-[#5F6368] font-semibold mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Referral link copy */}
              <div>
                <label className="text-xs font-semibold text-[#5F6368] mb-2 block select-none">
                  Your referral link
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#F8F6F2] border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-[#5F6368] truncate font-mono select-all">
                    {getReferralLink(referralStats.code)}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        getReferralLink(referralStats.code)
                      )
                      toast.success('Link copied!')
                    }}
                    className="flex-shrink-0 flex items-center gap-1.5 bg-[#0F3D2E] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#1a5c44] transition-colors cursor-pointer select-none active:scale-95"
                  >
                    <Copy size={13} />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#5F6368] mt-2 select-none">
                  Your code: <span className="font-mono font-bold text-[#0F3D2E]">{referralStats.code}</span>
                </p>
              </div>

              {/* Share buttons */}
              <div className="flex flex-wrap gap-2.5 mt-4 select-none">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Join me on eduroot and learn Digital Marketing, Graphic Design, or Video Editing! Use my link: ${getReferralLink(referralStats.code)}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold text-[#111111] hover:bg-gray-50 transition-colors"
                >
                  Share on WhatsApp
                </a>
                
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `Learning digital skills on @edurootonline — check it out:`
                  )}&url=${encodeURIComponent(getReferralLink(referralStats.code))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold text-[#111111] hover:bg-gray-50 transition-colors"
                >
                  Share on X
                </a>
              </div>
            </>
          ) : (
            // Loading skeleton
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
              <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          )}
        </div>

        {/* SECTION 2: CHANGE PASSWORD */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-base font-semibold text-[#111111] mb-5 select-none">Change Password</h2>

          <form onSubmit={handlePasswordSave} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block select-none">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className={`${inputStyle} pr-10`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block select-none">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className={`${inputStyle} pr-10`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordError && (
                <p className="text-[11px] text-red-500 font-medium mt-1.5 ml-1 select-none">
                  {passwordError}
                </p>
              )}
            </div>

            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={passwordSaving}
                className="bg-[#0F3D2E] hover:bg-[#1a5c44] text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-sm transition-all duration-150 disabled:opacity-50 select-none cursor-pointer"
              >
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* SECTION 3: ENROLLED COURSES SUMMARY */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5 select-none">
            <h2 className="text-base font-semibold text-[#111111]">My Courses</h2>
            <Link 
              to="/dashboard" 
              className="text-xs font-bold text-[#0F3D2E] hover:underline"
            >
              {enrollments.length} enrolled — View all &rarr;
            </Link>
          </div>

          {loadingEnrollments ? (
            <div className="text-sm text-gray-400 italic">Retrieving syllabus config...</div>
          ) : enrollments.length === 0 ? (
            <div className="text-sm text-gray-400 italic">You are not enrolled in any courses yet.</div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {enrollments.map((item) => {
                const course = item.courses
                const progressPct = progress[course.id] || 0
                return (
                  <div 
                    key={course.id} 
                    className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="flex flex-col min-w-0 pr-4">
                      <Link 
                        to={`/learn/${course.slug}`} 
                        className="text-sm font-bold text-[#111111] hover:text-[#0F3D2E] truncate block transition-colors"
                      >
                        {course.title}
                      </Link>
                      <span className="text-[10px] text-gray-400 font-semibold mt-0.5">
                        {progressPct}% completed
                      </span>
                    </div>

                    <div className="w-24 flex-shrink-0">
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#0F3D2E] rounded-full" 
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* SECTION 4: DANGER ZONE */}
        <div className="bg-white rounded-2xl p-6 border border-red-100 shadow-sm">
          <h2 className="text-base font-semibold text-red-500 mb-4 select-none">Danger Zone</h2>
          <p className="text-xs text-[#5F6368] mb-5 select-none leading-relaxed">
            Take note that this sign-out scope will instantly clear all persistent browser storage session keys and log you out of this account globally from every active device.
          </p>

          <button
            type="button"
            onClick={handleGlobalSignOut}
            className="border border-red-200 hover:bg-red-50 text-red-500 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-150 select-none cursor-pointer"
          >
            Sign out of all devices
          </button>
        </div>

      </main>
    </div>
  )
}

export default Settings
