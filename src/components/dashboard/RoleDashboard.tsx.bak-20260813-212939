'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Package, Wrench, ShieldCheck } from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { reportsApi } from '@/lib/api/reports'
import { useAuthStore } from '@/lib/stores/auth'
import { roleLabel } from '@/lib/utils/roles'
import { formatCurrency } from '@/lib/utils/format'

function asNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value) || 0
  return 0
}

export function RoleDashboard() {
  const role = useAuthStore((s) => s.role)
  const organization = useAuthStore((s) => s.organization)
  const user = useAuthStore((s) => s.user)

  const assets = useQuery({ queryKey: ['reports', 'assets'], queryFn: reportsApi.assets })
  const maintenance = useQuery({ queryKey: ['reports', 'maintenance'], queryFn: reportsApi.maintenance })
  const finance = useQuery({
    queryKey: ['reports', 'finance'],
    queryFn: reportsApi.finance,
    enabled: role === 'admin' || role === 'finance' || role === 'auditor' || role === 'asset_manager',
  })

  const summary = (assets.data?.summary ?? {}) as Record<string, unknown>
  const maintenanceSummary = (maintenance.data?.summary ?? {}) as Record<string, unknown>
  const financeDep = ((finance.data?.depreciation ?? {}) as Record<string, unknown>)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${organization?.name ?? 'Workspace'} dashboard`}
        description={`Signed in as ${user?.firstName ?? 'there'} · ${roleLabel(role)}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total assets" value={asNumber(summary.total)} icon={Package} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="In maintenance" value={asNumber(summary.maintenance)} icon={Wrench} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Open tasks" value={asNumber(maintenanceSummary.open)} icon={ShieldCheck} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard
          title="Active value"
          value={formatCurrency(asNumber(summary.totalActiveValue ?? financeDep.totalAccumulatedDepreciation))}
          icon={BarChart3}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: '/assets', title: 'Assets', body: 'Review the register, import, transfer, or dispose.' },
          { href: '/maintenance', title: 'Maintenance', body: 'Track open work and overdue tasks.' },
          { href: '/reports', title: 'Reports', body: 'Finance, audit, and operational summaries.' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-200 transition-colors">
            <h3 className="font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{item.body}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export const AdminDashboard = RoleDashboard
export const AssetManagerDashboard = RoleDashboard
export const FinanceDashboard = RoleDashboard
export const BranchManagerDashboard = RoleDashboard
export const MaintenanceDashboard = RoleDashboard
export const AuditorDashboard = RoleDashboard
export const StandardStaffDashboard = RoleDashboard
