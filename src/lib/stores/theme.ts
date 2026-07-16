import { create } from "zustand"
import { persist } from "zustand/middleware"

type Theme = "light" | "dark" | "system"

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system" as Theme,
      setTheme: (theme: Theme) => {
        set({ theme })
        if (typeof document === "undefined") return
        const root = document.documentElement
        if (theme === "dark") {
          root.classList.add("dark")
        } else if (theme === "light") {
          root.classList.remove("dark")
        } else {
          const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
          root.classList.toggle("dark", isDark)
        }
      },
    }),
    { name: "assetflow-theme" },
  ),
)
