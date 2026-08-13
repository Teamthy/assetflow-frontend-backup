'use client'

import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'

export function OnboardingBanner() {
  const isFirstLogin = useAuthStore((s) => s.isFirstLogin)
  if (!isFirstLogin) return null

  return (
    <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
      Finish setup to import assets and invite your team.{' '}
      <Link href="/onboarding" className="font-semibold underline">
        Continue onboarding
      </Link>
    </div>
  )
}
