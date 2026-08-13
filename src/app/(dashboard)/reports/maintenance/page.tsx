'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import {
  ArrowLeft, Wrench, AlertCircle, CheckCircle2, Clock,
  Download, TrendingUp,
} from 'lucide-react'
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
import { formatTimeAgo } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { MaintenanceTask } from '@/types'

function isOverdue(task: MaintenanceTask): boolean {
  const due = task.dueDate ?? task.dueDate
  if (!due) return false
  if (task.status === 'completed' || task.status === 'cancelled') return false
  try {
    const d = parseISO(due)
    return isValid(d) && isPast(d)
  } catch {
    return false
  }
}

export default function MaintenanceReportPage() {
  const { data, isLoading } = useMaintenanceTasks({ limit: 1000 })

  const stats = useMemo(() => {
    const tasks = data?.items ?? []

    const open = tasks.filter((t) => t.status === 'open').length
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length
    const completed = tasks.filter((t) => t.status === 'completed').length
    const cancelled = tasks.filter((t) => t.status === 'cancelled').length
    const overdue = tasks.filter(isOverdue).length

    // Priority breakdown
    const priorityCount: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 }
    tasks.forEach((t) => {
      priorityCount[t.priority] = (priorityCount[t.priority] ?? 0) + 1
    })

    // Assignee workload
    const assigneeCount: Record<string, { name: string; count: number; overdue: number }> = {}
    tasks.forEach((t) => {
      const name = t.assignedUser?.fullName ?? 'Unassigned'
      const key = t.assignedUser?.id ?? 'unassigned'
      if (!assigneeCount[key]) assigneeCount[key] = { name, count: 0, overdue: 0 }
      assigneeCount[key].count += 1
      if (isOverdue(t)) assigneeCount[key].overdue += 1
    })

    const topAssignees = Object.values(assigneeCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    const overdueTasks = tasks.filter(isOverdue).slice(0, 10)

    return {
      total: tasks.length,
      open,
      inProgress,
      completed,
      cancelled,
      overdue,
      priorityCount,
      topAssignees,
      overdueTasks,
      completionRate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
    }
  }, [data])

  function handleExport() {
    const tasks = data?.items ?? []
    const header = ['Title', 'Asset', 'Status', 'Priority', 'Assignee', 'Due']
    const rows = tasks.map((task) => [
      task.title,
      task.asset?.name ?? '',
      task.status,
      task.priority,
      task.assignedUser?.fullName ?? '',
      task.dueDate ?? task.dueAt ?? '',
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `maintenance-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Maintenance report exported')
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/reports" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to reports
      </Link>

      <PageHeader
        title="Maintenance report"
        description="Task status, overdue items, and assignee workload"
        actions={
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4" />
            Export
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : stats.total === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon={Wrench}
            title="No maintenance data yet"
            description="Create maintenance tasks to see reports here."
            action={
              <Link href="/maintenance">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Go to maintenance
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total tasks"
              value={stats.total}
              icon={Wrench}
              iconColor="text-slate-600"
              iconBg="bg-slate-100"
            />
            <StatCard
              title="Open"
              value={stats.open + stats.inProgress}
              icon={Clock}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
            />
            <StatCard
              title="Overdue"
              value={stats.overdue}
              icon={AlertCircle}
              iconColor={stats.overdue > 0 ? 'text-red-600' : 'text-emerald-600'}
              iconBg={stats.overdue > 0 ? 'bg-red-50' : 'bg-emerald-50'}
            />
            <StatCard
              title="Completion rate"
              value={stats.completionRate + '%'}
              icon={CheckCircle2}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Priority breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-900">Task priority</h3>
                <p className="text-sm text-slate-500 mt-0.5">Distribution across all tasks</p>
              </div>
              <div className="p-6 space-y-3">
                {Object.entries(stats.priorityCount).map(([key, count]) => {
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                  const colorMap: Record<string, { bar: string }> = {
                    low: { bar: 'bg-slate-400' },
                    medium: { bar: 'bg-blue-500' },
                    high: { bar: 'bg-orange-500' },
                    critical: { bar: 'bg-red-500' },
                  }
                  const colors = colorMap[key]
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={key as 'low' | 'medium' | 'high' | 'critical'} />
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full transition-all', colors.bar)}
                          style={{ width: (pct || 2) + '%' }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Assignee workload */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-900">Assignee workload</h3>
                <p className="text-sm text-slate-500 mt-0.5">Top assignees by task count</p>
              </div>
              <div className="p-6">
                {stats.topAssignees.length === 0 ? (
                  <div className="text-sm text-slate-400 text-center py-4">No assignee data</div>
                ) : (
                  <div className="space-y-3">
                    {stats.topAssignees.map((a) => (
                      <div key={a.name} className="flex items-center gap-3">
                        <UserAvatar name={a.name} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">{a.name}</div>
                          <div className="text-xs text-slate-500">{a.count} task{a.count === 1 ? '' : 's'}</div>
                        </div>
                        {a.overdue > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold">
                            {a.overdue} overdue
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Overdue tasks */}
          {stats.overdueTasks.length > 0 && (
            <div className="mt-6 bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-red-100 bg-red-50/40 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-red-900">Overdue tasks</h3>
                  <p className="text-sm text-red-700 mt-0.5">{stats.overdueTasks.length} tasks past due date</p>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {stats.overdueTasks.map((task) => {
                  const due = task.dueDate ?? task.dueDate
                  return (
                    <Link
                      key={task.id}
                      href={'/maintenance/' + task.id}
                      className="flex items-start gap-3 px-6 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Wrench className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{task.title}</div>
                        <div className="text-xs text-slate-500">{task.asset?.name}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <PriorityBadge priority={task.priority} />
                        <span className="text-xs text-red-600 font-medium">
                          Overdue {formatTimeAgo(due)}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

