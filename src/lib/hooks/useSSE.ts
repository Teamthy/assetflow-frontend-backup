"use client"

import { useEffect, useRef, useCallback } from "react"
import { useAuthStore } from "@/lib/stores/auth"
import { useNotificationStore } from "@/lib/stores/notifications"
import type { AppNotification } from "@/lib/stores/notifications"
import { toast } from "sonner"

export function useSSE() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { setUnreadCount, addNotification } = useNotificationStore()
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const isUnmountedRef = useRef(false)

  const connect = useCallback(() => {
    if (!isAuthenticated || !accessToken || isUnmountedRef.current) return

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"

    // Pass token as query param since EventSource does not support headers
    const url = `${baseUrl}/notifications/stream?token=${encodeURIComponent(accessToken)}`
    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.addEventListener("connected", () => {
      reconnectAttemptsRef.current = 0
    })

    eventSource.addEventListener("unread_count", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as { count: number }
        setUnreadCount(data.count)
      } catch {
        // ignore malformed event
      }
    })

    eventSource.addEventListener("new_notification", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as {
          notification: AppNotification
          unreadCount: number
        }
        addNotification(data.notification)
        setUnreadCount(data.unreadCount)
        toast(data.notification.title, {
          description: data.notification.message,
          duration: 5000,
        })
      } catch {
        // ignore malformed event
      }
    })

    eventSource.onerror = () => {
      eventSource.close()
      if (isUnmountedRef.current) return

      const delay = Math.min(
        1000 * Math.pow(2, reconnectAttemptsRef.current),
        30_000,
      )
      reconnectAttemptsRef.current += 1

      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isUnmountedRef.current) connect()
      }, delay)
    }
  }, [isAuthenticated, accessToken, setUnreadCount, addNotification])

  useEffect(() => {
    isUnmountedRef.current = false
    connect()
    return () => {
      isUnmountedRef.current = true
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect])
}
