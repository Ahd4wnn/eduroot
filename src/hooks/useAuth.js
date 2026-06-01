import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  // IMPORTANT: start as undefined, NOT null.
  // undefined = "we don't know yet" (still reading from localStorage)
  // null      = "we checked and there is no session"
  // This distinction is what prevents the flash-to-login bug.
  const [session, setSession]   = useState(undefined)
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const navigate = useNavigate()

  const fetchProfile = async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, role')
        .eq('id', userId)
        .single()
      setProfile(data)
    } catch {
      setProfile(null)
    }
  }

  useEffect(() => {
    let mounted = true

    // Step 1: immediately read session from localStorage (sync-ish)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => {
          if (mounted) setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    // Step 2: subscribe to future auth changes
    // (login, logout, token refresh, OAuth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return
        setSession(session ?? null)
        if (session?.user) {
          fetchProfile(session.user.id).finally(() => {
            if (mounted) setLoading(false)
          })
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    navigate('/')
  }

  const value = {
    session,
    user:            session?.user ?? null,
    profile,
    loading,
    isAdmin:         profile?.role === 'admin',
    isAuthenticated: !!session,
    signOut
  }

  return React.createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
