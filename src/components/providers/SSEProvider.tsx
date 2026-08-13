'use client'

import { useSSE } from '@/lib/hooks/useSSE'

export function SSEProvider({ children }: { children: React.ReactNode }) {
  useSSE()
  return <>{children}</>
}
