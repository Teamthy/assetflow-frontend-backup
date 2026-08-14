'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, ShieldCheck, AlertTriangle, CheckCircle2,
  Package, Barcode, Calendar, Tag, Download, TrendingDown,
  Wrench, TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { StatCardSkeleton } from '@/components/shared/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { useAuditSummary } from '@/lib/hooks/useAssets'
import { assetApi } from '@/lib/api/assets'
import { cn } from '@/lib/utils'

export default function AuditReportPage() {
  const { data: audit, isLoading } = useAuditSummary()

  const stats = useMemo(() => {
    const total = audit?.summary?.totalAssets ?? 0
    const missingSerials = audit?.summary?.missingSerialNumber ?? 0
    const missingDates = audit?.summary?.missingPurchaseDate ?? 0
    const missingCategories = audit?.summary?.missingCategory ?? 0
    const disposed = audit?.summary?.disposedCount ?? 0
    const maintenance = audit?.summary?.maintenanceCount ?? 0

    const completenessIssues = missingSerials + missingDates + missingCategories
    const maxPossibleIssues = total * 3
    const completeness = maxPossibleIssues > 0
      ? Math.max(0, Math.round(((maxPossibleIssues - completenessIssues) / maxPossibleIssues) * 100))
      : 100

    const recognitionSummary = audit?.summary?.recognitionSummary ?? {}

    return {
      total,
      missingSerials,
      missingDates,
      missingCategories,
      disposed,
      maintenance,
      completeness,
      recognitionSummary,
    }
  }, [audit])

  async function handleExport() {
    try {
      const blob = await assetApi.export({})
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'audit-report-' + new Date().toISOString().split('T')[0] + '.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Report downloaded')
    } catch {
      toast.error('Export failed')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/reports" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to reports
      </Link>

      <PageHeader
        title="Audit dashboard"
        description="Data health, compliance, and lifecycle overview"
        actions={
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4" />
            Export report
          </Button>
        }
      />

      {isLoading ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Data completeness"
              value={stats.completeness + '%'}
              icon={stats.completeness >= 80 ? CheckCircle2 : AlertTriangle}
              iconColor={stats.completeness >= 80 ? 'text-emerald-600' : 'text-amber-600'}
              iconBg={stats.completeness >= 80 ? 'bg-emerald-50' : 'bg-amber-50'}
            />
            <StatCard
              title="Total assets"
              value={stats.total}
              icon={Package}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
            />
            <StatCard
              title="In maintenance"
              value={stats.maintenance}
              icon={Wrench}
              iconColor="text-amber-600"
              iconBg="bg-amber-50"
            />
            <StatCard
              title="Disposed"
              value={stats.disposed}
              icon={TrendingDown}
              iconColor="text-slate-600"
              iconBg="bg-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Data quality */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Data quality issues</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Fields missing across your register</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <QualityRow
                  icon={Barcode}
                  label="Missing serial numbers"
                  count={stats.missingSerials}
                  total={stats.total}
                  href="/assets"
                />
                <QualityRow
                  icon={Calendar}
                  label="Missing purchase dates"
                  count={stats.missingDates}
                  total={stats.total}
                  href="/assets"
                />
                <QualityRow
                  icon={Tag}
                  label="Missing categories"
                  count={stats.missingCategories}
                  total={stats.total}
                  href="/assets"
                />
              </div>
            </div>

            {/* Recognition summary */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Accounting treatment</h3>
                  <p className="text-sm text-slate-500 mt-0.5">How assets are classified</p>
                </div>
              </div>
              <div className="p-6">
                {Object.keys(stats.recognitionSummary).length === 0 ? (
                  <div className="text-sm text-slate-400 text-center py-4">
                    No recognition data yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(stats.recognitionSummary).map(([key, count]) => {
                      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                      const pct = stats.total > 0 ? Math.round(((count as number) / stats.total) * 100) : 0
                      const colorMap: Record<string, { bar: string; text: string }> = {
                        capitalized: { bar: 'bg-purple-500', text: 'text-purple-700' },
                        expensed: { bar: 'bg-slate-400', text: 'text-slate-600' },
                        tracked_non_capitalized: { bar: 'bg-blue-500', text: 'text-blue-700' },
                        pending_review: { bar: 'bg-amber-500', text: 'text-amber-700' },
                      }
                      const colors = colorMap[key] ?? { bar: 'bg-slate-400', text: 'text-slate-600' }
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm text-slate-700">{label}</span>
                            <span className={cn('text-sm font-semibold', colors.text)}>
                              {count as number} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full transition-all', colors.bar)}
                              style={{ width: (pct || 2) + '%' }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Audit readiness summary */}
          <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                stats.completeness >= 80 ? 'bg-emerald-50' : 'bg-amber-50'
              )}>
                {stats.completeness >= 80 ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                )}
              </div>
              <div className="flex-1">
                <h4 className={cn(
                  'text-base font-semibold',
                  stats.completeness >= 80 ? 'text-emerald-900' : 'text-amber-900'
                )}>
                  {stats.completeness >= 80 ? 'Your register is audit-ready' : 'Some data cleanup needed'}
                </h4>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  {stats.completeness >= 80
                    ? 'Data completeness score is above 80%. Your asset register is in good shape for external audits.'
                    : 'Data completeness score is below 80%. Consider filling in missing fields before your next audit.'}
                </p>
              </div>
              <TrendingUp className={cn(
                'w-8 h-8',
                stats.completeness >= 80 ? 'text-emerald-500' : 'text-amber-500'
              )} />
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
  const isClean = count === 0
  const isModerate = pct > 0 && pct < 10
  const barColor = isClean ? 'bg-emerald-500' : isModerate ? 'bg-amber-500' : 'bg-red-500'
  const textColor = isClean ? 'text-emerald-600' : isModerate ? 'text-amber-600' : 'text-red-600'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm text-slate-700">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('text-sm font-semibold', textColor)}>
            {count} ({pct}%)
          </span>
          {!isClean && (
            <Link href={href} className="text-xs font-medium text-blue-600 hover:text-blue-700">
              View
            </Link>
          )}
        </div>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn('h-full transition-all', barColor)} style={{ width: (pct || 2) + '%' }} />
      </div>
    </div>
  )
}
