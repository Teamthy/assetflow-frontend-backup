'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell, CheckCheck, Package, Wrench, ArrowLeftRight,
  TrendingDown, ShieldCheck, Building2, UserPlus, AlertTriangle,
  Loader2, Check, Filter,
} from 'lucide-react'

import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/lib/hooks/useNotifications'
import { formatTimeAgo, formatDateTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types'

const typeIconMap: Record<string, { icon: React.ElementType; bg: string; color: string; label: string }> = {
  asset_assigned: { icon: Package, bg: 'bg-blue-50', color: 'text-blue-600', label: 'Asset assigned' },
  asset_transferred: { icon: ArrowLeftRight, bg: 'bg-purple-50', color: 'text-purple-600', label: 'Asset transferred' },
  asset_disposed: { icon: TrendingDown, bg: 'bg-red-50', color: 'text-red-600', label: 'Asset disposed' },
  asset_deleted: { icon: TrendingDown, bg: 'bg-red-50', color: 'text-red-600', label: 'Asset deleted' },
  asset_restored: { icon: Package, bg: 'bg-emerald-50', color: 'text-emerald-600', label: 'Asset restored' },
  maintenance_assigned: { icon: Wrench, bg: 'bg-amber-50', color: 'text-amber-600', label: 'Maintenance assigned' },
  maintenance_due: { icon: Wrench, bg: 'bg-amber-50', color: 'text-amber-600', label: 'Maintenance due' },
  maintenance_overdue: { icon: AlertTriangle, bg: 'bg-red-50', color: 'text-red-600', label: 'Maintenance overdue' },
  depreciation_recorded: { icon: TrendingDown, bg: 'bg-purple-50', color: 'text-purple-600', label: 'Depreciation' },
  warranty_expiring: { icon: ShieldCheck, bg: 'bg-amber-50', color: 'text-amber-600', label: 'Warranty' },
  branch_created: { icon: Building2, bg: 'bg-purple-50', color: 'text-purple-600', label: 'Branch' },
  branch_updated: { icon: Building2, bg: 'bg-purple-50', color: 'text-purple-600', label: 'Branch' },
  invite: { icon: UserPlus, bg: 'bg-blue-50', color: 'text-blue-600', label: 'Invitation' },
  system: { icon: AlertTriangle, bg: 'bg-slate-100', color: 'text-slate-600', label: 'System' },
}

function getTypeConfig(type: string) {
  return typeIconMap[type] ?? { icon: Bell, bg: 'bg-slate-100', color: 'text-slate-500', label: 'Notification' }
}

export default function NotificationsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useNotifications({
    page,
    limit: 50,
    unreadOnly: filter === 'unread',
  })
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const notifications: Notification[] = Array.isArray(data?.items)
    ? (data.items as Notification[])
    : (Array.isArray(data?.data) ? (data.data as Notification[]) : [])
  const total = data?.pagination?.total ?? notifications.length
  const unreadCount = notifications.filter((n) => !n.isRead).length

  async function handleClick(notification: Notification) {
    if (!notification.isRead) {
      await markRead.mutateAsync(notification.id)
    }
    if (notification.redirectUrl) {
      router.push(notification.redirectUrl)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Notifications"
        description={total > 0 ? total + ' notifications' : 'Your notification history'}
        actions={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              {markAllRead.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCheck className="w-4 h-4" />
                  Mark all as read
                </>
              )}
            </Button>
          ) : undefined
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500">Show</span>
          <Select value={filter} onValueChange={(v) => { setFilter(v as 'all' | 'unread'); setPage(1) }}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All notifications</SelectItem>
              <SelectItem value="unread">Unread only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            description={
              filter === 'unread'
                ? 'You are all caught up. Any new notifications will appear here.'
                : 'Notifications about your assets, tasks, and organization events will appear here.'
            }
            action={
              filter === 'unread' ? (
                <Button variant="outline" onClick={() => setFilter('all')}>
                  View all notifications
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => {
              const config = getTypeConfig(notification.type)
              const Icon = config.icon
              const isUnread = !notification.isRead

              return (
                <button
                  key={notification.id}
                  onClick={() => handleClick(notification)}
                  className={cn(
                    'w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors relative group',
                    isUnread && 'bg-blue-50/30'
                  )}
                >
                  {isUnread && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}
                  <div className="flex items-start gap-4">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', config.bg)}>
                      <Icon className={cn('w-5 h-5', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                              {config.label}
                            </span>
                            {isUnread && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                                New
                              </span>
                            )}
                          </div>
                          <div className={cn(
                            'text-sm leading-snug',
                            isUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
                          )}>
                            {notification.title}
                          </div>
                          {notification.message && (
                            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{notification.message}</p>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex-shrink-0" title={formatDateTime(notification.createdAt)}>
                          {formatTimeAgo(notification.createdAt)}
                        </div>
                      </div>
                    </div>
                    {isUnread && (
                      <Check className="w-4 h-4 text-slate-300 group-hover:text-blue-500 flex-shrink-0 mt-1 transition-colors" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

