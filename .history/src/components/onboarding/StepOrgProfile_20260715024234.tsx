"use client"

import { useState } from "react"
import { motion } from "framer-motion"

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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Tell us about your organization
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
          This helps us personalize your experience and format your reports correctly.
        </p>
      </div>

      {/* Industry selection */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          What industry are you in?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {INDUSTRIES.map((industry) => (
            <motion.button
              key={industry.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedIndustry(industry.id)}
              className={[
                "p-4 rounded-2xl border-2 text-left transition-all",
                selectedIndustry === industry.id
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300",
              ].join(" ")}
            >
              <div className="text-3xl mb-2">{industry.emoji}</div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {industry.label}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Location mode */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          How many locations do you operate from?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {LOCATION_MODES.map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setLocationMode(option.id)}
              className={[
                "p-4 rounded-2xl border-2 text-left transition-all",
                locationMode === option.id
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300",
              ].join(" ")}
            >
              <div className="text-2xl mb-2">{option.icon}</div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {option.label}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onSkip}
          className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          Skip this step
        </button>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNext}
          className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl transition-colors"
        >
          Save and Continue
        </motion.button>
      </div>
    </div>
  )
}
