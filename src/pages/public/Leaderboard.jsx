import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Trophy, Award, ArrowLeft, Star, Users, Flame, ShieldAlert } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export function Leaderboard() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [currentStudentName, setCurrentStudentName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true)
        
        // 1. Fetch current student's name if logged in
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()
          
          if (profileData) {
            setCurrentStudentName(profileData.full_name)
          }
        }

        // 2. Fetch full leaderboard view
        const { data, error } = await supabase
          .from('xp_leaderboard')
          .select('rank, full_name, total_xp, badge_count')

        if (error) throw error
        setRows(data || [])
      } catch (err) {
        console.error('Failed to load leaderboard:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboardData()
  }, [user])

  // Split into podium and table
  const podiumStudents = rows.slice(0, 3)
  // Re-order podium as [2nd, 1st, 3rd] for visual centering of 1st place
  const orderedPodium = []
  if (podiumStudents[1]) orderedPodium.push({ ...podiumStudents[1], place: 2 }) // 2nd Place
  if (podiumStudents[0]) orderedPodium.push({ ...podiumStudents[0], place: 1 }) // 1st Place
  if (podiumStudents[2]) orderedPodium.push({ ...podiumStudents[2], place: 3 }) // 3rd Place

  const tableStudents = rows.slice(3)

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-[#F8F6F2] min-h-screen text-[#111111] font-sans py-12 px-6 sm:px-8 text-left">
        <div className="max-w-4xl mx-auto">
          {/* Header Skeleton */}
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-10" />

          {/* Podium Skeleton */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto h-[260px] items-end mb-16">
            <div className="h-[180px] bg-white rounded-t-2xl animate-pulse border border-gray-150" />
            <div className="h-[230px] bg-white rounded-t-2xl animate-pulse border border-gray-150" />
            <div className="h-[140px] bg-white rounded-t-2xl animate-pulse border border-gray-150" />
          </div>

          {/* Table Skeleton */}
          <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden divide-y divide-gray-100">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-6 px-6 py-5 animate-pulse">
                <div className="w-8 h-6 bg-gray-100 rounded" />
                <div className="w-10 h-10 rounded-full bg-gray-100" />
                <div className="flex-1 h-5 bg-gray-100 rounded max-w-xs" />
                <div className="w-16 h-5 bg-gray-100 rounded" />
                <div className="w-16 h-5 bg-gray-150 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#F8F6F2] min-h-screen text-[#111111] font-sans py-12 px-6 sm:px-8 select-none">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5F6368] hover:text-[#0F3D2E] transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Header Title */}
        <div className="text-center md:text-left mb-12">
          <div className="inline-flex items-center gap-2 bg-[#0F3D2E]/10 border border-[#0F3D2E]/20 text-[#0F3D2E] px-3.5 py-1.5 rounded-full text-xs font-extrabold mb-4 uppercase tracking-wider">
            <Trophy size={13} className="text-[#C8A96B] fill-[#C8A96B]" />
            <span>Leaderboard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight">
            Eduroot Champions
          </h1>
          <p className="text-sm text-[#5F6368] mt-2 font-medium max-w-xl leading-relaxed">
            Meet the most dedicated learning professionals on our platform. 
            Earn XP by finishing lessons, courses, and unlocking achievements!
          </p>
        </div>

        {rows.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-3xl border border-gray-150 p-16 text-center max-w-xl mx-auto shadow-sm">
            <div className="w-16 h-16 bg-[#F8F6F2] border border-gray-200 rounded-full flex items-center justify-center text-[#C8A96B] text-3xl mx-auto mb-6">
              🌱
            </div>
            <h3 className="text-xl font-bold text-[#111111]">Leaderboard is empty</h3>
            <p className="text-sm text-[#5F6368] mt-2 max-w-xs mx-auto leading-relaxed">
              Be the very first learner to earn XP and claim the crown!
            </p>
            <Link
              to="/courses"
              className="inline-flex items-center justify-center bg-[#0F3D2E] hover:bg-[#1a5c44] text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all duration-200 mt-6"
            >
              Start Learning
            </Link>
          </div>
        ) : (
          <>
            {/* 1st, 2nd, 3rd Podium Layout */}
            {podiumStudents.length > 0 && (
              <div className="mb-16 select-none">
                <div className="flex flex-col sm:flex-row items-end justify-center gap-6 sm:gap-4 max-w-2xl mx-auto pt-8">
                  
                  {/* Map over ordered podium [2nd Place, 1st Place, 3rd Place] */}
                  {orderedPodium.map((student) => {
                    const is1st = student.place === 1
                    const is2nd = student.place === 2
                    const is3rd = student.place === 3
                    const isCurrentUser = student.full_name === currentStudentName

                    // Color configuration based on place
                    let podiumColor = '#C8A96B' // Gold
                    let heightClass = 'h-[240px]'
                    let orderClass = 'order-2' // Center
                    let emoji = '🥇'
                    let bgGradient = 'linear-gradient(to top, rgba(200, 169, 107, 0.15), rgba(200, 169, 107, 0.02))'

                    if (is2nd) {
                      podiumColor = '#9CA3AF' // Silver
                      heightClass = 'h-[190px]'
                      orderClass = 'order-1 sm:order-1'
                      emoji = '🥈'
                      bgGradient = 'linear-gradient(to top, rgba(156, 163, 175, 0.1), rgba(156, 163, 175, 0.01))'
                    } else if (is3rd) {
                      podiumColor = '#D97706' // Bronze
                      heightClass = 'h-[150px]'
                      orderClass = 'order-3 sm:order-3'
                      emoji = '🥉'
                      bgGradient = 'linear-gradient(to top, rgba(217, 119, 6, 0.08), rgba(217, 119, 6, 0.01))'
                    }

                    return (
                      <motion.div
                        key={student.full_name}
                        initial={{ opacity: 0, y: 32 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: student.place * 0.15, ease: [0.22, 1, 0.36, 1] }}
                        className={`w-full sm:w-[190px] flex flex-col items-center ${orderClass}`}
                      >
                        {/* Avatar bubble */}
                        <div className="relative mb-3.5">
                          <div 
                            className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-extrabold border-2 shadow-md relative z-10 ${
                              isCurrentUser ? 'bg-[#0F3D2E] text-white border-[#0F3D2E]' : 'bg-white text-[#111111]'
                            }`}
                            style={{ borderColor: podiumColor }}
                          >
                            {student.full_name?.charAt(0)?.toUpperCase()}
                          </div>
                          
                          {/* Award icon badge */}
                          <div 
                            className="absolute -top-3.5 -right-2.5 w-8 h-8 rounded-full flex items-center justify-center text-xl z-20 animate-bounce"
                            style={{ animationDelay: `${student.place * 0.2}s`, animationDuration: '3s' }}
                          >
                            {emoji}
                          </div>
                        </div>

                        {/* Name and XP */}
                        <div className="text-center mb-4">
                          <h3 className={`text-sm font-extrabold truncate max-w-[150px] ${
                            isCurrentUser ? 'text-[#0F3D2E] font-black' : 'text-[#111111]'
                          }`}>
                            {student.full_name}
                            {isCurrentUser && <span className="text-[10px] block font-semibold text-gray-500">(you)</span>}
                          </h3>
                          <div className="text-[11px] text-[#5F6368] font-bold mt-0.5 flex items-center justify-center gap-1">
                            <Star size={11} className="text-[#C8A96B] fill-[#C8A96B]" />
                            <span>{student.badge_count} Badge{student.badge_count !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        {/* Podium Stand */}
                        <div 
                          className={`w-full rounded-t-2xl border-t-4 shadow-sm flex flex-col justify-end p-5 select-none ${heightClass}`}
                          style={{ 
                            borderTopColor: podiumColor,
                            background: bgGradient
                          }}
                        >
                          <div className="text-center">
                            <span 
                              className="text-2xl font-black block tracking-tighter"
                              style={{ color: podiumColor }}
                            >
                              #{student.place}
                            </span>
                            <span className="text-sm font-extrabold text-[#0F3D2E] mt-1 block">
                              {student.total_xp.toLocaleString()}
                            </span>
                            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mt-0.5">
                              XP
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}

                </div>
              </div>
            )}

            {/* Global Standings Table */}
            {tableStudents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-sm"
              >
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#5F6368]">
                    Global Standings
                  </h2>
                  <span className="text-[11px] font-bold text-gray-400">
                    Showing ranks #4 and below
                  </span>
                </div>

                <div className="divide-y divide-gray-100 text-left">
                  {tableStudents.map((row, index) => {
                    const isCurrentUser = row.full_name === currentStudentName

                    return (
                      <div
                        key={row.full_name}
                        className={`flex items-center gap-6 px-6 py-4.5 hover:bg-[#F8F6F2]/30 transition-colors
                          ${isCurrentUser ? 'bg-[#0F3D2E]/5 border-l-4 border-[#0F3D2E]' : 'border-l-4 border-transparent'}`}
                      >
                        {/* Rank */}
                        <div className="w-8 text-center flex-shrink-0">
                          <span className="text-sm font-extrabold text-[#5F6368]">
                            {row.rank}
                          </span>
                        </div>

                        {/* Visual Avatar Initials */}
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center
                            text-xs font-bold flex-shrink-0"
                          style={{
                            backgroundColor: isCurrentUser ? '#0F3D2E' : '#F8F6F2',
                            color: isCurrentUser ? '#fff' : '#5F6368',
                            border: isCurrentUser ? 'none' : '1px solid #e5e5e5',
                          }}
                        >
                          {row.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>

                        {/* Name Column */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${
                            isCurrentUser ? 'text-[#0F3D2E] font-extrabold' : 'text-[#111111]'
                          }`}>
                            {row.full_name}
                            {isCurrentUser && (
                              <span className="ml-2 text-[10px] font-normal text-[#5F6368]">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-[#5F6368] font-medium flex items-center gap-1.5 mt-0.5">
                            <Award size={11} className="text-[#C8A96B]" />
                            <span>{row.badge_count} Earned Badge{row.badge_count !== 1 ? 's' : ''}</span>
                          </p>
                        </div>

                        {/* XP Column */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-extrabold text-[#0F3D2E]">
                            {row.total_xp.toLocaleString()}
                          </p>
                          <p className="text-[9px] uppercase tracking-widest text-[#5F6368] font-bold">XP</p>
                        </div>

                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Leaderboard
