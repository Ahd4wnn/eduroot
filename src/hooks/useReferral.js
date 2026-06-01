import { supabase } from '../lib/supabase'

export function useReferral() {

  // Called on Signup page mount — reads ?ref=CODE from URL
  // and stores it in localStorage for use after auth completes
  const captureReferralCode = () => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      localStorage.setItem('eduroot_ref', ref)
    }
  }

  // Called after successful signup to create the referral record
  const applyReferral = async (newUserId) => {
    const code = localStorage.getItem('eduroot_ref')
    if (!code) return

    try {
      // Find referrer by code using maybeSingle() to avoid 406 errors
      const { data: referralCode } = await supabase
        .from('referral_codes')
        .select('user_id')
        .eq('code', code.toUpperCase())
        .maybeSingle()

      if (!referralCode) return

      // Don't let users refer themselves
      if (referralCode.user_id === newUserId) {
        localStorage.removeItem('eduroot_ref')
        return
      }

      // Record the referral
      await supabase.from('referrals').insert({
        referrer_id: referralCode.user_id,
        referred_id: newUserId,
        code: code.toUpperCase(),
        status: 'signed_up'
      })

      localStorage.removeItem('eduroot_ref')
    } catch (err) {
      // Silent fail — referral tracking should never break signup
      console.warn('Referral tracking failed:', err)
      localStorage.removeItem('eduroot_ref')
    }
  }

  // Fetch the current user's referral code and stats
  const getReferralStats = async (userId) => {
    try {
      // Use maybeSingle() to prevent 406 errors when stats are missing
      const { data, error } = await supabase
        .from('referral_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching referral stats:', error.message)
        return null
      }

      // Proactive: If no referral code exists (e.g. existing user before migration), create one on the fly!
      if (!data) {
        const { error: createError } = await supabase
          .from('referral_codes')
          .insert({ user_id: userId })

        if (createError) {
          console.error('Error creating referral code on the fly:', createError.message)
          return null
        }

        // Fetch stats again now that the code exists
        const { data: statsData } = await supabase
          .from('referral_stats')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()
        
        return statsData
      }

      return data
    } catch (err) {
      console.warn('getReferralStats failed:', err)
      return null
    }
  }

  // Build the share URL for a code
  const getReferralLink = (code) => {
    return `https://eduroot.online/signup?ref=${code}`
  }

  return { captureReferralCode, applyReferral, getReferralStats, getReferralLink }
}

export default useReferral
