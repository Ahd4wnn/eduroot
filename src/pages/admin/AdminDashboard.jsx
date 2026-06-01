import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Users, BookOpen, TrendingUp, Award, ArrowRight, Edit, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/admin/AdminSidebar'
import StatCard from '../../components/admin/StatCard'

export function AdminDashboard() {
  const [stats, setStats] = useState({
    total_students: 0,
    published_courses: 0,
    total_enrollments: 0,
    total_certificates: 0
  })
  const [recentEnrollments, setRecentEnrollments] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)

        // 1. Fetch Stats View
        const { data: statsData, error: statsErr } = await supabase
          .from('admin_stats')
          .select('*')
          .single()

        if (statsErr) {
          console.error('Error fetching admin stats:', statsErr)
        } else if (statsData) {
          setStats(statsData)
        }

        // 2. Fetch Recent Enrollments Progress View
        const { data: enrollData, error: enrollErr } = await supabase
          .from('admin_student_progress')
          .select('*')
          .order('enrolled_at', { ascending: false })
          .limit(5)

        if (enrollErr) {
          console.error('Error fetching recent enrollments:', enrollErr)
        } else if (enrollData) {
          setRecentEnrollments(enrollData)
        }

        // 3. Fetch Courses Quick Summary
        const { data: coursesData, error: coursesErr } = await supabase
          .from('courses')
          .select('id, title, category, is_published, total_lessons')
          .order('created_at', { ascending: false })

        if (coursesErr) {
          console.error('Error fetching courses catalog:', coursesErr)
        } else if (coursesData) {
          setCourses(coursesData)
        }

      } catch (err) {
        console.error('Unhandled dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'digital-marketing':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md text-xs font-semibold'
      case 'graphic-designing':
        return 'bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md text-xs font-semibold'
      case 'video-editing':
        return 'bg-gray-100 text-gray-800 border border-gray-200 px-2 py-0.5 rounded-md text-xs font-semibold'
      default:
        return 'bg-gray-50 text-gray-600 border border-gray-100 px-2 py-0.5 rounded-md text-xs font-semibold'
    }
  }

  const formatCategoryName = (category) => {
    if (!category) return '—'
    return category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  return (
    <div className="flex min-h-screen bg-[#F8F6F2]">
      <AdminSidebar />
      <main className="flex-1 ml-0 md:ml-60 transition-all">
        {/* Admin Header Panel */}
        <header className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between text-left">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[#111111]">Dashboard</h1>
            <span className="text-xs text-[#5F6368] mt-0.5">Admin / Overview</span>
          </div>
          <div className="flex items-center gap-3">
            {loading && <Loader2 className="w-5 h-5 animate-spin text-[#0F3D2E]" />}
          </div>
        </header>

        {loading ? (
          <div className="min-h-[75vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#0F3D2E]" />
              <span className="text-sm font-semibold text-[#0F3D2E]">Loading administrator dashboard...</span>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="p-6 text-left"
          >
            {/* Stats Row Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                value={stats.total_students}
                label="Total Students"
                icon={Users}
                color="#0F3D2E"
                index={0}
              />
              <StatCard
                value={stats.published_courses}
                label="Live Courses"
                icon={BookOpen}
                color="#C8A96B"
                index={1}
              />
              <StatCard
                value={stats.total_enrollments}
                label="Total Enrollments"
                icon={TrendingUp}
                color="#0F3D2E"
                index={2}
              />
              <StatCard
                value={stats.total_certificates}
                label="Certificates"
                icon={Award}
                color="#C8A96B"
                index={3}
              />
            </div>

            {/* Courses Overview and Recent Enrollments lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              
              {/* Courses Quick Overview Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-[#111111]">Your Courses</h2>
                  <Link 
                    to="/admin/courses" 
                    className="text-sm text-[#0F3D2E] hover:text-[#185f48] font-bold flex items-center gap-1 transition-colors duration-150"
                  >
                    <span>Manage all</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-50 flex-1">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-[#5F6368] uppercase">
                        <th className="px-5 py-3.5 text-left">Course</th>
                        <th className="px-5 py-3.5 text-left">Category</th>
                        <th className="px-5 py-3.5 text-center">Lessons</th>
                        <th className="px-5 py-3.5 text-center">Status</th>
                        <th className="px-5 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {courses.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                            No courses available. Create one to get started!
                          </td>
                        </tr>
                      ) : (
                        courses.slice(0, 5).map((course) => (
                          <tr key={course.id} className="hover:bg-gray-50/40 transition-colors">
                            <td className="px-5 py-3.5 font-semibold text-[#111111] max-w-[160px] truncate">
                              {course.title}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={getCategoryBadge(course.category)}>
                                {formatCategoryName(course.category)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-center font-medium text-[#5F6368]">
                              {course.total_lessons}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {course.is_published ? (
                                <span className="bg-green-50 text-green-700 border border-green-100 font-semibold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                                  Published
                                </span>
                              ) : (
                                <span className="bg-gray-100 text-gray-500 border border-gray-200 font-semibold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                                  Draft
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <Link 
                                to={`/admin/courses/${course.id}/edit`}
                                className="inline-flex items-center gap-1 text-[#0F3D2E] hover:text-[#185f48] text-xs font-bold transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Enrollments Table Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-[#111111]">Recent Enrollments</h2>
                  <Link 
                    to="/admin/students" 
                    className="text-sm text-[#0F3D2E] hover:text-[#185f48] font-bold flex items-center gap-1 transition-colors duration-150"
                  >
                    <span>Manage all</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-50 flex-1">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-[#5F6368] uppercase">
                        <th className="px-5 py-3.5 text-left">Student</th>
                        <th className="px-5 py-3.5 text-left">Course</th>
                        <th className="px-5 py-3.5 text-left">Enrolled</th>
                        <th className="px-5 py-3.5 text-left">Progress</th>
                        <th className="px-5 py-3.5 text-center">Certificate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentEnrollments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                            No recent enrollments.
                          </td>
                        </tr>
                      ) : (
                        recentEnrollments.map((student) => (
                          <tr key={`${student.user_id}-${student.course_id}`} className="hover:bg-gray-50/40 transition-colors">
                            <td className="px-5 py-3.5 font-semibold text-[#111111]">
                              {student.full_name || 'Anonymous User'}
                            </td>
                            <td className="px-5 py-3.5 text-[#5F6368] font-medium max-w-[140px] truncate">
                              {student.course_title}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-[#5F6368] whitespace-nowrap font-mono">
                              {student.enrolled_at ? new Date(student.enrolled_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              }) : '—'}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center">
                                <div className="w-20 h-1.5 bg-gray-100 rounded-full inline-block overflow-hidden mr-2">
                                  <div 
                                    className="h-full bg-[#0F3D2E] rounded-full transition-all duration-300"
                                    style={{ width: `${student.progress_pct || 0}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-[#111111]">{student.progress_pct || 0}%</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {student.certificate_id ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span>Issued</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-150 rounded-full px-2.5 py-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                  <span>Pending</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}

export default AdminDashboard
