import { supabase } from './supabase'

export const LEVELS = [
  { name: 'Seedling',  min: 0,    max: 99,        icon: '🌱', color: '#5F6368' },
  { name: 'Learner',   min: 100,  max: 249,        icon: '📚', color: '#0F3D2E' },
  { name: 'Explorer',  min: 250,  max: 499,        icon: '🧭', color: '#1a5c44' },
  { name: 'Achiever',  min: 500,  max: 999,        icon: '⚡', color: '#C8A96B' },
  { name: 'Master',    min: 1000, max: Infinity,   icon: '👑', color: '#C8A96B' },
]

export const XP_REWARDS = {
  LESSON_COMPLETE: 10,
  COURSE_COMPLETE: 100,
  REFERRAL_ENROLL: 50,
}

export const getLevel = (xp) =>
  LEVELS.find(l => xp >= l.min && xp <= l.max) || LEVELS[0]

export const getNextLevel = (xp) => {
  const idx = LEVELS.findIndex(l => xp >= l.min && xp <= l.max)
  return LEVELS[idx + 1] || null
}

export const getLevelProgress = (xp) => {
  const level = getLevel(xp)
  const next  = getNextLevel(xp)
  if (!next) return 100
  return Math.min(
    Math.round(((xp - level.min) / (next.min - level.min)) * 100),
    100
  )
}

export const awardXP = async (userId, amount, reason, referenceId = null) => {
  try {
    await supabase.from('xp_transactions').insert({
      user_id:      userId,
      xp_amount:    amount,
      reason,
      reference_id: referenceId
    })

    const { data: existing } = await supabase
      .from('user_xp')
      .select('total_xp')
      .eq('user_id', userId)
      .maybeSingle()              // ← maybeSingle: new users have no row yet

    if (existing) {
      const newTotal = existing.total_xp + amount
      await supabase
        .from('user_xp')
        .update({ total_xp: newTotal, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
      return newTotal
    } else {
      await supabase
        .from('user_xp')
        .insert({ user_id: userId, total_xp: amount })
      return amount
    }
  } catch (err) {
    console.error('awardXP failed:', err)
    return null
  }
}

export const awardBadge = async (userId, badgeId) => {
  try {
    const { data: existing } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_id', badgeId)
      .maybeSingle()              // ← maybeSingle: badge may not exist yet

    if (existing) return null

    const { error } = await supabase
      .from('user_badges')
      .insert({ user_id: userId, badge_id: badgeId })

    if (error) throw error

    const { data: badge } = await supabase
      .from('badges')
      .select('*')
      .eq('id', badgeId)
      .maybeSingle()              // ← maybeSingle

    if (badge?.xp_reward) {
      await awardXP(userId, badge.xp_reward, 'badge', badgeId)
    }

    return badge
  } catch (err) {
    console.error('awardBadge failed:', err)
    return null
  }
}

export const checkBadgesAfterLesson = async (
  userId,
  courseId,
  category,
  totalCompletedLessons,
  courseProgress
) => {
  const newBadges = []

  if (totalCompletedLessons === 1) {
    const b = await awardBadge(userId, 'first_step')
    if (b) newBadges.push(b)
  }
  if (totalCompletedLessons === 10) {
    const b = await awardBadge(userId, 'on_a_roll')
    if (b) newBadges.push(b)
  }
  if (courseProgress >= 50 && courseProgress < 60) {
    const b = await awardBadge(userId, 'halfway_hero')
    if (b) newBadges.push(b)
  }

  return newBadges
}

export const checkBadgesAfterCourse = async (
  userId,
  category,
  allEnrolledCategories,
  allCompletedCategories
) => {
  const newBadges = []

  const categoryBadgeMap = {
    'digital-marketing': 'digital_marketer',
    'graphic-designing': 'design_guru',
    'video-editing':     'video_pro',
  }

  const badgeId = categoryBadgeMap[category]
  if (badgeId) {
    const b = await awardBadge(userId, badgeId)
    if (b) newBadges.push(b)
  }

  const allThree = ['digital-marketing', 'graphic-designing', 'video-editing']
  if (allThree.every(c => allCompletedCategories.includes(c))) {
    const b = await awardBadge(userId, 'triple_crown')
    if (b) newBadges.push(b)
  }

  return newBadges
}

export const checkReferralBadges = async (userId) => {
  const newBadges = []

  // No .single() here — this returns multiple rows
  const { data } = await supabase
    .from('referrals')
    .select('id')
    .eq('referrer_id', userId)
    .eq('status', 'enrolled')

  const enrolledCount = data?.length || 0

  if (enrolledCount >= 1) {
    const b = await awardBadge(userId, 'connector')
    if (b) newBadges.push(b)
  }
  if (enrolledCount >= 5) {
    const b = await awardBadge(userId, 'super_connector')
    if (b) newBadges.push(b)
  }

  return newBadges
}

export const fetchUserXPData = async (userId) => {
  const [xpRes, badgesRes, allBadgesRes] = await Promise.all([
    supabase
      .from('user_xp')
      .select('total_xp')
      .eq('user_id', userId)
      .maybeSingle(),             // ← maybeSingle: new users have no row

    supabase
      .from('user_badges')
      .select('badge_id, earned_at')
      .eq('user_id', userId),

    supabase
      .from('badges')
      .select('*')
  ])

  const totalXp        = xpRes.data?.total_xp || 0
  const earnedBadgeIds = new Set(
    (badgesRes.data || []).map(b => b.badge_id)
  )
  const earnedAtMap    = Object.fromEntries(
    (badgesRes.data || []).map(b => [b.badge_id, b.earned_at])
  )
  const allBadges      = (allBadgesRes.data || []).map(badge => ({
    ...badge,
    earned:    earnedBadgeIds.has(badge.id),
    earned_at: earnedAtMap[badge.id] || null
  }))

  return { totalXp, allBadges, earnedCount: earnedBadgeIds.size }
}
