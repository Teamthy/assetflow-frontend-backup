'use client'
import { useEffect, useState } from 'react'
import { API_HEALTH_CANDIDATES } from '@/lib/api/config'
export function ApiStatusBanner() {
  const [offline, setOffline] = useState(false)
  useEffect(() => {
    let cancelled = false
    const ping = async () => {
      for (const url of API_HEALTH_CANDIDATES) {
        try {
          const response = await fetch(url, { cache: 'no-store' })
          if (response.ok) { if (!cancelled) setOffline(false); return }
        } catch { }
      }
      if (!cancelled) setOffline(true)
    }
    void ping()
    const timer = window.setInterval(() => { void ping() }, 8000)
    return () => { cancelled = true; window.clearInterval(timer) }
  }, [])
  if (!offline) return null
  return (
    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-left">
      <p className="text-xs font-medium text-red-700">
        Cannot reach the AssetFlow API. Keep pnpm dev running in assetflowserver.
      </p>
    </div>
  )
}