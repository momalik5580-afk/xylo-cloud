"use client"

import { useEffect, useRef } from "react"
import { useSmartInterval } from "@/hooks/use-smart-interval"
import { toast } from "react-hot-toast"
import { Info, AlertTriangle, XCircle, CheckCircle } from "lucide-react"

interface NotificationToastProps {
  userId: string
}

const icons = {
  INFO: Info,
  WARNING: AlertTriangle,
  ERROR: XCircle,
  SUCCESS: CheckCircle,
}

export function NotificationToast({ userId }: NotificationToastProps) {
  const lastNotificationIdRef = useRef<string | null>(null)

  const checkNewNotifications = async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/notifications?userId=${userId}&unread=true`)
      if (!res.ok) return

      const data = await res.json()
      if (data.notifications?.length > 0) {
        const latest = data.notifications[0]
        if (lastNotificationIdRef.current !== latest.id) {
          const Icon = icons[latest.type as keyof typeof icons] || Info
          toast.custom(
            (t) => (
              <div
                className={`${
                  t.visible ? "animate-enter" : "animate-leave"
                } max-w-md w-full bg-slate-900 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-slate-800`}
              >
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <Icon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3 w-0 flex-1">
                      <p className="text-sm font-medium text-[#8E939D]">{latest.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{latest.message}</p>
                    </div>
                  </div>
                </div>
              </div>
            ),
            { duration: 5000 }
          )
          lastNotificationIdRef.current = latest.id
        }
      }
    } catch (error) {
      console.error("Error checking notifications:", error)
    }
  }

  // Check immediately on mount
  useEffect(() => {
    checkNewNotifications()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Poll every 30s — pauses automatically when tab is hidden
  useSmartInterval(checkNewNotifications, userId ? 30000 : 0)

  return null
}
