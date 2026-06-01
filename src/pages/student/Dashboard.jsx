import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Toaster, toast } from 'react-hot-toast'
import { 
  BookOpen, Calendar, LogOut, Loader2, ArrowRight, TrendingUp, Palette, Video, Settings, Lock 
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useXP } from '../../hooks/useXP'
import { LeaderboardPreview } from '../../components/ui/LeaderboardPreview'

export function Dashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  // State Management
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [progress, setProgress] = useState({})
  const [mounted, setMounted] = useState(false)

  const {
    totalXP, level, nextLevel, progress: xpProgress,
    badges, allBadges, loading: xpLoading
  } = useXP(user?.id)

  useEffect(() => {
    // 300ms delay to animate progress bars on mount
    const timer = setTimeout(() => setMounted(true), 300)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!user) return

    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        // 1. Fetch user profile
        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single()

        if (profileErr) {
          console.warn('Dashboard: Profile retrieval encountered warning:', profileErr.message)
        } else {
          setUserProfile(profileData)
        }

        // 2. Fetch enrolled courses
        const { data: enrollData, error: enrollErr } = await supabase
          .from('enrollments')
          .select(`
            enrolled_at,
            courses (
              id, title, slug, category,
              thumbnail_url, total_lessons, price
            )
          `)
          .eq('user_id', user.id)

        if (enrollErr) throw enrollErr
        setEnrollments(enrollData || [])

        // 3. Fetch progress for each course
        const { data: progData, error: progErr } = await supabase
          .from('course_progress_view')
          .select('*')
          .eq('user_id', user.id)

        if (progErr) {
          console.error('Dashboard: Progress retrieval failed:', progErr.message)
        } else {
          const progressMap = {}
          progData?.forEach(item => {
            progressMap[item.course_id] = Number(item.progress_pct || 0)
          })
          setProgress(progressMap)
        }

      } catch (err) {
        console.error('Dashboard: Error pulling dashboard data:', err)
        toast.error('Failed to load dashboard data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  // Greeting helper based on first name
  const studentName = userProfile?.full_name || profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Learner'
  const firstName = studentName.split(' ')[0]

  // Count stats
  const enrolledCount = enrollments.length
  const completedCoursesList = enrollments.filter(e => progress[e.courses.id] === 100)
  const completedCount = completedCoursesList.length

  // Category gradients and icons
  const getCategoryGradient = (cat) => {
    switch(cat) {
      case 'digital-marketing':
        return 'linear-gradient(135deg, #0F3D2E 0%, #1a5c44 100%)'
      case 'graphic-designing':
        return 'linear-gradient(135deg, #C8A96B 0%, #e8c98a 100%)'
      case 'video-editing':
        return 'linear-gradient(135deg, #111111 0%, #2a2a2a 100%)'
      default:
        return 'linear-gradient(135deg, #0F3D2E 0%, #111111 100%)'
    }
  }

  const getCategoryIcon = (cat) => {
    switch(cat) {
      case 'digital-marketing': return TrendingUp
      case 'graphic-designing': return Palette
      case 'video-editing': return Video
      default: return BookOpen
    }
  }

  const isMainLoading = loading || xpLoading

  return (
    <div className="bg-[#F8F6F2] min-h-screen text-[#111111] font-sans pb-16">
      <Toaster position="top-right" />
      
      {/* 1. DASHBOARD HEADER */}
      <motion.section 
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white border-b border-gray-150 py-8 px-6 sm:px-8 select-none"
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
              Good morning, {firstName}. 👋
            </h1>
            <p className="text-sm text-[#5F6368] mt-1.5 font-medium">
              Here's where you left off.
            </p>
          </div>

          {/* Level & XP Stats */}
          {!isMainLoading && level && (
            <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
              <div className="flex flex-wrap items-center gap-3 select-none">
                {/* Level Badge */}
                <div 
                  className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold shadow-sm border"
                  style={{ 
                    backgroundColor: `${level.color}15`, 
                    borderColor: level.color, 
                    color: level.color 
                  }}
                >
                  <span>{level.emoji}</span>
                  <span>Level {level.name}</span>
                </div>
                
                {/* XP Count */}
                <div className="bg-[#F8F6F2] border border-gray-200/80 rounded-full px-4 py-1.5 text-xs font-semibold text-[#111111] shadow-sm">
                  <span className="font-extrabold text-[#0F3D2E]">{totalXP}</span> XP
                </div>

                <Link
                  to="/settings"
                  className="bg-white border border-gray-250 hover:border-[#0F3D2E] hover:text-[#0F3D2E] rounded-full px-4 py-1.5 text-xs font-semibold text-[#5F6368] shadow-sm flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
                >
                  <Settings size={13} />
                  <span>Settings</span>
                </Link>
              </div>

              {/* Level XP Progress Bar */}
              <div className="w-full md:w-64 flex flex-col gap-1 mt-1">
                <div className="flex justify-between text-[10px] text-[#5F6368] font-bold">
                  <span>XP Progress</span>
                  <span>
                    {nextLevel ? `${totalXP} / ${nextLevel.minXp} XP` : 'Max Level achieved!'}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200/30">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${xpProgress}%`,
                      backgroundColor: level.color
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.section>

      {/* Loading Skeleton */}
      {isMainLoading ? (
        <div className="max-w-6xl mx-auto px-6 py-12 text-left">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white rounded-2xl p-5 border border-gray-100 flex flex-col gap-4 shadow-sm h-[320px]">
                <div className="w-full aspect-video bg-gray-150 rounded-xl animate-pulse" />
                <div className="h-3 w-1/4 bg-gray-150 rounded animate-pulse" />
                <div className="h-5 w-3/4 bg-gray-150 rounded animate-pulse" />
                <div className="h-2 w-full bg-gray-100 rounded animate-pulse mt-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* 2. MY COURSES SECTION */}
          <section className="max-w-6xl mx-auto px-6 py-10 text-left">
            <div className="flex items-center justify-between mb-8 select-none">
              <h2 className="text-xl font-bold text-[#111111] tracking-tight">My Courses</h2>
              <Link to="/courses" className="text-xs font-bold text-[#0F3D2E] hover:text-[#1a5c44] flex items-center gap-1 transition-colors">
                Browse more courses <ArrowRight size={12} />
              </Link>
            </div>

            {enrollments.length === 0 ? (
              /* Empty state card */
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-250 p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto shadow-sm select-none">
                <div className="bg-[#F8F6F2] p-4 rounded-full border border-gray-200 mb-4 text-[#C8A96B]">
                  <BookOpen size={36} />
                </div>
                <h3 className="text-lg font-bold text-[#111111]">No courses yet</h3>
                <p className="text-sm text-[#5F6368] mt-1.5 max-w-xs leading-relaxed">
                  Browse our practical course catalog and start building real-world skills today.
                </p>
                <Link
                  to="/courses"
                  className="bg-[#0F3D2E] hover:bg-[#1a5c44] text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all duration-200 mt-6"
                >
                  Browse Courses
                </Link>
              </div>
            ) : (
              /* Enrolled Courses Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.map((enrollment, index) => {
                  const course = enrollment.courses
                  const progressPct = progress[course.id] || 0
                  const isCompleted = progressPct === 100
                  const categoryGradient = getCategoryGradient(course.category)
                  const CategoryIcon = getCategoryIcon(course.category)
                  
                  const formattedEnrolledDate = enrollment.enrolled_at
                    ? new Date(enrollment.enrolled_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'Recent'

                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      className="bg-white rounded-2xl overflow-hidden border border-gray-150/70 shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all duration-250 flex flex-col"
                    >
                      {/* Thumbnail with overlay badge if complete */}
                      <div
                        className="relative aspect-video flex items-center justify-center select-none border-b border-gray-100"
                        style={{
                          background: course.thumbnail_url
                            ? `url(${course.thumbnail_url}) center/cover`
                            : categoryGradient
                        }}
                      >
                        {!course.thumbnail_url && (
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                            <CategoryIcon className="w-12 h-12 text-white/85" />
                          </div>
                        )}
                        
                        {isCompleted && (
                          <span className="absolute top-3.5 right-3.5 bg-[#0F3D2E]/80 backdrop-blur-sm text-white text-[10px] font-extrabold tracking-wide py-1 px-3 rounded-full shadow-sm flex items-center gap-1 select-none">
                            ✓ Completed
                          </span>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-5 flex-grow flex flex-col justify-between gap-4 text-left">
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-[#C8A96B] font-bold block mb-1">
                            {course.category.replace('-', ' ')}
                          </span>
                          <h3 className="text-base font-extrabold text-[#111111] leading-snug hover:text-[#0f3d2e] transition-colors">
                            <Link to={`/learn/${course.slug}`}>{course.title}</Link>
                          </h3>
                        </div>

                        {/* Progress Section */}
                        <div className="flex flex-col gap-1.5 mt-2 select-none">
                          <div className="flex items-center justify-between text-[11px] text-[#5F6368] font-bold">
                            <span>Your progress</span>
                            <span className="text-[#0F3D2E]">{progressPct}% complete</span>
                          </div>
                          
                          {/* Animated Progress Bar */}
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#0F3D2E] rounded-full"
                              style={{
                                width: mounted ? `${progressPct}%` : '0%',
                                transition: 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)'
                              }}
                            />
                          </div>
                        </div>

                        {/* Meta Indicators */}
                        <div className="flex items-center justify-start gap-4 text-[10px] text-[#5F6368] font-semibold border-t border-gray-50 pt-3 select-none">
                          <span className="flex items-center gap-1.5">
                            <BookOpen size={12} className="text-[#C8A96B]" />
                            {course.total_lessons} {course.total_lessons === 1 ? 'lesson' : 'lessons'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-[#C8A96B]" />
                            Enrolled {formattedEnrolledDate}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50 flex gap-3 text-center select-none">
                        {progressPct === 0 ? (
                          <button
                            onClick={() => navigate(`/learn/${course.slug}`)}
                            className="w-full bg-[#0F3D2E] hover:bg-[#1a5c44] text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm"
                          >
                            Start Learning →
                          </button>
                        ) : progressPct < 100 ? (
                          <button
                            onClick={() => navigate(`/learn/${course.slug}`)}
                            className="w-full bg-[#0F3D2E] hover:bg-[#1a5c44] text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm"
                          >
                            Continue Learning →
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/learn/${course.slug}`)}
                            className="w-full bg-[#0F3D2E] hover:bg-[#1a5c44] text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm"
                          >
                            Review Course
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </section>

          {/* 3. ACHIEVEMENTS & BADGES SECTION */}
          {allBadges && allBadges.length > 0 && (
            <section className="max-w-6xl mx-auto px-6 pb-12 text-left select-none">
              <h2 className="text-xl font-bold text-[#111111] tracking-tight mb-6">Achievements & Badges</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {allBadges.map((badge) => {
                  const earned = badges.some(b => b.badge_id === badge.id)
                  const earnedDetails = badges.find(b => b.badge_id === badge.id)
                  const formattedEarnedDate = earnedDetails?.earned_at
                    ? new Date(earnedDetails.earned_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })
                    : null

                  return (
                    <motion.div
                      key={badge.id}
                      whileHover={earned ? { y: -4, scale: 1.02 } : {}}
                      className={`relative rounded-2xl p-5 border flex flex-col items-center justify-between text-center transition-all duration-300 h-[190px] ${
                        earned 
                          ? 'bg-white border-gray-150/70 shadow-sm' 
                          : 'bg-white/40 border-gray-200/50 opacity-50'
                      }`}
                    >
                      {/* Badge Icon / Lock */}
                      <div 
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-inner mb-2 relative ${
                          earned ? '' : 'bg-gray-100'
                        }`}
                        style={earned ? { backgroundColor: `${badge.color}15` } : {}}
                      >
                        {earned ? (
                          badge.icon
                        ) : (
                          <Lock size={20} className="text-gray-400" />
                        )}
                      </div>

                      {/* Badge Details */}
                      <div>
                        <h4 className="font-extrabold text-sm text-[#111111] leading-tight">
                          {badge.name}
                        </h4>
                        <p className="text-[10px] text-[#5F6368] font-medium mt-1 leading-snug px-1">
                          {badge.description}
                        </p>
                      </div>

                      {/* Reward/Status */}
                      <div className="mt-2.5 w-full">
                        {earned ? (
                          <span className="text-[9px] bg-[#0F3D2E]/10 text-[#0F3D2E] font-bold px-2 py-0.5 rounded-full">
                            Earned {formattedEarnedDate}
                          </span>
                        ) : (
                          <span className="text-[9px] bg-gray-150 text-gray-500 font-bold px-2 py-0.5 rounded-full">
                            +{badge.xp_reward} XP
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </section>
          )}

          {/* 4. LEADERBOARD PREVIEW SECTION */}
          <section className="max-w-6xl mx-auto px-6 pb-16 text-left">
            <div className="flex items-center justify-between mb-6 select-none">
              <div>
                <h2 className="text-xl font-bold text-[#111111] tracking-tight">Global Leaderboard</h2>
                <p className="text-xs text-[#5F6368] mt-1 font-medium">Top learning performers this week.</p>
              </div>
              <Link to="/leaderboard" className="text-xs font-bold text-[#0F3D2E] hover:text-[#1a5c44] flex items-center gap-1 transition-colors">
                View Full Standings <ArrowRight size={12} />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2">
                <LeaderboardPreview currentUserName={studentName} />
              </div>
              <div className="bg-white rounded-2xl border border-gray-150/70 p-6 flex flex-col justify-between h-full min-h-[280px]">
                <div className="text-left">
                  <span className="text-[10px] bg-[#C8A96B]/15 text-[#C8A96B] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Did you know?
                  </span>
                  <h3 className="text-base font-extrabold text-[#111111] mt-4 leading-snug">
                    Complete courses to climb the ranks!
                  </h3>
                  <p className="text-xs text-[#5F6368] mt-2.5 leading-relaxed font-medium">
                    Every lesson you mark as complete awards you <strong className="text-[#0F3D2E]">10 XP</strong>. 
                    Unlock level milestones and badges to showcase your expertise on eduroot!
                  </p>
                </div>
                <div className="border-t border-gray-100 pt-4 mt-6">
                  <Link
                    to="/courses"
                    className="w-full bg-[#0F3D2E] hover:bg-[#1a5c44] text-white font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>Start Learning</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default Dashboard

