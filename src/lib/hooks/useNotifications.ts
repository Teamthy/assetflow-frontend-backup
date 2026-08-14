import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '@/lib/api/notifications'
import { toast } from 'sonner'
import type { Notification, PaginatedResponse } from '@/types'

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...notificationKeys.lists(), params] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
}

interface ApiErrorResponse {
  response?: { data?: { message?: string } }
  message?: string
}

function getErrorMessage(err: unknown, fallback: string): string {
  const e = err as ApiErrorResponse
  return e?.response?.data?.message ?? e?.message ?? fallback
}

export function useNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean }) {
  return useQuery<PaginatedResponse<Notification>>({
    queryKey: notificationKeys.list(params ?? {}),
    queryFn: async () => {
      const result = await notificationApi.list(params)
      if (Array.isArray(result)) {
        return { data: result as Notification[], pagination: { total: result.length, page: 1, limit: result.length, totalPages: 1 } }
      }
      if (result && typeof result === 'object' && 'items' in result) {
        const typedResult = result as { items?: Notification[]; pagination?: Partial<PaginatedResponse<Notification>['pagination']> }
        return {
          data: typedResult.items ?? [],
          pagination: {
            total: typedResult.pagination?.total ?? (typedResult.items?.length ?? 0),
            page: typedResult.pagination?.page ?? 1,
            limit: typedResult.pagination?.limit ?? (typedResult.items?.length ?? 0),
            totalPages: typedResult.pagination?.totalPages ?? 1,
          },
        } satisfies PaginatedResponse<Notification>
      }
      if (result && typeof result === 'object' && 'data' in result) {
        const data = result as { data?: unknown; pagination?: Partial<PaginatedResponse<Notification>['pagination']> }
        const items = Array.isArray(data.data) ? (data.data as Notification[]) : []
        return {
          data: items,
          pagination: {
            total: data.pagination?.total ?? items.length,
            page: data.pagination?.page ?? 1,
            limit: data.pagination?.limit ?? items.length,
            totalPages: data.pagination?.totalPages ?? 1,
          },
        } satisfies PaginatedResponse<Notification>
      }
      return { data: [], pagination: { total: 0, page: 1, limit: 0, totalPages: 1 } }
    },
  })
}

function unreadCountFrom(result: unknown): number {
  let current: unknown = result
  for (let i = 0; i < 3; i += 1) {
    if (!current || typeof current !== 'object') return 0
    const record = current as {
      pagination?: { unreadCount?: number; total?: number }
      unreadCount?: number
      data?: unknown
      items?: Notification[]
    }
    if (typeof record.unreadCount === 'number') return record.unreadCount
    if (typeof record.pagination?.unreadCount === 'number') return record.pagination.unreadCount
    if (Array.isArray(record.items)) return record.items.filter((item) => !item.isRead).length
    if (Array.isArray(record.data)) return (record.data as Notification[]).filter((item) => !item.isRead).length
    if (record.data && typeof record.data === 'object') {
      current = record.data
      continue
    }
    if (typeof record.pagination?.total === 'number') return record.pagination.total
    return 0
  }
  return 0
}

export function useUnreadNotifications() {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: async () => {
      const result = await notificationApi.list({ unreadOnly: true, limit: 20 })
      return { count: unreadCountFrom(result) }
    },
    refetchInterval: 60000,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all })
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to mark as read')),
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all })
      toast.success('All notifications marked as read')
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to mark all as read')),
  })
}
