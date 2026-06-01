import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Plus, 
  Pencil, 
  Trash2, 
  TrendingUp, 
  Palette, 
  Video, 
  BookOpen, 
  Loader2, 
  AlertTriangle,
  X
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/admin/AdminSidebar'

export function AdminCourses() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [courseToDelete, setCourseToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch all courses with modules and lessons count
  const fetchCourses = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          modules (
            id,
            lessons (
              id
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        toast.error('Failed to load courses.')
        console.error('Error fetching courses:', error)
      } else {
        setCourses(data || [])
      }
    } catch (err) {
      console.error('Unhandled courses fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  // Toggle dynamic published state in Supabase
  const handleTogglePublish = async (courseId, currentStatus) => {
    try {
      const newStatus = !currentStatus
      // Instantly update local state for snappy UI
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, is_published: newStatus } : c))

      const { error } = await supabase
        .from('courses')
        .update({ is_published: newStatus })
        .eq('id', courseId)

      if (error) {
        // Rollback state on error
        setCourses(prev => prev.map(c => c.id === courseId ? { ...c, is_published: currentStatus } : c))
        toast.error('Failed to update course status.')
        console.error('Toggle status error:', error)
      } else {
        if (newStatus) {
          toast.success('Course published!')
        } else {
          toast('Course unpublished.', { icon: '📝' })
        }
      }
    } catch (err) {
      console.error('Unhandled toggle error:', err)
    }
  }

  // Handle permanent deletion of course
  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return
    try {
      setDeleting(true)
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseToDelete.id)

      if (error) {
        toast.error('Failed to delete course.')
        console.error('Delete course error:', error)
      } else {
        // Remove from local list
        setCourses(prev => prev.filter(c => c.id !== courseToDelete.id))
        toast.error('Course deleted.') // as requested: toast.error('Course deleted.')
        setCourseToDelete(null)
      }
    } catch (err) {
      console.error('Unhandled delete error:', err)
    } finally {
      setDeleting(false)
    }
  }

  // Get Thumbnail Gradient & Icon by Category
  const getCategoryTheme = (category) => {
    switch (category) {
      case 'digital-marketing':
        return {
          gradient: 'bg-gradient-to-br from-[#0F3D2E] to-[#1a5c44]',
          icon: TrendingUp
        }
      case 'graphic-designing':
        return {
          gradient: 'bg-gradient-to-br from-[#C8A96B] to-[#e8c98a]',
          icon: Palette
        }
      case 'video-editing':
        return {
          gradient: 'bg-gradient-to-br from-[#111111] to-[#2a2a2a]',
          icon: Video
        }
      default:
        return {
          gradient: 'bg-gradient-to-br from-[#0F3D2E] to-[#C8A96B]',
          icon: BookOpen
        }
    }
  }

  // Calculate total lessons in a course
  const getLessonCount = (course) => {
    if (course.modules) {
      return course.modules.reduce((sum, m) => sum + (m.lessons ? m.lessons.length : 0), 0)
    }
    return course.total_lessons || 0
  }

  return (
    <div className="flex min-h-screen bg-[#F8F6F2]">
      <AdminSidebar />
      <main className="flex-1 ml-0 md:ml-60 transition-all">
        {/* Header Panel */}
        <header className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between text-left">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[#111111]">Courses</h1>
            <span className="text-xs text-[#5F6368] mt-0.5">Admin / Courses</span>
          </div>
          <Link
            to="/admin/courses/new"
            className="bg-[#0F3D2E] hover:bg-[#15543f] text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all duration-150 flex items-center gap-1.5 shadow-sm active:scale-95 select-none"
          >
            <Plus className="w-4 h-4" />
            <span>New Course</span>
          </Link>
        </header>

        {/* Content list */}
        {loading ? (
          <div className="min-h-[75vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#0F3D2E]" />
              <span className="text-sm font-semibold text-[#0F3D2E]">Loading courses list...</span>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="p-6 text-left"
          >
            {courses.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center max-w-2xl mx-auto shadow-sm mt-10">
                <BookOpen className="w-12 h-12 text-[#C8A96B] mx-auto mb-4" />
                <h3 className="text-lg font-bold text-[#111111]">No courses in database</h3>
                <p className="text-sm text-[#5F6368] mt-1 max-w-sm mx-auto">
                  Get started by creating your first course blueprint.
                </p>
                <Link
                  to="/admin/courses/new"
                  className="bg-[#0F3D2E] hover:bg-[#15543f] text-white font-semibold px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-1.5 mt-6 transition-all shadow-sm active:scale-95"
                >
                  <Plus className="w-4.5 h-4.5" />
                  <span>Create Course</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {courses.map((course) => {
                  const theme = getCategoryTheme(course.category)
                  const Icon = theme.icon
                  const lessonCount = getLessonCount(course)

                  return (
                    <div
                      key={course.id}
                      className="bg-white rounded-2xl border border-gray-100 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:shadow-md transition duration-200"
                    >
                      {/* Left: Thumbnail container */}
                      <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden shadow-inner">
                        {course.thumbnail_url ? (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${theme.gradient}`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Middle: Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-semibold text-[#111111] text-sm truncate">
                            {course.title}
                          </h2>
                          {course.is_published ? (
                            <span className="bg-green-50 text-green-700 border border-green-100 font-semibold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Published
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-500 border border-gray-200 font-semibold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Draft
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#5F6368] flex flex-wrap gap-x-3 gap-y-1 mt-1 font-medium">
                          <span>{(course.modules || []).length} modules</span>
                          <span className="text-gray-300">•</span>
                          <span>{lessonCount} lessons</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-[#0F3D2E] font-bold">₹{(course.price || 0).toLocaleString('en-IN')}</span>
                          <span className="text-gray-300">•</span>
                          <span className="font-mono">Updated {course.last_updated ? new Date(course.last_updated).toLocaleDateString() : '—'}</span>
                        </div>
                      </div>

                      {/* Right: Controls & Toggles */}
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-gray-50 pt-3 sm:pt-0">
                        {/* Switch container */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#5F6368]">
                            Published
                          </span>
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(course.id, course.is_published)}
                            className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${
                              course.is_published ? 'bg-[#0F3D2E]' : 'bg-gray-200'
                            }`}
                          >
                            <span 
                              className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 left-0.5 transition-transform duration-200 ${
                                course.is_published ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/courses/${course.id}/edit`}
                            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#111111] hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => setCourseToDelete(course)}
                            className="border border-red-100 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 flex items-center gap-1.5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Delete Confirmation Modal (Wrapped in AnimatePresence) */}
      <AnimatePresence>
        {courseToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCourseToDelete(null)}
              className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            />
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative z-10 border border-gray-100 text-left"
            >
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
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
                    This will permanently delete the course <strong className="text-[#111111]">"{courseToDelete.title}"</strong>, all modules, and lessons. Enrolled students will lose access.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setCourseToDelete(null)}
                  className="border border-gray-200 hover:bg-gray-50 flex-1 py-2.5 rounded-xl font-semibold text-sm text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteConfirm}
                  className="bg-red-500 hover:bg-red-600 text-white flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
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

export default AdminCourses
