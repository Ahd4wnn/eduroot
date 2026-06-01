import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import PageLoader from '../ui/PageLoader'

export const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth()
  const location = useLocation()

  // session === undefined means auth hasn't loaded from storage yet.
  // Show spinner, do NOT redirect. This is the fix for the reload bug.
  if (loading || session === undefined) return <PageLoader />

  // session === null means we confirmed no session exists.
  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return children
}

export const AdminRoute = ({ children }) => {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  // Wait for both session AND profile to load
  // Profile carries the role — we can't check admin without it
  if (loading || session === undefined || (session && !profile)) {
    return <PageLoader />
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
