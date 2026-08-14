'use client'

import { AuthCarousel } from './AuthCarousel'
import { Logo } from '@/components/brand/Logo'

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <AuthCarousel />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[420px] rounded-2xl border border-white/15 bg-white p-7 shadow-2xl sm:p-8">
          <div className="mb-6">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
