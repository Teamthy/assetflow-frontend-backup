'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="max-w-md mx-auto py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
        <AlertCircle className="w-7 h-7 text-red-600" />
      </div>
      <h1 className="text-xl font-bold text-slate-900 tracking-tight">This page could not load</h1>
      <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-sm mx-auto">
        {error.message || 'An unexpected error occurred while loading this page.'}
      </p>
      <div className="mt-6 flex items-center justify-center gap-2">
        <Button onClick={reset} variant="outline">
          <RotateCcw className="w-4 h-4" />
          Try again
        </Button>
        <Link href="/dashboard">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Home className="w-4 h-4" />
            Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
