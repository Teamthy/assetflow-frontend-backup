"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { variants } from "@/lib/animations/tokens"

interface KeyboardShortcutsModalProps {
  open: boolean
  onClose: () => void
}

const SHORTCUTS = [
  {
    category: "Navigation",
    items: [
      { keys: ["G", "D"], description: "Go to Dashboard" },
      { keys: ["G", "A"], description: "Go to Assets" },
      { keys: ["G", "B"], description: "Go to Branches" },
      { keys: ["G", "M"], description: "Go to Maintenance" },
      { keys: ["G", "R"], description: "Go to Reports" },
      { keys: ["G", "S"], description: "Go to Settings" },
      { keys: ["Esc"], description: "Close modal" },
    ],
  },
  {
    category: "Actions",
    items: [
      { keys: ["?", "N"], description: "Create new item" },
    ],
  },
]

export function KeyboardShortcutsModal({
  open,
  onClose,
}: KeyboardShortcutsModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="modal"
              variants={variants.scaleIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="pointer-events-auto w-full max-w-md bg-white dark:bg-slate-800
                rounded-2xl border border-slate-200 dark:border-slate-700
                shadow-modal p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Keyboard Shortcuts
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600
                    dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700
                    transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                {SHORTCUTS.map((group) => (
                  <div key={group.category}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      {group.category}
                    </p>
                    <div className="space-y-2">
                      {group.items.map((item) => (
                        <div
                          key={item.description}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {item.description}
                          </span>
                          <div className="flex items-center gap-1">
                            {item.keys.map((key, i) => (
                              <kbd
                                key={i}
                                className="px-2 py-1 text-xs font-semibold
                                  bg-slate-100 dark:bg-slate-700
                                  text-slate-600 dark:text-slate-300
                                  rounded-lg border border-slate-200
                                  dark:border-slate-600"
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
