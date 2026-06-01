import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Check, CheckCircle, Clock, Play } from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import VideoPlayer from '../../components/ui/VideoPlayer'
import { useXP } from '../../hooks/useXP'
import { showBadgeToast } from '../../components/ui/BadgeToast'

export function Learn() {
  const { slug } = useParams()
  const { session } = useAuth()
  const navigate = useNavigate()
  
  const {
    awardXP, awardBadge, hasBadge, totalXP
  } = useXP(session?.user?.id)

  // Data States
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeLesson, setActiveLesson] = useState(null)
  const [progressMap, setProgressMap] = useState({})
  
  // UI States
  const [expandedModules, setExpandedModules] = useState(new Set())
  const [completingLesson, setCompletingLesson] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!session || !slug) return

    const loadLearnData = async () => {
      setLoading(true)
      try {
        // 1. Fetch course with modules + lessons
        const { data: courseData, error: courseErr } = await supabase
          .from('courses')
          .select(`
            id, title, slug, category,
            modules (
              id, title, order_index,
              lessons (
                id, title, video_url,
                duration_mins, is_preview, order_index
              )
            )
          `)
          .eq('slug', slug)
          .single()

        if (courseErr || !courseData) {
          console.error(courseErr)
          toast.error('Failed to load course.')
          navigate('/dashboard')
          return
        }

        // 2. Verify enrollment
        const { data: enrollment, error: enrollErr } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('course_id', courseData.id)
          .single()

        if (enrollErr || !enrollment) {
          toast.error('You must be enrolled to view this course.')
          navigate(`/courses/${slug}`)
          return
        }

        // Sort modules and lessons
        const sortedModules = (courseData.modules || [])
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
          .map(m => {
            const sortedLessons = (m.lessons || [])
              .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
            return { ...m, lessons: sortedLessons }
          })
        
        const sortedCourse = { ...courseData, modules: sortedModules }
        setCourse(sortedCourse)

        // 3. Fetch lesson progress
        const { data: progressData } = await supabase
          .from('lesson_progress')
          .select('lesson_id, completed')
          .eq('user_id', session.user.id)
          .eq('course_id', sortedCourse.id)

        const loadedProgressMap = Object.fromEntries(
          (progressData || []).map(p => [p.lesson_id, p.completed])
        )
        setProgressMap(loadedProgressMap)

        // 4. Determine active lesson
        const allLessons = sortedModules.flatMap(m => m.lessons)
        if (allLessons.length > 0) {
          const firstIncomplete = allLessons.find(l => !loadedProgressMap[l.id])
          const defaultLesson = firstIncomplete || allLessons[0]
          setActiveLesson(defaultLesson)

          // Auto-expand the module containing the active lesson
          const activeModule = sortedModules.find(m => m.lessons.some(l => l.id === defaultLesson.id))
          if (activeModule) {
            setExpandedModules(new Set([activeModule.id]))
          }
        }

      } catch (err) {
        console.error('Error fetching learn data:', err)
        toast.error('Something went wrong.')
      } finally {
        setLoading(false)
      }
    }

    loadLearnData()
  }, [slug, session, navigate])

  const sortedModules = course?.modules || []
  const allLessons = sortedModules.flatMap(m => m.lessons || [])

  const handleMarkComplete = async (lesson) => {
    if (progressMap[lesson.id]) return // already done

    try {
      setCompletingLesson(lesson.id)
      const { error } = await supabase.from('lesson_progress').upsert({
        user_id: session.user.id,
        lesson_id: lesson.id,
        course_id: course.id,
        completed: true,
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id,lesson_id' })

      if (error) throw error

      // Update local progress map
      setProgressMap(prev => ({ ...prev, [lesson.id]: true }))
      toast.success('Lesson completed! 🎉')

      // 1. Award 10 XP per lesson
      await awardXP(10, 'lesson_complete', lesson.id)

      // 2. First lesson ever badge
      const totalCompleted = Object.values({
        ...progressMap, [lesson.id]: true
      }).filter(Boolean).length

      if (totalCompleted === 1) {
        const badge = await awardBadge('first-step')
        if (badge) showBadgeToast(badge)
      }

      // 3. Halfway badge (when course progress hits 50%)
      const newProgressPct = Math.round(
        (totalCompleted / allLessons.length) * 100
      )
      const wasBelow50 = Math.round(
        (Object.values(progressMap).filter(Boolean).length
          / allLessons.length) * 100
      ) < 50

      if (newProgressPct >= 50 && wasBelow50) {
        const badge = await awardBadge('halfway-hero')
        if (badge) showBadgeToast(badge)
      }

      // 4. Course completion: 100 XP bonus + course badge
      const isNowComplete = totalCompleted === allLessons.length
      if (isNowComplete) {
        await awardXP(100, 'course_complete', course.id)

        // Map course slug to badge id
        const courseBadgeMap = {
          'digital-marketing':  'digital-marketing-complete',
          'graphic-designing':  'graphic-designing-complete',
          'video-editing':      'video-editing-complete',
        }
        const courseBadgeId = courseBadgeMap[course.slug]
        if (courseBadgeId) {
          const badge = await awardBadge(courseBadgeId)
          if (badge) {
            // Delay slightly so lesson complete toast shows first
            setTimeout(() => showBadgeToast(badge), 800)
          }
        }

        // Speed learner badge — check enrollment date
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('enrolled_at')
          .eq('user_id', session.user.id)
          .eq('course_id', course.id)
          .single()

        if (enrollment) {
          const daysSinceEnroll = Math.floor(
            (Date.now() - new Date(enrollment.enrolled_at).getTime())
            / (1000 * 60 * 60 * 24)
          )
          if (daysSinceEnroll <= 14) {
            const badge = await awardBadge('speed-learner')
            if (badge) setTimeout(() => showBadgeToast(badge), 1600)
          }
        }
      }

      // Auto-advance to next lesson after 1.5s
      const currentIndex = allLessons.findIndex(l => l.id === lesson.id)
      const nextLesson = allLessons[currentIndex + 1]
      
      if (nextLesson) {
        setTimeout(() => {
          setActiveLesson(nextLesson)
          // Expand next lesson's module if it's different
          const nextModule = sortedModules.find(m => m.lessons.some(l => l.id === nextLesson.id))
          if (nextModule) {
            setExpandedModules(prev => {
              const nextSet = new Set(prev)
              nextSet.add(nextModule.id)
              return nextSet
            })
          }
        }, 1500)
      } else {
        // Course complete!
        setTimeout(() => {
          toast('🏆 You\'ve completed the course! You earned a 100 XP bonus! 🎉', {
            duration: 5000,
            icon: '🏆'
          })
          setTimeout(() => navigate('/dashboard'), 2500)
        }, 1500)
      }

    } catch (err) {
      console.error('Error saving progress:', err)
      toast.error('Failed to save progress. Please try again.')
    } finally {
      setCompletingLesson(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-[#111111] min-h-screen flex items-center justify-center p-6 text-center select-none">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-white animate-spin" />
          <span className="text-sm text-white/50 font-medium tracking-wide">
            Entering Classroom...
          </span>
        </div>
      </div>
    )
  }

  const completedCount = Object.values(progressMap).filter(Boolean).length
  const progressPct = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#111111] text-left">
      <Toaster position="top-right" />

      {/* LEFT: Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top bar */}
        <div className="bg-[#1a1a1a] border-b border-white/5 px-4 py-3.5 flex items-center gap-4 flex-shrink-0 z-25 select-none">
          <button
            onClick={() => navigate(`/courses/${slug}`)}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-semibold cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <div className="w-px h-4 bg-white/15" />
          <span className="text-white/80 text-sm font-bold truncate max-w-[180px] sm:max-w-md">
            {course?.title}
          </span>

          {/* Progress pill (right side) */}
          <div className="ml-auto flex items-center gap-2.5 text-xs text-white/40 flex-shrink-0">
            <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C8A96B] rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="font-semibold text-white/60">
              {completedCount}/{allLessons.length}
            </span>
          </div>
        </div>

        {/* Video player area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            
            {/* VideoPlayer component */}
            {activeLesson ? (
              <VideoPlayer
                url={activeLesson.video_url}
                lessonTitle={activeLesson.title}
                isCompleted={!!progressMap[activeLesson.id]}
                onComplete={() => handleMarkComplete(activeLesson)}
                onEnded={() => {}}
                autoPlay={false}
              />
            ) : (
              <div className="aspect-video w-full bg-black rounded-2xl flex items-center justify-center border border-white/5">
                <p className="text-white/40 text-sm font-medium">No lessons loaded</p>
              </div>
            )}

            {/* Lesson info below player */}
            {activeLesson && (
              <div className="mt-6">
                {/* Module breadcrumb */}
                <p className="text-[#C8A96B] text-xs font-extrabold uppercase tracking-widest mb-2 select-none">
                  {sortedModules.find(m =>
                    m.lessons.some(l => l.id === activeLesson.id)
                  )?.title}
                </p>
                <h1 className="text-white text-xl sm:text-2xl font-extrabold mb-3.5 tracking-tight leading-tight">
                  {activeLesson.title}
                </h1>

                {/* Meta row */}
                <div className="flex items-center gap-4 text-white/40 text-xs mb-6 font-semibold select-none">
                  {activeLesson.duration_mins > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-[#C8A96B]" />
                      <span>{activeLesson.duration_mins} min</span>
                    </span>
                  )}
                  {progressMap[activeLesson.id] && (
                    <span className="flex items-center gap-1.5 text-[#C8A96B] font-bold">
                      <CheckCircle size={13} />
                      <span>Completed</span>
                    </span>
                  )}
                </div>

                {/* Mark as Completed action */}
                <div className="mb-6 select-none">
                  {progressMap[activeLesson.id] ? (
                    <div className="inline-flex items-center gap-2 bg-[#0F3D2E]/40 border border-[#0F3D2E]/10 text-[#C8A96B] px-5 py-2.5 rounded-xl text-sm font-bold">
                      <CheckCircle size={16} />
                      <span>Lesson completed! 🎉</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleMarkComplete(activeLesson)}
                      disabled={completingLesson === activeLesson.id}
                      className="inline-flex items-center gap-2 bg-[#C8A96B] text-[#0F3D2E] hover:bg-[#d4bc85] disabled:opacity-50 disabled:cursor-not-allowed transition-all px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer shadow-md active:scale-95"
                    >
                      {completingLesson === activeLesson.id ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-[#0F3D2E]/30 border-t-[#0F3D2E] animate-spin" />
                          <span>Saving progress...</span>
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          <span>Mark lesson as completed</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Prev / Next navigation */}
                <div className="flex items-center gap-3 pt-5 border-t border-white/5 select-none">
                  {(() => {
                    const idx = allLessons.findIndex(
                      l => l.id === activeLesson.id
                    )
                    const prev = allLessons[idx - 1]
                    const next = allLessons[idx + 1]
                    return (
                      <>
                        <button
                          onClick={() => prev && setActiveLesson(prev)}
                          disabled={!prev}
                          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors font-bold cursor-pointer"
                        >
                          <ChevronLeft size={16} />
                          <span>Previous</span>
                        </button>
                        <div className="flex-1" />
                        <button
                          onClick={() => next && setActiveLesson(next)}
                          disabled={!next}
                          className="flex items-center gap-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
                        >
                          <span>Next lesson</span>
                          <ChevronRight size={16} />
                        </button>
                      </>
                    )
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Lesson sidebar (Desktop, lg:flex) */}
      <div className="hidden lg:flex flex-col w-72 xl:w-80 border-l border-white/5 bg-[#0f0f0f] overflow-y-auto flex-shrink-0 z-20">
        <div className="px-5 py-5 border-b border-white/5 flex-shrink-0 select-none">
          <h2 className="text-white/40 text-[10px] font-extrabold uppercase tracking-widest">
            Course Content
          </h2>
          <p className="text-white/60 text-xs mt-1.5 font-semibold">
            {completedCount}/{allLessons.length} lessons completed
          </p>
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          {sortedModules.map((module, mIdx) => {
            const isExpanded = expandedModules.has(module.id)
            const moduleCompleted = module.lessons?.length > 0 && module.lessons.every(
              l => progressMap[l.id]
            )
            const moduleProgress = module.lessons?.filter(
              l => progressMap[l.id]
            ).length || 0

            return (
              <div key={module.id} className="mb-1 select-none">
                {/* Module header */}
                <button
                  onClick={() => {
                    setExpandedModules(prev => {
                      const next = new Set(prev)
                      next.has(module.id)
                        ? next.delete(module.id)
                        : next.add(module.id)
                      return next
                    })
                  }}
                  className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 cursor-pointer"
                >
                  <ChevronDown
                    size={14}
                    className={`text-white/30 flex-shrink-0 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
                  />
                  <div className="flex-1 min-w-0 pr-1">
                    <p className="text-white/70 text-xs font-bold truncate leading-tight">
                      {module.title}
                    </p>
                    <p className="text-white/30 text-[10px] font-semibold mt-1">
                      {moduleProgress}/{module.lessons?.length || 0} lessons
                      {moduleCompleted && ' · Done ✓'}
                    </p>
                  </div>
                </button>

                {/* Lesson list */}
                {isExpanded && (
                  <div className="bg-[#151515]/20 divide-y divide-white/5">
                    {module.lessons?.map((lesson) => {
                      const isActive = activeLesson?.id === lesson.id
                      const isDone = !!progressMap[lesson.id]

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => setActiveLesson(lesson)}
                          className={`w-full px-5 py-3 flex items-start gap-3.5 text-left transition-colors border-l-2 cursor-pointer ${
                            isActive
                              ? 'bg-[#0F3D2E]/25 border-[#C8A96B]'
                              : 'hover:bg-white/5 border-transparent'
                          }`}
                        >
                          {/* Status icon */}
                          <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border transition-colors ${
                            isDone
                              ? 'bg-[#0F3D2E] border-[#0F3D2E]'
                              : isActive
                                ? 'border-[#C8A96B]'
                                : 'border-white/20'
                          }`}>
                            {isDone ? (
                              <Check size={9} className="text-white" />
                            ) : isActive ? (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#C8A96B]" />
                            ) : null}
                          </div>

                          {/* Lesson info */}
                          <div className="flex-1 min-w-0 pr-1 flex flex-col">
                            <p className={`text-xs leading-snug font-semibold ${
                              isActive
                                ? 'text-white'
                                : isDone
                                  ? 'text-white/40'
                                  : 'text-white/60'
                            }`}>
                              {lesson.title}
                            </p>
                            {lesson.duration_mins > 0 && (
                              <span className="text-white/25 text-[10px] font-semibold mt-1 flex items-center gap-1">
                                <Clock size={10} />
                                {lesson.duration_mins} min
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile lesson list (lg:hidden devices) */}
      <div className="lg:hidden bg-[#0f0f0f] border-t border-white/5 z-20 select-none flex-shrink-0 pb-6">
        {/* Accordion trigger button */}
        <button
          onClick={() => setMobileMenuOpen(prev => !prev)}
          className="w-full px-5 py-4 flex items-center justify-between text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <span className="text-xs font-bold uppercase tracking-wider">
            {mobileMenuOpen ? 'Hide Course Syllabus' : 'Show Course Syllabus'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 font-semibold bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
              {completedCount}/{allLessons.length} Done
            </span>
            <ChevronDown size={16} className={`transition-transform duration-250 ${mobileMenuOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Collapsible Mobile Content */}
        {mobileMenuOpen && (
          <div className="max-h-[300px] overflow-y-auto border-t border-white/5 divide-y divide-white/5">
            {sortedModules.map((module) => (
              <div key={module.id} className="py-2.5">
                <div className="px-5 py-1">
                  <span className="text-[#C8A96B] text-[10px] font-extrabold tracking-wider uppercase block">
                    {module.title}
                  </span>
                </div>
                <div className="mt-1 flex flex-col divide-y divide-white/5">
                  {module.lessons?.map((lesson) => {
                    const isActive = activeLesson?.id === lesson.id
                    const isDone = !!progressMap[lesson.id]

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          setActiveLesson(lesson)
                          setMobileMenuOpen(false)
                        }}
                        className={`w-full px-5 py-2.5 flex items-center gap-3 text-left transition-colors border-l-2 cursor-pointer ${
                          isActive
                            ? 'bg-[#0F3D2E]/20 border-[#C8A96B]'
                            : 'hover:bg-white/5 border-transparent'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 border transition-colors ${
                          isDone
                            ? 'bg-[#0F3D2E] border-[#0F3D2E]'
                            : isActive
                              ? 'border-[#C8A96B]'
                              : 'border-white/20'
                        }`}>
                          {isDone ? (
                            <Check size={8} className="text-white" />
                          ) : isActive ? (
                            <div className="w-1 h-1 rounded-full bg-[#C8A96B]" />
                          ) : null}
                        </div>
                        <span className={`text-xs font-semibold truncate flex-1 ${
                          isActive ? 'text-white font-bold' : isDone ? 'text-white/40' : 'text-white/60'
                        }`}>
                          {lesson.title}
                        </span>
                        {lesson.duration_mins > 0 && (
                          <span className="text-[10px] text-white/20 font-mono">
                            {lesson.duration_mins}m
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default Learn
