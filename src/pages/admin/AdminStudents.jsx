import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  useReactTable, 
  getCoreRowModel, 
  getFilteredRowModel, 
  getPaginationRowModel,
  flexRender 
} from '@tanstack/react-table'
import { 
  Search, 
  Download, 
  Eye, 
  Trophy, 
  Loader2, 
  CheckCircle2, 
  Circle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Mail
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import api from '../../lib/api'
import AdminSidebar from '../../components/admin/AdminSidebar'

export function AdminStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [xpLeaderboard, setXpLeaderboard] = useState([])

  // Filters State
  const [searchTerm, setSearchTerm] = useState('')
  const [courseFilter, setCourseFilter] = useState('ALL')
  const [progressFilter, setProgressFilter] = useState('ALL')

  // Expanded Row State (keeps track of row expansions)
  const [expandedRows, setExpandedRows] = useState({})
  const [rowProgressDetails, setRowProgressDetails] = useState({})

  // Fetch student progress views and merge XP data
  const fetchStudents = async () => {
    try {
      setLoading(true)
      
      // 1. Fetch main progress views
      const { data: progressData, error: progErr } = await supabase
        .from('admin_student_progress')
        .select('*')
        .order('enrolled_at', { ascending: false })

      if (progErr) throw progErr

      // 2. Fetch student XP logs
      const { data: xpData, error: xpErr } = await supabase
        .from('user_xp')
        .select('user_id, total_xp')

      if (xpErr) {
        console.warn('AdminStudents: XP retrieval had warning:', xpErr.message)
      }

      // Merge XP data client-side
      const xpMap = {}
      xpData?.forEach(item => {
        xpMap[item.user_id] = item.total_xp
      })

      const studentsWithXP = (progressData || []).map(s => ({
        ...s,
        total_xp: xpMap[s.user_id] || 0
      }))

      setStudents(studentsWithXP)

      // 3. Fetch administrative XP Leaderboard
      const { data: leadData, error: leadErr } = await supabase
        .from('xp_leaderboard')
        .select('rank, full_name, total_xp, badge_count')
        .limit(10)

      if (leadErr) {
        console.error('AdminStudents: Leaderboard query failed:', leadErr.message)
      } else {
        setXpLeaderboard(leadData || [])
      }

    } catch (err) {
      toast.error('Failed to load students.')
      console.error('Fetch students error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  // Dynamic Course options from loaded data
  const courseOptions = useMemo(() => {
    const coursesMap = {}
    students.forEach(s => {
      if (s.course_title) {
        coursesMap[s.course_title] = true
      }
    })
    return Object.keys(coursesMap).sort()
  }, [students])

  // Filtered Students client-side logic
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // 1. Search term match
      const nameMatch = s.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      // 2. Course title match
      const courseMatch = courseFilter === 'ALL' || s.course_title === courseFilter

      // 3. Progress filter match
      let progressMatch = true
      const pct = s.progress_pct || 0
      if (progressFilter === 'NOT_STARTED') progressMatch = pct === 0
      else if (progressFilter === 'IN_PROGRESS') progressMatch = pct > 0 && pct < 100
      else if (progressFilter === 'COMPLETED') progressMatch = pct === 100

      return nameMatch && courseMatch && progressMatch
    })
  }, [students, searchTerm, courseFilter, progressFilter])

  // Export CSV Action
  const exportCSV = () => {
    if (filteredStudents.length === 0) {
      toast.error('No student data to export.')
      return
    }

    try {
      const headers = ['Name', 'Course', 'Enrolled', 'Progress', 'Total XP']
      const rows = filteredStudents.map(s => [
        `"${s.full_name || 'Anonymous Student'}"`,
        `"${s.course_title}"`,
        new Date(s.enrolled_at).toLocaleDateString(),
        `${s.progress_pct || 0}%`,
        s.total_xp || 0
      ])

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `eduroot-students-${Date.now()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Students catalog exported!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to export CSV.')
    }
  }

  // Handle Fetch and Toggle Expand Detail Row
  const handleToggleExpand = async (rowId, student) => {
    const isOpen = !!expandedRows[rowId]

    if (isOpen) {
      setExpandedRows(prev => ({ ...prev, [rowId]: false }))
      return
    }

    setExpandedRows(prev => ({ ...prev, [rowId]: true }))

    // Fetch details if not cached
    if (!rowProgressDetails[rowId]) {
      setRowProgressDetails(prev => ({
        ...prev,
        [rowId]: { loading: true, data: null, error: null }
      }))

      try {
        // Fetch modules of student's course
        const { data: modulesList, error: modErr } = await supabase
          .from('modules')
          .select(`
            id,
            title,
            order_index,
            lessons (
              id,
              title,
              order_index
            )
          `)
          .eq('course_id', student.course_id)
          .order('order_index')

        if (modErr) throw modErr

        // Fetch user's completion progress
        const { data: progressList, error: progErr } = await supabase
          .from('lesson_progress')
          .select('lesson_id, completed, completed_at')
          .eq('user_id', student.user_id)
          .eq('course_id', student.course_id)
          .eq('completed', true)

        if (progErr) throw progErr

        const completedMap = new Set((progressList || []).map(p => p.lesson_id))
        const completedDates = (progressList || []).reduce((acc, curr) => {
          acc[curr.lesson_id] = curr.completed_at
          return acc
        }, {})

        // Format modules with sorted and completion-mapped lessons
        const structuredModules = (modulesList || []).map(m => {
          const sortedLessons = m.lessons ? [...m.lessons].sort((a, b) => a.order_index - b.order_index) : []
          return {
            ...m,
            lessons: sortedLessons.map(l => ({
              ...l,
              completed: completedMap.has(l.id),
              completed_at: completedDates[l.id] || null
            }))
          }
        })

        setRowProgressDetails(prev => ({
          ...prev,
          [rowId]: { loading: false, data: structuredModules, error: null }
        }))

      } catch (err) {
        console.error('Error fetching expand row details:', err)
        setRowProgressDetails(prev => ({
          ...prev,
          [rowId]: { loading: false, data: null, error: err.message || 'Failed to fetch details.' }
        }))
      }
    }
  }

  const handleSendCertificate = async (row) => {
    const note = prompt(
      'Optional note to include in the email (leave blank for none):'
    )
    if (note === null) return   // user cancelled

    try {
      await api.post('/api/v1/email/send-certificate', {
        user_id:  row.user_id,
        course_id: row.course_id,
        note:     note || ''
      })
      toast.success(`Certificate email sent to ${row.full_name}!`)
    } catch {
      toast.error('Failed to send. Check backend logs.')
    }
  }

  // Category Theme Utilities

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'digital-marketing':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md text-[10px] font-bold w-fit uppercase'
      case 'graphic-designing':
        return 'bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md text-[10px] font-bold w-fit uppercase'
      case 'video-editing':
        return 'bg-gray-100 text-gray-800 border border-gray-200 px-2 py-0.5 rounded-md text-[10px] font-bold w-fit uppercase'
      default:
        return 'bg-gray-50 text-gray-600 border border-gray-150 px-2 py-0.5 rounded-md text-[10px] font-bold w-fit uppercase'
    }
  }

  const formatCategoryName = (category) => {
    if (!category) return '—'
    return category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  // Tanstack Table Columns Definition
  const columns = useMemo(() => [
    {
      accessorKey: 'full_name',
      header: 'Student',
      cell: ({ row }) => (
        <div className="flex flex-col text-left">
          <span className="font-semibold text-[#111111] text-sm">
            {row.original.full_name || 'Anonymous Student'}
          </span>
          <span className="font-mono text-[9px] text-gray-400 mt-0.5 max-w-[120px] truncate">
            {row.original.user_id}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'course_title',
      header: 'Course',
      cell: ({ row }) => (
        <div className="flex flex-col items-start gap-1 text-left">
          <span className="font-semibold text-[#111111] text-xs md:text-sm">
            {row.original.course_title}
          </span>
          <span className={getCategoryBadge(row.original.category)}>
            {formatCategoryName(row.original.category)}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'enrolled_at',
      header: 'Enrolled',
      cell: ({ row }) => (
        <span className="text-xs text-[#5F6368] font-mono font-medium">
          {row.original.enrolled_at ? new Date(row.original.enrolled_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }) : '—'}
        </span>
      )
    },
    {
      accessorKey: 'progress_pct',
      header: 'Progress',
      cell: ({ row }) => (
        <div className="flex items-center justify-start">
          <div className="w-20 md:w-24 h-1.5 bg-gray-100 rounded-full inline-block overflow-hidden mr-2">
            <div 
              className="h-full bg-[#0F3D2E] rounded-full transition-all duration-300"
              style={{ width: `${row.original.progress_pct || 0}%` }}
            />
          </div>
          <span className="text-xs font-extrabold text-[#111111]">
            {row.original.progress_pct || 0}%
          </span>
        </div>
      )
    },
    {
      accessorKey: 'total_xp',
      header: 'Total XP',
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 bg-[#0F3D2E]/5 border border-[#0F3D2E]/10 rounded-full px-2.5 py-0.5 text-xs font-bold text-[#0F3D2E]">
          ⭐ {row.original.total_xp?.toLocaleString() || 0} XP
        </span>
      )
    },
    {
      header: 'Status',
      cell: ({ row }) => {
        const pct = row.original.progress_pct || 0
        if (pct === 0) {
          return (
            <span className="bg-gray-100 text-gray-500 border border-gray-150 font-semibold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Not started
            </span>
          )
        } else if (pct === 100) {
          return (
            <span className="bg-green-50 text-green-700 border border-green-100 font-semibold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Completed
            </span>
          )
        } else {
          return (
            <span className="bg-blue-50 text-blue-600 border border-blue-150 font-semibold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              In progress
            </span>
          )
        }
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const rowId = row.id
        const isExpanded = !!expandedRows[rowId]

        return (
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => handleToggleExpand(rowId, row.original)}
              className={`p-1.5 rounded-lg border transition-all active:scale-95 cursor-pointer ${
                isExpanded 
                  ? 'bg-[#0F3D2E] text-white border-[#0F3D2E]' 
                  : 'border-gray-200 text-[#5F6368] hover:bg-gray-50 hover:text-[#111111]'
              }`}
              title="Inspect lesson completions"
            >
              <Eye className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleSendCertificate(row.original)}
              disabled={row.original.progress_pct < 100}
              title={row.original.progress_pct < 100 ? 'Student must complete the course first' : 'Send certificate email'}
              className="p-1.5 rounded-lg text-[#C8A96B] hover:bg-[#C8A96B]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Mail size={16} />
            </button>
          </div>
        )

      }
    }
  ], [expandedRows])

  // Setup useReactTable hook
  const table = useReactTable({
    data: filteredStudents,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  })

  return (
    <div className="flex min-h-screen bg-[#F8F6F2]">
      <AdminSidebar />
      <main className="flex-1 ml-0 md:ml-60 transition-all">
        {/* Page Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between text-left">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[#111111]">Students</h1>
            <span className="text-xs text-[#5F6368] mt-0.5">Admin / Students</span>
          </div>
          <button
            onClick={exportCSV}
            className="border border-gray-200 hover:bg-gray-50 text-[#111111] font-semibold px-4 py-2.5 rounded-xl text-sm transition-all duration-150 flex items-center gap-1.5 shadow-sm active:scale-95 select-none cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </header>

        {loading ? (
          <div className="min-h-[75vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#0F3D2E]" />
              <span className="text-sm font-semibold text-[#0F3D2E]">Fetching student directories...</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col mt-4">
            
            {/* Filter row */}
            <div className="bg-white border-y border-gray-100 px-6 py-4 flex flex-wrap gap-4 items-center justify-between shadow-sm mx-6 rounded-2xl">
              <div className="flex items-center gap-2 text-xs font-bold text-[#5F6368] uppercase">
                <Filter className="w-4 h-4 text-[#0F3D2E]" />
                <span>Filters</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 flex-1 justify-end">
                {/* Search */}
                <div className="relative min-w-[200px] flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#0F3D2E] focus:ring-1 focus:ring-[#0F3D2E]/10"
                  />
                </div>

                {/* Course filter select */}
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-[#111111] focus:outline-none focus:border-[#0F3D2E]"
                >
                  <option value="ALL">All Courses</option>
                  {courseOptions.map(title => (
                    <option key={title} value={title}>{title}</option>
                  ))}
                </select>

                {/* Progress filter select */}
                <select
                  value={progressFilter}
                  onChange={(e) => setProgressFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-[#111111] focus:outline-none focus:border-[#0F3D2E]"
                >
                  <option value="ALL">All Progress</option>
                  <option value="NOT_STARTED">Not started (0%)</option>
                  <option value="IN_PROGRESS">In progress (1-99%)</option>
                  <option value="COMPLETED">Completed (100%)</option>
                </select>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm mx-6 mt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id} className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-[#5F6368] uppercase">
                        {headerGroup.headers.map(header => (
                          <th key={header.id} className="px-6 py-4 text-left first:pl-6 last:pr-6">
                            {header.isPlaceholder 
                              ? null 
                              : flexRender(header.column.columnDef.header, header.getContext())
                            }
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {table.getRowModel().rows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="px-6 py-16 text-center text-gray-400">
                          No student matching filters found.
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map(row => {
                        const rowId = row.id
                        const isExpanded = !!expandedRows[rowId]
                        const details = rowProgressDetails[rowId]

                        return (
                          <React.Fragment key={row.id}>
                            {/* Main Student Row */}
                            <tr className="hover:bg-gray-50/40 transition-colors border-b border-gray-100 last:border-0">
                              {row.getVisibleCells().map(cell => (
                                <td key={cell.id} className="px-6 py-4 first:pl-6 last:pr-6 align-middle">
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                              ))}
                            </tr>

                            {/* Sub-row visual Inspection panel */}
                            {isExpanded && (
                              <tr className="bg-[#F8F6F2]/30 border-b border-gray-150 text-left">
                                <td colSpan={columns.length} className="px-8 py-5">
                                  <div className="bg-white border border-gray-150 rounded-xl p-5 shadow-inner">
                                    <h4 className="text-xs font-extrabold text-[#0F3D2E] uppercase tracking-wider mb-4 border-b border-gray-50 pb-2">
                                      Detailed Lesson Progress Checklist
                                    </h4>

                                    {details?.loading && (
                                      <div className="flex items-center gap-2 justify-center py-6 text-[#0F3D2E]">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="text-xs font-semibold">Loading lesson progress detail...</span>
                                      </div>
                                    )}

                                    {details?.error && (
                                      <p className="text-xs text-red-500 text-center py-4">
                                        Error: {details.error}
                                      </p>
                                    )}

                                    {details?.data && (
                                      <div className="flex flex-col gap-5">
                                        {details.data.length === 0 ? (
                                          <p className="text-xs text-gray-400 text-center py-3">
                                            No curriculum modules or lessons defined for this course.
                                          </p>
                                        ) : (
                                          details.data.map(m => (
                                            <div key={m.id} className="flex flex-col gap-2">
                                              <span className="text-xs font-bold text-[#111111] bg-gray-50 px-2.5 py-1 rounded w-fit border border-gray-100">
                                                Module: {m.title || 'Untitled Module'}
                                              </span>
                                              
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 mt-1.5 pl-2">
                                                {(m.lessons || []).map(l => (
                                                  <div 
                                                    key={l.id} 
                                                    className="flex items-center gap-2 py-1 px-2.5 rounded-lg border border-transparent hover:border-gray-50 hover:bg-gray-50/50 transition-colors"
                                                  >
                                                    {l.completed ? (
                                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                                    ) : (
                                                      <Circle className="w-4 h-4 text-gray-200 flex-shrink-0" />
                                                    )}
                                                    <span className={`text-xs font-medium ${l.completed ? 'text-[#111111]' : 'text-gray-400'}`}>
                                                      {l.title || 'Untitled Lesson'}
                                                    </span>

                                                    {l.completed && l.completed_at && (
                                                      <span className="text-[9px] font-mono text-gray-400 ml-auto whitespace-nowrap bg-gray-100/80 px-1.5 py-0.5 rounded">
                                                        Done {new Date(l.completed_at).toLocaleDateString()}
                                                      </span>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {table.getPageCount() > 1 && (
                <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 select-none">
                  <span className="text-xs font-medium text-[#5F6368]">
                    Showing Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* XP Leaderboard Widget */}
            {xpLeaderboard.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm mx-6 mt-6 mb-8 text-left">
                <div className="px-6 py-4 border-b border-gray-100 select-none flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#C8A96B] fill-[#C8A96B]" />
                  <h2 className="text-base font-semibold text-[#111111]">
                    Eduroot XP Leaderboard (Top 10)
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-[#5F6368] uppercase select-none">
                        <th className="text-left px-6 py-3 font-semibold uppercase tracking-wider">Rank</th>
                        <th className="text-left px-6 py-3 font-semibold uppercase tracking-wider">Student Name</th>
                        <th className="text-left px-6 py-3 font-semibold uppercase tracking-wider">Badges</th>
                        <th className="text-left px-6 py-3 font-semibold uppercase tracking-wider text-right">Total XP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {xpLeaderboard.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                          <td className="px-6 py-3.5 font-bold text-sm text-[#5F6368]">
                            {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : `#${row.rank}`}
                          </td>
                          <td className="px-6 py-3.5 text-sm text-[#111111] font-semibold">
                            {row.full_name}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-gray-500 font-medium">
                            {row.badge_count} badge{row.badge_count !== 1 ? 's' : ''}
                          </td>
                          <td className="px-6 py-3.5 text-sm text-[#0F3D2E] font-extrabold text-right">
                            {row.total_xp.toLocaleString()} XP
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  )
}

export default AdminStudents
