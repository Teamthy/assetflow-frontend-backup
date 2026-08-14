'use client'

import { useQuery } from '@tanstack/react-query'
import {
  DollarSign, TrendingDown, Calculator, AlertCircle,
  ArrowUpRight, FileText, CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { StatCard } from '@/components/shared/StatCard'
import { assetApi } from '@/lib/api/assets'
import { formatCurrency } from '@/lib/utils/format'
import { TreatmentBadge } from '@/components/shared/TreatmentBadge'

export function FinanceDashboard() {
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

  const { data: pendingReview } = useQuery({
    queryKey: ['assets', 'list', { accountingTreatment: 'pending_review', limit: 10 }],
    queryFn: () => assetApi.list({ accountingTreatment: 'pending_review', limit: 10 }),
  })

  const { data: capitalizedAssets } = useQuery({
    queryKey: ['assets', 'list', { accountingTreatment: 'capitalized', limit: 10 }],
    queryFn: () => assetApi.list({ accountingTreatment: 'capitalized', limit: 10 }),
  })

  const summary = (auditData && typeof auditData === 'object' && 'summary' in auditData && auditData.summary && typeof auditData.summary === 'object'
    ? (auditData.summary as Record<string, unknown>)
    : {}) as Record<string, unknown>
  const rec = (summary.recognitionSummary && typeof summary.recognitionSummary === 'object'
    ? (summary.recognitionSummary as Record<string, unknown>)
    : {}) as Record<string, unknown>

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Finance Dashboard</h1>
        <p className="text-slate-500 mt-1">Capital asset register, recognition, and depreciation overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Capitalized Assets" value={Number(rec.capitalized ?? 0)} icon={DollarSign} iconColor="text-purple-600" iconBg="bg-purple-50" />
        <StatCard label="Pending Review" value={Number(rec.pending_review ?? 0)} icon={AlertCircle} iconColor="text-amber-600" iconBg="bg-amber-50" href="/assets?accountingTreatment=pending_review" />
        <StatCard label="Expensed" value={Number(rec.expensed ?? 0)} icon={TrendingDown} iconColor="text-red-600" iconBg="bg-red-50" />
        <StatCard label="Tracked (Non-Cap)" value={Number(rec.tracked_non_capitalized ?? 0)} icon={Calculator} iconColor="text-blue-600" iconBg="bg-blue-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Pending Review Queue</h3>
              <p className="text-sm text-slate-500 mt-0.5">Assets requiring accounting decision</p>
            </div>
            <Link href="/assets?accountingTreatment=pending_review" className="text-sm font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {(pendingReview?.data ?? pendingReview?.items ?? []).slice(0, 6).map((asset) => (
              <Link key={asset.id} href={`/assets/${asset.id}?tab=financial`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/70 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{asset.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{asset.assetTag}</p>
                </div>
                {asset.purchaseCost != null && (
                  <span className="text-sm font-semibold text-slate-900 ml-3 flex-shrink-0">{formatCurrency(asset.purchaseCost)}</span>
                )}
              </Link>
            ))}
            {!(pendingReview?.data ?? pendingReview?.items ?? []).length && (
              <div className="px-6 py-10 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No pending reviews</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Capitalized Assets</h3>
              <p className="text-sm text-slate-500 mt-0.5">Fixed assets on the balance sheet</p>
            </div>
            <Link href="/assets?accountingTreatment=capitalized" className="text-sm font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {(capitalizedAssets?.data ?? capitalizedAssets?.items ?? []).slice(0, 6).map((asset) => (
              <Link key={asset.id} href={`/assets/${asset.id}?tab=financial`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/70 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{asset.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{asset.category ?? 'Uncategorized'}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  {asset.purchaseCost != null && (
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(asset.purchaseCost)}</span>
                  )}
                  <TreatmentBadge treatment={asset.accountingTreatment} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Finance Report', desc: 'Capital asset register and depreciation', href: '/reports/finance', icon: FileText },
          { label: 'Audit Dashboard', desc: 'Data completeness and exceptions', href: '/reports/audit', icon: CheckCircle2 },
          { label: 'All Assets', desc: 'Full asset register with financials', href: '/assets', icon: Calculator },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-brand-200 hover:shadow-md transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                <item.icon className="w-4 h-4 text-brand-600" />
              </div>
              <span className="text-sm font-semibold text-slate-900">{item.label}</span>
            </div>
            <p className="text-sm text-slate-500">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
