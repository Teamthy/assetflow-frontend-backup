import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '@/lib/api/notifications'
import { toast } from 'sonner'

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
  return useQuery({
    queryKey: notificationKeys.list(params ?? {}),
    queryFn: async () => {
      const result = await notificationApi.list(params)
      if (Array.isArray(result)) {
        return { items: result, pagination: { total: result.length } }
      }
      if (result && typeof result === 'object' && 'items' in result) {
        return result
      }
      if (result && typeof result === 'object' && 'data' in result) {
        const data = result as { data?: unknown }
        return {
          items: Array.isArray(data.data) ? data.data : [],
          pagination: { total: Array.isArray(data.data) ? data.data.length : 0 },
        }
      }
      return { items: [], pagination: { total: 0 } }
    },
  })
}

export function useUnreadNotifications() {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: () => notificationApi.list({ unreadOnly: true, limit: 20 }),
    refetchInterval: 60000, // poll every minute
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
