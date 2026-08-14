"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, MapPin } from "lucide-react"

interface Branch {
  id: string
  name: string
  code: string
}

interface StepBranchesProps {
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

export function StepBranches({ onNext, onBack, onSkip }: StepBranchesProps) {
  const [branches, setBranches] = useState<Branch[]>([{ id: "1", name: "", code: "" }])

  const addBranch = () => {
    setBranches((prev) => [...prev, { id: Date.now().toString(), name: "", code: "" }])
  }

  const removeBranch = (id: string) => {
    setBranches((prev) => prev.filter((b) => b.id !== id))
  }

  const updateBranch = (id: string, field: keyof Branch, value: string) => {
    setBranches((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)))
  }

  return (
    <div className="space-y-8 rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-8 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)]">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--neutral-900)]">Set up your locations</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--neutral-500)]">
          Add your office branches or locations. Assets will be assigned to these branches for better tracking and accountability. You can add more later.
        </p>
        <div className="mt-3 space-y-1.5 rounded-lg bg-[var(--brand-50)] border border-[var(--brand-200)] p-3">
          <p className="text-xs font-medium text-[var(--brand-700)]">💡 Location setup tips:</p>
          <ul className="text-xs text-[var(--brand-600)] space-y-0.5 ml-2">
            <li>• Use short, memorable location codes (e.g., HQ, BR1, BR2)</li>
            <li>• Organize by office, warehouse, or department</li>
            <li>• At least one location is required to get started</li>
          </ul>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {branches.map((branch, index) => (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--neutral-50)] p-4"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--brand-50)]">
                <MapPin className="h-4 w-4 text-[var(--brand-600)]" />
              </div>

              <div className="grid flex-1 grid-cols-2 gap-3">
                <input
                  value={branch.name}
                  onChange={(e) => updateBranch(branch.id, "name", e.target.value)}
                  placeholder={`Branch ${index + 1} name`}
                  className="w-full rounded-2xl border border-[var(--border-default)] bg-white px-3 py-2 text-sm text-[var(--neutral-900)] outline-none placeholder:text-[var(--neutral-400)] focus:border-[var(--brand-600)]"
                />
                <input
                  value={branch.code}
                  onChange={(e) => updateBranch(branch.id, "code", e.target.value.toUpperCase())}
                  placeholder="Code (e.g. HQ)"
                  maxLength={6}
                  className="w-full rounded-2xl border border-[var(--border-default)] bg-white px-3 py-2 text-sm uppercase text-[var(--neutral-900)] outline-none placeholder:text-[var(--neutral-400)] focus:border-[var(--brand-600)]"
                />
              </div>

              {branches.length > 1 && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeBranch(branch.id)}
                  className="flex-shrink-0 rounded-lg p-1.5 text-[var(--neutral-400)] transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={addBranch}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border-default)] py-3 text-sm font-medium text-[var(--neutral-500)] transition-all hover:border-[var(--brand-600)] hover:text-[var(--brand-600)]"
        >
          <Plus className="h-4 w-4" />
          Add another branch
        </motion.button>
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
          onClick={onNext}
          className="flex h-11 items-center justify-center rounded-full bg-[var(--brand-600)] px-6 text-sm font-semibold text-white transition-opacity hover:bg-[var(--brand-700)]"
        >
          Save and continue
        </motion.button>
      </div>
    </div>
  )
}
