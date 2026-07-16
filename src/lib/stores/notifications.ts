import { create } from "zustand"

export interface AppNotification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
  redirectUrl?: string
}

interface NotificationState {
  unreadCount: number
  recentNotifications: AppNotification[]
  setUnreadCount: (count: number) => void
  addNotification: (notification: AppNotification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  setRecentNotifications: (notifications: AppNotification[]) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  recentNotifications: [],

  setUnreadCount: (count) => set({ unreadCount: count }),

  addNotification: (notification) =>
    set((state) => ({
      recentNotifications: [notification, ...state.recentNotifications].slice(0, 50),
    })),

  markAsRead: (id) =>
    set((state) => ({
      recentNotifications: state.recentNotifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      recentNotifications: state.recentNotifications.map((n) => ({
        ...n,
        isRead: true,
      })),
      unreadCount: 0,
    })),

  setRecentNotifications: (notifications) =>
    set({ recentNotifications: notifications }),
}))
