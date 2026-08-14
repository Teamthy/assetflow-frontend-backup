'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Package, Building2, Wrench, TrendingDown,
  AlertTriangle, CheckCircle2, ArrowUpRight,
} from 'lucide-react'
import Link from 'next/link'
import { StatCard } from '@/components/shared/StatCard'
import { assetApi } from '@/lib/api/assets'
import { branchApi } from '@/lib/api/branches'
import { maintenanceApi } from '@/lib/api/maintenance'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { normalizeListResponse } from '@/lib/utils/list'
import { useAuthStore } from '@/lib/stores/auth'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-500', high: 'bg-orange-500',
    medium: 'bg-blue-500', low: 'bg-slate-300',
  }
  return <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[priority] ?? 'bg-slate-300'}`} />
}

function QualityBar({ label, current, total, color }: { label: string; current: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900">{pct}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const org = useAuthStore((s) => s.organization)
  const user = useAuthStore((s) => s.user)

  const { data: auditData, isLoading: auditLoading } = useQuery({
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

  const { data: activeAssets } = useQuery({
    queryKey: ['assets', 'list', { limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }],
    queryFn: () => assetApi.list({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
  })

  const { data: maintenance } = useQuery({
    queryKey: ['maintenance', 'list', { status: 'open', limit: 5 }],
    queryFn: () => maintenanceApi.list({ status: 'open', limit: 5 }),
  })

  const { data: branches } = useQuery({
    queryKey: ['branches', 'list'],
    queryFn: () => branchApi.list(),
  })

  const summary = (auditData && typeof auditData === 'object' && 'summary' in auditData && auditData.summary && typeof auditData.summary === 'object'
    ? (auditData.summary as Record<string, unknown>)
    : {}) as Record<string, unknown>
  const rec = (summary.recognitionSummary && typeof summary.recognitionSummary === 'object'
    ? (summary.recognitionSummary as Record<string, unknown>)
    : {}) as Record<string, unknown>
  const recentAssets = normalizeListResponse<any>(activeAssets)
  const openMaintenance = normalizeListResponse<any>(maintenance)
  const branchesList = normalizeListResponse<any>(branches)

  const missingDataAlerts = [
    { label: 'Missing serial numbers', count: Number(summary.missingSerialNumber ?? 0) },
    { label: 'Missing purchase dates', count: Number(summary.missingPurchaseDate ?? 0) },
    { label: 'Missing categories', count: Number(summary.missingCategory ?? 0) },
  ].filter((a) => a.count > 0)

  const treatmentData = [
    { name: 'Capitalized', value: Number(rec.capitalized ?? 0), color: '#8b5cf6' },
    { name: 'Expensed', value: Number(rec.expensed ?? 0), color: '#64748b' },
    { name: 'Tracked', value: Number(rec.tracked_non_capitalized ?? 0), color: '#3b82f6' },
    { name: 'Pending', value: Number(rec.pending_review ?? 0), color: '#f59e0b' },
  ].filter((d) => d.value > 0)

  if (auditLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-200 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 rounded-xl" />
          <div className="col-span-2 h-64 bg-slate-200 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Good {getGreeting()}, {user?.fullName?.split(' ')[0]}
        </h1>
        <p className="text-slate-500 mt-1">Here's what's happening across {org?.name} today.</p>
      </div>

      {missingDataAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900 mb-1">Asset data quality issues detected</p>
            <p className="text-sm text-amber-700">
              {missingDataAlerts.map((a) => `${a.count} ${a.label}`).join(' · ')}
              {'  '}<Link href="/reports/audit" className="underline font-medium">View audit dashboard</Link>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Assets" value={Number(summary.totalAssets ?? 0)} icon={Package} iconColor="text-brand-600" iconBg="bg-brand-50" href="/assets" />
        <StatCard label="Active Branches" value={branches?.pagination?.total ?? branchesList.length ?? 0} icon={Building2} iconColor="text-emerald-600" iconBg="bg-emerald-50" href="/branches" />
        <StatCard label="Open Maintenance" value={maintenance?.pagination?.total ?? openMaintenance.length ?? 0} icon={Wrench} iconColor="text-amber-600" iconBg="bg-amber-50" href="/maintenance" />
        <StatCard label="Disposed Assets" value={Number(summary.disposedCount ?? 0)} icon={TrendingDown} iconColor="text-red-600" iconBg="bg-red-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-1">Accounting Treatment</h3>
          <p className="text-sm text-slate-500 mb-5">Asset classification breakdown</p>
          {treatmentData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={treatmentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {treatmentData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {treatmentData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center">
              <p className="text-sm text-slate-400">No data available</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Recent Assets</h3>
              <p className="text-sm text-slate-500 mt-0.5">Latest additions to the register</p>
            </div>
            <Link href="/assets" className="text-sm font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentAssets.slice(0, 5).map((asset) => (
              <Link key={asset.id} href={`/assets/${asset.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/70 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{asset.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {asset.assetTag}{asset.branch && ` · ${asset.branch.name}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  {asset.purchaseCost != null && (
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(asset.purchaseCost)}</span>
                  )}
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              </Link>
            ))}
            {!recentAssets.length && (
              <div className="px-6 py-10 text-center"><p className="text-sm text-slate-400">No assets yet</p></div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Open Maintenance</h3>
              <p className="text-sm text-slate-500 mt-0.5">Tasks requiring attention</p>
            </div>
            <Link href="/maintenance" className="text-sm font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {openMaintenance.slice(0, 4).map((task) => (
              <Link key={task.id} href={`/maintenance/${task.id}`} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/70 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <PriorityDot priority={task.priority} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{task.asset?.name}</p>
                  </div>
                </div>
                {task.dueDate && <span className="text-xs text-slate-400 flex-shrink-0 ml-3">Due {formatDate(task.dueDate)}</span>}
              </Link>
            ))}
            {!openMaintenance.length && (
              <div className="px-6 py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No open tasks</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-5">Data Quality</h3>
          <div className="space-y-4">
            <QualityBar label="Assets with serial numbers" current={(summary?.totalAssets ?? 0) - (summary?.missingSerialNumber ?? 0)} total={summary?.totalAssets ?? 0} color="bg-emerald-500" />
            <QualityBar label="Assets with purchase dates" current={(summary?.totalAssets ?? 0) - (summary?.missingPurchaseDate ?? 0)} total={summary?.totalAssets ?? 0} color="bg-brand-500" />
            <QualityBar label="Assets with categories" current={(summary?.totalAssets ?? 0) - (summary?.missingCategory ?? 0)} total={summary?.totalAssets ?? 0} color="bg-purple-500" />
            <QualityBar label="Recognized assets" current={rec?.capitalized ?? 0} total={summary?.totalAssets ?? 0} color="bg-amber-500" />
          </div>
          <div className="mt-6 pt-5 border-t border-slate-100">
            <Link href="/reports/audit" className="text-sm font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
              View full audit report <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
