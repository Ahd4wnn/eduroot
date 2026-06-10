import { supabase } from '../lib/supabase'
import { awardXP, XP_REWARDS, checkReferralBadges } from '../lib/xp'

export function useReferral() {

  const captureReferralCode = () => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) localStorage.setItem('eduroot_ref', ref)
  }

  const applyReferral = async (newUserId) => {
    const code = localStorage.getItem('eduroot_ref')
    if (!code) return
    try {
      const { data: referralCode } = await supabase
        .from('referral_codes')
        .select('user_id')
        .eq('code', code.toUpperCase())
        .maybeSingle()                    // ← maybeSingle, not single

      if (!referralCode) {
        localStorage.removeItem('eduroot_ref')
        return
      }
      if (referralCode.user_id === newUserId) {
        localStorage.removeItem('eduroot_ref')
        return
      }

      // Check not already referred
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referred_id', newUserId)
        .maybeSingle()                    // ← maybeSingle, not single

      if (existingReferral) {
        localStorage.removeItem('eduroot_ref')
        return
      }

      await supabase.from('referrals').insert({
        referrer_id: referralCode.user_id,
        referred_id: newUserId,
        code:        code.toUpperCase(),
        status:      'signed_up'
      })

      await awardXP(
        referralCode.user_id,
        XP_REWARDS.REFERRAL_ENROLL,
        'referral_signup',
        newUserId
      )
      await checkReferralBadges(referralCode.user_id)
      localStorage.removeItem('eduroot_ref')
    } catch (err) {
      console.warn('Referral tracking failed silently:', err)
      localStorage.removeItem('eduroot_ref')
    }
  }

  const getReferralStats = async (userId) => {
    const { data } = await supabase
      .from('referral_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()                      // ← maybeSingle, not single
    return data
  }

  const getReferralLink = (code) =>
    `https://eduroot.online/signup?ref=${code}`

  return {
    captureReferralCode,
    applyReferral,
    getReferralStats,
    getReferralLink
  }
}
