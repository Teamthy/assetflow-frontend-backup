'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Plus, Wrench, Search, Filter, X, ChevronLeft, ChevronRight,
  MoreHorizontal, Eye, Play, CheckCircle2, XCircle, Calendar,
  AlertCircle,
} from 'lucide-react'

import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/shared/SearchInput'
import { RoleGuard } from '@/components/shared/RoleGuard'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { MaintenanceStatusBadge, PriorityBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useMaintenanceTasks } from '@/lib/hooks/useMaintenance'
import { CreateMaintenanceModal } from '@/components/maintenance/CreateMaintenanceModal'
import { formatDate, formatTimeAgo } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { parseISO, isPast, isValid } from 'date-fns'

export default function MaintenancePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const assetIdFilter = searchParams.get('assetId')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [showFilters, setShowFilters] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const params = useMemo(() => ({
    page,
    limit: pageSize,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    assetId: assetIdFilter ?? undefined,
  }), [page, pageSize, statusFilter, priorityFilter, assetIdFilter])

  const { data, isLoading, isFetching, error } = useMaintenanceTasks(params)

  const tasks = data?.items ?? []
  const total = data?.pagination?.total ?? tasks.length
  const totalPages = data?.pagination?.totalPages ?? 1

  const filtered = tasks.filter((task) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      task.title.toLowerCase().includes(q) ||
      (task.description?.toLowerCase() ?? '').includes(q) ||
      (task.asset?.name?.toLowerCase() ?? '').includes(q)
    )
  })

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || search !== '' || Boolean(assetIdFilter)

  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setPage(1)
    if (assetIdFilter) router.push('/maintenance')
  }

  function isOverdue(task: import('@/types').MaintenanceTask): boolean {
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

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Maintenance"
        description={total > 0 ? total + ' maintenance tasks' : 'Track and manage asset maintenance'}
        actions={
          <RoleGuard permission="maintenance.create">
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4" />
              Create task
            </Button>
          </RoleGuard>
        }
      />

      {assetIdFilter && (
        <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <Filter className="w-4 h-4" />
            Filtering by asset
          </div>
          <button
            onClick={() => router.push('/maintenance')}
            className="text-sm font-medium text-blue-700 hover:text-blue-900"
          >
            Clear
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[240px] max-w-md">
              <SearchInput
                value={search}
                onChange={(v) => { setSearch(v); setPage(1) }}
                placeholder="Search by title or asset..."
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters || hasActiveFilters ? 'border-blue-300 bg-blue-50 text-blue-700' : ''}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                  {[statusFilter !== 'all', priorityFilter !== 'all', Boolean(assetIdFilter)].filter(Boolean).length + (search ? 1 : 0)}
                </span>
              )}
            </Button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}

            <div className="ml-auto text-xs text-slate-500">
              {isFetching && !isLoading && <span>Updating...</span>}
            </div>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">Status</label>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                  <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">Priority</label>
                <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1) }}>
                  <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600">Failed to load maintenance tasks</p>
          </div>
        ) : filtered.length === 0 && !hasActiveFilters ? (
          <EmptyState
            icon={Wrench}
            title="No maintenance tasks yet"
            description="Create your first maintenance task to start tracking asset upkeep. Tasks can be assigned to staff and tracked through their lifecycle."
            action={
              <RoleGuard permission="maintenance.create">
                <Button
                  onClick={() => setCreateOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                  Create first task
                </Button>
              </RoleGuard>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching tasks"
            description="Try adjusting your filters or search query."
            action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Task</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Asset</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Priority</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Due</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Assignee</th>
                    <th className="w-10 px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((task) => {
                    const overdue = isOverdue(task)
                    const due = task.dueDate ?? task.dueDate
                    return (
                      <tr
                        key={task.id}
                        onClick={() => router.push('/maintenance/' + task.id)}
                        className="hover:bg-slate-50/70 transition-colors duration-100 group cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Wrench className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 truncate max-w-xs">{task.title}</div>
                              {task.description && (
                                <div className="text-xs text-slate-500 truncate max-w-xs">{task.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {task.asset ? (
                            <div>
                              <div className="text-sm text-slate-700 truncate max-w-[180px]">{task.asset.name}</div>
                              <div className="text-xs text-slate-400 font-mono">{task.asset.assetTag}</div>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4"><MaintenanceStatusBadge status={task.status} /></td>
                        <td className="px-6 py-4"><PriorityBadge priority={task.priority} /></td>
                        <td className="px-6 py-4">
                          {due ? (
                            <div className={cn('flex items-center gap-1.5 text-sm', overdue ? 'text-red-600' : 'text-slate-700')}>
                              {overdue && <AlertCircle className="w-3.5 h-3.5" />}
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatDate(due)}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">No due date</span>
                          )}
                          {overdue && (
                            <div className="text-xs text-red-500 mt-0.5">Overdue {formatTimeAgo(due)}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {task.assignedUser ? (
                            <div className="flex items-center gap-2">
                              <UserAvatar name={task.assignedUser.fullName} size="sm" />
                              <span className="text-sm text-slate-700 truncate max-w-[120px]">
                                {task.assignedUser.fullName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-200 rounded-md">
                              <MoreHorizontal className="w-4 h-4 text-slate-500" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push('/maintenance/' + task.id)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              {task.status === 'open' && (
                                <DropdownMenuItem onClick={() => router.push('/maintenance/' + task.id + '?action=start')}>
                                  <Play className="w-4 h-4 mr-2" />
                                  Start task
                                </DropdownMenuItem>
                              )}
                              {task.status === 'in_progress' && (
                                <DropdownMenuItem onClick={() => router.push('/maintenance/' + task.id + '?action=complete')}>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Complete
                                </DropdownMenuItem>
                              )}
                              {(task.status === 'open' || task.status === 'in_progress') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                    onClick={() => router.push('/maintenance/' + task.id + '?action=cancel')}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Cancel task
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div className="text-sm text-slate-500">
                  Showing <span className="font-medium text-slate-700">{(page - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium text-slate-700">{Math.min(page * pageSize, total)}</span> of{' '}
                  <span className="font-medium text-slate-700">{total}</span>
                </div>
                <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
                  <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <div className="px-3 text-sm text-slate-500">Page {page} of {totalPages}</div>
                <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <CreateMaintenanceModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultAssetId={assetIdFilter ?? undefined}
      />
    </div>
  )
}

