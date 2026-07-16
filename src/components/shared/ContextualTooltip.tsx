'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Lightbulb } from 'lucide-react'
import { useOnboardingStore } from '@/lib/stores/onboarding'

interface ContextualTooltipProps {
  tooltipKey: string
  title: string
  message: string
}

export function ContextualTooltip({ tooltipKey, title, message }: ContextualTooltipProps) {
  const { tooltipsShown, markTooltipShown } = useOnboardingStore()
  const isShown = tooltipsShown.includes(tooltipKey)

  if (isShown) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, delay: 0.5 }}
        className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3"
      >
        <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{title}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5">{message}</p>
        </div>
        <button
          onClick={() => markTooltipShown(tooltipKey)}
          className="text-blue-400 hover:text-blue-600 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
