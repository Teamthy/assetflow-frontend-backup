import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { formatNumber } from '@/lib/utils/format'

export interface StatCardProps {
  label?: string
  title?: string        // alias
  value: number | string
  icon: LucideIcon
  iconColor: string
  iconBg: string
  trend?: { value: string; positive?: boolean; direction?: string }
  href?: string
}

export function StatCard({ label, title, value, icon: Icon, iconColor, iconBg, trend, href }: StatCardProps) {
  const displayLabel = label ?? title ?? ''
  const content = (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-500">{displayLabel}</span>
        <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-900 tracking-tight">
        {typeof value === 'number' ? formatNumber(value) : value}
      </div>
      {trend && (
        <div className="flex items-center gap-1.5 mt-2">
          <span className={`text-sm font-medium ${(trend.positive !== false) ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend.value}
          </span>
        </div>
      )}
    </div>
  )
  if (href) return <Link href={href}>{content}</Link>
  return content
}
