'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { useUIStore } from '@/lib/stores/ui'
import { LogoMark } from '@/components/brand/Logo'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { SessionMonitor } from '@/components/shared/SessionMonitor'
import { cn } from '@/lib/utils'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) {
      router.replace('/login')
    }
  }, [hasHydrated, isAuthenticated, router])

  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-pulse">
            <LogoMark className="h-8 w-8" />
          </div>
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SessionMonitor />
      <Sidebar />
      <Topbar />
      <main
        className={cn(
          'transition-all duration-200 pt-[60px]',
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-60'
        )}
      >
        <div className="p-6 lg:p-8 min-h-[calc(100vh-60px)]">
          {children}
        </div>
      </main>
    </div>
  )
}
