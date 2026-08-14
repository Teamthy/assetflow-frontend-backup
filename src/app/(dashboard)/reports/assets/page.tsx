'use client'

import Link from 'next/link'
import { ArrowLeft, Package, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { useAssetReport } from '@/lib/hooks/useReports'
import { assetApi } from '@/lib/api/assets'
import { downloadBlob } from '@/lib/utils/download'
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils/format'
import { asNumber } from '@/lib/reports/helpers'
import type { AssetStatus } from '@/types'

export default function AssetRegisterReportPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [treatmentFilter, setTreatmentFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  const params = useMemo(() => ({
    page,
    limit: 200,
    status: statusFilter !== 'all' ? (statusFilter as AssetStatus) : undefined,
    accountingTreatment: treatmentFilter !== 'all'
      ? (treatmentFilter as 'capitalized' | 'expensed' | 'tracked_non_capitalized' | 'pending_review')
      : undefined,
  }), [statusFilter, treatmentFilter, page])

  const { data, isLoading, isError } = useAssets(params)
  const snapshot = useAssetReport()

  const items = data?.data ?? data?.items ?? []
  const total = data?.pagination?.total ?? items.length
  const totalPages = Math.max(1, data?.pagination?.totalPages ?? 1)
  const pageValue = items.reduce((sum, asset) => sum + asNumber(asset.purchaseCost), 0)
  const summary = snapshot.data && typeof snapshot.data === 'object'
    ? (snapshot.data as { summary?: Record<string, unknown> }).summary ?? {}
    : {}

  async function handleExport() {
    try {
      const blob = await assetApi.export({
        status: params.status,
        accountingTreatment: params.accountingTreatment,
        limit: 500,
      })
      downloadBlob(blob, `asset-register-${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success('Register exported')
    } catch {
      toast.error('Export failed')
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <Link href="/reports" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 mb-4 print:hidden">
        <ArrowLeft className="w-4 h-4" />
        Back to reports
      </Link>

      <PageHeader
        title="Asset register"
        description="Live register with recognition and cost"
        actions={
          <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700 text-white print:hidden">
            <Download className="w-4 h-4" />
            Download Excel
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total assets" value={formatNumber(asNumber(summary.total) || total)} icon={Package} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Active value" value={formatCurrency(asNumber(summary.totalActiveValue) || pageValue)} icon={Package} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard title="On this page" value={formatNumber(items.length)} icon={Package} iconColor="text-purple-600" iconBg="bg-purple-50" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-3 items-center print:hidden">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1) }}>
            <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="disposed">Disposed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={treatmentFilter} onValueChange={(value) => { setTreatmentFilter(value); setPage(1) }}>
            <SelectTrigger className="w-52 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All treatments</SelectItem>
              <SelectItem value="capitalized">Capitalized</SelectItem>
              <SelectItem value="expensed">Expensed</SelectItem>
              <SelectItem value="tracked_non_capitalized">Tracked</SelectItem>
              <SelectItem value="pending_review">Pending review</SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-auto text-xs text-slate-500">{formatNumber(total)} matching</span>
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : isError ? (
          <div className="p-8 text-sm text-red-700">Could not load the register. Refresh and try again.</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No assets match these filters"
            description="Clear filters or add assets."
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
                {items.map((asset) => (
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
                    <td className="px-6 py-3 text-sm text-slate-700">{asset.branch?.name ?? '—'}</td>
                    <td className="px-6 py-3 text-sm text-slate-900 font-medium text-right">
                      {formatCurrency(asset.purchaseCost)}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-500">{formatDate(asset.purchaseDate)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50/50 border-t border-slate-200">
                <tr>
                  <td colSpan={6} className="px-6 py-3 text-sm font-semibold text-slate-700 text-right">
                    Page total ({items.length})
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-slate-900 text-right">
                    {formatCurrency(pageValue)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 print:hidden">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
