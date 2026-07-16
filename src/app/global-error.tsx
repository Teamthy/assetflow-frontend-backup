'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
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
    <html>
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Something went wrong</h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            An unexpected error occurred. Our team has been notified. You can try again or return to the dashboard.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-400 mt-3 font-mono">
              Error ID: {error.digest}
            </p>
          )}
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button onClick={reset} variant="outline">
              <RotateCcw className="w-4 h-4" />
              Try again
            </Button>
            <Link href="/dashboard">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Home className="w-4 h-4" />
                Go to dashboard
              </Button>
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
