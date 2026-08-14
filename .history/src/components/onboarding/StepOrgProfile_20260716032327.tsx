"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useOnboardingStore } from '@/lib/stores/onboarding'

const INDUSTRIES = [
  { id: "manufacturing", label: "Manufacturing", emoji: "🏭" },
  { id: "healthcare", label: "Healthcare", emoji: "🏥" },
  { id: "education", label: "Education", emoji: "🎓" },
  { id: "logistics", label: "Logistics", emoji: "🚚" },
  { id: "ngo", label: "NGO / Non-profit", emoji: "🤝" },
  { id: "other", label: "Other", emoji: "🧩" },
]

const LOCATION_MODES = [
  { id: "single", label: "Single location", icon: "🏢" },
  { id: "multiple", label: "Multiple locations", icon: "🏬" },
]

interface StepOrgProfileProps {
  onNext: () => void
  onSkip: () => void
}

export function StepOrgProfile({ onNext, onSkip }: StepOrgProfileProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [locationMode, setLocationMode] = useState<string | null>(null)
  const markStepComplete = useOnboardingStore((s) => s.markStepComplete)

  return (
    <div className="space-y-8 rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-8 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)]">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--neutral-900)]">Tell us about your organization</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--neutral-500)]">
          This helps us personalize your experience and format your reports correctly.
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-semibold text-[var(--neutral-700)]">What industry are you in?</label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {INDUSTRIES.map((industry) => (
            <motion.button
              key={industry.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedIndustry(industry.id)}
              className={[
                'rounded-2xl border p-4 text-left transition-all',
                selectedIndustry === industry.id
                  ? 'border-[var(--brand-600)] bg-[var(--brand-50)]'
                  : 'border-[var(--border-default)] bg-[var(--neutral-50)] hover:border-[var(--brand-600)]',
              ].join(' ')}
            >
              <div className="mb-2 text-3xl">{industry.emoji}</div>
              <p className="text-sm font-semibold text-[var(--neutral-700)]">{industry.label}</p>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-semibold text-[var(--neutral-700)]">How many locations do you operate from?</label>
        <div className="grid grid-cols-2 gap-3">
          {LOCATION_MODES.map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setLocationMode(option.id)}
              className={[
                'rounded-2xl border p-4 text-left transition-all',
                locationMode === option.id
                  ? 'border-[var(--brand-600)] bg-[var(--brand-50)]'
                  : 'border-[var(--border-default)] bg-[var(--neutral-50)] hover:border-[var(--brand-600)]',
              ].join(' ')}
            >
              <div className="mb-2 text-2xl">{option.icon}</div>
              <p className="text-sm font-semibold text-[var(--neutral-700)]">{option.label}</p>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button onClick={onSkip} className="text-sm font-medium text-[var(--neutral-500)] transition-colors hover:text-[var(--neutral-700)]">
          Skip this step
        </button>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            markStepComplete(1)
            onNext()
          }}
          className="flex h-11 items-center justify-center rounded-full bg-[var(--brand-600)] px-6 text-sm font-semibold text-white transition-opacity hover:bg-[var(--brand-700)]"
        >
          Save and continue
        </motion.button>
      </div>
    </div>
  )
}
