'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ClipboardCheck, Loader2, Play, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { auditApi, type AuditCampaign } from '@/lib/api/audit'
import { getApiErrorMessage } from '@/lib/api/errors'
import { formatDate } from '@/lib/utils/format'

export default function AuditCampaignsPage() {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const { data: items = [], isLoading, isError } = useQuery({
    queryKey: ['audit-campaigns'],
    queryFn: auditApi.listCampaigns,
  })

  const create = useMutation({
    mutationFn: () => auditApi.createCampaign({ name: name.trim(), description: description.trim() || undefined }),
    onSuccess: () => {
      toast.success('Campaign created')
      setName('')
      setDescription('')
      void qc.invalidateQueries({ queryKey: ['audit-campaigns'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not create campaign')),
  })

  async function run(campaign: AuditCampaign, action: 'start' | 'complete') {
    setBusyId(campaign.id)
    try {
      if (action === 'start') await auditApi.startCampaign(campaign.id)
      else await auditApi.completeCampaign(campaign.id)
      toast.success(action === 'start' ? 'Count started' : 'Campaign completed')
      void qc.invalidateQueries({ queryKey: ['audit-campaigns'] })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Campaign action failed'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Physical audit"
        description="Physical count campaigns, exceptions, and sign-off"
      />

      <form
        className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim().length < 2) {
            toast.error('Campaign name is required')
            return
          }
          create.mutate()
        }}
      >
        <h3 className="text-sm font-semibold text-slate-900">New verification campaign</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input placeholder="Q3 Lagos stock-take" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea rows={1} placeholder="Scope, branch, or notes" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create campaign'}
          </Button>
        </div>
      </form>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading campaigns…</p>
      ) : isError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Audit campaigns are not available yet. Try again shortly.
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          <ClipboardCheck className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          No audit campaigns yet. Create one before the next physical verification.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expected</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3">Missing</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{campaign.name}</div>
                    {campaign.description && <div className="text-xs text-slate-500">{campaign.description}</div>}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-600">{campaign.status ?? 'draft'}</td>
                  <td className="px-4 py-3">{campaign.totalAssetsExpected ?? '—'}</td>
                  <td className="px-4 py-3">{campaign.totalVerified ?? '—'}</td>
                  <td className="px-4 py-3">{campaign.totalMissing ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(campaign.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {campaign.status === 'draft' && (
                      <Button size="sm" variant="outline" disabled={busyId === campaign.id} onClick={() => run(campaign, 'start')}>
                        {busyId === campaign.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                        Start count
                      </Button>
                    )}
                    {campaign.status === 'in_progress' && (
                      <Button size="sm" disabled={busyId === campaign.id} onClick={() => run(campaign, 'complete')}>
                        {busyId === campaign.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Complete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
