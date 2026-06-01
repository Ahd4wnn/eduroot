import React, { useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'motion/react'
import { TrendingUp, Palette, Video, BookOpen, Zap, Award, CheckCircle, ArrowRight, Star, Lock } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

// ---------------------------------------------------------
// 1. SCROLL ANIMATION HELPER COMPONENT (AnimatedSection)
// ---------------------------------------------------------
/**
 * Polished component that delays & slides elements up when scrolled into viewport.
 * Uses an elegant cubic-bezier curve resembling Apple.com transitions.
 */
export function AnimatedSection({ children, delay = 0, className = "" }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ---------------------------------------------------------
// 2. MAIN LANDING PAGE COMPONENT
// ---------------------------------------------------------
export function Landing() {
  
  // Staggered Right Stack Course Cards Data (Hero)
  const heroCardStack = [
    { icon: TrendingUp, name: 'Digital Marketing', lessons: '12 lessons', rotate: -3, x: -16, y: -40, zIndex: 10, color: '#0F3D2E' },
    { icon: Palette, name: 'Graphic Designing', lessons: '12 lessons', rotate: 0, x: 0, y: 0, zIndex: 20, color: '#C8A96B' },
    { icon: Video, name: 'Video Editing', lessons: '12 lessons', rotate: 3, x: 16, y: 40, zIndex: 30, color: '#1a5c44' }
  ]

  // Staggered Course Cards Data (Section 3)
  const coursesData = [
    {
      title: 'Digital Marketing',
      slug: 'digital-marketing-bootcamp',
      desc: 'From SEO to paid ads — learn to grow any business online.',
      icon: TrendingUp,
      color: '#0F3D2E',
      bullets: ['SEO & Google Ads', 'Social Media Strategy', 'Email Marketing', 'Analytics & Reporting']
    },
    {
      title: 'Graphic Designing',
      slug: 'graphic-design-mastery',
      desc: 'Create stunning visuals using industry-standard tools.',
      icon: Palette,
      color: '#C8A96B',
      bullets: ['Canva & Figma Fundamentals', 'Brand Identity Design', 'Social Media Graphics', 'UI/UX Basics']
    },
    {
      title: 'Video Editing',
      slug: 'video-editing-cinematic',
      desc: 'Edit professional videos for YouTube, Reels, and beyond.',
      icon: Video,
      color: '#1a5c44',
      bullets: ['Premiere Pro / CapCut', 'Color Grading', 'Motion Text & Transitions', 'YouTube-ready exports']
    }
  ]

  return (
    <div className="bg-[#F8F6F2] overflow-hidden text-[#111111] antialiased">
      
      {/* --------------------------------------------------- */}
      {/* SEO META HEADERS                                    */}
      {/* --------------------------------------------------- */}
      <Helmet>
        <title>eduroot — Learn Digital Skills That Get You Hired</title>
        <meta name="description" content="Master Digital Marketing, Graphic Designing, and Video Editing with expert-led courses. Practical skills, real projects, lifetime access." />
        <meta name="keywords" content="digital marketing course, graphic design course, video editing course, online learning India, eduroot" />
        <meta property="og:title" content="eduroot — Learn Digital Skills That Get You Hired" />
        <meta property="og:description" content="Master in-demand digital skills with project-based courses from eduroot." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://eduroot.online" />
        <link rel="canonical" href="https://eduroot.online" />
      </Helmet>

      {/* Embedded CSS for badge shimmer sweeps */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmerSweep {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer-badge-active {
          background: linear-gradient(90deg, transparent, rgba(200, 169, 107, 0.25), transparent);
          background-size: 200% 100%;
          animation: shimmerSweep 3s infinite linear;
        }
      `}} />

      {/* --------------------------------------------------- */}
      {/* 1. HERO SECTION                                     */}
      {/* --------------------------------------------------- */}
      <section className="min-h-screen flex items-center justify-center bg-[#F8F6F2] pt-24 pb-16 relative">
        <div className="max-w-6xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Hero Left Content (60%) */}
          <div className="lg:col-span-7 flex flex-col text-left items-start gap-6 relative z-10">
            
            {/* Shimmering Pill badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#C8A96B]/50 bg-white shadow-sm overflow-hidden relative shimmer-badge-active select-none"
            >
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-accent">
                ✦ New courses available
              </span>
            </motion.div>

            {/* Main H1 Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="text-[40px] md:text-[64px] font-black text-[#111111] leading-[1.08] tracking-[-0.03em] max-w-2xl"
            >
              Learn Skills That <br />
              <span className="text-[#0F3D2E]">Actually Get You Hired.</span>
            </motion.h1>

            {/* Subtitle Description */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
              className="text-lg md:text-[20px] text-textSecondary max-w-[480px] leading-[1.6]"
            >
              Master Digital Marketing, Graphic Designing, and Video Editing — with practical, project-based courses built for the real world.
            </motion.p>

            {/* CTA action triggers */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
              className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto"
            >
              <Button 
                variant="primary" 
                size="lg" 
                href="/courses" 
                className="bg-[#0F3D2E] text-white hover:bg-primary-light px-8 py-3.5 shadow-md"
              >
                Explore Courses
              </Button>
              <Button 
                variant="secondary" 
                size="lg" 
                href="/courses" 
                className="border-primary text-primary hover:bg-primary/5 px-8 py-3.5"
              >
                View Free Preview
              </Button>
            </motion.div>

            {/* Social Trust line */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.45 }}
              className="text-xs text-textSecondary font-semibold select-none flex items-center gap-1.5 mt-2"
            >
              <span>⭐ 4.8 Rating</span>
              <span>·</span>
              <span>2,000+ Enrolled Students</span>
              <span>·</span>
              <span>Lifetime Resource Access</span>
            </motion.div>

          </div>

          {/* Hero Right Card Stack (40%) */}
          <div className="lg:col-span-5 flex items-center justify-center relative min-h-[380px] w-full">
            <div className="relative w-full max-w-[340px] h-[340px] flex items-center justify-center">
              
              {heroCardStack.map((card, idx) => {
                const CardIcon = card.icon
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 60, y: card.y, rotate: 0 }}
                    animate={{ opacity: 1, x: card.x, y: card.y, rotate: card.rotate }}
                    transition={{ duration: 0.8, delay: 0.5 + idx * 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute w-full bg-white rounded-xl shadow-card p-5 border border-gray-100 flex flex-col gap-4 text-left cursor-pointer"
                    style={{ zIndex: card.zIndex }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm border border-gray-150 bg-bgLight"
                        style={{ color: card.color }}
                      >
                        <CardIcon className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-primary">{card.name}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{card.lessons}</span>
                      </div>
                    </div>

                    {/* progress layout */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[10px] text-textSecondary font-bold">
                        <span>Curriculum progress</span>
                        <span>0%</span>
                      </div>
                      <div className="w-full bg-gray-150 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gray-300 h-full w-0" />
                      </div>
                    </div>
                  </motion.div>
                )
              })}

            </div>
          </div>

        </div>
      </section>

      {/* --------------------------------------------------- */}
      {/* 2. SOCIAL PROOF BAR                                 */}
      {/* --------------------------------------------------- */}
      <section className="bg-white border-y border-gray-150/40 py-6 select-none relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-4 text-center">
          <span className="text-xs font-bold text-textSecondary tracking-wide uppercase">
            Trusted by students at
          </span>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-xs font-semibold text-gray-400">
            <span>IIT Madras</span>
            <span>·</span>
            <span>Christ University</span>
            <span>·</span>
            <span>Manipal</span>
            <span>·</span>
            <span>SRM</span>
            <span>·</span>
            <span>VIT</span>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- */}
      {/* 3. COURSES SECTION                                  */}
      {/* --------------------------------------------------- */}
      <section className="py-24 bg-white relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          
          {/* Section title header */}
          <AnimatedSection className="text-center max-w-2xl mx-auto flex flex-col gap-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              What you'll learn
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight">
              Three Skills. Unlimited Career Paths.
            </h2>
            <p className="text-sm md:text-base text-textSecondary max-w-md mx-auto leading-relaxed">
              Each course is built around real projects, not just theory. Select your specialization.
            </p>
          </AnimatedSection>

          {/* Courses grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coursesData.map((course, idx) => {
              const Icon = course.icon
              return (
                <AnimatedSection 
                  key={idx} 
                  delay={idx * 0.1}
                  className="flex"
                >
                  <Card 
                    padding="none" 
                    className="overflow-hidden flex flex-col w-full text-left bg-white border border-gray-150 shadow-card hover:-translate-y-1 hover:shadow-elevated transition-all duration-300 group"
                  >
                    {/* Top color strip (4px height) */}
                    <div 
                      className="h-1 w-full" 
                      style={{ backgroundColor: course.color }}
                    />
                    
                    <div className="p-6 flex flex-col flex-grow gap-5">
                      
                      {/* Icon & Title */}
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
                          style={{ backgroundColor: `${course.color}15`, color: course.color }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-primary tracking-tight group-hover:text-accent transition-colors">
                          {course.title}
                        </h3>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-textSecondary line-clamp-2 leading-relaxed">
                        {course.desc}
                      </p>

                      {/* Key takeaway bullets */}
                      <ul className="flex flex-col gap-2.5 flex-grow mt-2 border-t border-gray-50 pt-4">
                        {course.bullets.map((b, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-2.5 text-xs text-textSecondary leading-relaxed">
                            <span 
                              className="text-[10px] font-bold px-1 py-0.5 rounded bg-green-50 text-[#2E7D32]"
                            >
                              ✓
                            </span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Pricing and enroll links */}
                      <div className="flex items-center justify-between border-t border-gray-100 pt-5 mt-4 select-none">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Pricing</span>
                          <span className="text-base font-extrabold text-[#0F3D2E]">₹4,999</span>
                        </div>
                        
                        <Link 
                          to={`/courses/${course.slug}`} 
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#0F3D2E] hover:text-[#1a5c44] transition-colors"
                        >
                          <span>Enroll Now</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>

                    </div>
                  </Card>
                </AnimatedSection>
              )
            })}
          </div>

        </div>
      </section>

      {/* --------------------------------------------------- */}
      {/* 4. HOW IT WORKS (DARK SECTION)                      */}
      {/* --------------------------------------------------- */}
      <section className="py-24 bg-[#111111] text-white relative z-10 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          
          {/* Header titles */}
          <AnimatedSection className="text-center max-w-2xl mx-auto flex flex-col gap-3 mb-20">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              The process
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Simple. Structured. Effective.
            </h2>
          </AnimatedSection>

          {/* Workflow structure */}
          <div className="flex flex-col md:flex-row items-stretch justify-between gap-10 md:gap-4 relative">
            
            {/* Step 1 */}
            <AnimatedSection delay={0} className="flex-1 flex flex-col items-center text-center gap-5 relative z-10 px-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-accent px-2 py-0.5 rounded border border-accent/20 bg-accent/5 select-none">
                  01
                </span>
                <span className="text-base font-bold text-white tracking-tight">Pick your course</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-accent">
                <BookOpen className="w-5 h-5" />
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
                Choose from 3 career-focused programs designed explicitly for beginners to build foundational mastery.
              </p>
            </AnimatedSection>

            {/* Desktop Connector Arrow 1 */}
            <div className="hidden md:flex items-center justify-center text-gray-700 text-xl font-bold self-center relative z-10 pointer-events-none">
              →
            </div>

            {/* Step 2 */}
            <AnimatedSection delay={0.15} className="flex-1 flex flex-col items-center text-center gap-5 relative z-10 px-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-accent px-2 py-0.5 rounded border border-accent/20 bg-accent/5 select-none">
                  02
                </span>
                <span className="text-base font-bold text-white tracking-tight">Learn by doing</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-accent">
                <Zap className="w-5 h-5" />
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
                Follow high-definition structured lessons, complete challenging homework assignments, and gain active checkpoints feedback.
              </p>
            </AnimatedSection>

            {/* Desktop Connector Arrow 2 */}
            <div className="hidden md:flex items-center justify-center text-gray-700 text-xl font-bold self-center relative z-10 pointer-events-none">
              →
            </div>

            {/* Step 3 */}
            <AnimatedSection delay={0.3} className="flex-1 flex flex-col items-center text-center gap-5 relative z-10 px-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-accent px-2 py-0.5 rounded border border-accent/20 bg-accent/5 select-none">
                  03
                </span>
                <span className="text-base font-bold text-white tracking-tight">Get hired</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-accent">
                <Award className="w-5 h-5" />
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
                Walk away with an impressive personal portfolio site, ready-to-share files, and an industry-recognized certificate of accomplishment.
              </p>
            </AnimatedSection>

          </div>

        </div>
      </section>

      {/* --------------------------------------------------- */}
      {/* 5. TESTIMONIALS                                     */}
      {/* --------------------------------------------------- */}
      <section className="py-24 bg-[#F8F6F2] relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          
          {/* Header row */}
          <AnimatedSection className="text-center max-w-2xl mx-auto flex flex-col gap-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              Student stories
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight">
              Real results from real people.
            </h2>
          </AnimatedSection>

          {/* Quote list grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Quote 1 */}
            <AnimatedSection delay={0} className="flex">
              <Card padding="md" className="flex flex-col w-full text-left bg-white border border-gray-150/70 shadow-card">
                <span className="text-accent text-[54px] leading-none font-serif font-black select-none -mb-4 block">
                  “
                </span>
                <p className="text-sm italic text-primary leading-relaxed flex-grow">
                  I went from zero to landing my first freelance client within 3 months. The Graphic Design course was incredibly practical.
                </p>
                <div className="flex flex-col border-t border-gray-50 pt-4 mt-5">
                  <span className="text-sm font-bold text-primary">Priya M.</span>
                  <span className="text-[10px] text-textSecondary font-semibold">Freelance Designer, Bangalore</span>
                  <div className="flex items-center gap-0.5 text-accent mt-1.5 select-none">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>
              </Card>
            </AnimatedSection>

            {/* Quote 2 */}
            <AnimatedSection delay={0.1} className="flex">
              <Card padding="md" className="flex flex-col w-full text-left bg-white border border-gray-150/70 shadow-card">
                <span className="text-accent text-[54px] leading-none font-serif font-black select-none -mb-4 block">
                  “
                </span>
                <p className="text-sm italic text-primary leading-relaxed flex-grow">
                  The Digital Marketing course taught me exactly what my internship required. I was the most prepared person in the room.
                </p>
                <div className="flex flex-col border-t border-gray-50 pt-4 mt-5">
                  <span className="text-sm font-bold text-primary">Arjun K.</span>
                  <span className="text-[10px] text-textSecondary font-semibold">Marketing Intern, Chennai</span>
                  <div className="flex items-center gap-0.5 text-accent mt-1.5 select-none">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>
              </Card>
            </AnimatedSection>

            {/* Quote 3 */}
            <AnimatedSection delay={0.2} className="flex">
              <Card padding="md" className="flex flex-col w-full text-left bg-white border border-gray-150/70 shadow-card">
                <span className="text-accent text-[54px] leading-none font-serif font-black select-none -mb-4 block">
                  “
                </span>
                <p className="text-sm italic text-primary leading-relaxed flex-grow">
                  Video editing used to feel overwhelming. Now I edit Reels for 4 clients every week thanks to eduroot.
                </p>
                <div className="flex flex-col border-t border-gray-50 pt-4 mt-5">
                  <span className="text-sm font-bold text-primary">Sneha R.</span>
                  <span className="text-[10px] text-textSecondary font-semibold">Content Creator, Kochi</span>
                  <div className="flex items-center gap-0.5 text-accent mt-1.5 select-none">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>
              </Card>
            </AnimatedSection>

          </div>

        </div>
      </section>

      {/* ===== PRICING SECTION ===== */}
      <section className="bg-[#0F3D2E] py-24 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">

          {/* Eyebrow + Headline */}
          <AnimatedSection>
            <p className="text-center text-[#C8A96B] text-xs font-semibold tracking-[0.15em] uppercase mb-4">
              Pricing
            </p>
            <h2 className="text-center text-white text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight mb-4 text-left sm:text-center">
              One skill.<br />One payment.<br />Yours forever.
            </h2>
            <p className="text-center text-white/50 text-base mb-14">
              No subscriptions. No renewals. Pay once, learn for life.
            </p>
          </AnimatedSection>

          {/* Stat Row */}
          <AnimatedSection delay={0.1}>
            <div className="flex justify-center mb-14">
              {[
                { num: '₹4,999', label: 'Per course' },
                { num: '∞',      label: 'Lifetime access' },
                { num: '2K+',    label: 'Students enrolled' },
              ].map((s, i) => (
                <div
                  key={i}
                  className="text-center px-8 md:px-12 border-white/10"
                  style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}
                >
                  <span className="block text-[#C8A96B] text-3xl md:text-4xl font-bold tracking-tight leading-none">
                    {s.num}
                  </span>
                  <span className="block text-white/45 text-[10px] font-semibold tracking-widest uppercase mt-2 select-none">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </AnimatedSection>

          {/* Course Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-10 text-left">
            {[
              {
                tag: 'Course', icon: TrendingUp, title: 'Digital Marketing',
                meta: 'SEO · Ads · Social · Analytics',
                perks: ['42 lessons across 6 modules', 'Real campaign projects', 'Certificate on completion'],
                featured: false,
              },
              {
                tag: 'Course', icon: Palette, title: 'Graphic Designing',
                meta: 'Canva · Figma · Brand · UI',
                perks: ['38 lessons across 5 modules', 'Brand identity project', 'Certificate on completion'],
                featured: true,
              },
              {
                tag: 'Course', icon: Video, title: 'Video Editing',
                meta: 'Premiere · CapCut · Reels · YT',
                perks: ['36 lessons across 5 modules', 'YouTube-ready final edit', 'Certificate on completion'],
                featured: false,
              },
            ].map((course, i) => {
              const CourseIcon = course.icon
              return (
                <AnimatedSection key={i} delay={i * 0.1}>
                  <div
                    className={`relative rounded-2xl p-6 h-full flex flex-col transition-transform duration-300 hover:-translate-y-1 ${
                      course.featured
                        ? 'bg-white border border-white shadow-elevated'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    {course.featured && (
                      <span className="absolute top-4 right-4 bg-[#C8A96B] text-[#0F3D2E] text-[9px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full select-none">
                        Popular
                      </span>
                    )}

                    <span className={`text-[10px] font-bold tracking-widest uppercase mb-2.5 select-none ${
                      course.featured ? 'text-[#0F3D2E]' : 'text-[#C8A96B]'
                    }`}>
                      {course.tag}
                    </span>
                    
                    {/* Icon Area */}
                    <div className="mb-2.5 flex">
                      <div 
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-sm ${
                          course.featured
                            ? 'bg-[#0F3D2E]/10 text-[#0F3D2E]'
                            : 'bg-[#C8A96B]/15 text-[#C8A96B]'
                        }`}
                      >
                        <CourseIcon className="w-4.5 h-4.5" />
                      </div>
                    </div>

                    <h3 className={`text-[15px] font-bold mb-1 ${
                      course.featured ? 'text-[#0F3D2E]' : 'text-white'
                    }`}>
                      {course.title}
                    </h3>
                    <p className={`text-xs mb-4 ${
                      course.featured ? 'text-[#5F6368]' : 'text-white/40'
                    }`}>
                      {course.meta}
                    </p>

                    <div className={`text-3xl font-black tracking-tight ${
                      course.featured ? 'text-[#0F3D2E]' : 'text-[#C8A96B]'
                    }`}>
                      ₹4,999
                    </div>
                    <span className={`text-[11px] mb-4 select-none ${
                      course.featured ? 'text-[#5F6368]' : 'text-white/35'
                    }`}>
                      one-time · lifetime access
                    </span>

                    <div className={`h-px my-4 ${
                      course.featured ? 'bg-black/10' : 'bg-white/10'
                    }`} />

                    <ul className="flex flex-col gap-2 mb-5 flex-1">
                      {course.perks.map((perk, j) => (
                        <li key={j} className="flex items-center gap-2">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] flex-shrink-0 font-extrabold ${
                            course.featured
                              ? 'bg-[#0F3D2E]/10 text-[#0F3D2E]'
                              : 'bg-[#C8A96B]/15 text-[#C8A96B]'
                          }`}>✓</span>
                          <span className={`text-xs ${
                            course.featured ? 'text-[#5F6368]' : 'text-white/60'
                          }`}>
                            {perk}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      to="/courses"
                      className={`block text-center py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90 ${
                        course.featured
                          ? 'bg-[#0F3D2E] text-white shadow-sm'
                          : 'border border-white/20 text-white/70 hover:bg-white/5'
                      }`}
                    >
                      Enroll now
                    </Link>
                  </div>
                </AnimatedSection>
              )
            })}
          </div>

          {/* Guarantee */}
          <AnimatedSection delay={0.3}>
            <p className="text-center text-white/35 text-xs flex items-center justify-center gap-2 mt-4 select-none">
              <Lock className="w-3.5 h-3.5 text-accent" />
              <span>30-day money-back guarantee · No questions asked</span>
            </p>
          </AnimatedSection>

        </div>
      </section>

      {/* --------------------------------------------------- */}
      {/* 7. FINAL CTA BANNER                                 */}
      {/* --------------------------------------------------- */}
      <section className="relative bg-[#0F3D2E] text-white py-24 overflow-hidden border-t border-[#C8A96B]/20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <AnimatedSection className="text-center flex flex-col gap-6 items-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              Your next skill starts today.
            </h2>
            <p className="text-gray-300 max-w-xl text-sm md:text-base leading-relaxed">
              Join thousands of students already learning on eduroot. Grow your root credentials and establish a strong creative career.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 w-full sm:w-auto">
              <Button 
                variant="accent" 
                size="lg" 
                href="/signup" 
                className="bg-[#C8A96B] text-primary hover:bg-accent-light px-8 py-3.5 shadow-md font-bold"
              >
                Get Started
              </Button>
              <Button 
                variant="secondary" 
                size="lg" 
                href="/courses" 
                className="border-white text-white hover:bg-white hover:text-primary px-8 py-3.5"
              >
                View All Courses
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

    </div>
  )
}

export default Landing
