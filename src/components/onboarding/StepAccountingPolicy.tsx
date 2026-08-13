'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { orgSettingsApi } from '@/lib/api/organization-settings'

export function StepAccountingPolicy({
  onNext,
  onBack,
  onSkip,
}: {
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}) {
  const [threshold, setThreshold] = useState('50000.00')
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    setSaving(true)
    try {
      await orgSettingsApi.update({
        capitalizationThreshold: threshold,
        capitalizationCurrency: 'NGN',
        minimumUsefulLifeMonths: 12,
        lowValueTreatment: 'track_non_capitalized',
        defaultDepreciationMethod: 'straight_line',
      })
      onNext()
    } catch {
      toast.error('Could not save accounting policy')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-8">
      <div>
        <h2 className="text-2xl font-semibold">Accounting policy</h2>
        <p className="mt-2 text-sm text-slate-500">
          These settings control how AssetFlow classifies your assets. You can change them later.
        </p>
      </div>
      <div className="space-y-3">
        <label className="text-sm font-medium">Capitalization threshold (NGN)</label>
        <Input value={threshold} onChange={(e) => setThreshold(e.target.value)} />
      </div>
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
