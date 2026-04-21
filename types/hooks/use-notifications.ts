"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRealtime, NotificationPayload } from "./use-realtime"

export interface Notification {
  id: string
  title: string
  message: string
  type: "INFO" | "WARNING" | "ERROR" | "SUCCESS"
  read: boolean
  createdAt: string
}

interface UseNotificationsProps {
  userId: string
  pollingInterval?: number
}

export function useNotifications({
  userId,
  pollingInterval = 60000, // fallback polling every 60s (SSE handles real-time)
}: UseNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [sseConnected, setSseConnected] = useState(false)
  const hasFetchedRef = useRef(false)

  // ── Fetch from REST API ─────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (silent = false) => {
    if (!userId) return
    if (!silent) setLoading(true)
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`)
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error("Notifications fetch error:", error)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [userId])

  // ── SSE real-time updates ───────────────────────────────────────────────────
  const { isConnected } = useRealtime({
    userId,
    enabled: !!userId,
    onConnected: () => {
      setSseConnected(true)
      if (hasFetchedRef.current) fetchNotifications(true)
    },
    onDisconnected: () => setSseConnected(false),
    onNotification: (payload: NotificationPayload) => {
      const newNotif: Notification = {
        id: payload.id,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        read: false,
        createdAt: payload.createdAt,
      }
      setNotifications((prev) => {
        if (prev.some((n) => n.id === newNotif.id)) return prev
        return [newNotif, ...prev]
      })
      setUnreadCount((prev) => prev + 1)
    },
  })

  // ── Initial fetch ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (userId) {
      fetchNotifications()
      hasFetchedRef.current = true
    }
  }, [userId, fetchNotifications])

  // ── Fallback polling when SSE is disconnected ───────────────────────────────
  useEffect(() => {
    if (sseConnected || !userId) return
    const interval = setInterval(() => fetchNotifications(true), pollingInterval)
    return () => clearInterval(interval)
  }, [sseConnected, userId, pollingInterval, fetchNotifications])

  // ── Mark single as read ─────────────────────────────────────────────────────
  const markAsRead = useCallback(async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notificationId }),
      })
    } catch {
      fetchNotifications(true)
    }
  }, [fetchNotifications])

  // ── Mark all as read ────────────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true, userId }),
      })
    } catch {
      fetchNotifications(true)
    }
  }, [userId, fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    sseConnected,
    markAsRead,
    markAllAsRead,
    refresh: () => fetchNotifications(false),
  }
}