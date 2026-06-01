import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// XP needed to reach each level
export const LEVELS = [
  { name: 'Beginner',  minXp: 0,    color: '#5F6368', emoji: '🌱' },
  { name: 'Explorer',  minXp: 100,  color: '#3B82F6', emoji: '🧭' },
  { name: 'Learner',   minXp: 300,  color: '#10B981', emoji: '📖' },
  { name: 'Achiever',  minXp: 600,  color: '#C8A96B', emoji: '⭐' },
  { name: 'Master',    minXp: 1000, color: '#0F3D2E', emoji: '🏆' },
]

export const getLevel = (xp) => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) return LEVELS[i]
  }
  return LEVELS[0]
}

export const getNextLevel = (xp) => {
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp < LEVELS[i].minXp) return LEVELS[i]
  }
  return null // already at max level
}

export const getLevelProgress = (xp) => {
  const current = getLevel(xp)
  const next = getNextLevel(xp)
  if (!next) return 100
  const range = next.minXp - current.minXp
  const earned = xp - current.minXp
  return Math.round((earned / range) * 100)
}

export function useXP(userId) {
  const [xpData, setXpData]       = useState(null)
  const [badges, setBadges]       = useState([])
  const [allBadges, setAllBadges] = useState([])
  const [loading, setLoading]     = useState(true)

  const fetchXP = async () => {
    if (!userId) return

    const [xpRes, userBadgesRes, allBadgesRes] = await Promise.all([
      supabase.from('user_xp').select('*').eq('user_id', userId).single(),
      supabase.from('user_badges')
        .select('badge_id, earned_at')
        .eq('user_id', userId),
      supabase.from('badges').select('*')
    ])

    setXpData(xpRes.data || { total_xp: 0 })
    setBadges(userBadgesRes.data || [])
    setAllBadges(allBadgesRes.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchXP() }, [userId])

  // Award XP — called from frontend after actions
  const awardXP = async (amount, reason, referenceId = null) => {
    if (!userId) return
    await supabase.rpc('add_xp', {
      p_user_id:     userId,
      p_amount:      amount,
      p_reason:      reason,
      p_reference_id: referenceId
    })
    setXpData(prev => ({
      ...prev,
      total_xp: (prev?.total_xp || 0) + amount
    }))
  }

  // Award a badge — upserts into user_badges, then awards XP
  const awardBadge = async (badgeId) => {
    if (!userId) return
    const alreadyHas = badges.some(b => b.badge_id === badgeId)
    if (alreadyHas) return null

    const { error } = await supabase.from('user_badges').insert({
      user_id: userId,
      badge_id: badgeId
    })
    if (error) return null

    // Award XP for badge
    const badge = allBadges.find(b => b.id === badgeId)
    if (badge?.xp_reward) {
      await awardXP(badge.xp_reward, 'badge_earned', badgeId)
    }

    // Update local state
    setBadges(prev => [...prev, {
      badge_id: badgeId,
      earned_at: new Date().toISOString()
    }])

    return badge
  }

  const hasBadge = (badgeId) => badges.some(b => b.badge_id === badgeId)

  const totalXP   = xpData?.total_xp || 0
  const level     = getLevel(totalXP)
  const nextLevel = getNextLevel(totalXP)
  const progress  = getLevelProgress(totalXP)

  return {
    totalXP, level, nextLevel, progress,
    badges, allBadges, loading,
    awardXP, awardBadge, hasBadge,
    refetch: fetchXP
  }
}
