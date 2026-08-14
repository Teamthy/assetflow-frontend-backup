'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowLeft, ShieldCheck, Clock, CheckCircle2, XCircle, Download } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Button } from '@/components/ui/button'
import { usePendingApprovals } from '@/lib/hooks/useAdmin'
import { formatDateTime } from '@/lib/utils/format'
import { downloadTextFile, toCsv } from '@/lib/utils/download'

export default function ApprovalsLogPage() {
  const { data: approvals = [], isLoading, isError } = usePendingApprovals()
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [kind, setKind] = useState<'all' | 'disposal' | 'transfer'>('all')

  const rows = useMemo(() => approvals.filter((item) => {
    const type = item.requestType ?? item.type
    if (status !== 'all' && item.status !== status) return false
    if (kind !== 'all' && type !== kind) return false
    return true
  }), [approvals, status, kind])

  const pending = approvals.filter((item) => item.status === 'pending').length
  const approved = approvals.filter((item) => item.status === 'approved').length
  const rejected = approvals.filter((item) => item.status === 'rejected').length

  function handleExport() {
    downloadTextFile(
      toCsv(rows.map((item) => ({
        Asset: item.assetName ?? item.assetTag ?? '',
        Type: item.requestType ?? item.type ?? '',
        Status: item.status,
        RequestedBy: item.requestedByName ?? '',
        RequestedAt: item.requestedAt,
        DecidedAt: item.decidedAt ?? '',
        Note: item.decisionReason ?? '',
      }))),
      `approvals-${new Date().toISOString().slice(0, 10)}.csv`,
    )
    toast.success('Approvals log exported')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link href="/reports" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 print:hidden">
        <ArrowLeft className="w-4 h-4" />
        Back to reports
      </Link>

      <PageHeader
        title="Approvals log"
        description="Pending and decided disposal and transfer requests"
        actions={
          <div className="flex gap-2 print:hidden">
            <Link href="/approvals"><Button variant="outline">Decide requests</Button></Link>
            <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4" /> Export</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Pending" value={pending} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" href="/approvals" />
        <StatCard title="Approved" value={approved} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard title="Rejected" value={rejected} icon={XCircle} iconColor="text-red-600" iconBg="bg-red-50" />
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((item) => (
          <button key={item} type="button" onClick={() => setStatus(item)} className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${status === item ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{item}</button>
        ))}
        <span className="mx-1 h-5 w-px bg-slate-200" />
        {(['all', 'disposal', 'transfer'] as const).map((item) => (
          <button key={item} type="button" onClick={() => setKind(item)} className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${kind === item ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{item}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading approvals…</div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Could not load approvals.</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          No approvals in this view.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3">Decided</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <Link href={item.assetId ? `/assets/${item.assetId}` : '/approvals'} className="font-medium text-slate-900 hover:text-blue-600">
                      {item.assetName ?? item.assetTag ?? 'Request'}
                    </Link>
                    <div className="text-xs text-slate-500">{item.requestedByName ?? '—'}</div>
                  </td>
                  <td className="px-4 py-3 capitalize">{item.requestType ?? item.type}</td>
                  <td className="px-4 py-3 capitalize">{item.status}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(item.requestedAt)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(item.decidedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
