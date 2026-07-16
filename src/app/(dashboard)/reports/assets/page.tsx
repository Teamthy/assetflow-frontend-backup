'use client'

import Link from 'next/link'
import { ArrowLeft, Package, Download, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { useMemo, useState } from 'react'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge, ConditionBadge, TreatmentBadge } from '@/components/shared/StatusBadge'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useAssets } from '@/lib/hooks/useAssets'
import { assetApi } from '@/lib/api/assets'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { AssetStatus } from '@/types'

export default function AssetRegisterReportPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [treatmentFilter, setTreatmentFilter] = useState<string>('all')

  const params = useMemo(() => ({
    limit: 500,
    status: statusFilter !== 'all' ? (statusFilter as AssetStatus) : undefined,
  }), [statusFilter])

  const { data, isLoading } = useAssets(params)

  const items = data?.items ?? []
  const filtered = treatmentFilter === 'all'
    ? items
    : items.filter((a) => a.accountingTreatment === treatmentFilter)

  const totalValue = filtered.reduce((sum, a) => sum + (a.purchaseCost ?? 0), 0)

  async function handleExport() {
    try {
      const blob = await assetApi.export(params)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'asset-register-' + new Date().toISOString().split('T')[0] + '.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Register exported')
    } catch {
      toast.error('Export failed')
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <Link href="/reports" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to reports
      </Link>

      <PageHeader
        title="Asset register"
        description="Complete register export with recognition and financial data"
        actions={
          <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="w-4 h-4" />
            Download Excel
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total assets"
          value={filtered.length}
          icon={Package}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Total value"
          value={formatCurrency(totalValue)}
          icon={Package}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Data source"
          value="Live"
          icon={Package}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="disposed">Disposed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={treatmentFilter} onValueChange={setTreatmentFilter}>
            <SelectTrigger className="w-52 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All treatments</SelectItem>
              <SelectItem value="capitalized">Capitalized</SelectItem>
              <SelectItem value="expensed">Expensed</SelectItem>
              <SelectItem value="tracked_non_capitalized">Tracked</SelectItem>
              <SelectItem value="pending_review">Pending review</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No assets match these filters"
            description="Try clearing filters or add assets to your register."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Asset</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Tag</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Condition</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Treatment</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Branch</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Cost</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Purchase date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-3">
                      <Link href={'/assets/' + asset.id} className="text-sm font-medium text-slate-900 hover:text-blue-600">
                        {asset.name}
                      </Link>
                      {asset.category && <div className="text-xs text-slate-500">{asset.category}</div>}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 font-mono">{asset.assetTag}</td>
                    <td className="px-6 py-3"><StatusBadge status={asset.status} /></td>
                    <td className="px-6 py-3"><ConditionBadge condition={asset.condition} /></td>
                    <td className="px-6 py-3">
                      {asset.accountingTreatment && <TreatmentBadge treatment={asset.accountingTreatment} />}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-700">{asset.branch?.name ?? '-'}</td>
                    <td className="px-6 py-3 text-sm text-slate-900 font-medium text-right">
                      {asset.purchaseCost ? formatCurrency(asset.purchaseCost) : '-'}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-500">{formatDate(asset.purchaseDate ?? '')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50/50 border-t border-slate-200">
                <tr>
                  <td colSpan={6} className="px-6 py-3 text-sm font-semibold text-slate-700 text-right">
                    Total ({filtered.length} assets)
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-slate-900 text-right">
                    {formatCurrency(totalValue)}
                  </td>
                  <td className="px-6 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
