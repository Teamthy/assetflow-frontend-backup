'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3, Package, Wrench, ShieldCheck, FileText, ClipboardCheck,
  AlertTriangle, Clock3, ArrowRight, Plus, Upload, Download,
} from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { reportsApi } from '@/lib/api/reports'
import { approvalsApi } from '@/lib/api/approvals'
import { useAuthStore } from '@/lib/stores/auth'
import { roleLabel } from '@/lib/utils/roles'
import { formatCurrency } from '@/lib/utils/format'
import { assetApi } from '@/lib/api/assets'
import { toast } from 'sonner'
import { downloadBlob } from '@/lib/utils/download'

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
  const audit = useQuery({ queryKey: ['reports', 'audit'], queryFn: reportsApi.audit })
  const approvals = useQuery({ queryKey: ['approvals', 'pending'], queryFn: approvalsApi.listPending })

  const summary = (assets.data?.summary ?? {}) as Record<string, unknown>
  const maintenanceSummary = (maintenance.data?.summary ?? {}) as Record<string, unknown>
  const financeDep = ((finance.data?.depreciation ?? {}) as Record<string, unknown>)
  const auditSummary = ((audit.data?.summary ?? audit.data ?? {}) as Record<string, unknown>)
  const pendingApprovals = (approvals.data ?? []).filter((item) => item.status === 'pending')
  const missingFields =
    asNumber(auditSummary.missingSerialNumber ?? auditSummary.missingSerialNumberCount) +
    asNumber(auditSummary.missingPurchaseDate ?? auditSummary.missingPurchaseDateCount) +
    asNumber(auditSummary.missingCategory ?? auditSummary.missingCategoryCount)

  const alerts = [
    pendingApprovals.length > 0
      ? { href: '/approvals', label: `${pendingApprovals.length} approval${pendingApprovals.length === 1 ? '' : 's'} waiting` }
      : null,
    asNumber(maintenanceSummary.overdue) > 0
      ? { href: '/maintenance', label: `${asNumber(maintenanceSummary.overdue)} overdue maintenance task${asNumber(maintenanceSummary.overdue) === 1 ? '' : 's'}` }
      : null,
    missingFields > 0
      ? { href: '/reports/audit', label: `${missingFields} data-quality gaps in the register` }
      : null,
  ].filter(Boolean) as Array<{ href: string; label: string }>

  async function exportRegister() {
    try {
      const blob = await assetApi.export({})
      downloadBlob(blob, `asset-register-${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success('Register exported')
    } catch {
      toast.error('Export failed')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${organization?.name ?? 'Workspace'} dashboard`}
        description={`Signed in as ${user?.firstName ?? 'there'} · ${roleLabel(role)} · ${new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}`}
      />

      {alerts.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
            <AlertTriangle className="h-4 w-4" />
            Exceptions requiring attention
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.map((alert) => (
              <Link
                key={alert.href}
                href={alert.href}
                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
              >
                {alert.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total assets" value={asNumber(summary.total)} icon={Package} iconColor="text-blue-600" iconBg="bg-blue-50" href="/assets" />
        <StatCard title="Active value" value={formatCurrency(asNumber(summary.totalActiveValue ?? financeDep.totalAccumulatedDepreciation))} icon={BarChart3} iconColor="text-purple-600" iconBg="bg-purple-50" href="/reports/finance" />
        <StatCard title="Open maintenance" value={asNumber(maintenanceSummary.open)} icon={Wrench} iconColor="text-amber-600" iconBg="bg-amber-50" href="/maintenance" />
        <StatCard title="Pending approvals" value={pendingApprovals.length} icon={ShieldCheck} iconColor="text-emerald-600" iconBg="bg-emerald-50" href="/approvals" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900">Operating snapshot</h3>
          <p className="mt-1 text-sm text-slate-500">IAS 16-style register health for today’s session.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'In maintenance', value: asNumber(summary.maintenance), href: '/assets?status=maintenance' },
              { label: 'Overdue tasks', value: asNumber(maintenanceSummary.overdue), href: '/maintenance' },
              { label: 'Disposed', value: asNumber(summary.disposed ?? auditSummary.disposedCount), href: '/assets?status=disposed' },
              { label: 'Data gaps', value: missingFields, href: '/reports/audit' },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 hover:border-blue-200">
                <div className="text-xl font-bold text-slate-900">{item.value}</div>
                <div className="text-xs text-slate-500">{item.label}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Quick actions</h3>
          <div className="mt-3 space-y-2">
            {[
              { href: '/assets/new', label: 'Register an asset', icon: Plus },
              { href: '/assets/import', label: 'Import Excel register', icon: Upload },
              { href: '/audit', label: 'Start a physical count', icon: ClipboardCheck },
              { href: '/documents', label: 'Evidence locker', icon: FileText },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <item.icon className="h-4 w-4 text-slate-400" />
                <span className="flex-1">{item.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
              </Link>
            ))}
            <button
              type="button"
              onClick={exportRegister}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4 text-slate-400" />
              <span className="flex-1">Download audit pack</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { href: '/assets', title: 'Fixed asset register', body: 'Add, transfer, dispose, and export.' },
          { href: '/approvals', title: 'Segregation of duties', body: 'Review high-value disposal requests.' },
          { href: '/reports', title: 'Management reports', body: 'Finance, maintenance, and completeness.' },
          { href: '/audit', title: 'Physical verification', body: 'Campaigns for stock-take walkthroughs.' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-blue-200">
            <h3 className="font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{item.body}</p>
          </Link>
        ))}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <Clock3 className="h-3.5 w-3.5" />
        Figures refresh on a 2-minute cache. Suitable for ~100 daily users on the Vercel + API split.
      </p>
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
