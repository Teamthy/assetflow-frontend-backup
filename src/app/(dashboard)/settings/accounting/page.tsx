'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AccountingRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/settings/accounting-policy')
  }, [router])
  return null
}
