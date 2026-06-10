import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Attach Supabase JWT Token from dynamic session
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`
      }
    } catch (error) {
      console.error('Error fetching Supabase session token in API interceptor:', error)
    }
    return config;
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor: Catch auth errors and route invalid states back to Login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If the server returns a 401 Unauthorized status
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized request detected. Clearing auth session and redirecting to login...')
      try {
        await supabase.auth.signOut()
      } catch (signOutError) {
        console.error('Error signing out during 401 cleanup:', signOutError)
      }
      
      // Redirect to public login route
      window.location.href = '/login'
    }
    // Note: 409 Conflict (e.g., already enrolled) is bypassed here so the caller can handle it.
    return Promise.reject(error)
  }
)

export default api

// Courses
export const getCourses = (category) =>
  api.get('/api/v1/courses', { params: { category } })

export const getCourse = (slug) =>
  api.get(`/api/v1/courses/${slug}`)

// Enrollments
export const getMyEnrollments = () =>
  api.get('/api/v1/enrollments/me')

export const checkEnrollment = (courseId) =>
  api.get(`/api/v1/enrollments/me/check/${courseId}`)

// Certificates
export const getMyCertificates = () =>
  api.get('/api/v1/certificates/me')

export const issueCertificate = (courseId) =>
  api.post(`/api/v1/certificates/issue/${courseId}`)

// Admin
export const getAdminStats = () =>
  api.get('/api/v1/admin/stats')

export const getAdminStudents = (courseId) =>
  api.get('/api/v1/admin/students', { params: { course_id: courseId } })
