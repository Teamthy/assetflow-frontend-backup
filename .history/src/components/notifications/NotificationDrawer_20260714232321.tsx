'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Bell, CheckCheck, Package, Wrench, ArrowLeftRight,
  TrendingDown, ShieldCheck, Building2, UserPlus, AlertTriangle, Loader2,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/lib/hooks/useNotifications'
import { formatTimeAgo } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types'

const typeIconMap: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  asset_assigned:        { icon: Package,      bg: 'bg-blue-50',    color: 'text-blue-600' },
  asset_transferred:     { icon: ArrowLeftRight, bg: 'bg-purple-50', color: 'text-purple-600' },
  asset_disposed:        { icon: TrendingDown, bg: 'bg-red-50',     color: 'text-red-600' },
  asset_deleted:         { icon: TrendingDown, bg: 'bg-red-50',     color: 'text-red-600' },
  asset_restored:        { icon: Package,      bg: 'bg-emerald-50', color: 'text-emerald-600' },
  maintenance_assigned:  { icon: Wrench,       bg: 'bg-amber-50',   color: 'text-amber-600' },
  maintenance_due:       { icon: Wrench,       bg: 'bg-amber-50',   color: 'text-amber-600' },
  maintenance_overdue:   { icon: AlertTriangle, bg: 'bg-red-50',    color: 'text-red-600' },
  depreciation_recorded: { icon: TrendingDown, bg: 'bg-purple-50',  color: 'text-purple-600' },
  warranty_expiring:     { icon: ShieldCheck,  bg: 'bg-amber-50',   color: 'text-amber-600' },
  branch_created:        { icon: Building2,    bg: 'bg-purple-50',  color: 'text-purple-600' },
  branch_updated:        { icon: Building2,    bg: 'bg-purple-50',  color: 'text-purple-600' },
  invite:                { icon: UserPlus,     bg: 'bg-blue-50',    color: 'text-blue-600' },
}

function getTypeIcon(type: string) {
  return typeIconMap[type] ?? { icon: Bell, bg: 'bg-slate-100', color: 'text-slate-500' }
}

export function NotificationDrawer() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useNotifications({ limit: 20 })
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const notifications: Notification[] = Array.isArray(data?.items)
    ? (data.items as Notification[])
    : (Array.isArray(data?.data) ? (data.data as Notification[]) : [])
  const unreadCount = Array.isArray(notifications) ? notifications.filter((n) => !n.isRead).length : 0

  async function handleClick(notification: Notification) {
    if (!notification.isRead) {
      await markRead.mutateAsync(notification.id).catch(() => null)
    }
    if (notification.redirectUrl) {
      router.push(notification.redirectUrl)
      setOpen(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-semibold text-slate-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-brand-50 text-brand-700 rounded-full border border-brand-100">
                  {unreadCount} new
                </span>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="text-xs text-slate-500 hover:text-slate-700 gap-1.5"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description="You're all caught up. Notifications will appear here."
            />
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map((n) => {
                const { icon: Icon, bg, color } = getTypeIcon(n.type)
                const isUnread = !n.isRead
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={cn(
                      'w-full text-left px-6 py-4 hover:bg-slate-50/80 transition-colors flex items-start gap-3',
                      isUnread && 'bg-brand-50/30'
                    )}
                  >
                    <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-sm leading-snug', isUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700')}>
                          {n.title}
                        </p>
                        {isUnread && <div className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatTimeAgo(n.createdAt)}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block text-center text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            View all notifications
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}

