import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './hooks/useAuth'
import { ProtectedRoute, AdminRoute } from './components/layout/ProtectedRoute'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ErrorBoundary from './components/ErrorBoundary'

// Public Pages imports
import Landing from './pages/public/Landing'
import Courses from './pages/public/Courses'
import CourseDetail from './pages/public/CourseDetail'
import Login from './pages/public/Login'
import Signup from './pages/public/Signup'
import ForgotPassword from './pages/public/ForgotPassword'
import Leaderboard from './pages/public/Leaderboard'
import NotFound from './pages/NotFound'

// Student Protected Pages imports
import Dashboard from './pages/student/Dashboard'
import Learn from './pages/student/Learn'
import Settings from './pages/student/Settings'

// Administrative Panel Pages imports
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminCourses from './pages/admin/AdminCourses'
import AdminCourseForm from './pages/admin/AdminCourseForm'
import AdminStudents from './pages/admin/AdminStudents'
import AdminSettings from './pages/admin/AdminSettings'

// Page scroll reset component
const ScrollToTop = () => {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            
            {/* Unified global react-hot-toast provider */}
            <Toaster
              position="top-right"
              gutter={8}
              toastOptions={{
                duration: 3500,
                style: {
                  background: '#fff',
                  color: '#111111',
                  fontSize: '13px',
                  fontWeight: '500',
                  borderRadius: '12px',
                  border: '1px solid #e5e5e5',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  padding: '10px 14px',
                },
                success: {
                  iconTheme: { primary: '#0F3D2E', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: '#fff' },
                },
              }}
            />

            {/* Persistent global layout header */}
            <Navbar />
            
            {/* Main workspace that grows to fill height */}
            <main className="flex-grow">
              <Routes>
                
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/courses/:slug" element={<CourseDetail />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Student Classroom Routes (Requires session login) */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/learn/:slug" 
                  element={
                    <ProtectedRoute>
                      <Learn />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />

                {/* Administrator Control Panel Routes (Requires session + 'admin' role metadata claims) */}
                <Route 
                  path="/admin" 
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/courses" 
                  element={
                    <AdminRoute>
                      <AdminCourses />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/courses/new" 
                  element={
                    <AdminRoute>
                      <AdminCourseForm />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/courses/:id/edit" 
                  element={
                    <AdminRoute>
                      <AdminCourseForm />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/students" 
                  element={
                    <AdminRoute>
                      <AdminStudents />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/settings" 
                  element={
                    <AdminRoute>
                      <AdminSettings />
                    </AdminRoute>
                  } 
                />

                {/* Catch-all 404 Route */}
                <Route path="*" element={<NotFound />} />

              </Routes>
            </main>

            {/* Persistent global layout footer */}
            <Footer />
            
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
