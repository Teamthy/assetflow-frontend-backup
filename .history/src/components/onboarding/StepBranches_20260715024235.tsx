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
  const [branches, setBranches] = useState<Branch[]>([
    { id: "1", name: "", code: "" },
  ])

  const addBranch = () => {
    setBranches((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", code: "" },
    ])
  }

  const removeBranch = (id: string) => {
    setBranches((prev) => prev.filter((b) => b.id !== id))
  }

  const updateBranch = (id: string, field: keyof Branch, value: string) => {
    setBranches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Set up your locations
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
          Add your office branches or locations. Assets will be assigned to these branches.
          You can add more later.
        </p>
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
              className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800
                border border-slate-200 dark:border-slate-700 rounded-2xl"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-brand-50 dark:bg-brand-900/30
                rounded-xl flex items-center justify-center">
                <MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              </div>

              <div className="flex-1 grid grid-cols-2 gap-3">
                <input
                  value={branch.name}
                  onChange={(e) => updateBranch(branch.id, "name", e.target.value)}
                  placeholder={`Branch ${index + 1} name`}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700
                    border border-slate-200 dark:border-slate-600 rounded-xl
                    text-slate-900 dark:text-white placeholder:text-slate-400
                    focus:outline-none focus:border-brand-500
                    transition-colors"
                />
                <input
                  value={branch.code}
                  onChange={(e) =>
                    updateBranch(branch.id, "code", e.target.value.toUpperCase())
                  }
                  placeholder="Code (e.g. HQ)"
                  maxLength={6}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700
                    border border-slate-200 dark:border-slate-600 rounded-xl
                    text-slate-900 dark:text-white placeholder:text-slate-400
                    focus:outline-none focus:border-brand-500
                    transition-colors uppercase"
                />
              </div>

              {branches.length > 1 && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeBranch(branch.id)}
                  className="flex-shrink-0 p-1.5 text-slate-400 hover:text-red-500
                    hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={addBranch}
          className="w-full flex items-center justify-center gap-2 py-3
            border-2 border-dashed border-slate-200 dark:border-slate-700
            hover:border-brand-400 dark:hover:border-brand-600
            text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400
            text-sm font-medium rounded-2xl transition-all"
        >
          <Plus className="w-4 h-4" />
          Add another branch
        </motion.button>
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
