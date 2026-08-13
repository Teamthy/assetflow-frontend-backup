'use client'

import { useRouter } from 'next/navigation'
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts'
import { useSequenceShortcuts } from '@/lib/hooks/useSequenceShortcuts'

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  useSequenceShortcuts()
  useKeyboardShortcuts([
    {
      key: 'k',
      meta: true,
      description: 'Go to assets',
      handler: () => router.push('/assets'),
    },
  ])
  return <>{children}</>
}
