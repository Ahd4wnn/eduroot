import React from 'react'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { motion } from 'motion/react'

/**
 * Premium PageWrapper Layout.
 * Injects react-helmet-async dynamic headers and utilizes motion/react for transitions.
 */
export function PageWrapper({
  children,
  title = 'eduroot — Learn Digital Skills Online',
  description = 'Learn high-paying digital skills online with eduroot. Premium self-paced learning programs and hands-on projects.',
  className,
}) {
  return (
    <HelmetProvider>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={description} />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} // smooth cinematic transition
        className={className}
        style={{ minHeight: '100vh' }}
      >
        {children}
      </motion.div>
    </HelmetProvider>
  )
}

export default PageWrapper
