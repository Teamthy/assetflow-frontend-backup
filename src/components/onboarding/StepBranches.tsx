'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { branchApi } from '@/lib/api/branches'

export function StepBranches({
  onNext,
  onBack,
  onSkip,
}: {
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}) {
  const [name, setName] = useState('Head Office')
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    setSaving(true)
    try {
      if (name.trim()) {
        await branchApi.create({ name: name.trim() })
      }
      onNext()
    } catch {
      toast.error('Could not create branch')
      onNext()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-8">
      <div>
        <h2 className="text-2xl font-semibold">Add a first branch</h2>
        <p className="mt-2 text-sm text-slate-500">Create a location where you keep assets. You can add more later.</p>
      </div>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Head Office" />
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <button onClick={onBack} className="text-sm text-slate-500">Back</button>
          <button onClick={onSkip} className="text-sm text-slate-500">Skip</button>
        </div>
        <Button onClick={handleNext} disabled={saving} className="bg-blue-600 text-white">
          {saving ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
