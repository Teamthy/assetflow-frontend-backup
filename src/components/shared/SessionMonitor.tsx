'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/auth'

const SESSION_ENDED_EVENT = 'assetflow:session-ended'

export function SessionMonitor() {
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    function handleSessionEnded() {
      if (isAuthenticated) {
        logout()
        toast.error('Your session has expired. Please sign in again.', { duration: 4000 })
        router.push('/login')
      }
    }

    window.addEventListener(SESSION_ENDED_EVENT, handleSessionEnded)
    return () => window.removeEventListener(SESSION_ENDED_EVENT, handleSessionEnded)
  }, [isAuthenticated, logout, router])

  return null
}

// Utility to dispatch session end from anywhere (used by api client)
export function dispatchSessionEnded() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SESSION_ENDED_EVENT))
  }
}
