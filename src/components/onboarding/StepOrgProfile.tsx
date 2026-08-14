'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/stores/auth'


export function StepOrgProfile({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const organization = useAuthStore((s) => s.organization)
  const [name, setName] = useState(organization?.name ?? '')
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    setSaving(true)
    try {
      if (!name.trim()) {
        toast.error('Organization name is required')
        return
      }
      onNext()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-8">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--neutral-900)]">Confirm your organization</h2>
        <p className="mt-2 text-sm text-[var(--neutral-500)]">
          Shown on reports and the organization profile.
        </p>
      </div>
      <div className="space-y-3">
        <label className="text-sm font-medium">Organization name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
        <p className="text-xs text-slate-500">Slug: {organization?.slug ?? '—'}</p>
      </div>
      <div className="flex items-center justify-between">
        <button onClick={onSkip} className="text-sm text-slate-500">Skip</button>
        <Button onClick={handleNext} disabled={saving} className="bg-blue-600 text-white">
          {saving ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
