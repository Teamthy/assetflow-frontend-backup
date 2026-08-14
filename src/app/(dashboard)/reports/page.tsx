'use client'

import Link from 'next/link'
import {
  BarChart3, TrendingDown, Wrench, ShieldCheck, Package,
  ArrowRight, Download, FileSpreadsheet, Printer,
} from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { assetApi } from '@/lib/api/assets'
import { downloadBlob } from '@/lib/utils/download'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import { useReportsSnapshot } from '@/lib/hooks/useReports'
import { periodLabel } from '@/lib/reports/helpers'
import { cn } from '@/lib/utils'

export default function ReportsHubPage() {
  const snap = useReportsSnapshot()

  async function downloadAuditPack() {
    try {
      const blob = await assetApi.export({ limit: 500 })
      downloadBlob(blob, `audit-pack-${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success('Audit pack downloaded')
    } catch {
      toast.error('Export failed. Try again.')
    }
  }

  const cards = [
    {
      title: 'Asset register',
      description: 'Complete list of all assets with financial data',
      href: '/reports/assets',
      icon: Package,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      stat: snap.isLoading ? '…' : `${formatNumber(snap.assets.total)} assets`,
      detail: formatCurrency(snap.assets.totalActiveValue),
    },
    {
      title: 'Audit dashboard',
      description: 'Data completeness, missing fields, lifecycle summary',
      href: '/reports/audit',
      icon: ShieldCheck,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      stat: snap.isLoading ? '…' : `${snap.audit.completenessPercent}% complete`,
      detail: `${snap.audit.missingSerialNumber + snap.audit.missingPurchaseDate + snap.audit.missingCategory} gaps`,
    },
    {
      title: 'Finance dashboard',
      description: 'Capitalized value, depreciation, disposal proceeds',
      href: '/reports/finance',
      icon: TrendingDown,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      stat: snap.isLoading ? '…' : formatCurrency(snap.finance.capitalizedValue),
      detail: `${formatNumber(snap.finance.capitalizedCount)} capitalized`,
    },
    {
      title: 'Maintenance report',
      description: 'Open, overdue, completed tasks by branch and assignee',
      href: '/reports/maintenance',
      icon: Wrench,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      stat: snap.isLoading ? '…' : `${formatNumber(snap.maintenance.open)} open`,
      detail: `${formatNumber(snap.maintenance.overdue)} overdue`,
    },
    {
      title: 'Approvals log',
      description: 'Pending and decided disposal / transfer requests',
      href: '/approvals',
      icon: ShieldCheck,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      stat: snap.isLoading ? '…' : `${formatNumber(snap.approvals.pending)} pending`,
      detail: `${formatNumber(snap.approvals.total)} total`,
    },
    {
      title: 'Physical count',
      description: 'Stock-take campaigns and exception rates',
      href: '/audit',
      icon: BarChart3,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-700',
      stat: snap.isLoading ? '…' : `${formatNumber(snap.campaigns.count)} campaigns`,
      detail: `${snap.campaigns.exceptionRate}% exceptions`,
    },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Reports"
        description={`Period ${periodLabel()} · print or export for the audit file`}
        actions={
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button onClick={downloadAuditPack} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Download className="w-4 h-4" />
              Download audit pack
            </Button>
          </div>
        }
      />

      {snap.isError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Some report totals could not be loaded. Open a report to retry.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:border-slate-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className={cn('w-11 h-11 rounded-lg flex items-center justify-center', card.iconBg)}>
                  <Icon className={cn('w-5 h-5', card.iconColor)} />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mt-4">{card.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{card.description}</p>
              <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-slate-100 pt-3">
                <span className="text-sm font-semibold text-slate-900">{card.stat}</span>
                <span className="text-xs text-slate-500">{card.detail}</span>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900">Need custom exports?</h3>
            <p className="text-sm text-slate-500 mt-1">
              Filter the asset list, then click Export. The file matches the filters on screen.
            </p>
          </div>
          <Link href="/assets" className="print:hidden">
            <Button variant="outline" size="sm">Go to assets</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
