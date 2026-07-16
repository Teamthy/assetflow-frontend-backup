'use client'

import Link from 'next/link'
import {
  BarChart3, TrendingDown, Wrench, ShieldCheck, Package,
  ArrowRight, Download, FileSpreadsheet,
} from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { assetApi } from '@/lib/api/assets'
import { usePermission } from '@/lib/utils/permissions'
import { cn } from '@/lib/utils'

interface ReportCard {
  title: string
  description: string
  href: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  permission?: 'reports.finance' | 'reports.audit' | 'assets.export'
}

const reportCards: ReportCard[] = [
  {
    title: 'Asset register',
    description: 'Complete list of all assets with financial data',
    href: '/reports/assets',
    icon: Package,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    permission: 'assets.export',
  },
  {
    title: 'Audit dashboard',
    description: 'Data completeness, missing fields, lifecycle summary',
    href: '/reports/audit',
    icon: ShieldCheck,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    permission: 'reports.audit',
  },
  {
    title: 'Finance dashboard',
    description: 'Capitalized value, depreciation, disposal proceeds',
    href: '/reports/finance',
    icon: TrendingDown,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    permission: 'reports.finance',
  },
  {
    title: 'Maintenance report',
    description: 'Open, overdue, completed tasks by branch and assignee',
    href: '/reports/maintenance',
    icon: Wrench,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
]

export default function ReportsHubPage() {
  const { can } = usePermission()

  const visibleCards = reportCards.filter((card) => !card.permission || can(card.permission))

  async function downloadAuditPack() {
    try {
      const blob = await assetApi.export({})
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'audit-pack-' + new Date().toISOString().split('T')[0] + '.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Audit pack downloaded')
    } catch {
      toast.error('Export failed. Please try again.')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Reports"
        description="Insights, exports, and audit-ready data for your organization"
        actions={
          can('assets.export') ? (
            <Button
              onClick={downloadAuditPack}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4" />
              Download audit pack
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {visibleCards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:border-slate-300 hover:shadow-md transition-all duration-150"
            >
              <div className="flex items-start justify-between">
                <div className={cn('w-11 h-11 rounded-lg flex items-center justify-center', card.iconBg)}>
                  <Icon className={cn('w-5 h-5', card.iconColor)} />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mt-4">{card.title}</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{card.description}</p>
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
              Use the asset list filters and click Export to download filtered results. All exports respect current filters.
            </p>
          </div>
          <Link href="/assets">
            <Button variant="outline" size="sm">
              Go to assets
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
