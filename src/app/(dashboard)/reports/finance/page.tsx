'use client'

import Link from 'next/link'
import {
  ArrowLeft, TrendingDown, DollarSign, Package, Download, PieChart, BarChart2,
} from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { StatCardSkeleton } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { assetApi } from '@/lib/api/assets'
import { downloadBlob } from '@/lib/utils/download'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import { useReportsSnapshot } from '@/lib/hooks/useReports'
import { asNumber, asRecord } from '@/lib/reports/helpers'

export default function FinanceReportPage() {
  const snap = useReportsSnapshot()
  const finance = snap.finance
  const empty = !snap.isLoading && snap.assets.total === 0

  async function handleExport() {
    try {
      const blob = await assetApi.export({ limit: 500 })
      downloadBlob(blob, `finance-report-${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success('Report downloaded')
    } catch {
      toast.error('Export failed')
    }
  }

  const treatmentRows = [
    ['capitalized', 'Capitalized'],
    ['expensed', 'Expensed'],
    ['trackedNonCapitalized', 'Tracked non-capitalized'],
    ['pendingReview', 'Pending review'],
  ] as const

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/reports" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 mb-4 print:hidden">
        <ArrowLeft className="w-4 h-4" />
        Back to reports
      </Link>

      <PageHeader
        title="Finance dashboard"
        description="Capitalized value, depreciation, and disposal proceeds from the API"
        actions={
          <Button onClick={handleExport} variant="outline" className="print:hidden">
            <Download className="w-4 h-4" />
            Export
          </Button>
        }
      />

      {snap.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
        </div>
      ) : empty ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon={DollarSign}
            title="No financial data yet"
            description="Add assets with a purchase cost."
            action={<Link href="/assets/new"><Button className="bg-blue-600 text-white">Add asset</Button></Link>}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard title="Active value" value={formatCurrency(snap.assets.totalActiveValue)} icon={DollarSign} iconColor="text-blue-600" iconBg="bg-blue-50" />
            <StatCard title="Capitalized value" value={formatCurrency(finance.capitalizedValue)} icon={Package} iconColor="text-purple-600" iconBg="bg-purple-50" trend={{ value: `${formatNumber(finance.capitalizedCount)} assets` }} />
            <StatCard title="Accumulated dep." value={formatCurrency(finance.accumulated)} icon={TrendingDown} iconColor="text-emerald-600" iconBg="bg-emerald-50" trend={{ value: `${finance.coveragePercent}% coverage` }} />
            <StatCard title="Disposal proceeds" value={formatCurrency(finance.disposalProceeds)} icon={DollarSign} iconColor="text-slate-600" iconBg="bg-slate-100" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                  <PieChart className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Accounting treatment</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Same source as /reports/finance</p>
                </div>
              </div>
              <div className="p-6 space-y-3">
                {treatmentRows.map(([key, label]) => {
                  const row = asRecord(finance.treatment[key])
                  const count = asNumber(row.count)
                  const value = asNumber(row.totalValue)
                  return (
                    <div key={key} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{label}</p>
                        <p className="text-xs text-slate-500">{formatNumber(count)} assets</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(value)}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <BarChart2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Disposals</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Proceeds by method</p>
                </div>
              </div>
              <div className="p-6">
                {finance.disposalsByMethod.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No disposals recorded</p>
                ) : (
                  <div className="space-y-3">
                    {finance.disposalsByMethod.map((row) => (
                      <div key={String(row.method)} className="flex items-center justify-between">
                        <span className="text-sm text-slate-700 capitalize">{String(row.method ?? 'other')}</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {formatCurrency(row.totalProceeds)} · {asNumber(row.count)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  This year charge {formatCurrency(finance.yearCharge)} · {formatNumber(finance.depreciable)} depreciable assets
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
