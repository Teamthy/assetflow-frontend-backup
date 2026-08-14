"use client"

import { useState } from "react"
import { motion } from "framer-motion"

const THRESHOLDS = [
  { id: "100000", label: "₦100,000", description: "Common for SMEs" },
  { id: "250000", label: "₦250,000", description: "Mid-size organizations" },
  { id: "500000", label: "₦500,000", description: "Larger organizations" },
  { id: "1000000", label: "₦1,000,000", description: "Enterprise threshold" },
]

const DEPRECIATION_METHODS = [
  { id: "straight_line", label: "Straight Line", description: "Equal depreciation each year" },
  { id: "reducing_balance", label: "Reducing Balance", description: "Higher depreciation early on" },
]

interface StepAccountingPolicyProps {
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

export function StepAccountingPolicy({ onNext, onBack, onSkip }: StepAccountingPolicyProps) {
  const [threshold, setThreshold] = useState<string | null>(null)
  const [method, setMethod] = useState<string | null>(null)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Configure your accounting policy
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
          Set your capitalization threshold and default depreciation method. You can change these later in Settings.
        </p>
      </div>

      {/* Capitalization threshold */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Capitalization threshold
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Assets below this value will be expensed rather than capitalized.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {THRESHOLDS.map((t) => (
            <motion.button
              key={t.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setThreshold(t.id)}
              className={[
                "p-4 rounded-2xl border-2 text-left transition-all",
                threshold === t.id
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300",
              ].join(" ")}
            >
              <p className="font-bold text-slate-900 dark:text-white">{t.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Depreciation method */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Default depreciation method
        </label>
        <div className="grid grid-cols-1 gap-3">
          {DEPRECIATION_METHODS.map((m) => (
            <motion.button
              key={m.id}
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
              onClick={() => setMethod(m.id)}
              className={[
                "p-4 rounded-2xl border-2 text-left transition-all",
                method === m.id
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300",
              ].join(" ")}
            >
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{m.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{m.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={onSkip}
            className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            Skip
          </button>
        </div>
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
