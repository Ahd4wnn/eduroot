import React, { useState, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useInView } from 'motion/react'
import { TrendingUp, Palette, Video, BookOpen, Clock, BarChart2 } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import { useCourses } from '../../hooks/useCourses'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export function Courses() {
  const { courses, loading, error } = useCourses()
  const [activeCategory, setActiveCategory] = useState('All')
  const navigate = useNavigate()
  
  // Grid viewport entry tracker for entrance stagger animations
  const gridRef = useRef(null)
  const gridInView = useInView(gridRef, { once: true, margin: "-40px" })

  const categories = [
    { label: 'All', value: 'All' },
    { label: 'Digital Marketing', value: 'digital-marketing' },
    { label: 'Graphic Designing', value: 'graphic-designing' },
    { label: 'Video Editing', value: 'video-editing' }
  ]

  // Filter course catalog based on chosen horizontal pill
  const filteredCourses = activeCategory === 'All'
    ? courses
    : courses.filter(c => c.category === activeCategory)

  // Maps custom color gradients for thumbnail backgrounds when no image is loaded
  const getCategoryGradient = (cat) => {
    switch(cat) {
      case 'digital-marketing':
        return 'linear-gradient(135deg, #0F3D2E 0%, #1a5c44 100%)'
      case 'graphic-designing':
        return 'linear-gradient(135deg, #C8A96B 0%, #e8c98a 100%)'
      case 'video-editing':
        return 'linear-gradient(135deg, #111111 0%, #2a2a2a 100%)'
      default:
        return 'linear-gradient(135deg, #0F3D2E 0%, #111111 100%)'
    }
  }

  // Maps Lucide React icons centered in thumbnail spaces
  const getCategoryIcon = (cat) => {
    switch(cat) {
      case 'digital-marketing': return TrendingUp
      case 'graphic-designing': return Palette
      case 'video-editing': return Video
      default: return TrendingUp
    }
  }

  return (
    <PageWrapper
      title="All Courses — eduroot"
      description="Browse practical courses in Digital Marketing, Graphic Designing, and Video Editing. Project-based learning, lifetime access."
    >
      {/* --------------------------------------------------- */}
      {/* SEO METAS                                           */}
      {/* --------------------------------------------------- */}
      <Helmet>
        <title>All Courses — eduroot</title>
        <meta name="description" content="Browse practical courses in Digital Marketing, Graphic Designing, and Video Editing. Project-based learning, lifetime access." />
        <link rel="canonical" href="https://eduroot.online/courses" />
      </Helmet>

      <div className="bg-bgLight min-h-screen pt-20">
        
        {/* 1. PAGE HEADER */}
        <section className="bg-[#F8F6F2] py-16 border-b border-gray-200/30 text-center">
          <div className="max-w-6xl mx-auto px-6 flex flex-col gap-2.5 items-center select-none">
            <span className="text-xs font-semibold text-textSecondary uppercase tracking-widest">
              eduroot / Courses
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tight leading-none mt-1">
              All Courses
            </h1>
            <p className="text-sm md:text-base text-textSecondary max-w-md mt-2">
              Practical skills. Real projects. Lifetime access.
            </p>
          </div>
        </section>

        {/* 2. STICKY FILTER PILL ROW */}
        <div className="sticky top-[73px] bg-white/95 backdrop-blur-md border-b border-gray-150/50 py-3.5 z-40 shadow-sm select-none">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-start md:justify-center overflow-x-auto gap-2.5 scrollbar-none scroll-smooth">
            {categories.map((cat, idx) => {
              const isActive = activeCategory === cat.value
              return (
                <button
                  key={idx}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`text-xs font-bold px-5 py-2.5 rounded-full transition-all duration-200 whitespace-nowrap focus:outline-none ${
                    isActive
                      ? 'bg-[#0F3D2E] text-white shadow-sm scale-102'
                      : 'border border-gray-200 text-textSecondary hover:border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. MAIN COURSES GRID */}
        <section className="max-w-6xl mx-auto px-6 py-16 text-left">
          
          {/* Skeleton Loader while database loads */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((s) => (
                <Card key={s} padding="none" className="overflow-hidden border border-gray-150 bg-white flex flex-col h-[400px]">
                  <div className="w-full aspect-video bg-gray-200 animate-pulse" />
                  <div className="p-5 flex-grow flex flex-col gap-4">
                    <div className="h-3 w-1/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-200 rounded animate-pulse mt-auto" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <Card className="text-center py-20 max-w-md mx-auto border border-gray-150">
              <BookOpen className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-bold text-primary">No published courses found</h3>
              <p className="text-xs text-textSecondary mt-1">We couldn't locate any matching courses under "{activeCategory}". Check back soon!</p>
              <Button variant="ghost" size="sm" onClick={() => setActiveCategory('All')} className="mt-4">
                Clear Filters
              </Button>
            </Card>
          ) : (
            
            <motion.div 
              ref={gridRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredCourses.map((course, idx) => {
                const CategoryIcon = getCategoryIcon(course.category)
                const categoryGradient = getCategoryGradient(course.category)
                const originalPrice = course.original_price || (course.price + 2000)

                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className="flex"
                  >
                    <div 
                      onClick={() => navigate(`/courses/${course.slug}`)}
                      className="bg-white rounded-2xl overflow-hidden shadow-card hover:-translate-y-1 hover:shadow-elevated transition-all duration-300 border border-gray-150/60 flex flex-col w-full text-left group cursor-pointer"
                    >
                      {/* Top Graphic Thumbnail area (16:9) */}
                      <div 
                        className="relative aspect-video flex items-center justify-center relative select-none border-b border-gray-100"
                        style={{ background: course.thumbnail_url ? `url(${course.thumbnail_url}) center/cover` : categoryGradient }}
                      >
                        {!course.thumbnail_url && (
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                            <CategoryIcon className="w-12 h-12 text-white/90" />
                          </div>
                        )}
                        
                        {/* Top Right Bestseller badge */}
                        <Badge 
                          variant="warning" 
                          className="absolute top-3.5 right-3.5 z-10 bg-[#C8A96B] text-[#0F3D2E] border-none font-bold text-[10px] tracking-wide shadow-sm py-1 px-2.5 rounded-md"
                        >
                          Bestseller
                        </Badge>
                      </div>

                      {/* Card Contents */}
                      <div className="p-5 flex-grow flex flex-col gap-4">
                        
                        {/* Category Tag */}
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#C8A96B] select-none block">
                          {course.category.replace('-', ' ')}
                        </span>

                        {/* Title */}
                        <h3 className="text-base font-extrabold text-[#111111] leading-snug group-hover:text-accent transition-colors">
                          {course.title}
                        </h3>

                        {/* Short Desc */}
                        <p className="text-xs text-[#5F6368] line-clamp-2 leading-relaxed flex-grow">
                          {course.short_desc}
                        </p>

                        {/* Meta indicators */}
                        <div className="flex items-center justify-start gap-4 text-[10px] text-[#5F6368] font-bold border-t border-gray-50 pt-3 select-none">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-accent" />
                            {course.total_lessons} lessons
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-accent" />
                            {Math.floor(course.total_duration_mins / 60)}h total
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart2 className="w-3.5 h-3.5 text-accent" />
                            {course.skill_level}
                          </span>
                        </div>

                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4 bg-gray-50/40 select-none">
                        <div className="flex flex-col text-left">
                          <span className="text-[10px] line-through text-gray-400 font-medium">
                            ₹{originalPrice.toLocaleString('en-IN')}
                          </span>
                          <span className="text-lg font-black text-[#0F3D2E] leading-none mt-0.5">
                            ₹{(course.price || 4999).toLocaleString('en-IN')}
                          </span>
                        </div>
                        
                        <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/courses/${course.slug}`)
                          }}
                          className="bg-[#0F3D2E] text-white hover:bg-primary-light font-bold text-xs py-2 px-3.5 shadow-sm rounded-lg"
                        >
                          Enroll now →
                        </Button>
                      </div>

                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}

        </section>

      </div>
    </PageWrapper>
  )
}

export default Courses
