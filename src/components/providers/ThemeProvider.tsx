'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/lib/stores/theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  useEffect(() => {
    setTheme(theme)
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setTheme('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [setTheme, theme])

  return <>{children}</>
}
