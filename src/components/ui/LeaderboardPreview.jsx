import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function LeaderboardPreview({ currentUserName }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('xp_leaderboard')
          .select('rank, full_name, total_xp, badge_count')
          .limit(5)

        if (!error && data) {
          setRows(data)
        }
      } catch (err) {
        console.error('Failed to load leaderboard preview:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50 select-none">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
            <div className="w-8 h-5 bg-gray-100 rounded flex-shrink-0" />
            <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              <div className="h-4 bg-gray-100 rounded w-28" />
              <div className="h-3 bg-gray-50 rounded w-16" />
            </div>
            <div className="w-12 h-6 bg-gray-100 rounded flex-shrink-0" />
          </div>
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 select-none">
        <p className="text-sm">No one on the leaderboard yet. Complete lessons to earn XP!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50 select-none text-left">
      {rows.map((row, i) => {
        const isCurrentUser = row.full_name === currentUserName
        const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null

        return (
          <div
            key={i}
            className={`flex items-center gap-4 px-6 py-4 transition-colors
              ${isCurrentUser ? 'bg-[#0F3D2E]/5 border-l-4 border-[#0F3D2E]' : 'border-l-4 border-transparent'}`}
          >
            {/* Rank */}
            <div className="w-8 text-center flex-shrink-0">
              {rankEmoji ? (
                <span className="text-xl">{rankEmoji}</span>
              ) : (
                <span className="text-sm font-bold text-[#5F6368]">{row.rank}</span>
              )}
            </div>

            {/* Avatar initial */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center
                text-xs font-bold flex-shrink-0"
              style={{
                backgroundColor: isCurrentUser ? '#0F3D2E' : '#F8F6F2',
                color: isCurrentUser ? '#fff' : '#5F6368',
                border: isCurrentUser ? 'none' : '1px solid #e5e5e5',
              }}
            >
              {row.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${
                isCurrentUser ? 'text-[#0F3D2E]' : 'text-[#111111]'
              }`}>
                {row.full_name}
                {isCurrentUser && (
                  <span className="ml-2 text-[10px] font-normal text-[#5F6368]">
                    (you)
                  </span>
                )}
              </p>
              <p className="text-xs text-[#5F6368]">
                {row.badge_count} badge{row.badge_count !== 1 ? 's' : ''}
              </p>
            </div>

            {/* XP */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-[#0F3D2E]">
                {row.total_xp.toLocaleString()}
              </p>
              <p className="text-[10px] text-[#5F6368]">XP</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default LeaderboardPreview
