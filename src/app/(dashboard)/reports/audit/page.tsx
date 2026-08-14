'use client'

import Link from 'next/link'
import {
  ArrowLeft, ShieldCheck, AlertTriangle, CheckCircle2,
  Package, Barcode, Calendar, Tag, Download, Building2,
} from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { StatCardSkeleton } from '@/components/shared/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { assetApi } from '@/lib/api/assets'
import { downloadBlob } from '@/lib/utils/download'
import { useReportsSnapshot } from '@/lib/hooks/useReports'
import { asNumber } from '@/lib/reports/helpers'
import { cn } from '@/lib/utils'

export default function AuditReportPage() {
  const snap = useReportsSnapshot()
  const stats = snap.audit
  const total = stats.totalAssets

  async function handleExport() {
    try {
      const blob = await assetApi.export({ limit: 500 })
      downloadBlob(blob, `audit-report-${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success('Report downloaded')
    } catch {
      toast.error('Export failed')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/reports" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 mb-4 print:hidden">
        <ArrowLeft className="w-4 h-4" />
        Back to reports
      </Link>

      <PageHeader
        title="Audit dashboard"
        description="Data health and classification from the live register"
        actions={
          <Button onClick={handleExport} variant="outline" className="print:hidden">
            <Download className="w-4 h-4" />
            Export report
          </Button>
        }
      />

      {snap.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard title="Completeness" value={`${stats.completenessPercent}%`} icon={stats.completenessPercent >= 80 ? CheckCircle2 : AlertTriangle} iconColor={stats.completenessPercent >= 80 ? 'text-emerald-600' : 'text-amber-600'} iconBg={stats.completenessPercent >= 80 ? 'bg-emerald-50' : 'bg-amber-50'} />
            <StatCard title="Total assets" value={total} icon={Package} iconColor="text-blue-600" iconBg="bg-blue-50" href="/assets" />
            <StatCard title="Pending review" value={stats.pendingReview} icon={ShieldCheck} iconColor="text-amber-600" iconBg="bg-amber-50" href="/reports/approvals" />
            <StatCard title="In maintenance" value={snap.assets.maintenance} icon={Package} iconColor="text-slate-600" iconBg="bg-slate-100" href="/assets?status=maintenance" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-900">Missing fields</h3>
                <p className="text-sm text-slate-500 mt-0.5">From the current register</p>
              </div>
              <div className="p-6 space-y-4">
                <QualityRow icon={Barcode} label="Serial numbers" count={stats.missingSerialNumber} total={total} href="/assets" />
                <QualityRow icon={Calendar} label="Purchase dates" count={stats.missingPurchaseDate} total={total} href="/assets" />
                <QualityRow icon={Tag} label="Categories" count={stats.missingCategory} total={total} href="/assets" />
                <QualityRow icon={Building2} label="Branches" count={stats.missingBranch} total={total} href="/assets" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-900">Accounting treatment</h3>
                <p className="text-sm text-slate-500 mt-0.5">Same totals as the finance report</p>
              </div>
              <div className="p-6">
                {stats.recognition.length === 0 ? (
                  <div className="text-sm text-slate-400 text-center py-4">No classification data yet</div>
                ) : (
                  <div className="space-y-3">
                    {stats.recognition.map((row) => {
                      const key = String(row.accountingTreatment ?? 'unknown')
                      const count = asNumber(row.count)
                      const label = key.replace(/_/g, ' ')
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm text-slate-700 capitalize">{label}</span>
                            <span className="text-sm font-semibold text-slate-900">{count} ({pct}%)</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${Math.max(pct, 2)}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function QualityRow({
  icon: Icon, label, count, total, href,
}: {
  icon: React.ElementType
  label: string
  count: number
  total: number
  href: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const clean = count === 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm text-slate-700">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('text-sm font-semibold', clean ? 'text-emerald-600' : 'text-amber-700')}>
            {count} ({pct}%)
          </span>
          {!clean && (
            <Link href={href} className="text-xs font-medium text-blue-600">View</Link>
          )}
        </div>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn('h-full', clean ? 'bg-emerald-500' : 'bg-amber-500')} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
    </div>
  )
}
