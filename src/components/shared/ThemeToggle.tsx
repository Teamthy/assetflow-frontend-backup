"use client"

import { motion } from "framer-motion"
import { Sun, Moon, Monitor } from "lucide-react"
import { useThemeStore } from "@/lib/stores/theme"

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()

  const options = [
    { id: "light" as const, icon: Sun, label: "Light" },
    { id: "dark" as const, icon: Moon, label: "Dark" },
    { id: "system" as const, icon: Monitor, label: "System" },
  ]

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
      {options.map((option) => {
        const Icon = option.icon
        const isActive = theme === option.id
        return (
          <motion.button
            key={option.id}
            onClick={() => setTheme(option.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={[
              "relative p-1.5 rounded-md transition-colors",
              isActive
                ? "text-slate-900 dark:text-white"
                : "text-slate-500 dark:text-slate-400",
            ].join(" ")}
            title={option.label}
          >
            {isActive && (
              <motion.div
                layoutId="theme-pill"
                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-md shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
            <Icon className="w-3.5 h-3.5 relative z-10" />
          </motion.button>
        )
      })}
    </div>
  )
}
