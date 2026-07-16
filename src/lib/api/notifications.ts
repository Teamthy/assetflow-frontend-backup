import apiClient from './client'
import type { Notification, PaginatedResponse } from '@/types'

export interface NotificationListParams {
  page?: number
  limit?: number
  unreadOnly?: boolean
}

export const notificationApi = {
  list: (params?: NotificationListParams) =>
    apiClient.get<PaginatedResponse<Notification>>('\/notifications', { params }).then((r) => r.data),

  markRead: (id: string) =>
    apiClient.patch(`\/notifications\/${id}\/read`).then((r) => r.data),

  markAllRead: () =>
    apiClient.patch('\/notifications\/read-all').then((r) => r.data),
}
