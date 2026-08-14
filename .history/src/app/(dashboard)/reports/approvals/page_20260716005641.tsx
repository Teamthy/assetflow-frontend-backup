'use client'

import { useQuery } from '@tanstack/react-query'
import { Clock, CheckCircle2, XCircle, AlertCircle, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/PageHeader'
import { assetApi } from '@/lib/api/assets'
import { TreatmentBadge } from '@/components/shared/TreatmentBadge'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { StatCard } from '@/components/shared/StatCard'
import type { Asset, PaginatedResponse } from '@/types'

export default function PendingApprovalsPage() {
  const { data: pendingResp, isLoading } = useQuery<PaginatedResponse<Asset>>({
    queryKey: ['assets', 'list', { accountingTreatment: 'pending_review' }],
    queryFn: async () => {
      const result = await assetApi.list({ accountingTreatment: 'pending_review', limit: 50 })
      const data = result.data as { data?: unknown; pagination?: Partial<PaginatedResponse<Asset>['pagination']> }
      const items = Array.isArray(data.data) ? (data.data as Asset[]) : []
      return {
        data: items,
        pagination: {
          total: data.pagination?.total ?? items.length,
          page: data.pagination?.page ?? 1,
          limit: data.pagination?.limit ?? items.length,
          totalPages: data.pagination?.totalPages ?? 1,
        },
      }
    },
  })

  const { data: disposedResp } = useQuery<PaginatedResponse<Asset>>({
    queryKey: ['assets', 'list', { status: 'disposed' }],
    queryFn: async () => {
      const result = await assetApi.list({ status: 'disposed', limit: 10 })
      const data = result.data as { data?: unknown; pagination?: Partial<PaginatedResponse<Asset>['pagination']> }
      const items = Array.isArray(data.data) ? (data.data as Asset[]) : []
      return {
        data: items,
        pagination: {
          total: data.pagination?.total ?? items.length,
          page: data.pagination?.page ?? 1,
          limit: data.pagination?.limit ?? items.length,
          totalPages: data.pagination?.totalPages ?? 1,
        },
      }
    },
  })

  const pendingList: Asset[] = pendingResp?.data ?? []
  const pendingTotal = pendingResp?.pagination?.total ?? pendingList.length
  const disposedTotal = disposedResp?.pagination?.total ?? 0

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Pending Approvals"
        subtitle="Assets and transactions requiring finance review"
        breadcrumb={[
          { label: 'Reports', href: '/reports' },
          { label: 'Pending Approvals' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Pending Recognition"
          value={pendingTotal}
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatCard
          label="Disposed Assets"
          value={disposedTotal}
          icon={XCircle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
        <StatCard
          label="Needs Review"
          value={pendingTotal}
          icon={AlertCircle}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">
            Recognition Queue
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Assets awaiting accounting treatment decision
          </p>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : pendingList.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600 mb-1">
              All caught up
            </p>
            <p className="text-sm text-slate-400">
              No assets pending recognition review
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {[
                    'Asset',
                    'Tag',
                    'Purchase Cost',
                    'Date Added',
                    'Treatment',
                    'Action',
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingList.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">
                        {asset.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {asset.category ?? 'Uncategorized'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                      {asset.assetTag}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {formatCurrency(asset.purchaseCost)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(asset.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <TreatmentBadge treatment={asset.accountingTreatment} />
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/assets/${asset.id}?tab=financial`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
                      >
                        Review{' '}
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
