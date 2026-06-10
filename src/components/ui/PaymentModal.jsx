import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

export default function PaymentModal({
  stage, error, onClose, courseTitle
}) {
  if (!stage) return null

  const stages = {
    creating: {
      icon:  <Loader size={40} className="text-[#0F3D2E] animate-spin" />,
      title: 'Preparing checkout...',
      sub:   'Setting up your secure payment.',
    },
    verifying: {
      icon:  <Loader size={40} className="text-[#0F3D2E] animate-spin" />,
      title: 'Confirming payment...',
      sub:   'Please wait while we verify your payment.',
    },
    success: {
      icon:  <CheckCircle size={40} className="text-[#0F3D2E]" />,
      title: "You're enrolled! 🎉",
      sub:   `Welcome to ${courseTitle}. Redirecting you now...`,
    },
    failed: {
      icon:  <XCircle size={40} className="text-red-400" />,
      title: 'Payment unsuccessful',
      sub:   error || 'Something went wrong. No money was charged.',
    },
  }

  const current = stages[stage]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50
          flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{   opacity: 0, scale: 0.94, y: 16  }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-2xl p-8 max-w-sm w-full
            shadow-2xl text-center"
        >
          <div className="flex justify-center mb-4">
            {current.icon}
          </div>

          <h2 className="text-xl font-bold text-[#111111] mb-2">
            {current.title}
          </h2>

          <p className="text-sm text-[#5F6368] leading-relaxed">
            {current.sub}
          </p>

          {stage === 'failed' && (
            <button
              onClick={onClose}
              className="mt-6 w-full border border-gray-200 rounded-xl
                py-2.5 text-sm font-semibold text-[#111111]
                hover:bg-gray-50 transition-colors"
            >
              Try again
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
