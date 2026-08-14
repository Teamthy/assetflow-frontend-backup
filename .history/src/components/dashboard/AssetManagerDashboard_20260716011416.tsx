'use client'

import { useQuery } from '@tanstack/react-query'
import { Package, ArrowLeftRight, AlertTriangle, Plus, Upload, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { StatCard } from '@/components/shared/StatCard'
import { assetApi } from '@/lib/api/assets'
import { maintenanceApi } from '@/lib/api/maintenance'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils/format'
import { normalizeListResponse } from '@/lib/utils/list'

export function AssetManagerDashboard() {
  const { data: auditData } = useQuery({
    queryKey: ['assets', 'audit'],
    queryFn: async () => {
      const res = await assetApi.audit()
      const payload = res.data as { data?: unknown } | unknown
      if (payload && typeof payload === 'object' && 'data' in payload) {
        return (payload as { data: Record<string, unknown> }).data ?? {}
      }
      return (payload as Record<string, unknown>) ?? {}
    },
  })

  const { data: recentAssets } = useQuery({
    queryKey: ['assets', 'list', 'recent'],
    queryFn: () => assetApi.list({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' }),
  })

  const { data: maintenance } = useQuery({
    queryKey: ['maintenance', 'open'],
    queryFn: () => maintenanceApi.list({ status: 'open', limit: 5 }),
  })

  const summary = (auditData && typeof auditData === 'object' && 'summary' in auditData && auditData.summary && typeof auditData.summary === 'object'
    ? (auditData.summary as Record<string, unknown>)
    : {}) as Record<string, unknown>
  const recentAssetsList = normalizeListResponse<any>(recentAssets)
  const maintenanceList = normalizeListResponse<any>(maintenance)

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Asset Operations</h1>
          <p className="text-slate-500 mt-1">Manage and monitor the full asset register</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/assets/import" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg border border-slate-200 transition-all">
            <Upload className="w-4 h-4" />Import
          </Link>
          <Link href="/assets/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-all">
            <Plus className="w-4 h-4" />Add Asset
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Assets" value={Number(summary.totalAssets ?? 0)} icon={Package} iconColor="text-brand-600" iconBg="bg-brand-50" href="/assets" />
        <StatCard label="In Maintenance" value={Number(summary.maintenanceCount ?? 0)} icon={AlertTriangle} iconColor="text-amber-600" iconBg="bg-amber-50" href="/maintenance" />
        <StatCard label="Data Issues" value={Number(summary.missingSerialNumber ?? 0) + Number(summary.missingCategory ?? 0)} icon={AlertTriangle} iconColor="text-red-600" iconBg="bg-red-50" href="/reports/audit" />
        <StatCard label="Disposed" value={Number(summary.disposedCount ?? 0)} icon={ArrowLeftRight} iconColor="text-slate-500" iconBg="bg-slate-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Recently Added</h3>
            <Link href="/assets" className="text-sm font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentAssetsList.map((asset) => (
              <Link key={asset.id} href={`/assets/${asset.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/70 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{asset.name}</p>
                  <p className="text-xs text-slate-400">{asset.assetTag} · Added {formatDate(asset.createdAt)}</p>
                </div>
                <StatusBadge status={asset.status} />
              </Link>
            ))}
            {!recentAssetsList.length && (
              <div className="px-6 py-10 text-center"><p className="text-sm text-slate-400">No assets yet</p></div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Open Maintenance</h3>
            <Link href="/maintenance" className="text-sm font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {maintenanceList.map((task) => (
              <Link key={task.id} href={`/maintenance/${task.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/70 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                  <p className="text-xs text-slate-400">{task.asset?.name}</p>
                </div>
                {task.dueDate && <span className="text-xs text-slate-400 flex-shrink-0 ml-3">{formatDate(task.dueDate)}</span>}
              </Link>
            ))}
            {!maintenanceList.length && (
              <div className="px-6 py-10 text-center"><p className="text-sm text-slate-400">No open tasks</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
