'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, Wrench, Play, CheckCircle2, XCircle, Package,
  Calendar, User, Clock, AlertCircle, MoreHorizontal, Loader2,
} from 'lucide-react'

import { PageHeader } from '@/components/shared/PageHeader'
import { MaintenanceStatusBadge, PriorityBadge } from '@/components/shared/StatusBadge'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { DetailSkeleton } from '@/components/shared/LoadingSkeleton'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { RoleGuard } from '@/components/shared/RoleGuard'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { useMaintenanceTask, useStartMaintenance, useCancelMaintenance } from '@/lib/hooks/useMaintenance'
import { CompleteMaintenanceModal } from '@/components/maintenance/CompleteMaintenanceModal'
import { formatDate, formatDateTime, formatTimeAgo } from '@/lib/utils/format'
import { parseISO, isPast, isValid } from 'date-fns'
import { cn } from '@/lib/utils'

export default function MaintenanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const actionParam = searchParams.get('action')

  const [completeOpen, setCompleteOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [startOpen, setStartOpen] = useState(false)

  const { data: task, isLoading, error } = useMaintenanceTask(id)
  const startMutation = useStartMaintenance(id)
  const cancelMutation = useCancelMaintenance(id)

  useEffect(() => {
    if (!actionParam) return
    if (actionParam === 'start') { setStartOpen(true); router.replace('/maintenance/' + id) }
    else if (actionParam === 'complete') { setCompleteOpen(true); router.replace('/maintenance/' + id) }
    else if (actionParam === 'cancel') { setCancelOpen(true); router.replace('/maintenance/' + id) }
  }, [actionParam, id, router])

  if (isLoading) return <DetailSkeleton />

  if (error || !task) {
    return (
      <div className="max-w-5xl mx-auto">
        <Link href="/maintenance" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to maintenance
        </Link>
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-900">Task not found</h2>
        </div>
      </div>
    )
  }

  const due = task.dueAt ?? task.dueDate
  const overdue = due && task.status !== 'completed' && task.status !== 'cancelled'
    ? (() => { try { const d = parseISO(due); return isValid(d) && isPast(d) } catch { return false } })()
    : false

  const isOpen = task.status === 'open'
  const isInProgress = task.status === 'in_progress'
  const isFinal = task.status === 'completed' || task.status === 'cancelled'

  async function handleStart() {
    await startMutation.mutateAsync()
    setStartOpen(false)
  }

  async function handleCancel() {
    await cancelMutation.mutateAsync()
    setCancelOpen(false)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/maintenance" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to maintenance
      </Link>

      {overdue && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">Task is overdue</p>
            <p className="text-sm text-red-800 mt-0.5">
              This task was due {formatTimeAgo(due ?? '')}. Complete it or reschedule as needed.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wrench className="w-7 h-7 text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{task.title}</h1>
                <MaintenanceStatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>
              {task.description && (
                <p className="text-sm text-slate-600 leading-relaxed max-w-3xl mt-2">{task.description}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            {isOpen && (
              <RoleGuard permission="maintenance.complete">
                <Button
                  onClick={() => setStartOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Play className="w-4 h-4" />
                  Start task
                </Button>
              </RoleGuard>
            )}
            {isInProgress && (
              <RoleGuard permission="maintenance.complete">
                <Button
                  onClick={() => setCompleteOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Complete
                </Button>
              </RoleGuard>
            )}
            {!isFinal && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setCancelOpen(true)}
                    className="text-red-600 focus:text-red-700 focus:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Asset</h3>
            </div>
            <div className="p-6">
              {task.asset ? (
                <Link
                  href={'/assets/' + task.asset.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 truncate">
                      {task.asset.name}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">{task.asset.assetTag}</div>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-slate-400 rotate-180 group-hover:text-blue-600" />
                </Link>
              ) : (
                <div className="text-sm text-slate-400">No asset linked</div>
              )}
            </div>
          </div>

          {task.completionNote && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-900">Completion note</h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-slate-700 leading-relaxed">{task.completionNote}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Details</h3>
            </div>
            <div className="p-6 space-y-4">
              <DetailRow
                icon={Calendar}
                label="Due date"
                value={due ? formatDate(due ?? '') : 'No due date'}
                accent={overdue ? 'text-red-600 font-semibold' : undefined}
              />
              <DetailRow
                icon={User}
                label="Assignee"
                value={task.assignedUser?.fullName ?? 'Unassigned'}
                avatar={task.assignedUser?.fullName}
              />
              {task.startedAt && (
                <DetailRow icon={Play} label="Started" value={formatDateTime(task.startedAt)} />
              )}
              {task.completedAt && (
                <DetailRow icon={CheckCircle2} label="Completed" value={formatDateTime(task.completedAt)} accent="text-emerald-600" />
              )}
              <DetailRow icon={Clock} label="Created" value={formatDateTime(task.createdAt)} />
              {task.createdBy && (
                <DetailRow icon={User} label="Created by" value={task.createdBy.fullName ?? 'Unknown'} avatar={task.createdBy.fullName} />
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={startOpen}
        onOpenChange={setStartOpen}
        title="Start task?"
        description={task.asset ? 'This will change the asset ' + task.asset.name + ' status to maintenance.' : 'This will start the task.'}
        confirmLabel="Start task"
        variant="default"
        isLoading={startMutation.isPending}
        onConfirm={handleStart}
      />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this task?"
        description="This will mark the task as cancelled. This cannot be undone."
        confirmLabel="Cancel task"
        variant="destructive"
        isLoading={cancelMutation.isPending}
        onConfirm={handleCancel}
      />

      <CompleteMaintenanceModal task={task} open={completeOpen} onOpenChange={setCompleteOpen} />
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
  avatar,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string
  avatar?: string
  accent?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500 mb-0.5">{label}</div>
        <div className="flex items-center gap-2">
          {avatar && <UserAvatar name={avatar} size="sm" />}
          <span className={cn('text-sm text-slate-900', accent)}>{value}</span>
        </div>
      </div>
    </div>
  )
}
