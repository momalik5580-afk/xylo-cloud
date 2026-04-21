"use client"

import { useEffect, useRef, useCallback, useState } from "react"

// ─── Event Types ──────────────────────────────────────────────────────────────

export type RealtimeEventType =
  | "connected"
  | "ping"
  | "notification"
  | "channel_message"
  | "room_status"
  | "task_update"
  | "vip_alert"

export interface RealtimeEvent<T = Record<string, unknown>> {
  type: RealtimeEventType
  payload: T
}

export interface NotificationPayload {
  id: string
  title: string
  message: string
  type: "INFO" | "WARNING" | "ERROR" | "SUCCESS"
  userId: string
  createdAt: string
}

export interface ChannelMessagePayload {
  id: string
  senderName: string
  senderDept: string
  content: string
  type: "message" | "request" | "urgent" | "broadcast"
  targetDept?: string
}

export interface RoomStatusPayload {
  roomNumber: string
  oldStatus: string
  newStatus: string
  updatedBy: string
}

export interface TaskUpdatePayload {
  taskId: string
  title: string
  status: string
  priority: string
  dept: string
  assignedTo: string
}

export interface VIPAlertPayload {
  guestName: string
  tier: string
  roomNumber: string
  alertType: "arrival" | "departure" | "request" | "escalation"
  message: string
}

// ─── Connection States ────────────────────────────────────────────────────────

export type ConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected"

// ─── Hook Options ─────────────────────────────────────────────────────────────

interface UseRealtimeOptions {
  userId: string
  enabled?: boolean
  reconnectDelay?: number
  maxReconnectAttempts?: number
  onNotification?: (payload: NotificationPayload) => void
  onChannelMessage?: (payload: ChannelMessagePayload) => void
  onRoomStatus?: (payload: RoomStatusPayload) => void
  onTaskUpdate?: (payload: TaskUpdatePayload) => void
  onVIPAlert?: (payload: VIPAlertPayload) => void
  onConnected?: () => void
  onDisconnected?: () => void
}

// ─── Main Hook ────────────────────────────────────────────────────────────────

export function useRealtime({
  userId,
  enabled = true,
  reconnectDelay = 3000,
  maxReconnectAttempts = 10,
  onNotification,
  onChannelMessage,
  onRoomStatus,
  onTaskUpdate,
  onVIPAlert,
  onConnected,
  onDisconnected,
}: UseRealtimeOptions) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected")
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (!userId || !enabled || !mountedRef.current) return

    cleanup()
    setConnectionState("connecting")

    const url = `/api/sse?userId=${encodeURIComponent(userId)}`
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onopen = () => {
      if (!mountedRef.current) return
      setConnectionState("connected")
      setReconnectAttempts(0)
      onConnected?.()
    }

    es.onmessage = (event) => {
      if (!mountedRef.current) return

      try {
        const parsed: RealtimeEvent = JSON.parse(event.data)
        setLastEvent(parsed)

        switch (parsed.type) {
          case "ping":
            // Heartbeat — connection alive, no action needed
            break

          case "connected":
            setConnectionState("connected")
            break

          case "notification":
            onNotification?.(parsed.payload as unknown as NotificationPayload)
            break

          case "channel_message":
            onChannelMessage?.(parsed.payload as unknown as ChannelMessagePayload)
            break

          case "room_status":
            onRoomStatus?.(parsed.payload as unknown as RoomStatusPayload)
            break

          case "task_update":
            onTaskUpdate?.(parsed.payload as unknown as TaskUpdatePayload)
            break

          case "vip_alert":
            onVIPAlert?.(parsed.payload as unknown as VIPAlertPayload)
            break
        }
      } catch {
        // Malformed event — ignore
      }
    }

    es.onerror = () => {
      if (!mountedRef.current) return
      es.close()
      eventSourceRef.current = null
      setConnectionState("reconnecting")
      onDisconnected?.()

      setReconnectAttempts((prev) => {
        const next = prev + 1
        if (next >= maxReconnectAttempts) {
          setConnectionState("disconnected")
          return prev
        }

        // Exponential backoff: 3s, 6s, 12s... capped at 30s
        const delay = Math.min(reconnectDelay * Math.pow(1.5, next - 1), 30000)
        reconnectTimerRef.current = setTimeout(() => {
          if (mountedRef.current) connect()
        }, delay)

        return next
      })
    }
  }, [
    userId, enabled, reconnectDelay, maxReconnectAttempts,
    onNotification, onChannelMessage, onRoomStatus,
    onTaskUpdate, onVIPAlert, onConnected, onDisconnected, cleanup,
  ])

  useEffect(() => {
    mountedRef.current = true
    if (userId && enabled) connect()

    return () => {
      mountedRef.current = false
      cleanup()
    }
  }, [userId, enabled])

  const reconnect = useCallback(() => {
    setReconnectAttempts(0)
    connect()
  }, [connect])

  return {
    connectionState,
    isConnected: connectionState === "connected",
    lastEvent,
    reconnectAttempts,
    reconnect,
  }
}

// ─── Connection Status Indicator (optional UI component) ─────────────────────

export function useConnectionStatus(userId: string) {
  const { connectionState, isConnected, reconnectAttempts, reconnect } = useRealtime({ userId })

  return {
    connectionState,
    isConnected,
    reconnectAttempts,
    reconnect,
    statusLabel:
      connectionState === "connected"    ? "Live"
      : connectionState === "connecting"   ? "Connecting..."
      : connectionState === "reconnecting" ? `Reconnecting (${reconnectAttempts})...`
      : "Disconnected",
    statusColor:
      connectionState === "connected"    ? "text-emerald-400"
      : connectionState === "connecting"   ? "text-blue-400"
      : connectionState === "reconnecting" ? "text-amber-400"
      : "text-red-400",
    dotColor:
      connectionState === "connected"    ? "bg-emerald-400 animate-pulse"
      : connectionState === "connecting"   ? "bg-blue-400 animate-pulse"
      : connectionState === "reconnecting" ? "bg-amber-400 animate-pulse"
      : "bg-red-400",
  }
}