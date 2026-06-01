import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'motion/react'
import { 
  ChevronRight, CheckCircle, ChevronDown, ChevronUp, PlayCircle, Lock, 
  BookOpen, Clock, Globe, ShieldCheck, Star, Users, ArrowRight, SearchX
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import PageWrapper from '../../components/layout/PageWrapper'
import { useAuth } from '../../hooks/useAuth'
import { useCourse } from '../../hooks/useCourses'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useXP } from '../../hooks/useXP'
import { showBadgeToast } from '../../components/ui/BadgeToast'

export function CourseDetail() {
  const { slug } = useParams()
  const { session, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { course, loading, error } = useCourse(slug)
  
  const { awardBadge, hasBadge } = useXP(session?.user?.id)
  
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrollmentLoading, setEnrollmentLoading] = useState(true)
  const [openModuleId, setOpenModuleId] = useState(null)
  const [enrolling, setEnrolling] = useState(false)

  const handleEnroll = async () => {
    // No session → redirect to login, come back after
    if (!session) {
      navigate(`/login?redirect=/courses/${slug}`)
      return
    }

    // Already enrolled → go to learn page
    if (isEnrolled) {
      navigate(`/learn/${slug}`)
      return
    }

    try {
      setEnrolling(true)

      // TODO (Prompt 9): Replace this block with Razorpay payment initiation.
      // For now: directly enroll the student (free / demo mode).
      const { error } = await supabase
        .from('enrollments')
        .insert({
          user_id: session.user.id,
          course_id: course.id
        })

      if (error) {
        if (error.code === '23505') {
          // Unique constraint: already enrolled
          setIsEnrolled(true)
          navigate(`/learn/${slug}`)
          return
        }
        throw error
      }

      setIsEnrolled(true)
      toast.success('You\'re enrolled! Let\'s start learning 🎉')

      // Award first-enrollment badge
      try {
        const firstBadge = await awardBadge('first-enrollment')
        if (firstBadge) showBadgeToast(firstBadge)
      } catch (badgeErr) {
        console.warn('Failed to award first-enrollment badge:', badgeErr)
      }

      // Check if referred and award community-builder
      try {
        const { data: referral } = await supabase
          .from('referrals')
          .select('id')
          .eq('referred_id', session.user.id)
          .eq('status', 'enrolled')
          .single()

        if (referral && !hasBadge('community-builder')) {
          const badge = await awardBadge('community-builder')
          if (badge) showBadgeToast(badge)
        }
      } catch (refErr) {
        console.warn('Failed referral badge check:', refErr)
      }

      setTimeout(() => navigate(`/learn/${slug}`), 1200)

    } catch (err) {
      console.error('Enrollment error:', err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setEnrolling(false)
    }
  }

  // Verify dynamic student enrollment from Supabase table if logged in
  useEffect(() => {
    async function checkEnrollment() {
      if (session?.user && course) {
        try {
          setEnrollmentLoading(true)
          const { data, error } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('course_id', course.id)
            .single()

          if (!error && data) {
            setIsEnrolled(true)
          } else {
            setIsEnrolled(false)
          }
        } catch (err) {
          console.warn('Enrollment query returned empty. User not enrolled.')
          setIsEnrolled(false)
        } finally {
          setEnrollmentLoading(false)
        }
      } else {
        setEnrollmentLoading(false)
      }
    }

    if (authLoading) return          // wait for auth before checking enrollment
    if (!session) {                  // not logged in — skip check
      setIsEnrolled(false)
      setEnrollmentLoading(false)
      return
    }
    checkEnrollment()
  }, [session, authLoading, course?.id])

  // Open the first syllabus module by default on load
  useEffect(() => {
    if (course && course.modules && course.modules.length > 0) {
      setOpenModuleId(course.modules[0].id)
    }
  }, [course])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgLight">
        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    )
  }

  if (!course) {
    return (
      <PageWrapper title="Course Not Found — eduroot">
        <div className="min-h-screen pt-32 pb-16 flex items-center justify-center bg-bgLight text-center select-none">
          <div className="max-w-md px-6 flex flex-col items-center">
            <SearchX size={48} className="text-gray-300" />
            <h1 className="text-xl font-bold text-gray-400 mt-4">Course not found</h1>
            <Link to="/courses" className="text-sm text-[#0F3D2E] hover:text-[#15543f] font-bold mt-2 hover:underline transition-colors flex items-center gap-1">
              Back to courses &rarr;
            </Link>
          </div>
        </div>
      </PageWrapper>
    )
  }

  // hardcoded takeaways per category slug
  const getTakeaways = (cat) => {
    switch (cat) {
      case 'digital-marketing':
        return [
          'SEO & keyword research campaigns mapping',
          'Google Ads structural campaigns setup',
          'Meta Ads retargeting strategies',
          'Email marketing automation blueprinting',
          'Social media content calendar planning',
          'Analytics, ROI & reporting dashboards',
          'Sales funnel creation and optimization',
          'Local business SEO frameworks'
        ]
      case 'graphic-designing':
        return [
          'Design principles, layouts & color theory',
          'Canva for fast, social media graphic creation',
          'Figma UI design and prototyping tools',
          'Brand identity guidelines from brief',
          'Typography hierarchies & style boards',
          'Premium deck presentation layouts',
          'Professional portfolio construction',
          'Managing client design briefs'
        ]
      case 'video-editing':
        return [
          'Raw file editing workflows from zero',
          'Premiere Pro essentials and workspace',
          'CapCut techniques for Reels & Shorts',
          'Color grading, lookup tables & LUTs',
          'Motion typography & smooth transitions',
          'Audio sound cleanups and mixes',
          'YouTube optimized export specifications',
          'Assembling client editing portfolios'
        ]
      default:
        return [
          'Core industry standard fundamentals',
          'Hands-on execution of real client briefs',
          'Verified completion certification',
          'Professional portfolios layouts'
        ]
    }
  }

  // hardcoded requirements per category slug
  const getRequirements = (cat) => {
    const base = [
      'A laptop or desktop computer (Windows or Mac)',
      'Stable internet connection for lesson streaming',
      'No prior experience needed — we start from absolute zero'
    ]
    if (cat === 'digital-marketing') {
      return [...base, 'A Google account (free) to access analytics dashboards']
    }
    if (cat === 'graphic-designing') {
      return [...base, "Canva free account (we'll set it up together in class)"]
    }
    if (cat === 'video-editing') {
      return [...base, 'CapCut (free desktop edition) or Adobe Premiere Pro (trial available)']
    }
    return base
  }

  const categoryLabel = course.category.replace('-', ' ')
  const originalPrice = course.original_price || (course.price + 2000)

  // Maps custom color gradients for thumbnail backgrounds when no image is loaded
  const getCategoryGradient = (cat) => {
    switch(cat) {
      case 'digital-marketing': return 'linear-gradient(135deg, #0F3D2E 0%, #1a5c44 100%)'
      case 'graphic-designing': return 'linear-gradient(135deg, #C8A96B 0%, #e8c98a 100%)'
      case 'video-editing': return 'linear-gradient(135deg, #111111 0%, #2a2a2a 100%)'
      default: return 'linear-gradient(135deg, #0F3D2E 0%, #111111 100%)'
    }
  }

  const handleEnrollClick = () => {
    if (!user) {
      navigate(`/login?redirect=/courses/${slug}`)
    } else {
      // Future session will link to transaction gates
      alert(`Simulating enrollment transaction for: ${course.title}. Price: ₹${course.price}`);
    }
  }

  const modules = course.modules || []

  return (
    <PageWrapper
      title={`${course.title} — eduroot`}
      description={course.short_desc}
    >
      {/* --------------------------------------------------- */}
      {/* SEO METAS                                           */}
      {/* --------------------------------------------------- */}
      <Helmet>
        <title>{course.title} — eduroot</title>
        <meta name="description" content={course.short_desc} />
        <link rel="canonical" href={`https://eduroot.online/courses/${slug}`} />
      </Helmet>

      <div className="bg-bgLight min-h-screen pt-20 text-left">
        
        {/* 1. HERO BLOCK */}
        <section className="bg-[#F8F6F2] py-12 border-b border-gray-200/30">
          <div className="max-w-6xl mx-auto px-6">
            
            {/* Breadcrumb banner */}
            <div className="flex items-center gap-1.5 text-xs text-textSecondary font-semibold uppercase tracking-wider mb-4 select-none">
              <Link to="/courses" className="hover:text-primary transition-colors">Courses</Link>
              <ChevronRight className="w-3.5 h-3.5 text-accent" />
              <span className="text-primary truncate">{categoryLabel}</span>
            </div>

            {/* Title & Desc */}
            <h1 className="text-3xl md:text-[40px] font-black text-[#111111] leading-tight tracking-tight mb-3.5 max-w-3xl">
              {course.title}
            </h1>
            <p className="text-base md:text-lg text-textSecondary leading-relaxed max-w-3xl mb-6">
              {course.short_desc}
            </p>

            {/* Meta badging list */}
            <div className="flex flex-wrap items-center gap-2 select-none">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-150 text-primary flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-accent fill-accent" /> 4.8 rated
              </span>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-150 text-primary flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#0F3D2E]" /> 2,000+ students
              </span>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-150 text-primary">
                📅 Updated {course.last_updated}
              </span>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-150 text-primary">
                🌐 {course.language}
              </span>
            </div>

          </div>
        </section>

        {/* 2. TWO COLUMN WORKSPACE LAYOUT */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            
            {/* LEFT CONTENT (60%) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full lg:w-3/5 flex flex-col gap-10"
            >
              
              {/* Takeaway grid */}
              <div>
                <h2 className="text-xl font-bold text-primary mb-4 tracking-tight">What you'll learn</h2>
                <Card className="border border-gray-150 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getTakeaways(course.category).map((takeaway, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <CheckCircle className="w-4.5 h-4.5 text-[#0F3D2E] flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-textSecondary leading-relaxed">{takeaway}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Course curriculum accordions */}
              <div>
                <h2 className="text-xl font-bold text-primary mb-1 tracking-tight">Course curriculum</h2>
                <p className="text-xs text-textSecondary font-semibold mb-4 select-none">
                  {modules.length} modules · {course.total_lessons} lessons · {Math.floor(course.total_duration_mins / 60)}h {course.total_duration_mins % 60}m total duration
                </p>

                <div className="flex flex-col gap-3">
                  {modules.map((mod, modIdx) => {
                    const isOpen = openModuleId === mod.id
                    const lessons = mod.lessons || []
                    const modDuration = lessons.reduce((acc, curr) => acc + (curr.duration_mins || 0), 0)

                    return (
                      <div 
                        key={mod.id} 
                        className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden"
                      >
                        {/* Header */}
                        <div
                          onClick={() => setOpenModuleId(isOpen ? null : mod.id)}
                          className="flex items-center justify-between px-5 py-4 min-h-[48px] cursor-pointer hover:bg-gray-50/50 transition-colors select-none"
                        >
                          <div className="flex items-center gap-3 text-left">
                            {isOpen ? (
                              <ChevronUp className="w-4.5 h-4.5 text-[#0F3D2E]" />
                            ) : (
                              <ChevronDown className="w-4.5 h-4.5 text-[#0F3D2E]" />
                            )}
                            <span className="text-sm font-bold text-primary max-w-[280px] sm:max-w-md truncate">
                              {mod.title}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 font-semibold whitespace-nowrap ml-2">
                            {lessons.length} lessons · {modDuration}m
                          </span>
                        </div>

                        {/* Lessons Body */}
                        {isOpen && (
                          <div className="border-t border-gray-100 divide-y divide-gray-50">
                            {lessons.length === 0 ? (
                              <div className="p-4 text-xs text-gray-400 italic">No lessons in this module.</div>
                            ) : (
                              lessons.map((lesson) => {
                                const showPreview = lesson.is_preview
                                const canWatch = showPreview || isEnrolled

                                return (
                                  <div 
                                    key={lesson.id}
                                    className="flex items-center justify-between py-3 px-5 min-h-[48px] bg-white text-xs hover:bg-gray-50/20 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      {canWatch ? (
                                        <PlayCircle className="w-4.5 h-4.5 text-accent" />
                                      ) : (
                                        <Lock className="w-4.5 h-4.5 text-gray-300" />
                                      )}
                                      <span className="text-[#2D3A30] font-medium leading-relaxed">{lesson.title}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 select-none">
                                      {showPreview && !isEnrolled && (
                                        <span className="bg-[#C8A96B]/10 text-[#C8A96B] border border-[#C8A96B]/20 text-[9px] font-bold px-2 py-0.5 rounded">
                                          Free preview
                                        </span>
                                      )}
                                      <span className="text-gray-400 font-mono">({lesson.duration_mins}m)</span>
                                    </div>
                                  </div>
                                )
                              })
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Long detailed description */}
              <div>
                <h2 className="text-xl font-bold text-primary mb-4 tracking-tight">About this course</h2>
                <div className="flex flex-col gap-4 text-sm text-textSecondary leading-relaxed">
                  {course.long_desc.split('\n').map((para, pIdx) => (
                    <p key={pIdx}>{para}</p>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              {course.requirements && course.requirements.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold text-[#111111] mb-4">
                    Requirements
                  </h2>
                  <ul className="flex flex-col gap-2">
                    {course.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm
                        text-[#5F6368]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#C8A96B]
                          flex-shrink-0 mt-2" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </motion.div>

            {/* RIGHT SIDEBAR (STICKY CARD 40%) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="w-full lg:w-2/5 lg:sticky lg:top-24 order-first lg:order-none"
            >
              <Card padding="md" className="border border-gray-150 shadow-elevated bg-white flex flex-col gap-6">
                
                {/* 1. Graphic Thumbnail area */}
                <div 
                  className="w-full aspect-video rounded-xl flex items-center justify-center select-none relative overflow-hidden"
                  style={{ background: course.thumbnail_url ? `url(${course.thumbnail_url}) center/cover` : getCategoryGradient(course.category) }}
                >
                  {!course.thumbnail_url && (
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                      <PlayCircle className="w-16 h-16 text-white/90 drop-shadow-md cursor-pointer hover:scale-105 transition-transform" />
                    </div>
                  )}
                </div>

                {/* 2. Price block */}
                <div className="flex flex-col text-left select-none">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl font-extrabold text-[#0F3D2E]">
                      ₹{(course.price || 4999).toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm line-through text-gray-400 font-medium">
                      ₹{originalPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <span className="bg-[#C8A96B]/15 text-[#C8A96B] border border-[#C8A96B]/20 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Save ₹{(originalPrice - course.price).toLocaleString('en-IN')} ({(Math.round((originalPrice - course.price) / originalPrice * 100))}% OFF)
                    </span>
                  </div>
                </div>

                {/* 3. CTA Buttons */}
                <div className="w-full">
                  {/* CTA Button */}
                  {enrollmentLoading ? (
                    // Still checking enrollment status
                    <button
                      disabled
                      className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 text-sm font-semibold cursor-not-allowed"
                    >
                      Checking...
                    </button>

                  ) : isEnrolled ? (
                    // Already enrolled → go to course
                    <button
                      onClick={() => navigate(`/learn/${slug}`)}
                      className="w-full py-3 rounded-xl bg-gray-100 text-[#0F3D2E] text-sm font-semibold hover:bg-gray-200 transition-colors duration-200 cursor-pointer"
                    >
                      Continue Learning →
                    </button>

                  ) : (
                    // Not enrolled → enroll button
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full py-3 rounded-xl bg-[#0F3D2E] text-white text-sm font-semibold hover:bg-[#1a5c44] transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {enrolling ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Enrolling...
                        </>
                      ) : session ? (
                        // Logged in — show price or "Enroll now"
                        `Enroll Now — ₹${course.price?.toLocaleString('en-IN')}`
                      ) : (
                        // Not logged in — prompt to sign up
                        'Sign Up to Enroll'
                      )}
                    </button>
                  )}

                  {/* Below button — small note */}
                  {!isEnrolled && (
                    <p className="text-center text-xs text-[#5F6368] mt-3">
                      {session
                        ? '30-day money-back guarantee'
                        : 'Free to create an account'
                      }
                    </p>
                  )}
                </div>

                {/* 4. Inclusion checklist */}
                <div className="text-left border-t border-gray-100 pt-5 flex flex-col gap-3">
                  <span className="text-xs font-bold text-[#111111] uppercase tracking-wider select-none">
                    This program includes:
                  </span>
                  <ul className="flex flex-col gap-2.5 text-xs text-textSecondary font-semibold select-none">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4.5 h-4.5 text-[#0F3D2E]" />
                      <span>Lifetime access</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4.5 h-4.5 text-[#0F3D2E]" />
                      <span>{course.total_lessons} structured lessons</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4.5 h-4.5 text-[#0F3D2E]" />
                      <span>Downloadable project assets &amp; templates</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4.5 h-4.5 text-[#0F3D2E]" />
                      <span>Interactive gamified learning XP &amp; badges</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4.5 h-4.5 text-[#0F3D2E]" />
                      <span>Mobile + desktop learning portals</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4.5 h-4.5 text-[#0F3D2E]" />
                      <span>Classroom mastermind channels</span>
                    </li>
                  </ul>
                </div>

                {/* 5. Guarantee disclaimer */}
                <div className="border-t border-gray-100 pt-4 flex items-center justify-center gap-2 select-none">
                  <ShieldCheck className="w-5 h-5 text-[#0F3D2E]" />
                  <span className="text-[10px] text-textSecondary font-bold">
                    30-day money-back guarantee · Secure checkout
                  </span>
                </div>

              </Card>
            </motion.div>

          </div>
        </section>

      </div>
    </PageWrapper>
  )
}

export default CourseDetail
