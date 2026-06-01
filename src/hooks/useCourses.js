import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Custom hook to retrieve all published courses from Supabase.
 * Resolves to database tables, falling back to gorgeous seeded mock data if the database is empty or uninitialized.
 * 
 * @returns {object} { courses: Array, loading: boolean, error: string|null }
 */
export function useCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: true })

        if (error) {
          throw error
        }
        
        if (!data || data.length === 0) {
          console.warn('Supabase courses table is empty. Rendering fallback course items.')
          setCourses(getMockCourses())
        } else {
          setCourses(data)
        }
      } catch (err) {
        console.error('Error fetching courses from database:', err.message)
        setError(err.message)
        setCourses(getMockCourses()) // bulletproof fallback
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  return { courses, loading, error }
}

/**
 * Custom hook to retrieve a single published course along with its modules and lessons sorted by order_index.
 * Falls back to detailed local blueprints if tables do not exist yet in Supabase.
 * 
 * @param {string} slug - The course URL slug
 * @returns {object} { course: object|null, loading: boolean, error: string|null }
 */
export function useCourse(slug) {
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) return

    async function fetchCourse() {
      try {
        setLoading(true)
        
        // Single deep query fetching course + modules + lessons
        const { data, error } = await supabase
          .from('courses')
          .select(`
            *,
            modules (
              id, title, order_index,
              lessons (
                id, title, duration_mins, is_preview, order_index, video_url
              )
            )
          `)
          .eq('slug', slug)
          .eq('is_published', true)
          .single()

        if (error) {
          throw error
        }

        if (data) {
          // Sort modules and lessons by order_index ascending in JS
          if (data.modules) {
            data.modules.sort((a, b) => a.order_index - b.order_index)
            data.modules.forEach((mod) => {
              if (mod.lessons) {
                mod.lessons.sort((a, b) => a.order_index - b.order_index)
              }
            })
          }
          setCourse(data)
        } else {
          setCourse(null)
        }

      } catch (err) {
        console.error(`Error querying details for slug "${slug}":`, err.message)
        setError(err.message)
        
        // Return highly structured mock fallback with populated modules & lessons
        const matchingMock = getMockCourses().find(c => c.slug === slug)
        if (matchingMock) {
          const populatedMock = {
            ...matchingMock,
            modules: getMockModulesFor(slug)
          }
          setCourse(populatedMock)
        } else {
          setCourse(null)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [slug])

  return { course, loading, error }
}

/**
 * Returns comprehensive, high-fidelity catalog data exactly matching the Supabase Courses schema.
 */
function getMockCourses() {
  return [
    {
      id: 'mock-dm-1',
      title: 'Digital Marketing Mastery',
      slug: 'digital-marketing',
      short_desc: 'From SEO to paid ads — learn to grow any business online.',
      long_desc: 'A comprehensive, project-based course covering every channel of digital marketing. You will learn SEO fundamentals, run real Google Ads campaigns, build social media strategies, set up email automations, and read analytics dashboards like a pro. Each module ends with a hands-on project that goes straight into your portfolio.',
      category: 'digital-marketing',
      price: 4999,
      original_price: 6999,
      is_published: true,
      total_lessons: 42,
      total_duration_mins: 1140,
      skill_level: 'Beginner',
      language: 'English',
      last_updated: '2026-05-28',
      instructor: 'Alex Mercer',
      thumbnail_url: '' // triggers gradient thumbnail placeholders in view components
    },
    {
      id: 'mock-gd-2',
      title: 'Graphic Designing Fundamentals',
      slug: 'graphic-designing',
      short_desc: 'Create stunning visuals using industry-standard tools.',
      long_desc: "Master the principles of visual design from scratch. You will learn Canva for quick professional work, Figma for product and UI design, brand identity creation, social media graphics, and basic UI/UX thinking. The course is built around a final brand identity project you design from brief to delivery.",
      category: 'graphic-designing',
      price: 4999,
      original_price: 6999,
      is_published: true,
      total_lessons: 38,
      total_duration_mins: 980,
      skill_level: 'Beginner',
      language: 'English',
      last_updated: '2026-05-28',
      instructor: 'Sophia Vance',
      thumbnail_url: ''
    },
    {
      id: 'mock-ve-3',
      title: 'Video Editing Pro',
      slug: 'video-editing',
      short_desc: 'Edit professional videos for YouTube, Reels, and beyond.',
      long_desc: 'Go from raw footage to polished, publish-ready videos. You will learn editing in both Premiere Pro and CapCut, colour grading, motion text and transitions, audio mixing, and exporting for every platform. The final project is a full YouTube video + 3 Reels edits you can publish the same day.',
      category: 'video-editing',
      price: 4999,
      original_price: 6999,
      is_published: true,
      total_lessons: 36,
      total_duration_mins: 920,
      skill_level: 'Beginner',
      language: 'English',
      last_updated: '2026-05-28',
      instructor: 'Karan Sharma',
      thumbnail_url: ''
    }
  ]
}

/**
 * Returns seeded module curriculum lists populated with lesson preview properties.
 */
function getMockModulesFor(slug) {
  const videoUrlBase = 'https://www.youtube.com/watch?v=ysz5S6PUM-U'
  
  return [
    {
      id: 'mod-1',
      title: 'Module 1: Core Principles & Operational Setup',
      order_index: 1,
      lessons: [
        { id: 'les-1', title: '1. Class Goals, Strategy & Scope Mapping', duration_mins: 10, is_preview: true, order_index: 1, video_url: videoUrlBase },
        { id: 'les-2', title: '2. Workspace Configuration & Setup Instructions', duration_mins: 14, is_preview: false, order_index: 2, video_url: videoUrlBase },
        { id: 'les-3', title: '3. Vocabulary, Vocabulary & Operational Context', duration_mins: 18, is_preview: false, order_index: 3, video_url: videoUrlBase }
      ]
    },
    {
      id: 'mod-2',
      title: 'Module 2: Real-World Execution & Practical Solutions',
      order_index: 2,
      lessons: [
        { id: 'les-4', title: '4. Deep-dive into Professional Tools & Panels', duration_mins: 28, is_preview: true, order_index: 1, video_url: videoUrlBase },
        { id: 'les-5', title: '5. Asset Composition, Imports & Dynamic Layouts', duration_mins: 20, is_preview: false, order_index: 2, video_url: videoUrlBase },
        { id: 'les-6', title: '6. Designing the Final Case Study Project', duration_mins: 35, is_preview: false, order_index: 3, video_url: videoUrlBase }
      ]
    }
  ]
}
