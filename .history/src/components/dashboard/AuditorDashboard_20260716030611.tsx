'use client'

import { useQuery } from '@tanstack/react-query'
import { Shield, AlertTriangle, FileText, CheckCircle2, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { StatCard } from '@/components/shared/StatCard'
import { assetApi } from '@/lib/api/assets'
import { TreatmentBadge } from '@/components/shared/TreatmentBadge'
import type { AccountingTreatment } from '@/types'

function IssueRow({ label, count, total, severity }: { label: string; count: number; total: number; severity: 'low' | 'medium' | 'high' }) {
  const colors = { low: 'text-slate-500', medium: 'text-amber-600', high: 'text-red-600' }
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0">
        {count > 0
          ? <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${colors[severity]}`} />
          : <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
        }
        <span className="text-sm text-slate-700">{label}</span>
      </div>
      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
        <span className={`text-sm font-semibold ${count > 0 ? colors[severity] : 'text-emerald-600'}`}>{count}</span>
        {count > 0 && <span className="text-xs text-slate-400">({pct}%)</span>}
      </div>
    </div>
  )
}

export function AuditorDashboard() {
  const { data: auditData } = useQuery({
    queryKey: ['assets', 'audit', 'includeDeleted'],
    queryFn: async () => {
      const payload = await assetApi.audit({ includeDeleted: true })
      return (payload as Record<string, unknown>) ?? {}
    },
  })

  const summary = (auditData && typeof auditData === 'object' && 'summary' in auditData && auditData.summary && typeof auditData.summary === 'object'
    ? (auditData.summary as Record<string, unknown>)
    : {}) as Record<string, unknown>
  const rec = (summary.recognitionSummary && typeof summary.recognitionSummary === 'object'
    ? (summary.recognitionSummary as Record<string, unknown>)
    : {}) as Record<string, unknown>
  const dataIssues = Number(summary.missingSerialNumber ?? 0) + Number(summary.missingPurchaseDate ?? 0) + Number(summary.missingCategory ?? 0)

  const treatmentRows: { label: string; key: string; treatment: AccountingTreatment }[] = [
    { label: 'Capitalized', key: 'capitalized', treatment: 'capitalized' },
    { label: 'Expensed', key: 'expensed', treatment: 'expensed' },
    { label: 'Tracked (Non-Cap)', key: 'tracked_non_capitalized', treatment: 'tracked_non_capitalized' },
    { label: 'Pending Review', key: 'pending_review', treatment: 'pending_review' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Overview</h1>
        <p className="text-slate-500 mt-1">Asset register integrity and compliance status</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Assets" value={Number(summary.totalAssets ?? 0)} icon={Shield} iconColor="text-brand-600" iconBg="bg-brand-50" />
        <StatCard label="Data Issues" value={dataIssues} icon={AlertTriangle} iconColor="text-amber-600" iconBg="bg-amber-50" href="/reports/audit" />
        <StatCard label="Pending Review" value={Number(rec.pending_review ?? 0)} icon={FileText} iconColor="text-purple-600" iconBg="bg-purple-50" />
        <StatCard label="Disposed" value={Number(summary.disposedCount ?? 0)} icon={CheckCircle2} iconColor="text-red-600" iconBg="bg-red-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-5">Completeness Report</h3>
          <div className="space-y-4">
            <IssueRow label="Missing serial numbers" count={Number(summary.missingSerialNumber ?? 0)} total={Number(summary.totalAssets ?? 0)} severity="medium" />
            <IssueRow label="Missing purchase dates" count={Number(summary.missingPurchaseDate ?? 0)} total={Number(summary.totalAssets ?? 0)} severity="high" />
            <IssueRow label="Missing categories" count={Number(summary.missingCategory ?? 0)} total={Number(summary.totalAssets ?? 0)} severity="low" />
            <IssueRow label="Pending recognition" count={Number(rec.pending_review ?? 0)} total={Number(summary.totalAssets ?? 0)} severity="high" />
          </div>
          <div className="mt-6 pt-5 border-t border-slate-100">
            <Link href="/reports/audit" className="text-sm font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
              Full audit dashboard <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-5">Recognition Breakdown</h3>
          <div className="space-y-3">
            {treatmentRows.map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <TreatmentBadge treatment={item.treatment} />
                <span className="text-sm font-semibold text-slate-900">
                  {(rec as Record<string, number> | undefined)?.[item.key] ?? 0}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-slate-100">
            <Link href="/reports/finance" className="text-sm font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
              Finance report <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
