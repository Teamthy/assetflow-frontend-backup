import type { AssetStatus, AssetCondition, AccountingTreatment, MaintenanceStatus, MaintenancePriority } from '@/types'

// ── Asset Status ───────────────────────────────────────────────
const statusConfig: Record<AssetStatus, { label: string; className: string }> = {
  active:      { label: 'Active',      className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  maintenance: { label: 'Maintenance', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  disposed:    { label: 'Disposed',    className: 'bg-red-50 text-red-700 border-red-200' },
}

export function StatusBadge({ status }: { status: AssetStatus }) {
  const { label, className } = statusConfig[status] ?? statusConfig.active
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  )
}

// ── Condition Badge ────────────────────────────────────────────
const conditionConfig: Record<AssetCondition, { label: string; className: string }> = {
  excellent: { label: 'Excellent', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  good:      { label: 'Good',      className: 'bg-blue-50 text-blue-700 border-blue-200' },
  fair:      { label: 'Fair',      className: 'bg-amber-50 text-amber-700 border-amber-200' },
  poor:      { label: 'Poor',      className: 'bg-red-50 text-red-700 border-red-200' },
}

export function ConditionBadge({ condition }: { condition: AssetCondition }) {
  const { label, className } = conditionConfig[condition] ?? conditionConfig.good
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${className}`}>
      {label}
    </span>
  )
}

// ── Accounting Treatment Badge ─────────────────────────────────
const treatmentConfig: Record<AccountingTreatment, { label: string; className: string }> = {
  capitalized:             { label: 'Capitalized',    className: 'bg-purple-50 text-purple-700 border-purple-200' },
  expensed:                { label: 'Expensed',       className: 'bg-slate-50 text-slate-600 border-slate-200' },
  tracked_non_capitalized: { label: 'Tracked',        className: 'bg-blue-50 text-blue-700 border-blue-200' },
  pending_review:          { label: 'Pending Review', className: 'bg-amber-50 text-amber-700 border-amber-200' },
}

export function TreatmentBadge({ treatment }: { treatment: AccountingTreatment }) {
  const { label, className } = treatmentConfig[treatment] ?? treatmentConfig.pending_review
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${className}`}>
      {label}
    </span>
  )
}

// ── Maintenance Status Badge ───────────────────────────────────
const maintStatusConfig: Record<MaintenanceStatus, { label: string; className: string }> = {
  open:        { label: 'Open',        className: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress: { label: 'In Progress', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  completed:   { label: 'Completed',   className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled:   { label: 'Cancelled',   className: 'bg-slate-50 text-slate-500 border-slate-200' },
}

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  const { label, className } = maintStatusConfig[status] ?? maintStatusConfig.open
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  )
}

// ── Priority Badge ─────────────────────────────────────────────
const priorityConfig: Record<MaintenancePriority, { label: string; className: string }> = {
  low:      { label: 'Low',      className: 'bg-slate-50 text-slate-600 border-slate-200' },
  medium:   { label: 'Medium',   className: 'bg-blue-50 text-blue-700 border-blue-200' },
  high:     { label: 'High',     className: 'bg-orange-50 text-orange-700 border-orange-200' },
  critical: { label: 'Critical', className: 'bg-red-50 text-red-700 border-red-200' },
}

export function PriorityBadge({ priority }: { priority: MaintenancePriority }) {
  const { label, className } = priorityConfig[priority] ?? priorityConfig.medium
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${className}`}>
      {label}
    </span>
  )
}
