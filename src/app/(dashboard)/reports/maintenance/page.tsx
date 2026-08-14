'use client'

import Link from 'next/link'
import { ArrowLeft, Wrench, AlertCircle, CheckCircle2, Clock, Download } from 'lucide-react'
import { toast } from 'sonner'
import { parseISO, isPast, isValid } from 'date-fns'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { StatCardSkeleton } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { PriorityBadge } from '@/components/shared/StatusBadge'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { useMaintenanceTasks } from '@/lib/hooks/useMaintenance'
import { useMaintenanceReport, useReportsSnapshot } from '@/lib/hooks/useReports'
import { formatTimeAgo, formatNumber } from '@/lib/utils/format'
import { downloadTextFile, toCsv } from '@/lib/utils/download'
import { asNumber } from '@/lib/reports/helpers'
import { cn } from '@/lib/utils'
import type { MaintenanceTask } from '@/types'

function dueOf(task: MaintenanceTask): string | undefined {
  return task.dueDate ?? (task as { dueAt?: string }).dueAt
}

function isOverdue(task: MaintenanceTask): boolean {
  const due = dueOf(task)
  if (!due) return false
  if (task.status === 'completed' || task.status === 'cancelled') return false
  try {
    const parsed = parseISO(due)
    return isValid(parsed) && isPast(parsed)
  } catch {
    return false
  }
}

export default function MaintenanceReportPage() {
  const { data, isLoading } = useMaintenanceTasks({ limit: 200 })
  const apiReport = useMaintenanceReport()
  const snap = useReportsSnapshot()
  const tasks = data?.data ?? data?.items ?? []

  const assigneeCount: Record<string, { name: string; count: number; overdue: number }> = {}
  tasks.forEach((task) => {
    const name = task.assignedUser?.fullName ?? 'Unassigned'
    const key = task.assignedUser?.id ?? 'unassigned'
    if (!assigneeCount[key]) assigneeCount[key] = { name, count: 0, overdue: 0 }
    assigneeCount[key].count += 1
    if (isOverdue(task)) assigneeCount[key].overdue += 1
  })
  const topAssignees = Object.values(assigneeCount).sort((a, b) => b.count - a.count).slice(0, 8)
  const overdueTasks = tasks.filter(isOverdue).slice(0, 12)

  const priorityFromApi = snap.maintenance.byPriority
  const priorityCount: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 }
  if (priorityFromApi.length > 0) {
    priorityFromApi.forEach((row) => {
      priorityCount[String(row.priority)] = asNumber(row.count)
    })
  } else {
    tasks.forEach((task) => {
      priorityCount[task.priority] = (priorityCount[task.priority] ?? 0) + 1
    })
  }

  function handleExport() {
    downloadTextFile(
      toCsv(tasks.map((task) => ({
        Title: task.title,
        Asset: task.asset?.name ?? '',
        Status: task.status,
        Priority: task.priority,
        Assignee: task.assignedUser?.fullName ?? '',
        Due: dueOf(task) ?? '',
      }))),
      `maintenance-${new Date().toISOString().slice(0, 10)}.csv`,
    )
    toast.success('Maintenance report exported')
  }

  const empty = !isLoading && !apiReport.isLoading && snap.maintenance.total === 0 && tasks.length === 0

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/reports" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 mb-4 print:hidden">
        <ArrowLeft className="w-4 h-4" />
        Back to reports
      </Link>

      <PageHeader
        title="Maintenance report"
        description="Open, overdue, and completed work from the live API"
        actions={
          <Button onClick={handleExport} variant="outline" className="print:hidden">
            <Download className="w-4 h-4" />
            Export
          </Button>
        }
      />

      {isLoading && apiReport.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
        </div>
      ) : empty ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon={Wrench}
            title="No maintenance data yet"
            description="Create tasks to see this report."
            action={<Link href="/maintenance"><Button className="bg-blue-600 text-white">Go to maintenance</Button></Link>}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard title="Total tasks" value={snap.maintenance.total || tasks.length} icon={Wrench} iconColor="text-slate-600" iconBg="bg-slate-100" href="/maintenance" />
            <StatCard title="Open" value={snap.maintenance.open} icon={Clock} iconColor="text-blue-600" iconBg="bg-blue-50" href="/maintenance" />
            <StatCard title="Overdue" value={snap.maintenance.overdue} icon={AlertCircle} iconColor={snap.maintenance.overdue > 0 ? 'text-red-600' : 'text-emerald-600'} iconBg={snap.maintenance.overdue > 0 ? 'bg-red-50' : 'bg-emerald-50'} />
            <StatCard title="Completed" value={snap.maintenance.completed} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-900">Priority</h3>
                <p className="text-sm text-slate-500 mt-0.5">Open tasks from the report API</p>
              </div>
              <div className="p-6 space-y-3">
                {Object.entries(priorityCount).map(([key, count]) => {
                  const base = Object.values(priorityCount).reduce((sum, value) => sum + value, 0)
                  const pct = base > 0 ? Math.round((count / base) * 100) : 0
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <PriorityBadge priority={key as 'low' | 'medium' | 'high' | 'critical'} />
                        <span className="text-sm font-semibold text-slate-900">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn('h-full', key === 'critical' ? 'bg-red-500' : key === 'high' ? 'bg-orange-500' : key === 'medium' ? 'bg-blue-500' : 'bg-slate-400')} style={{ width: `${Math.max(pct, 2)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-900">Assignee workload</h3>
                <p className="text-sm text-slate-500 mt-0.5">From current task list</p>
              </div>
              <div className="p-6">
                {topAssignees.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No assignee data</p>
                ) : (
                  <div className="space-y-3">
                    {topAssignees.map((row) => (
                      <div key={row.name} className="flex items-center gap-3">
                        <UserAvatar name={row.name} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">{row.name}</div>
                          <div className="text-xs text-slate-500">{formatNumber(row.count)} tasks</div>
                        </div>
                        {row.overdue > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold">
                            {row.overdue} overdue
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {overdueTasks.length > 0 && (
            <div className="mt-6 bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-red-100 bg-red-50/40">
                <h3 className="text-base font-semibold text-red-900">Overdue tasks</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {overdueTasks.map((task) => (
                  <Link key={task.id} href={'/maintenance/' + task.id} className="flex items-start gap-3 px-6 py-3 hover:bg-slate-50">
                    <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{task.title}</div>
                      <div className="text-xs text-slate-500">{task.asset?.name}</div>
                    </div>
                    <span className="text-xs text-red-600 font-medium">Overdue {formatTimeAgo(dueOf(task))}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
