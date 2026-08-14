"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useOnboardingStore } from '@/lib/stores/onboarding'

const THRESHOLDS = [
  { id: "100000", label: "₦100,000", description: "Common for SMEs", details: "Best for small businesses with few high-value assets" },
  { id: "250000", label: "₦250,000", description: "Mid-size organizations", details: "Balances detail and administrative burden" },
  { id: "500000", label: "₦500,000", description: "Larger organizations", details: "Reduces tracking overhead for moderate-size operations" },
  { id: "1000000", label: "₦1,000,000", description: "Enterprise threshold", details: "Minimizes asset register size for large portfolios" },
]

const DEPRECIATION_METHODS = [
  { id: "straight_line", label: "Straight Line", description: "Equal depreciation each year", example: "₦100k asset over 5 years = ₦20k per year" },
  { id: "reducing_balance", label: "Reducing Balance", description: "Higher depreciation early on", example: "Faster value loss initially, useful for tech assets" },
]

interface StepAccountingPolicyProps {
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

export function StepAccountingPolicy({ onNext, onBack, onSkip }: StepAccountingPolicyProps) {
  const [threshold, setThreshold] = useState<string | null>(null)
  const [method, setMethod] = useState<string | null>(null)
  const markStepComplete = useOnboardingStore((s) => s.markStepComplete)

  return (
    <div className="space-y-8 rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-8 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)]">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--neutral-900)]">Configure your accounting policy</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--neutral-500)]">
          Set your capitalization threshold and default depreciation method. You can change these later in Settings.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-[var(--neutral-700)]">Capitalization threshold</label>
          <p className="text-xs text-[var(--neutral-500)] mt-1">Only assets above this amount appear in your asset register. Below-threshold items are expensed immediately.</p>
          <p className="text-xs text-[var(--brand-600)] mt-2">💡 Tip: Choose based on your organization size and asset complexity</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {THRESHOLDS.map((t) => (
            <motion.button
              key={t.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setThreshold(t.id)}
              className={[
                'rounded-2xl border p-4 text-left transition-all',
                threshold === t.id
                  ? 'border-[var(--brand-600)] bg-[var(--brand-50)]'
                  : 'border-[var(--border-default)] bg-[var(--neutral-50)] hover:border-[var(--brand-600)]',
              ].join(' ')}
            >
              <p className="font-semibold text-[var(--neutral-900)]">{t.label}</p>
              <p className="text-xs text-[var(--neutral-500)]">{t.description}</p>
              <p className="mt-1.5 text-xs text-[var(--neutral-400)]">{t.details}</p>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-[var(--neutral-700)]">Default depreciation method</label>
          <p className="text-xs text-[var(--neutral-500)] mt-1">Choose how asset value declines over time. You can set different methods per asset later.</p>
          <p className="text-xs text-[var(--brand-600)] mt-2">💡 Tip: Most organizations use Straight Line for simplicity. Use Reducing Balance for tech/equipment.</p>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {DEPRECIATION_METHODS.map((m) => (
            <motion.button
              key={m.id}
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
              onClick={() => setMethod(m.id)}
              className={[
                'rounded-2xl border p-4 text-left transition-all',
                method === m.id
                  ? 'border-[var(--brand-600)] bg-[var(--brand-50)]'
                  : 'border-[var(--border-default)] bg-[var(--neutral-50)] hover:border-[var(--brand-600)]',
              ].join(' ')}
            >
              <p className="text-sm font-semibold text-[var(--neutral-900)]">{m.label}</p>
              <p className="text-xs text-[var(--neutral-500)]">{m.description}</p>
              <p className="mt-1.5 text-xs text-[var(--neutral-400)]">{m.example}</p>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-sm font-medium text-[var(--neutral-500)] transition-colors hover:text-[var(--neutral-700)]">
            ← Back
          </button>
          <button onClick={onSkip} className="text-sm font-medium text-[var(--neutral-500)] transition-colors hover:text-[var(--neutral-700)]">
            Skip
          </button>
        </div>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            markStepComplete(2)
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
