import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Save, Loader2, AlertTriangle, Trash2, X, PlusCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/admin/AdminSidebar'
import LessonBuilder from '../../components/admin/LessonBuilder'
import VideoUrlInput from '../../components/admin/VideoUrlInput'

export function AdminCourseForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  // Course Details State
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [category, setCategory] = useState('digital-marketing')
  const [shortDesc, setShortDesc] = useState('')
  const [longDesc, setLongDesc] = useState('')
  const [price, setPrice] = useState(4999)
  const [originalPrice, setOriginalPrice] = useState(6999)
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [previewVideoUrl, setPreviewVideoUrl] = useState('')
  const [skillLevel, setSkillLevel] = useState('Beginner')
  const [language, setLanguage] = useState('English')
  const [isPublished, setIsPublished] = useState(false)
  const [requirements, setRequirements] = useState([
    'A laptop or desktop computer',
    'Stable internet connection',
    'No prior experience needed'
  ])

  // Modules and Lessons Builder State
  const [modules, setModules] = useState([])
  
  // Tracking database IDs to delete on Save
  const [deletedModuleIds, setDeletedModuleIds] = useState([])
  const [deletedLessonIds, setDeletedLessonIds] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Validation & Unsaved Changes states
  const [formErrors, setFormErrors] = useState({ title: '', slug: '', category: '' })
  const [isDirty, setIsDirty] = useState(false)
  const isInitialMount = React.useRef(true)

  // Track changes to make form dirty
  useEffect(() => {
    if (loading) return
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    setIsDirty(true)
  }, [
    title, slug, category, shortDesc, longDesc, price, originalPrice, 
    thumbnailUrl, previewVideoUrl, skillLevel, language, isPublished, modules, loading, requirements
  ])

  // Warn on unsaved changes when closing page
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Helper: auto slugify
  const toSlug = (str) => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // remove special chars
      .replace(/\s+/g, '-')         // replace spaces with dashes
      .trim()
  }

  // Fetch Course details on editing
  useEffect(() => {
    async function loadCourseData() {
      if (!isEditing) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // 1. Fetch Course details
        const { data: course, error: courseErr } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .single()

        if (courseErr) {
          toast.error('Failed to load course details.')
          console.error(courseErr)
          navigate('/admin/courses')
          return
        }

        setTitle(course.title || '')
        setSlug(course.slug || '')
        setSlugManuallyEdited(true) // prevent auto-updating existing slugs
        setCategory(course.category || 'digital-marketing')
        setShortDesc(course.short_desc || '')
        setLongDesc(course.long_desc || '')
        setPrice(course.price ?? 4999)
        setOriginalPrice(course.original_price ?? 6999)
        setThumbnailUrl(course.thumbnail_url || '')
        setPreviewVideoUrl(course.preview_video_url || '')
        setSkillLevel(course.skill_level || 'Beginner')
        setLanguage(course.language || 'English')
        setIsPublished(course.is_published ?? false)
        setRequirements(course.requirements || [
          'A laptop or desktop computer',
          'Stable internet connection',
          'No prior experience needed'
        ])

        // 2. Fetch Modules & Lessons
        const { data: modulesList, error: modulesErr } = await supabase
          .from('modules')
          .select(`
            *,
            lessons (*)
          `)
          .eq('course_id', id)
          .order('order_index')

        if (modulesErr) {
          toast.error('Failed to load curriculum modules.')
          console.error(modulesErr)
        } else if (modulesList) {
          // Format modules and sort their lessons by order_index
          const formatted = modulesList.map(m => {
            const lessonsSorted = m.lessons ? [...m.lessons].sort((a, b) => a.order_index - b.order_index) : []
            return {
              ...m,
              isNew: false,
              lessons: lessonsSorted.map(l => ({ ...l, isNew: false }))
            }
          })
          setModules(formatted)
        }

      } catch (err) {
        console.error('Unhandled course load error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCourseData()
  }, [id, isEditing, navigate])

  const handleTitleChange = (val) => {
    setTitle(val)
    if (!slugManuallyEdited) {
      setSlug(toSlug(val))
    }
  }

  const handleSlugChange = (val) => {
    setSlug(toSlug(val))
    setSlugManuallyEdited(true)
  }

  // Deletion tracking
  const trackModuleDeletion = (moduleId) => {
    setDeletedModuleIds(prev => [...prev, moduleId])
  }

  const trackLessonDeletion = (lessonId) => {
    setDeletedLessonIds(prev => [...prev, lessonId])
  }

  // Course Delete (Danger Zone)
  const handleDeleteCourse = async () => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id)

      if (error) {
        toast.error('Failed to delete course.')
        console.error(error)
      } else {
        toast.error('Course deleted.')
        navigate('/admin/courses')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // Main Save / Update Curricular Operations
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    setFormErrors({ title: '', slug: '', category: '' })
    const errors = {}
    if (!title.trim()) errors.title = 'Course title is required'
    if (!slug.trim()) errors.slug = 'URL slug is required'
    if (!category) errors.category = 'Please select a category'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setSaving(false)   // ← critical: reset loading state
      return
    }

    try {
      const totalLessonsCount = modules.flatMap(m => m.lessons).length
      const totalLessonsDuration = modules
        .flatMap(m => m.lessons)
        .reduce((sum, l) => sum + (parseInt(l.duration_mins) || 0), 0)

      const coursePayload = {
        title: title.trim(),
        slug: slug.trim(),
        category,
        short_desc: shortDesc.trim(),
        long_desc: longDesc.trim(),
        price: parseInt(price) || 0,
        original_price: parseInt(originalPrice) || 0,
        thumbnail_url: thumbnailUrl.trim() || null,
        preview_video_url: previewVideoUrl.trim() || null,
        skill_level: skillLevel,
        language: language.trim(),
        is_published: isPublished,
        requirements: requirements.filter(r => r.trim() !== ''),
        total_lessons: totalLessonsCount,
        total_duration_mins: totalLessonsDuration,
        last_updated: new Date().toISOString().split('T')[0] // current date YYYY-MM-DD
      }

      let activeCourseId = id

      // 1. Upsert course core entry
      if (isEditing) {
        const { error } = await supabase
          .from('courses')
          .update(coursePayload)
          .eq('id', id)
        
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('courses')
          .insert(coursePayload)
          .select()
          .single()

        if (error) throw error
        activeCourseId = data.id
      }

      // 2. Perform deletions of removed lessons/modules
      if (deletedLessonIds.length > 0) {
        const { error: delLessErr } = await supabase
          .from('lessons')
          .delete()
          .in('id', deletedLessonIds)
        if (delLessErr) console.error('Error deleting lessons:', delLessErr)
      }

      if (deletedModuleIds.length > 0) {
        const { error: delModErr } = await supabase
          .from('modules')
          .delete()
          .in('id', deletedModuleIds)
        if (delModErr) console.error('Error deleting modules:', delModErr)
      }

      // 3. Save Modules and Lessons (with dynamic sub-indexing)
      for (let mIdx = 0; mIdx < modules.length; mIdx++) {
        const moduleItem = modules[mIdx]
        let activeModuleId = moduleItem.id

        if (moduleItem.isNew) {
          // Create new module
          const { data: newMod, error: newModErr } = await supabase
            .from('modules')
            .insert({
              course_id: activeCourseId,
              title: moduleItem.title || 'Untitled Module',
              order_index: mIdx
            })
            .select()
            .single()

          if (newModErr) throw newModErr
          activeModuleId = newMod.id
        } else {
          // Update existing module
          const { error: updModErr } = await supabase
            .from('modules')
            .update({
              title: moduleItem.title || 'Untitled Module',
              order_index: mIdx
            })
            .eq('id', moduleItem.id)

          if (updModErr) throw updModErr
        }

        // Save lessons inside this module
        const lessons = moduleItem.lessons || []
        for (let lIdx = 0; lIdx < lessons.length; lIdx++) {
          const lessonItem = lessons[lIdx]

          const lessonPayload = {
            module_id: activeModuleId,
            title: lessonItem.title || 'Untitled Lesson',
            video_url: lessonItem.video_url || null,
            duration_mins: parseInt(lessonItem.duration_mins) || 0,
            is_preview: lessonItem.is_preview || false,
            order_index: lIdx
          }

          if (lessonItem.isNew) {
            const { error: newLessErr } = await supabase
              .from('lessons')
              .insert(lessonPayload)
            if (newLessErr) throw newLessErr
          } else {
            const { error: updLessErr } = await supabase
              .from('lessons')
              .update(lessonPayload)
              .eq('id', lessonItem.id)
            if (updLessErr) throw updLessErr
          }
        }
      }

      toast.success(isEditing ? 'Course updated!' : 'Course created!')
      setIsDirty(false) // reset dirtiness before navigation
      navigate('/admin/courses')

    } catch (err) {
      toast.error('Failed to save course changes. Please try again.')
      console.error('Course save error:', err)
    } finally {
      setSaving(false)
    }
  }

  // Helper style constant
  const inputStyle = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#111111] bg-white placeholder:text-gray-400 focus:outline-none focus:border-[#0F3D2E] focus:ring-2 focus:ring-[#0F3D2E]/10 transition-all duration-200"

  // Thumbnail gradient helper
  const getThumbnailGradient = (cat) => {
    switch (cat) {
      case 'digital-marketing':
        return 'bg-gradient-to-br from-[#0F3D2E] to-[#1a5c44]'
      case 'graphic-designing':
        return 'bg-gradient-to-br from-[#C8A96B] to-[#e8c98a]'
      case 'video-editing':
        return 'bg-gradient-to-br from-[#111111] to-[#2a2a2a]'
      default:
        return 'bg-gradient-to-br from-gray-200 to-gray-300'
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F8F6F2]">
      <AdminSidebar />
      <main className="flex-1 ml-0 md:ml-60 transition-all">
        {/* Header bar */}
        <header className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between text-left">
          <div className="flex flex-col">
            <Link 
              to="/admin/courses" 
              className="inline-flex items-center gap-1 text-[#5F6368] hover:text-[#111111] text-xs font-bold transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Courses</span>
            </Link>
            <h1 className="text-xl font-bold text-[#111111]">
              {isEditing ? 'Edit Course' : 'New Course'}
            </h1>
            <span className="text-xs text-[#5F6368] mt-0.5">
              Admin / Courses / {isEditing ? title || 'Loading...' : 'New'}
            </span>
          </div>

          <button
            type="submit"
            form="course-form"
            disabled={saving || loading}
            className="bg-[#0F3D2E] hover:bg-[#15543f] text-white font-semibold px-7 py-2.5 rounded-xl text-sm transition-all duration-150 flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 select-none cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Course</span>
          </button>
        </header>

        {loading ? (
          <div className="min-h-[75vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#0F3D2E]" />
              <span className="text-sm font-semibold text-[#0F3D2E]">Retrieving syllabus config...</span>
            </div>
          </div>
        ) : (
          <form id="course-form" onSubmit={handleSave} className="p-6 flex flex-col lg:flex-row gap-6 text-left">
            {/* LEFT COLUMN: Main Form */}
            <div className="flex-1 flex flex-col gap-4">
              
              {/* Section 1: Course Basics */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-base font-semibold text-[#111111] mb-5">Course Details</h2>
                
                <div className="flex flex-col gap-4">
                  {/* Title & Slug Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block">Course Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="eg. Digital Marketing Mastery"
                        className={inputStyle}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block">URL Slug</label>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        placeholder="eg. digital-marketing"
                        className={inputStyle}
                        required
                      />
                      <p className="text-[10px] text-gray-400 mt-1 font-mono">
                        eduroot.online/courses/{slug || '...'}
                      </p>
                    </div>
                  </div>

                  {/* Category & Skill Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={inputStyle}
                      >
                        <option value="digital-marketing">Digital Marketing</option>
                        <option value="graphic-designing">Graphic Designing</option>
                        <option value="video-editing">Video Editing</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block">Skill Level</label>
                      <select
                        value={skillLevel}
                        onChange={(e) => setSkillLevel(e.target.value)}
                        className={inputStyle}
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  {/* Short Description & Language */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block">Short Description</label>
                      <textarea
                        value={shortDesc}
                        onChange={(e) => setShortDesc(e.target.value.slice(0, 150))}
                        placeholder="Summarize course goals in under 150 characters..."
                        rows={2}
                        className={`${inputStyle} resize-none`}
                      />
                      <div className="text-xs text-gray-400 text-right mt-1 font-medium">
                        {shortDesc.length} / 150
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block">Language</label>
                      <input
                        type="text"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className={inputStyle}
                        required
                      />
                    </div>
                  </div>

                  {/* Full Description */}
                  <div>
                    <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block">Full Description</label>
                    <textarea
                      value={longDesc}
                      onChange={(e) => setLongDesc(e.target.value)}
                      placeholder="Detailed explanation of the course curricula (supports paragraph line breaks)..."
                      rows={5}
                      className={inputStyle}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Shown on the course detail page.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Pricing */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-base font-semibold text-[#111111] mb-5">Pricing</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block">Discount Price (INR)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#5F6368] font-bold">₹</span>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                        className={`${inputStyle} pl-8`}
                        min="0"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block">Original Price (INR)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#5F6368] font-bold">₹</span>
                      <input
                        type="number"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(parseInt(e.target.value) || 0)}
                        className={`${inputStyle} pl-8`}
                        min="0"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirements Section */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-base font-semibold text-[#111111] mb-1">
                  Requirements
                </h3>
                <p className="text-sm text-[#5F6368] mb-5">
                  What do students need before starting this course?
                </p>

                <div className="flex flex-col gap-2">
                  {requirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={req}
                        onChange={(e) => {
                          const updated = [...requirements]
                          updated[index] = e.target.value
                          setRequirements(updated)
                          setIsDirty(true)
                        }}
                        placeholder="eg. A laptop or desktop computer"
                        className={inputStyle}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setRequirements(requirements.filter((_, i) => i !== index))
                          setIsDirty(true)
                        }}
                        className="p-2 text-gray-300 hover:text-red-400
                          transition-colors flex-shrink-0 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setRequirements([...requirements, ''])
                    setIsDirty(true)
                  }}
                  className="mt-3 flex items-center gap-2 text-sm text-[#5F6368]
                    hover:text-[#0F3D2E] transition-colors cursor-pointer"
                >
                  <PlusCircle size={16} />
                  Add requirement
                </button>
              </div>

              {/* Section 3: Curriculum Builder */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-base font-semibold text-[#111111] mb-1">Curriculum</h2>
                <p className="text-xs text-[#5F6368] mb-5">Build your course module by module.</p>
                
                <LessonBuilder 
                  modules={modules}
                  onModulesChange={setModules}
                  onModuleDelete={trackModuleDeletion}
                  onLessonDelete={trackLessonDeletion}
                />
              </div>

            </div>

            {/* RIGHT COLUMN: Settings Sidebar */}
            <div className="w-full lg:w-80 flex flex-col gap-4 flex-shrink-0">
              
              {/* Thumbnail preview */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold text-[#111111] mb-4">Thumbnail</h3>
                <div className="aspect-video w-full rounded-xl overflow-hidden border border-gray-100 shadow-inner relative flex items-center justify-center">
                  {thumbnailUrl ? (
                    <img 
                      src={thumbnailUrl} 
                      alt="Thumbnail Preview" 
                      className="w-full h-full object-cover" 
                      onError={() => toast.error('Failed to load image. Check URL.')}
                    />
                  ) : (
                    <div className={`w-full h-full ${getThumbnailGradient(category)} flex flex-col items-center justify-center p-4 text-center text-white`}>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full border border-white/10">eduroot</span>
                      <span className="text-xs font-bold mt-2 truncate w-full px-2">{title || 'Thumbnail Preview'}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block">Image URL</label>
                  <input
                    type="url"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://..."
                    className={inputStyle}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Paste a direct image URL (JPG, PNG, WebP)
                  </p>
                </div>
              </div>

              {/* Preview Video */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold text-[#111111] mb-1">Preview Video</h3>
                <p className="text-[10px] text-[#5F6368] mb-4">This plays on the course detail page for free.</p>
                
                <VideoUrlInput
                  label="Preview video URL"
                  value={previewVideoUrl}
                  onChange={setPreviewVideoUrl}
                  helper="Paste a YouTube or Vimeo URL"
                />
              </div>

              {/* Publish Settings */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold text-[#111111] mb-4">Settings</h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-[#111111]">Published</span>
                    <span className="text-[10px] text-[#5F6368]">Visible to students</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setIsPublished(!isPublished)}
                    className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${
                      isPublished ? 'bg-[#0F3D2E]' : 'bg-gray-200'
                    }`}
                  >
                    <span 
                      className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 left-0.5 transition-transform duration-200 ${
                        isPublished ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Danger Zone for Editing */}
                {isEditing && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-left">
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="text-xs text-red-400 hover:text-red-600 font-bold transition-colors"
                    >
                      Delete Course
                    </button>
                  </div>
                )}
              </div>

            </div>
          </form>
        )}
      </main>

      {/* Delete Course Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative z-10 border border-gray-100 text-left"
            >
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4">
                <div className="bg-red-50 border border-red-100 p-2.5 rounded-xl text-red-500 flex-shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111111]">
                    Delete this course?
                  </h3>
                  <p className="text-sm text-[#5F6368] mt-2 leading-relaxed">
                    This will permanently delete the course <strong className="text-[#111111]">"{title}"</strong>, all modules, and lessons. Enrolled students will lose access.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="border border-gray-200 hover:bg-gray-50 flex-1 py-2.5 rounded-xl font-semibold text-sm text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCourse}
                  className="bg-red-500 hover:bg-red-600 text-white flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete permanently</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdminCourseForm
