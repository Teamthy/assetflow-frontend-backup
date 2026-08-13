'use client'

import { useEffect, useState } from 'react'
import { API_BASE_URL, API_HEALTH_URL } from '@/lib/api/config'

export function ApiStatusBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    let cancelled = false

    const ping = async () => {
      try {
        const response = await fetch(API_HEALTH_URL, { cache: 'no-store' })
        if (!cancelled) setOffline(!response.ok)
      } catch {
        if (!cancelled) setOffline(true)
      }
    }

    void ping()
    const timer = window.setInterval(() => {
      void ping()
    }, 8000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-left">
      <p className="text-xs font-medium text-red-700">
        Cannot reach the AssetFlow API at {API_BASE_URL}. Start it with{' '}
        <span className="font-semibold">pnpm dev</span> in assetflowserver
        (port 6000), then confirm {API_HEALTH_URL} returns status ok.
      </p>
    </div>
  )
}
