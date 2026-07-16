'use client'

import { useRouter } from 'next/navigation'
import { Clock, LogIn } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'

export default function SessionExpiredPage() {
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)

  const handleSignIn = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Session Expired</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Your session has expired for security reasons.
          Please sign in again to continue where you left off.
        </p>
        <button
          onClick={handleSignIn}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-all duration-150"
        >
          <LogIn className="w-4 h-4" />
          Sign In Again
        </button>
      </div>
    </div>
  )
}
