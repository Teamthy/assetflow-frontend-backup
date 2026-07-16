'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, TrendingDown, DollarSign, Package,
  Download, PieChart, BarChart2,
} from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { StatCardSkeleton } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { useAssets } from '@/lib/hooks/useAssets'
import { assetApi } from '@/lib/api/assets'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

export default function FinanceReportPage() {
  const { data: allAssets, isLoading } = useAssets({ limit: 1000 })
  const { data: disposedAssets } = useAssets({ status: 'disposed', limit: 1000 })

  const stats = useMemo(() => {
    const items = allAssets?.data ?? allAssets?.items ?? []
    const disposed = disposedAssets?.data ?? disposedAssets?.items ?? []

    const capitalized = items.filter((a) => a.accountingTreatment === 'capitalized')
    const capitalizedValue = capitalized.reduce((sum, a) => sum + (a.purchaseCost ?? 0), 0)

    const totalAssetValue = items.reduce((sum, a) => sum + (a.purchaseCost ?? 0), 0)
    const residualTotal = items.reduce((sum, a) => sum + (a.residualValue ?? 0), 0)

    const disposalProceeds = 0 // Would come from disposal records; placeholder

    // Group by category
    const categoryBreakdown: Record<string, { count: number; value: number }> = {}
    items.forEach((a) => {
      const cat = a.category ?? 'Uncategorized'
      if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { count: 0, value: 0 }
      categoryBreakdown[cat].count += 1
      categoryBreakdown[cat].value += a.purchaseCost ?? 0
    })

    const topCategories = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 6)

    // Treatment distribution
    const treatmentCount: Record<string, number> = {}
    items.forEach((a) => {
      const t = a.accountingTreatment ?? 'unknown'
      treatmentCount[t] = (treatmentCount[t] ?? 0) + 1
    })

    return {
      totalAssetValue,
      capitalizedCount: capitalized.length,
      capitalizedValue,
      residualTotal,
      disposedCount: disposed.length,
      disposalProceeds,
      topCategories,
      treatmentCount,
      totalCount: items.length,
    }
  }, [allAssets, disposedAssets])

  async function handleExport() {
    try {
      const blob = await assetApi.export({})
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'finance-report-' + new Date().toISOString().split('T')[0] + '.xlsx'
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
        title="Finance dashboard"
        description="Capitalized value, depreciation, and disposal figures"
        actions={
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4" />
            Export
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : stats.totalCount === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon={DollarSign}
            title="No financial data yet"
            description="Once you add assets with purchase costs, financial insights will appear here."
            action={
              <Link href="/assets/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Add first asset
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total asset value"
              value={formatCurrency(stats.totalAssetValue)}
              icon={DollarSign}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
            />
            <StatCard
              title="Capitalized value"
              value={formatCurrency(stats.capitalizedValue)}
              icon={Package}
              iconColor="text-purple-600"
              iconBg="bg-purple-50"
              trend={{
                value: formatNumber(stats.capitalizedCount) + ' assets',
                positive: true,
              }}
            />
            <StatCard
              title="Residual value"
              value={formatCurrency(stats.residualTotal)}
              icon={TrendingDown}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
            />
            <StatCard
              title="Disposal proceeds"
              value={formatCurrency(stats.disposalProceeds)}
              icon={DollarSign}
              iconColor="text-slate-600"
              iconBg="bg-slate-100"
              trend={{
                value: formatNumber(stats.disposedCount) + ' disposed',
                positive: true,
              }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top categories by value */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <BarChart2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Top categories by value</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Where your capital is invested</p>
                </div>
              </div>
              <div className="p-6">
                {stats.topCategories.length === 0 ? (
                  <div className="text-sm text-slate-400 text-center py-4">No category data</div>
                ) : (
                  <div className="space-y-3">
                    {stats.topCategories.map(([category, data]) => {
                      const pct = stats.totalAssetValue > 0 ? (data.value / stats.totalAssetValue) * 100 : 0
                      return (
                        <div key={category}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm text-slate-700 truncate">{category}</span>
                              <span className="text-xs text-slate-400 flex-shrink-0">({data.count})</span>
                            </div>
                            <span className="text-sm font-semibold text-slate-900 flex-shrink-0">
                              {formatCurrency(data.value)}
                            </span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: Math.max(pct, 2) + '%' }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Treatment breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                  <PieChart className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Accounting treatment</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Distribution across your register</p>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {Object.entries(stats.treatmentCount).map(([key, count]) => {
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                    const pct = stats.totalCount > 0 ? Math.round((count / stats.totalCount) * 100) : 0
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
                            {count} ({pct}%)
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
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
